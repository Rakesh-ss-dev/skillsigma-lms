from rest_framework import viewsets, status,permissions
from .models import Course, Lesson, Category,LessonProgress
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer,LessonProgressSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import User
from enrollments.models import Enrollment
from quizzes.models import Submission
from django.db.models import Prefetch
from utils.drive_service import check_video_processing_status
from django.http import StreamingHttpResponse, HttpResponse, Http404
from rest_framework.views import APIView
from rest_framework import permissions
from utils.drive_service import stream_video_from_drive
from .auth import QueryStringJWTAuthentication
import re

class CategoryViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrInstructor]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # --- 1. Your Existing Filtering Logic ---
        # (Added is_authenticated check to prevent errors if an anonymous user hits this endpoint)
        if user.is_authenticated and getattr(user, 'role', None) == "instructor":
            queryset = queryset.filter(instructors=user)

        instructor_id = self.request.query_params.get("instructor_id")
        if instructor_id:
            try:
                queryset = queryset.filter(instructors__id=int(instructor_id))
            except ValueError:
                pass 

        # --- 2. New Optimization Logic ---
        # Always prefetch the course structure (lessons and quizzes)
        queryset = queryset.prefetch_related('lessons', 'quizzes')

        # Only prefetch progress/submissions if the user is logged in
        if user.is_authenticated:
            queryset = queryset.prefetch_related(
                # Optimize Lesson Progress
                Prefetch(
                    'lessons__progress',
                    queryset=LessonProgress.objects.filter(student=user),
                    to_attr='user_progress'
                ),
                # Optimize Quiz Submissions
                Prefetch(
                    'quizzes__submissions', 
                    queryset=Submission.objects.filter(student=user),
                    to_attr='user_submissions'
                ),
                Prefetch(
                'enrollments',
                queryset=Enrollment.objects.filter(student=user),
                to_attr='current_user_enrollment'
                )
            )

        return queryset.distinct()

    def perform_create(self, serializer):
        course = serializer.save()
        if self.request.user.role == "instructor":
            course.instructors.set([self.request.user])

    def perform_update(self, serializer):
        course = serializer.save()
        if self.request.user.role == "instructor":
            course.instructors.add(self.request.user)

    @action(detail=True, methods=['post'])
    def add_instructor(self, request, pk=None):
        course = self.get_object()
        instructor_id = request.data.get('instructor_id')
        if not instructor_id:
            return Response({"error": "instructor_id is required"}, status=400)
        target_instructor = get_object_or_404(User, pk=instructor_id)
        course.instructors.add(target_instructor)
        return Response({"message": f"Instructor {target_instructor.username} added"}, status=200)

    @action(detail=True, methods=['post'])
    def remove_instructor(self, request, pk=None):
        course = self.get_object()
        instructor_id = request.data.get('instructor_id')
        if not instructor_id:
            return Response({"error": "instructor_id is required"}, status=400)
        target_instructor = get_object_or_404(User, pk=instructor_id)
        
        if course.instructors.count() <= 1 and course.instructors.filter(id=target_instructor.id).exists():
            return Response({"error": "Cannot remove the last instructor."}, status=400)
        
        course.instructors.remove(target_instructor)
        return Response({"message": f"Instructor {target_instructor.username} removed"}, status=200)


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        course_id = self.kwargs.get('course_pk')
        user = self.request.user
        qs = Lesson.objects.all()
        if course_id:
            qs = qs.filter(course_id=course_id)
        qs = qs.select_related('prerequisite_quiz').order_by('order')
        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch(
                    'progress',
                    queryset=LessonProgress.objects.filter(student=user),
                    to_attr='user_progress'
                )
            )
        return qs

    def get_serializer_context(self):
        # ... (Your existing context logic remains exactly the same) ...
        context = super().get_serializer_context()
        course_id = self.kwargs.get('course_pk')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            context['course'] = course
        return context

    # --- NEW: Override Retrieve to handle Video Status ---
    def retrieve(self, request, *args, **kwargs):
        """
        Custom retrieve to check Video Processing status on the fly.
        """
        instance = self.get_object()
        if instance.video_url and not instance.is_processed:
            try:
                file_id = instance.video_url.split('/d/')[1].split('/')[0]
                status_google = check_video_processing_status(file_id)
                if status_google == 'READY':
                    instance.is_processed = True
                    instance.save(update_fields=['is_processed'])

            except Exception as e:
                print(f"Error auto-checking video status: {e}")

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def check_access(self, request, pk=None, course_pk=None):
        lesson = self.get_object()
        if not lesson.prerequisite_quiz:
            return Response({"allowed": True})
        passed = Submission.objects.filter(
            student=request.user,
            quiz=lesson.prerequisite_quiz,
            score__gte=lesson.prerequisite_score
        ).exists()
        if passed:
             return Response({"allowed": True})
        return Response({
             "allowed": False, 
             "reason": f"Locked. You must pass '{lesson.prerequisite_quiz.title}' with {lesson.prerequisite_score}% score."
        }, status=status.HTTP_403_FORBIDDEN)

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'check_access']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminOrInstructor] # Ensure this permission class is imported
        return [permission() for permission in permission_classes]
        
class LessonProgressViewSet(viewsets.ModelViewSet):
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Ensure users only see their own progress.
        """
        return LessonProgress.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        """
        Explicitly assign the student when saving via POST,
        though our serializer create() method handles the heavy lifting above.
        """
        serializer.save(student=self.request.user)
        
class LessonVideoStreamView(APIView):
    """
    Proxies the video stream from Google Drive to the user.
    Hides the real Drive URL and enforces Django permissions.
    """
    # Only logged-in users can hit this endpoint
    authentication_classes = [QueryStringJWTAuthentication] 
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, lesson_id):
        # 1. Fetch Lesson Object
        # We use get_object_or_404 for cleaner error handling
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # 2. (Optional) Custom Permission Check
        # Example: Check if student is enrolled in the course
        # if not request.user.courses_enrolled.filter(id=lesson.course.id).exists():
        #     return HttpResponse("Unauthorized: You do not own this course.", status=403)

        # 3. Check if video exists
        if not lesson.video_url:
            return HttpResponse("No video available for this lesson.", status=404)

        # 4. Extract the Google Drive File ID
        # You store the full URL (e.g., https://drive.google.com/file/d/123XYZ/preview)
        # We need to extract just "123XYZ"
        match = re.search(r'/d/([a-zA-Z0-9_-]+)', lesson.video_url)
        if match:
            file_id = match.group(1)
        else:
            # Fallback: if you stored just the ID by mistake, use it directly
            if 'http' not in lesson.video_url:
                file_id = lesson.video_url
            else:
                return HttpResponse("Invalid Video URL format in database.", status=500)

        # 5. Handle "Range" Header (Crucial for video seeking/scrubbing)
        range_header = request.headers.get('Range', None)

        try:
            # 6. Get Stream from Drive
            google_response = stream_video_from_drive(file_id, range_header)

            # Check for upstream errors (e.g. file deleted on Drive)
            if google_response.status_code >= 400:
                return HttpResponse(
                    f"Upstream Error from Drive: {google_response.status_code}", 
                    status=google_response.status_code
                )

            # 7. Stream it back to the user
            response = StreamingHttpResponse(
                google_response.iter_content(chunk_size=8192), # 8KB chunks
                status=google_response.status_code,
                content_type=google_response.headers.get('Content-Type', 'video/mp4')
            )
            
            # 8. Pass forward critical headers for the video player
            for header in ['Content-Length', 'Content-Range', 'Accept-Ranges']:
                if header in google_response.headers:
                    response[header] = google_response.headers[header]
            
            return response

        except Exception as e:
            print(f"Streaming Error: {e}")
            return HttpResponse("Internal Server Error while streaming.", status=500)
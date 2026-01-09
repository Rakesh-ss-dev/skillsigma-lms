from rest_framework import viewsets, status,permissions
from .models import Course, Lesson, Category,LessonProgress
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer,LessonProgressSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import User
from quizzes.models import Submission
from django.db.models import Prefetch

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
        if self.request.user.role == "instructor":
            queryset = queryset.filter(instructors=self.request.user)

        instructor_id = self.request.query_params.get("instructor_id")
        if instructor_id:
            try:
                queryset = queryset.filter(instructors__id=int(instructor_id))
            except ValueError:
                pass 
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
    # Base queryset for Router compatibility
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    
    # ⚠️ CHECK THIS: If students view this, 'IsAdminOrInstructor' will block them.
    # Consider: permissions.IsAuthenticated or a custom IsEnrolled permission
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        course_id = self.kwargs.get('course_pk')
        user = self.request.user
        
        # 1. Start with base queryset
        qs = Lesson.objects.all()

        # 2. Filter by Course
        if course_id:
            qs = qs.filter(course_id=course_id)

        # 3. Optimize: Fetch Quiz data AND Student Progress in one go
        # 'select_related' follows ForeignKey (Prerequisite Quiz)
        # 'prefetch_related' follows Reverse FK (Lesson Progress)
        qs = qs.select_related('prerequisite_quiz').order_by('order')

        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch(
                    'progress',  # Must match related_name in LessonProgress model
                    queryset=LessonProgress.objects.filter(student=user),
                    to_attr='user_progress' # Stores result in 'user_progress' attr
                )
            )
            
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        course_id = self.kwargs.get('course_pk')
        if course_id:
            # We use filter().first() instead of get_object_or_404 here
            # to avoid crashing list views if the course ID is slightly off, 
            # though get_object_or_404 is also fine.
            course = get_object_or_404(Course, id=course_id)
            context['course'] = course
        return context

    @action(detail=True, methods=['get'])
    def check_access(self, request, pk=None, course_pk=None):
        """
        Check if the student meets the prerequisites for this lesson.
        """
        lesson = self.get_object()
        
        # If no prerequisite, access is allowed
        if not lesson.prerequisite_quiz:
            return Response({"allowed": True})

        # Check if student passed the required quiz
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
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        # 1. READ-ONLY actions: List, Retrieve (Single Lesson), and Check Access
        # These are safe for any logged-in user (Student or Instructor)
        if self.action in ['list', 'retrieve', 'check_access']:
            permission_classes = [permissions.IsAuthenticated]
        
        # 2. WRITE actions: Create, Update, Partial Update, Delete
        # These are restricted to Admin or Instructor only
        else:
            permission_classes = [IsAdminOrInstructor]
            
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
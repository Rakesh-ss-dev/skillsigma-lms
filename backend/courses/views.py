from rest_framework import viewsets
from .models import Course, Lesson, Category
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer , InstructorActionSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import User
from rest_framework import status

class CategoryViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrInstructor]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        """
        Filters courses so instructors only see their own.
        This automatically secures the custom actions below: 
        get_object() calls this, so unauthorized courses return 404.
        """
        queryset = super().get_queryset()

        if self.request.user.role == "instructor":
            queryset = queryset.filter(instructors=self.request.user)

        instructor_id = self.request.query_params.get("instructor_id")
        if instructor_id:
            try:
                queryset = queryset.filter(instructors__id=int(instructor_id))
            except ValueError:
                raise ValidationError({"instructor_id": "Must be a valid integer"})

        return queryset.distinct()

    def perform_create(self, serializer):
        course = serializer.save()
        # If instructor → force assign only self
        if self.request.user.role == "instructor":
            course.instructors.set([self.request.user])

    def perform_update(self, serializer):
        course = serializer.save()
        # Instructor must always remain assigned during standard updates
        if self.request.user.role == "instructor":
            course.instructors.add(self.request.user)

    # --- CUSTOM ACTIONS ---

    @action(detail=True, methods=['post'])
    def add_instructor(self, request, pk=None):
        course = self.get_object() # Will 404 if instructor doesn't own course
        instructor_id = request.data.get('instructor_id')

        if not instructor_id:
            return Response(
                {"error": "instructor_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the user exists and is actually an instructor (optional check)
        target_instructor = get_object_or_404(User, pk=instructor_id)
        
        # Optional: Prevent adding non-instructors if your system requires it
        if hasattr(target_instructor, 'role') and target_instructor.role != 'instructor' and not target_instructor.is_staff:
             return Response({"error": "User is not an instructor"}, status=400)

        course.instructors.add(target_instructor)
        
        return Response(
            {"message": f"Instructor {target_instructor.username} added to course"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def remove_instructor(self, request, pk=None):
        course = self.get_object()
        instructor_id = request.data.get('instructor_id')

        if not instructor_id:
            return Response({"error": "instructor_id is required"}, status=400)

        target_instructor = get_object_or_404(User, pk=instructor_id)

        # --- SAFETY CHECK: Prevent Orphans ---
        # If the course only has 1 instructor, and we are trying to remove them, stop it.
        if course.instructors.count() <= 1 and course.instructors.filter(id=target_instructor.id).exists():
            return Response(
                {"error": "Cannot remove the last instructor. Delete the course instead."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove the user
        course.instructors.remove(target_instructor)
        
        return Response(
            {"message": f"Instructor {target_instructor.username} removed from course"},
            status=status.HTTP_200_OK
        )


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        course_id = self.kwargs.get('course_pk')
        if course_id:
            return Lesson.objects.filter(course_id=course_id)
        return Lesson.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        course_id = self.kwargs.get('course_pk')
        if course_id:
            # Change this line:
            course = get_object_or_404(Course, id=course_id)
            context['course'] = course
        return context
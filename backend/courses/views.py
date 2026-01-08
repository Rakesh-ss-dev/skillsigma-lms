from rest_framework import viewsets, status
from .models import Course, Lesson, Category
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.models import User
from quizzes.models import Submission

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
    # FIX: Added queryset here to prevent router basename error
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        course_id = self.kwargs.get('course_pk')
        qs = Lesson.objects.all()
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs.select_related('prerequisite_quiz')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        course_id = self.kwargs.get('course_pk')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            context['course'] = course
        return context

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
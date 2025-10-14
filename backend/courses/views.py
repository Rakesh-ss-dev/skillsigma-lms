from rest_framework import viewsets, permissions
from .models import Course, Lesson, Category
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin


class CategoryViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrInstructor]


class CourseViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def perform_create(self, serializer):
        # Set the logged-in instructor as course creator
        serializer.save(instructor=self.request.user)


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
            course = Course.objects.get(id=course_id)
            context['course'] = course
        return context
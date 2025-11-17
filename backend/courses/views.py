from rest_framework import viewsets
from .models import Course, Lesson, Category
from .serializers import CourseSerializer, LessonSerializer, CategorySerializer , InstructorActionSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework.decorators import action
from rest_framework.response import Response
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
        queryset = super().get_queryset() 
        instructor_id = self.request.query_params.get('instructor_id')
        if instructor_id:
            try:
                queryset = queryset.filter(instructors__id=int(instructor_id))
            except ValueError:
                raise ValidationError({'instructor_id': 'Instructor ID must be a valid integer.'})
        return queryset.distinct()


    @action(detail=True, methods=['post'], url_path='add-instructor')
    def add_instructor(self, request, pk=None):
        course = self.get_object()
        serializer = InstructorActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instructor = serializer.validated_data['instructor_id']
        if course.instructors.filter(id=instructor.id).exists():
            return Response(
                {"message": "Instructor is already assigned to this course."},
                status=status.HTTP_200_OK
            )
        course.instructors.add(instructor)
        return Response(
            {"message": f"Instructor '{instructor.username}' added successfully."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='remove-instructor')
    def remove_instructor(self, request, pk=None):
        course = self.get_object()
        serializer = InstructorActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instructor = serializer.validated_data['instructor_id']
        if not course.instructors.filter(id=instructor.id).exists():
            return Response(
                {"error": "This instructor is not assigned to this course."},
                status=status.HTTP_400_BAD_REQUEST
            )
        course.instructors.remove(instructor)
        return Response(
            {"message": f"Instructor '{instructor.username}' removed successfully."},
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
            course = Course.objects.get(id=course_id)
            context['course'] = course
        return context
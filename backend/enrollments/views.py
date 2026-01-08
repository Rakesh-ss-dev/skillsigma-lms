from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_tracking.mixins import LoggingMixin

from .models import Enrollment, GroupEnrollment
from .serializers import EnrollmentSerializer, GroupEnrollmentSerializer, GetUserEnrollmentSerializer
from accounts.permissions import IsAdminOrInstructor

class EnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    # Optimization: Pre-load student and course data to prevent N+1 queries
    queryset = Enrollment.objects.select_related('student', 'course').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def get_queryset(self):
        # We use self.queryset (which has select_related) as the base
        queryset = super().get_queryset()
        
        user = self.request.user
        if getattr(user, 'role', None) == 'student':
            return queryset.filter(student=user)
        
        return queryset

    def perform_create(self, serializer):
        # student should be explicitly assigned
        serializer.save()
        
    @action(detail=False, methods=['post'], url_path='get_user_enrollments')
    def get_user_enrollments(self, request):
        serializer = GetUserEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']

        # Use get_queryset() to ensure we get the select_related optimization
        enrollments = self.get_queryset().filter(student_id=user_id)
        
        # Serialization is now efficient (no extra DB hits for course/student details)
        data = EnrollmentSerializer(enrollments, many=True).data

        return Response(data, status=status.HTTP_200_OK)

class GroupEnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    # Optimization: Pre-load group and course
    queryset = GroupEnrollment.objects.select_related('group', 'course').all()
    serializer_class = GroupEnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only
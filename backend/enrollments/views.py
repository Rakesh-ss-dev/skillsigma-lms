from rest_framework import viewsets, permissions
from .models import Enrollment, GroupEnrollment
from .serializers import EnrollmentSerializer, GroupEnrollmentSerializer,GetUserEnrollmentSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class EnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def perform_create(self, serializer):
        # student should be explicitly assigned
        serializer.save()
        
    @action(detail=False, methods=['post'], url_path='get_user_enrollments')
    def get_user_enrollments(self, request):
        serializer = GetUserEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']

        # Fetch user enrollments
        enrollments = self.queryset.filter(student_id=user_id)
        data = EnrollmentSerializer(enrollments, many=True).data

        return Response(data, status=status.HTTP_200_OK)

class GroupEnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = GroupEnrollment.objects.all()
    serializer_class = GroupEnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

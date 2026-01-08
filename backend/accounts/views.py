from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_tracking.mixins import LoggingMixin
from django.db.models import Q

# Import Local Mixins & Models
from .mixins import SafeLoggingMixin
from .models import User, StudentGroup
from .permissions import IsAdminOrInstructor

# Import External Models (Safe if apps are loaded)
from courses.models import Course
from enrollments.models import GroupEnrollment

from .serializers import (
    AdminSerializer,
    UserSerializer,
    InstructorSerializer,
    StudentGroupSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    LogoutSerializer,
)

# -------------------------------
# Student User ViewSet
# -------------------------------
class UserViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.none()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        # Optimization: Fetch students for the instructor in a single query
        if self.request.user.role == "instructor":
            return User.objects.filter(
                role="student"
            ).filter(
                Q(created_by=self.request.user) |
                Q(enrollments__course__instructors=self.request.user)
            ).distinct()
            
        return User.objects.filter(role="student")
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.filter(role="instructor")
    serializer_class = InstructorSerializer
    permission_classes = [IsAdminOrInstructor]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminViewSet(SafeLoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.filter(role="admin")
    serializer_class = AdminSerializer
    permission_classes = [IsAdminOrInstructor]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    

# -------------------------------
# Student Group ViewSet
# -------------------------------
class StudentGroupViewSet(LoggingMixin, viewsets.ModelViewSet):
    # Optimization: Prefetch students to avoid N+1 in serializer list view
    queryset = StudentGroup.objects.prefetch_related('students').all()
    serializer_class = StudentGroupSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        # Optimization: Use relationship filtering instead of manual lists
        if self.request.user.role == "instructor":
            return StudentGroup.objects.filter(
                course_enrollments__course__instructors=self.request.user
            ).distinct().prefetch_related('students')
            
        return self.queryset

# -------------------------------
# User Registration View
# -------------------------------
class RegisterView(LoggingMixin, generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# -------------------------------
# Custom JWT Token View
# -------------------------------
class CustomTokenObtainPairView(LoggingMixin, TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# -------------------------------
# Change Password View
# -------------------------------
class ChangePassword(LoggingMixin, generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = [IsAuthenticated]

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check old password
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": "Wrong password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save new password
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"detail": "Password updated successfully"},
            status=status.HTTP_200_OK,
        )


# -------------------------------
# Logout View
# -------------------------------
class LogoutView(LoggingMixin, generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )
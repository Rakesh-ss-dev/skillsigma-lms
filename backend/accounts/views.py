from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_tracking.mixins import LoggingMixin
from .mixins import SafeLoggingMixin
from .models import User, StudentGroup
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
from .permissions import IsAdminOrInstructor


# -------------------------------
# Student User ViewSet
# -------------------------------
class UserViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.none()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        return User.objects.filter(role="student")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.none()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        return User.objects.filter(role="instructor")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminViewSet(SafeLoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.none()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminOrInstructor]

    def get_queryset(self):
        return User.objects.filter(role="admin")

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
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    permission_classes = [IsAdminOrInstructor]

    def perform_create(self, serializer):
        # Auto-assign instructor if request user is instructor
        if self.request.user.role == "instructor":
            serializer.save(instructor=self.request.user)
        else:
            serializer.save()


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

from rest_framework import viewsets
from .models import User, StudentGroup
from .serializers import (
    UserSerializer,
    StudentGroupSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdminOrInstructor
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
)
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_tracking.mixins import LoggingMixin
from rest_framework import generics, status
from rest_framework.response import Response

class UserViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only


class StudentGroupViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def perform_create(self, serializer):
        # Auto-assign instructor from request user if instructor
        serializer.save(instructor=self.request.user)


class RegisterView(LoggingMixin, generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(LoggingMixin, TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class ChangePassword(LoggingMixin, generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check old password
        if not check_password(serializer.validated_data["old_password"], user.password):
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
class LogoutView(LoggingMixin, generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT
        )

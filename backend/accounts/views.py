from rest_framework import viewsets, permissions
from .models import User, StudentGroup
from .serializers import UserSerializer, StudentGroupSerializer
from .permissions import IsAdminOrInstructor
from rest_framework import generics
from rest_framework.permissions import AllowAny,IsAuthenticated
from .serializers import RegisterSerializer,CustomTokenObtainPairSerializer,LogoutSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only


class StudentGroupViewSet(viewsets.ModelViewSet):
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def perform_create(self, serializer):
        # Auto-assign instructor from request user if instructor
        serializer.save(instructor=self.request.user)
        
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
from rest_framework import serializers
from .models import User, StudentGroup
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "avatar", "bio"]


class StudentGroupSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    students = UserSerializer(many=True, read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.filter(role="student"), write_only=True, source="students"
    )

    class Meta:
        model = StudentGroup
        fields = ["id", "name", "description", "instructor", "students", "student_ids", "created_at"]

    def create(self, validated_data):
        students = validated_data.pop("students", [])
        group = StudentGroup.objects.create(**validated_data)
        group.students.set(students)
        return group

    def update(self, instance, validated_data):
        students = validated_data.pop("students", None)
        instance = super().update(instance, validated_data)
        if students is not None:
            instance.students.set(students)
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
            role=validated_data.get("role", "student"),
        )
        return user
    
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
        })
        return data
    
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError:
            self.fail("bad_token")
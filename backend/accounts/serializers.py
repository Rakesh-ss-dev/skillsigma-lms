from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.hashers import make_password
from django.db import transaction

# Import models
from .models import User, StudentGroup
from courses.models import Course
from enrollments.models import Enrollment, GroupEnrollment

# ====================================
# Base User Serializer (Reusable)
# ====================================
class BaseUserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'username', 'password', 'role', 'phone', 'avatar_url'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_blank': True, 'allow_null': True},
            'username': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and hasattr(obj.avatar, "url") and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def to_internal_value(self, data):
        # Ignore empty or null passwords to prevent hashing empty strings
        if 'password' in data and (data['password'] in [None, '', 'null']):
            data.pop('password')
        return super().to_internal_value(data)

    def validate(self, attrs):
        # Require password only for new users
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required for new users."})

        # Auto-assign email as username if missing
        email = attrs.get("email")
        username = attrs.get("username")
        if not username and email:
            attrs["username"] = email

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        # Auto-fill username from email if missing
        if not validated_data.get("username") and validated_data.get("email"):
            validated_data["username"] = validated_data["email"]

        user = User(**validated_data)
        if password:
            user.password = make_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        # If email is provided and username missing, sync username
        email = validated_data.get("email")
        if email and not validated_data.get("username"):
            validated_data["username"] = email

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.password = make_password(password)
        instance.save()
        return instance


# ====================================
# Role-Based Serializers
# ====================================

class UserSerializer(BaseUserSerializer):
    role = serializers.CharField(default="student", read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'role'] 
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data, *args, **kwargs):
        validated_data['role'] = 'student'
        return super().create(validated_data, *args, **kwargs)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class InstructorSerializer(BaseUserSerializer):
    role = serializers.CharField(default="instructor", read_only=True)
    
    def create(self, validated_data, *args, **kwargs):
        validated_data["role"] = "instructor"
        return super().create(validated_data, *args, **kwargs)
    
    # CRITICAL FIX: Added 'instance' to arguments
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class AdminSerializer(BaseUserSerializer):
    role = serializers.CharField(default="admin", read_only=True)
    
    def create(self, validated_data, *args, **kwargs):
        validated_data["role"] = "admin"
        return super().create(validated_data, *args, **kwargs)


# ====================================
# Helper Serializers
# ====================================
class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone", "role"]


class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "description"]


class StudentInputSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True)


# ====================================
# Student Group Serializer
# ====================================
class StudentGroupSerializer(serializers.ModelSerializer):
    # For write
    students = StudentInputSerializer(many=True, write_only=True, required=False)
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), write_only=True, required=False
    )

    # For read
    students_info = SimpleUserSerializer(source="students", many=True, read_only=True)
    courses_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentGroup
        fields = [
            "id",
            "name",
            "description",
            "students",          # write-only
            "students_info",     # read-only
            "course",            # write-only
            "courses_info",      # read-only
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_courses_info(self, obj):
        """Get all linked courses via GroupEnrollment"""
        # Optimized lookup
        group_courses = Course.objects.filter(group_enrollments__group=obj)
        return SimpleCourseSerializer(group_courses, many=True).data

    def create(self, validated_data):
        students_data = validated_data.pop("students", [])
        course = validated_data.pop("course", None)

        with transaction.atomic():
            group = StudentGroup.objects.create(**validated_data)
            self._handle_students_and_course(group, students_data, course)
        return group

    def update(self, instance, validated_data):
        students_data = validated_data.pop("students", None)
        course = validated_data.pop("course", None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if students_data is not None:
                instance.students.clear()
                self._handle_students_and_course(instance, students_data, course)

            if course:
                GroupEnrollment.objects.get_or_create(group=instance, course=course)

        return instance

    def _handle_students_and_course(self, group, students_data, course):
        for student_data in students_data:
            email = student_data.get("email")
            phone = student_data.get("phone")

            if not email and not phone:
                continue

            email = email.lower().strip() if email else None
            phone = phone.strip() if phone else None
            
            user = None

            # 1. Try to find exact match by Email
            if email:
                user = User.objects.filter(email=email).first()
            
            # 2. If no user found by email, try phone
            if not user and phone:
                user = User.objects.filter(phone=phone).first()

            # Skip admins/instructors
            if user and user.role in ["admin", "instructor"]:
                continue

            if user:
                # UPDATE existing student
                updated = False
                if phone and user.phone != phone:
                    user.phone = phone
                    updated = True
                if student_data.get("first_name"):
                    user.first_name = student_data.get("first_name")
                    updated = True
                if student_data.get("last_name"):
                    user.last_name = student_data.get("last_name")
                    updated = True
                
                if updated:
                    user.save()

            else:
                # CREATE new student
                raw_password = student_data.get("password")
                if not raw_password:
                    raw_password = User.objects.make_random_password() 

                user = User.objects.create(
                    username=email or phone, 
                    email=email,
                    phone=phone,
                    password=make_password(raw_password),
                    first_name=student_data.get("first_name", ""),
                    last_name=student_data.get("last_name", ""),
                    role="student",
                )

            # Attach to group
            if user.role == "student":
                group.students.add(user)
                
                # Enroll in course
                if course:
                    Enrollment.objects.get_or_create(student=user, course=course)

        # Link Group to Course
        if course:
            GroupEnrollment.objects.get_or_create(group=group, course=course)


# ====================================
# Registration Serializer
# ====================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role", "first_name", "last_name")

    def create(self, validated_data):
        if not validated_data.get("username") and validated_data.get("email"):
            validated_data["username"] = validated_data["email"]

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
            role=validated_data.get("role", "student"),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", "")
        )
        return user


# ====================================
# JWT Token Serializer
# ====================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        token["email"] = user.email
        token["id"] = user.id
        token["first_name"] = user.first_name or None
        token["last_name"] = user.last_name or None
        token["phone"] = getattr(user, "phone", None)
        token["fullname"] = (
            f"{user.first_name.strip()} {user.last_name.strip()}"
            if user.first_name and user.last_name else None
        )
        token["avatar"] = user.avatar.url if user.avatar else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        request = self.context.get("request")

        data.update({
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "avatar": self.user.avatar.url if self.user.avatar else None,
            "avatar_url": (
                request.build_absolute_uri(self.user.avatar.url)
                if request and self.user.avatar else None
            ),
            "phone": getattr(self.user, "phone", None),
        })
        return data


# ====================================
# Change Password Serializer
# ====================================
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"error": "New passwords do not match"})
        return data


# ====================================
# Logout Serializer
# ====================================
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
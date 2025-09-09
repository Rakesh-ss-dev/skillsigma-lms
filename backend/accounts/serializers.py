from rest_framework import serializers
from .models import User, StudentGroup
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)  # writable
    avatar_url = serializers.SerializerMethodField()  # read-only

    class Meta:
        model = User
        fields = "__all__"

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and hasattr(obj.avatar, "url"):
            return request.build_absolute_uri(obj.avatar.url)
        return None


class StudentGroupSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    students = UserSerializer(many=True, read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(role="student"),
        write_only=True,
        source="students",
    )

    class Meta:
        model = StudentGroup
        fields = [
            "id",
            "name",
            "description",
            "instructor",
            "students",
            "student_ids",
            "created_at",
        ]

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
        fields = ("id", "username", "email", "password", "role", "name", "email")

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
        token["email"] = user.email
        token["id"] = user.id
        token["first_name"] = user.first_name if user.first_name else None
        token["last_name"] = user.last_name if user.last_name else None
        token['phone']=user.phone if user.phone else None
        token["fullname"] = (
            f"{user.first_name.strip()} {user.last_name.strip()}"
            if user.first_name and user.last_name else None
        )
        if user.avatar and hasattr(user.avatar, "url"):
            token["avatar"] = user.avatar.url
            token['avatar_url']=user.avatar_url
        else:
            token["avatar"] = None
            token['avatar_url']=None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        request = self.context.get("request")
        data.update(
            {
                "id": self.user.id,
                "username": self.user.username,
                "email": self.user.email,
                "role": self.user.role,
                'first_name':self.user.first_name,
                "last_name":self.user.last_name,
                "avatar": self.user.avatar.url if self.user.avatar else None,
                'avatar_url':request.build_absolute_uri(self.avatar.url),
                'phone':self.user.phone
            }
        )

        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
    )
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"error": "New passwords do not match"}
            )
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

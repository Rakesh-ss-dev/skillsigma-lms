from rest_framework import serializers
from .models import Enrollment, GroupEnrollment
from accounts.serializers import UserSerializer, StudentGroupSerializer
from courses.serializers import CourseSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(queryset=CourseSerializer.Meta.model.objects.all(), write_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "course_id", "enrolled_at", "progress"]


class GroupEnrollmentSerializer(serializers.ModelSerializer):
    group = StudentGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(queryset=StudentGroupSerializer.Meta.model.objects.all(), write_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(queryset=CourseSerializer.Meta.model.objects.all(), write_only=True)

    class Meta:
        model = GroupEnrollment
        fields = ["id", "group", "group_id", "course", "course_id", "assigned_at"]

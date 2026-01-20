from rest_framework import serializers
from .models import Enrollment, GroupEnrollment
from accounts.models import User, StudentGroup
from courses.models import Course
from accounts.serializers import UserSerializer, StudentGroupSerializer
from courses.serializers import CourseSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), 
        write_only=True, 
        many=True # Supports list input from MultiSelect
    )
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True,
    )

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "student_id", "course_id", "enrolled_at", "progress"]

    def create(self, validated_data):
        courses = validated_data.pop("course_id")
        student = validated_data.pop("student_id")
        enrollments = [
            Enrollment.objects.get_or_create(student=student, course=course, **validated_data)[0]
            for course in courses
        ]
        return enrollments

    def update(self, instance, validated_data):
        # Handle the list of courses. If updating a specific enrollment via PUT,
        # we usually only change the course to the first one in the list.
        courses = validated_data.pop("course_id", None)
        if courses:
            instance.course = courses[0] # Assign the first selected course
        
        # Handle student update if allowed
        student = validated_data.pop("student_id", None)
        if student:
            instance.student = student

        # Update remaining fields like progress
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance


class GroupEnrollmentSerializer(serializers.ModelSerializer):
    group = StudentGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(queryset=StudentGroup.objects.all(), write_only=True)
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), write_only=True)

    class Meta:
        model = GroupEnrollment
        fields = ["id", "group", "group_id", "course", "course_id", "assigned_at"]

    def create(self, validated_data):
        group = validated_data.pop("group_id")
        course = validated_data.pop("course_id")
        return GroupEnrollment.objects.create(group=group, course=course, **validated_data)
    
    
class GetUserEnrollmentSerializer(serializers.Serializer):
    """Serializer to fetch enrollments for a specific user."""
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        from accounts.models import User
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist.")
        return value
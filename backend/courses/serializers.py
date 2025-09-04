from rest_framework import serializers
from .models import Course, Lesson
from accounts.serializers import UserSerializer


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "content", "video_url", "order", "created_at"]


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "title", "description", "category", "thumbnail",
            "is_paid", "price", "created_at", "instructor", "lessons"
        ]

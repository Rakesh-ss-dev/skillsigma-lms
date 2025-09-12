from rest_framework import serializers
from .models import Course, Lesson, Category
from accounts.serializers import UserSerializer


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "content", "video_url", "order", "created_at"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), write_only=True, source="categories"
    )

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "category_ids",
            "thumbnail",
            "is_paid",
            "price",
            "created_at",
            "instructor",
            "lessons",
        ]

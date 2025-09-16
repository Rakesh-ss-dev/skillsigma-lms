from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Course, Lesson, Category



class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "content", "video_url", "order", "created_at"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
    def create(self, validated_data):
        category, created = Category.objects.get_or_create(
            name=validated_data.get("name")
        )
        return category

class CourseSerializer(serializers.ModelSerializer):
    # accept instructor ID
    instructor = UserSerializer(read_only=True)

    lessons = LessonSerializer(many=True, read_only=True)

    # accept category IDs for input
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Category.objects.all(),
        write_only=True,
        source="categories",
    )

    # show category details in response
    categories = CategorySerializer(many=True, read_only=True)

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

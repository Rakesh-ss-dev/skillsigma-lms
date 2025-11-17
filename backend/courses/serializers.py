from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Course, Lesson, Category
from accounts.models import User


class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'content', 
            'content_file', 'video_url', 'order', 
            'resources', 'created_at'
        ]

    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError({"course": "Course context is missing."})
        return Lesson.objects.create(course=course, **validated_data)

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
class InstructorActionSerializer(serializers.Serializer):
    """
    Serializer for validating the 'instructor_id' for custom actions.
    """
    # This field does three things:
    # 1. Checks that 'instructor_id' is in the request data.
    # 2. Checks that it's a valid integer.
    # 3. Checks that a User with this ID actually exists.
    instructor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        label="Instructor ID"
    )
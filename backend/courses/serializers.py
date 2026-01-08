from rest_framework import serializers
from .models import Course, Lesson, Category
from accounts.models import User

class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)
    # New read-only helpers
    prerequisite_quiz_title = serializers.ReadOnlyField(source='prerequisite_quiz.title')

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'content', 
            'content_file', 'video_url', 'order', 
            'resources', 'created_at',
            'pdf_version', 'processing_status',
            'prerequisite_quiz', 'prerequisite_quiz_title', 'prerequisite_score'
        ]

    def create(self, validated_data):
        # Preserved context check
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError({"course": "Course context is missing."})
        return Lesson.objects.create(course=course, **validated_data)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
    def create(self, validated_data):
        # Preserved get_or_create logic
        category, created = Category.objects.get_or_create(
            name=validated_data.get("name")
        )
        return category

class CourseSerializer(serializers.ModelSerializer):
    instructors = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(role="instructor"),
        required=False
    )
    lessons = LessonSerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Category.objects.all(),
        write_only=True,
        source="categories",
    )
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "title", "description", 
            "categories", "category_ids", 
            "thumbnail", "is_paid", "price", 
            "created_at", "instructors", "lessons",
        ]

class InstructorActionSerializer(serializers.Serializer):
    # Preserved exactly as requested
    instructor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        label="Instructor ID"
    )
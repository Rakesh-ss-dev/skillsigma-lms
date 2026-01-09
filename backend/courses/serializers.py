from rest_framework import serializers
from .models import Course, Lesson, Category,LessonProgress
from accounts.models import User
from quizzes.models import Quiz
from django.db.models import Prefetch

class CourseQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'prerequisite_lesson',"questions"]
        
class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)
    # Existing helper
    prerequisite_quiz_title = serializers.ReadOnlyField(source='prerequisite_quiz.title')
    
    # NEW: Dynamic field to check completion status for the current user
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'content', 
            'content_file', 'video_url', 'order', 
            'resources', 'created_at',
            'pdf_version', 'processing_status',
            'prerequisite_quiz', 'prerequisite_quiz_title', 'prerequisite_score',
            'is_completed', # Don't forget to add this here
        ]

    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError({"course": "Course context is missing."})
        return Lesson.objects.create(course=course, **validated_data)

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # If we prefetched data in the View, use it to avoid DB hits
            if hasattr(obj, 'user_progress'):
                # Check the list in memory (very fast)
                return any(p.is_completed for p in obj.user_progress)
            
            # Fallback to DB query if not prefetched (slower)
            return obj.progress.filter(student=request.user, is_completed=True).exists()
        return False
    
    def get_queryset(self):
        user = self.request.user
        return Lesson.objects.filter(course_id=self.kwargs['course_pk']).prefetch_related(
            Prefetch(
                'progress',
                queryset=LessonProgress.objects.filter(student=user),
                to_attr='user_progress' # Stores the result in a temporary attribute
            )
        )

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
    quizzes = CourseQuizSerializer(many=True, read_only=True)
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
            "created_at", "instructors", "lessons","quizzes"
        ]

class InstructorActionSerializer(serializers.Serializer):
    # Preserved exactly as requested
    instructor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        label="Instructor ID"
    )
    
class LessonProgressSerializer(serializers.ModelSerializer):
    # Read-only field to show title without needing a nested call
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ['id', 'lesson', 'lesson_title', 'is_completed', 'completed_at']
        read_only_fields = ['completed_at']

    def create(self, validated_data):
        # We get the user from the context passed by the ViewSet
        student = self.context['request'].user
        
        # 'update_or_create' logic:
        # If progress exists for this student/lesson, update it.
        # If not, create a new record.
        progress, created = LessonProgress.objects.update_or_create(
            student=student,
            lesson=validated_data['lesson'],
            defaults={'is_completed': validated_data.get('is_completed', False)}
        )
        return progress
    
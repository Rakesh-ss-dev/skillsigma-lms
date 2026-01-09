from rest_framework import serializers
from .models import Course, Lesson, Category,LessonProgress
from accounts.models import User
from quizzes.models import Quiz,Submission
from enrollments.models import Enrollment
from django.db.models import Prefetch

class CourseQuizSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'prerequisite_lesson', "questions", "is_completed",]

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'user_submissions'):
                return any(s.student_id == request.user.id for s in obj.user_submissions)
            return Submission.objects.filter(student=request.user, quiz=obj).exists()
        return False
        
class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)
    prerequisite_quiz_title = serializers.ReadOnlyField(source='prerequisite_quiz.title')
    is_completed = serializers.SerializerMethodField()
    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'content', 
            'content_file', 'video_url', 'order', 
            'resources', 'created_at',
            'pdf_version', 'processing_status',
            'prerequisite_quiz', 'prerequisite_quiz_title', 'prerequisite_score',
            'is_completed',
        ]

    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError({"course": "Course context is missing."})
        return Lesson.objects.create(course=course, **validated_data)

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'user_progress'):
                return any(p.is_completed for p in obj.user_progress)
            return obj.progress.filter(student=request.user, is_completed=True).exists()
        return False
    

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
    progress = serializers.SerializerMethodField()
    class Meta:
        model = Course
        fields = [
            "id", "title", "description", 
            "categories", "category_ids", 
            "thumbnail", "is_paid", "price", 
            "created_at", "instructors", "lessons","quizzes","progress"
        ]
    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                enrollment = Enrollment.objects.get(student=request.user, course=obj)
                return enrollment.progress
            except Enrollment.DoesNotExist:
                return 0
        return 0

class InstructorActionSerializer(serializers.Serializer):
    instructor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        label="Instructor ID"
    )
    
class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ['id', 'lesson', 'lesson_title', 'is_completed', 'completed_at']
        read_only_fields = ['completed_at']

    def create(self, validated_data):
        student = self.context['request'].user
        progress, created = LessonProgress.objects.update_or_create(
            student=student,
            lesson=validated_data['lesson'],
            defaults={'is_completed': validated_data.get('is_completed',True)}
        )
        return progress
    
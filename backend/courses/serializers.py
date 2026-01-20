from rest_framework import serializers
from .models import Course, Lesson, Category,LessonProgress
from accounts.models import User
from quizzes.models import Quiz,Submission
from enrollments.models import Enrollment
from django.db.models import Prefetch
from django.db import transaction
from .tasks import upload_lesson_video_to_drive
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
    
    # Explicitly define the temp file field for better control
    video_file_temp = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'content', 
            'content_file', 'video_url', 'order', 
            'resources', 'created_at',
            'pdf_version', 'processing_status',
            'prerequisite_quiz', 'prerequisite_quiz_title', 'prerequisite_score',
            'is_completed',
            'video_status',
            'video_file_temp',
        ]
        read_only_fields = ['video_status', 'video_url', 'processing_status', 'pdf_version']

    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError({"course": "Course context is missing."})
        validated_data['course'] = course
        if not validated_data.get('content_file'):
            validated_data['processing_status'] = 'skipped'
        # 2. Check for Video Upload
        has_video = 'video_file_temp' in validated_data and validated_data['video_file_temp']
        if has_video:
            # Set status immediately so frontend knows it's working
            validated_data['video_status'] = 'processing'

        # 3. Create the instance (Just once!)
        lesson = super().create(validated_data)

        # 4. Trigger Celery Task (After DB commit)
        if has_video:
            transaction.on_commit(lambda: upload_lesson_video_to_drive.delay(lesson.id))
            
        return lesson

    def update(self, instance, validated_data):
        # 1. Check for NEW Video Upload
        has_new_video = 'video_file_temp' in validated_data and validated_data['video_file_temp']
        
        if not validated_data.get('content_file'):
            validated_data['processing_status'] = 'skipped'
            
        if has_new_video:
            validated_data['video_status'] = 'processing'
            # Optional: Clear old URL while processing new one
            # validated_data['video_url'] = '' 

        # 2. Update the instance
        lesson = super().update(instance, validated_data)

        # 3. Trigger Celery Task
        if has_new_video:
            transaction.on_commit(lambda: upload_lesson_video_to_drive.delay(lesson.id))

        return lesson

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Optimization: Use prefetch_related data if available
            if hasattr(obj, 'user_progress'):
                return any(p.is_completed for p in obj.user_progress)
            # Fallback query
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
    
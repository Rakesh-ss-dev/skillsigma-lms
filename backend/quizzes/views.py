from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_tracking.mixins import LoggingMixin

from .models import Quiz, Question, Option, Submission
from .serializers import QuizSerializer, QuestionSerializer, OptionSerializer, SubmissionSerializer
from courses.models import LessonProgress

class QuizViewSet(LoggingMixin, viewsets.ModelViewSet):
    # Base queryset is required for the router to understand the basename
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 1. Start with an optimized base query
        queryset = Quiz.objects.select_related('lesson', 'prerequisite_lesson') \
                               .prefetch_related('questions', 'questions__options')

        # 2. Check for nested route parameter (e.g. /courses/9/quizzes/)
        course_pk = self.kwargs.get('course_pk')
        
        # 3. CRITICAL FIX: Only filter by course IF course_pk is present.
        # This allows direct access via /api/quiz/10/ to work.
        if course_pk:
            queryset = queryset.filter(course_id=course_pk)
            
        return queryset

    @action(detail=True, methods=['get'])
    def check_access(self, request, pk=None, course_pk=None):
        quiz = self.get_object()
        
        # If no prerequisite, access is allowed
        if not quiz.prerequisite_lesson:
             return Response({"allowed": True})

        # Check if the user completed the prerequisite lesson
        is_completed = LessonProgress.objects.filter(
            student=request.user, 
            lesson=quiz.prerequisite_lesson, 
            is_completed=True
        ).exists()
        
        if is_completed:
            return Response({"allowed": True})
        
        return Response({
            "allowed": False,
            "reason": f"Locked. You must complete the lesson '{quiz.prerequisite_lesson.title}' first."
        }, status=status.HTTP_403_FORBIDDEN)


class QuestionViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('options').all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]


class OptionViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [permissions.IsAuthenticated]


class SubmissionViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
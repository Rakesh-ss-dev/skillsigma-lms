from rest_framework import viewsets, permissions
from .models import Quiz, Question, Option, Submission
from .serializers import QuizSerializer, QuestionSerializer, OptionSerializer, SubmissionSerializer
from rest_framework_tracking.mixins import LoggingMixin

class QuizViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]  # Instructor/Admin


class QuestionViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Question.objects.all()
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

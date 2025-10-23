from django.db import models
from accounts.models import User
from courses.models import Course

class Question(models.Model):
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('tf', 'True/False'),
        ('short', 'Short Answer'),
    )

    text = models.TextField(unique=True)  # ✅ Prevents duplicate questions
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    points = models.PositiveIntegerField(default=1)
    short_answer = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.text[:80]


class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('question', 'text')  # ✅ No duplicate options for same question

    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"


class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quizzes")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_limit = models.PositiveIntegerField(null=True, blank=True)  # seconds
    created_at = models.DateTimeField(auto_now_add=True)
    questions = models.ManyToManyField(Question, related_name="quizzes", blank=True)

    def __str__(self):
        return f"{self.title} ({self.course.title})"


class Submission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    score = models.FloatField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title} ({self.score})"

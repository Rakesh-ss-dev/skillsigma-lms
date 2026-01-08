from django.db import models
from django.conf import settings
from courses.models import Course, Lesson

class Question(models.Model):
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('tf', 'True/False'),
        ('short', 'Short Answer'),
    )

    text = models.TextField(unique=True) 
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    points = models.PositiveIntegerField(default=1)
    short_answer = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.text[:80]


class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options", db_index=True)
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('question', 'text')

    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"


class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quizzes", db_index=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="quizzes", null=True, blank=True)
    
    # NEW: Prerequisite Logic
    prerequisite_lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unlocks_quizzes',
        help_text="The lesson that must be marked complete to unlock this quiz."
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_limit = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    questions = models.ManyToManyField(Question, related_name="quizzes", blank=True)

    def __str__(self):
        return f"{self.title} ({self.course.title})"


class Submission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="submissions", db_index=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions", db_index=True)
    score = models.FloatField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def calculate_score(self):
        # Preserved your grading logic, just added select_related for speed
        total_score = 0
        answers = self.answers.select_related('question', 'selected_option').all()

        for answer in answers:
            question = answer.question
            if question.question_type in ['mcq', 'tf']:
                if answer.selected_option and answer.selected_option.is_correct:
                    total_score += question.points
                    answer.is_correct = True
                else:
                    answer.is_correct = False
                answer.save(update_fields=['is_correct'])
            
        self.score = total_score
        self.save()
    
class StudentAnswer(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer = models.TextField(blank=True, null=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.IntegerField(default=0)
    class Meta:
        unique_together = ('submission', 'question')

    def __str__(self):
        return f"Answer for {self.question} in {self.submission}"
from django.db import models
from accounts.models import User,StudentGroup
from courses.models import Course,LessonProgress
from quizzes.models import Submission
from django.core.validators import MinValueValidator, MaxValueValidator

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress = models.DecimalField(
    max_digits=5, 
    decimal_places=2, 
    default=0.00,
    validators=[MinValueValidator(0.00), MaxValueValidator(100.00)]
)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        constraints = [
        models.UniqueConstraint(fields=['student', 'course'], name='unique_enrollment')
    ]
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} in {self.course.title}"
    def recalculate_progress(self):
        """
        Calculates progress based on Lessons Completed + Quizzes Submitted
        """
        # 1. Count Total Items (Lessons + Quizzes)
        total_lessons = self.course.lessons.count()
        total_quizzes = self.course.quizzes.count()
        total_items = total_lessons + total_quizzes

        if total_items == 0:
            self.progress = 0.00
            self.save()
            return

        # 2. Count Completed Items
        # Count marked completed lessons
        completed_lessons = LessonProgress.objects.filter(
            student=self.student, 
            lesson__course=self.course, 
            is_completed=True
        ).count()

        # Count quizzes with at least one submission
        # (You might want to add logic here to check for a 'passing score')
        completed_quizzes = Submission.objects.filter(
            student=self.student, 
            quiz__course=self.course
        ).values('quiz').distinct().count()

        total_completed = completed_lessons + completed_quizzes

        # 3. Calculate Percentage
        new_progress = (total_completed / total_items) * 100
        self.progress = round(new_progress, 2)
        self.save()

class GroupEnrollment(models.Model):
    group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name="course_enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="group_enrollments")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'course')

    def __str__(self):
        return f"Group {self.group.name} in {self.course.title}"

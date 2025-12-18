# courses/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import LessonProgress
from quizzes.models import Submission
from enrollments.models import Enrollment
from courses.models import Lesson
from quizzes.models import Quiz

# Trigger when a Lesson is marked complete
@receiver(post_save, sender=LessonProgress)
def update_progress_on_lesson_complete(sender, instance, created, **kwargs):
    if instance.is_completed:
        # Find the student's enrollment for this course
        enrollment = Enrollment.objects.filter(
            student=instance.student, 
            course=instance.lesson.course
        ).first()
        
        if enrollment:
            enrollment.recalculate_progress()

# Trigger when a Quiz is submitted
@receiver(post_save, sender=Submission)
def update_progress_on_quiz_submission(sender, instance, created, **kwargs):
    enrollment = Enrollment.objects.filter(
        student=instance.student, 
        course=instance.quiz.course
    ).first()
    
    if enrollment:
        enrollment.recalculate_progress()

# Optional: Recalculate if a teacher adds/removes lessons (changes the total count)
@receiver([post_save, post_delete], sender=Lesson)
@receiver([post_save, post_delete], sender=Quiz)
def update_all_enrollments_on_content_change(sender, instance, **kwargs):
    # This is heavier, but ensures accuracy if a teacher adds a lesson 
    # to a live course. 
    course = instance.course
    # Update all students enrolled in this course
    for enrollment in course.enrollments.all():
        enrollment.recalculate_progress()
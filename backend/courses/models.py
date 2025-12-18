from django.db import models
from accounts.models import User
from django.db import models, transaction
from .tasks import convert_lesson_to_pdf

class Category(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    
class Course(models.Model):
    instructors = models.ManyToManyField(User, related_name="courses")
    title = models.CharField(max_length=255,unique=True)
    description = models.TextField()
    categories = models.ManyToManyField("Category", related_name="groups")  # changed here
    thumbnail = models.ImageField(upload_to="courses/", null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    content = models.TextField()
    content_file = models.FileField(upload_to="lessons/content_files/", null=True, blank=True)
    video_url = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    resources = models.FileField(upload_to="lessons/resources/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    def save(self, *args, **kwargs):
        # We need to know if the file changed.
        # If the instance already exists in DB, fetch the old version to compare.
        is_new_file = False
        
        if self.pk:
            try:
                old_instance = Lesson.objects.get(pk=self.pk)
                if old_instance.content_file != self.content_file:
                    is_new_file = True
            except Lesson.DoesNotExist:
                pass # Should not happen if self.pk exists
        else:
            is_new_file = True # New record

        # Save normally first to ensure file exists on disk/S3
        super().save(*args, **kwargs)

        # Trigger Task IF:
        # 1. A file actually exists
        # 2. It is a new file upload (don't re-convert on title edit)
        # 3. It needs conversion (check extension)
        if self.content_file and is_new_file:
            ext = self.content_file.name.split('.')[-1].lower()
            if ext in ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx']:
                # use on_commit to ensure DB transaction is closed before Celery tries to read
                transaction.on_commit(lambda: convert_lesson_to_pdf.delay(self.id))
                
class LessonProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="lesson_progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title}"
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
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    content = models.TextField()
    content_file = models.FileField(upload_to="lessons/content_files/", null=True, blank=True)
    pdf_version = models.FileField(upload_to="lessons/pdfs/", null=True, blank=True)
    processing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    video_url = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    resources = models.FileField(upload_to="lessons/resources/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Store the original file name on initialization
        self._original_content_file = self.content_file

    def save(self, *args, **kwargs):
        is_new_file = False
        if self.pk:
            old = Lesson.objects.get(pk=self.pk)
            if old.content_file != self.content_file:
                is_new_file = True
        else:
            is_new_file = True

        # Set status to processing if we are about to kick off a task
        if self.content_file and is_new_file:
            ext = self.content_file.name.split('.')[-1].lower()
            if ext in ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx']:
                self.processing_status = 'processing' 

        super().save(*args, **kwargs)

        if self.content_file and is_new_file and self.processing_status == 'processing':
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
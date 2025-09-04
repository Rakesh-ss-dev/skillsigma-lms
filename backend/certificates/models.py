from django.db import models
from enrollments.models import Enrollment

class Certificate(models.Model):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name="certificate")
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Certificate: {self.enrollment.student.username} - {self.enrollment.course.title}"

from django.db import models
from accounts.models import User,StudentGroup
from courses.models import Course

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} in {self.course.title}"


class GroupEnrollment(models.Model):
    group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name="course_enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="group_enrollments")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'course')

    def __str__(self):
        return f"Group {self.group.name} in {self.course.title}"

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import FileExtensionValidator
class User(AbstractUser):
    email = models.EmailField(unique=True)
    ROLES = (
        ('admin', 'Admin'),
        ('instructor', 'Instructor'),
        ('student', 'Student'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLES,
        default='student',
        verbose_name="User Role"
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])]
    )
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=15, default='9999999999', unique=True)
    avatar_url = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    
class StudentGroup(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    students = models.ManyToManyField(User, related_name="grouped_to", limit_choices_to={'role': 'student'})
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name
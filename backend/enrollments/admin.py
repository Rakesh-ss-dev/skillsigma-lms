from django.contrib import admin
from .models import Enrollment,GroupEnrollment
# Register your models here.
admin.site.register(Enrollment)
admin.site.register(GroupEnrollment)
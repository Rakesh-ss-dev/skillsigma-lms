from django.contrib import admin
from .models import Quiz, Question, Option, Submission,StudentAnswer

# Register your models here.
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Option)
admin.site.register(Submission)
admin.site.register(StudentAnswer)

from django.contrib import admin
from .models import Course,Lesson,Category ,LessonProgress
from accounts.models import User
# Register your models here.
admin.site.register(Lesson)
admin.site.register(Category)
admin.site.register(LessonProgress)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at")
    filter_horizontal = ("instructors",)  # better UX for M2M

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "instructors":
            kwargs["queryset"] = User.objects.filter(role="instructor")
        return super().formfield_for_manytomany(db_field, request, **kwargs)

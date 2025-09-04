from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet, StudentGroupViewSet
from courses.views import CourseViewSet, LessonViewSet
from enrollments.views import EnrollmentViewSet, GroupEnrollmentViewSet
from quizzes.views import QuizViewSet, QuestionViewSet, OptionViewSet, SubmissionViewSet
from certificates.views import CertificateViewSet
from django.contrib import admin
router = DefaultRouter()

# Accounts
router.register(r'users', UserViewSet)
router.register(r'groups', StudentGroupViewSet)

# Courses
router.register(r'courses', CourseViewSet)
router.register(r'lessons', LessonViewSet)

# Enrollments
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'group-enrollments', GroupEnrollmentViewSet)

# Quizzes
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'options', OptionViewSet)
router.register(r'submissions', SubmissionViewSet)

# Certificates
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/auth/", include("accounts.jwt_urls")),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet, StudentGroupViewSet,InstructorViewSet,AdminViewSet
from courses.views import CourseViewSet, LessonViewSet,CategoryViewSet
from enrollments.views import EnrollmentViewSet, GroupEnrollmentViewSet
from quizzes.views import QuizViewSet, QuestionViewSet, OptionViewSet, SubmissionViewSet
from certificates.views import CertificateViewSet
from django.contrib import admin
from django.conf import settings
from rest_framework_nested import routers
from django.conf.urls.static import static

router = DefaultRouter()
# Accounts
router.register(r'users', UserViewSet,basename='user')
router.register(r'groups', StudentGroupViewSet)

router.register(r'instructors',InstructorViewSet,basename="instructor")
router.register(r'admin',AdminViewSet,basename="admin")
# Courses
router.register(r'categories',CategoryViewSet)
router.register(r'courses', CourseViewSet)

courses_router = routers.NestedDefaultRouter(router, r'courses', lookup='course')
courses_router.register(r'lessons', LessonViewSet, basename='course-lessons')
courses_router.register(r'quizzes', QuizViewSet, basename='course-quizzes')

# Enrollments
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'group-enrollments', GroupEnrollmentViewSet)

# Quizzes
router.register(r'quiz', QuizViewSet)
router.register(r'question', QuestionViewSet)
router.register(r'option', OptionViewSet)
router.register(r'submission', SubmissionViewSet)

# Certificates
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path('api/', include(courses_router.urls)),
    path("api/auth/", include("accounts.jwt_urls")),
    path('silk/', include('silk.urls', namespace='silk'))
]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import RegisterView, CustomTokenObtainPairView, LogoutView,ChangePassword

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="custom_token_obtain_pair"),
    path("logout/", LogoutView.as_view(), name="logout"),   # 👈 added
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path('changePassword/',ChangePassword.as_view(),name='change_Password')
]

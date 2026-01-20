# courses/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication

class QueryStringJWTAuthentication(JWTAuthentication):
    """
    Custom Auth to look for 'token' in the query string.
    Required for <video> tags which cannot send Authorization headers.
    """
    def authenticate(self, request):
        # 1. Check for 'token' in the URL parameters (e.g. ?token=xyz)
        token = request.query_params.get('token')
        
        if token:
            try:
                # Validate the token using SimpleJWT's logic
                validated_token = self.get_validated_token(token)
                # Return the user and token (Standard DRF format)
                return self.get_user(validated_token), validated_token
            except:
                # If token is invalid, return None so other Auth classes can try
                return None
                
        # 2. If no query param, fallback to standard Header check
        return super().authenticate(request)
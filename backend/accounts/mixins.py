from rest_framework.views import exception_handler
from rest_framework_tracking.mixins import LoggingMixin

class SafeLoggingMixin(LoggingMixin):
    """
    Fix for AttributeError: 'Request' object has no attribute 'accepted_renderer'
    in django-rest-framework-tracking when renderer is not yet initialized.
    """

    def handle_exception(self, exc):
        # If DRF's default exception handler gives a response, return it safely
        response = exception_handler(exc, self.get_exception_handler_context())

        # Create a dummy renderer to avoid AttributeError in rest_framework_tracking
        if not hasattr(self.request, "accepted_renderer") or self.request.accepted_renderer is None:
            from types import SimpleNamespace
            self.request.accepted_renderer = SimpleNamespace(format="json")

        if response is not None:
            return response

        # Fall back to DRF’s base exception handler
        return super().handle_exception(exc)

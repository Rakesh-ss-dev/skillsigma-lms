from threading import local
from .models import Tenant

_thread_locals = local()

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant_slug = request.headers.get('X-Tenant-Id')
        if not tenant_slug:
            host = request.get_host().split(':')[0]
            tenant_slug = host.split('.')[0]
        try:
            tenant = Tenant.objects.get(slug=tenant_slug, is_active=True)
        except Tenant.DoesNotExist:
            tenant = None

        # Store in thread locals for the Database to see
        _thread_locals.tenant = tenant
        request.tenant = tenant
        
        response = self.get_response(request)
        return response
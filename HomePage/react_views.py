"""
Views to serve React SPA for SE section
"""
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.conf import settings

@never_cache
def se_react_app(request, path=''):
    """
    Serve the React SPA for all /SE/ routes
    This handles client-side routing
    """
    # Only use Vite dev server when both DEBUG and USE_VITE_DEV are true
    use_dev = bool(getattr(settings, 'DEBUG', False) and getattr(settings, 'USE_VITE_DEV', False))
    return render(request, 'se_react.html', {'debug': use_dev})

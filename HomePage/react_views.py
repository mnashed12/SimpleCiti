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
    # Use USE_VITE_DEV to decide between Vite HMR (dev) and built assets (prod)
    return render(request, 'se_react.html', {'use_vite_dev': getattr(settings, 'USE_VITE_DEV', False)})

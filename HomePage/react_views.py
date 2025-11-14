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
    # Force production assets to avoid localhost:5173 on any environment
    # This ensures live site never references the Vite dev server.
    return render(request, 'se_react.html', {'debug': False})

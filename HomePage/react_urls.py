"""
URL Configuration for React SPA
All /SE/ routes will be handled by React Router
"""
from django.urls import path, re_path
from . import react_views

# React SPA URLs - catch all SE routes and let React Router handle them
react_urlpatterns = [
    # Catch all /SE/* routes and serve React app
    re_path(r'^SE/.*$', react_views.se_react_app, name='se-react-app'),
]

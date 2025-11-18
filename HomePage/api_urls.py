"""
API URL Configuration for SE React Frontend
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# Create router for viewsets
router = DefaultRouter()
router.register(r'properties', api_views.PropertyViewSet, basename='api-property')
router.register(r'pipeline', api_views.PipelinePropertyViewSet, basename='api-pipeline')
router.register(r'exchange-ids', api_views.ExchangeIDViewSet, basename='api-exchange-id')
# Removed ClientProfileViewSet - use profile_me function view instead
router.register(r'client-profiles', api_views.ClientCRMViewSet, basename='api-client-profiles')

# API URL patterns
urlpatterns = [
    # Custom override for profile base path to support GET/PATCH without ID
    path('profile/', api_views.profile_me, name='api-profile-me'),
    # Router URLs (includes all CRUD operations)
    path('', include(router.urls)),
    
    # Custom endpoints
    path('current-user/', api_views.current_user, name='api-current-user'),
    path('whoami/', api_views.whoami, name='api-whoami'),
    path('user-likes/', api_views.user_liked_properties, name='api-user-likes'),
    path('enroll-property/', api_views.enroll_property, name='api-enroll-property'),
    path('dashboard-stats/', api_views.dashboard_stats, name='api-dashboard-stats'),
    path('property-filters/', api_views.property_filters, name='api-property-filters'),
    path('like-property/', api_views.like_property, name='api-like-property'),
    path('unlike-property/', api_views.unlike_property, name='api-unlike-property'),
]

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
    # Standalone image upload endpoint (CSRF exempt)
    path('properties/<str:reference_number>/images/', api_views.property_image_upload, name='property-image-upload'),
    # Standalone image delete endpoint (CSRF exempt)
    path('property-images/<int:image_id>/', api_views.property_image_delete, name='property-image-delete'),
    # Property documents upload/list endpoint (REST for React)
    path('properties/<str:reference_number>/documents/', api_views.PropertyViewSet.as_view({'get': 'documents', 'post': 'documents'}), name='property-documents'),
    path('properties/<str:reference_number>/documents/<int:doc_id>/', api_views.PropertyViewSet.as_view({'delete': 'delete_document'}), name='property-document-delete'),
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
    
    # Exchange Enrollment endpoints
    path('generate-exchange-id/', api_views.generate_exchange_id, name='api-generate-exchange-id'),
    path('update-exchange-id/<int:record_id>/', api_views.update_exchange_id, name='api-update-exchange-id'),
    path('create-account-and-link-exchange/', api_views.create_account_and_link_exchange, name='api-create-account-and-link-exchange'),
    path('link-exchange-to-user/', api_views.link_exchange_to_user, name='api-link-exchange-to-user'),
]

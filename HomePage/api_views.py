"""
REST API Views for SE section
Provides JSON endpoints for React frontend
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.views.decorators.csrf import ensure_csrf_cookie
from datetime import date

logger = logging.getLogger(__name__)

from .models import (
    Property, PropertyImage, PropertyFee, PropertyDocument,
    ClientProfile, ExchangeID, PropertyEnrollment,
    CustomUser, PropertyLike
)
from .serializers import (
    PropertyListSerializer, PropertyDetailSerializer,
    PropertyImageSerializer, PropertyFeeSerializer,
    ClientProfileSerializer, ExchangeIDSerializer,
    PropertyEnrollmentSerializer, UserSerializer,
    PropertyCreateUpdateSerializer
)
from .views import generate_reference_number


class PropertyPagination(PageNumberPagination):
    """Custom pagination for property lists"""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Property CRUD operations
    GET /api/properties/ - List all active properties
    GET /api/properties/{reference_number}/ - Get property detail
    POST /api/properties/ - Create new property (broker only)
    PUT/PATCH /api/properties/{reference_number}/ - Update property
    DELETE /api/properties/{reference_number}/ - Delete property
    """
    queryset = Property.objects.active().with_relations()
    serializer_class = PropertyListSerializer
    pagination_class = PropertyPagination
    lookup_field = 'reference_number'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer
    
    def get_queryset(self):
        queryset = Property.objects.active().with_relations()
        
        # Filter by property type
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(purchase_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(purchase_price__lte=max_price)
        
        # Filter by state
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state=state)
        
        # Search by name or address
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(address__icontains=search) |
                Q(city__icontains=search)
            )
        
        return queryset
    
    def get_permissions(self):
        """Allow anyone to view, but require auth for modifications"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error logging"""
        logger.info(f"PropertyViewSet.create - Incoming data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"PropertyViewSet.create failed: {str(e)}")
            logger.error(f"Validation errors: {getattr(serializer, 'errors', 'No errors attr')}")
            raise
    
    def perform_create(self, serializer):
        # Log incoming data for debugging
        logger.info(f"PropertyViewSet.perform_create - Request data: {self.request.data}")
        
        # Auto-generate a reference number if not provided
        ref = serializer.validated_data.get('reference_number')
        ptype = serializer.validated_data.get('property_type')
        if not ref and ptype:
            serializer.validated_data['reference_number'] = generate_reference_number(ptype)
        # Set created_by if available
        if self.request.user and self.request.user.is_authenticated:
            serializer.validated_data.setdefault('created_by', self.request.user)
        # Default close_date to today if missing
        serializer.validated_data.setdefault('close_date', date.today())
        
        logger.info(f"PropertyViewSet.perform_create - Validated data: {serializer.validated_data}")
        serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, reference_number=None):
        """Like a property"""
        property_obj = self.get_object()
        like, created = PropertyLike.objects.get_or_create(
            user=request.user,
            property=property_obj
        )
        if created:
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already liked'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, reference_number=None):
        """Unlike a property"""
        property_obj = self.get_object()
        deleted = PropertyLike.objects.filter(
            user=request.user,
            property=property_obj
        ).delete()
        if deleted[0] > 0:
            return Response({'status': 'unliked'}, status=status.HTTP_204_NO_CONTENT)
        return Response({'status': 'not liked'}, status=status.HTTP_404_NOT_FOUND)


class PipelinePropertyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for pipeline properties
    GET /api/pipeline/ - List all pipeline properties
    """
    queryset = Property.objects.pipeline().with_relations()
    serializer_class = PropertyListSerializer
    pagination_class = PropertyPagination


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_liked_properties(request):
    """Get list of properties liked by current user"""
    likes = PropertyLike.objects.filter(user=request.user).select_related('property')
    property_ids = [like.property.reference_number for like in likes]
    return Response({'liked_properties': property_ids})


class ExchangeIDViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Exchange ID management
    GET /api/exchange-ids/ - List user's exchange IDs
    POST /api/exchange-ids/ - Create new exchange ID
    GET /api/exchange-ids/{id}/ - Get exchange ID detail
    """
    serializer_class = ExchangeIDSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show user's own exchange IDs"""
        user = self.request.user
        if hasattr(user, 'client_profile'):
            return ExchangeID.objects.filter(
                client_profile=user.client_profile
            ).order_by('-created_at')
        return ExchangeID.objects.none()
    
    def perform_create(self, serializer):
        """Associate exchange ID with current user's client profile"""
        client_profile = get_object_or_404(ClientProfile, user=self.request.user)
        serializer.save(client_profile=client_profile)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_property(request):
    """
    Enroll a property to an exchange ID
    POST /api/enroll-property/
    Body: { "property_reference": "RE-5001", "exchange_id": 1 }
    """
    property_ref = request.data.get('property_reference')
    exchange_id = request.data.get('exchange_id')
    
    if not property_ref or not exchange_id:
        return Response(
            {'error': 'property_reference and exchange_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        property_obj = Property.objects.get(reference_number=property_ref)
        exchange_obj = ExchangeID.objects.get(
            id=exchange_id,
            client_profile__user=request.user
        )
        
        enrollment, created = PropertyEnrollment.objects.get_or_create(
            property=property_obj,
            exchange_id=exchange_obj,
            defaults={'status': 'pending'}
        )
        
        serializer = PropertyEnrollmentSerializer(enrollment)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)
        
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except ExchangeID.DoesNotExist:
        return Response(
            {'error': 'Exchange ID not found or does not belong to user'},
            status=status.HTTP_404_NOT_FOUND
        )


class ClientProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoints for client profile management
    GET /api/profile/ - Get current user's profile
    PUT/PATCH /api/profile/ - Update profile
    """
    serializer_class = ClientProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show current user's profile"""
        return ClientProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create profile for current user"""
        profile, created = ClientProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for broker users
    GET /api/dashboard-stats/
    """
    user = request.user
    
    # Check if user is broker
    if not hasattr(user, 'broker_profile'):
        return Response(
            {'error': 'User is not a broker'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get broker's properties
    broker_properties = Property.objects.filter(broker_user=user)
    
    stats = {
        'total_properties': broker_properties.count(),
        'active_properties': broker_properties.filter(is_active=True).count(),
        'pending_approval': broker_properties.filter(status='pending').count(),
        'approved': broker_properties.filter(status='approved').count(),
        'pipeline': broker_properties.filter(is_pipeline=True).count(),
        'total_value': sum(p.price or 0 for p in broker_properties),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def property_filters(request):
    """
    Get available filter options for properties
    GET /api/property-filters/
    """
    # Build statuses dynamically from model choices
    status_choices = [choice[0] for choice in Property.STATUS_CHOICES]
    filters = {
        'property_types': list(Property.objects.values_list('property_type', flat=True).distinct()),
        'states': list(Property.objects.values_list('state', flat=True).distinct().order_by('state')),
        'statuses': status_choices,
        'price_ranges': [
            {'label': 'Under $1M', 'min': 0, 'max': 1000000},
            {'label': '$1M - $5M', 'min': 1000000, 'max': 5000000},
            {'label': '$5M - $10M', 'min': 5000000, 'max': 10000000},
            {'label': '$10M - $25M', 'min': 10000000, 'max': 25000000},
            {'label': 'Over $25M', 'min': 25000000, 'max': None},
        ]
    }
    
    return Response(filters)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user's information
    GET /api/current-user/
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'user_type': user.user_type,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def whoami(request):
    """Simple session probe to verify authentication and cookies end-to-end. Also sets CSRF cookie."""
    u = request.user
    return Response({
        'authenticated': u.is_authenticated,
        'user': None if not u.is_authenticated else {
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
        }
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_me(request):
    """GET/PATCH the current user's profile at base path /api/se/profile/.
    This supports the frontend calling PATCH without knowing the profile ID.
    """
    profile, _ = ClientProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        ser = ClientProfileSerializer(profile)
        return Response(ser.data)

    # PATCH (partial update)
    ser = ClientProfileSerializer(profile, data=request.data, partial=True)
    if ser.is_valid():
        ser.save()
        return Response(ser.data)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_property(request):
    """
    Like a property for a specific Exchange ID
    POST /api/like-property/
    Body: { "property_id": "RE-5004", "exchange_id": 1 }
    """
    property_id = request.data.get('property_id')  # reference_number
    exchange_id = request.data.get('exchange_id')  # ExchangeID.id
    
    if not property_id or not exchange_id:
        return Response(
            {'success': False, 'error': 'Missing property_id or exchange_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify user owns this exchange ID
        exchange = ExchangeID.objects.get(id=exchange_id, user=request.user)
    except ExchangeID.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Exchange ID not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        # Get property by reference_number
        property_obj = Property.objects.get(reference_number=property_id)
    except Property.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Property not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create or get the like
    like, created = PropertyLike.objects.get_or_create(
        user=request.user,
        exchange_id=exchange,
        property=property_obj
    )
    
    return Response({
        'success': True,
        'liked': True,
        'message': f'Property added to {exchange.exchange_id}'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlike_property(request):
    """
    Unlike a property
    POST /api/unlike-property/
    Body: { "property_id": "RE-5004", "exchange_id": 1 }
    """
    property_id = request.data.get('property_id')
    exchange_id = request.data.get('exchange_id')
    
    if not property_id or not exchange_id:
        return Response(
            {'success': False, 'error': 'Missing property_id or exchange_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        property_obj = Property.objects.get(reference_number=property_id)
    except Property.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Property not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Delete the like
    deleted = PropertyLike.objects.filter(
        user=request.user,
        exchange_id_id=exchange_id,
        property=property_obj
    ).delete()
    
    if deleted[0] > 0:
        return Response({'success': True, 'message': 'Property unliked'})
    return Response(
        {'success': False, 'error': 'Like not found'},
        status=status.HTTP_404_NOT_FOUND
    )

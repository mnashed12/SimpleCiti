"""
REST API Views for SE section
Provides JSON endpoints for React frontend
"""
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
import logging
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from datetime import date
# CSRF-exempt endpoint to delete a property image by id
@csrf_exempt
@api_view(['DELETE'])
def property_image_delete(request, image_id):
    """Delete a property image by id (CSRF exempt for React)"""
    try:
        img = PropertyImage.objects.get(id=image_id)
        img.delete()
        return Response({'success': True}, status=204)
    except PropertyImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=404)


logger = logging.getLogger(__name__)

from .models import (
    Property, PropertyImage, PropertyFee, PropertyDocument,
    ClientProfile, ExchangeID, PropertyEnrollment,
    CustomUser, PropertyLike
)
from .serializers import (
    PropertyListSerializer, PropertyDetailSerializer,
    PropertyImageSerializer, PropertyFeeSerializer, PropertyDocumentSerializer,
    ClientProfileSerializer, ClientProfileMinimalSerializer, ExchangeIDSerializer,
    PropertyEnrollmentSerializer, UserSerializer,
    PropertyCreateUpdateSerializer
)
from .views import generate_reference_number
from rest_framework.parsers import MultiPartParser, FormParser

# Standalone CSRF-exempt image upload endpoint
@csrf_exempt
@api_view(['POST'])
def property_image_upload(request, reference_number):
    """Upload an image for a property (CSRF exempt for React)"""
    try:
        property_obj = Property.objects.get(reference_number=reference_number)
    except Property.DoesNotExist:
        return Response({'error': 'Property not found.'}, status=404)
    image_file = request.FILES.get('image')
    image_url = request.data.get('image_url')
    order = request.data.get('order', property_obj.images.count())
    if not image_file and not image_url:
        return Response({'error': 'No image or image_url provided.'}, status=400)
    prop_image = PropertyImage(
        property=property_obj,
        order=order
    )
    if image_file:
        prop_image.image.save(image_file.name, image_file)
    elif image_url:
        prop_image.image_url = image_url
    prop_image.save()
    from .serializers import PropertyImageSerializer
    return Response(PropertyImageSerializer(prop_image).data, status=201)

logger = logging.getLogger(__name__)

from .models import (
    Property, PropertyImage, PropertyFee, PropertyDocument,
    ClientProfile, ExchangeID, PropertyEnrollment,
    CustomUser, PropertyLike
)
from .serializers import (
    PropertyListSerializer, PropertyDetailSerializer,
    PropertyImageSerializer, PropertyFeeSerializer,
    ClientProfileSerializer, ClientProfileMinimalSerializer, ExchangeIDSerializer,
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
    @action(detail=True, methods=['delete'], url_path='documents/(?P<doc_id>[^/.]+)', permission_classes=[IsAuthenticated])
    def delete_document(self, request, reference_number=None, doc_id=None):
        """Delete a document by ID for this property"""
        property_obj = self.get_object()
        try:
            doc = property_obj.documents.get(id=doc_id)
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PropertyDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    queryset = Property.objects.with_relations()
    serializer_class = PropertyListSerializer
    pagination_class = PropertyPagination
    lookup_field = 'reference_number'
    
    @action(detail=True, methods=['get', 'post'], url_path='documents', permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def documents(self, request, reference_number=None):
        """
        GET: List all documents for this property
        POST: Upload a new document for this property
        """
        property_obj = self.get_object()
        if request.method == 'GET':
            docs = property_obj.documents.all()
            serializer = PropertyDocumentSerializer(docs, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            file = request.FILES.get('file')
            document_type = request.data.get('document_type')
            if not file or not document_type:
                return Response({'error': 'Missing file or document_type'}, status=status.HTTP_400_BAD_REQUEST)
            doc = PropertyDocument.objects.create(
                property=property_obj,
                document_type=document_type,
                file=file,
                filename=file.name,
                uploaded_by=request.user
            )
            serializer = PropertyDocumentSerializer(doc)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer

    def get_queryset(self):
        queryset = Property.objects.with_relations()

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
        """Override create to add better error logging and always return up-to-date data (including reference_number)"""
        logger.info(f"PropertyViewSet.create - Incoming data: {request.data}")
        logger.warning(f"[DEBUG] PropertyViewSet.create: incoming total_sf={request.data.get('total_sf')}")
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            instance = serializer.instance
            # Re-serialize the saved instance to ensure all fields (like reference_number) are present
            response_serializer = self.get_serializer(instance)
            headers = self.get_success_headers(response_serializer.data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"PropertyViewSet.create failed: {str(e)}")
            logger.error(f"Validation errors: {getattr(serializer, 'errors', 'No errors attr')}")
            raise
    
    def perform_create(self, serializer):
        # Log incoming data for debugging
        logger.info(f"PropertyViewSet.perform_create - Request data: {self.request.data}")

        # Always auto-generate a reference number if not provided
        ref = serializer.validated_data.get('reference_number')
        ptype = serializer.validated_data.get('property_type') or 'Misc.'
        if not ref:
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
    """
    Get list of properties liked by current user with exchange ID information
    Returns: {
        'liked_properties': ['REF1', 'REF2'],  # For backwards compatibility
        'likes_detail': [
            {'property_ref': 'REF1', 'exchange_id': 1, 'exchange_id_name': 'E-1004-01'},
            ...
        ]
    }
    """
    likes = PropertyLike.objects.filter(user=request.user).select_related('property', 'exchange_id')
    property_ids = [like.property.reference_number for like in likes]
    
    # Detailed likes with exchange ID info
    likes_detail = [
        {
            'property_ref': like.property.reference_number,
            'property_title': like.property.title,
            'exchange_id': like.exchange_id.id,
            'exchange_id_name': like.exchange_id.exchange_id
        }
        for like in likes
    ]
    
    return Response({
        'liked_properties': property_ids,
        'likes_detail': likes_detail
    })


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
        return ExchangeID.objects.filter(user=user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Associate exchange ID with current user"""
        serializer.save(user=self.request.user)


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
            user=request.user
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


class ClientCRMProfileSerializer(serializers.ModelSerializer):
    """Minimal serializer for CRM listing using ONLY fields from initial migration.
    Production DB only has: id, client_id, client_alias, investment_thesis, financial_goals, 
    risk_reward, created_at, updated_at, user
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='user.phone', read_only=True)
    # Extra user fields for CRM display
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    user_date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    user_last_login = serializers.DateTimeField(source='user.last_login', read_only=True, allow_null=True)
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user',
            'user_email', 'user_name', 'phone_number',
            'user_username', 'user_first_name', 'user_last_name',
            'user_type', 'user_is_active', 'user_date_joined', 'user_last_login',
            'client_id', 'client_alias',
            'risk_reward', 'have_qi', 'equity_rollover', 'date_of_birth',
            'created_at'
        ]
        read_only_fields = fields
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class ClientCRMDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single client profile view in CRM."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone_number = serializers.CharField(source='user.phone', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    user_date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    user_last_login = serializers.DateTimeField(source='user.last_login', read_only=True, allow_null=True)
    exchanges = serializers.SerializerMethodField()

    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user',
            'client_id', 'client_alias',
            'risk_reward', 'investment_thesis', 'financial_goals',
            'have_qi', 'qi_company_name', 'equity_rollover', 'sale_price', 'relinquish_closing_date',
            'date_of_birth', 'address', 'city', 'state', 'zip_code', 'country',
            'created_at', 'updated_at',
            'user_email', 'user_username', 'user_first_name', 'user_last_name',
            'phone_number', 'user_type', 'user_is_active', 'user_date_joined', 'user_last_login',
            'exchanges'
        ]
        read_only_fields = fields

    def get_exchanges(self, obj):
        qs = ExchangeID.objects.filter(user_id=obj.user_id).only(
            'exchange_id', 'sale_price', 'equity_rollover', 'closing_date', 'created_at', 'updated_at'
        ).order_by('-created_at')
        return ExchangeIDSerializer(qs, many=True).data

class ClientCRMViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin/Staff/Referrer client listing with optional search & filtering.
    GET /api/se/client-profiles/ (paginated)
    Supports ?search=, ?risk_reward=, ?added_by=<user_id>
    """
    serializer_class = ClientCRMProfileSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        user = self.request.user
        try:
            # Only fetch fields that exist in production DB (from 0001_initial.py)
            # Also explicitly fetch user fields needed by serializer
            base = ClientProfile.objects.select_related('user').only(
                'id', 'user', 'client_id', 'client_alias',
                'investment_thesis', 'financial_goals', 'risk_reward',
                'have_qi', 'equity_rollover', 'date_of_birth',
                'sale_price', 'relinquish_closing_date',
                'address', 'city', 'state', 'zip_code', 'country', 'qi_company_name',
                'created_at', 'updated_at', 'added_by_id',
                'user__id', 'user__email', 'user__first_name', 'user__last_name', 'user__phone',
                'user__username', 'user__user_type', 'user__is_active', 'user__date_joined', 'user__last_login'
            ).order_by('-created_at')
            
            # Permissions: admin/staff see all; lead_referrer see their clients; others none
            if getattr(user, 'user_type', None) in ['admin', 'staff']:
                qs = base
            elif getattr(user, 'user_type', None) == 'lead_referrer':
                qs = base.filter(added_by=user)
            else:
                return ClientProfile.objects.none()

            # Filters (only use fields that exist in production DB)
            search = self.request.query_params.get('search')
            if search:
                qs = qs.filter(
                    Q(user__email__icontains=search) |
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search)
                )
            risk = self.request.query_params.get('risk_reward')
            if risk:
                qs = qs.filter(risk_reward__iexact=risk.capitalize())
            # Optional: allow admin/staff to filter by referrer id
            added_by = self.request.query_params.get('added_by')
            if added_by and getattr(user, 'user_type', None) in ['admin', 'staff']:
                qs = qs.filter(added_by_id=added_by)
            return qs
        except Exception as e:
            logger.error(f"ClientCRMViewSet.get_queryset error: {e}", exc_info=True)
            return ClientProfile.objects.none()

    def retrieve(self, request, *args, **kwargs):
        """Return detailed profile including exchanges for single client."""
        instance = self.get_object()
        ser = ClientCRMDetailSerializer(instance)
        return Response(ser.data)



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
    # Use .only() to limit columns fetched (production DB may not have all fields)
    try:
        profile = ClientProfile.objects.only(
            'id', 'user', 'client_id', 'client_alias',
            'investment_thesis', 'financial_goals', 'risk_reward',
            'created_at', 'updated_at'
        ).select_related('user').get(user=request.user)
    except ClientProfile.DoesNotExist:
        # Create with only safe fields
        profile = ClientProfile.objects.create(user=request.user)
    
    if request.method == 'GET':
        # Return only production-safe fields to avoid 500s on older schemas
        ser = ClientProfileMinimalSerializer(profile)
        return Response(ser.data)

    # PATCH (partial update)
    # Accept only fields that are safe and present in initial schema
    allowed = {
        'investment_thesis', 'financial_goals', 'risk_reward', 'phone_number',
        'date_of_birth', 'have_qi', 'qi_company_name', 'equity_rollover',
        'address', 'city', 'state', 'zip_code', 'country'
    }
    incoming = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
    filtered = {k: v for k, v in incoming.items() if k in allowed}
    logger.info(f"PATCH /api/se/profile/ incoming payload: {filtered}")
    ser = ClientProfileMinimalSerializer(profile, data=filtered, partial=True)
    if ser.is_valid():
        ser.save()
        logger.info(f"PATCH /api/se/profile/ saved profile: {ser.data}")
        return Response(ser.data)
    logger.error(f"PATCH /api/se/profile/ serializer errors: {ser.errors}")
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

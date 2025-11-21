"""
API Serializers for SE section models
Converts Django models to JSON for React frontend
"""
from rest_framework import serializers
from .models import (
    Property, PropertyImage, PropertyFee, PropertyDocument,
    ClientProfile, ExchangeID, PropertyEnrollment,
    CustomUser, PropertyLike
)


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images"""
    image_url = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = PropertyImage
        fields = ['id', 'property', 'image', 'image_url', 'order']

    def get_image_url(self, obj):
        return obj.get_image_url()


class PropertyFeeSerializer(serializers.ModelSerializer):
    """Serializer for property fees (aligned with model fields)"""
    class Meta:
        model = PropertyFee
        fields = ['id', 'fee_type', 'rate', 'amount', 'description']


class PropertyDocumentSerializer(serializers.ModelSerializer):
    """Serializer for property documents"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyDocument
        fields = ['id', 'document_type', 'file_url', 'filename', 'uploaded_at']
    
    def get_file_url(self, obj):
        try:
            return obj.file.url if obj.file else None
        except Exception:
            return None


class PropertyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for property lists (with legacy-friendly field names)
    Defensive against null/dirty numeric values in production DB.
    """
    # Map legacy/expected field names to current model fields
    property_name = serializers.CharField(source='title')
    # Use safe getters for numeric fields to avoid 500s when DB has NULLs
    purchase_price = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    cash_on_cash = serializers.SerializerMethodField()
    cap_rate = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'reference_number', 'property_name', 'property_type',
            'address', 'city', 'state', 'zip_code',
            'purchase_price', 'price', 'cap_rate', 'cash_on_cash',
            'status', 'is_active', 'close_date',
            'primary_image', 'images', 'created_at', 'ltv', 'current_noi'
        ]
    
    def _safe_decimal(self, value, default=0):
        """Return a Decimal/number or default when value is None/invalid."""
        try:
            return value if value is not None else default
        except Exception:
            return default

    def get_purchase_price(self, obj):
        return self._safe_decimal(getattr(obj, 'purchase_price', None), 0)

    def get_price(self, obj):
        # Back-compat alias used by some frontend bits
        return self.get_purchase_price(obj)
    
    def get_cash_on_cash(self, obj):
        return self._safe_decimal(getattr(obj, 'est_cash_on_cash', None), None)

    def get_cap_rate(self, obj):
        return self._safe_decimal(getattr(obj, 'cap_rate', None), None)
    
    def get_images(self, obj):
        # Return a list of plain image URLs for frontend carousel/components
        return [img.get_image_url() for img in obj.images.all() if img.get_image_url()]
    
    def get_primary_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            url = first_image.get_image_url()
            if url:
                return url
        return None


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single property view"""
    images = serializers.SerializerMethodField()
    fees = PropertyFeeSerializer(many=True, read_only=True)
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    broker_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    broker_name_display = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = '__all__'
    
    def get_images(self, obj):
        # Return full image objects (with id, url, etc) for frontend
        return PropertyImageSerializer(obj.images.all(), many=True).data
    
    def get_broker_name_display(self, obj):
        if obj.broker_user:
            return f"{obj.broker_user.first_name} {obj.broker_user.last_name}"
        return obj.broker_name or None
    
    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}"
        return None
    
    def get_like_count(self, obj):
        return obj.likes.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PropertyLike.objects.filter(
                user=request.user,
                property=obj
            ).exists()
        return False


class ExchangeIDSerializer(serializers.ModelSerializer):
    """Serializer for Exchange IDs"""
    client_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExchangeID
        fields = [
            'id', 'exchange_id', 'user', 'client_name',
            'sale_price', 'equity_rollover', 'closing_date',
            'created_at'
        ]
        read_only_fields = ['exchange_id', 'user', 'created_at']
    
    def get_client_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return None


class ClientProfileSerializer(serializers.ModelSerializer):
    """Serializer for client profiles"""
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    exchange_ids = ExchangeIDSerializer(many=True, read_only=True)
    # Map phone_number to CustomUser.phone
    phone_number = serializers.CharField(source='user.phone', required=False, allow_blank=True, allow_null=True)
    # Persisted optional fields
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    zip_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    country = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    qi_company_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'phone_number', 'date_of_birth', 'address',
            'city', 'state', 'zip_code', 'country',
            'risk_reward', 'have_qi', 'qi_company_name',
            'equity_rollover', 'exchange_ids'
        ]
        read_only_fields = ['user', 'user_email', 'user_name', 'exchange_ids']
    
    def to_internal_value(self, data):
        """Sanitize and validate incoming data."""
        import logging
        import re
        logger = logging.getLogger(__name__)
        logger.info(f"ClientProfileSerializer.to_internal_value - Incoming data: {data}")
        
        if isinstance(data, dict):
            data = data.copy()
            
            # Handle date_of_birth empty string
            if 'date_of_birth' in data:
                dob = data.get('date_of_birth')
                if dob == '' or dob is None:
                    data['date_of_birth'] = None
            
            # Handle equity_rollover: strip currency formatting
            if 'equity_rollover' in data:
                equity = data.get('equity_rollover')
                if equity == '' or equity is None:
                    data['equity_rollover'] = None
                elif isinstance(equity, str):
                    # Remove $, commas, and spaces
                    cleaned = re.sub(r'[^0-9.]', '', equity)
                    data['equity_rollover'] = cleaned if cleaned else None
            
            # Handle risk_reward empty string -> None
            if 'risk_reward' in data:
                rr = data.get('risk_reward')
                if rr == '' or rr is None:
                    data['risk_reward'] = None
                else:
                    # Normalize lowercase inputs (frontend sends low/medium/high)
                    mapping = {'low': 'Low', 'medium': 'Medium', 'high': 'High'}
                    data['risk_reward'] = mapping.get(str(rr).lower(), rr)
        
        result = super().to_internal_value(data)
        logger.info(f"ClientProfileSerializer.to_internal_value - After validation: {result}")
        return result
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return None

    def to_representation(self, instance):
        """Ensure missing UI fields exist in response with empty defaults."""
        import logging
        logger = logging.getLogger(__name__)
        
        rep = super().to_representation(instance)
        logger.info(f"ClientProfileSerializer.to_representation - Raw rep: {rep}")
        
        # Convert None to empty string for frontend, but preserve actual values
        for k in ['date_of_birth', 'address', 'city', 'state', 'zip_code', 'country', 'qi_company_name']:
            if k not in rep or rep[k] is None:
                rep[k] = ''
        
        # Ensure phone_number key always present
        if 'phone_number' not in rep or rep['phone_number'] is None:
            rep['phone_number'] = ''

        # Normalize risk_reward to lowercase for UX select consistency
        if 'risk_reward' in rep and rep['risk_reward']:
            rep['risk_reward'] = rep['risk_reward'].lower()
        
        logger.info(f"ClientProfileSerializer.to_representation - Final rep: {rep}")
        return rep

    def update(self, instance, validated_data):
        """Allow updating supported fields. Map phone_number to user.phone and persist contact fields."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"ClientProfileSerializer.update - validated_data keys: {validated_data.keys()}")
        logger.info(f"ClientProfileSerializer.update - validated_data: {validated_data}")
        
        # Handle nested source mapping for user.phone
        user_data = validated_data.pop('user', {}) if 'user' in validated_data else {}
        phone = user_data.get('phone')
        if phone is not None and instance.user:
            instance.user.phone = phone
            instance.user.save()
            logger.info(f"Saved user.phone: {phone}")

        # Persist supported profile fields including contact info
        for field in [
            'risk_reward', 'have_qi', 'equity_rollover',
            'address', 'city', 'state', 'zip_code', 'country',
            'date_of_birth', 'qi_company_name'
        ]:
            if field in validated_data:
                value = validated_data[field]
                setattr(instance, field, value)
                logger.info(f"Setting {field} = {value}")
            else:
                logger.warning(f"Field {field} NOT in validated_data")

        instance.save()
        logger.info(f"ClientProfile saved successfully")
        return instance


class ClientProfileMinimalSerializer(serializers.ModelSerializer):
    """Minimal, production-safe serializer for profile_me endpoint.
    Includes only fields guaranteed by the initial migration, plus basic user info.
    """
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            'id', 'client_id', 'client_alias',
            'investment_thesis', 'financial_goals', 'risk_reward',
            'user_email', 'user_name', 'phone_number'
        ]
        read_only_fields = ['client_id', 'client_alias']

    def get_user_email(self, obj):
        return obj.user.email if getattr(obj, 'user', None) else None

    def get_user_name(self, obj):
        u = getattr(obj, 'user', None)
        if not u:
            return None
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email


class PropertyEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for property enrollments"""
    property_name = serializers.SerializerMethodField()
    exchange_id_number = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyEnrollment
        fields = [
            'id', 'property', 'property_name', 'exchange_id',
            'exchange_id_number', 'enrolled_date', 'close_date',
            'status', 'notes'
        ]
    
    def get_property_name(self, obj):
        return obj.property.property_name if obj.property else None
    
    def get_exchange_id_number(self, obj):
        return obj.exchange_id.exchange_id if obj.exchange_id else None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'user_type', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties with sensible defaults"""
    
    # Override fields to allow blank/null for validation
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    property_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    close_date = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model = Property
        fields = '__all__'
        extra_kwargs = {
            # Allow partial updates/creates from frontend forms
            'reference_number': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
    
    def to_internal_value(self, data):
        """Add defaults BEFORE validation runs"""
        import logging
        from datetime import date, timedelta
        logger = logging.getLogger(__name__)

        # Make a mutable copy
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        # DEBUG: Log incoming total_sf, ltv, current_noi values
        logger.warning(f"[DEBUG] Incoming total_sf: {data.get('total_sf')}")
        logger.warning(f"[DEBUG] Incoming ltv: {data.get('ltv')}")
        logger.warning(f"[DEBUG] Incoming current_noi: {data.get('current_noi')}")

        # Fill required text fields with defaults if missing
        data.setdefault('title', 'Untitled Property')
        data.setdefault('address', 'TBD')
        data.setdefault('property_type', 'Misc.')

        # Default close_date to 30 days from today if missing
        if 'close_date' not in data or not data.get('close_date'):
            data['close_date'] = (date.today() + timedelta(days=30)).isoformat()

        # Fill required numeric fields with defaults if missing
        numeric_defaults = {
            'total_sf': 0,
            'acres': 0,
            'total_units': 0,
            'vacancy_percent': 0,
            'vacant_sf': 0,
            'walt': 0,
            'purchase_price': 0,
            'cap_rate': 0,
            'current_noi': 0,
            'debt_amount': 0,
            'interest_rate': 0,
            'dscr': 0,
            'total_equity': 0,
            'ltv': 0,
            'current_funding': 0,
            'max_investors': 5,
            'current_investors': 0,
        }
        for k, v in numeric_defaults.items():
            data.setdefault(k, v)

        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"[DEBUG] update validated_data ltv: {validated_data.get('ltv')}")
        logger.warning(f"[DEBUG] update validated_data current_noi: {validated_data.get('current_noi')}")
        return super().update(instance, validated_data)

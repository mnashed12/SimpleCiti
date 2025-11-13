from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import date


# ============================================
# CONSTANTS - Shared across models
# ============================================

LEASE_STRUCTURE_CHOICES = [
    ('Gross', 'Gross'),
    ('Modified Gross', 'Modified Gross'),
    ('NN', 'NN'),
    ('NNN', 'NNN'),
    ('Mixed', 'Mixed'),
]

DISTRIBUTION_FREQUENCY_CHOICES = [
    ('Monthly', 'Monthly'),
    ('Quarterly', 'Quarterly'),
    ('Semi-Annually', 'Semi-Annually'),
    ('Annually', 'Annually'),
    ('At Exit', 'At Exit'),
]

RISK_REWARD_CHOICES = [
    ('Low', 'Low'),
    ('Medium', 'Medium'),
    ('High', 'High'),
]

# ============================================
# CUSTOM USER MODEL WITH USER TYPES
# ============================================

class CustomUserManager(BaseUserManager):
    """Custom user manager to handle user creation with user types"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Custom User model with built-in user type classification
    """
    USER_TYPE_CHOICES = [
        # Clients (External - Regular Users)
        ('client', 'Client'),
        
        # Internal Users
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        
        # External Partners
        ('lead_referrer', 'Lead Referrer'),
        ('property_broker', 'Property Broker'),
    ]
    
    # Make email unique and required
    email = models.EmailField(unique=True)
    
    # User type field
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='client',
        help_text='User classification and permission level'
    )
    
    # Additional fields
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Override username requirement
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"
    
    @property
    def is_client(self):
        return self.user_type == 'client'
    
    @property
    def is_admin_user(self):
        return self.user_type == 'admin'
    
    @property
    def is_staff_user(self):
        return self.user_type == 'staff'
    
    @property
    def is_lead_referrer(self):
        return self.user_type == 'lead_referrer'
    
    @property
    def is_property_broker(self):
        return self.user_type == 'property_broker'
    
    @property
    def is_internal_user(self):
        """Check if user is internal (admin or staff)"""
        return self.user_type in ['admin', 'staff']
    
    @property
    def is_external_partner(self):
        """Check if user is external partner (lead referrer or broker)"""
        return self.user_type in ['lead_referrer', 'property_broker']
        
    def save(self, *args, **kwargs):
    # Ensure username is always filled for AbstractUser constraint
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


# ============================================
# CLIENT PROFILE (for regular users/clients)
# ✅ UPDATED with added_by field
# ============================================

from django.db import models
from django.contrib.auth import get_user_model

class ClientProfile(models.Model):
    """
    Extended profile for Client users only.
    Contains investment preferences and client-specific data.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='client_profile',
        limit_choices_to={'user_type': 'client'}
    )
    
    # ✅ NEW: Track who added this client
    added_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clients_added',
        help_text='User who added this client (Staff/Admin/Referrer)',
        limit_choices_to={'user_type__in': ['admin', 'staff', 'lead_referrer']}
    )
    
    # Client ID System
    client_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        help_text='Auto-generated sequential ID (e.g., C-000001)'
    )
    client_alias = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        editable=False,
        help_text='Display alias (e.g., JOHND3826)'
    )
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    equity_rollover = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    relinquish_closing_date = models.DateField(null=True, blank=True)
    have_qi = models.BooleanField(default=False)

    # Investment Profile
    investment_thesis = models.TextField(blank=True, null=True)
    financial_goals = models.TextField(blank=True, null=True)
    risk_reward = models.CharField(
        max_length=10,
        choices=RISK_REWARD_CHOICES,
        blank=True,
        null=True
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Client Profile'
        verbose_name_plural = 'Client Profiles'
        ordering = ['client_id']
    
    def __str__(self):
        return f"{self.client_id} - {self.user.get_full_name()}"
    
    @staticmethod
    def generate_client_id():
        """Generate the next sequential Client ID in format C-000001"""
        last_profile = ClientProfile.objects.order_by('-client_id').first()
        
        if not last_profile or not last_profile.client_id:
            return "C-001004"
        
        # Extract the numeric part
        last_number = int(last_profile.client_id.split('-')[1])
        next_number = last_number + 1
        
        # Format with leading zeros (6 digits)
        return f"C-{next_number:06d}"
    
    @staticmethod
    def generate_client_alias(first_name, last_name, phone):
        """
        Generate display alias in format: JOHND3826
        (first 4 of last name + first initial + last 4 digits of mobile)
        """
        if not phone:
            return None
        
        # Extract only digits from phone
        phone_digits = ''.join(filter(str.isdigit, phone))
        
        if len(phone_digits) < 4:
            return None
        
        # Get last 4 digits of phone
        last_4_phone = phone_digits[-4:]
        
        # Get first 4 chars of last name (uppercase, pad if needed)
        last_name_part = last_name[:4].upper().ljust(4, 'X')
        
        # Get first initial
        first_initial = first_name[0].upper() if first_name else 'X'
        
        return f"{last_name_part}{first_initial}{last_4_phone}"

    def save(self, *args, **kwargs):
        # Auto-generate client_id if missing
        if not self.client_id:
            self.client_id = self.generate_client_id()
    
        # Auto-generate client_alias if missing and phone exists
        if not self.client_alias and self.user.phone:
            self.client_alias = self.generate_client_alias(
                first_name=self.user.first_name,
                last_name=self.user.last_name,
                phone=self.user.phone
            )
    
        super().save(*args, **kwargs)

# ============================================
# LEAD REFERRER PROFILE
# ============================================

class LeadReferrerProfile(models.Model):
    """
    Profile for Lead Referrers who bring clients to the platform.
    Tracks referrals and commissions.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='lead_referrer_profile'
    )
    
    # Referrer Information
    referrer_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        help_text='Auto-generated referrer ID (e.g., LR-000001)'
    )
    company_name = models.CharField(max_length=200, blank=True)
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Default commission rate percentage'
    )
    
    # Banking Information (for commission payments)
    bank_account_name = models.CharField(max_length=200, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_routing_number = models.CharField(max_length=50, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lead Referrer Profile'
        verbose_name_plural = 'Lead Referrer Profiles'
        ordering = ['referrer_id']
    
    def __str__(self):
        return f"{self.referrer_id} - {self.user.get_full_name()}"
    
    @staticmethod
    def generate_referrer_id():
        """Generate the next sequential Referrer ID"""
        last_profile = LeadReferrerProfile.objects.order_by('-referrer_id').first()
        
        if not last_profile or not last_profile.referrer_id:
            return "LR-000001"
        
        last_number = int(last_profile.referrer_id.split('-')[1])
        next_number = last_number + 1
        
        return f"LR-{next_number:06d}"
    
    def save(self, *args, **kwargs):
        if not self.referrer_id:
            self.referrer_id = self.generate_referrer_id()
        super().save(*args, **kwargs)


# ============================================
# PROPERTY BROKER PROFILE
# ============================================

class PropertyBrokerProfile(models.Model):
    """
    Profile for Property Brokers who submit properties to the platform.
    Can add properties that require admin approval.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='property_broker_profile',
        limit_choices_to={'user_type': 'property_broker'}
    )
    
    # Broker Information
    broker_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        help_text='Auto-generated broker ID (e.g., PB-000001)'
    )
    company_name = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    license_state = models.CharField(max_length=2, blank=True)
    
    # Commission Structure
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Default commission rate percentage'
    )
    
    # Banking Information
    bank_account_name = models.CharField(max_length=200, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_routing_number = models.CharField(max_length=50, blank=True)
    
    # Status & Verification
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    verification_date = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Property Broker Profile'
        verbose_name_plural = 'Property Broker Profiles'
        ordering = ['broker_id']
    
    def __str__(self):
        return f"{self.broker_id} - {self.user.get_full_name()}"
    
    @staticmethod
    def generate_broker_id():
        """Generate the next sequential Broker ID"""
        last_profile = PropertyBrokerProfile.objects.order_by('-broker_id').first()
        
        if not last_profile or not last_profile.broker_id:
            return "PB-000001"
        
        last_number = int(last_profile.broker_id.split('-')[1])
        next_number = last_number + 1
        
        return f"PB-{next_number:06d}"
    
    def save(self, *args, **kwargs):
        if not self.broker_id:
            self.broker_id = self.generate_broker_id()
        super().save(*args, **kwargs)

# ============================================
# PROPERTY MODEL (Updated with new user references)
# ============================================

class PropertyQuerySet(models.QuerySet):
    """Custom queryset with common query patterns"""
    
    def active(self):
        """Returns only active properties"""
        return self.filter(is_active=True)
    
    def pipeline(self):
        """Returns only pipeline properties"""
        return self.filter(is_pipeline=True)
    
    def approved(self):
        """Returns only approved properties"""
        return self.filter(status='approved')
    
    def with_relations(self):
        """Optimized query that prefetches all related data to avoid N+1 queries"""
        return self.select_related(
            'broker_user',
            'created_by', 
            'submitted_by',
            'reviewed_by'
        ).prefetch_related(
            'images',
            'fees',
            'documents',
            'enrollments'
        )


class PropertyManager(models.Manager):
    """Custom manager for Property model"""
    
    def get_queryset(self):
        return PropertyQuerySet(self.model, using=self._db)
    
    def active(self):
        return self.get_queryset().active()
    
    def pipeline(self):
        return self.get_queryset().pipeline()
    
    def approved(self):
        return self.get_queryset().approved()
    
    def with_relations(self):
        return self.get_queryset().with_relations()


class Property(models.Model):
    # ============================================
    # BASIC INFORMATION
    # ============================================
    reference_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    title = models.CharField(max_length=200)
    property_header = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text='Short subtitle/header (max 150 characters)'
    )
    address = models.TextField()
    property_type = models.CharField(max_length=50)
    strategies = models.JSONField(
        default=list,
        blank=True,
        help_text='Up to 4 value-add strategies'
    )
    
    # ============================================
    # MARKETING & PRESENTATION
    # ============================================
    marketing_title = models.CharField(
        max_length=100,
        blank=True,
        help_text='Hero marketing title (3-6 words)'
    )
    hero_summary = models.TextField(
        blank=True,
        help_text='AI-generated marketing summary'
    )
    is_featured = models.BooleanField(
        default=False,
        help_text='Featured deal on homepage'
    )
    
    # ============================================
    # KEY DATES
    # ============================================
    loi_date = models.DateField(null=True, blank=True, verbose_name='LOI Date')
    psa_date = models.DateField(null=True, blank=True, verbose_name='PSA Date')
    dd_end_date = models.DateField(null=True, blank=True, verbose_name='Due Diligence End Date')
    close_date = models.DateField(verbose_name='Closing Date')
    
    # ============================================
    # DEAL STAGE
    # ============================================
    STAGE_CHOICES = [
        ('LOI_OUT', 'LOI OUT'),
        ('LOI_NEGOTIATING', 'LOI Received & Negotiating'),
        ('LOI_ACCEPTED', 'LOI Accepted Initiating Legal'),
        ('CONTRACT_NEGOTIATION', 'Contract Negotiation'),
        ('CONTRACT_SIGNED', 'Contract Signed'),
        ('IN_DUE_DILIGENCE', 'Soft Deposit Wired, In Due Diligence'),
    ]
    deal_stage = models.CharField(
        max_length=50,
        choices=STAGE_CHOICES,
        default='LOI_OUT',
        help_text='Current stage of the deal'
    )
    
    # ============================================
    # BUILDING INFORMATION
    # ============================================
    total_sf = models.IntegerField(verbose_name='Total Square Feet')
    acres = models.DecimalField(max_digits=8, decimal_places=2)
    total_units = models.IntegerField()
    vacancy_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Vacancy %')
    vacant_sf = models.IntegerField(verbose_name='Vacant Square Feet')
    walt = models.DecimalField(max_digits=4, decimal_places=1, verbose_name='WALT (Years)')
    
    # ============================================
    # LOCATION
    # ============================================
    city = models.CharField(max_length=100, blank=True, help_text='City')
    state = models.CharField(max_length=2, blank=True, help_text='State abbreviation')
    zip_code = models.CharField(max_length=10, blank=True, help_text='ZIP code')
    submarket = models.CharField(max_length=200, blank=True, help_text='Auto-filled by Google Maps')
    location_highlights = models.TextField(blank=True, help_text='Key location advantages')
    
    # ============================================
    # FINANCIAL - PRIMARY
    # ============================================
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    cap_rate = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Cap Rate %')
    current_noi = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Current NOI')
    debt_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Interest Rate %')
    dscr = models.DecimalField(max_digits=4, decimal_places=2, verbose_name='DSCR')
    total_equity = models.DecimalField(max_digits=12, decimal_places=2)
    ltv = models.IntegerField(verbose_name='LTV %')
    
    # ============================================
    # FINANCIAL - EXTENDED
    # ============================================
    est_annual_cash_flow = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Estimated Annual Cash Flow'
    )
    per_100k = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Cash Flow Per $100k'
    )
    est_cash_on_cash = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Estimated Cash-on-Cash %'
    )
    distribution_frequency = models.CharField(
        max_length=50,
        blank=True,
        choices=DISTRIBUTION_FREQUENCY_CHOICES
    )
    
    # ============================================
    # TENANT INFORMATION
    # ============================================
    num_tenants = models.IntegerField(null=True, blank=True, verbose_name='Number of Tenants')
    occupancy_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Occupancy %'
    )
    lease_structure = models.CharField(
        max_length=50,
        blank=True,
        choices=LEASE_STRUCTURE_CHOICES
    )

    # Tenancy Hero Comments
    tenancy_hero = models.TextField(
        blank=True,
        default='',
        verbose_name='Tenancy Hero Comments',
        help_text='Additional comments for tenancy section'
    )
    
    # Individual lease structures for each tenant
    tenant_1_lease_structure = models.CharField(
        max_length=50,
        blank=True,
        choices=LEASE_STRUCTURE_CHOICES,
        verbose_name='Tenant 1 Lease Structure'
    )
    
    tenant_2_lease_structure = models.CharField(
        max_length=50,
        blank=True,
        choices=LEASE_STRUCTURE_CHOICES,
        verbose_name='Tenant 2 Lease Structure'
    )
    
    tenant_3_lease_structure = models.CharField(
        max_length=50,
        blank=True,
        choices=LEASE_STRUCTURE_CHOICES,
        verbose_name='Tenant 3 Lease Structure'
    )
    
    # Update commission field (if not already present)
    commission = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Commission %'
    )
    
    # Also add broker_cell if missing
    broker_cell = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Broker Cell Phone'
    )
    
    # Top Tenant 1
    tenant_1_name = models.CharField(max_length=200, blank=True)
    tenant_1_sf = models.IntegerField(null=True, blank=True, verbose_name='Tenant 1 SF Leased')
    tenant_1_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='% of NRA'
    )
    tenant_1_expiry = models.DateField(null=True, blank=True, verbose_name='Lease Expiry')
    tenant_1_guarantee = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Corporate/Personal Guarantee'
    )
    
    # Top Tenant 2
    tenant_2_name = models.CharField(max_length=200, blank=True)
    tenant_2_sf = models.IntegerField(null=True, blank=True, verbose_name='Tenant 2 SF Leased')
    tenant_2_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='% of NRA'
    )
    tenant_2_expiry = models.DateField(null=True, blank=True, verbose_name='Lease Expiry')
    tenant_2_guarantee = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Corporate/Personal Guarantee'
    )
    
    # Top Tenant 3
    tenant_3_name = models.CharField(max_length=200, blank=True)
    tenant_3_sf = models.IntegerField(null=True, blank=True, verbose_name='Tenant 3 SF Leased')
    tenant_3_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='% of NRA'
    )
    tenant_3_expiry = models.DateField(null=True, blank=True, verbose_name='Lease Expiry')
    tenant_3_guarantee = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Corporate/Personal Guarantee'
    )
    
    # ============================================
    # BUSINESS PLAN & KBIS
    # ============================================
    business_plan = models.TextField(blank=True, help_text='Value-add strategy and exit plan')
    kbi_1 = models.CharField(max_length=200, blank=True, verbose_name='Key Business Initiative #1')
    kbi_2 = models.CharField(max_length=200, blank=True, verbose_name='Key Business Initiative #2')
    kbi_3 = models.CharField(max_length=200, blank=True, verbose_name='Key Business Initiative #3')
    kbi_4 = models.CharField(max_length=200, blank=True, verbose_name='Key Business Initiative #4')
    
    # ============================================
    # INVESTMENT STATUS
    # ============================================
    current_funding = models.DecimalField(max_digits=12, decimal_places=2)
    max_investors = models.IntegerField()
    current_investors = models.IntegerField()
    is_active = models.BooleanField(default=True)
    is_pipeline = models.BooleanField(default=False)
    
    # ============================================
    # PROJECTED RETURNS
    # ============================================
    projected_irr = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Projected IRR percentage"
    )
    hold_period_years = models.IntegerField(
        default=5,
        help_text="Expected hold period in years"
    )
    
    # ============================================
    # BROKER INFORMATION (Legacy - kept for backwards compatibility)
    # ============================================
    broker_name = models.CharField(max_length=200, blank=True, default='')
    broker_email = models.EmailField(blank=True, default='')
    broker_phone = models.CharField(max_length=20, blank=True, default='')
    broker_company = models.CharField(max_length=200, blank=True, default='')
    broker_notes = models.TextField(blank=True, default='')
    
    # NEW: Link to Property Broker user
    broker_user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'user_type': 'property_broker'},
        related_name='brokered_properties',
        help_text='Property Broker who submitted this property'
    )
    
    # ============================================
    # INTERNAL NOTES
    # ============================================
    internal_notes = models.TextField(blank=True, help_text='Internal deal notes and comments')
    
    # ============================================
    # PROGRESS TRACKING
    # ============================================
    completion_percentage = models.IntegerField(default=0, help_text='Form completion %')
    
    # ============================================
    # APPROVAL WORKFLOW
    # ============================================
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text='Approval status of the property'
    )
    
    submitted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='properties_submitted',
        help_text='User who submitted this property'
    )
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When property was submitted for review'
    )
    
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='properties_reviewed',
        help_text='Admin who reviewed this property'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When property was reviewed'
    )
    
    admin_notes = models.TextField(
        blank=True,
        help_text='Admin notes about approval/denial'
    )
    
    # ============================================
    # METADATA
    # ============================================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='properties_created'
    )
    
    # Custom manager
    objects = PropertyManager()
    
    class Meta:
        verbose_name = "SimpleEXCHANGE - Deal"
        verbose_name_plural = "SimpleEXCHANGE - Deals"
        ordering = ['-close_date']
        indexes = [
            models.Index(fields=['reference_number'], name='prop_ref_number_idx'),
            models.Index(fields=['is_active', '-close_date'], name='prop_active_close_idx'),
            models.Index(fields=['property_type', 'is_active'], name='prop_type_active_idx'),
            models.Index(fields=['status', 'is_active'], name='prop_status_active_idx'),
            models.Index(fields=['broker_user', '-created_at'], name='prop_broker_created_idx'),
            models.Index(fields=['is_pipeline'], name='prop_pipeline_idx'),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.reference_number})"
    
    def calculate_completion_percentage(self):
        """Calculate form completion percentage"""
        required_fields = [
            'title', 'address', 'property_type', 'total_sf', 'acres',
            'total_units', 'vacancy_percent', 'vacant_sf', 'walt',
            'purchase_price', 'cap_rate', 'current_noi', 'debt_amount',
            'interest_rate', 'dscr', 'total_equity', 'ltv', 'close_date',
            'marketing_title', 'kbi_1', 'business_plan'
        ]
        
        filled = sum(1 for field in required_fields if getattr(self, field, None))
        return round((filled / len(required_fields)) * 100)
    
    def save(self, *args, **kwargs):
        # Auto-calculate completion percentage
        self.completion_percentage = self.calculate_completion_percentage()
        super().save(*args, **kwargs)


# ============================================
# PROPERTY DOCUMENTS MODEL
# ============================================

class PropertyDocument(models.Model):
    DOCUMENT_TYPES = [
        ('om', 'Offering Memorandum'),
        ('rentroll', 'Rent Roll'),
        ('proforma', 'Pro Forma'),
        ('tic', 'TIC Agreement'),
        ('environmental', 'Environmental Report'),
        ('legal', 'Legal Opinion'),
        ('operating', 'Operating Statements'),
        ('market', 'Market Research'),
        ('brochure', 'Marketing Brochure'),
        ('other', 'Other'),
    ]
    
    property = models.ForeignKey(Property, related_name='documents', on_delete=models.CASCADE)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='property_documents/')
    filename = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = "Property Document"
        verbose_name_plural = "Property Documents"
        ordering = ['document_type', '-uploaded_at']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.property.reference_number}"
    
    def save(self, *args, **kwargs):
        if self.file and not self.filename:
            self.filename = self.file.name
        super().save(*args, **kwargs)


# ============================================
# PROPERTY IMAGE MODEL
# ============================================

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image_url = models.URLField()
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "SimpleEXCHANGE - Image"
        verbose_name_plural = "SimpleEXCHANGE - Images"
        ordering = ['property', 'order']
    
    def __str__(self):
        return f"Image {self.order} for {self.property.title}"


# ============================================
# PROPERTY FEE MODEL
# ============================================

class PropertyFee(models.Model):
    property = models.ForeignKey(Property, related_name='fees', on_delete=models.CASCADE)
    fee_type = models.CharField(max_length=50)
    rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    description = models.CharField(max_length=200)
    
    class Meta:
        verbose_name = "Property Fee"
        verbose_name_plural = "Property Fees"
    
    def __str__(self):
        return f"{self.fee_type} for {self.property.title}"


# ============================================
# PROPERTY ENROLLMENT MODEL
# ============================================

class PropertyEnrollment(models.Model):
    """
    Stores initial enrollment information when user wants to view a property.
    This is collected before full account creation.
    """
    # Contact Information
    email = models.EmailField(help_text="User's email address")
    
    # Transaction Details
    sale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Sale price of relinquished asset"
    )
    equity_rollover = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Equity rollover for replacement 1031 asset"
    )
    close_date = models.DateField(null=True, blank=True, verbose_name='Closing Date')
    
    # Qualified Intermediary
    qi_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Qualified Intermediary name"
    )
    needs_qi_referral = models.BooleanField(
        default=False,
        help_text="Does user need QI referral?"
    )
    
    # Property Reference
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="Property they're interested in"
    )
    
    # Tracking Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of submission"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="Browser user agent"
    )
    
    # Future: Link to full User account when they create one
    user = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='property_enrollments',
        help_text="Linked user account (if created)"
    )
    
    class Meta:
        verbose_name = "Property Enrollment"
        verbose_name_plural = "Property Enrollments"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['property']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.property.reference_number} - {self.created_at.strftime('%m/%d/%Y')}"
    
    def get_days_until_closing(self):
        if self.close_date:
            delta = self.close_date - date.today()
            return max(0, delta.days)
        return None

    
    def get_is_45_day_deadline(self):
        days = self.get_days_until_closing()
        return days is not None and days <= 45

    
    def get_is_180_day_deadline(self):
        days = self.get_days_until_closing()
        return days is not None and days <= 180



# ============================================
# UPLOADED FILE MODEL
# ============================================

class UploadedFile(models.Model):
    title = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title


# ============================================
# NDA REQUEST MODEL
# ============================================

class NDARequest(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    address = models.TextField(blank=True, default='')
    reason = models.CharField(max_length=255, default='Not specified')
    document_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "NDA Request"
        verbose_name_plural = "NDA Requests"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({'Sent' if self.is_sent else 'Pending'})"


# ============================================
# LEASE AGREEMENT REQUEST MODEL
# ============================================

class LeaseAgreementRequest(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    document_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Commercial Lease - No Notary"
        verbose_name_plural = "Commercial Lease - No Notary"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({'Sent' if self.is_sent else 'Pending'})"


# ============================================
# LEASE AGREEMENT NOTARY REQUEST MODEL
# ============================================

class LeaseAgreementNotaryRequest(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    document_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Commercial Lease - Notary"
        verbose_name_plural = "Commercial Lease - Notary"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({'Sent' if self.is_sent else 'Pending'})"


# ============================================
# CHAT USAGE MODEL
# ============================================

class ChatUsage(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='chat_usage')
    message_count = models.IntegerField(default=0)
    first_message_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)
    email_sent_at_15 = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email} - {self.message_count} messages"

# ============================================
# EXCHANGE ID MODEL
# ============================================

class ExchangeID(models.Model):
    """
    Tracks exchange IDs for users. Format: E-1004-01
    - 1004 increments globally for each new submission
    - 01 increments per user for multiple exchanges
    """
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='exchange_ids',
        help_text='User who owns this exchange ID'
    )
    
    exchange_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        help_text='Auto-generated exchange ID (e.g., E-1004-01)'
    )
    
    # Form Data (customize these fields based on what you're collecting)
    sale_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sale price of relinquished property"
    )
    
    equity_rollover = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Equity to rollover"
    )
    
    closing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expected closing date"
    )
    
    # Add any other fields you need from the form here
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Exchange ID'
        verbose_name_plural = 'Exchange IDs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['exchange_id']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.exchange_id} - {self.user.email}"
    
    @staticmethod
    def generate_exchange_id(user):
        """
        Generate exchange ID in format E-1004-01
        - First number: Global counter (increments for every submission)
        - Second number: User's submission count (01, 02, 03, etc.)
        """
        # Get the global counter (highest first number across all exchange IDs)
        last_exchange = ExchangeID.objects.order_by('-id').first()
        
        if not last_exchange or not last_exchange.exchange_id:
            global_counter = 1004  # Starting number
        else:
            # Extract the global counter from last exchange ID (E-1004-01 -> 1004)
            parts = last_exchange.exchange_id.split('-')
            global_counter = int(parts[1]) + 1
        
        # Get user's submission count
        user_exchange_count = ExchangeID.objects.filter(user=user).count() + 1
        
        # Format: E-{global}-{user_count}
        return f"E-{global_counter:04d}-{user_exchange_count:02d}"
    
    def save(self, *args, **kwargs):
        if not self.exchange_id:
            self.exchange_id = self.generate_exchange_id(self.user)
        super().save(*args, **kwargs)
        
# ============================================
# PROPERTY LIKE MODEL
# ============================================

class PropertyLike(models.Model):
    """
    Tracks which properties users have liked for specific Exchange IDs
    """
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='property_likes'
    )
    
    exchange_id = models.ForeignKey(
        ExchangeID,
        on_delete=models.CASCADE,
        related_name='liked_properties'
    )
    
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Property Like'
        verbose_name_plural = 'Property Likes'
        unique_together = ['exchange_id', 'property']  # Can't like same property twice for same exchange ID
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.exchange_id.exchange_id} - {self.property.title}"

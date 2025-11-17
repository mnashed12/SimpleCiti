from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.core.mail import EmailMessage
from django.urls import reverse
from django.http import HttpResponseRedirect
from datetime import datetime
import requests
import os
import csv
from django.http import HttpResponse
import json

# Import your models
from .models import (
    CustomUser,
    ClientProfile,
    LeadReferrerProfile,
    PropertyBrokerProfile,
    NDARequest,
    LeaseAgreementRequest,
    LeaseAgreementNotaryRequest,
    Property,
    PropertyDocument,
    PropertyImage,
    PropertyFee,
    UploadedFile,
    PropertyEnrollment,
    ChatUsage
)
from .views import get_access_token

class ClientProfileInline(admin.StackedInline):
    model = ClientProfile
    can_delete = False
    verbose_name_plural = 'Client Profile'
    fk_name = 'user'
    readonly_fields = ['client_id', 'client_alias', 'added_by', 'created_at', 'updated_at']
# ============================================
# CUSTOM USER ADMIN
# ============================================

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    inlines = [ClientProfileInline]
    """
    Custom admin for CustomUser model with user type badges
    """
    list_display = [
        'email',
        'first_name',
        'last_name',
        'user_type_badge',
        'is_active',
        'is_staff',
        'date_joined'
    ]
    list_filter = ['user_type', 'is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('User Classification', {
            'fields': ('user_type',),
            'description': 'Determines user permissions and profile type'
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'phone', 'user_type'),
        }),
    )
    
    def user_type_badge(self, obj):
        """Display user type as colored badge"""
        colors = {
            'client': '#28a745',
            'admin': '#dc3545',
            'staff': '#007bff',
            'lead_referrer': '#ffc107',
            'property_broker': '#17a2b8',
        }
        color = colors.get(obj.user_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_user_type_display()
        )
    user_type_badge.short_description = 'User Type'

# ============================================
# CLIENT PROFILE ADMIN (Permission Controlled)
# ============================================

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    """
    Admin interface for Client Profiles
    
    ✅ CORRECTED PERMISSIONS:
    - Admin: Full access (add, view all, edit, delete)
    - Staff: Add, view all, NO EDIT, NO DELETE
    - Referral Partners: Add, view own only, NO EDIT, NO DELETE
    - Property Brokers: No access
    """
    list_display = [
        'client_id',
        'client_alias',
        'get_full_name',
        'get_email',
        'risk_reward',
        'added_by_display',
        'created_at'
    ]
    list_filter = ['risk_reward', 'created_at', 'added_by__user_type']
    search_fields = [
        'client_id',
        'client_alias',
        'user__email',
        'user__first_name',
        'user__last_name'
    ]
    readonly_fields = ['client_id', 'client_alias', 'created_at', 'updated_at', 'added_by']
    ordering = ['client_id']
    
    fieldsets = (
        ('Client Identification', {
            'fields': ('user', 'client_id', 'client_alias', 'added_by')
        }),
        ('Investment Profile', {
            'fields': ('investment_thesis', 'financial_goals', 'risk_reward')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Name'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
    
    def added_by_display(self, obj):
        """Show who added this client"""
        if obj.added_by:
            return format_html(
                '<span style="color: #666;">{} ({})</span>',
                obj.added_by.get_full_name(),
                obj.added_by.get_user_type_display()
            )
        return 'N/A'
    added_by_display.short_description = 'Added By'
    
    # ============================================
    # ✅ CORRECTED PERMISSION CONTROLS
    # ============================================
    
    def get_queryset(self, request):
        """Filter clients based on user type"""
        qs = super().get_queryset(request)
        
        if not request.user.is_authenticated:
            return qs.none()
        
        # Admin: see everything
        if request.user.user_type == 'admin':
            return qs
        
        # Staff: see everything (but can't edit/delete)
        elif request.user.user_type == 'staff':
            return qs
        
        # Referral Partners: see only their own referred clients
        elif request.user.user_type == 'lead_referrer':
            return qs.filter(added_by=request.user)
        
        # Property Brokers: no access
        elif request.user.user_type == 'property_broker':
            return qs.none()
        
        # Clients: no access to admin
        else:
            return qs.none()
    
    def has_module_permission(self, request):
        """Who can see the Client Profiles module"""
        return request.user.is_authenticated and request.user.user_type in ['admin', 'staff', 'lead_referrer']
    
    def has_add_permission(self, request):
        """Who can add clients"""
        return request.user.is_authenticated and request.user.user_type in ['admin', 'staff', 'lead_referrer']
    
    def has_change_permission(self, request, obj=None):
        """✅ CORRECTED: Only admin can edit - Staff CANNOT"""
        if request.user.is_authenticated and request.user.user_type == 'admin':
            return True
        return False
    
    def has_delete_permission(self, request, obj=None):
        """✅ CORRECTED: Only admin can delete - Staff CANNOT"""
        if request.user.is_authenticated and request.user.user_type == 'admin':
            return True
        return False
    
    def save_model(self, request, obj, form, change):
        """✅ Auto-stamp who added the client"""
        if not change:  # New client
            obj.added_by = request.user
        super().save_model(request, obj, form, change)


# ============================================
# LEAD REFERRER PROFILE ADMIN
# ============================================

@admin.register(LeadReferrerProfile)
class LeadReferrerProfileAdmin(admin.ModelAdmin):
    """Admin interface for Lead Referrer Profiles (Admin only)"""
    list_display = [
        'referrer_id',
        'get_full_name',
        'get_email',
        'company_name',
        'commission_rate',
        'is_active',
        'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = [
        'referrer_id',
        'company_name',
        'user__email',
        'user__first_name',
        'user__last_name'
    ]
    readonly_fields = ['referrer_id', 'created_at', 'updated_at']
    ordering = ['referrer_id']
    
    fieldsets = (
        ('Referrer Identification', {
            'fields': ('user', 'referrer_id', 'company_name')
        }),
        ('Commission Structure', {
            'fields': ('commission_rate',)
        }),
        ('Banking Information', {
            'fields': ('bank_account_name', 'bank_account_number', 'bank_routing_number'),
            'classes': ('collapse',),
            'description': 'For commission payments'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Name'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
    
    def has_module_permission(self, request):
        """Only admin can access"""
        return request.user.is_authenticated and request.user.user_type == 'admin'


# ============================================
# PROPERTY BROKER PROFILE ADMIN
# ============================================

@admin.register(PropertyBrokerProfile)
class PropertyBrokerProfileAdmin(admin.ModelAdmin):
    """Admin interface for Property Broker Profiles (Admin only)"""
    list_display = [
        'broker_id',
        'get_full_name',
        'get_email',
        'company_name',
        'license_state',
        'is_verified',
        'is_active',
        'created_at'
    ]
    list_filter = ['is_verified', 'is_active', 'license_state', 'created_at']
    search_fields = [
        'broker_id',
        'company_name',
        'license_number',
        'user__email',
        'user__first_name',
        'user__last_name'
    ]
    readonly_fields = ['broker_id', 'created_at', 'updated_at', 'verification_date']
    ordering = ['broker_id']
    
    fieldsets = (
        ('Broker Identification', {
            'fields': ('user', 'broker_id', 'company_name')
        }),
        ('License Information', {
            'fields': ('license_number', 'license_state')
        }),
        ('Commission Structure', {
            'fields': ('commission_rate',)
        }),
        ('Banking Information', {
            'fields': ('bank_account_name', 'bank_account_number', 'bank_routing_number'),
            'classes': ('collapse',),
            'description': 'For commission payments'
        }),
        ('Verification & Status', {
            'fields': ('is_verified', 'verification_date', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Name'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
    
    def has_module_permission(self, request):
        """Only admin can access"""
        return request.user.is_authenticated and request.user.user_type == 'admin'


# ============================================
# PROPERTY ADMIN (Permission Controlled)
# ============================================

class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 0
    readonly_fields = ['uploaded_at', 'filename']


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0


class PropertyFeeInline(admin.TabularInline):
    model = PropertyFee
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    """
    Admin interface for Properties with STRICT permission controls
    
    ✅ CORRECTED PERMISSIONS:
    - Admin: Full access, can approve/finalize, can edit approved properties
    - Staff: Add (draft only), view all, edit drafts only (NOT approved), NO delete
    - Property Brokers: Add (draft only), view own only, edit own drafts only, NO delete
    - Others: No access
    """
    list_display = [
        'reference_number',
        'title',
        'city',
        'state',
        'status_badge',
        'deal_stage',
        'is_featured',
        'completion_percentage',
        'close_date',
        'submitted_by_display'
    ]
    list_filter = [
        'status',
        'deal_stage',
        'is_featured',
        'is_active',
        'is_pipeline',
        'property_type',
        'state',
        'created_at',
        'submitted_by__user_type'
    ]
    search_fields = [
        'reference_number',
        'title',
        'address',
        'city',
        'broker_name',
        'broker_user__email',
        'submitted_by__email',
        'submitted_by__first_name',
        'submitted_by__last_name'
    ]
    readonly_fields = [
        'completion_percentage',
        'created_at',
        'updated_at',
        'submitted_at',
        'reviewed_at',
        'submitted_by',
        'reviewed_by'
    ]
    
    inlines = [PropertyImageInline, PropertyDocumentInline, PropertyFeeInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'reference_number',
                'title',
                'property_header',
                'address',
                'property_type',
                'strategies'
            )
        }),
        ('Marketing', {
            'fields': (
                'marketing_title',
                'hero_summary',
                'is_featured'
            ),
            'classes': ('collapse',)
        }),
        ('Location', {
            'fields': (
                'city',
                'state',
                'zip_code',
                'submarket',
                'location_highlights'
            )
        }),
        ('Key Dates', {
            'fields': (
                'loi_date',
                'psa_date',
                'dd_end_date',
                'close_date',
                'deal_stage'
            )
        }),
        ('Building Information', {
            'fields': (
                'total_sf',
                'acres',
                'total_units',
                'vacancy_percent',
                'vacant_sf',
                'walt'
            ),
            'classes': ('collapse',)
        }),
        ('Financial - Primary', {
            'fields': (
                'purchase_price',
                'cap_rate',
                'current_noi',
                'debt_amount',
                'interest_rate',
                'dscr',
                'total_equity',
                'ltv'
            )
        }),
        ('Financial - Extended', {
            'fields': (
                'est_annual_cash_flow',
                'per_100k',
                'est_cash_on_cash',
                'distribution_frequency'
            ),
            'classes': ('collapse',)
        }),
        ('Tenant Information', {
            'fields': (
                'num_tenants',
                'occupancy_percent',
                'lease_structure',
                'tenant_1_name',
                'tenant_1_sf',
                'tenant_1_percent',
                'tenant_1_expiry',
                'tenant_1_guarantee',
                'tenant_2_name',
                'tenant_2_sf',
                'tenant_2_percent',
                'tenant_2_expiry',
                'tenant_2_guarantee',
                'tenant_3_name',
                'tenant_3_sf',
                'tenant_3_percent',
                'tenant_3_expiry',
                'tenant_3_guarantee',
            ),
            'classes': ('collapse',)
        }),
        ('Business Plan', {
            'fields': (
                'business_plan',
                'kbi_1',
                'kbi_2',
                'kbi_3',
                'kbi_4'
            ),
            'classes': ('collapse',)
        }),
        ('Investment Status', {
            'fields': (
                'current_funding',
                'max_investors',
                'current_investors',
                'is_active',
                'is_pipeline'
            )
        }),
        ('Projected Returns', {
            'fields': (
                'projected_irr',
                'hold_period_years'
            )
        }),
        ('Broker Information', {
            'fields': (
                'broker_user',
                'broker_name',
                'broker_email',
                'broker_phone',
                'broker_company',
                'broker_notes'
            ),
            'classes': ('collapse',)
        }),
        ('Approval Workflow', {
            'fields': (
                'status',
                'submitted_by',
                'submitted_at',
                'reviewed_by',
                'reviewed_at',
                'admin_notes'
            )
        }),
        ('Internal', {
            'fields': (
                'internal_notes',
                'completion_percentage'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'draft': '#6c757d',
            'pending_review': '#ffc107',
            'approved': '#28a745',
            'denied': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def submitted_by_display(self, obj):
        """Display who submitted the property"""
        if obj.submitted_by:
            return format_html(
                '{} <span style="color: #666;">({})</span>',
                obj.submitted_by.get_full_name(),
                obj.submitted_by.get_user_type_display()
            )
        return "N/A"
    submitted_by_display.short_description = 'Submitted By'
    
    # ============================================
    # ✅ CORRECTED PERMISSION CONTROLS
    # ============================================
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        user_type = getattr(request.user, 'user_type', None)
    
        if user_type in ['admin', 'staff']:
            return qs
        elif user_type == 'property_broker':
            return qs.filter(submitted_by=request.user)
        else:
            return qs.none()

        
        # Admin: see everything
        if request.user.is_authenticated and getattr(request.user, 'user_type', None) == 'admin':
            return qs

        # Staff: see everything (but can't edit approved or delete)
        elif request.user.user_type == 'staff':
            return qs
        
        # Property Brokers: see only their own properties
        elif request.user.user_type == 'property_broker':
            return qs.filter(submitted_by=request.user)
        
        # Others: no access
        else:
            return qs.none()
    
    def get_readonly_fields(self, request, obj=None):
        """✅ Make approved properties read-only for Staff"""
        readonly = list(self.readonly_fields)
        
        # If property is approved and user is Staff, make everything readonly
        if obj and obj.status == 'approved' and request.user.user_type == 'staff':
            # Make almost everything readonly
            for fieldset in self.fieldsets:
                for field in fieldset[1]['fields']:
                    if isinstance(field, str) and field not in readonly:
                        readonly.append(field)
        
        return readonly
    
    def has_module_permission(self, request):
        user_type = getattr(request.user, 'user_type', None)
        return user_type in ['admin', 'staff', 'property_broker']
    
    def has_add_permission(self, request):
        """Who can add properties"""
        return request.user.is_authenticated and request.user.user_type in ['admin', 'staff', 'property_broker']
    
    def has_change_permission(self, request, obj=None):
        """✅ CORRECTED: Who can edit properties"""
        if not request.user.is_authenticated:
            return False
        
        # Admin: can edit everything
        if request.user.user_type == 'admin':
            return True
        
        # Staff: can edit drafts only (NOT approved)
        if request.user.user_type == 'staff':
            if obj and obj.status == 'approved':
                return False  # ✅ Cannot edit approved properties
            return True
        
        # Property Brokers: can edit own drafts only
        if request.user.user_type == 'property_broker':
            if obj and obj.submitted_by == request.user and obj.status == 'draft':
                return True
            return False
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """✅ CORRECTED: Only admin can delete (Staff CANNOT)"""
        return request.user.is_authenticated and request.user.user_type == 'admin'
        
    def save_model(self, request, obj, form, change):
        user_type = getattr(request.user, 'user_type', None)
    
        if not change:
            if request.user.is_authenticated:
                obj.created_by = request.user
                obj.submitted_by = request.user
            obj.status = 'draft'
            obj.is_active = False
            obj.is_pipeline = False
    
        if user_type == 'admin' and obj.status == 'approved':
            obj.reviewed_by = request.user
            obj.reviewed_at = datetime.now()
    
        super().save_model(request, obj, form, change)
    
    def response_change(self, request, obj):
        """✅ Custom response after editing - prevent Staff from editing approved"""
        if obj.status == 'approved' and request.user.user_type == 'staff':
            messages.warning(request, '⚠️ This property has been approved and cannot be edited by Staff.')
            return HttpResponseRedirect(reverse('admin:HomePage_property_changelist'))
        return super().response_change(request, obj)


# ============================================
# YOUR EXISTING ADMIN CODE (PRESERVED)
# ============================================

@admin.register(LeaseAgreementRequest)
class LeaseAgreementRequestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'created_at', 'is_sent')
    list_filter = ['is_sent', 'created_at']
    search_fields = ['full_name', 'email']
    ordering = ['-created_at']
    actions = ['send_invites']

    def send_invites(self, request, queryset):
        token = get_access_token()
        success_count = 0
        failure_count = 0

        for req in queryset.filter(is_sent=False):
            res = requests.post(
                f"https://api.signnow.com/document/{req.document_id}/invite",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "to": [{"email": req.email, "role": "Signer"}],
                    "from": os.getenv("SIGNNOW_USERNAME"),
                    "subject": "Please Sign Your Lease Agreement",
                    "message": "Click the link to sign your lease agreement."
                }
            )

            if res.status_code == 200:
                req.is_sent = True
                req.save()
                success_count += 1
            else:
                failure_count += 1
                messages.error(request, f"Failed to send to {req.email}: {res.text}")

        if success_count:
            messages.success(request, f"Sent SignNow invites to {success_count} user(s).")
        if not success_count and not failure_count:
            messages.info(request, "All selected requests were already sent.")

    send_invites.short_description = "Send SignNow invites to selected requests"


@admin.register(LeaseAgreementNotaryRequest)
class LeaseAgreementNotaryRequestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'created_at', 'is_sent')
    list_filter = ['is_sent', 'created_at']
    search_fields = ['full_name', 'email']
    ordering = ['-created_at']
    actions = ['send_invites']

    def send_invites(self, request, queryset):
        token = get_access_token()
        success_count = 0
        failure_count = 0

        for req in queryset.filter(is_sent=False):
            res = requests.post(
                f"https://api.signnow.com/document/{req.document_id}/invite",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "to": [{"email": req.email, "role": "Signer"}],
                    "from": os.getenv("SIGNNOW_USERNAME"),
                    "subject": "Please Sign Your Lease Agreement (Notary Required)",
                    "message": "Click the link to sign your lease agreement."
                }
            )

            if res.status_code == 200:
                req.is_sent = True
                req.save()
                success_count += 1
            else:
                failure_count += 1
                messages.error(request, f"Failed to send to {req.email}: {res.text}")

        if success_count:
            messages.success(request, f"Sent SignNow invites to {success_count} user(s).")
        if not success_count and not failure_count:
            messages.info(request, "All selected requests were already sent.")

    send_invites.short_description = "Send SignNow invites to selected requests"


@admin.register(NDARequest)
class NDARequestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'reason', 'created_at', 'is_sent', 'is_completed')
    list_filter = ['is_sent', 'is_completed', 'created_at']
    search_fields = ['full_name', 'email', 'reason']
    ordering = ['-created_at']
    actions = ['send_invites']

    def send_invites(self, request, queryset):
        token = get_access_token()
        success_count = 0
        failure_count = 0
    
        for req in queryset.filter(is_sent=False):
            try:
                webhook_url = "https://www.simpleciti.com/signnow-webhook/"
                
                # Simple invite without pre-filling
                invite_res = requests.post(
                    f"https://api.signnow.com/document/{req.document_id}/invite",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "to": [{"email": req.email, "role_id": "", "role": "Signer", "order": 1}],
                        "from": os.getenv("SIGNNOW_USERNAME"),
                        "subject": "Please Sign Your NDA",
                        "message": "Click the link to sign your NDA.",
                        "callback_url": webhook_url
                    }
                )
    
                if invite_res.status_code == 200:
                    req.is_sent = True
                    req.save()
                    success_count += 1
                else:
                    failure_count += 1
                    messages.error(request, f"Failed to send to {req.email}: {invite_res.text}")
    
            except Exception as e:
                failure_count += 1
                messages.error(request, f"Error processing {req.email}: {str(e)}")
    
        if success_count:
            messages.success(request, f"✅ Sent {success_count} invite(s)")
        if not success_count and not failure_count:
            messages.info(request, "All selected requests were already sent.")
    
    send_invites.short_description = "Send SignNow invites"


@admin.register(PropertyEnrollment)
class PropertyEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['email', 'sale_price', 'equity_rollover', 'property', 'close_date', 'created_at']
    list_filter = ['property', 'close_date', 'created_at']
    search_fields = [
        'email',
        'qi_name',
        'property__title',
        'property__reference_number',
        'ip_address'
    ]
    readonly_fields = [
        'created_at',
        'ip_address',
        'user_agent',
        'days_remaining',
        'deadline_status'
    ]
    fieldsets = (
        ('Contact Information', {
            'fields': ('email', 'user')
        }),
        ('Transaction Details', {
            'fields': (
                'sale_price',
                'equity_rollover',
                'closing_date',
                'days_remaining',
                'deadline_status'
            )
        }),
        ('Qualified Intermediary', {
            'fields': ('qi_name', 'needs_qi_referral')
        }),
        ('Property', {
            'fields': ('property',)
        }),
        ('Tracking', {
            'fields': ('created_at', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        })
    )
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def property_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:HomePage_property_change', args=[obj.property.pk])
        return format_html('<a href="{}">{}</a>', url, obj.property.reference_number)
    property_link.short_description = 'Property'

    def sale_price_formatted(self, obj):
        return f"${obj.sale_price:,.2f}"
    sale_price_formatted.short_description = 'Sale Price'
    sale_price_formatted.admin_order_field = 'sale_price'

    def equity_rollover_formatted(self, obj):
        return f"${obj.equity_rollover:,.2f}"
    equity_rollover_formatted.short_description = 'Equity Rollover'
    equity_rollover_formatted.admin_order_field = 'equity_rollover'

    def created_at_formatted(self, obj):
        return obj.created_at.strftime('%m/%d/%Y %I:%M %p')
    created_at_formatted.short_description = 'Submitted'
    created_at_formatted.admin_order_field = 'created_at'

    def days_remaining(self, obj):
        days = obj.get_days_until_closing()
        if days is None:
            return 'N/A'
        if days <= 45:
            return format_html('<span style="color: red; font-weight: bold;">{} days</span>', days)
        elif days <= 180:
            return format_html('<span style="color: orange; font-weight: bold;">{} days</span>', days)
        return f"{days} days"
    days_remaining.short_description = 'Days to Closing'

    def deadline_status(self, obj):
        days = obj.get_days_until_closing()
        if days is None:
            return 'N/A'
        status = []
        if days <= 45:
            status.append('🚨 45-Day ID Deadline!')
        if days <= 180:
            status.append('⚠️ 180-Day Purchase Deadline')
        if status:
            return format_html('<br>'.join(status))
        return '✅ No Immediate Deadlines'
    deadline_status.short_description = '1031 Deadlines'

    def has_qi(self, obj):
        if obj.needs_qi_referral:
            return '❓ Needs Referral'
        elif obj.qi_name:
            return f'✅ {obj.qi_name}'
        return '❌ None'
    has_qi.short_description = 'QI Status'

    def is_linked(self, obj):
        return '✅' if obj.user else '❌'
    is_linked.short_description = 'Linked'
    is_linked.boolean = True

    actions = ['export_to_csv']

    def export_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="enrollments_{datetime.now().strftime("%Y%m%d")}.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Email', 'Sale Price', 'Equity Rollover', 'Closing Date',
            'QI Name', 'Needs QI Referral', 'Property', 'Days to Closing',
            'Submitted', 'IP Address'
        ])
        for enrollment in queryset:
            writer.writerow([
                enrollment.email,
                enrollment.sale_price,
                enrollment.equity_rollover,
                enrollment.closing_date,
                enrollment.qi_name,
                enrollment.needs_qi_referral,
                enrollment.property.reference_number,
                enrollment.get_days_until_closing(),
                enrollment.created_at.strftime('%m/%d/%Y %I:%M %p'),
                enrollment.ip_address
            ])
        return response
    export_to_csv.short_description = 'Export selected to CSV'


@admin.register(PropertyDocument)
class PropertyDocumentAdmin(admin.ModelAdmin):
    list_display = ['property', 'document_type', 'filename', 'uploaded_at', 'uploaded_by']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['property__reference_number', 'filename']
    readonly_fields = ['uploaded_at']


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ['title', 'name', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['title', 'name']
    readonly_fields = ['uploaded_at']


@admin.register(ChatUsage)
class ChatUsageAdmin(admin.ModelAdmin):
    list_display = ['user', 'message_count', 'first_message_at', 'last_message_at', 'email_sent_at_15']
    list_filter = ['email_sent_at_15', 'first_message_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['first_message_at', 'last_message_at']


# ============================================
# ADMIN SITE CUSTOMIZATION
# ============================================

admin.site.site_header = "SimpleCiti Administration"
admin.site.site_title = "SimpleCiti Admin"
admin.site.index_title = "Welcome to SimpleCiti Administration"
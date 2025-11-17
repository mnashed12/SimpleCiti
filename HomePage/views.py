# === Standard Library ===
import os
import time
import json
import base64
import logging
import requests
import pytz
from io import BytesIO
from datetime import datetime
from urllib.parse import urljoin
from decimal import Decimal
import decimal

from django.views.decorators.http import require_http_methods
from django.core.mail import EmailMultiAlternatives
from .models import PropertyEnrollment
from decimal import Decimal
import decimal

from django.core.mail import send_mail
from django.utils import timezone
from django.urls import reverse
from django.views.decorators.http import require_POST
from .models import PropertyLike, ExchangeID, Property

# === Third-Party ===
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from PyPDF2 import PdfFileWriter, PdfFileReader
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment

# === Django Core ===
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail, EmailMultiAlternatives
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import (
    CustomUser,  # ✅ NEW
    ClientProfile,  # ✅ NEW
    LeadReferrerProfile,  # ✅ NEW
    PropertyBrokerProfile,
    UploadedFile,
    NDARequest,
    LeaseAgreementRequest,
    LeaseAgreementNotaryRequest,
    Property,
    PropertyDocument,  # ✅ NEW
    PropertyImage,
    PropertyFee,
    PropertyEnrollment,
    ChatUsage,
)

def home(request):
    return render(request, 'home.html')

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages

# Your existing views stay here...

from .forms import CustomUserCreationForm

def user_register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.user_type = 'client'  # default
            user.save()
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, "Account created successfully!")
            return redirect('/SE/')  # Redirect client dashboard
    else:
        form = CustomUserCreationForm()

    return render(request, 'user_register.html', {'form': form})

def user_login_view(request):
    """
    Custom login view supporting username OR email with clear error display
    and honoring ?next redirect (defaulting to /SE/Hub).

    Behavior:
    - POST: validate credentials via AuthenticationForm; if invalid, try email fallback
    - On success: login + redirect to next_url
    - On failure: re-render form with errors and preserve next
    """
    next_url = request.GET.get('next') or request.POST.get('next') or '/SE/Hub'

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            # AuthenticationForm already authenticated the user
            user = form.get_user()
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, f'Welcome back, {user.get_full_name() or user.get_username()}!')
            return redirect(next_url)

        # Fallback: allow email-as-username login if user entered email
        ident = request.POST.get('username')
        password = request.POST.get('password')
        if ident and '@' in ident and password:
            try:
                from .models import CustomUser
                user_obj = CustomUser.objects.get(email__iexact=ident.strip())
                user = authenticate(username=user_obj.get_username(), password=password)
                if user is not None:
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    messages.success(request, f'Welcome back, {user.get_full_name() or user.get_username()}!')
                    return redirect(next_url)
            except CustomUser.DoesNotExist:
                pass  # fall through to show form errors

        # If we reach here, show form with errors (including non_field_errors)
    else:
        form = AuthenticationForm()

    return render(request, 'user_login.html', {'form': form, 'next': next_url})
def user_logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('user_login')

def SE_Hub(request):
    return render(request, 'deals.html')

def temp(request):
    return render(request, 'temp.html')

def SE_pipeline(request):
    return render(request, 'pipe.html')

def dealdetail(request, reference_number=None):
    """Render deal detail page with property context"""
    context = {'reference_number': reference_number}

    try:
        if reference_number:
            property_obj = Property.objects.get(reference_number=reference_number, is_active=True)
            context['property_exists'] = True
            context['property_title'] = property_obj.title
        else:
            context['property_exists'] = False
    except Property.DoesNotExist:
        context['property_exists'] = False

    return render(request, 'deal-detail.html', context)

def api_properties(request):
    """Returns JSON for live marketplace deals only"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # ✅ Optimized query with prefetch to avoid N+1
    properties = Property.objects.active().prefetch_related('images').filter(is_pipeline=False)
    data = []

    for prop in properties:
        images = [img.get_image_url() for img in prop.images.all().order_by('order') if img.get_image_url()]

        in_place_noi_percent = 0
        if prop.purchase_price and prop.purchase_price > 0:
            in_place_noi_percent = round((float(prop.current_noi) / float(prop.purchase_price)) * 100, 2)

        data.append({
            'id': prop.reference_number,
            'referenceNumber': prop.reference_number,
            'title': prop.title,
            'propertyHeader': prop.property_header,
            'heroSummary': prop.hero_summary,
            'strategies': prop.strategies if prop.strategies else [],
            'address': prop.address,
            'image': images[0] if images else None,
            'images': images,
            'totalValue': float(prop.purchase_price),
            'targetEquity': float(prop.total_equity),
            'currentFunding': float(prop.current_funding),
            'ltvPercent': prop.ltv,
            'cap_rate': float(prop.cap_rate) if prop.cap_rate else 0,
            'investors': prop.current_investors,
            'maxInvestors': prop.max_investors,
            'closeDate': prop.close_date.isoformat(),
            'type': prop.property_type,
            'minInvestment': 1000000,
            'isPipeline': False,
            'dealStage': prop.get_deal_stage_display(),
            'dealStageCode': prop.deal_stage,

            # ✅ ADD THESE NEW FIELDS
            'current_noi': float(prop.current_noi),
            'purchase_price': float(prop.purchase_price),
            'projected_irr': float(prop.projected_irr),
            'per_100k': float(prop.per_100k) if prop.per_100k else None,
            'est_cash_on_cash': float(prop.est_cash_on_cash) if prop.est_cash_on_cash else None,
            'distribution_frequency': prop.distribution_frequency or 'Monthly',

            'kbi_1': prop.kbi_1,
            'kbi_2': prop.kbi_2,
            'kbi_3': prop.kbi_3,
            'kbi_4': prop.kbi_4,

            'stats': {
                'inPlaceNOI': {
                    'percent': in_place_noi_percent,
                    'amount': float(prop.current_noi)
                },
                'coupon': {
                    'percent': float(prop.interest_rate),
                    'amount': float(prop.debt_amount)
                },
                'projectedIRR': {
                    'percent': float(prop.projected_irr),
                    'years': prop.hold_period_years
                }
            }
        })

    return JsonResponse({'properties': data})
def api_pipeline_properties(request):
    """Returns JSON for pipeline properties only"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # ✅ Optimized query
    properties = Property.objects.pipeline().prefetch_related('images')
    data = []

    for prop in properties:
        images = [img.image_url for img in prop.images.all().order_by('order')]

        in_place_noi_percent = 0
        if prop.purchase_price and prop.purchase_price > 0:
            in_place_noi_percent = round((float(prop.current_noi) / float(prop.purchase_price)) * 100, 2)

        data.append({
            'id': prop.reference_number,
            'referenceNumber': prop.reference_number,
            'title': prop.title,
            'propertyHeader': prop.property_header,
            'strategies': prop.strategies if prop.strategies else [],
            'address': prop.address,
            'image': images[0] if images else None,
            'images': images,
            'totalValue': float(prop.purchase_price),
            'targetEquity': float(prop.total_equity),
            'currentFunding': float(prop.current_funding),
            'ltvPercent': prop.ltv,
            'capRate': float(prop.cap_rate),
            'investors': prop.current_investors,
            'maxInvestors': prop.max_investors,
            'closeDate': prop.close_date.isoformat(),
            'type': prop.property_type,
            'minInvestment': 1000000,
            'isPipeline': True,
            'dealStage': prop.get_deal_stage_display(),
            'dealStageCode': prop.deal_stage,

            # ✅ ADD THESE NEW FIELDS
            'current_noi': float(prop.current_noi),
            'purchase_price': float(prop.purchase_price),
            'projected_irr': float(prop.projected_irr),
            'est_annual_cash_flow': float(prop.est_annual_cash_flow) if prop.est_annual_cash_flow else None,
            'est_cash_on_cash': float(prop.est_cash_on_cash) if prop.est_cash_on_cash else None,
            'distribution_frequency': prop.distribution_frequency or 'Monthly',

            'stats': {
                'inPlaceNOI': {'percent': in_place_noi_percent, 'amount': float(prop.current_noi)},
                'coupon': {'percent': float(prop.interest_rate), 'amount': float(prop.debt_amount)},
                'purchaseCapRate': {'percent': float(prop.cap_rate)},
                'projectedIRR': {'percent': float(prop.projected_irr), 'years': prop.hold_period_years}
            }
        })

    return JsonResponse({'properties': data})

def api_property_detail(request, reference_number):
    """Returns JSON for deal detail page - ALL FIELDS"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        # ✅ Optimized query to avoid N+1 - prefetch all related data
        prop = Property.objects.with_relations().get(
            reference_number=reference_number, 
            is_active=True
        )

        # Get images (already prefetched, so this is cached)
        images = [img.image_url for img in prop.images.all().order_by('order')]

        # Build fees from PropertyFee rows if present; else use defaults
        fees_dict = {}
        try:
            fee_rows = list(prop.fees.all())  # Already prefetched
        except Exception:
            fee_rows = []

        def _norm_fee_key(name):
            n = (name or '').strip().lower()
            if 'exchange' in n or 'dst' in n or 'sponsor' in n:
                return 'exchange'
            if 'manage' in n or 'asset' in n:
                return 'manage'
            if 'advis' in n:
                return 'advisory'
            if 'brick' in n or 'construction' in n:
                return 'bricks'
            if 'space' in n or 'leasing' in n:
                return 'spaces'
            if 'broker' in n or 'commission' in n:
                return 'broker'
            if 'cre' in n or 'credit' in n or 'report' in n or 'loan' in n:
                return 'creport'
            return n or 'other'

        for fr in fee_rows:
            key = _norm_fee_key(fr.fee_type)
            fees_dict[key] = {
                'rate': float(fr.rate) if fr.rate is not None else None,
                'amount': float(fr.amount) if fr.amount is not None else None,
                'description': fr.description
            }

        # Fallback fees if not provided
        if 'exchange' not in fees_dict:
            fees_dict['exchange'] = {
                'rate': 1.50,
                'amount': round(float(prop.purchase_price) * 0.015)
            }
        if 'manage' not in fees_dict:
            fees_dict['manage'] = {
                'rate': 3.00,
                'amount': round(float(prop.current_noi) * 0.03)
            }
        if 'advisory' not in fees_dict:
            fees_dict['advisory'] = {
                'rate': 2.00,
                'amount': round(float(prop.purchase_price) * 0.02)
            }
        fees_dict.setdefault('bricks', {'rate': None, 'amount': None, 'description': 'As Needed'})
        fees_dict.setdefault('spaces', {'rate': 5.00, 'amount': None, 'description': 'Leasing Fee'})
        fees_dict.setdefault('broker', {'rate': 2.50, 'amount': None, 'description': 'Exit Fee'})
        if 'creport' not in fees_dict:
            amt = round(float(prop.debt_amount) * 0.0075) if prop.debt_amount else None
            fees_dict['creport'] = {'rate': 0.75, 'amount': amt, 'description': 'Loan Amount'}

        data = {
            # ============================================
            # BASIC INFORMATION
            # ============================================
            'id': prop.id,
            'referenceNumber': prop.reference_number,
            'title': prop.title,
            'propertyHeader': prop.property_header,
            'address': prop.address,
            'type': prop.property_type,
            'strategies': prop.strategies if prop.strategies else [],

            # ============================================
            # MARKETING & PRESENTATION
            # ============================================
            'marketingTitle': prop.marketing_title,
            'heroSummary': prop.hero_summary,
            'isFeatured': prop.is_featured,

            # ============================================
            # IMAGES
            # ============================================
            'images': images,
            'image': images[0] if images else None,

            # ============================================
            # KEY DATES
            # ============================================
            'loiDate': prop.loi_date.isoformat() if prop.loi_date else None,
            'psaDate': prop.psa_date.isoformat() if prop.psa_date else None,
            'ddEndDate': prop.dd_end_date.isoformat() if prop.dd_end_date else None,
            'closeDate': prop.close_date.isoformat(),
            'daysRemaining': max(0, (prop.close_date - timezone.now().date()).days),

            # ============================================
            # DEAL STAGE
            # ============================================
            'dealStage': prop.get_deal_stage_display(),
            'dealStageCode': prop.deal_stage,

            # ============================================
            # BUILDING INFORMATION
            # ============================================
            'building': {
                'totalSF': prop.total_sf,
                'acres': round(float(prop.acres), 2),
                'totalUnits': prop.total_units,
                'vacancy': round(float(prop.vacancy_percent), 2),
                'vacantSF': prop.vacant_sf,
                'walt': round(float(prop.walt), 2)
            },

            # ============================================
            # LOCATION
            # ============================================
            'location': {
                'city': prop.city,
                'state': prop.state,
                'zipCode': prop.zip_code,
                'submarket': prop.submarket,
                'locationHighlights': prop.location_highlights
            },

            # ============================================
            # FINANCIAL - PRIMARY
            # ============================================
            'financial': {
                'purchasePrice': round(float(prop.purchase_price), 2),
                'capRate': round(float(prop.cap_rate), 2),
                'currentNOI': round(float(prop.current_noi), 2),
                'debtAmount': round(float(prop.debt_amount), 2),
                'interestRate': round(float(prop.interest_rate), 2),
                'dscr': round(float(prop.dscr), 2),
                'totalEquity': round(float(prop.total_equity), 2),
                'ltv': round(float(prop.ltv), 2),
                # Extended financial
                'estAnnualCashFlow': round(float(prop.est_annual_cash_flow), 2) if prop.est_annual_cash_flow else None,
                'per100k': round(float(prop.per_100k), 2) if prop.per_100k else None,
                'estCashOnCash': round(float(prop.est_cash_on_cash), 2) if prop.est_cash_on_cash else None,
                'distributionFrequency': prop.distribution_frequency
            },

            # ============================================
            # TENANT INFORMATION
            # ============================================
            'tenancy': {
                'numTenants': prop.num_tenants,
                'occupancyPercent': round(float(prop.occupancy_percent), 2) if prop.occupancy_percent else None,
                'leaseStructure': prop.lease_structure,
                'tenancyHero': prop.tenancy_hero,
                # Tenant 1
                'tenant1': {
                    'name': prop.tenant_1_name,
                    'sf': prop.tenant_1_sf,
                    'percent': round(float(prop.tenant_1_percent), 2) if prop.tenant_1_percent else None,
                    'expiry': prop.tenant_1_expiry.isoformat() if prop.tenant_1_expiry else None,
                    'guarantee': prop.tenant_1_guarantee,
                    'leaseStructure': prop.tenant_1_lease_structure
                },
                # Tenant 2
                'tenant2': {
                    'name': prop.tenant_2_name,
                    'sf': prop.tenant_2_sf,
                    'percent': round(float(prop.tenant_2_percent), 2) if prop.tenant_2_percent else None,
                    'expiry': prop.tenant_2_expiry.isoformat() if prop.tenant_2_expiry else None,
                    'guarantee': prop.tenant_2_guarantee,
                    'leaseStructure': prop.tenant_2_lease_structure
                },
                # Tenant 3
                'tenant3': {
                    'name': prop.tenant_3_name,
                    'sf': prop.tenant_3_sf,
                    'percent': round(float(prop.tenant_3_percent), 2) if prop.tenant_3_percent else None,
                    'expiry': prop.tenant_3_expiry.isoformat() if prop.tenant_3_expiry else None,
                    'guarantee': prop.tenant_3_guarantee,
                    'leaseStructure': prop.tenant_3_lease_structure
                }
            },

            # ============================================
            # BUSINESS PLAN & KBIS
            # ============================================
            'businessPlan': prop.business_plan,
            'kbis': {
                'kbi1': prop.kbi_1,
                'kbi2': prop.kbi_2,
                'kbi3': prop.kbi_3,
                'kbi4': prop.kbi_4
            },

            # ============================================
            # INVESTMENT STATUS
            # ============================================
            'equity': {
                'totalEquity': round(float(prop.total_equity), 2),
                'currentFunding': round(float(prop.current_funding), 2),
                'maxInvestors': prop.max_investors,
                'currentInvestors': prop.current_investors,
                'simpleCitiReserved': round(float(prop.total_equity) * 0.15, 2),
                'isActive': prop.is_active,
                'isPipeline': prop.is_pipeline
            },

            # ============================================
            # PROJECTED RETURNS
            # ============================================
            'returns': {
                'projectedIRR': round(float(prop.projected_irr), 2),
                'holdPeriodYears': prop.hold_period_years
            },

            # ============================================
            # BROKER INFORMATION
            # ============================================
            'broker': {
                'name': prop.broker_name,
                'email': prop.broker_email,
                'phone': prop.broker_phone,
                'cell': prop.broker_cell,
                'company': prop.broker_company,
                'notes': prop.broker_notes,
                'commission': round(float(prop.commission), 2) if prop.commission else None,
                'brokerUserId': prop.broker_user.id if prop.broker_user else None
            },

            # ============================================
            # FEES (Calculated or from DB)
            # ============================================
            'fees': fees_dict,

            # ============================================
            # APPROVAL WORKFLOW
            # ============================================
            'approval': {
                'status': prop.status,
                'submittedBy': prop.submitted_by.get_full_name() if prop.submitted_by else None,
                'submittedAt': prop.submitted_at.isoformat() if prop.submitted_at else None,
                'reviewedBy': prop.reviewed_by.get_full_name() if prop.reviewed_by else None,
                'reviewedAt': prop.reviewed_at.isoformat() if prop.reviewed_at else None,
                'adminNotes': prop.admin_notes
            },

            # ============================================
            # METADATA
            # ============================================
            'meta': {
                'createdAt': prop.created_at.isoformat(),
                'updatedAt': prop.updated_at.isoformat(),
                'createdBy': prop.created_by.get_full_name() if prop.created_by else None,
                'completionPercentage': prop.completion_percentage,
                'internalNotes': prop.internal_notes
            }
        }

        return JsonResponse(data)

    except Property.DoesNotExist:
        return JsonResponse({
            'error': 'Property not found',
            'message': 'This property is no longer available or does not exist.'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'error': 'Server error',
            'message': str(e)
        }, status=500)

def generate_reference_number(property_type):
    """Generate reference number with prefix based on property type"""

    # Property type prefixes and base numbers - MUST MATCH FORM VALUES EXACTLY
    TYPE_CONFIG = {
        'Small Bay / Flex': ('SB', 1000),
        'Small Bay': ('SB', 1000),  # Backup for old entries
        'Industrial': ('IN', 2000),
        'Multi-Family': ('MF', 3000),
        'Multifamily': ('MF', 3000),
        'Office': ('OF', 4000),
        'Retail': ('RE', 5000),  # ✅ ADDED - was missing!
        'Residential': ('RS', 5500),  # Different from Retail
        'Hotel': ('HO', 6000),
        'Marina': ('MA', 7000),
        'Self Storage': ('SS', 8000),
        'Misc.': ('MISC', 9000),  # ✅ ADDED period to match form
        'Misc': ('MISC', 9000),   # Backup without period
    }

    # Clean the input
    property_type_clean = property_type.strip() if property_type else 'Misc.'

    # ✅ DEBUG LOGGING
    print("=" * 60)
    print(f"🔍 generate_reference_number called")
    print(f"   Input: '{property_type_clean}'")

    # Try exact match first
    if property_type_clean in TYPE_CONFIG:
        prefix, base = TYPE_CONFIG[property_type_clean]
        print(f"   ✅ EXACT MATCH: {property_type_clean} → {prefix}")
    # Try title case
    elif property_type_clean.title() in TYPE_CONFIG:
        prefix, base = TYPE_CONFIG[property_type_clean.title()]
        print(f"   ✅ TITLE CASE MATCH: {property_type_clean.title()} → {prefix}")
    # Try case-insensitive lookup
    else:
        lower_config = {k.lower(): v for k, v in TYPE_CONFIG.items()}
        if property_type_clean.lower() in lower_config:
            prefix, base = lower_config[property_type_clean.lower()]
            print(f"   ✅ LOWERCASE MATCH: {property_type_clean.lower()} → {prefix}")
        else:
            prefix, base = ('MISC', 9000)
            print(f"   ❌ NO MATCH - Defaulting to MISC")
            print(f"   Available types: {list(TYPE_CONFIG.keys())}")

    # Find the highest reference number for this prefix
    existing = Property.objects.filter(
        reference_number__startswith=f'{prefix}-'
    ).order_by('-reference_number').first()

    if existing and existing.reference_number:
        try:
            parts = existing.reference_number.split('-')
            if len(parts) == 2:
                last_num = int(parts[1])
                next_num = last_num + 1
            else:
                next_num = base + 1
        except (ValueError, IndexError):
            next_num = base + 1
    else:
        next_num = base + 1

    final_ref = f'{prefix}-{next_num}'
    print(f"   🎯 FINAL: {final_ref}")
    print("=" * 60)

    return final_ref

def terms(request):
    return render(request, 'terms.html')

def about(request):
    return render(request, 'about.html')

def history(request):
    return render(request, 'familyhistory.html')

def scchistory(request):
    return render(request, 'history.html')

def roots(request):
    return render(request, 'roots.html')

def MFG(request):
    return render(request, 'operatingcompanies.html')

def advisoryboard(request):
    return render(request, 'advisoryboard.html')

def foradvisors(request):
    return render(request, 'foradvisors.html')

def SA(request):
    return render(request, 'SA.html')

def focus(request):
    return render(request, 'SA_whatwedo.html')

def verticals(request):
    return render(request, 'SA_verticals.html')

def dealflow(request):
    return render(request, 'SA_dealflow.html')

def SA_serve(request):
    return render(request, 'SA_serve.html')

def SF(request):
    return render(request, 'SimpleMFO.html')

def SCC(request):
    return render(request, 'SE.html')

def SE(request):
    return render(request, 'SE1031.html')

def SE_basics(request):
    return render(request, 'SE1031_basics.html')

def SE_How(request):
    return render(request, 'SE1031_platform.html')

def partnership(request):
    return render(request, 'SCC_partnership.html')

def SCC_serve(request):
    return render(request, 'SCC_serve.html')

def SCC_verticals(request):
    return render(request, 'SCC_verticals.html')

def SCC_organic(request):
    return render(request, 'SCC_organic.html')

def SCA(request):
    return render(request, 'SCA.html')

def SSE(request):
    return render(request, 'SSec.html')

def NEAbout(request):
    return render(request, 'NEAbout.html')

def organization(request):
    return render(request, 'organization.html')

def brokerdealers(request):
    return render(request, 'brokerdealer.html')

def HNWIs(request):
    return render(request, 'HNWI.html')

def institutional(request):
    return render(request, 'institutional.html')

def wealthadvisorRIAs(request):
    return render(request, 'wealthadvisorRIA.html')

def CRE(request):
    return render(request, 'CRE.html')

def MF(request):
    return render(request, 'MF.html')

def LRE(request):
    return render(request, 'LRE.html')

def RRE(request):
    return render(request, 'RRE.html')

def AI(request):
    return render(request, 'AI.html')

def PE(request):
    return render(request, 'PE.html')

def LitFi(request):
    return render(request, 'LitFi.html')

def datacenters(request):
    return render(request, 'datacenters.html')

def edgeleadership(request):
    return render(request, 'edgeleadership.html')

def edgeabout(request):
    return render(request, 'edgeabout.html')

def investmentmerits(request):
    return render(request, 'investmentmerits.html')

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.cache import cache
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import pytz
import logging

logger = logging.getLogger(__name__)


def macro_economic_data(request):
    """Main view that renders the page with initial context"""
    return render(request, 'macrodata.html')


def fetch_single_rate(rate_name, series_id, api_key, base_url, fallbacks):
    """Fetch a single rate from FRED API"""
    try:
        params = {
            "series_id": series_id,
            "api_key": api_key,
            "file_type": "json",
            "limit": 2,
            "sort_order": "desc"
        }

        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        observations = data.get("observations", [])

        # Fallback logic
        if not observations and series_id in fallbacks:
            params["series_id"] = fallbacks[series_id]
            response = requests.get(base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            observations = data.get("observations", [])

        if observations and len(observations) > 0:
            latest = observations[0]
            if latest['value'] != '.' and latest['value'] is not None:
                current_value = float(latest['value'])

                # Apply spreads for jumbo rates
                if rate_name == 'jumbo-fixed':
                    current_value += 0.25
                elif rate_name == 'jumbo-adjustable':
                    current_value += 0.50

                result = {
                    'value': round(current_value, 2),
                    'date': latest['date'],
                    'change': "0.00"
                }

                # Calculate change
                if len(observations) > 1:
                    prev = observations[1]
                    if prev['value'] != '.' and prev['value'] is not None:
                        prev_value = float(prev['value'])
                        if rate_name == 'jumbo-fixed':
                            prev_value += 0.25
                        elif rate_name == 'jumbo-adjustable':
                            prev_value += 0.50
                        change = round(current_value - prev_value, 2)
                        result['change'] = f"{'+' if change >= 0 else ''}{change}"

                return rate_name, result

        return rate_name, {'value': 'N/A', 'date': 'N/A', 'change': '0.00'}

    except requests.exceptions.Timeout:
        logger.error(f"Timeout fetching {rate_name}")
        return rate_name, {'value': 'Timeout', 'date': 'N/A', 'change': '0.00'}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error fetching {rate_name}: {e}")
        return rate_name, {'value': 'Error', 'date': 'N/A', 'change': '0.00'}
    except (ValueError, KeyError, TypeError) as e:
        logger.error(f"Data parsing error for {rate_name}: {e}")
        return rate_name, {'value': 'Parse Error', 'date': 'N/A', 'change': '0.00'}
    except Exception as e:
        logger.error(f"Unexpected error fetching {rate_name}: {e}")
        return rate_name, {'value': 'Unavailable', 'date': 'N/A', 'change': '0.00'}


def fetch_single_sofr_rate(rate_key, url_path, base_url):
    """Fetch a single SOFR rate from global-rates.com"""
    try:
        full_url = urljoin(base_url, url_path)

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

        response = requests.get(full_url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        rate_table = soup.find('table')
        if not rate_table:
            logger.error(f"No table found for {rate_key}")
            return rate_key, {'value': 'N/A', 'date': 'N/A', 'change': '0.00'}

        rows = rate_table.find_all('tr')
        data_rows = [row for row in rows if len(row.find_all('td')) >= 2]

        if not data_rows:
            logger.error(f"No data rows found for {rate_key}")
            return rate_key, {'value': 'N/A', 'date': 'N/A', 'change': '0.00'}

        current_row = data_rows[0]
        cells = current_row.find_all('td')

        if len(cells) >= 2:
            date_text = cells[0].get_text(strip=True)
            rate_text = cells[1].get_text(strip=True)
            rate_clean = rate_text.replace('%', '').strip()

            try:
                current_value = float(rate_clean)
                change = 0.00

                if len(data_rows) > 1:
                    prev_row = data_rows[1]
                    prev_cells = prev_row.find_all('td')
                    if len(prev_cells) >= 2:
                        prev_rate_text = prev_cells[1].get_text(strip=True)
                        prev_rate_clean = prev_rate_text.replace('%', '').strip()
                        try:
                            prev_value = float(prev_rate_clean)
                            change = round(current_value - prev_value, 2)
                        except ValueError:
                            pass

                logger.info(f"Successfully scraped {rate_key}: {current_value}% on {date_text}")

                return rate_key, {
                    'value': round(current_value, 2),
                    'date': date_text,
                    'change': f"{'+' if change >= 0 else ''}{change}" if change != 0 else "0.00"
                }

            except ValueError as e:
                logger.error(f"Could not parse rate value '{rate_clean}' for {rate_key}: {e}")
                return rate_key, {'value': 'Parse Error', 'date': date_text, 'change': '0.00'}
        else:
            logger.error(f"Insufficient cells in row for {rate_key}")
            return rate_key, {'value': 'N/A', 'date': 'N/A', 'change': '0.00'}

    except requests.exceptions.Timeout:
        logger.error(f"Timeout scraping {rate_key}")
        return rate_key, {'value': 'Timeout', 'date': 'N/A', 'change': '0.00'}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error scraping {rate_key}: {e}")
        return rate_key, {'value': 'Error', 'date': 'N/A', 'change': '0.00'}
    except Exception as e:
        logger.error(f"Unexpected error scraping {rate_key}: {e}")
        return rate_key, {'value': 'Error', 'date': 'N/A', 'change': '0.00'}


@csrf_exempt
def get_fred_rates(request):
    """JSON API endpoint to fetch all FRED rates with caching and parallel requests"""

    # Check cache first
    cache_key = 'macro_economic_rates'
    cached_data = cache.get(cache_key)

    if cached_data:
        logger.info("Returning cached rates data")
        return JsonResponse(cached_data)

    logger.info("Cache miss - fetching fresh data")

    api_key = "1a9c568a8ac9f5d43fec098b4ebe8a89"
    base_url = "https://api.stlouisfed.org/fred/series/observations"

    # Complete mapping of all rates needed
    series_data = {
        # Commercial Floating
        'sofr-overnight': 'SOFR',
        'sofr-30day': 'SOFR30DAYAVG',
        'sofr-3month': 'SOFR90DAYAVG',

        # Commercial Fixed - Treasury rates
        'treasury-1m': 'DGS1MO',
        'treasury-3m': 'DGS3MO',
        'treasury-6m': 'DGS6MO',
        'treasury-2y': 'DGS2',
        'treasury-5y': 'DGS5',
        'treasury-10y': 'DGS10',
        'treasury-30y': 'DGS30',

        # Consumer Credit
        'fed-funds-rate': 'EFFR',
        'prime-rate': 'DPRIME',

        # Consumer Housing - Conforming
        'mortgage-30y-fixed': 'MORTGAGE30US',
        'mortgage-30day-avg': 'SOFR30DAYAVG',

        # Consumer Housing - Non-Conforming (calculated with spreads)
        'jumbo-fixed': 'MORTGAGE30US',
        'jumbo-adjustable': 'SOFR30DAYAVG'
    }

    fallbacks = {
        'SOFR1M': 'SOFR30DAYAVG',
        'DGS1MO': 'DGS3MO',
    }

    rates_data = {}

    # Fetch all FRED rates in parallel
    logger.info("Fetching FRED rates in parallel")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(fetch_single_rate, rate_name, series_id, api_key, base_url, fallbacks): rate_name
            for rate_name, series_id in series_data.items()
        }

        for future in as_completed(futures):
            rate_name, result = future.result()
            rates_data[rate_name] = result

    # Fetch SOFR rates from global-rates.com in parallel
    logger.info("Starting scrape of global-rates.com for CME Term SOFR data")
    sofr_urls = {
        'sofr-1m-term': "1/term-sofr-interest-1-month/",
        'sofr-3m-term': "2/term-sofr-interest-3-months/",
        'sofr-6m-term': "3/term-sofr-interest-6-months/",
        'sofr-12m-term': "4/term-sofr-interest-12-months/"
    }
    sofr_base_url = "https://www.global-rates.com/en/interest-rates/cme-term-sofr/"

    with ThreadPoolExecutor(max_workers=4) as executor:
        sofr_futures = {
            executor.submit(fetch_single_sofr_rate, rate_key, url_path, sofr_base_url): rate_key
            for rate_key, url_path in sofr_urls.items()
        }

        for future in as_completed(sofr_futures):
            rate_key, result = future.result()
            rates_data[rate_key] = result

    logger.info(f"Successfully fetched all rates data")

    # Add timestamp
    eastern = pytz.timezone('US/Eastern')
    current_time = timezone.now().astimezone(eastern)

    # Add metadata
    response_data = {
        'rates': rates_data,
        'last_updated': current_time.strftime('%Y-%m-%dT%H:%M:%S%z'),
        'status': 'success',
        'data_sources': {
            'fred_api': 'Federal Reserve Bank of St. Louis',
            'scraped': 'global-rates.com (CME Term SOFR)'
        }
    }

    # Cache for 15 minutes (900 seconds)
    cache.set(cache_key, response_data, 900)
    logger.info("Data cached for 15 minutes")

    return JsonResponse(response_data)

def generate_pdf(form_data):
    # Example: Generate a simple PDF using PyPDF2
    # You would replace this with your logic for filling out the NDA template

    pdf_writer = PdfFileWriter()

    # Create a dummy PDF page (replace with actual PDF creation logic)
    pdf_writer.addBlankPage(width=200, height=300)

    # Create a BytesIO buffer to hold the PDF
    pdf_buffer = BytesIO()
    pdf_writer.write(pdf_buffer)
    pdf_buffer.seek(0)

    return pdf_buffer

def appraisal(request):
    return render(request, 'appraisal.html')

def smonboarding(request):
    return render(request, 'SM_onboarding.html')

def smservices(request):
    return render(request, 'SM_services.html')

def smtools(request):
    return render(request, 'SM_tools.html')

def smleadership(request):
    return render(request, 'SM_leadership.html')

def SM(request):
    return render(request, 'SM.html')

def SSP(request):
    return render(request, 'SS.html')

def SBRI(request):
    return render(request, 'SB.html')

def SBRO(request):
    return render(request, 'SR.html')

def SC(request):
    return render(request, 'SC.html')

def investors_view(request):
    return render(request, 'SC_investors.html')

def borrowers_view(request):
    return render(request, 'SC_borrowers.html')

def loans_view(request):
    return render(request, 'SC_loans.html')

def mca_view(request):
    return render(request, 'SC_mca.html')

def rtl_view(request):
    return render(request, 'SC_rtl.html')

def cbl_view(request):
    return render(request, 'SC_cbl.html')

def preferredequity_view(request):
    return render(request, 'SC_preferredequity.html')

def leasing_view(request):
    return render(request, 'SC_leasing.html')

def bridge_loan(request):
    return render(request, 'sc_bridge_loan.html')

def construction_loan(request):
    return render(request, 'sc_construction_loan.html')

def dscr_loan(request):
    return render(request, 'sc_dscr_loan.html')

def fixflip_loan(request):
    return render(request, 'sc_fixflip_loan.html')

def fmf(request):
    return render(request, 'fmf.html')

def states(request):
    return render(request, 'stateswecover.html')

def cases(request):
    return render(request, 'caseswefund.html')

def howitworks(request):
    return render(request, 'howitworks.html')

def fmc(request):
    return render(request, 'fmc.html')

def fmi(request):
    return render(request, 'fmi.html')

def fml(request):
    return render(request, 'fml.html')

def qoz(request):
    return render(request, 'qoz.html')

def core(request):
    return render(request, 'core.html')

def axcs(request):
    return render(request, 'axcs.html')

def error(request):
    return render(request, 'error.html')

def contact(request):
    return render(request, 'contact.html')

def news(request):
    return render(request, 'news.html')

def leadership(request):
    return render(request, 'leadership.html')

def se_leadership(request):
    return render(request, 'SE/leadership.html')

def se_contact(request):
    return render(request, 'SE/contact.html')

def se_process(request):
    return render(request, 'SE/process.html')

@login_required
def se_replacement(request):
    """
    Display user's Exchange IDs and their liked properties
    """
    # Get all exchange IDs for this user
    user_exchanges = ExchangeID.objects.filter(user=request.user).order_by('-created_at')

    # Get all liked properties grouped by exchange ID
    exchange_properties = {}
    for exchange in user_exchanges:
        liked_properties = PropertyLike.objects.filter(
            exchange_id=exchange
        ).select_related('property').order_by('-created_at')

        # Get the property objects
        properties = [like.property for like in liked_properties]

        exchange_properties[exchange.exchange_id] = {
            'exchange': exchange,
            'properties': properties
        }

    context = {
        'user_exchanges': user_exchanges,
        'exchange_properties': exchange_properties,
    }
    return render(request, 'SE/replacement.html', context)

def se_Assets(request):
    return render(request, 'SE/holdings.html')

def se_identified(request):
    return render(request, 'SE/identified.html')

def se_partners(request):
    return render(request, 'SE/partners.html')

def se_Sins(request):
    return render(request, 'SE/deadly.html')

def dst_process(request):
    return render(request, 'SE/dst_process.html')

def us_vs_them(request):
    return render(request, 'SE/us_vs_them.html')

def se_IRS(request):
    return render(request, 'SE/IRS.html')

def se_Alpha(request):
    return render(request, 'SE/Alpha.html')

def se_Pure(request):
    return render(request, 'SE/Pure.html')

def se_OwnDeed(request):
    return render(request, 'SE/OwnDeed.html')

def se_Newsletter(request):
    return render(request, 'SE/Newsletter.html')

def se_Blog(request):
    return render(request, 'SE/Blog.html')

def se_Dashboard(request):
    return render(request, 'SE/Dashboard.html')

def se_Shelf(request):
    return render(request, 'SE/Shelf.html')

def businessheads(request):
    return render(request, 'businessheads.html')

def standards(request):
    return render(request, 'standards.html')

def SCOL(request):
    return render(request, 'data.html')

def organizationoverview(request):
    return render(request, 'organizationoverview.html')

def unavailable(request):
    return render(request, 'unavailable.html')

def success_form(request):
    return render(request, 'success_form.html')

def upload_file(request):
    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = UploadForm()
    return render(request, 'upload.html', {'form': form})

@login_required
def file_list(request):
    files = UploadedFile.objects.all()
    return render(request, 'file_list.html', {'files': files})

def delete_file(request, file_id):
    if request.method == 'POST':
        file = get_object_or_404(UploadedFile, id=file_id)
        file.file.delete(save=False)  # delete the actual file from storage
        file.delete()  # delete the DB record
        messages.success(request, "File deleted successfully.")
    return redirect('file_list')

def dealsubmission(request):
    return render(request, 'dealsubmission.html')

def dealsubmissionform(request):
    return render(request, 'dealsubmissionform.html')

def SCOM(request):
    return render(request, 'compute.html')

def disclosure(request):
    return render(request, 'disclosure.html')

def legal(request):
    return render(request, 'legal.html')

def privacy(request):
    return render(request, 'privacy.html')

def phishing(request):
    return render(request, 'phishing.html')

def personaldata(request):
    return render(request, 'personaldata.html')

def forms(request):
    return render(request, 'forms.html')

def cookies(request):
    return render(request, 'cookies.html')

def termsofuse(request):
    return render(request, 'termsofuse.html')

def personalinfo(request):
    return render(request, 'personalinfo.html')

def accessibility(request):
    return render(request, 'accessibility.html')

def sponsor(request):
    return render(request, 'sponsor_platform.html')

load_dotenv()

SIGNNOW_API = 'https://api.signnow.com'
TEMPLATE_ID = os.getenv("SIGNNOW_TEMPLATE_ID")

def get_access_token():
    response = requests.post(
        f"{SIGNNOW_API}/oauth2/token",
        data={
            "username": os.getenv("SIGNNOW_USERNAME"),
            "password": os.getenv("SIGNNOW_PASSWORD"),
            "grant_type": "password",
            "client_id": os.getenv("SIGNNOW_CLIENT_ID"),
            "client_secret": os.getenv("SIGNNOW_CLIENT_SECRET"),
        },
    )
    token = response.json().get("access_token")
    if not token:
        print("❌ Failed to get access token:", response.status_code, response.text)
    return token
from .forms import UserForm
# views.py - Update user_form_view
@csrf_exempt
def user_form_view(request):
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            token = get_access_token()

            create_res = requests.post(
                f"{SIGNNOW_API}/template/{TEMPLATE_ID}/copy",
                headers={"Authorization": f"Bearer {token}"},
                json={"document_name": f"{data['full_name']}_form"}
            )
            if create_res.status_code != 200:
                return render(request, 'error.html', {
                    "message": "Failed to copy template.",
                    "details": create_res.text
                })

            document_id = create_res.json().get("id")

            NDARequest.objects.create(
                full_name=data['full_name'],
                email=data['email'],
                reason=data['reason'],
                document_id=document_id
            )

            send_mail(
                subject="New NDA Form Submission",
                message=(
                    f"Name: {data['full_name']}\n"
                    f"Email: {data['email']}\n"
                    f"Reason: {data['reason']}\n\n"
                    f"Approve this submission at: https://www.simpleciti.com/admin/"
                ),
                from_email=None,
                recipient_list=["mnashed@simpleciti.com.com", "szade@simpleciti.com"],
                fail_silently=False,
            )

            return render(request, 'success.html', {
                "message": "Your request has been received and is pending approval."
            })
    else:
        form = UserForm()
    return render(request, 'user_form.html', {'form': form})

# views.py - Replace the signnow_webhook function with this improved version
import logging
from django.core.mail import EmailMessage
from datetime import datetime

logger = logging.getLogger(__name__)

@csrf_exempt
def signnow_webhook(request):
    """
    Webhook endpoint that SignNow calls when a document is completed.
    Downloads the signed PDF and emails it.
    """
    # Log all incoming requests
    logger.info(f"Webhook called: Method={request.method}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Body: {request.body.decode('utf-8')}")

    if request.method == 'POST':
        try:
            # Parse the webhook data
            data = json.loads(request.body)
            logger.info(f"Parsed webhook data: {data}")

            # SignNow sends different event types - log them all
            event_type = data.get('event')
            document_id = data.get('document_id') or data.get('id')

            logger.info(f"Event type: {event_type}, Document ID: {document_id}")

            # Handle different event types
            if event_type not in ['document.complete', 'document.completed', 'invite.completed']:
                logger.info(f"Ignoring event type: {event_type}")
                return HttpResponse(status=200)

            if not document_id:
                logger.error("No document_id found in webhook payload")
                return HttpResponse(status=400)

            # Find the NDA request
            try:
                nda_request = NDARequest.objects.get(document_id=document_id)
                logger.info(f"Found NDA request for: {nda_request.full_name}")
            except NDARequest.DoesNotExist:
                logger.error(f"No NDA request found for document_id: {document_id}")
                return HttpResponse(status=200)

            # Mark as completed
            nda_request.is_completed = True
            nda_request.save()
            logger.info(f"Marked NDA as completed for {nda_request.full_name}")

            # Download the signed PDF
            token = get_access_token()
            download_url = f"{SIGNNOW_API}/document/{document_id}/download"
            logger.info(f"Attempting to download PDF from: {download_url}")

            download_res = requests.get(
                download_url,
                headers={"Authorization": f"Bearer {token}"}
            )

            logger.info(f"Download response status: {download_res.status_code}")

            if download_res.status_code == 200:
                # Create email with the PDF
                email = EmailMessage(
                    subject=f"✅ Signed NDA - {nda_request.full_name}",
                    body=(
                        f"The NDA has been completed and signed.\n\n"
                        f"Recipient: {nda_request.full_name}\n"
                        f"Email: {nda_request.email}\n"
                        f"Reason: {nda_request.reason}\n"
                        f"Completed: {datetime.now().strftime('%m/%d/%Y at %I:%M %p')}\n"
                        f"Document ID: {document_id}"
                    ),
                    from_email=None,  # Uses DEFAULT_FROM_EMAIL
                    to=["szade@simpleciti.com"]
                )

                # Attach the PDF
                filename = f"{nda_request.full_name.replace(' ', '_')}_NDA_Signed.pdf"
                email.attach(
                    filename,
                    download_res.content,
                    'application/pdf'
                )

                email.send(fail_silently=False)
                logger.info(f"✅ Email sent successfully with PDF to szade@simpleciti.com")

            else:
                logger.error(f"Failed to download PDF: {download_res.text}")
                # Send notification email anyway
                send_mail(
                    subject=f"⚠️ NDA Signed but PDF Download Failed - {nda_request.full_name}",
                    message=(
                        f"The NDA was signed but we couldn't download the PDF.\n\n"
                        f"Recipient: {nda_request.full_name}\n"
                        f"Email: {nda_request.email}\n"
                        f"Document ID: {document_id}\n"
                        f"Download error: {download_res.text}"
                    ),
                    from_email=None,
                    recipient_list=["mnashed@simpleciti.com", "szade@simpleciti.com"],
                    fail_silently=False,
                )

            return HttpResponse(status=200)

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return HttpResponse(status=400)
        except Exception as e:
            logger.error(f"❌ Webhook error: {str(e)}", exc_info=True)
            return HttpResponse(status=500)

    # For GET requests (SignNow might ping to verify the webhook)
    elif request.method == 'GET':
        logger.info("Webhook verification GET request received")
        return HttpResponse(status=200)

    return HttpResponse(status=405)
@csrf_exempt
def lease_agreement_form_view(request):
    if request.method == 'POST':
        form = UserForm(request.POST)  # Still using the same form
        if form.is_valid():
            data = form.cleaned_data
            token = get_access_token()

            LEASE_TEMPLATE_ID = os.getenv("LEASE_TEMPLATE_ID")  # Define this in your .env

            # Step 1: Create a new document from the lease template
            create_res = requests.post(
                f"{SIGNNOW_API}/template/{LEASE_TEMPLATE_ID}/copy",
                headers={"Authorization": f"Bearer {token}"},
                json={"document_name": f"{data['full_name']}_lease_agreement"}
            )

            if create_res.status_code != 200:
                return render(request, 'error.html', {
                    "message": "Failed to copy lease agreement template.",
                    "details": create_res.text
                })

            document_id = create_res.json().get("id")

            # (Optional) Step 2: Fetch field IDs if needed
            fields_res = requests.get(
                f"{SIGNNOW_API}/v2/documents/{document_id}/fields",
                headers={"Authorization": f"Bearer {token}"}
            )

            # Save to LeaseAgreementRequest model
            LeaseAgreementRequest.objects.create(
                full_name=data['full_name'],
                email=data['email'],
                document_id=document_id
            )

            # ✅ Send email notification
            send_mail(
                subject="New Lease Agreement Submission",
                    message=(
                        f"Name: {data['full_name']}\n"
                        f"Email: {data['email']}\n\n"
                        f"Approve this submission at: https://www.simpleciti.com/admin/"
                    ),
                from_email=None,  # Uses DEFAULT_FROM_EMAIL
                recipient_list=["szade@simpleciti.com"],
                fail_silently=False,
            )

            return render(request, 'success.html', {
                "message": "Your lease agreement request has been received and is pending approval."
            })
    else:
        form = UserForm()

    return render(request, 'user_form.html', {'form': form})

@csrf_exempt
def lease_agreement_notary_form_view(request):
    if request.method == 'POST':
        form = UserForm(request.POST)  # Still using the same form
        if form.is_valid():
            data = form.cleaned_data
            token = get_access_token()

            LEASE_TEMPLATE_ID = os.getenv("LEASE_TEMPLATE_NOTARY_ID")  # Define this in your .env

            # Step 1: Create a new document from the lease template
            create_res = requests.post(
                f"{SIGNNOW_API}/template/{LEASE_TEMPLATE_ID}/copy",
                headers={"Authorization": f"Bearer {token}"},
                json={"document_name": f"{data['full_name']}_lease_agreement"}
            )

            if create_res.status_code != 200:
                return render(request, 'error.html', {
                    "message": "Failed to copy lease agreement template.",
                    "details": create_res.text
                })

            document_id = create_res.json().get("id")

            # (Optional) Step 2: Fetch field IDs if needed
            fields_res = requests.get(
                f"{SIGNNOW_API}/v2/documents/{document_id}/fields",
                headers={"Authorization": f"Bearer {token}"}
            )

            # Save to LeaseAgreementRequest model
            LeaseAgreementNotaryRequest.objects.create(
                full_name=data['full_name'],
                email=data['email'],
                document_id=document_id
            )

            # ✅ Send email notification
            send_mail(
                subject="New Lease Agreement (Notary) Form Submission",
                    message=(
                        f"Name: {data['full_name']}\n"
                        f"Email: {data['email']}\n\n"
                        f"Approve this submission at: https://www.simpleciti.com/admin/"
                    ),
                from_email=None,  # Uses DEFAULT_FROM_EMAIL
                recipient_list=["szade@simpleciti.com"],
                fail_silently=False,
            )

            return render(request, 'success.html', {
                "message": "Your lease agreement request has been received and is pending approval."
            })
    else:
        form = UserForm()

    return render(request, 'user_form.html', {'form': form})

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages

from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required
def profile(request):
    """
    Profile view - handles different profile types based on user_type
    """
    user = request.user

    # Get the appropriate profile based on user type
    if user.user_type == 'client':
        profile, _ = ClientProfile.objects.get_or_create(user=user)
    elif user.user_type == 'lead_referrer':
        profile, _ = LeadReferrerProfile.objects.get_or_create(user=user)
    elif user.user_type == 'property_broker':
        profile, _ = PropertyBrokerProfile.objects.get_or_create(user=user)
    else:
        # Admin and Staff don't have extended profiles
        profile = None

    if request.method == 'POST':
        # Update basic user info
        user.first_name = request.POST.get('first_name', '').strip()
        user.last_name = request.POST.get('last_name', '').strip()
        user.phone = request.POST.get('phone', '').strip()
        user.save()

        # Update profile-specific fields
        if user.user_type == 'client' and profile:
            profile.investment_thesis = request.POST.get('investment_thesis', '').strip()
            profile.financial_goals = request.POST.get('financial_goals', '').strip()
            profile.risk_reward = request.POST.get('risk_reward', '').strip()
            profile.save()

        elif user.user_type == 'property_broker' and profile:
            profile.company_name = request.POST.get('company_name', '').strip()
            profile.license_number = request.POST.get('license_number', '').strip()
            profile.license_state = request.POST.get('license_state', '').strip()
            profile.save()

        elif user.user_type == 'lead_referrer' and profile:
            profile.company_name = request.POST.get('company_name', '').strip()
            profile.save()

        messages.success(request, "Your profile information has been updated.")
        return redirect('profile')

    context = {
        'user': user,
        'profile': profile,
        'user_type': user.get_user_type_display()
    }
    return render(request, 'account.html', context)


from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

User = get_user_model()
# Contact Form
# Contact Form with Enhanced Anti-Spam Filtering
import re
import unicodedata
from django.core.mail import EmailMultiAlternatives
from django.contrib import messages
from django.shortcuts import redirect
import requests

def contact_submit(request):
    if request.method == "POST":
        recaptcha_token = request.POST.get("g-recaptcha-response")
        recaptcha_secret = "6LfwBpIrAAAAAP_mZ2xrP0YTLA8fPUyV0auMFD4S"
        recaptcha_response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': recaptcha_secret,
                'response': recaptcha_token
            }
        )
        recaptcha_result = recaptcha_response.json()
        if not recaptcha_result.get('success'):
            messages.error(request, "reCAPTCHA verification failed. Please try again.")
            return redirect("/")

        # Honeypot
        if request.POST.get("website"):
            return redirect("/")

        first = request.POST.get("firstName")
        last = request.POST.get("lastName")
        email = request.POST.get("email")
        phone = request.POST.get("phone") or "N/A"
        company = request.POST.get("company") or "N/A"
        contact_person = request.POST.get("contactPerson") or "N/A"
        simple_citi = request.POST.get("simpleCiti")
        message_body = request.POST.get("message")

        # Basic validation
        if not (first and last and email and message_body and simple_citi):
            messages.error(request, "Please fill all required fields.")
            return redirect(request.META.get('HTTP_REFERER', '/'))

        # 🚫 NEW: Russian/Cyrillic text filter
        def contains_cyrillic(text):
            """Check if text contains Cyrillic characters (Russian, Ukrainian, etc.)"""
            return bool(re.search(r'[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]', text))

        # Only check fields that aren't N/A
        fields_to_check = [first, last, message_body]
        if company != "N/A":
            fields_to_check.append(company)
        if contact_person != "N/A":
            fields_to_check.append(contact_person)

        combined_text_for_cyrillic = " ".join(fields_to_check)
        if contains_cyrillic(combined_text_for_cyrillic):
            messages.error(request, "Please submit your message in English.")
            return redirect("/")

        # 🚫 NEW: Gibberish and bot detection
        def is_gibberish_or_bot(text, field_name=""):
            """Detect various patterns of gibberish and bot-generated content"""
            if not text or len(text.strip()) < 2:
                return False

            text = text.strip()

            # Check for excessive repeated characters (like "aaaaaaa" or "11111")
            if re.search(r'(.)\1{4,}', text):
                return True

            # Check for random character sequences (consonant/vowel patterns)
            consonant_heavy = len(re.findall(r'[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}', text))
            if consonant_heavy > 2:
                return True

            # Check for excessive numbers in name fields
            if field_name in ["firstName", "lastName", "company"]:
                number_ratio = len(re.findall(r'\d', text)) / len(text)
                if number_ratio > 0.3:  # More than 30% numbers
                    return True

            # Check for URLs or suspicious links
            if re.search(r'(https?://|www\.|\.com|\.net|\.org|\.ru|\.tk|\.ml)', text, re.IGNORECASE):
                return True

            # Check for excessive special characters
            special_char_ratio = len(re.findall(r'[^a-zA-Z0-9\s]', text)) / len(text)
            if special_char_ratio > 0.4:  # More than 40% special chars
                return True

            # Check for all caps (except for very short text)
            if len(text) > 5 and text.isupper():
                return True

            # Check for suspiciously short names (likely bots)
            if field_name in ["firstName", "lastName"] and len(text) == 1:
                return True

            # Check for random character patterns (no vowels in long strings)
            if len(text) > 6:
                vowel_ratio = len(re.findall(r'[aeiouAEIOU]', text)) / len(text)
                if vowel_ratio < 0.1:  # Less than 10% vowels
                    return True

            return False

        # Check each field for gibberish/bot patterns (skip N/A values)
        if (is_gibberish_or_bot(first, "firstName") or
            is_gibberish_or_bot(last, "lastName") or
            (company != "N/A" and is_gibberish_or_bot(company, "company")) or
            (contact_person != "N/A" and is_gibberish_or_bot(contact_person, "contactPerson")) or
            is_gibberish_or_bot(message_body, "message")):
            messages.error(request, "Please provide valid information.")
            return redirect("/")

        # 🚫 NEW: Message quality checks
        def is_low_quality_message(message):
            """Check for low-quality or spam-like messages"""
            if not message:
                return True

            message = message.strip()

            # Too short (likely not a real inquiry)
            if len(message) < 10:
                return True

            # Too long (likely spam)
            if len(message) > 2000:
                return True

            # Excessive line breaks or spaces
            if message.count('\n') > 10 or '  ' in message:
                return True

            # Check for common spam patterns
            spam_patterns = [
                r'click here',
                r'visit.*website',
                r'check.*link',
                r'whatsapp.*\+\d+',
                r'telegram.*@\w+',
                r'email.*@.*\.(tk|ml|ga|cf)',
                r'\$\d+.*per.*day',
                r'make.*money.*online',
                r'100%.*guaranteed',
            ]

            for pattern in spam_patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return True

            return False

        if is_low_quality_message(message_body):
            messages.error(request, "Please provide a more detailed message about your inquiry.")
            return redirect("/")

        # 🚫 Existing spam keyword filter (enhanced)
        SPAM_KEYWORDS = [
            "viagra", "cbd", "porn", "escort", "nude", "sex", "naked", "camgirl", "xxx", "adult", "fetish", "onlyfans",
            "loan", "forex", "crypto", "investment opportunity", "binary options", "nft", "quick money", "get rich", "double your income",
            ".shop", ".site", ".xyz", ".click", ".top", ".link", ".monster", ".rest", ".live", ".blog", ".info", ".win",
            "watch online", "streaming now", "click here", "subscribe", "buy now", "limited offer", "join!", "free gift", "earn from home", "earn money",
            "betting", "casino", "roulette", "slots", "poker", "blackjack", "jackpot", "wager",
            "animated series", "south park", "family guy", "spongebob", "anime", "tv show", "episodes online", "watch now",
            "miracle cure", "weight loss", "diet pills", "male enhancement", "dating site", "tiktok followers", "instagram likes", "buy followers", "fiverr gig",
            # Additional Russian/Eastern European spam keywords
            "rubles", "moscow", "putin", "kremlin", "whatsapp", "telegram", "viber",
            # Common bot phrases
            "greetings", "good day sir", "dear sir/madam", "hope this message finds you well",
            "i am writing to inform you", "kindly revert back", "do the needful"
        ]

        def contains_spam(content):
            return any(keyword in content.lower() for keyword in SPAM_KEYWORDS)

        # Only check fields that aren't N/A
        fields_for_spam_check = [first, last, email, message_body]
        if company != "N/A":
            fields_for_spam_check.append(company)
        if contact_person != "N/A":
            fields_for_spam_check.append(contact_person)

        combined_text = " ".join(fields_for_spam_check)
        if contains_spam(combined_text):
            messages.error(request, "Suspicious content detected. Submission blocked.")
            return redirect("/")

        # 🚫 Enhanced suspicious domain filter
        SUSPICIOUS_TLDS = [
            ".shop", ".xyz", ".site", ".top", ".icu", ".click", ".info", ".buzz", ".work",
            ".rest", ".live", ".cam", ".stream", ".loan", ".win", ".party", ".trade",
            ".online", ".review", ".date", ".gdn", ".ml", ".tk", ".cf", ".ga", ".pw",
            ".today", ".buzz", ".vip", ".rocks", ".club", ".mom", ".life",
            # Russian and Eastern European domains
            ".ru", ".su", ".by", ".ua", ".kz", ".kg", ".tj", ".uz", ".am", ".ge"
        ]

        # Common disposable email providers
        DISPOSABLE_EMAIL_PROVIDERS = [
            "10minutemail", "tempmail", "guerrillamail", "mailinator", "throwaway",
            "temp-mail", "dispostable", "yopmail", "mohmal", "sharklasers"
        ]

        def has_bad_domain(email):
            email_lower = email.lower()
            # Check suspicious TLDs
            if any(email_lower.endswith(tld) for tld in SUSPICIOUS_TLDS):
                return True
            # Check disposable email providers
            if any(provider in email_lower for provider in DISPOSABLE_EMAIL_PROVIDERS):
                return True
            return False

        if has_bad_domain(email):
            messages.error(request, "Please use a valid corporate email address.")
            return redirect("/")

        # NEW: Email format validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            messages.error(request, "Please provide a valid email address.")
            return redirect("/")

        # Passed all checks — send email
        subject = f"Contact Form Submission - {simple_citi}"
        text_content = (
            f"Name: {first} {last}\n"
            f"Email: {email}\n"
            f"Phone: {phone}\n"
            f"Company: {company}\n"
            f"Contact At Simple: {contact_person}\n"
            f"Selected Company: {simple_citi}\n\n"
            f"Message:\n{message_body}"
        )
        html_content = f"""
        <h2>New Contact Form Submission</h2>
        <ul>
            <li><strong>Investor:</strong> {first} {last}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Phone:</strong> {phone}</li>
            <li><strong>Company:</strong> {company}</li>
            <li><strong>Contact At Simple:</strong> {contact_person}</li>
            <li><strong>Selected Company:</strong> {simple_citi}</li>
        </ul>
        <h3>Message:</h3>
        <p>{message_body}</p>
        """

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email="mnashed@simpleciti.com",
            to=["szade@simpleciti.com"],
            reply_to=[email],
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send()

        messages.success(request, "Thank you for contacting us! We will be in touch soon.")
        return redirect("/success/")

    return redirect("/")

# Books
def access_request_submit(request):
    if request.method == "POST":
        # Honeypot
        if request.POST.get("company"):
            return redirect("/")  # Bot likely filled it, silently reject

        first = request.POST.get("first_name")
        last = request.POST.get("last_name")
        email = request.POST.get("corporate_email")
        phone = request.POST.get("phone")
        accredited = "Yes" if request.POST.get("accredited_investor") else "No"
        source = request.POST.get("source", "Unknown")
        comments = request.POST.get("comments", "").strip()

        # block personal emails
        if email and any(domain in email.lower() for domain in ["@gmail.", "@yahoo.", "@hotmail.", "@aol.", "@outlook."]):
            messages.error(request, "Please use a corporate email address.")
            return redirect(request.META.get("HTTP_REFERER", "/"))

        subject = "Investor Submission Alert"

        text_content = (
            f"Name: {first} {last}\n"
            f"Email: {email}\n"
            f"Phone: {phone}\n"
            f"Accredited Investor: {accredited}\n"
            f"Requested Book: {source}\n"
        )
        if comments:
            text_content += f"Comments: {comments}\n"

        html_content = f"""
        <h2>Requested Offering Presentation: {source}</h2>
        <ul>
            <li><strong>Investor:</strong> {first} {last}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Phone:</strong> {phone}</li>
            <li><strong>Accredited Investor:</strong> {accredited}</li>
            <li><strong>Requested Book:</strong> {source}</li>
        </ul>
        """
        if comments:
            html_content += f"<p><strong>Comments:</strong> {comments}</p>"

        # 🔔 Admin notification
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email="mnashed@simpleciti.com",
            to=["szade@simpleciti.com"],
            reply_to=[email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        # ✅ Optionally send deck link here (auto-reply logic)

        messages.success(request, "Success! Check your inbox for access instructions.")
        return redirect("/success/")

    return redirect("/")


from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Property, PropertyImage, PropertyFee
from decimal import Decimal
import json

def can_manage_properties(user):
    """
    Check if user can manage properties.
    Includes: Admins, Staff, and Property Brokers
    """
    if not user.is_authenticated:
        return False
    return user.user_type in ['admin', 'staff', 'property_broker']


def is_property_submitter(user):
    """
    Check if user is a property submitter (not admin).
    This includes Staff and Property Brokers
    """
    if not user.is_authenticated:
        return False
    return user.user_type in ['staff', 'property_broker'] and not user.is_superuser


def is_admin_user(user):
    """Check if user is an admin"""
    return user.is_authenticated and user.user_type == 'admin'


def is_internal_user(user):
    """Check if user is internal (admin or staff)"""
    return user.is_authenticated and user.user_type in ['admin', 'staff']


def is_client(user):
    """Check if user is a client"""
    return user.is_authenticated and user.user_type == 'client'


def is_broker(user):
    """Check if user is a property broker"""
    return user.is_authenticated and user.user_type == 'property_broker'


def is_referrer(user):
    """Check if user is a lead referrer"""
    return user.is_authenticated and user.user_type == 'lead_referrer'


def can_edit_property(user, property_obj):
    """
    Check if user can edit a specific property.

    Rules:
    - Admin: Can edit everything
    - Staff: Can edit drafts only, not approved properties
    - Property Broker: Can edit own drafts only
    """
    if not user.is_authenticated:
        return False

    # Admin can edit everything
    if user.user_type == 'admin':
        return True

    # Staff can edit drafts only
    if user.user_type == 'staff':
        return property_obj.status == 'draft'

    # Property Brokers can edit own drafts only
    if user.user_type == 'property_broker':
        return (property_obj.submitted_by == user and
                property_obj.status == 'draft')

    return False


def can_delete_property(user, property_obj=None):
    """Only admin can delete properties"""
    return user.is_authenticated and user.user_type == 'admin'


def can_approve_property(user):
    """Only admin can approve properties"""
    return user.is_authenticated and user.user_type == 'admin'


def can_add_clients(user):
    """
    Check if user can add clients.

    Rules:
    - Admin: Yes
    - Staff: Yes
    - Lead Referrers: Yes
    - Others: No
    """
    if not user.is_authenticated:
        return False
    return user.user_type in ['admin', 'staff', 'lead_referrer']


def can_edit_clients(user):
    """Only admin can edit clients"""
    return user.is_authenticated and user.user_type == 'admin'


def can_view_all_clients(user):
    """
    Check if user can view all clients.

    Rules:
    - Admin: Yes
    - Staff: Yes
    - Lead Referrers: Only their own
    - Others: No
    """
    if not user.is_authenticated:
        return False
    return user.user_type in ['admin', 'staff']


def get_dashboard_url_by_user_type(user):
    """
    Helper function to redirect users to appropriate dashboard
    based on their user type
    """
    dashboards = {
        'client': '/SE/',  # Client marketplace
        'admin': '/admin/',  # Django admin
        'staff': '/SE/PD/',  # Property dashboard
        'property_broker': '/SE/PD/',  # Property dashboard
        'lead_referrer': '/SE/Clients/',  # Client CRM
    }
    return dashboards.get(user.user_type, '/')

def is_admin_user(user):
    """Check if user is an admin"""
    return user.is_authenticated and user.user_type == 'admin'

def is_internal_user(user):
    """Check if user is internal (admin or staff)"""
    return user.is_authenticated and user.user_type in ['admin', 'staff']

def is_client(user):
    """Check if user is a client"""
    return user.is_authenticated and user.user_type == 'client'

def is_broker(user):
    """Check if user is a property broker"""
    return user.is_authenticated and user.user_type == 'property_broker'

def is_referrer(user):
    """Check if user is a lead referrer"""
    return user.is_authenticated and user.user_type == 'lead_referrer'

def get_dashboard_url_by_user_type(user):
    """
    Helper function to redirect users to appropriate dashboard
    based on their user type
    """
    dashboards = {
        'client': '/SE/',  # Client dashboard
        'admin': '/admin/',  # Django admin
        'staff': '/SE/PD/',  # Property dashboard
        'property_broker': '/SE/PD/',  # Property dashboard
        'lead_referrer': '/referrer/dashboard/',  # Add this route later
    }
    return dashboards.get(user.user_type, '/')

@login_required
@user_passes_test(can_manage_properties)
def manage_dashboard(request):
    """Main management dashboard"""
    # ✅ Optimized: Base queryset with relations prefetched
    base_qs = Property.objects.select_related('broker_user', 'submitted_by')
    
    # Filter properties based on user type
    if request.user.user_type == 'admin':
        properties = base_qs.all()
    elif request.user.user_type == 'staff':
        properties = base_qs.all()
    elif request.user.user_type == 'property_broker':
        # Brokers see only their own properties
        properties = base_qs.filter(submitted_by=request.user)
    else:
        properties = Property.objects.none()

    properties = properties.order_by('-close_date')

    # Get stats
    total_properties = properties.count()
    active_properties = properties.filter(is_active=True).count()
    pipeline_properties = properties.filter(is_pipeline=True).count()
    draft_properties = properties.filter(status='draft').count()
    pending_properties = properties.filter(status='pending_review').count()
    approved_properties = properties.filter(status='approved').count()

    # Get price totals
    from django.db.models import Sum

    draft_total = properties.filter(status='draft').aggregate(
        total=Sum('purchase_price')
    )['total'] or 0

    pending_total = properties.filter(status='pending_review').aggregate(
        total=Sum('purchase_price')
    )['total'] or 0

    approved_total = properties.filter(status='approved').aggregate(
        total=Sum('purchase_price')
    )['total'] or 0

    # Format to millions
    def format_millions(amount):
        if amount:
            millions = float(amount) / 1_000_000
            return f"{millions:.2f}"
        return "0.00"

    context = {
        'properties': properties,
        'total_properties': total_properties,
        'active_properties': active_properties,
        'pipeline_properties': pipeline_properties,

        # Draft stats
        'draft_properties': draft_properties,
        'draft_total': format_millions(draft_total),

        # Pending stats
        'pending_properties': pending_properties,
        'pending_total': format_millions(pending_total),

        # Approved stats
        'approved_properties': approved_properties,
        'approved_total': format_millions(approved_total),

        'can_delete': can_delete_property(request.user),
        'can_approve': can_approve_property(request.user),
        'user': request.user
    }

    return render(request, 'manage_dashboard.html', context)
@login_required
@user_passes_test(can_manage_properties)
def add_property(request):
    """Add new property with approval workflow"""
    if request.method == 'POST':
        publish_mode = request.POST.get('publish_mode')  # 'live' | 'pipeline' | None
        # Check if this is an image upload request
        if 'image_file' in request.FILES:
            property_id = request.POST.get('property_id')
            property_obj = get_object_or_404(Property, id=property_id)

            image_file = request.FILES['image_file']

            # Validate file type
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            file_ext = os.path.splitext(image_file.name)[1].lower()

            if file_ext not in allowed_extensions:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.'
                })

            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"property_{property_obj.reference_number}_{timestamp}{file_ext}"
            filepath = f"property_images/{filename}"

            # Save the file
            saved_path = default_storage.save(filepath, ContentFile(image_file.read()))

            # Generate the full URL
            image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)

            # Get current max order
            max_order = property_obj.images.aggregate(Max('order'))['order__max']
            next_order = (max_order + 1) if max_order is not None else 0

            # Create PropertyImage record
            image = PropertyImage.objects.create(
                property=property_obj,
                image_url=image_url,
                order=next_order
            )

            return JsonResponse({
                'success': True,
                'image_id': image.id,
                'image_url': image_url,
                'order': next_order
            })

        # Original property creation logic
        try:
            # Helper functions
            def safe_decimal(value, default=0):
                if value is None or value == '':
                    return Decimal(str(default))
                value_str = str(value).strip().replace('$', '').replace(',', '').replace('%', '').strip()
                if not value_str:
                    return Decimal(str(default))
                try:
                    return Decimal(value_str)
                except (ValueError, decimal.InvalidOperation):
                    return Decimal(str(default))

            def safe_int(value, default=0):
                if value is None or value == '':
                    return default
                value_str = str(value).strip().replace(',', '').replace('%', '').strip()
                if not value_str:
                    return default
                try:
                    return int(float(value_str))
                except (ValueError, TypeError):
                    return default

            # ✅ REMOVED VALIDATION - Accept empty fields
            title = request.POST.get('title', '').strip()
            if not title:
                title = 'Untitled Property'  # Default title if empty

            close_date = request.POST.get('close_date') or None  # Allow null input, will default if missing

            property_type = request.POST.get('property_type', '').strip()
            if not property_type:
                property_type = 'Misc.'  # Default property type

            # Generate reference number
            reference_number = generate_reference_number(property_type)

            # Auto-calculate fields before creating property
            purchase_price = safe_decimal(request.POST.get('purchase_price'))
            total_equity = safe_decimal(request.POST.get('total_equity'))
            current_noi = safe_decimal(request.POST.get('current_noi'))
            est_annual_cash_flow = safe_decimal(request.POST.get('est_annual_cash_flow')) if request.POST.get('est_annual_cash_flow') else None

            # Calculate derived fields
            debt_amount = Decimal('0')
            ltv = 0
            cap_rate = Decimal('0')
            est_cash_on_cash = Decimal('0')
            per_100k = Decimal('0')

            if purchase_price and total_equity:
                debt_amount = purchase_price - total_equity
                if purchase_price > 0:
                    ltv = round((debt_amount / purchase_price * 100), 0)

            if purchase_price and purchase_price > 0 and current_noi:
                cap_rate = round((current_noi / purchase_price * 100), 2)

            if total_equity and total_equity > 0 and est_annual_cash_flow:
                est_cash_on_cash = round((est_annual_cash_flow / total_equity * 100), 2)
                per_100k = round((est_cash_on_cash * 1000), 2)

                # Handle document uploads
            for key in request.FILES:
                if key.startswith('document_'):
                    # Parse the key to get document type
                    # Example: 'document_om_0' -> type='om', index='0'
                    parts = key.split('_')
                    if len(parts) >= 3:
                        doc_type = parts[1]
                        file = request.FILES[key]

            # Create the property with all fields
            # Fallback defaults for required non-null numeric/date fields if user left blank
            from datetime import date, timedelta
            if close_date is None:
                # Provide a default closing date 30 days from today
                close_date = date.today() + timedelta(days=30)

            # Ensure purchase_price numeric even if blank
            if purchase_price is None:
                purchase_price = Decimal('0')

            property_obj = Property.objects.create(
                # Basic Information
                reference_number=reference_number,
                title=title,
                property_header=request.POST.get('property_header', ''),
                address=request.POST.get('address', ''),
                property_type=property_type,
                deal_stage=request.POST.get('deal_stage', 'LOI_OUT'),
                marketing_title=request.POST.get('marketing_title', ''),
                hero_summary=request.POST.get('hero_summary', ''),
                is_featured=request.POST.get('is_featured') == 'on',
                submitted_by=request.user,
                created_by=request.user,
                status='draft',
                # Will be set below based on publish_mode; default draft visibility off
                is_active=False,
                is_pipeline=False,

                # Key Dates
                loi_date=request.POST.get('loi_date') or None,
                psa_date=request.POST.get('psa_date') or None,
                dd_end_date=request.POST.get('dd_end_date') or None,
                close_date=close_date,

                # Building Info
                total_sf=safe_int(request.POST.get('total_sf')),
                acres=safe_decimal(request.POST.get('acres')),
                total_units=safe_int(request.POST.get('total_units')),
                vacancy_percent=safe_decimal(request.POST.get('vacancy_percent')),
                vacant_sf=safe_int(request.POST.get('vacant_sf')),
                walt=safe_decimal(request.POST.get('walt')),

                # Location
                city=request.POST.get('city', ''),
                state=request.POST.get('state', ''),
                zip_code=request.POST.get('zip_code', ''),
                submarket=request.POST.get('submarket', ''),
                location_highlights=request.POST.get('location_highlights', ''),

                # Financial - with auto-calculated fields
                purchase_price=purchase_price,
                cap_rate=cap_rate,
                current_noi=current_noi,
                debt_amount=debt_amount,
                interest_rate=safe_decimal(request.POST.get('interest_rate')),
                dscr=safe_decimal(request.POST.get('dscr')),
                total_equity=total_equity,
                ltv=ltv,
                est_annual_cash_flow=est_annual_cash_flow,
                per_100k=per_100k,
                est_cash_on_cash=est_cash_on_cash,
                distribution_frequency=request.POST.get('distribution_frequency', ''),

                # Tenant Information
                num_tenants=safe_int(request.POST.get('num_tenants')) if request.POST.get('num_tenants') else None,
                occupancy_percent=safe_decimal(request.POST.get('occupancy_percent')) if request.POST.get('occupancy_percent') else None,
                lease_structure=request.POST.get('lease_structure', ''),
                tenancy_hero=request.POST.get('tenancy_hero', ''),

                # Top Tenant 1
                tenant_1_name=request.POST.get('tenant_1_name', ''),
                tenant_1_sf=safe_int(request.POST.get('tenant_1_sf')) if request.POST.get('tenant_1_sf') else None,
                tenant_1_percent=safe_decimal(request.POST.get('tenant_1_percent')) if request.POST.get('tenant_1_percent') else None,
                tenant_1_expiry=request.POST.get('tenant_1_expiry') or None,
                tenant_1_guarantee=request.POST.get('tenant_1_guarantee', ''),
                tenant_1_lease_structure=request.POST.get('tenant_1_lease_structure', ''),

                # Top Tenant 2
                tenant_2_name=request.POST.get('tenant_2_name', ''),
                tenant_2_sf=safe_int(request.POST.get('tenant_2_sf')) if request.POST.get('tenant_2_sf') else None,
                tenant_2_percent=safe_decimal(request.POST.get('tenant_2_percent')) if request.POST.get('tenant_2_percent') else None,
                tenant_2_expiry=request.POST.get('tenant_2_expiry') or None,
                tenant_2_guarantee=request.POST.get('tenant_2_guarantee', ''),
                tenant_2_lease_structure=request.POST.get('tenant_2_lease_structure', ''),

                # Top Tenant 3
                tenant_3_name=request.POST.get('tenant_3_name', ''),
                tenant_3_sf=safe_int(request.POST.get('tenant_3_sf')) if request.POST.get('tenant_3_sf') else None,
                tenant_3_percent=safe_decimal(request.POST.get('tenant_3_percent')) if request.POST.get('tenant_3_percent') else None,
                tenant_3_expiry=request.POST.get('tenant_3_expiry') or None,
                tenant_3_guarantee=request.POST.get('tenant_3_guarantee', ''),
                tenant_3_lease_structure=request.POST.get('tenant_3_lease_structure', ''),

                # Business Plan & KBIs
                business_plan=request.POST.get('business_plan', ''),
                kbi_1=request.POST.get('kbi_1', ''),
                kbi_2=request.POST.get('kbi_2', ''),
                kbi_3=request.POST.get('kbi_3', ''),
                kbi_4=request.POST.get('kbi_4', ''),

                # Investment Status
                current_funding=safe_decimal(request.POST.get('current_funding')),
                max_investors=safe_int(request.POST.get('max_investors', 5)),
                current_investors=safe_int(request.POST.get('current_investors')),
                projected_irr=safe_decimal(request.POST.get('projected_irr')),
                hold_period_years=safe_int(request.POST.get('hold_period_years', 5)),

                # Broker Info
                broker_name=request.POST.get('broker_name', ''),
                broker_email=request.POST.get('broker_email', ''),
                broker_phone=request.POST.get('broker_phone', ''),
                broker_cell=request.POST.get('broker_cell', ''),
                broker_company=request.POST.get('broker_company', ''),
                commission=safe_decimal(request.POST.get('commission')) if request.POST.get('commission') else None,  # NEW FIELD
                broker_notes=request.POST.get('broker_notes', ''),

                # Internal Notes
                internal_notes=request.POST.get('internal_notes', ''),
            )

            print("=" * 60)
            print("✅ PROPERTY CREATED")
            print(f"   ID: {property_obj.id}")
            print(f"   Reference: {property_obj.reference_number}")
            print(f"   Title: {property_obj.title}")
            print(f"   Cap Rate: {property_obj.cap_rate}%")
            print(f"   Cash on Cash: {property_obj.est_cash_on_cash}%")
            print(f"   LTV: {property_obj.ltv}%")
            print("=" * 60)

            # Publication flags based on publish_mode (if user has permission)
            if publish_mode == 'live' and request.user.has_perm('properties.can_publish'):
                property_obj.is_active = True
                property_obj.is_pipeline = False
                property_obj.status = 'approved'
                property_obj.reviewed_by = request.user
                property_obj.reviewed_at = timezone.now()
                property_obj.submitted_at = timezone.now()
                property_obj.save()
            elif publish_mode == 'pipeline' and request.user.has_perm('properties.can_publish_to_pipeline'):
                property_obj.is_active = False
                property_obj.is_pipeline = True
                property_obj.status = 'approved'
                property_obj.reviewed_by = request.user
                property_obj.reviewed_at = timezone.now()
                property_obj.submitted_at = timezone.now()
                property_obj.save()

            # Send email notification for draft or published
            try:
                send_mail(
                    subject=f'Property Draft Submitted: {property_obj.title}',
                    message=(
                        f'A new property has been submitted as a draft by {request.user.get_full_name()}.\n\n'
                        f'Property ID: {property_obj.id}\n'
                        f'Reference: {property_obj.reference_number}\n'
                        f'Title: {property_obj.title}\n'
                        f'Address: {property_obj.address}, {property_obj.city}, {property_obj.state}\n\n'
                        f'Please review in the admin panel.'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=['mnashed@simpleciti.com', 'szade@simpleciti.com'],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error sending draft email: {e}")

            # Return JSON response with property ID for image uploads
            return JsonResponse({
                'success': True,
                'property_id': property_obj.id,
                'reference_number': property_obj.reference_number,
                'title': property_obj.title,
                'published': property_obj.is_active,
                'pipeline': property_obj.is_pipeline
            })

        except Exception as e:
            import traceback
            print("=" * 50)
            print("ADD PROPERTY ERROR:")
            print(traceback.format_exc())
            print("=" * 50)
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

    # GET request
    context = {
        'is_staff': can_manage_properties(request.user),
        'can_submit': request.user.has_perm('properties.can_submit_review'),
        'can_publish': request.user.has_perm('properties.can_publish'),
        'can_pipeline': request.user.has_perm('properties.can_publish_to_pipeline'),
    }

    return render(request, 'add_property.html', context)

@login_required
@user_passes_test(can_approve_property)
def approve_property(request, reference_number):
    """Approve a property submission (Admin only)"""
    property_obj = get_object_or_404(Property, reference_number=reference_number)

    if request.method == 'POST':
        admin_notes = request.POST.get('admin_notes', '')
        publish_type = request.POST.get('publish_type', 'live')  # 'live' or 'pipeline'

        property_obj.status = 'approved'
        property_obj.reviewed_by = request.user
        property_obj.reviewed_at = timezone.now()
        property_obj.admin_notes = admin_notes

        if publish_type == 'pipeline':
            property_obj.is_active = False
            property_obj.is_pipeline = True
            messages.success(request, f'✓ Property "{property_obj.title}" approved and published to PIPELINE!')
        else:
            property_obj.is_active = True
            property_obj.is_pipeline = False
            messages.success(request, f'✓ Property "{property_obj.title}" approved and published to LIVE marketplace!')

        property_obj.save()
        return redirect('manage_dashboard')

    context = {
        'property': property_obj,
        'action': 'approve'
    }
    return render(request, 'review_property.html', context)


@login_required
@user_passes_test(can_approve_property)
def deny_property(request, reference_number):
    """Deny a property submission (Admin only)"""
    property_obj = get_object_or_404(Property, reference_number=reference_number)

    if request.method == 'POST':
        admin_notes = request.POST.get('admin_notes', '')

        if not admin_notes:
            messages.error(request, 'Please provide a reason for denial.')
            context = {
                'property': property_obj,
                'action': 'deny'
            }
            return render(request, 'review_property.html', context)

        property_obj.status = 'denied'
        property_obj.is_active = False
        property_obj.reviewed_by = request.user
        property_obj.reviewed_at = timezone.now()
        property_obj.admin_notes = admin_notes
        property_obj.save()

        messages.success(request, f'Property "{property_obj.title}" denied.')
        return redirect('manage_dashboard')

    context = {
        'property': property_obj,
        'action': 'deny'
    }
    return render(request, 'review_property.html', context)
@login_required
@user_passes_test(can_manage_properties)
def edit_property(request, reference_number):
    """Edit existing property"""
    property_obj = get_object_or_404(Property, reference_number=reference_number)

    # ✅ CHECK EDIT PERMISSION
    if not can_edit_property(request.user, property_obj):
        messages.error(request, 'You do not have permission to edit this property.')
        return redirect('manage_dashboard')

    if request.method == 'POST':
        # ============================================
        # HANDLE IMAGE UPLOAD SEPARATELY (AJAX-style)
        # ============================================
        if 'image_file' in request.FILES:
            print("🔍 IMAGE UPLOAD STARTED")

            image_file = request.FILES['image_file']
            slot_number = request.POST.get('slot_number')

            print(f"🔍 Slot number received: {slot_number}")
            print(f"🔍 POST data: {dict(request.POST)}")
            print(f"🔍 File: {image_file.name}")

            # Validate file type
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            file_ext = os.path.splitext(image_file.name)[1].lower()

            if file_ext not in allowed_extensions:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.'
                })

            try:
                # Generate unique filename
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"property_{property_obj.reference_number}_{timestamp}{file_ext}"
                filepath = f"property_images/{filename}"

                # Save the file
                saved_path = default_storage.save(filepath, ContentFile(image_file.read()))
                image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)

                print(f"✅ File saved to: {saved_path}")
                print(f"✅ Image URL: {image_url}")

                # Check if slot_number provided
                if slot_number:
                    order = int(slot_number) - 1
                    print(f"🔍 Looking for existing image with order: {order}")

                    # Check if image exists in this slot
                    existing_image = PropertyImage.objects.filter(
                        property=property_obj,
                        order=order
                    ).first()

                    print(f"🔍 Existing image found: {existing_image}")

                    if existing_image:
                        print(f"🔄 REPLACING image #{existing_image.id}")

                        # Delete old file
                        try:
                            old_path = existing_image.image_url.replace(settings.MEDIA_URL, '').replace(request.build_absolute_uri('/')[:-1], '')
                            print(f"🔍 Trying to delete old file: {old_path}")
                            if default_storage.exists(old_path):
                                default_storage.delete(old_path)
                                print(f"✅ Old file deleted")
                            else:
                                print(f"⚠️ Old file not found")
                        except Exception as e:
                            print(f"❌ Could not delete old file: {e}")

                        # Update existing record
                        existing_image.image_url = image_url
                        existing_image.save()
                        image_id = existing_image.id
                        print(f"✅ Updated existing image #{image_id}")
                    else:
                        print(f"➕ CREATING new image in slot {slot_number}")
                        # Create new in specific slot
                        new_image = PropertyImage.objects.create(
                            property=property_obj,
                            image_url=image_url,
                            order=order
                        )
                        image_id = new_image.id
                        print(f"✅ Created new image #{image_id}")
                else:
                    print(f"⚠️ No slot_number provided, adding to end")
                    # No slot specified, add to end
                    max_order = property_obj.images.aggregate(Max('order'))['order__max']
                    next_order = (max_order + 1) if max_order is not None else 0

                    new_image = PropertyImage.objects.create(
                        property=property_obj,
                        image_url=image_url,
                        order=next_order
                    )
                    image_id = new_image.id
                    order = next_order
                    print(f"✅ Created new image #{image_id} at order {order}")

                print(f"✅ Returning success with image_id: {image_id}")

                return JsonResponse({
                    'success': True,
                    'image_id': image_id,
                    'image_url': image_url,
                    'order': order
                })

            except Exception as e:
                import traceback
                print(f"❌ ERROR: {str(e)}")
                print(traceback.format_exc())
                return JsonResponse({
                    'success': False,
                    'error': f'Error uploading image: {str(e)}'
                })

        # ============================================
        # HANDLE PROPERTY FORM SUBMISSION
        # ============================================
        try:
            # Helper functions
            def safe_decimal(value, default=0):
                if value is None or value == '':
                    return Decimal(str(default))
                value_str = str(value).strip().replace('$', '').replace(',', '').replace('%', '').strip()
                if not value_str:
                    return Decimal(str(default))
                try:
                    return Decimal(value_str)
                except (ValueError, decimal.InvalidOperation):
                    return Decimal(str(default))

            def safe_int(value, default=0):
                if value is None or value == '':
                    return default
                value_str = str(value).strip().replace(',', '').replace('%', '').strip()
                if not value_str:
                    return default
                try:
                    return int(float(value_str))
                except (ValueError, TypeError):
                    return default

            # ✅ PREVENT EDITING APPROVED PROPERTIES (non-admins)
            if property_obj.status == 'approved' and request.user.user_type != 'admin':
                messages.error(request, 'Cannot edit approved properties. Contact admin.')
                return redirect('manage_dashboard')

# ============================================
# HANDLE DOCUMENT UPLOADS
# ============================================
            for key in request.FILES:
                if key.startswith('document_'):
                    # Parse the key to get document type
                    # Example: 'document_om_0' -> type='om', index='0'
                    parts = key.split('_')
                    if len(parts) >= 2:
                        doc_type = parts[1]
                        file = request.FILES[key]

                        # Validate document type
                        valid_types = ['om', 'rentroll', 'proforma', 'tic', 'environmental',
                                      'legal', 'operating', 'market', 'brochure', 'other']

                        if doc_type in valid_types:
                            # Create PropertyDocument record
                            PropertyDocument.objects.create(
                                property=property_obj,
                                document_type=doc_type,
                                file=file,
                                filename=file.name,
                                uploaded_by=request.user
                            )
                            print(f"✅ Saved document: {file.name} as type {doc_type}")

            # ============================================
            # UPDATE ALL FIELDS FROM FORM
            # ============================================

            # Basic Information
            new_property_type = request.POST.get('property_type')
            if property_obj.property_type != new_property_type:
                property_obj.reference_number = generate_reference_number(new_property_type)

            property_obj.title = request.POST.get('title')
            property_obj.property_header = request.POST.get('property_header', '')
            property_obj.address = request.POST.get('address')
            property_obj.property_type = new_property_type
            property_obj.city = request.POST.get('city', '')
            property_obj.state = request.POST.get('state', '')
            property_obj.zip = request.POST.get('zip', '')
            property_obj.submarket = request.POST.get('submarket', '')
            property_obj.marketing_title = request.POST.get('marketing_title', '')
            property_obj.hero_summary = request.POST.get('hero_summary', '')
            property_obj.location_highlights = request.POST.get('location_highlights', '')
            property_obj.zip_code = request.POST.get('zip_code', '')

            # Building Info
            property_obj.total_sf = safe_int(request.POST.get('total_sf'))
            property_obj.acres = safe_decimal(request.POST.get('acres'))
            property_obj.total_units = safe_int(request.POST.get('total_units'))
            property_obj.vacancy_percent = safe_decimal(request.POST.get('vacancy_percent'))
            property_obj.vacant_sf = safe_int(request.POST.get('vacant_sf'))
            property_obj.walt = safe_decimal(request.POST.get('walt'))

            # Financial - Primary (from Summary tab)
            property_obj.purchase_price = safe_decimal(request.POST.get('purchase_price'))
            property_obj.total_equity = safe_decimal(request.POST.get('total_equity'))
            property_obj.current_noi = safe_decimal(request.POST.get('current_noi'))
            property_obj.projected_irr = safe_decimal(request.POST.get('projected_irr'))
            property_obj.interest_rate = safe_decimal(request.POST.get('interest_rate'))
            property_obj.dscr = safe_decimal(request.POST.get('dscr'))

            # Financial - Extended (from Details tab)
            property_obj.est_annual_cash_flow = safe_decimal(request.POST.get('est_annual_cash_flow')) if request.POST.get('est_annual_cash_flow') else None
            property_obj.distribution_frequency = request.POST.get('distribution_frequency', '')

            # Tenant Information (from Details tab)
            property_obj.num_tenants = safe_int(request.POST.get('num_tenants')) if request.POST.get('num_tenants') else None
            property_obj.occupancy_percent = safe_decimal(request.POST.get('occupancy_percent')) if request.POST.get('occupancy_percent') else None
            property_obj.lease_structure = request.POST.get('lease_structure', '')  # Keep for backwards compatibility
            property_obj.tenancy_hero = request.POST.get('tenancy_hero', '')  # NEW FIELD

            # Top Tenant 1
            property_obj.tenant_1_name = request.POST.get('tenant_1_name', '')
            property_obj.tenant_1_sf = safe_int(request.POST.get('tenant_1_sf')) if request.POST.get('tenant_1_sf') else None
            property_obj.tenant_1_percent = safe_decimal(request.POST.get('tenant_1_percent')) if request.POST.get('tenant_1_percent') else None
            property_obj.tenant_1_expiry = request.POST.get('tenant_1_expiry') or None
            property_obj.tenant_1_guarantee = request.POST.get('tenant_1_guarantee', '')
            property_obj.tenant_1_lease_structure = request.POST.get('tenant_1_lease_structure', '')  # NEW FIELD

            # Top Tenant 2
            property_obj.tenant_2_name = request.POST.get('tenant_2_name', '')
            property_obj.tenant_2_sf = safe_int(request.POST.get('tenant_2_sf')) if request.POST.get('tenant_2_sf') else None
            property_obj.tenant_2_percent = safe_decimal(request.POST.get('tenant_2_percent')) if request.POST.get('tenant_2_percent') else None
            property_obj.tenant_2_expiry = request.POST.get('tenant_2_expiry') or None
            property_obj.tenant_2_guarantee = request.POST.get('tenant_2_guarantee', '')
            property_obj.tenant_2_lease_structure = request.POST.get('tenant_2_lease_structure', '')  # NEW FIELD

            # Top Tenant 3
            property_obj.tenant_3_name = request.POST.get('tenant_3_name', '')
            property_obj.tenant_3_sf = safe_int(request.POST.get('tenant_3_sf')) if request.POST.get('tenant_3_sf') else None
            property_obj.tenant_3_percent = safe_decimal(request.POST.get('tenant_3_percent')) if request.POST.get('tenant_3_percent') else None
            property_obj.tenant_3_expiry = request.POST.get('tenant_3_expiry') or None
            property_obj.tenant_3_guarantee = request.POST.get('tenant_3_guarantee', '')
            property_obj.tenant_3_lease_structure = request.POST.get('tenant_3_lease_structure', '')  # NEW FIELD

            # Key Dates
            property_obj.close_date = request.POST.get('close_date')
            property_obj.loi_date = request.POST.get('loi_date') or None
            property_obj.psa_date = request.POST.get('psa_date') or None
            property_obj.dd_end_date = request.POST.get('dd_end_date') or None

            # Business Plan & KBIs
            property_obj.kbi_1 = request.POST.get('kbi_1', '')
            property_obj.kbi_2 = request.POST.get('kbi_2', '')
            property_obj.kbi_3 = request.POST.get('kbi_3', '')
            property_obj.kbi_4 = request.POST.get('kbi_4', '')
            property_obj.business_plan = request.POST.get('business_plan', '')

            # Broker Info
            property_obj.broker_name = request.POST.get('broker_name', '')
            property_obj.broker_email = request.POST.get('broker_email', '')
            property_obj.broker_phone = request.POST.get('broker_phone', '')
            property_obj.broker_cell = request.POST.get('broker_cell', '')  # NEW FIELD
            property_obj.broker_company = request.POST.get('broker_company', '')
            property_obj.commission = safe_decimal(request.POST.get('commission')) if request.POST.get('commission') else None  # NEW FIELD

            # Internal Notes
            property_obj.internal_notes = request.POST.get('internal_notes', '')

            # Deal Stage
            property_obj.deal_stage = request.POST.get('deal_stage', 'LOI_OUT')

            # Featured Toggle
            property_obj.is_featured = request.POST.get('is_featured') == 'on'

            # ============================================
            # AUTO-CALCULATE DERIVED FIELDS (BEFORE SAVE!)
            # ============================================

            print("=" * 60)
            print("🔧 CALCULATING DERIVED FIELDS")
            print(f"   Purchase Price: {property_obj.purchase_price}")
            print(f"   Total Equity: {property_obj.total_equity}")
            print(f"   Current NOI: {property_obj.current_noi}")
            print(f"   Annual Cash Flow: {property_obj.est_annual_cash_flow}")

            # Auto-calculate Cap Rate
            if property_obj.purchase_price and property_obj.purchase_price > 0 and property_obj.current_noi:
                property_obj.cap_rate = round((property_obj.current_noi / property_obj.purchase_price * 100), 2)
                print(f"   ✅ Cap Rate Calculated: {property_obj.cap_rate}%")
            else:
                print(f"   ❌ Cap Rate NOT calculated (missing data)")

            # Auto-calculate Cash on Cash
            if property_obj.total_equity and property_obj.total_equity > 0 and property_obj.est_annual_cash_flow:
                property_obj.est_cash_on_cash = round((property_obj.est_annual_cash_flow / property_obj.total_equity * 100), 2)
                property_obj.per_100k = round((property_obj.est_cash_on_cash * 1000), 2)
                print(f"   ✅ Cash on Cash Calculated: {property_obj.est_cash_on_cash}%")
                print(f"   ✅ Per $100k Calculated: ${property_obj.per_100k}")
            else:
                print(f"   ❌ Cash on Cash NOT calculated (missing data)")

            # Auto-calculate Debt and LTV
            if property_obj.purchase_price and property_obj.total_equity:
                debt = property_obj.purchase_price - property_obj.total_equity
                property_obj.debt_amount = debt
                if property_obj.purchase_price > 0:
                    property_obj.ltv = round((debt / property_obj.purchase_price * 100), 0)
                print(f"   ✅ Debt Calculated: ${property_obj.debt_amount}")
                print(f"   ✅ LTV Calculated: {property_obj.ltv}%")
            else:
                print(f"   ❌ Debt/LTV NOT calculated (missing data)")

            print("=" * 60)

            # ============================================
            # THREE-BUTTON APPROVAL WORKFLOW
            # ============================================
            is_active_checkbox = request.POST.get('is_active') == 'on'
            is_pipeline_checkbox = request.POST.get('is_pipeline') == 'on'

            if is_active_checkbox:
                property_obj.status = 'approved'
                property_obj.is_active = True
                property_obj.is_pipeline = False
                property_obj.reviewed_by = request.user
                property_obj.reviewed_at = timezone.now()
                property_obj.submitted_at = timezone.now()
                messages.success(request, f'✅ Property "{property_obj.title}" published to LIVE marketplace!')

            elif is_pipeline_checkbox:
                property_obj.status = 'approved'
                property_obj.is_active = False
                property_obj.is_pipeline = True
                property_obj.reviewed_by = request.user
                property_obj.reviewed_at = timezone.now()
                property_obj.submitted_at = timezone.now()
                messages.success(request, f'✅ Property "{property_obj.title}" published to PIPELINE!')

            else:
                property_obj.is_active = False
                property_obj.is_pipeline = False
                if property_obj.status == 'pending_review':
                    property_obj.status = 'draft'
                messages.success(request, f'💾 Property "{property_obj.title}" saved as draft.')

            # ============================================
            # SAVE THE PROPERTY
            # ============================================
            property_obj.save()

            print("=" * 60)
            print("✅ PROPERTY SAVED TO DATABASE")
            print(f"   Cap Rate in DB: {property_obj.cap_rate}")
            print(f"   Cash on Cash in DB: {property_obj.est_cash_on_cash}")
            print("=" * 60)

            return redirect('manage_dashboard')

        except Exception as e:
            import traceback
            print("=" * 50)
            print("EDIT PROPERTY ERROR:")
            print(traceback.format_exc())
            print("=" * 50)
            messages.error(request, f'❌ Error updating property: {str(e)}')

    # ============================================
    # GET REQUEST - RENDER FORM
    # ============================================

    # Serialize images for JavaScript
    images_data = []
    for img in property_obj.images.all().order_by('order'):
        images_data.append({
            'id': img.id,
            'image_url': img.image_url,
            'order': img.order
        })

    context = {
        'property': property_obj,
        'images': json.dumps(images_data),
        'documents': json.dumps([{
            'id': doc.id,
            'document_type': doc.document_type,
            'filename': doc.filename,
            'file_url': doc.file.url if doc.file else ''
        } for doc in property_obj.documents.all()]),
        'is_staff': can_manage_properties(request.user),
        'can_submit': request.user.has_perm('properties.can_submit_review'),
        'can_publish': request.user.has_perm('properties.can_publish'),
        'can_pipeline': request.user.has_perm('properties.can_publish_to_pipeline'),
        'submitted_by_name': property_obj.submitted_by.get_full_name() if property_obj.submitted_by else 'Unknown',
        'submitted_date': property_obj.submitted_at.strftime('%m/%d/%Y') if property_obj.submitted_at else property_obj.created_at.strftime('%m/%d/%Y'),
    }
    return render(request, 'edit_property.html', context)

@login_required
@user_passes_test(can_manage_properties)
def delete_property_image(request, reference_number, image_id):
    """Delete a property image"""
    property_obj = get_object_or_404(Property, reference_number=reference_number)
    image_obj = get_object_or_404(PropertyImage, id=image_id, property=property_obj)

    # Try to delete the actual file from storage
    try:
        image_path = image_obj.image_url.replace(settings.MEDIA_URL, '').replace(request.build_absolute_uri('/')[:-1], '')
        if default_storage.exists(image_path):
            default_storage.delete(image_path)
    except Exception as e:
        print(f"Could not delete file: {e}")

    # Delete the database record
    image_obj.delete()

    # Reorder remaining images
    for idx, img in enumerate(property_obj.images.all().order_by('order')):
        img.order = idx
        img.save()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})

    messages.success(request, 'Image deleted successfully!')
    return redirect('manage_images', reference_number=reference_number)


from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from datetime import datetime

@login_required
@user_passes_test(can_manage_properties)
def manage_images(request, reference_number):
    """Manage property images"""
    property_obj = get_object_or_404(Property, reference_number=reference_number)

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'add':
            # Check if file was uploaded
            if 'image_file' in request.FILES:
                image_file = request.FILES['image_file']
                image_id = request.POST.get('image_id')  # get existing image ID if replacing

                # Validate file type
                allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                file_ext = os.path.splitext(image_file.name)[1].lower()
                if file_ext not in allowed_extensions:
                    messages.error(request, 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.')
                    return redirect('manage_images', reference_number=reference_number)

                # Generate unique filename
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"property_{property_obj.reference_number}_{timestamp}{file_ext}"
                filepath = f"property_images/{filename}"

                # Save the file
                saved_path = default_storage.save(filepath, ContentFile(image_file.read()))
                image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)

                if image_id:
                    # Replace existing image
                    image_obj = PropertyImage.objects.filter(id=image_id, property=property_obj).first()
                    if image_obj:
                        # Delete old file
                        try:
                            old_path = image_obj.image_url.replace(settings.MEDIA_URL, '')
                            if default_storage.exists(old_path):
                                default_storage.delete(old_path)
                        except Exception as e:
                            print(f"Could not delete old file: {e}")

                        # Update database record
                        image_obj.image_url = image_url
                        image_obj.save()
                        messages.success(request, 'Image replaced successfully!')
                    else:
                        messages.error(request, 'Image not found for replacement.')
                else:
                    # Add new image
                    PropertyImage.objects.create(
                        property=property_obj,
                        image_url=image_url,
                        order=property_obj.images.count()
                    )
                    messages.success(request, 'Image uploaded successfully!')
            else:
                messages.error(request, 'No file selected.')

        elif action == 'delete':
            image_id = request.POST.get('image_id')
            image_obj = PropertyImage.objects.filter(id=image_id, property=property_obj).first()

            if image_obj:
                # Try to delete the actual file from storage
                try:
                    image_path = image_obj.image_url.replace(settings.MEDIA_URL, '')
                    if default_storage.exists(image_path):
                        default_storage.delete(image_path)
                except Exception as e:
                    print(f"Could not delete file: {e}")

                # Delete the database record
                image_obj.delete()

                # Reorder remaining images
                for idx, img in enumerate(property_obj.images.all().order_by('order')):
                    img.order = idx
                    img.save()

                messages.success(request, 'Image deleted successfully!')

        elif action == 'reorder':
            # Update image orders
            order_data = json.loads(request.POST.get('order_data', '[]'))
            for item in order_data:
                PropertyImage.objects.filter(
                    id=item['id'],
                    property=property_obj
                ).update(order=item['order'])
            messages.success(request, 'Images reordered successfully!')

        return redirect('manage_images', reference_number=reference_number)

    # GET request
    context = {
        'property': property_obj,
        'images': property_obj.images.all().order_by('order')
    }
    return render(request, 'manage_images.html', context)

@login_required
@user_passes_test(lambda u: can_delete_property(u))
def delete_property(request, reference_number):
    """Delete property (admin only)"""
    if request.method == 'POST':
        property_obj = get_object_or_404(Property, reference_number=reference_number)

        # Double-check permission
        if not can_delete_property(request.user):
            messages.error(request, 'Only administrators can delete properties.')
            return redirect('manage_dashboard')

        title = property_obj.title
        property_obj.delete()
        messages.success(request, f'Property "{title}" deleted successfully!')

    return redirect('manage_dashboard')

@login_required
@user_passes_test(can_manage_properties)
def quick_edit_field(request, reference_number):
    """AJAX endpoint for quick inline editing"""
    if request.method == 'POST':
        property_obj = get_object_or_404(Property, reference_number=reference_number)
        field_name = request.POST.get('field')
        value = request.POST.get('value')

        try:
            setattr(property_obj, field_name, value)
            property_obj.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request'})

# ============================================
# ADD TO views.py
# ============================================

from django.views.decorators.http import require_http_methods
from django.core.mail import EmailMultiAlternatives
from .models import PropertyEnrollment

@csrf_exempt
@require_http_methods(["POST"])
def enrollment_submit(request):
    """
    Handle enrollment form submission.
    Saves data to database and sends email notification.
    """
    try:
        # Get form data
        email = request.POST.get('email', '').strip()
        sale_price = request.POST.get('sale_price', '').strip()
        equity_rollover = request.POST.get('equity_rollover', '').strip()
        closing_date = request.POST.get('closing_date', '').strip()
        qi_name = request.POST.get('qi_name', '').strip()
        needs_qi_referral = request.POST.get('needs_qi_referral') == 'on'
        property_id = request.POST.get('property_id', '').strip()

        # Validation
        if not all([email, sale_price, equity_rollover, closing_date, property_id]):
            return JsonResponse({
                'success': False,
                'error': 'Please fill in all required fields.'
            }, status=400)

        # Validate email format
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return JsonResponse({
                'success': False,
                'error': 'Please enter a valid email address.'
            }, status=400)

        # Get property
        try:
            property_obj = Property.objects.get(reference_number=property_id)
        except Property.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Property not found.'
            }, status=404)

        # Convert currency strings to Decimal
        def clean_currency(value):
            """Remove $ and , from currency string"""
            return Decimal(value.replace('$', '').replace(',', '').strip())

        try:
            sale_price_decimal = clean_currency(sale_price)
            equity_rollover_decimal = clean_currency(equity_rollover)
        except (ValueError, decimal.InvalidOperation):
            return JsonResponse({
                'success': False,
                'error': 'Invalid currency format.'
            }, status=400)

        # Validate closing date
        try:
            from datetime import datetime
            closing_date_obj = datetime.strptime(closing_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid date format.'
            }, status=400)

        # Get client IP address
        def get_client_ip(request):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            return ip

        # Create enrollment record
        enrollment = PropertyEnrollment.objects.create(
            email=email,
            sale_price=sale_price_decimal,
            equity_rollover=equity_rollover_decimal,
            closing_date=closing_date_obj,
            qi_name=qi_name,
            needs_qi_referral=needs_qi_referral,
            property=property_obj,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )

        # Send email notification
        send_enrollment_email(enrollment)

        return JsonResponse({
            'success': True,
            'message': 'Enrollment submitted successfully!',
            'property_id': property_id
        })

    except Exception as e:
        import traceback
        print("=" * 50)
        print("ENROLLMENT ERROR:")
        print(traceback.format_exc())
        print("=" * 50)

        return JsonResponse({
            'success': False,
            'error': 'An error occurred. Please try again.'
        }, status=500)


# ============================================
# CORRECTED send_enrollment_email function for views.py
# Replace the existing send_enrollment_email function
# ============================================

def send_enrollment_email(enrollment):
    """
    Send email notification about new enrollment.
    """
    property_obj = enrollment.property

    # Calculate days until closing - USE METHOD instead of property
    from datetime import date
    days_remaining = enrollment.get_days_until_closing()
    if days_remaining is None:
        days_remaining = 0

    # QI Status
    if enrollment.needs_qi_referral:
        qi_status = "NEEDS REFERRAL"
    elif enrollment.qi_name:
        qi_status = f"{enrollment.qi_name}"
    else:
        qi_status = "one provided"

    # Deadline warnings
    deadline_warnings = []
    if days_remaining <= 45:
        deadline_warnings.append("URGENT: Within 45-day identification deadline!")
    elif days_remaining <= 180:
        deadline_warnings.append("Within 180-day purchase deadline")

    deadline_text = "\n".join(deadline_warnings) if deadline_warnings else "No immediate deadlines"

    # Email subject
    subject = f"New 1031 Enrollment - {property_obj.reference_number}"

    # Plain text version
    text_content = f"""
New Property Enrollment Submitted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {enrollment.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPERTY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: {property_obj.title}
Reference: {property_obj.reference_number}
Type: {property_obj.property_type}
Link: https://www.simpleciti.com/SE/deal-detail/{property_obj.reference_number}/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSACTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sale Price (Relinquished):  ${enrollment.sale_price:,.2f}
Equity Rollover (1031):     ${enrollment.equity_rollover:,.2f}
Closing Date:               {enrollment.closing_date.strftime('%B %d, %Y')}
Days Remaining:             {days_remaining} days

{deadline_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALIFIED INTERMEDIARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: {qi_status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBMISSION INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: {enrollment.created_at.strftime('%B %d, %Y at %I:%M %p %Z')}
IP Address: {enrollment.ip_address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View in Admin: https://www.simpleciti.com/admin/
    """

    # HTML version
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f5f7fa;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #6b2737 0%, #1e293b 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .section {{
                padding: 25px;
                border-bottom: 1px solid #e2e8f0;
            }}
            .section:last-child {{
                border-bottom: none;
            }}
            .section-title {{
                font-size: 14px;
                color: #6b2737;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 15px;
            }}
            .info-row {{
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
            }}
            .info-label {{
                color: #64748b;
                font-size: 14px;
            }}
            .info-value {{
                color: #1e293b;
                font-weight: 600;
                font-size: 14px;
            }}
            .highlight {{
                background: #fef3c7;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #f59e0b;
                margin: 15px 0;
            }}
            .urgent {{
                background: #fee2e2;
                border-left-color: #ef4444;
            }}
            .btn {{
                display: inline-block;
                background: #6b2737;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color:black;">New 1031 Exchange Enrollment</h1>
                <p style="margin: 5px 0 0; opacity: 0.9; color: black;">{property_obj.reference_number}</p>
            </div>

            <div class="section">
                <div class="section-title">Contact Information</div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{enrollment.email}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Property Details</div>
                <div class="info-row">
                    <span class="info-label">Property:</span>
                    <span class="info-value">{property_obj.title}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Reference:</span>
                    <span class="info-value">{property_obj.reference_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{property_obj.property_type}</span>
                </div>
                <a href="https://www.simpleciti.com/SE/deal-detail/{property_obj.reference_number}/" class="btn">View Property</a>
            </div>

            <div class="section">
                <div class="section-title">Transaction Details</div>
                <div class="info-row">
                    <span class="info-label">Sale Price (Relinquished):</span>
                    <span class="info-value">${enrollment.sale_price:,.2f}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Equity Rollover (1031):</span>
                    <span class="info-value">${enrollment.equity_rollover:,.2f}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Closing Date:</span>
                    <span class="info-value">{enrollment.closing_date.strftime('%B %d, %Y')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Days Remaining:</span>
                    <span class="info-value">{days_remaining} days</span>
                </div>

                {"<div class='highlight urgent'>" + deadline_text + "</div>" if days_remaining <= 45 else "<div class='highlight'>" + deadline_text + "</div>" if days_remaining <= 180 else ""}
            </div>

            <div class="section">
                <div class="section-title">Qualified Intermediary</div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">{qi_status}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Submission Info</div>
                <div class="info-row">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">{enrollment.created_at.strftime('%B %d, %Y at %I:%M %p')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">IP Address:</span>
                    <span class="info-value">{enrollment.ip_address}</span>
                </div>
                <a href="https://www.simpleciti.com/admin/" class="btn">View in Admin</a>
            </div>
        </div>
    </body>
    </html>
    """

    # Create email
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email="mnashed@simpleciti.com",
        to=["mnashed@simpleciti.com", "szade@simpleciti.com"],
        reply_to=[enrollment.email]
    )

    email.attach_alternative(html_content, "text/html")

    # Send email
    try:
        email.send(fail_silently=False)
        print(f"✅ Enrollment email sent for {enrollment.email}")
    except Exception as e:
        print(f"❌ Failed to send enrollment email: {e}")
        pass

@login_required
@user_passes_test(lambda u: u.user_type in ['admin', 'staff', 'lead_referrer'])
def clients_list(request):
    """
    Displays clients based on user permissions:
    - Admin/Staff: See all clients
    - Lead Referrers: See only their own referred clients
    """
    import re

    # Filter clients based on user type
    if request.user.user_type in ['admin', 'staff']:
        # Admin and Staff see all clients
        clients = CustomUser.objects.filter(
            user_type='client'
        ).select_related('client_profile').order_by('-date_joined')

    elif request.user.user_type == 'lead_referrer':
        # Referrers see only clients they added
        client_profiles = ClientProfile.objects.filter(
            added_by=request.user
        ).select_related('user')

        # Get the user objects
        client_ids = [profile.user.id for profile in client_profiles]
        clients = CustomUser.objects.filter(id__in=client_ids).order_by('-date_joined')

    else:
        # No access for others
        clients = CustomUser.objects.none()

    # Add formatting for each client
    for client in clients:
        # Get provider info from social accounts (if using django-allauth)
        if hasattr(client, 'socialaccount_set') and client.socialaccount_set.exists():
            client.provider = client.socialaccount_set.first().provider
        else:
            client.provider = None

        # Format phone number as (XXX) XXX-XXXX
        if client.phone:
            digits = re.sub(r'\D', '', client.phone)
            if len(digits) == 11 and digits[0] == '1':
                digits = digits[1:]
            if len(digits) == 10:
                client.formatted_phone = f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
            else:
                client.formatted_phone = client.phone
        else:
            client.formatted_phone = None

    context = {
        'clients': clients,
        'can_edit': can_edit_clients(request.user),
        'user': request.user
    }
    return render(request, 'clients_list.html', context)


import json
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import openai
from django.conf import settings

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

@csrf_exempt
@require_http_methods(["POST"])
def chat_completions(request):
    """
    Handle chat completion requests from the frontend
    """
    try:
        data = json.loads(request.body)
        messages = data.get('messages', [])
        model = data.get('model', 'gpt-4')

        # Make request to OpenAI API
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        return JsonResponse({
            'success': True,
            'message': response.choices[0].message.content,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


def chat_page(request):
    return render(request, 'chat.html')

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import ExchangeIDForm
from .models import ExchangeID

@login_required
def create_exchange_id(request):
    """
    View to create a new Exchange ID for the logged-in user
    """
    if request.method == 'POST':
        form = ExchangeIDForm(request.POST)
        if form.is_valid():
            exchange = form.save(commit=False)
            exchange.user = request.user
            exchange.save()

            messages.success(
                request,
                f'Exchange ID created successfully: {exchange.exchange_id}'
            )
            return redirect('create_exchange_id')
    else:
        form = ExchangeIDForm()

    # Get user's existing exchange IDs
    user_exchanges = ExchangeID.objects.filter(user=request.user)

    context = {
        'form': form,
        'user_exchanges': user_exchanges,
    }
    return render(request, 'SE/create_exchange_id.html', context)

@login_required
def list_exchange_ids(request):
    """
    View to display all Exchange IDs for the logged-in user
    """
    user_exchanges = ExchangeID.objects.filter(user=request.user).order_by('-created_at')

    context = {
        'user_exchanges': user_exchanges,
    }
    return render(request, 'SE/list_exchange_ids.html', context)

@login_required
@require_POST
def like_property(request):
    """
    API endpoint to like a property for a specific Exchange ID
    """
    try:
        # Try to parse JSON body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            print(f"Request body: {request.body}")
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        property_id = data.get('property_id')  # This is actually reference_number like 'RE-5004'
        exchange_id = data.get('exchange_id')

        print(f"Attempting to like - Property ID: {property_id}, Exchange ID: {exchange_id}")

        if not property_id or not exchange_id:
            return JsonResponse({'success': False, 'error': 'Missing property_id or exchange_id'}, status=400)

        # Verify user owns this exchange ID
        try:
            exchange = ExchangeID.objects.get(id=exchange_id, user=request.user)
        except ExchangeID.DoesNotExist:
            print(f"Exchange ID not found: {exchange_id}")
            return JsonResponse({'success': False, 'error': 'Exchange ID not found'}, status=404)

        # Get property by reference_number (not database id)
        try:
            property_obj = Property.objects.get(reference_number=property_id)
        except Property.DoesNotExist:
            print(f"Property not found: {property_id}")
            return JsonResponse({'success': False, 'error': 'Property not found'}, status=404)

        # Create or get the like
        like, created = PropertyLike.objects.get_or_create(
            user=request.user,
            exchange_id=exchange,
            property=property_obj
        )

        return JsonResponse({
            'success': True,
            'liked': True,
            'message': f'Property added to {exchange.exchange_id}'
        })

    except Exception as e:
        print(f"Unexpected error in like_property: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
@require_POST
def unlike_property(request):
    """
    API endpoint to unlike a property
    """
    try:
        data = json.loads(request.body)
        property_id = data.get('property_id')  # This is reference_number
        exchange_id = data.get('exchange_id')

        # Get the property by reference_number
        property_obj = Property.objects.get(reference_number=property_id)

        # Delete the like
        PropertyLike.objects.filter(
            user=request.user,
            exchange_id_id=exchange_id,
            property_id=property_obj.id  # Use the actual database id here
        ).delete()

        return JsonResponse({
            'success': True,
            'liked': False,
            'message': 'Property removed from replacements'
        })

    except Property.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Property not found'}, status=404)
    except Exception as e:
        print(f"Error in unlike_property: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
def get_user_likes(request):
    """
    API endpoint to get all property likes for the current user
    """
    try:
        likes = PropertyLike.objects.filter(user=request.user).values(
            'property_id',
            'exchange_id_id'
        )

        # Create a lookup dict: {property_id: [exchange_id1, exchange_id2, ...]}
        likes_dict = {}
        for like in likes:
            prop_id = str(like['property_id'])
            if prop_id not in likes_dict:
                likes_dict[prop_id] = []
            likes_dict[prop_id].append(like['exchange_id_id'])

        return JsonResponse({'likes': likes_dict})
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_user_likes: {str(e)}")
        return JsonResponse({'likes': {}})  # Return empty likes on error


@login_required
def get_user_exchange_ids(request):
    """
    API endpoint to get all exchange IDs for dropdown
    """
    exchanges = ExchangeID.objects.filter(user=request.user).values(
        'id',
        'exchange_id'
    ).order_by('-created_at')

    return JsonResponse({'exchange_ids': list(exchanges)})
from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.account.signals import user_signed_up
from allauth.socialaccount.signals import social_account_added
from .models import CustomUser, ClientProfile, LeadReferrerProfile, PropertyBrokerProfile

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create profile whenever a CustomUser is created
    """
    if created:
        if instance.user_type == 'client':
            profile, _ = ClientProfile.objects.get_or_create(user=instance)
            profile.save()  # triggers auto-generation of client_id and alias
        elif instance.user_type == 'lead_referrer':
            LeadReferrerProfile.objects.get_or_create(user=instance)
        elif instance.user_type == 'property_broker':
            PropertyBrokerProfile.objects.get_or_create(user=instance)

@receiver(user_signed_up)
def create_profile_on_oauth_signup(sender, request, user, **kwargs):
    """
    Create client profile for OAuth users
    """
    if user.user_type == 'client':
        profile, _ = ClientProfile.objects.get_or_create(user=user)
        profile.save()  # ensures client_id and alias are generated

@receiver(social_account_added)
def sync_email_from_social(sender, request, sociallogin, **kwargs):
    """Sync email from OAuth provider to User.email"""
    user = sociallogin.user
    email = sociallogin.account.extra_data.get('email')
    if email and not user.email:
        user.email = email
        user.save()

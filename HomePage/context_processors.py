from HomePage.models import ExchangeID

def exchange_status(request):
    """
    Adds 'has_exchange_id' to all templates.
    True if the logged-in user has any ExchangeID objects.
    """
    has_exchange_id = False

    if request.user.is_authenticated:
        has_exchange_id = ExchangeID.objects.filter(user=request.user).exists()

    return {'has_exchange_id': has_exchange_id}

from .models import ExchangeID

def user_exchange_id(request):
    """
    Add user's most recent exchange ID to all template contexts
    """
    if request.user.is_authenticated:
        latest_exchange = ExchangeID.objects.filter(user=request.user).order_by('-created_at').first()
        return {
            'user_latest_exchange': latest_exchange,
            'has_exchange_id': latest_exchange is not None
        }
    return {
        'user_latest_exchange': None,
        'has_exchange_id': False
    }
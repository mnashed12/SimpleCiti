import json
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from HomePage.models import ChatUsage
import openai

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

# Limits
MAX_TOTAL_MESSAGES = 20
WARNING_THRESHOLD = 15


def get_or_create_usage(user):
    """Get or create chat usage for user"""
    usage, created = ChatUsage.objects.get_or_create(user=user)
    return usage


def send_warning_email(user, usage):
    """Send email when user hits 15 prompts"""
    if usage.email_sent_at_15:
        return  # Already sent
    
    # Calculate time since first message
    time_diff = timezone.now() - usage.first_message_at
    hours = time_diff.total_seconds() / 3600
    days = time_diff.days
    
    if days > 0:
        time_str = f"{days} day{'s' if days != 1 else ''}"
    else:
        time_str = f"{int(hours)} hour{'s' if int(hours) != 1 else ''}"
    
    subject = f"User Alert: {user.username} has reached 15 prompts"
    message = f"""
User: {user.username}
Email: {user.email}
Total Prompts: {usage.message_count}
Time Period: {time_str}
First Message: {usage.first_message_at.strftime('%Y-%m-%d %H:%M:%S')}
Last Message: {usage.last_message_at.strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    recipient_email = ['szade@simpleciti.com', 'mnashed@simpleciti.com']
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        usage.email_sent_at_15 = True
        usage.save()
    except Exception as e:
        print(f"Failed to send email: {e}")


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def chat_completions(request):
    """
    Handle chat completion requests from the frontend
    """
    try:
        # Get or create usage tracking
        usage = get_or_create_usage(request.user)
        
        # Check if user exceeded limit
        if usage.message_count >= MAX_TOTAL_MESSAGES:
            return JsonResponse({
                'success': False,
                'error': f'You have reached your limit of {MAX_TOTAL_MESSAGES} messages.',
                'limit_reached': True
            }, status=429)
        
        data = json.loads(request.body)
        messages = data.get('messages', [])
        
        # FORCE GPT-3.5 TURBO ONLY
        model = 'gpt-3.5-turbo'
        
        # LIMIT TO LAST MESSAGE ONLY
        if len(messages) > 1:
            messages = [messages[-1]]
        
        # Make request to OpenAI API
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        # Increment usage counter
        usage.message_count += 1
        usage.last_message_at = timezone.now()
        usage.save()
        
        # Send warning email at 15 prompts
        if usage.message_count == WARNING_THRESHOLD:
            send_warning_email(request.user, usage)
        
        # Calculate remaining messages
        remaining = MAX_TOTAL_MESSAGES - usage.message_count
        
        return JsonResponse({
            'success': True,
            'message': response.choices[0].message.content,
            'remaining_messages': remaining
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid request format'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def chat_stream(request):
    """
    Handle streaming chat completion requests for real-time responses
    """
    try:
        # Get or create usage tracking
        usage = get_or_create_usage(request.user)
        
        # Check if user exceeded limit
        if usage.message_count >= MAX_TOTAL_MESSAGES:
            return JsonResponse({
                'success': False,
                'error': f'You have reached your limit of {MAX_TOTAL_MESSAGES} messages.',
                'limit_reached': True
            }, status=429)
        
        data = json.loads(request.body)
        messages = data.get('messages', [])
        
        # FORCE GPT-3.5 TURBO ONLY
        model = 'gpt-3.5-turbo'
        
        # LIMIT TO LAST MESSAGE ONLY
        if len(messages) > 1:
            messages = [messages[-1]]
        
        def generate():
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            yield "data: [DONE]\n\n"
        
        # Increment usage counter
        usage.message_count += 1
        usage.last_message_at = timezone.now()
        usage.save()
        
        # Send warning email at 15 prompts
        if usage.message_count == WARNING_THRESHOLD:
            send_warning_email(request.user, usage)
        
        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
from django.shortcuts import redirect

class WwwRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host()
        # Only redirect safe idempotent requests to avoid dropping POST bodies (login forms, etc.)
        if request.method in ('GET', 'HEAD'):
            if host.startswith('simpleciti.com') and not host.startswith('www.'):
                return redirect(f'https://www.{host}{request.get_full_path()}', permanent=True)
        return self.get_response(request)

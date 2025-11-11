from django.shortcuts import redirect

class WwwRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host()
        if host.startswith('simpleciti.com') and not host.startswith('www.'):
            return redirect(f'https://www.{host}{request.get_full_path()}', permanent=True)
        return self.get_response(request)

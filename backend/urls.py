from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore
from django.contrib import sitemaps
from django.contrib.sitemaps.views import sitemap
from HomePage.sitemaps import StaticViewSitemap
from HomePage.react_urls import react_urlpatterns
from django.conf import settings
from django.conf.urls.static import static

sitemaps_dict = {
    'static': StaticViewSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/se/', include('HomePage.api_urls')),  # SE React API endpoints
    path('accounts/', include('allauth.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps_dict}, name='django.contrib.sitemaps.views.sitemap'),
] + react_urlpatterns + [
    # HomePage.urls should NOT include any SE/* routes - those are handled by React catch-all above
    path('', include('HomePage.urls')),
    path('SC/', include('HomePage.urls')),
    path('SM/', include('HomePage.urls')),
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
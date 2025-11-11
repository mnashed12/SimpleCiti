from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore
from django.contrib import sitemaps
from django.contrib.sitemaps.views import sitemap
from HomePage.sitemaps import StaticViewSitemap

sitemaps_dict = {
    'static': StaticViewSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('HomePage.urls')),
    path('SC/', include('HomePage.urls')),
    path('SM/', include('HomePage.urls')),
    path('SE/', include('HomePage.urls')),
    path('accounts/', include('allauth.urls')),
    path('', include('HomePage.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps_dict}, name='django.contrib.sitemaps.views.sitemap'),
]
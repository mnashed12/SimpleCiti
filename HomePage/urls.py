from django.urls import path    # type: ignore
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('team/', views.team, name='team'),
    path('history/', views.history, name='history'),
    path('advisoryboard/', views.advisoryboard, name='advisoryboard'),
    path('foradvisors/', views.foradvisors, name='foradvisors'),
    path('SA/', views.SA, name='SA'),
    path('SE/', views.SE, name='SE'),
    path('NE/', views.NE, name='NE'),
    path('NE/About/', views.NEAbout, name='NEAbout'),
    path('tools/', views.tools, name='tools'),
    path('appraisal/', views.appraisal, name='appraisal'),
]

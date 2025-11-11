from django.apps import AppConfig

class HomepageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'HomePage'
    
    def ready(self):
        import HomePage.signals  # Load signals when app is ready
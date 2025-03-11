import os
import sys

# Add the correct path to the SimpleCiti folder
path = '/home/SimpleCiti'
if path not in sys.path:
    sys.path.append(path)

# Set the settings module to backend.settings (since the settings are under backend)
os.environ['DJANGO_SETTINGS_MODULE'] = 'SimpleCiti.backend.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

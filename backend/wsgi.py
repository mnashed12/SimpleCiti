"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import sys

# Path to your project
project_home = '/home/SimpleCiti/SimpleCiti'
if project_home not in sys.path:
    sys.path.append(project_home)

# Set the environment variable for settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

# Start the Django application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

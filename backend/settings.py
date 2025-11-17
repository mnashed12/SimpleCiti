from pathlib import Path
import os
import cloudinary
from decouple import Config, RepositoryEnv, Csv, config as decouple_config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from project root (not backend/)
env_path = BASE_DIR / '.env'
if env_path.exists():
    config = Config(RepositoryEnv(str(env_path)))
else:
    # Fallback to default decouple behavior (checks environment variables)
    config = decouple_config


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-00w(uv*3h_pug0unb-ejewduqwx8$ji^rkk(gw(m!7z!dql*(a')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)

# Controls whether Django templates reference the Vite dev server (port 5173)
USE_VITE_DEV = config('USE_VITE_DEV', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())

# OpenAI API Key
OPENAI_API_KEY = config('OPENAI_API_KEY', default=None)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # Add these:
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.microsoft',
    'allauth.socialaccount.providers.linkedin_oauth2',
    'django.contrib.humanize',

    'HomePage',
   'corsheaders',
    'cloudinary',
    'cloudinary_storage',
    'rest_framework',
    'storages',
    'django.contrib.sitemaps',
]

AUTH_USER_MODEL = 'HomePage.CustomUser'

SITE_ID = 1

# Application definition
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': 'ddqije02i',
    'API_KEY': '287675254581962',
    'API_SECRET': 'fYaQcsDG3GAHOfwtQXtj5Px9gdg',
    'secure' : True
}

MIDDLEWARE = [
    'HomePage.middleware.WwwRedirectMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:8000',  # Your frontend URL
    'http://localhost:5173',  # Vite dev server
    'https://your-frontend-domain.com',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',  # Vite dev server
    'http://localhost:8000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8000',
    'https://www.simpleciti.com',
    'https://simpleciti.com',
    'https://simpleciti.pythonanywhere.com',  # PythonAnywhere domain
    'https://www.simpleciti.pythonanywhere.com',
]

# Session and Cookie settings for production cross-domain compatibility
SESSION_COOKIE_SECURE = False  # Set True if using HTTPS everywhere
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'  # Allow cookies across same-site requests
CSRF_COOKIE_SECURE = False  # Set True if using HTTPS everywhere
CSRF_COOKIE_HTTPONLY = False  # JS needs to read CSRF token
CSRF_COOKIE_SAMESITE = 'Lax'

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'HomePage/Templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'HomePage.context_processors.exchange_status',
                'HomePage.context_processors.user_exchange_id',
            ],
        },
    },
]


WSGI_APPLICATION = 'backend.wsgi.application'


"""
Database
Defaults to SQLite for local/dev. Switch to Postgres by setting env DB_ENGINE=postgres
and providing POSTGRES_NAME, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT.
"""

DB_ENGINE = config('DB_ENGINE', default='sqlite').lower()

if DB_ENGINE == 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('POSTGRES_NAME', default='simpleciti'),
            'USER': config('POSTGRES_USER', default='postgres'),
            'PASSWORD': config('POSTGRES_PASSWORD', default=''),
            'HOST': config('POSTGRES_HOST', default='127.0.0.1'),
            'PORT': config('POSTGRES_PORT', default='5432'),
            'CONN_MAX_AGE': 60,
            'OPTIONS': {
                # Enable SSL if provided; common on managed providers
                'sslmode': config('POSTGRES_SSLMODE', default='prefer'),
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# settings.py

STATIC_URL = '/static/'

# Development: serve from staticfiles directory
# Production: don't use STATICFILES_DIRS, only STATIC_ROOT
if DEBUG:
    STATICFILES_DIRS = [BASE_DIR / "staticfiles"]
    STATIC_ROOT = None  # Not used in development
else:
    STATICFILES_DIRS = []
    STATIC_ROOT = BASE_DIR / "staticfiles"  # Production serves from here

"""
Static & Media
By default, static served locally; media stored locally. If USE_S3=True, store media on S3.
"""

# To serve media files (uploads) from local storage by default
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Optional: use S3 for media files in production
USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default=None)
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default=None)
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default=None)
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default=None)
    AWS_S3_SIGNATURE_VERSION = config('AWS_S3_SIGNATURE_VERSION', default='s3v4')
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False

    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    # If you'd also like to put static files on S3, uncomment below and set up collectstatic
    # STATICFILES_STORAGE = 'storages.backends.s3boto3.S3ManifestStaticStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Allauth settings
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Redirect after login/logout
LOGIN_REDIRECT_URL = '/SE/Hub'
ACCOUNT_LOGIN_REDIRECT_URL = '/SE/Hub'
ACCOUNT_LOGOUT_REDIRECT_URL = '/accounts/login/'


SIGNNOW_CLIENT_ID = '7d0b7c6ec95d3ec68f455fa5d3e0814e'
SIGNNOW_CLIENT_SECRET = 'c779d1f2f313103dd66a3b931fb13190'
SIGNNOW_BASIC_AUTH = 'N2QwYjdjNmVjOTVkM2VjNjhmNDU1ZmE1ZDNlMDgxNGU6Yzc3OWQxZjJmMzEzMTAzZGQ2NmEzYjkzMWZiMTMxOTA='
SIGNNOW_USERNAME = 'mnashed@simpleciti.com'
SIGNNOW_PASSWORD = 'HelloWorld1!'



# settings.py

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.office365.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mnashed@simpleciti.com'
EMAIL_HOST_PASSWORD = 'manageexchange123!'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# ✅ ADD THESE NEW SETTINGS:
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_QUERY_EMAIL = True
ACCOUNT_AUTHENTICATION_METHOD = 'username_email'

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# ✅ ADD THIS - CRITICAL FOR GOOGLE EMAIL:
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'FETCH_USERINFO': True,
    },
    'microsoft': {
        'SCOPE': [
            'User.Read',
            'email',
        ],
    }
}


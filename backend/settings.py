from pathlib import Path
import os
import cloudinary

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-00w(uv*3h_pug0unb-ejewduqwx8$ji^rkk(gw(m!7z!dql*(a'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['simpleciti.pythonanywhere.com', 'www.simpleciti.pythonanywhere.com', 'SimpleCiti.com', 'www.SimpleCiti.com', 'simpleciti.com', "127.0.0.1"]

# Just hardcode it directly - TEMPORARY ONLY
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

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
    'https://your-frontend-domain.com',
]

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


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

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

# To serve media files (uploads) from local storage
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Allauth settings
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Redirect after login
LOGIN_REDIRECT_URL = '/SE/'
ACCOUNT_LOGOUT_REDIRECT_URL = '/user/login/'


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


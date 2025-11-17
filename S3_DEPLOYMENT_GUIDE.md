# S3 Configuration - Production Deployment Guide

## Changes Made

### 1. Updated `backend/settings.py`
- Replaced deprecated `DEFAULT_FILE_STORAGE` with modern `STORAGES` configuration
- Added proper Django 4.2+ compatible S3 storage backend
- Configuration now properly switches between local and S3 storage based on `USE_S3` environment variable

### 2. Key Changes:
```python
# OLD (deprecated):
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# NEW (Django 4.2+):
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
```

## Production Deployment Steps (PythonAnywhere)

### Step 1: Pull Latest Code
```bash
cd ~/SimpleCiti
git pull origin master
```

### Step 2: Set Environment Variables in WSGI File
Your WSGI file already has the environment variables set. Verify they are present in `/var/www/simpleciti_pythonanywhere_com_wsgi.py`:

```python
os.environ["USE_S3"] = "True"
os.environ["AWS_ACCESS_KEY_ID"] = "YOUR_AWS_ACCESS_KEY_ID"
os.environ["AWS_SECRET_ACCESS_KEY"] = "YOUR_AWS_SECRET_ACCESS_KEY"
os.environ["AWS_STORAGE_BUCKET_NAME"] = "simpleciti-media"
os.environ["AWS_S3_REGION_NAME"] = "us-east-1"
os.environ["AWS_S3_CUSTOM_DOMAIN"] = "simpleciti-media.s3.amazonaws.com"
```

**Note:** Use your actual AWS credentials from your secure configuration.

### Step 3: Verify S3 Configuration
Run the verification script in the PythonAnywhere bash console:
```bash
cd ~/SimpleCiti
python verify_s3_config.py
```

Expected output:
```
============================================================
S3 CONFIGURATION VERIFICATION
============================================================

✓ USE_S3: True
✓ AWS_ACCESS_KEY_ID: Set
✓ AWS_SECRET_ACCESS_KEY: Set
✓ AWS_STORAGE_BUCKET_NAME: simpleciti-media
✓ AWS_S3_REGION_NAME: us-east-1
✓ AWS_S3_CUSTOM_DOMAIN: simpleciti-media.s3.amazonaws.com

✓ Storage Backend: storages.backends.s3.S3Storage
✓ MEDIA_URL: https://simpleciti-media.s3.amazonaws.com/

============================================================
TESTING S3 CONNECTION
============================================================

✓ S3 Connection: SUCCESS
✓ Directories found: X
✓ Files found: X

============================================================
✓ ALL CHECKS PASSED - S3 is properly configured!
============================================================
```

### Step 4: Reload Web App
In PythonAnywhere:
1. Go to Web tab
2. Click "Reload" button for your web app

### Step 5: Test Upload
Test uploading a file through your application to verify S3 is working correctly.

## Troubleshooting

### If S3 is not working:

1. **Check Environment Variables**: Ensure all AWS credentials are set in the WSGI file
2. **Check boto3 Installation**: Run `pip install boto3` if needed
3. **Check django-storages Version**: Run `pip show django-storages` (should be 1.14+)
4. **Check IAM Permissions**: Ensure AWS credentials have proper S3 permissions
5. **Check Bucket Policy**: Verify bucket exists and is accessible

### Common Issues:

**Issue**: "Storage: FileSystemStorage" even with USE_S3=True
**Solution**: This was the original problem - fixed by using STORAGES instead of DEFAULT_FILE_STORAGE

**Issue**: "No module named 'storages'"
**Solution**: Run `pip install django-storages boto3`

**Issue**: Access Denied errors
**Solution**: Verify AWS credentials and IAM permissions for S3 bucket

## Required Python Packages
Ensure these are installed in production:
```
django-storages>=1.14
boto3>=1.26
```

## Notes
- The `.env` file is NOT committed to git (and shouldn't be)
- Production uses environment variables set in the WSGI file
- Local development can use `.env` file for convenience
- MEDIA_URL automatically points to S3 when USE_S3=True
- Static files remain local (not on S3)

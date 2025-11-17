"""
Verification script to check S3 configuration
Run this on production after deployment to verify S3 is working
"""
import os
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.conf import settings
from django.core.files.storage import default_storage

def verify_s3_config():
    print("=" * 60)
    print("S3 CONFIGURATION VERIFICATION")
    print("=" * 60)
    
    # Check USE_S3
    use_s3 = getattr(settings, 'USE_S3', False)
    print(f"\n✓ USE_S3: {use_s3}")
    
    if not use_s3:
        print("\n❌ ERROR: USE_S3 is False!")
        print("Set environment variable: USE_S3=True")
        return False
    
    # Check AWS credentials
    aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
    aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
    aws_bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    aws_region = getattr(settings, 'AWS_S3_REGION_NAME', None)
    aws_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
    
    print(f"✓ AWS_ACCESS_KEY_ID: {'Set' if aws_access_key else '❌ NOT SET'}")
    print(f"✓ AWS_SECRET_ACCESS_KEY: {'Set' if aws_secret_key else '❌ NOT SET'}")
    print(f"✓ AWS_STORAGE_BUCKET_NAME: {aws_bucket or '❌ NOT SET'}")
    print(f"✓ AWS_S3_REGION_NAME: {aws_region or '❌ NOT SET'}")
    print(f"✓ AWS_S3_CUSTOM_DOMAIN: {aws_domain or 'Not set (will use default)'}")
    
    # Check storage backend
    storage_backend = default_storage.__class__.__module__ + '.' + default_storage.__class__.__name__
    print(f"\n✓ Storage Backend: {storage_backend}")
    
    if 'S3' not in storage_backend:
        print("\n❌ ERROR: Not using S3 storage!")
        print(f"Current backend: {storage_backend}")
        return False
    
    # Check MEDIA_URL
    media_url = settings.MEDIA_URL
    print(f"✓ MEDIA_URL: {media_url}")
    
    if 's3.amazonaws.com' not in media_url and aws_domain not in media_url:
        print("\n⚠ WARNING: MEDIA_URL doesn't point to S3!")
    
    # Test S3 connection
    print("\n" + "=" * 60)
    print("TESTING S3 CONNECTION")
    print("=" * 60)
    
    try:
        dirs, files = default_storage.listdir('')
        print(f"\n✓ S3 Connection: SUCCESS")
        print(f"✓ Directories found: {len(dirs)}")
        print(f"✓ Files found: {len(files)}")
        
        if dirs:
            print(f"\nDirectories in bucket:")
            for d in dirs[:5]:  # Show first 5
                print(f"  - {d}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ S3 Connection FAILED: {str(e)}")
        return False

if __name__ == '__main__':
    success = verify_s3_config()
    print("\n" + "=" * 60)
    if success:
        print("✓ ALL CHECKS PASSED - S3 is properly configured!")
    else:
        print("❌ CONFIGURATION ISSUES FOUND - Please fix the errors above")
    print("=" * 60)
    sys.exit(0 if success else 1)

"""
Comprehensive environment verification script
Tests Database (SQLite/Postgres) and Storage (Local/S3) configuration
Run this on both development and production to verify everything works
"""
import os
import sys
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.conf import settings
from django.core.files.storage import default_storage
from django.db import connection
from django.core.files.base import ContentFile

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_success(message):
    print(f"✓ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠ {message}")

def verify_database():
    print_header("DATABASE CONFIGURATION")
    
    try:
        db_engine = settings.DATABASES['default']['ENGINE']
        db_name = settings.DATABASES['default']['NAME']
        
        if 'postgresql' in db_engine:
            print_success("Database Engine: PostgreSQL")
            print_success(f"Database Name: {db_name}")
            print_success(f"Database Host: {settings.DATABASES['default'].get('HOST', 'localhost')}")
            print_success(f"Database Port: {settings.DATABASES['default'].get('PORT', '5432')}")
            db_type = "postgres"
        elif 'sqlite' in db_engine:
            print_success("Database Engine: SQLite")
            print_success(f"Database Path: {db_name}")
            db_type = "sqlite"
        else:
            print_warning(f"Database Engine: {db_engine}")
            db_type = "other"
        
        # Test database connection
        print("\n--- Testing Database Connection ---")
        with connection.cursor() as cursor:
            if db_type == "postgres":
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                print_success(f"Connection: SUCCESS")
                print(f"    PostgreSQL Version: {version.split(',')[0]}")
            else:
                cursor.execute("SELECT sqlite_version();")
                version = cursor.fetchone()[0]
                print_success(f"Connection: SUCCESS")
                print(f"    SQLite Version: {version}")
            
            # Test table access
            cursor.execute("SELECT COUNT(*) FROM django_migrations;")
            migration_count = cursor.fetchone()[0]
            print_success(f"Migrations Applied: {migration_count}")
        
        return True
        
    except Exception as e:
        print_error(f"Database Error: {str(e)}")
        return False

def verify_storage():
    print_header("STORAGE CONFIGURATION")
    
    try:
        # Check storage settings
        use_s3 = getattr(settings, 'USE_S3', False)
        print_success(f"USE_S3: {use_s3}")
        
        if use_s3:
            # S3 Configuration
            aws_access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
            aws_secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
            aws_bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
            aws_region = getattr(settings, 'AWS_S3_REGION_NAME', None)
            aws_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
            
            print_success(f"AWS_ACCESS_KEY_ID: {'Set' if aws_access_key else '❌ NOT SET'}")
            print_success(f"AWS_SECRET_ACCESS_KEY: {'Set' if aws_secret_key else '❌ NOT SET'}")
            print_success(f"AWS_STORAGE_BUCKET_NAME: {aws_bucket or '❌ NOT SET'}")
            print_success(f"AWS_S3_REGION_NAME: {aws_region or '❌ NOT SET'}")
            if aws_domain:
                print_success(f"AWS_S3_CUSTOM_DOMAIN: {aws_domain}")
        else:
            # Local storage
            print_success(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        
        # Check storage backend
        storage_backend = default_storage.__class__.__module__ + '.' + default_storage.__class__.__name__
        print_success(f"Storage Backend: {storage_backend}")
        print_success(f"MEDIA_URL: {settings.MEDIA_URL}")
        
        # Verify storage backend matches USE_S3 setting
        if use_s3 and 'S3' not in storage_backend:
            print_error("Configuration mismatch! USE_S3=True but not using S3 storage!")
            return False
        elif not use_s3 and 'S3' in storage_backend:
            print_error("Configuration mismatch! USE_S3=False but using S3 storage!")
            return False
        
        # Test storage connection
        print("\n--- Testing Storage Connection ---")
        
        if use_s3:
            # Test S3 connection
            try:
                dirs, files = default_storage.listdir('')
                print_success(f"S3 Connection: SUCCESS")
                print_success(f"Directories in bucket: {len(dirs)}")
                print_success(f"Files in bucket root: {len(files)}")
                
                if dirs:
                    print(f"\n    Top directories:")
                    for d in dirs[:5]:
                        print(f"      - {d}")
            except Exception as e:
                print_error(f"S3 Connection Failed: {str(e)}")
                return False
        else:
            # Test local storage
            if os.path.exists(settings.MEDIA_ROOT):
                print_success(f"Local media directory exists: {settings.MEDIA_ROOT}")
                file_count = sum([len(files) for _, _, files in os.walk(settings.MEDIA_ROOT)])
                print_success(f"Files in media directory: {file_count}")
            else:
                print_warning(f"Media directory does not exist yet: {settings.MEDIA_ROOT}")
        
        # Test file write/read/delete
        print("\n--- Testing File Operations ---")
        test_filename = f'test_file_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        test_content = f'Test file created at {datetime.now().isoformat()}'
        
        try:
            # Write
            default_storage.save(test_filename, ContentFile(test_content))
            print_success("File Write: SUCCESS")
            
            # Read
            if default_storage.exists(test_filename):
                print_success("File Exists Check: SUCCESS")
                
                with default_storage.open(test_filename, 'r') as f:
                    read_content = f.read()
                    if read_content == test_content:
                        print_success("File Read: SUCCESS")
                    else:
                        print_error("File Read: Content mismatch!")
                        return False
            else:
                print_error("File Exists Check: FAILED")
                return False
            
            # Get URL
            file_url = default_storage.url(test_filename)
            print_success(f"File URL: {file_url}")
            
            # Delete
            default_storage.delete(test_filename)
            print_success("File Delete: SUCCESS")
            
            if not default_storage.exists(test_filename):
                print_success("File Cleanup Verified: SUCCESS")
            else:
                print_warning("File still exists after delete")
            
        except Exception as e:
            print_error(f"File Operations Failed: {str(e)}")
            # Cleanup
            try:
                if default_storage.exists(test_filename):
                    default_storage.delete(test_filename)
            except:
                pass
            return False
        
        return True
        
    except Exception as e:
        print_error(f"Storage Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_environment_info():
    print_header("ENVIRONMENT INFORMATION")
    
    import django
    print_success(f"Django Version: {django.get_version()}")
    print_success(f"Python Version: {sys.version.split()[0]}")
    print_success(f"DEBUG: {settings.DEBUG}")
    print_success(f"ENVIRONMENT: {'production' if not settings.DEBUG else 'development'}")
    print_success(f"ALLOWED_HOSTS: {', '.join(settings.ALLOWED_HOSTS)}")

def main():
    print("\n" + "=" * 70)
    print("  SIMPLECITI ENVIRONMENT VERIFICATION")
    print("=" * 70)
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = []
    
    # Verify environment info
    verify_environment_info()
    
    # Verify database
    db_result = verify_database()
    results.append(('Database', db_result))
    
    # Verify storage
    storage_result = verify_storage()
    results.append(('Storage', storage_result))
    
    # Summary
    print_header("VERIFICATION SUMMARY")
    
    all_passed = True
    for component, result in results:
        if result:
            print_success(f"{component}: PASSED")
        else:
            print_error(f"{component}: FAILED")
            all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("  ✓✓✓ ALL CHECKS PASSED - ENVIRONMENT READY ✓✓✓")
    else:
        print("  ❌❌❌ SOME CHECKS FAILED - SEE ERRORS ABOVE ❌❌❌")
    print("=" * 70 + "\n")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())

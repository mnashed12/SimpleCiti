#!/usr/bin/env python
"""
Migration cleanup script for PropertyImage field conflicts.
Run this to fix the migration mess between dev and production.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection, migrations
from django.db.migrations.recorder import MigrationRecorder

def main():
    print("=" * 70)
    print("PropertyImage Migration Cleanup")
    print("=" * 70)
    
    # Check current database schema
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(HomePage_propertyimage);")
        columns = {row[1] for row in cursor.fetchall()}
        print(f"\nCurrent database columns: {columns}")
    
    # Check applied migrations
    recorder = MigrationRecorder(connection)
    applied = recorder.applied_migrations()
    conflicting = [
        (app, name) for app, name in applied 
        if app == 'HomePage' and name in ['0019_propertyimage_image_url_back', '0020_merge_20251113_2211', '0021_fix_propertyimage_fields']
    ]
    
    print(f"\nApplied conflicting migrations: {conflicting}")
    
    # Determine what to do
    has_image = 'image' in columns
    has_image_url = 'image_url' in columns
    
    print(f"\nDatabase state:")
    print(f"  - has 'image' field: {has_image}")
    print(f"  - has 'image_url' field: {has_image_url}")
    
    print("\n" + "=" * 70)
    print("RECOMMENDED ACTIONS:")
    print("=" * 70)
    
    if has_image_url and not has_image:
        print("✅ Database is CORRECT (only image_url exists)")
        print("\nOn production, run:")
        print("  1. Answer 'N' to merge prompt")
        print("  2. python manage.py migrate HomePage --fake")
        print("  3. Check: python manage.py showmigrations HomePage")
        
    elif has_image and has_image_url:
        print("⚠️  Database has BOTH fields (transition state)")
        print("\nRun this SQL manually:")
        print("  ALTER TABLE HomePage_propertyimage DROP COLUMN image;")
        print("\nThen:")
        print("  python manage.py migrate HomePage --fake")
        
    elif has_image and not has_image_url:
        print("❌ Database has old schema (only image)")
        print("\nRun:")
        print("  python manage.py migrate HomePage")
        
    else:
        print("❌ Database is missing PropertyImage table!")
        print("\nRun:")
        print("  python manage.py migrate HomePage")

if __name__ == '__main__':
    main()

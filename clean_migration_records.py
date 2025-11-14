#!/usr/bin/env python
"""
Clean up migration records for deleted migration files
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def clean_migrations():
    print("=" * 70)
    print("Cleaning up migration records")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check current migration records
        cursor.execute("""
            SELECT app, name FROM django_migrations 
            WHERE app = 'HomePage' 
            ORDER BY id;
        """)
        migrations = cursor.fetchall()
        
        print("\nCurrent migration records:")
        for app, name in migrations:
            print(f"  - {app}.{name}")
        
        # Delete the conflicting migration records
        # NOTE: On production, the recorded names were:
        #  - 0019_remove_propertyimage_image_propertyimage_image_url
        #  - 0020_merge_20251113_2211
        #  - 0021_fix_propertyimage_fields
        migrations_to_delete = [
            '0019_remove_propertyimage_image_propertyimage_image_url',
            '0020_merge_20251113_2211',
            '0021_fix_propertyimage_fields',
        ]

        print(f"\nDeleting up to {len(migrations_to_delete)} conflicting migration records (ignore if 0 deleted)...")
        deleted_any = False
        for migration_name in migrations_to_delete:
            # Use literal SQL to avoid SQLite debug formatting issues with params
            cursor.execute(
                f"DELETE FROM django_migrations WHERE app='HomePage' AND name='{migration_name}';"
            )
            # Can't easily get rowcount reliably here; just log the attempt
            print(f"  • Tried to delete {migration_name}")
            deleted_any = True

        # Insert the new clean migration record only if it's not already present
        cursor.execute("""
            SELECT COUNT(1) FROM django_migrations
             WHERE app='HomePage' AND name='0019_propertyimage_use_url_only';
        """)
        exists = cursor.fetchone()[0] > 0
        if not exists:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES ('HomePage', '0019_propertyimage_use_url_only', datetime('now'));
            """)
            print("  ✓ Added 0019_propertyimage_use_url_only")
        else:
            print("  ✓ 0019_propertyimage_use_url_only already present")
        
        # Show final state
        cursor.execute("""
            SELECT app, name FROM django_migrations 
            WHERE app = 'HomePage' 
            ORDER BY id;
        """)
        migrations = cursor.fetchall()
        
        print("\nFinal migration records:")
        for app, name in migrations:
            print(f"  - {app}.{name}")
        
        print("\n" + "=" * 70)
        print("✓ Migration records cleaned successfully!")
        print("=" * 70)
        print("\nNext step:")
        print("Run: python manage.py collectstatic --noinput")

if __name__ == '__main__':
    try:
        clean_migrations()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

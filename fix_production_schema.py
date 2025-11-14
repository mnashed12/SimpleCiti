#!/usr/bin/env python
"""
Fix production database schema by removing the 'image' column from PropertyImage
SQLite doesn't support DROP COLUMN, so we need to recreate the table.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def fix_schema():
    print("=" * 70)
    print("Fixing PropertyImage table schema")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check current columns
        cursor.execute("PRAGMA table_info(HomePage_propertyimage);")
        columns = cursor.fetchall()
        print("\nCurrent columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check if 'image' column exists
        has_image = any(col[1] == 'image' for col in columns)
        has_image_url = any(col[1] == 'image_url' for col in columns)
        
        if not has_image:
            print("\n✓ 'image' column doesn't exist - schema is already correct!")
            return
        
        if not has_image_url:
            print("\n✗ Missing 'image_url' column - unexpected state!")
            return
        
        print("\n⚠️  Found both 'image' and 'image_url' columns")
        print("Creating new table without 'image' column...\n")
        
        # Get all data first
        cursor.execute("SELECT id, property_id, image_url, `order` FROM HomePage_propertyimage;")
        data = cursor.fetchall()
        print(f"Found {len(data)} property images to migrate")
        
        # Create new table without 'image' column
        cursor.execute("""
            CREATE TABLE HomePage_propertyimage_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id BIGINT NOT NULL REFERENCES HomePage_property(id),
                image_url VARCHAR(200),
                "order" INTEGER NOT NULL
            );
        """)
        print("✓ Created new table structure")
        
        # Copy data
        if data:
            cursor.executemany(
                "INSERT INTO HomePage_propertyimage_new (id, property_id, image_url, `order`) VALUES (?, ?, ?, ?);",
                data
            )
            print(f"✓ Migrated {len(data)} records")
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE HomePage_propertyimage;")
        cursor.execute("ALTER TABLE HomePage_propertyimage_new RENAME TO HomePage_propertyimage;")
        print("✓ Replaced old table with new structure")
        
        # Recreate index if it existed
        cursor.execute("""
            CREATE INDEX HomePage_propertyimage_property_id_idx 
            ON HomePage_propertyimage (property_id);
        """)
        print("✓ Recreated indexes")
        
        # Verify new structure
        cursor.execute("PRAGMA table_info(HomePage_propertyimage);")
        new_columns = cursor.fetchall()
        print("\nNew table structure:")
        for col in new_columns:
            print(f"  - {col[1]} ({col[2]})")
        
        print("\n" + "=" * 70)
        print("✓ Schema fix completed successfully!")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Run: python manage.py migrate HomePage 0019_propertyimage_use_url_only --fake")
        print("2. Run: python manage.py collectstatic --noinput")
        print("3. Restart your web app on PythonAnywhere")

if __name__ == '__main__':
    try:
        fix_schema()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

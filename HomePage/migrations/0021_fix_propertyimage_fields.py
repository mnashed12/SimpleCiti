# Generated manually to fix PropertyImage field conflicts
from django.db import migrations, models, connection


def add_image_field_if_not_exists(apps, schema_editor):
    """Add image field only if it doesn't exist"""
    with connection.cursor() as cursor:
        # Check what columns exist in the table
        cursor.execute("PRAGMA table_info(HomePage_propertyimage);")
        columns = [row[1] for row in cursor.fetchall()]
        
        # If image_url doesn't exist but image does, we're on old schema
        if 'image' in columns and 'image_url' not in columns:
            # Add image_url field
            cursor.execute("""
                ALTER TABLE HomePage_propertyimage 
                ADD COLUMN image_url VARCHAR(200) NULL;
            """)
        # If image_url exists but image doesn't, add image field
        elif 'image_url' in columns and 'image' not in columns:
            cursor.execute("""
                ALTER TABLE HomePage_propertyimage 
                ADD COLUMN image VARCHAR(100) NULL;
            """)


class Migration(migrations.Migration):
    dependencies = [
        ("HomePage", "0020_merge_20251113_2211"),
    ]
    
    operations = [
        migrations.RunPython(add_image_field_if_not_exists, migrations.RunPython.noop),
    ]

# Manual merge migration combining divergent 0017 branches
# Created to resolve conflict between:
#   - 0017_add_property_indexes_and_manager
#   - 0017_remove_propertyimage_image_url_propertyimage_image
# Empty operations; it just reconciles graph.

from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("HomePage", "0017_add_property_indexes_and_manager"),
        ("HomePage", "0017_remove_propertyimage_image_url_propertyimage_image"),
    ]

    operations = []

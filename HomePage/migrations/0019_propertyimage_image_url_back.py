# Generated manually to handle image field transition
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("HomePage", "0018_merge_0017_add_property_indexes_and_manager_0017_remove_propertyimage_image_url_propertyimage_image"),
    ]
    
    operations = [
        # First, add image_url as nullable
        migrations.AddField(
            model_name="propertyimage",
            name="image_url",
            field=models.URLField(null=True, blank=True),
        ),
        # Keep image field for now (don't remove it yet to avoid data loss)
    ]

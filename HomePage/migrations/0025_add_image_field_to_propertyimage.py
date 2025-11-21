from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0024_clientprofile_address_clientprofile_city_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyimage',
            name='image',
            field=models.ImageField(upload_to='property_images/', null=True, blank=True),
        ),
    ]

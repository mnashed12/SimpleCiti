from django.db import migrations, models


class Migration(migrations.Migration):
    """Re-add ClientProfile contact fields that were removed by stray 0021 migration on production.
    Safe to run even if columns already exist locally (Django will error if they do); intended for production where they were dropped.
    """

    dependencies = [
        ('HomePage', '0020_add_profile_contact_fields'),  # Last known good before removal
    ]

    operations = [
        migrations.AddField(
            model_name='clientprofile',
            name='address',
            field=models.CharField(max_length=255, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='city',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='state',
            field=models.CharField(max_length=2, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='zip_code',
            field=models.CharField(max_length=10, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='country',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='date_of_birth',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='qi_company_name',
            field=models.CharField(max_length=200, blank=True, default=''),
        ),
    ]

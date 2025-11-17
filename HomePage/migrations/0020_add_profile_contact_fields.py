from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0019_propertyimage_use_url_only'),
    ]

    operations = [
        migrations.AddField(
            model_name='clientprofile',
            name='address',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='city',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='country',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='qi_company_name',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='state',
            field=models.CharField(blank=True, default='', max_length=2),
        ),
        migrations.AddField(
            model_name='clientprofile',
            name='zip_code',
            field=models.CharField(blank=True, default='', max_length=10),
        ),
    ]

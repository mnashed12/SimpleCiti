from django.core.management.base import BaseCommand
from django.db import transaction

from HomePage.models import Property, PropertyImage, PropertyFee, PropertyDocument


class Command(BaseCommand):
    help = "Delete orphaned related records that reference missing Property rows."

    def handle(self, *args, **options):
        with transaction.atomic():
            property_ids = list(Property.objects.values_list('id', flat=True))

            def purge(model, fk_field='property_id'):
                qs = model.objects.exclude(**{f"{fk_field}__in": property_ids})
                count = qs.count()
                if count:
                    qs.delete()
                return count

            deleted_images = purge(PropertyImage, 'property_id')
            deleted_fees = purge(PropertyFee, 'property_id')
            deleted_docs = purge(PropertyDocument, 'property_id')

        self.stdout.write(self.style.SUCCESS(
            f"Cleanup complete: images={deleted_images}, fees={deleted_fees}, docs={deleted_docs}"
        ))

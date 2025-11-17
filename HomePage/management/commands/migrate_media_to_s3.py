from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from pathlib import Path
import os

from HomePage.models import PropertyDocument, UploadedFile


class Command(BaseCommand):
    help = (
        "Upload existing media files from local MEDIA_ROOT to S3 and keep model references in sync.\n"
        "Only affects FileField-backed records (PropertyDocument.file, UploadedFile.file)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List actions without uploading files",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of records to process (useful for testing)",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        limit = options.get("limit")

        # Quick guard: ensure S3 is enabled so default_storage points to S3
        using_s3 = getattr(settings, "USE_S3", False)
        if not using_s3:
            self.stdout.write(self.style.WARNING(
                "USE_S3 is False. Set USE_S3=True and proper AWS_* env vars, then re-run."
            ))
            return

        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            self.stdout.write(self.style.WARNING(f"MEDIA_ROOT does not exist: {media_root}"))

        def upload_file(field_file, model_label):
            name = field_file.name  # relative path e.g. 'property_documents/xyz.pdf'
            local_path = media_root / name

            if not name:
                return ("skipped", f"{model_label}: empty file field")

            # Skip if already present in S3
            try:
                if default_storage.exists(name):
                    return ("exists", f"{model_label}: already on S3 -> {name}")
            except Exception:
                # If existence check fails, we still attempt upload
                pass

            if not local_path.exists():
                return ("missing", f"{model_label}: local file missing -> {local_path}")

            if dry_run:
                return ("dry-run", f"Would upload {model_label}: {name}")

            with open(local_path, "rb") as fh:
                content = ContentFile(fh.read())
                # Save to the same name; S3 backend will create the object
                field_file.save(name, content, save=True)

            return ("uploaded", f"{model_label}: uploaded -> {name}")

        docs = PropertyDocument.objects.order_by("id")
        uploads = UploadedFile.objects.order_by("id")

        if limit is not None:
            docs = docs[:limit]
            uploads = uploads[:limit]

        counters = {"uploaded": 0, "exists": 0, "missing": 0, "skipped": 0, "dry-run": 0}

        self.stdout.write(self.style.NOTICE("Migrating PropertyDocument files..."))
        for doc in docs:
            status, msg = upload_file(doc.file, f"PropertyDocument#{doc.id}")
            counters[status] = counters.get(status, 0) + 1
            self.stdout.write(msg)

        self.stdout.write(self.style.NOTICE("\nMigrating UploadedFile files..."))
        for up in uploads:
            status, msg = upload_file(up.file, f"UploadedFile#{up.id}")
            counters[status] = counters.get(status, 0) + 1
            self.stdout.write(msg)

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. uploaded={counters['uploaded']} exists={counters['exists']} missing={counters['missing']} "
            f"skipped={counters['skipped']} dry-run={counters['dry-run']}"
        ))

#!/usr/bin/env python
import os
import django
from datetime import datetime
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.core.management import call_command
from HomePage.models import PropertyImage, PropertyFee, PropertyDocument, Property

BASE_DIR = Path(__file__).resolve().parent

def main():
    print("=" * 70)
    print("Reset HomePage data to match dev fixture")
    print("=" * 70)

    # Backup current data first
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BASE_DIR / f"backup_homepage_{ts}.json"
    print(f"Backing up current HomePage data -> {backup_file}")
    call_command(
        "dumpdata",
        "HomePage.Property",
        "HomePage.PropertyImage",
        "HomePage.PropertyFee",
        "HomePage.PropertyDocument",
        indent=2,
        output=str(backup_file),
    )
    
    # Purge existing rows (children first)
    print("\nDeleting existing HomePage rows (children first)...")
    deleted_img, _ = PropertyImage.objects.all().delete()
    deleted_fee, _ = PropertyFee.objects.all().delete()
    deleted_doc, _ = PropertyDocument.objects.all().delete()
    deleted_prop, _ = Property.objects.all().delete()
    print(f"Deleted: images={deleted_img}, fees={deleted_fee}, docs={deleted_doc}, properties={deleted_prop}")

    # Load fixture
    fixture_path = BASE_DIR / "data_homepage_dev.json"
    if not fixture_path.exists():
        raise SystemExit(f"Fixture not found: {fixture_path}")

    print(f"\nLoading fixture from {fixture_path}...")
    call_command("loaddata", str(fixture_path))
    print("\n✓ Import complete. Verify /SE/PD/ and API /api/se/properties/")

if __name__ == "__main__":
    main()

#!/usr/bin/env python
import os
import django
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.core import serializers
from HomePage.models import Property, PropertyImage, PropertyFee, PropertyDocument

qs = []
qs.extend(Property.objects.all())
qs.extend(PropertyImage.objects.all())
qs.extend(PropertyFee.objects.all())
qs.extend(PropertyDocument.objects.all())

model_order = {Property: 0, PropertyImage: 1, PropertyFee: 2, PropertyDocument: 3}
qs_sorted = sorted(qs, key=lambda o: (model_order.get(type(o), 99), o.pk or 0))

out_path = Path("data_homepage_dev.json")
out_path.write_text(serializers.serialize("json", qs_sorted, use_natural_foreign_keys=True, indent=2), encoding="utf-8")
print(f"Wrote {len(qs_sorted)} objects -> {out_path.resolve()}")

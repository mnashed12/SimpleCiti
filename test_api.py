"""
Simple test to verify API serializers work
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from HomePage.models import Property
from HomePage.serializers import PropertyListSerializer

print("Testing API Serializers...")
print("=" * 50)

# Test property serializer
try:
    properties = Property.objects.active()[:3]
    serializer = PropertyListSerializer(properties, many=True)
    print(f"✓ Found {len(serializer.data)} properties")
    if serializer.data:
        prop = serializer.data[0]
        print(f"✓ Sample property: {prop.get('property_name', 'N/A')}")
        print(f"✓ Reference: {prop.get('reference_number', 'N/A')}")
    print("\n✓ API Serializers working correctly!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("=" * 50)
print("Test complete!")

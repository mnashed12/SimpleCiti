# Production Deployment Checklist

## After pulling code on PythonAnywhere:

### 1. Verify Database Has Data
```bash
cd ~/SimpleCiti
python manage.py shell
```

```python
from HomePage.models import Property, CustomUser

# Check properties exist
print(f"Properties: {Property.objects.count()}")
print(f"Active properties: {Property.objects.filter(is_active=True, is_pipeline=False).count()}")

# Check users exist
print(f"Users: {CustomUser.objects.count()}")

# If no properties, you need to add them via admin or fixtures
```

### 2. Collect Static Files (if not using CDN)
```bash
python manage.py collectstatic --noinput
```

### 3. Reload Web App
- Go to PythonAnywhere Web tab
- Click "Reload www.simpleciti.com"

### 4. Test These URLs in Browser:
- https://www.simpleciti.com/api/properties/ (should return JSON with properties array)
- https://www.simpleciti.com/SE/ (should load homepage)
- https://www.simpleciti.com/SE/Hub (should show marketplace - may be empty if no properties)
- https://www.simpleciti.com/user/login/ (should show login form)

### 5. Test Login Flow:
1. Go to https://www.simpleciti.com/user/login/?next=/SE/Hub
2. Enter credentials
3. Should redirect to /SE/Hub after successful login
4. Check browser console (F12) for any errors

### 6. Common Production Issues:

**Empty Marketplace:**
- Database has no active properties (check step 1)
- API endpoint returns empty: `/api/properties/` - verify in browser directly

**Login Doesn't Work:**
- Check browser console for CSRF or CORS errors
- Verify cookies are being set (check Application tab in DevTools)
- Ensure you're using www.simpleciti.com consistently (not mixing www/non-www)

**Static Files Not Loading:**
- Run collectstatic again
- Check STATIC_ROOT and STATIC_URL in settings
- Verify Vite manifest exists: staticfiles/react/.vite/manifest.json

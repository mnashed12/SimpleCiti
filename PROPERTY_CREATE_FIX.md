# Property Creation Network Error Fix

## Problem
React frontend (AddProperty.jsx) was getting `AxiosError: Network Error` when trying to create properties on production.

## Root Causes Identified
1. **Missing CSRF Token**: Production static build didn't have CSRF cookie set initially
2. **Serializer Validation**: Required model fields (title, address, property_type) weren't being defaulted
3. **Authentication Flow**: No mechanism to fetch CSRF token before first POST request

## Changes Made

### 1. Frontend API Service (`frontend/src/services/api.js`)
- Added async CSRF token fetching in request interceptor
- Before any POST/PUT/PATCH request, if no CSRF token exists, fetch it via `/api/se/whoami/`
- This ensures production builds can get CSRF tokens on first API call

### 2. Backend API Views (`HomePage/api_views.py`)
- Added `@ensure_csrf_cookie` decorator to `whoami` endpoint
- This endpoint now explicitly sets the CSRF cookie for frontend consumption
- Imported `django.views.decorators.csrf.ensure_csrf_cookie`

### 3. Property Serializer (`HomePage/serializers.py`)
- Made `title`, `address`, and `property_type` optional in `extra_kwargs`
- Added defaults in `create()` method:
  - `title`: 'Untitled Property'
  - `address`: 'TBD'
  - `property_type`: 'Misc.'
  - `max_investors`: 5 (was 0)
- All other required numeric fields already had defaults (total_sf, acres, etc.)

### 4. Property Views (`HomePage/views.py`)
- Added `publish_mode` parameter handling in `add_property`
- Added default `close_date` (30 days from today) if not provided
- Added logic to set `is_active`/`is_pipeline` based on `publish_mode` and permissions

## Deployment Steps

### For Production (simpleciti.pythonanywhere.com)

1. **Pull latest code:**
   ```bash
   cd ~/SimpleCiti
   git pull origin master
   ```

2. **Rebuild React frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Collect static files:**
   ```bash
   cd ..
   python manage.py collectstatic --noinput
   ```

4. **Restart server:**
   - On PythonAnywhere: Go to Web tab → Reload application

5. **Test the fix:**
   - Navigate to `/SE/PD/property/add/`
   - Fill in minimal required fields (title, address, property type)
   - Click "Create Property" or "Publish"
   - Should successfully create and redirect to edit page

## Testing Checklist
- [ ] CSRF token is set on first page load
- [ ] Property creation works with minimal fields
- [ ] Created property appears in database
- [ ] Redirect to edit page works
- [ ] Published properties appear in marketplace (`/SE/`)

## Rollback Plan
If issues occur:
```bash
git revert HEAD~3  # Revert last 3 commits
git push origin master
# Then repeat deployment steps
```

## Known Limitations
- Draft properties created with minimal data need editing before being publication-ready
- `publish_mode` requires proper permissions (currently checks `properties.can_publish`)
- CSRF_COOKIE_SECURE is False (should be True for production HTTPS)

## Next Steps
1. Add frontend validation/UX improvements
2. Implement `autoFillDraftDefaults()` for better UX
3. Map `deal_stage` human-readable values to model choice codes
4. Set CSRF_COOKIE_SECURE=True in production .env

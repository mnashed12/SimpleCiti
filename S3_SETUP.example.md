# S3 Setup (Media Files) — Example

Use this guide to enable S3 for media uploads. Do NOT commit real secrets.

## 1) Environment Variables
Create or update `.env` (repo root) with:

```
USE_S3=True
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-bucket.s3.amazonaws.com
```

One-session alternative (Windows PowerShell):
```powershell
$env:USE_S3="True"
$env:AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
$env:AWS_STORAGE_BUCKET_NAME="your-bucket"
$env:AWS_S3_REGION_NAME="us-east-1"
$env:AWS_S3_CUSTOM_DOMAIN="your-bucket.s3.amazonaws.com"
```

## 2) Install
```powershell
pip install -r requirements.txt
```

## 3) Verify
```powershell
python manage.py shell -c "from django.conf import settings; from django.core.files.storage import default_storage; print('USE_S3:', settings.USE_S3); print('Storage:', default_storage.__class__.__name__); print('MEDIA_URL:', settings.MEDIA_URL)"
```

## 4) Migrate Existing Media (Optional)
```powershell
python manage.py migrate_media_to_s3 --dry-run
python manage.py migrate_media_to_s3
```

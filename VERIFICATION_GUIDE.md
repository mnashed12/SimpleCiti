# Environment Verification - Quick Reference

## Run Verification Script

### On Development (Windows):
```powershell
python verify_environment.py
```

### On Production (PythonAnywhere):
```bash
cd ~/SimpleCiti
python verify_environment.py
```

## Expected Results

### ✓ Development Environment
- **Database:** PostgreSQL (Neon) or SQLite
- **Storage:** S3 or Local filesystem
- **All checks should pass**

### ✓ Production Environment  
- **Database:** PostgreSQL (Neon)
- **Storage:** S3
- **All checks should pass**

## What Gets Tested

### 1. Environment Info
- Django version
- Python version
- DEBUG mode
- Allowed hosts

### 2. Database
- Connection test
- Database type (SQLite/PostgreSQL)
- Version check
- Migration count

### 3. Storage
- Configuration check (Local/S3)
- Connection test
- File operations (create, read, delete)
- URL generation

## Configuration Options

### Option 1: Postgres + S3 (Production)
```env
DB_ENGINE=postgres
USE_S3=True
```

### Option 2: Postgres + Local (Development with production DB)
```env
DB_ENGINE=postgres
USE_S3=False
```

### Option 3: SQLite + Local (Full local development)
```env
DB_ENGINE=sqlite
USE_S3=False
```

### Option 4: SQLite + S3 (Not recommended)
```env
DB_ENGINE=sqlite
USE_S3=True
```

## Success Output
```
======================================================================
  ✓✓✓ ALL CHECKS PASSED - ENVIRONMENT READY ✓✓✓
======================================================================
```

## Troubleshooting

### Database Fails
- Check database credentials
- Verify database is accessible
- Check migrations are applied

### Storage Fails
- Check AWS credentials (if using S3)
- Verify S3 bucket exists and is accessible
- Check MEDIA_ROOT directory exists (if using local)

## Files
- `verify_environment.py` - Comprehensive verification (database + storage + file ops)
- `verify_s3_config.py` - S3-specific verification

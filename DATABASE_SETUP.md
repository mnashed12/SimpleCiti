# SimpleCiti - Database & Storage Migration Guide

This guide will walk you through switching from SQLite + local storage to **Postgres + S3** for both development and production environments.

---

## Overview

- **Phase 1**: Set up Postgres database (Neon - free hosted option)
- **Phase 2**: Set up AWS S3 for media storage
- **Phase 3**: Deploy to production (PythonAnywhere)

---

## Phase 1: Set Up Postgres with Neon (Free Tier)

### Step 1: Create a Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** in the top right
3. Choose **"Continue with GitHub"** or **"Continue with Google"** (fastest)
4. You'll be redirected to your Neon dashboard

### Step 2: Create Your Database
1. On the Neon dashboard, you should see a default project already created
2. If not, click **"New Project"**
3. Fill in:
   - **Project name**: `SimpleCiti` (or whatever you prefer)
   - **Region**: Choose closest to you (e.g., `US East (Ohio)` or `US West (Oregon)`)
   - **Postgres version**: Leave as default (16)
4. Click **"Create Project"**
5. Your database is now ready!

### Step 3: Get Your Connection Details
1. On your project page, click **"Connection Details"** (or you'll see it immediately after creating)
2. You'll see a connection string that looks like:
   ```
   postgresql://simpleciti_owner:ABC123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/simpleciti?sslmode=require
   ```
3. **Important**: Click **"Show password"** to reveal the full password
4. Copy the following values:
   - **Host**: The part after `@` and before `/` (e.g., `ep-cool-name-123456.us-east-2.aws.neon.tech`)
   - **Database name**: The part after the last `/` and before `?` (e.g., `simpleciti`)
   - **User**: The part after `postgresql://` and before `:` (e.g., `simpleciti_owner`)
   - **Password**: The part after the first `:` and before `@` (e.g., `ABC123xyz`)
   - **Port**: `5432` (default for Postgres)
   - **SSL Mode**: `require` (Neon requires SSL)

### Step 4: Update Your Local .env File
1. Open the `.env` file in your project root (already exists)
2. Update these values with your Neon details:
   ```env
   DB_ENGINE=postgres
   POSTGRES_NAME=simpleciti
   POSTGRES_USER=simpleciti_owner
   POSTGRES_PASSWORD=ABC123xyz
   POSTGRES_HOST=ep-cool-name-123456.us-east-2.aws.neon.tech
   POSTGRES_PORT=5432
   POSTGRES_SSLMODE=require
   ```
3. Save the file

### Step 5: Install Dependencies and Migrate
Open PowerShell in your project directory and run:
```powershell
# Activate your virtual environment
.\venv\Scripts\Activate.ps1

# Install new dependencies (postgres driver, S3 support)
pip install -r requirements.txt

# Run migrations to create all tables in Postgres
python manage.py migrate

# Create a superuser admin account
python manage.py createsuperuser
# Enter username, email, and password when prompted
```

### Step 6: Test Your Setup
```powershell
# Start the development server
python manage.py runserver
```

Visit http://127.0.0.1:8000/admin and log in with your superuser credentials.

**Verify**:
- Can you log in?
- Go to http://127.0.0.1:8000/SE/Hub - does the hub page load?
- Check your profile page - does it work?

✅ **Phase 1 Complete!** You're now running on Postgres locally.

---

## Phase 2: Set Up AWS S3 for Media Storage

### Step 1: Create an AWS Account
1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Enter your email and choose a password
4. Follow the signup process (requires credit card, but S3 free tier is generous)
5. Complete verification and sign in to the AWS Console

### Step 2: Create an S3 Bucket
1. In the AWS Console search bar, type **"S3"** and click **"S3"**
2. Click **"Create bucket"**
3. Fill in:
   - **Bucket name**: `simpleciti-media` (must be globally unique; if taken, try `simpleciti-media-yourname`)
   - **AWS Region**: Choose same region as your app (e.g., `US East (N. Virginia)` = `us-east-1`)
   - **Block Public Access**: Leave **all boxes checked** (we'll use signed URLs for security)
4. Scroll down and click **"Create bucket"**

### Step 3: Configure CORS (so your app can upload/display media)
1. Click on your newly created bucket name
2. Go to the **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"**
5. Paste this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
6. Click **"Save changes"**

### Step 4: Create an IAM User with S3 Access
1. In the AWS Console search bar, type **"IAM"** and click **"IAM"**
2. In the left sidebar, click **"Users"**
3. Click **"Create user"**
4. Enter user name: `simpleciti-s3-user`
5. Click **"Next"**
6. Select **"Attach policies directly"**
7. In the search box, type **"S3"**
8. Check the box next to **"AmazonS3FullAccess"** (for simplicity; you can restrict later)
9. Click **"Next"**, then **"Create user"**

### Step 5: Create Access Keys
1. Click on the user you just created (`simpleciti-s3-user`)
2. Go to the **"Security credentials"** tab
3. Scroll to **"Access keys"** and click **"Create access key"**
4. Select **"Application running outside AWS"**
5. Click **"Next"**
6. (Optional) Add a description: `SimpleCiti Django App`
7. Click **"Create access key"**
8. **IMPORTANT**: Copy both:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (long random string - you can only see this once!)
9. Click **"Done"**

### Step 6: Update Your .env File
Add your AWS credentials to `.env`:
```env
USE_S3=True
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME=simpleciti-media
AWS_S3_REGION_NAME=us-east-1
```

### Step 7: Test Media Uploads
```powershell
# Restart your dev server
python manage.py runserver
```

1. Go to http://127.0.0.1:8000/admin
2. Navigate to a Property or any model with image uploads
3. Upload a test image
4. Check your S3 bucket in the AWS Console - you should see the file!

✅ **Phase 2 Complete!** Media files now go to S3.

---

## Phase 3: Deploy to Production (PythonAnywhere)

### Step 1: Update Production Environment Variables on PythonAnywhere
1. Log in to [https://www.pythonanywhere.com](https://www.pythonanywhere.com)
2. Go to the **"Web"** tab
3. Scroll to the **"Code"** section
4. Click on the link to your **WSGI configuration file**
5. Add these lines at the **top** of the file (before any imports):

```python
import os

# Production Environment Variables
os.environ['DJANGO_DEBUG'] = 'False'
os.environ['USE_VITE_DEV'] = 'False'
os.environ['ALLOWED_HOSTS'] = 'simpleciti.com,www.simpleciti.com,simpleciti.pythonanywhere.com'

# Database
os.environ['DB_ENGINE'] = 'postgres'
os.environ['POSTGRES_NAME'] = 'simpleciti'  # Your Neon DB name
os.environ['POSTGRES_USER'] = 'simpleciti_owner'  # Your Neon user
os.environ['POSTGRES_PASSWORD'] = 'YOUR_NEON_PASSWORD'  # Your Neon password
os.environ['POSTGRES_HOST'] = 'ep-cool-name-123456.us-east-2.aws.neon.tech'  # Your Neon host
os.environ['POSTGRES_PORT'] = '5432'
os.environ['POSTGRES_SSLMODE'] = 'require'

# S3 Storage
os.environ['USE_S3'] = 'True'
os.environ['AWS_ACCESS_KEY_ID'] = 'YOUR_AWS_KEY'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'YOUR_AWS_SECRET'
os.environ['AWS_STORAGE_BUCKET_NAME'] = 'simpleciti-media'
os.environ['AWS_S3_REGION_NAME'] = 'us-east-1'
```

6. Click **"Save"** at the top

### Step 2: Install Dependencies
1. Go to the **"Consoles"** tab on PythonAnywhere
2. Start a **"Bash"** console
3. Navigate to your project and run:
```bash
cd ~/simpleciti  # or your project path
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Run Migrations
```bash
python manage.py migrate
python manage.py createsuperuser  # Create production admin account
```

### Step 4: Collect Static Files (if needed)
```bash
python manage.py collectstatic --noinput
```

### Step 5: Reload Your Web App
1. Go back to the **"Web"** tab
2. Click the big green **"Reload"** button at the top
3. Wait for it to finish reloading

### Step 6: Test Production
Visit your live site:
- https://simpleciti.com (or your domain)
- https://simpleciti.pythonanywhere.com

**Verify**:
- Site loads without errors
- You can log in
- Profile page works
- Property listings load
- Image uploads go to S3

✅ **Phase 3 Complete!** You're fully deployed on Postgres + S3!

---

## Troubleshooting

### "No module named 'decouple'"
```powershell
pip install python-decouple
```

### "No module named 'psycopg'"
```powershell
pip install "psycopg[binary]"
```

### "Could not connect to database"
- Check your Postgres credentials in `.env`
- Verify `POSTGRES_SSLMODE=require` is set for Neon
- Make sure your Neon project is not paused (free tier auto-pauses after inactivity)

### Media files not uploading to S3
- Verify AWS credentials are correct
- Check bucket name matches exactly
- Ensure CORS is configured on your S3 bucket
- Check IAM user has S3 permissions

### Production errors on PythonAnywhere
- Check the **"Error log"** on the Web tab
- Verify all environment variables are set in WSGI file
- Make sure `DEBUG=False` in production
- Check that Neon allows connections from PythonAnywhere's IP ranges

---

## Rollback to SQLite (Emergency)

If something goes wrong, you can quickly rollback:

1. Edit `.env`:
   ```env
   DB_ENGINE=sqlite
   USE_S3=False
   ```
2. Restart your server:
   ```powershell
   python manage.py runserver
   ```

You'll be back on SQLite + local media immediately.

---

## What's Different Now?

### Development (.env with DB_ENGINE=postgres, USE_S3=True)
- ✅ Database: Neon Postgres
- ✅ Media: AWS S3
- ✅ Static: Local (staticfiles directory)
- ✅ HMR: Vite dev server with live reload

### Production (PythonAnywhere with same settings)
- ✅ Database: Same Neon Postgres (shared with dev)
- ✅ Media: Same AWS S3 bucket
- ✅ Static: Served from staticfiles via collectstatic
- ✅ No Vite server (USE_VITE_DEV=False loads built assets)

Both environments use the **exact same configuration pattern** - just different values in environment variables!

---

## Support

- **Neon Docs**: https://neon.tech/docs/introduction
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Django Storages**: https://django-storages.readthedocs.io/

Need help? Check the error logs and verify your environment variables are set correctly.

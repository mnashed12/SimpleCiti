import sqlite3

# Connect to both databases
backup_conn = sqlite3.connect('db_backup.sqlite3')
current_conn = sqlite3.connect('db.sqlite3')

backup_cursor = backup_conn.cursor()
current_cursor = current_conn.cursor()

# Get all images from backup
backup_cursor.execute('SELECT id, image_url, "order", property_id FROM HomePage_propertyimage')
images = backup_cursor.fetchall()

print(f"Found {len(images)} images in backup")

# Insert into current database
for img in images:
    try:
        current_cursor.execute(
            'INSERT OR REPLACE INTO HomePage_propertyimage (id, image_url, "order", property_id) VALUES (?, ?, ?, ?)',
            img
        )
        print(f"Copied image {img[0]} for property {img[3]}")
    except Exception as e:
        print(f"Error copying image {img[0]}: {e}")

current_conn.commit()

# Verify
current_cursor.execute('SELECT COUNT(*) FROM HomePage_propertyimage')
count = current_cursor.fetchone()[0]
print(f"\nTotal images in current database: {count}")

backup_conn.close()
current_conn.close()

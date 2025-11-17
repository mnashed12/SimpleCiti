from django.db import migrations, connection


def add_column_sqlite(table, column_sql):
    with connection.cursor() as cursor:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_sql}")


def add_column_postgres(table, column_sql):
    with connection.cursor() as cursor:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_sql}")


def forwards(apps, schema_editor):
    ClientProfile = apps.get_model('HomePage', 'ClientProfile')
    User = apps.get_model('HomePage', 'CustomUser')
    table = ClientProfile._meta.db_table
    user_table = User._meta.db_table

    vendor = connection.vendor  # 'sqlite' | 'postgresql' | 'mysql'

    # Get existing columns
    existing = set()
    with connection.cursor() as cursor:
        if vendor == 'sqlite':
            cursor.execute(f"PRAGMA table_info('{table}')")
            existing = {row[1] for row in cursor.fetchall()}  # row[1] is name
        elif vendor == 'postgresql':
            cursor.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s
                """,
                [table.split('.')[-1]]
            )
            existing = {row[0] for row in cursor.fetchall()}
        else:
            # Fallback: attempt generic information_schema
            cursor.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s
                """,
                [table]
            )
            existing = {row[0] for row in cursor.fetchall()}

    to_add = []

    # Define desired columns (name -> SQL fragment per vendor)
    if vendor == 'sqlite':
        defs = {
            'address': "address TEXT NOT NULL DEFAULT ''",
            'city': "city TEXT NOT NULL DEFAULT ''",
            'state': "state VARCHAR(2) NOT NULL DEFAULT ''",
            'zip_code': "zip_code VARCHAR(10) NOT NULL DEFAULT ''",
            'country': "country TEXT NOT NULL DEFAULT ''",
            'date_of_birth': "date_of_birth DATE",
            'qi_company_name': "qi_company_name TEXT NOT NULL DEFAULT ''",
            'have_qi': "have_qi BOOLEAN NOT NULL DEFAULT 0",
            'sale_price': "sale_price NUMERIC",
            'equity_rollover': "equity_rollover NUMERIC",
            'relinquish_closing_date': "relinquish_closing_date DATE",
            'added_by_id': f"added_by_id INTEGER REFERENCES {user_table}(id)"
        }
    else:  # postgres (and generic)
        defs = {
            'address': "address TEXT NOT NULL DEFAULT ''",
            'city': "city TEXT NOT NULL DEFAULT ''",
            'state': "state VARCHAR(2) NOT NULL DEFAULT ''",
            'zip_code': "zip_code VARCHAR(10) NOT NULL DEFAULT ''",
            'country': "country TEXT NOT NULL DEFAULT ''",
            'date_of_birth': "date_of_birth DATE",
            'qi_company_name': "qi_company_name TEXT NOT NULL DEFAULT ''",
            'have_qi': "have_qi BOOLEAN NOT NULL DEFAULT FALSE",
            'sale_price': "sale_price NUMERIC(12,2)",
            'equity_rollover': "equity_rollover NUMERIC(12,2)",
            'relinquish_closing_date': "relinquish_closing_date DATE",
            'added_by_id': f"added_by_id INTEGER REFERENCES {user_table}(id) DEFERRABLE INITIALLY DEFERRED"
        }

    for name, col_sql in defs.items():
        if name not in existing:
            to_add.append(col_sql)

    if not to_add:
        return

    # Apply
    for col in to_add:
        if vendor == 'sqlite':
            add_column_sqlite(table, col)
        else:
            add_column_postgres(table, col)


def backwards(apps, schema_editor):
    # No-op: we do not drop columns in fix-forward migrations
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0022_readd_profile_contact_fields'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

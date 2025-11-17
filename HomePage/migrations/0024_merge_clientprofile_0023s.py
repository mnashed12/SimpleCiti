from django.db import migrations, connection


def ensure_columns(apps, schema_editor):
    ClientProfile = apps.get_model('HomePage', 'ClientProfile')
    User = apps.get_model('HomePage', 'CustomUser')
    table = ClientProfile._meta.db_table
    user_table = User._meta.db_table

    vendor = connection.vendor

    # Gather existing columns
    with connection.cursor() as cursor:
        if vendor == 'sqlite':
            cursor.execute(f"PRAGMA table_info('{table}')")
            existing = {row[1] for row in cursor.fetchall()}
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
            cursor.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s
                """,
                [table]
            )
            existing = {row[0] for row in cursor.fetchall()}

    # Define desired columns
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
    else:
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

    # Add missing columns after both 0023 branches are applied
    with connection.cursor() as cursor:
        for name, col in defs.items():
            if name not in existing:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col}")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('HomePage', '0023_reconcile_clientprofile_columns'),
        ('HomePage', '0023_remove_clientprofile_address_and_more'),
    ]

    operations = [
        migrations.RunPython(ensure_columns, noop),
    ]

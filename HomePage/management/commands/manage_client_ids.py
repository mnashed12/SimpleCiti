from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from your_app.models import Profile  # Update with your app name


class Command(BaseCommand):
    help = 'Manage Client IDs for user profiles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all Client IDs',
        )
        parser.add_argument(
            '--regenerate-aliases',
            action='store_true',
            help='Regenerate all client aliases',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_client_ids()
        
        if options['regenerate_aliases']:
            self.regenerate_aliases()

    def list_client_ids(self):
        """Display all Client IDs with their associated users"""
        self.stdout.write(self.style.SUCCESS('\n=== Client ID List ===\n'))
        
        profiles = Profile.objects.select_related('user').all()
        
        for profile in profiles:
            user = profile.user
            alias_display = profile.client_alias or 'N/A'
            
            self.stdout.write(
                f"{profile.client_id} | "
                f"Alias: {alias_display} | "
                f"User: {user.username} | "
                f"Name: {user.first_name} {user.last_name} | "
                f"Phone: {profile.phone or 'N/A'}"
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal Clients: {profiles.count()}\n')
        )

    def regenerate_aliases(self):
        """Regenerate client aliases for all profiles with phone numbers"""
        self.stdout.write('Regenerating client aliases...\n')
        
        profiles = Profile.objects.select_related('user').all()
        updated = 0
        
        for profile in profiles:
            if profile.phone and profile.user.first_name and profile.user.last_name:
                old_alias = profile.client_alias
                profile.client_alias = Profile.generate_client_alias(
                    profile.user.first_name,
                    profile.user.last_name,
                    profile.phone
                )
                profile.save()
                updated += 1
                
                self.stdout.write(
                    f"{profile.client_id}: {old_alias} → {profile.client_alias}"
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nUpdated {updated} aliases\n')
        )

# management/commands/send_pending_ndas.py

from django.core.management.base import BaseCommand
from myapp.models import NDARequest
import requests, os
from HomePage.views import get_access_token

SIGNNOW_API = "https://api.signnow.com"

class Command(BaseCommand):
    help = 'Send SignNow invites for pending NDA requests'

    def handle(self, *args, **kwargs):
        token = get_access_token()

        for request in NDARequest.objects.filter(is_sent=False):
            message_body = f"Click the link to sign your NDA.\nYour Simple Contact: {request.simple_contact}"
            res = requests.post(
                f"{SIGNNOW_API}/document/{request.document_id}/invite",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "to": [
                        {"email": request.email, "role": "Signer"}
                    ],
                    "from": os.getenv("SIGNNOW_USERNAME"),
                    "subject": "Please Sign Your NDA",
                    "message": message_body
                }
            )

            if res.status_code == 200:
                request.is_sent = True
                request.save()
                self.stdout.write(f"✅ Sent to {request.email}")
            else:
                self.stderr.write(f"❌ Failed for {request.email}: {res.text}")

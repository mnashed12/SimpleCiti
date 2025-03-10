from django.http import HttpResponse, JsonResponse    # type: ignore
from django.shortcuts import render     # type: ignore
import base64, json
from django.core.mail import send_mail
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment
from io import BytesIO
from PyPDF2 import PdfFileWriter, PdfFileReader
import base64

def home(request):
    return render(request, 'home.html')

def about(request):
    return render(request, 'about.html')

def team(request):
    return render(request, 'team.html')

def history(request):
    return render(request, 'history.html')

def advisoryboard(request):
    return render(request, 'advisoryboard.html')

def foradvisors(request):
    return render(request, 'foradvisors.html')

def SA(request):
    return render(request, 'SA.html')

def SE(request):
    return render(request, 'SE.html')

def NE(request):
    return render(request, 'NE.html')

def NEAbout(request):
    return render(request, 'NEAbout.html')

def tools(request):
    return render(request, 'tools.html')

def appraisal(request):
    return render(request, 'appraisal.html')

def SM(request):
    return render(request, 'SM.html')

def SS(request):
    return render(request, 'SS.html')

def generate_pdf(form_data):
    # Example: Generate a simple PDF using PyPDF2
    # You would replace this with your logic for filling out the NDA template

    pdf_writer = PdfFileWriter()

    # Create a dummy PDF page (replace with actual PDF creation logic)
    pdf_writer.addBlankPage(width=200, height=300)

    # Create a BytesIO buffer to hold the PDF
    pdf_buffer = BytesIO()
    pdf_writer.write(pdf_buffer)
    pdf_buffer.seek(0)

    return pdf_buffer


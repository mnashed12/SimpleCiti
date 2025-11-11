from django import forms
from .models import UploadedFile

class UploadForm(forms.ModelForm):
    class Meta:
        model = UploadedFile
        fields = ['title', 'name', 'file']

# forms.py - Update UserForm (remove address and phone)
class UserForm(forms.Form):
    full_name = forms.CharField(
        label='Full Name',
        max_length=100,
        widget=forms.TextInput(attrs={
            'autocomplete': 'name',
            'placeholder': 'Full Name'
        })
    )
    email = forms.EmailField(
        label='Email',
        widget=forms.EmailInput(attrs={
            'autocomplete': 'email',
            'placeholder': 'Email'
        })
    )
    reason = forms.CharField(
        label='Reason for NDA',
        max_length=255,
        widget=forms.TextInput(attrs={
            'placeholder': 'Reason for requesting NDA'
        })
    )

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()  # This points to CustomUser automatically

class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    email = forms.EmailField(required=True)
    phone = forms.CharField(
        max_length=20,
        required=False,
        help_text='Optional: Used for generating your client reference ID'
    )

    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'phone', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.phone = self.cleaned_data.get('phone', '')

        if commit:
            user.save()
        return user

from django import forms
from .models import ExchangeID

class ExchangeIDForm(forms.ModelForm):
    """
    Form for users to create a new Exchange ID
    """
    class Meta:
        model = ExchangeID
        fields = ['sale_price', 'equity_rollover', 'closing_date']
        widgets = {
            'sale_price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter sale price',
                'step': '0.01'
            }),
            'equity_rollover': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter equity rollover',
                'step': '0.01'
            }),
            'closing_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
        }
        labels = {
            'sale_price': 'Sale Price ($)',
            'equity_rollover': 'Equity Rollover ($)',
            'closing_date': 'Expected Closing Date',
        }
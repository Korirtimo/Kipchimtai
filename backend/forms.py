# Create forms.py for form handling

from django import forms
from .models import MilkDelivery, Payment, Farmer

class MilkDeliveryForm(forms.ModelForm):
    class Meta:
        model = MilkDelivery
        fields = ['farmer', 'delivery_date', 'quantity', 'quality_test_passed', 'notes']
        widgets = {
            'delivery_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        farmer = cleaned_data.get('farmer')
        delivery_date = cleaned_data.get('delivery_date')

        if farmer and delivery_date:
            # Check if delivery already exists for this farmer and date
            if MilkDelivery.objects.filter(farmer=farmer, delivery_date=delivery_date).exists():
                raise forms.ValidationError("A delivery record already exists for this farmer on this date.")
        
        return cleaned_data

class PaymentProcessForm(forms.Form):
    period_start = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    period_end = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    rate_per_kg = forms.DecimalField(max_digits=6, decimal_places=2)

    def clean(self):
        cleaned_data = super().clean()
        period_start = cleaned_data.get('period_start')
        period_end = cleaned_data.get('period_end')

        if period_start and period_end:
            if period_end <= period_start:
                raise forms.ValidationError("End date must be after start date.")
            
            # Check if payments already processed for this period
            if Payment.objects.filter(period_start=period_start, period_end=period_end).exists():
                raise forms.ValidationError("Payments have already been processed for this period.")
        
        return cleaned_data

# Create admin.py for admin interface configuration

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Farmer, MilkDelivery, Payment

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_farmer', 'is_staff_member')
    list_filter = ('is_farmer', 'is_staff_member', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'is_farmer', 'is_staff_member')}),
    )

@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ('farmer_id', 'get_full_name', 'national_id', 'bank_account', 'registration_date', 'active')
    search_fields = ('farmer_id', 'user__first_name', 'user__last_name', 'national_id')
    list_filter = ('active', 'registration_date')

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Full Name'

@admin.register(MilkDelivery)
class MilkDeliveryAdmin(admin.ModelAdmin):
    list_display = ('farmer', 'delivery_date', 'quantity', 'quality_test_passed', 'recorded_by', 'recorded_at')
    list_filter = ('delivery_date', 'quality_test_passed')
    search_fields = ('farmer__farmer_id', 'farmer__user__first_name', 'farmer__user__last_name')
    date_hierarchy = 'delivery_date'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'farmer', 'period_end', 'total_quantity', 'net_amount', 'status')
    list_filter = ('status', 'period_end')
    search_fields = ('reference_number', 'farmer__farmer_id', 'farmer__user__first_name', 'farmer__user__last_name')
    date_hierarchy = 'period_end'
    readonly_fields = ('reference_number', 'processed_at')
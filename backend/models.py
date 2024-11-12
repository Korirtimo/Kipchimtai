# First, let's create the Django models (models.py)

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal

class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True)
    is_farmer = models.BooleanField(default=False)
    is_staff_member = models.BooleanField(default=False)

class Farmer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    farmer_id = models.CharField(max_length=10, unique=True)
    national_id = models.CharField(max_length=20, unique=True)
    bank_account = models.CharField(max_length=20)
    bank_name = models.CharField(max_length=100)
    registration_date = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.farmer_id} - {self.user.get_full_name()}"

class MilkDelivery(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE)
    delivery_date = models.DateField()
    quantity = models.DecimalField(
        max_digits=7, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    quality_test_passed = models.BooleanField(default=True)
    recorded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='recorded_deliveries'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['farmer', 'delivery_date']
        ordering = ['-delivery_date']

    def __str__(self):
        return f"{self.farmer.farmer_id} - {self.delivery_date} - {self.quantity}kg"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]

    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE)
    period_start = models.DateField()
    period_end = models.DateField()
    total_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    rate_per_kg = models.DecimalField(max_digits=6, decimal_places=2)
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='processed_payments'
    )
    reference_number = models.CharField(max_length=20, unique=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.farmer.farmer_id} - {self.period_end} - {self.net_amount}"

# Now, let's create the views (views.py)

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Farmer, MilkDelivery, Payment
from .forms import MilkDeliveryForm, PaymentProcessForm

@login_required
def dashboard(request):
    if request.user.is_farmer:
        return farmer_dashboard(request)
    return staff_dashboard(request)

@login_required
def farmer_dashboard(request):
    farmer = get_object_or_404(Farmer, user=request.user)
    
    # Get recent deliveries
    recent_deliveries = MilkDelivery.objects.filter(
        farmer=farmer
    ).order_by('-delivery_date')[:10]
    
    # Get recent payments
    recent_payments = Payment.objects.filter(
        farmer=farmer
    ).order_by('-period_end')[:5]
    
    # Calculate monthly total
    current_month = timezone.now().date().replace(day=1)
    monthly_total = MilkDelivery.objects.filter(
        farmer=farmer,
        delivery_date__gte=current_month
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    context = {
        'recent_deliveries': recent_deliveries,
        'recent_payments': recent_payments,
        'monthly_total': monthly_total
    }
    return render(request, 'dairy/farmer_dashboard.html', context)

@user_passes_test(lambda u: u.is_staff_member)
def record_delivery(request):
    if request.method == 'POST':
        form = MilkDeliveryForm(request.POST)
        if form.is_valid():
            delivery = form.save(commit=False)
            delivery.recorded_by = request.user
            delivery.save()
            messages.success(request, 'Milk delivery recorded successfully.')
            return redirect('record_delivery')
    else:
        form = MilkDeliveryForm()
    
    context = {'form': form}
    return render(request, 'dairy/record_delivery.html', context)

@user_passes_test(lambda u: u.is_staff_member)
def process_payments(request):
    if request.method == 'POST':
        form = PaymentProcessForm(request.POST)
        if form.is_valid():
            period_start = form.cleaned_data['period_start']
            period_end = form.cleaned_data['period_end']
            rate_per_kg = form.cleaned_data['rate_per_kg']
            
            # Process payments for all active farmers
            process_monthly_payments(period_start, period_end, rate_per_kg, request.user)
            messages.success(request, 'Payments processed successfully.')
            return redirect('payment_list')
    else:
        form = PaymentProcessForm()
    
    context = {'form': form}
    return render(request, 'dairy/process_payments.html', context)

def process_monthly_payments(period_start, period_end, rate_per_kg, processed_by):
    farmers = Farmer.objects.filter(active=True)
    
    for farmer in farmers:
        # Calculate total quantity for the period
        deliveries = MilkDelivery.objects.filter(
            farmer=farmer,
            delivery_date__range=(period_start, period_end)
        )
        total_quantity = deliveries.aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        if total_quantity > 0:
            # Calculate payment amounts
            gross_amount = total_quantity * rate_per_kg
            deductions = 0  # Implement deduction logic if needed
            net_amount = gross_amount - deductions
            
            # Generate unique reference number
            reference_number = f"PAY-{farmer.farmer_id}-{period_end.strftime('%Y%m')}"
            
            # Create payment record
            Payment.objects.create(
                farmer=farmer,
                period_start=period_start,
                period_end=period_end,
                total_quantity=total_quantity,
                rate_per_kg=rate_per_kg,
                gross_amount=gross_amount,
                deductions=deductions,
                net_amount=net_amount,
                status='PENDING',
                processed_by=processed_by,
                reference_number=reference_number
            )

# Add URL patterns (urls.py)

from django.urls import path
from .. import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('delivery/record/', views.record_delivery, name='record_delivery'),
    path('payments/process/', views.process_payments, name='process_payments'),
]
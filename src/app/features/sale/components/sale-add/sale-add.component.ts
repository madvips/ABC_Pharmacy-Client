import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SaleService } from '../../../../core/services/sale.service';
import { MedicineService } from '../../../../core/services/medicine.service';
import { SaleCreateDto } from '../../../../core/models/sale.model';
import { MedicineResponseDto } from '../../../../core/models/medicine.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-sale-add',
  templateUrl: './sale-add.component.html',
  styleUrls: ['./sale-add.component.scss']
})
export class SaleAddComponent implements OnInit {
  saleForm: FormGroup;
  isSubmitting = signal(false);

  // Available medicines
  medicines = this.medicineService.medicines;

  // Payment methods
  paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private medicineService: MedicineService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.saleForm = this.createForm();
  }

  ngOnInit(): void {
    // Load medicines if not already loaded
    if (this.medicines().length === 0) {
      this.medicineService.refresh();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      customerName: [''],
      customerPhone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      paymentMethod: ['cash', Validators.required],
      notes: [''],
      items: this.fb.array([], Validators.minLength(1))
    });
  }

  get items(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  addItem(): void {
    // Business rule: Maximum 20 items per sale
    if (this.items.length >= 20) {
      this.notificationService.showError('Maximum 20 items allowed per sale');
      return;
    }

    const itemForm = this.fb.group({
      medicineId: ['', Validators.required],
      selectedMedicine: ['', Validators.required],
      medicineName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      unitPrice: [0, [Validators.required, Validators.min(0), Validators.max(100000)]]
    });

    // Auto-populate when medicine is selected
    itemForm.get('selectedMedicine')?.valueChanges.subscribe(medicineId => {
      if (medicineId) {
        const medicine = this.medicines().find(m => m.id === medicineId);

        // Business rule: Prevent duplicate medicines in same sale
        const existingItem = this.items.controls.find(item =>
          item !== itemForm && item.get('medicineId')?.value === medicineId
        );
        if (existingItem) {
          this.notificationService.showError('This medicine is already added to the sale');
          itemForm.get('selectedMedicine')?.setValue('');
          return;
        }

        if (medicine) {
          // Business rule: Prevent selling expired medicines
          if (this.isMedicineExpired(medicine)) {
            this.notificationService.showError('Cannot sell expired medicine');
            itemForm.get('selectedMedicine')?.setValue('');
            return;
          }

          // Business rule: Prevent selling medicines expiring within 30 days
          if (this.isMedicineExpiringSoon(medicine)) {
            this.notificationService.showError('Cannot sell medicine expiring within 30 days');
            itemForm.get('selectedMedicine')?.setValue('');
            return;
          }

          itemForm.patchValue({
            medicineId: medicine.id,
            medicineName: medicine.fullName,
            unitPrice: medicine.price
          }, { emitEvent: false });
        }
      }
    });

    this.items.push(itemForm);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  getAvailableMedicines(): MedicineResponseDto[] {
    return this.medicines().filter(medicine =>
      medicine.quantity > 0 && !this.isMedicineExpired(medicine)
    );
  }

  getMedicineById(id: string): MedicineResponseDto | undefined {
    return this.medicines().find(m => m.id === id);
  }

  // Business validation: Check if medicine is expired
  isMedicineExpired(medicine: MedicineResponseDto): boolean {
    const expiryDate = new Date(medicine.expiryDate);
    if (Number.isNaN(expiryDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate < today;
  }

  // Business validation: Check if medicine expires within 30 days
  isMedicineExpiringSoon(medicine: MedicineResponseDto): boolean {
    const expiryDate = new Date(medicine.expiryDate);
    if (Number.isNaN(expiryDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
  }

  calculateItemTotal(item: AbstractControl): number {
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  getTotalAmount(): number {
    return this.items.controls.reduce((total, item) => {
      return total + this.calculateItemTotal(item);
    }, 0);
  }

  // Business validation: Check if price has been manipulated
  isPriceManipulated(item: AbstractControl): boolean {
    const medicineId = item.get('medicineId')?.value;
    const unitPrice = item.get('unitPrice')?.value || 0;

    if (!medicineId) return false;

    const medicine = this.getMedicineById(medicineId);
    return medicine ? medicine.price !== unitPrice : false;
  }

  // Enhanced stock validation with better error messages
  validateStock(item: AbstractControl): boolean {
    const medicineId = item.get('medicineId')?.value;
    const quantity = item.get('quantity')?.value || 0;

    if (!medicineId || !quantity) return true;

    const medicine = this.getMedicineById(medicineId);
    if (!medicine) return false;

    // Check if medicine is expired
    if (this.isMedicineExpired(medicine)) return false;

    // Check if medicine expires soon
    if (this.isMedicineExpiringSoon(medicine)) return false;

    // Check stock availability
    return medicine.quantity >= quantity;
  }

  onSubmit(): void {
    if (this.saleForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Business validation: Minimum sale amount
    const totalAmount = this.getTotalAmount();
    if (totalAmount < 10) {
      this.notificationService.showError('Minimum sale amount is ₹10');
      return;
    }

    // Business validation: Maximum sale amount
    if (totalAmount > 50000) {
      this.notificationService.showError('Maximum sale amount is ₹50,000');
      return;
    }

    // Validate stock availability and other business rules
    const invalidItems = this.items.controls.filter(item => !this.validateStock(item));
    if (invalidItems.length > 0) {
      this.notificationService.showError('Insufficient stock for some items');
      return;
    }

    // Business validation: Check for price manipulation
    const priceManipulatedItems = this.items.controls.filter(item => this.isPriceManipulated(item));
    if (priceManipulatedItems.length > 0) {
      this.notificationService.showError('Some item prices have been modified. Please refresh and try again.');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.saleForm.value;
    const saleData: SaleCreateDto = {
      customerName: formValue.customerName || undefined,
      customerPhone: formValue.customerPhone || undefined,
      paymentMethod: formValue.paymentMethod,
      notes: formValue.notes || undefined,
      totalAmount: totalAmount,
      items: this.items.controls.map(item => {
        const itemValue = item.getRawValue();
        return {
          medicineId: itemValue.medicineId,
          medicineName: itemValue.medicineName,
          quantity: itemValue.quantity,
          unitPrice: itemValue.unitPrice,
          totalPrice: this.calculateItemTotal(item)
        };
      })
    };

    this.saleService.createSale(saleData).subscribe({
      next: (sale) => {
        this.notificationService.showSuccess('Sale recorded successfully!');
        this.router.navigate(['/sales']);
      },
      error: (error) => {
        console.error('Error creating sale:', error);
        this.notificationService.showError('Failed to record sale. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  getStockError(item: AbstractControl): string | null {
    const medicineId = item.get('medicineId')?.value;
    const quantity = item.get('quantity')?.value || 0;

    if (!medicineId || !quantity) return null;

    const medicine = this.getMedicineById(medicineId);
    if (!medicine) return 'Invalid medicine selected';

    if (this.isMedicineExpired(medicine)) {
      return 'Medicine is expired';
    }

    if (this.isMedicineExpiringSoon(medicine)) {
      return 'Medicine expires within 30 days';
    }

    if (medicine.quantity < quantity) {
      return `Only ${medicine.quantity} in stock`;
    }

    return null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.saleForm.controls).forEach(key => {
      const control = this.saleForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/sales']);
  }
}

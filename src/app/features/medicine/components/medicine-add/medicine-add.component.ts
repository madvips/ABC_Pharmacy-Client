import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicineService } from '../../../../core/services/medicine.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MedicineCreateDto } from '../../../../core/models/medicine.model';

@Component({
  selector: 'app-medicine-add',
  templateUrl: './medicine-add.component.html',
  styleUrls: ['./medicine-add.component.scss']
})
export class MedicineAddComponent implements OnInit {
  medicineForm!: FormGroup;
  isSubmitting = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private medicineService: MedicineService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.medicineForm = this.fb.group({
      fullName: [
        '', 
        [
          Validators.required, 
          Validators.minLength(2), 
          Validators.maxLength(200)
        ]
      ],
      brand: [
        '', 
        [
          Validators.required, 
          Validators.minLength(2), 
          Validators.maxLength(100)
        ]
      ],
      notes: [
        '', 
        [Validators.maxLength(500)]
      ],
      expiryDate: [
        '', 
        [Validators.required]
      ],
      quantity: [
        0, 
        [
          Validators.required, 
          Validators.min(0), 
          Validators.max(100000)
        ]
      ],
      price: [
        0, 
        [
          Validators.required, 
          Validators.min(0.01)
        ]
      ]
    });
  }

  onSubmit(): void {
    if (this.medicineForm.invalid) {
      this.medicineForm.markAllAsTouched();
      this.notificationService.showError('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting = true;
    
    const formValue = this.medicineForm.value;
    const medicine: MedicineCreateDto = {
      fullName: formValue.fullName.trim(),
      brand: formValue.brand.trim(),
      notes: formValue.notes?.trim() || '',
      expiryDate: this.formatDate(formValue.expiryDate),
      quantity: Number(formValue.quantity),
      price: Number(Number(formValue.price).toFixed(2))
    };

    this.medicineService.addMedicine(medicine).subscribe({
      next: () => {
        this.notificationService.showSuccess('Medicine added successfully!');
        this.router.navigate(['/medicines']);
      },
      error: (error) => {
        console.error('Error adding medicine:', error);
        this.isSubmitting = false;
      }
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString();
  }

  onCancel(): void {
    if (this.medicineForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/medicines']);
      }
    } else {
      this.router.navigate(['/medicines']);
    }
  }

  onReset(): void {
    if (confirm('Are you sure you want to reset the form?')) {
      this.medicineForm.reset({
        fullName: '',
        brand: '',
        notes: '',
        expiryDate: '',
        quantity: 0,
        price: 0
      });
      this.medicineForm.markAsUntouched();
    }
  }


  getErrorMessage(controlName: string): string {
    const control = this.medicineForm.get(controlName);
    
    if (!control || !control.errors) {
      return '';
    }
    
    if (control.hasError('required')) {
      return 'This field is required';
    }
    
    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum length is ${minLength} characters`;
    }
    
    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    
    if (control.hasError('min')) {
      const min = control.errors['min'].min;
      return `Minimum value is ${min}`;
    }
    
    if (control.hasError('max')) {
      const max = control.errors['max'].max;
      return `Maximum value is ${max}`;
    }
    
    if (control.hasError('pattern')) {
      if (controlName === 'fullName' || controlName === 'brand') {
        return 'Only letters, numbers, spaces, hyphens and dots are allowed';
      }
      if (controlName === 'quantity') {
        return 'Only whole numbers are allowed';
      }
    }
    
    return 'Invalid value';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.medicineForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
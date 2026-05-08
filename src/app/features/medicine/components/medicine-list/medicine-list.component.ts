import { Component, OnInit, effect } from '@angular/core';
import { MedicineService } from '../../../../core/services/medicine.service';
import { MedicineResponseDto } from '../../../../core/models/medicine.model';

@Component({
  selector: 'app-medicine-list',
  templateUrl: './medicine-list.component.html',
  styleUrls: ['./medicine-list.component.scss']
})
export class MedicineListComponent implements OnInit {

  displayedColumns: string[] = ['fullName', 'brand', 'expiryDate', 'quantity', 'price'];

  constructor(public medicineService: MedicineService) {
    effect(() => {
      const medicines = this.medicineService.filteredMedicines();
       console.log(`Filtered medicines count: ${medicines.length}`);
    });

    effect(() => {
      const expiringCount = this.medicineService.expiringCount();
      if (expiringCount > 0) {
        console.warn(`⚠️ Warning: ${expiringCount} medicine(s) expiring within 30 days!`);
      }
    });

    effect(() => {
      const lowStockCount = this.medicineService.lowStockCount();
      if (lowStockCount > 0) {
        console.warn(`⚠️ Warning: ${lowStockCount} medicine(s) have low stock (< 10 units)!`);
      }
    });
  }

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.medicineService.getAllMedicines().subscribe({
      error: (error) => {
        console.error('Error loading medicines:', error);
      }
    });
  }

  onSearchChange(searchTerm: string): void {
    this.medicineService.updateSearchTerm(searchTerm);
  }

  clearSearch(): void {
    this.medicineService.clearSearch();
  }

  getRowClass(medicine: MedicineResponseDto): string {
    const status = this.medicineService.getMedicineStatus(medicine);
    return `row-${status}`;
  }

  refresh(): void {
    this.medicineService.refresh();
  }

  trackByFullName(index: number, item: MedicineResponseDto): any {
    return item.fullName;
  }
}
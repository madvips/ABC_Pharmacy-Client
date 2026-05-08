import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SaleService } from '../../../../core/services/sale.service';
import { SaleResponseDto } from '../../../../core/models/sale.model';

@Component({
  selector: 'app-sale-list',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss']
})
export class SaleListComponent implements OnInit {
  // Search control
  searchControl = new FormControl('');

  // Services
  private saleService: SaleService;

  // Computed signals from service
  sales = this.saleServiceInstance.filteredSales;
  isLoading = this.saleServiceInstance.isLoading;
  totalSales = this.saleServiceInstance.totalSales;
  filteredCount = this.saleServiceInstance.filteredCount;
  totalRevenue = this.saleServiceInstance.totalRevenue;
  todaysRevenue = this.saleServiceInstance.todaysRevenue;

  // Local signals
  displayedColumns = signal<string[]>([
    'saleDate',
    'customerName',
    'customerPhone',
    'items',
    'totalAmount',
    'paymentMethod'
  ]);

  constructor(private saleServiceInstance: SaleService) {
    this.saleService = saleServiceInstance;

    // Update search term when form control changes
    effect(() => {
      this.saleServiceInstance.updateSearchTerm(this.searchControl.value || '');
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Load sales data
    this.saleServiceInstance.refresh();
  }

  // Format currency
  formatCurrency(amount: number): string {
    return this.saleServiceInstance.formatCurrency(amount);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get payment method display
  getPaymentMethodDisplay(method: string): string {
    return this.saleServiceInstance.getPaymentMethodDisplay(method);
  }

  // Get items summary
  getItemsSummary(items: any[]): string {
    // const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalItems = items.length;
    const medicineNames = items.map(item => item.medicineName).join(', ');
    return `${totalItems} item(s): ${medicineNames}`;
  }

  // Clear search
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // Refresh data
  refresh(): void {
    this.saleServiceInstance.refresh();
  }
}

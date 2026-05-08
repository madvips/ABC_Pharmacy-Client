import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SaleCreateDto, SaleResponseDto, SaleItemDto } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private readonly apiUrl = `${environment.apiUrl}/sale`;
  private salesSignal = signal<SaleResponseDto[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private searchTermSignal = signal<string>('');

  public sales = this.salesSignal.asReadonly();
  public isLoading = this.isLoadingSignal.asReadonly();
  public searchTerm = this.searchTermSignal.asReadonly();
  public filteredSales = computed(() => {
    const sales = this.salesSignal();
    const searchTerm = this.searchTermSignal().toLowerCase().trim();

    if (!searchTerm) {
      return sales;
    }

    return sales.filter(sale =>
      sale.customerName?.toLowerCase().includes(searchTerm) ||
      sale.customerPhone?.includes(searchTerm) ||
      sale.items.some(item => item.medicineName.toLowerCase().includes(searchTerm))
    );
  });

  public totalSales = computed(() => this.salesSignal().length);

  public filteredCount = computed(() => this.filteredSales().length);

  public totalRevenue = computed(() =>
    this.salesSignal().reduce((sum, sale) => sum + sale.totalAmount, 0)
  );

  public todaysSales = computed(() => {
    const today = new Date().toDateString();
    return this.salesSignal().filter(sale =>
      new Date(sale.saleDate).toDateString() === today
    );
  });

  public todaysRevenue = computed(() =>
    this.todaysSales().reduce((sum, sale) => sum + sale.totalAmount, 0)
  );

  constructor(private http: HttpClient) {}

  getAllSales(): Observable<SaleResponseDto[]> {
    this.isLoadingSignal.set(true);

    return this.http.get<SaleResponseDto[]>(this.apiUrl).pipe(
      tap({
        next: (sales) => {
          this.salesSignal.set(sales);
          this.isLoadingSignal.set(false);
        },
        error: () => {
          this.isLoadingSignal.set(false);
        }
      })
    );
  }

  createSale(sale: SaleCreateDto): Observable<SaleResponseDto> {
    return this.http.post<SaleResponseDto>(this.apiUrl, sale).pipe(
      tap((newSale) => {
        this.salesSignal.update(sales => [newSale, ...sales]);
      })
    );
  }

  getSaleById(id: number): Observable<SaleResponseDto> {
    return this.http.get<SaleResponseDto>(`${this.apiUrl}/${id}`);
  }

  updateSearchTerm(searchTerm: string): void {
    this.searchTermSignal.set(searchTerm);
  }

  clearSearch(): void {
    this.searchTermSignal.set('');
  }

  refresh(): void {
    this.getAllSales().subscribe();
  }

  calculateTotal(items: SaleItemDto[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  getPaymentMethodDisplay(method: string): string {
    const methods = {
      cash: 'Cash',
      card: 'Card',
      upi: 'UPI',
      other: 'Other'
    };
    return methods[method as keyof typeof methods] || method;
  }
}
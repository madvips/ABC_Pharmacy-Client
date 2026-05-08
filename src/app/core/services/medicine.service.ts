import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MedicineCreateDto, MedicineResponseDto } from '../models/medicine.model';

@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private readonly apiUrl = `${environment.apiUrl}/medicine`;
  private medicinesSignal = signal<MedicineResponseDto[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private searchTermSignal = signal<string>('');
  
  public medicines = this.medicinesSignal.asReadonly();
  public isLoading = this.isLoadingSignal.asReadonly();
  public searchTerm = this.searchTermSignal.asReadonly();
  
  public filteredMedicines = computed(() => {
    const medicines = this.medicinesSignal();
    const searchTerm = this.searchTermSignal().toLowerCase().trim();
    
    if (!searchTerm) {
      return medicines;
    }
    
    return medicines.filter(medicine =>
      medicine.fullName.toLowerCase().includes(searchTerm) ||
      medicine.brand.toLowerCase().includes(searchTerm)
    );
  });
  
  public totalMedicines = computed(() => this.medicinesSignal().length);

  public filteredCount = computed(() => this.filteredMedicines().length);
  
  public expiringCount = computed(() => 
    this.medicinesSignal().filter(m => this.getDaysUntilExpiry(m.expiryDate) < 30).length
  );
  
  public lowStockCount = computed(() => 
    this.medicinesSignal().filter(m => m.quantity < 10).length
  );

  public hasExpiringMedicines = computed(() => this.expiringCount() > 0);

  public hasLowStockMedicines = computed(() => this.lowStockCount() > 0);

  constructor(private http: HttpClient) {}

  getAllMedicines(): Observable<MedicineResponseDto[]> {
    this.isLoadingSignal.set(true);
    
    return this.http.get<MedicineResponseDto[]>(this.apiUrl).pipe(
      tap({
        next: (medicines) => {
          this.medicinesSignal.set(medicines);
          this.isLoadingSignal.set(false);
        },
        error: () => {
          this.isLoadingSignal.set(false);
        }
      })
    );
  }

  addMedicine(medicine: MedicineCreateDto): Observable<void> {
    return this.http.post<void>(this.apiUrl, medicine).pipe(
      tap(() => {
        this.getAllMedicines().subscribe();
      })
    );
  }

  updateSearchTerm(searchTerm: string): void {
    this.searchTermSignal.set(searchTerm);
  }

  clearSearch(): void {
    this.searchTermSignal.set('');
  }

  refresh(): void {
    this.getAllMedicines().subscribe();
  }

  getDaysUntilExpiry(expiryDate: string): number {
    const expiry = this.parseExpiryDate(expiryDate);
    if (!expiry) {
      return Number.POSITIVE_INFINITY;
    }

    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isValidExpiryDate(expiryDate: string): boolean {
    return this.parseExpiryDate(expiryDate) !== null;
  }

  private parseExpiryDate(expiryDate: string): Date | null {
    const parsed = new Date(expiryDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  getMedicineStatus(medicine: MedicineResponseDto): 'normal' | 'low-stock' | 'expiring' {
    const daysUntilExpiry = this.getDaysUntilExpiry(medicine.expiryDate);
    
    if (daysUntilExpiry < 30) {
      return 'expiring';
    }
    
    if (medicine.quantity < 10) {
      return 'low-stock';
    }
    
    return 'normal';
  }

}
/**
 * DTO for individual medicine item in a sale
 */
export interface SaleItemDto {
  medicineId: string; // This can be used for backend processing, but we will display medicineName in the form
  medicineName: string; // Changed from medicineId to medicineName
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * DTO for creating a new sale
 */
export interface SaleCreateDto {
  customerName?: string;
  customerPhone?: string;
  items: SaleItemDto[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  notes?: string;
}

/**
 * DTO for sale response from API
 */
export interface SaleResponseDto {
  id: number;
  customerName?: string;
  customerPhone?: string;
  items: SaleItemDto[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  saleDate: string;
  notes?: string;
}
/**
 * Medicine entity interface
 */
export interface Medicine {
  fullName: string;
  notes?: string;
  expiryDate: Date;
  quantity: number;
  price: number;
  brand: string;
}

/**
 * DTO for creating a new medicine
 */
export interface MedicineCreateDto {
  fullName: string;
  notes: string;
  expiryDate: string;
  quantity: number;
  price: number;
  brand: string;
}

/**
 * DTO for medicine response from API
 */
export interface MedicineResponseDto {
  id: string;
  fullName: string;
  expiryDate: string;
  quantity: number;
  price: number;
  brand: string;
}

/**
 * Medicine status enum for color coding
 */
export enum MedicineStatus {
  Normal = 'normal',
  LowStock = 'low-stock',
  Expiring = 'expiring'
}

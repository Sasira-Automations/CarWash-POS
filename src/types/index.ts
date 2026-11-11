export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'monitoring'
  | 'transactions'
  | 'services'
  | 'customers'
  | 'analytics'
  | 'cameras'
  | 'settings'
  | 'help';

export type PaymentMethod = 'M-Pesa' | 'Cash' | 'Card';

export type TransactionStatus = 'Completed' | 'Pending' | 'Refunded' | 'Cancelled';

export interface WashBay {
  id: string;
  bayNumber: string; // 'BAY 01', 'BAY 02', etc.
  plateNumber: string;
  vehicleName: string;
  service: string;
  elapsedMinutes: number;
  totalEstimatedMinutes: number;
  status: 'Washing' | 'Ready' | 'Available';
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'Washing' | 'Interior' | 'Detailing' | 'Specialty';
  price: number;
  durationMinutes: number;
  active: boolean;
  description: string;
  popular?: boolean;
}

export interface CartItem {
  service: ServiceItem;
  quantity: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  vehiclePlate: string;
  vehicleType: string;
  customerName?: string;
  customerPhone?: string;
  services: {
    serviceId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  timestamp: string; // ISO or formatted
  attendantName: string;
  notes?: string;
  mpesaRef?: string;
}

export interface VehicleDetection {
  id: string;
  plateNumber: string;
  confidence: number; // 0 - 100
  timestamp: string;
  cameraSource: string;
  vehicleType: string;
  vehicleColor: string;
  status: 'confirmed' | 'needs_review' | 'duplicate_blocked';
  isDuplicate: boolean;
  matchedTransactionId?: string; // Links if paid in POS
  entryEventId: string;
  manualCorrection?: string;
  waitingForSale?: boolean;
}

export interface CameraDevice {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  ipAddress: string;
  resolution: string;
  fps: number;
  todayDetections: number;
  lastPing: string;
  firmware: string;
  duplicateCooldownMinutes: number;
  anprEnabled: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  tier: 'Regular' | 'Silver' | 'Gold' | 'VIP';
  preferredService: string;
}

export interface BusinessSettings {
  businessName: string;
  branch: string;
  phone: string;
  email: string;
  location: string;
  currency: string;
  mpesaTillNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  duplicateCooldownSeconds: number;
  minConfidenceThreshold: number;
  autoLinkDetections: boolean;
}

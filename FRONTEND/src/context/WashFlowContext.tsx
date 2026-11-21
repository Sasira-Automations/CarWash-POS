import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  ActiveTab,
  VehicleDetection,
  Transaction,
  ServiceItem,
  CameraDevice,
  Customer,
  BusinessSettings,
  PaymentMethod,
  ExpenseRecord,
  VehicleClass
} from '../types';
import {
  fetchLiveDetections,
  subscribeToLiveDetections,
  normalizeVehicleClass,
  resolveDetectionImage
} from '../services/vehicleDetectionService';
import { useAuth } from './AuthContext';
import { logAuditEvent } from '../services/auditLogService';

export interface TenderReconciliation {
  amount: number;
  count: number;
  share: number;
  expensesDeducted: number;
  netTenderBalance: number;
}

export interface ServiceBreakdownItem {
  name: string;
  category: string;
  revenue: number;
  count: number;
  share: number;
}

export interface HourlyTrafficItem {
  hour: string;
  hourNumber: number;
  trafficCount: number;
  salesCount: number;
  revenue: number;
  percentage: number;
  isPeak?: boolean;
}

export interface ReconciliationReport {
  range: 'today' | 'week' | 'month' | 'all';
  vehiclesCount: number;
  completedSales: number;
  refundedSales: number;
  cancelledSales: number;
  conversionRate: number;
  unbilledVehicles: number;
  potentialLeakage: number;
  averageTicket: number;
  grossRevenue: number;
  refundedAmount: number;
  cancelledAmount: number;
  totalRevenue: number;
  totalExpenses: number;
  netOperatingProfit: number;
  operatingProfitMargin: number;
  revenueByMethod: Record<PaymentMethod, TenderReconciliation>;
  expensesByMethod: Record<PaymentMethod, number>;
  totalCashInDrawer: number;
  totalMpesaBalance: number;
  totalCardSettlement: number;
  isTenderBalanced: boolean;
  servicesBreakdown: ServiceBreakdownItem[];
  hourlyTraffic: HourlyTrafficItem[];
}

export interface NewTransactionInput {
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
  discount?: number;
  paymentMethod: PaymentMethod;
  attendantName: string;
  notes?: string;
  mpesaRef?: string;
  detectionId?: string;
  timestamp?: string;
}

interface WashFlowContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Realtime Supabase Connection Status
  isSupabaseConnected: boolean;

  // Detections
  detections: VehicleDetection[];
  captures: VehicleDetection[];
  correctPlateNumber: (detectionId: string, newPlate: string) => void;

  // Transactions
  transactions: Transaction[];
  selectedReceipt: Transaction | null;
  setSelectedReceipt: (tx: Transaction | null) => void;
  addTransaction: (input: NewTransactionInput) => Transaction;
  refundTransaction: (txId: string) => void;
  cancelTransaction: (txId: string) => void;

  // Quick Sale Modal Trigger
  isRecordSaleModalOpen: boolean;
  setIsRecordSaleModalOpen: (open: boolean) => void;
  salePreFill: { plateNumber?: string; vehicleClass?: VehicleClass | string; detectionId?: string } | undefined;
  openRecordSaleModal: (preFill?: { plateNumber?: string; vehicleClass?: VehicleClass | string; detectionId?: string }) => void;

  // Services
  services: ServiceItem[];
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  toggleServiceActive: (id: string) => void;

  // Cameras
  cameras: CameraDevice[];
  toggleCameraStatus: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Pick<Customer, 'name' | 'phone' | 'plateNumber' | 'preferredService'>) => void;

  // Expenses
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;

  // Settings
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Computed KPIs for Today
  stats: {
    vehiclesToday: number;
    totalRevenue: number;
    grossRevenue: number;
    refundedAmount: number;
    completedSales: number;
    averageTransaction: number;
    conversionRate: number;
    unbilledVehicles: number;
    potentialLeakage: number;
    totalExpenses: number;
    netOperatingProfit: number;
    revenueByMethod: Record<PaymentMethod, number>;
  };

  // Full Period Reconciliation Generator
  getReconciliationData: (range: 'today' | 'week' | 'month' | 'all') => ReconciliationReport;
}

// Helper: safe date parsing
export const parseSafeDate = (val: string | Date | undefined): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  return new Date();
};

export const isSameCalendarDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const matchesDateRange = (
  rawDate: string | Date | undefined,
  range: 'today' | 'week' | 'month' | 'all'
): boolean => {
  if (range === 'all') return true;
  const d = parseSafeDate(rawDate);
  const now = new Date();
  if (range === 'today') {
    return isSameCalendarDay(d, now);
  }
  if (range === 'week') {
    const msInDay = 86400000;
    const diffDays = (now.getTime() - d.getTime()) / msInDay;
    return diffDays >= -0.5 && diffDays <= 7;
  }
  if (range === 'month') {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  }
  return true;
};

const initialServices: ServiceItem[] = [];
const initialCameras: CameraDevice[] = [];
const initialTransactions: Transaction[] = [];
const initialCustomers: Customer[] = [];

const initialSettings: BusinessSettings = {
  businessName: 'Your Car Wash',
  branch: 'Main Branch',
  phone: '',
  email: '',
  location: 'Add your location',
  currency: 'KSh',
  mpesaTillNumber: '',
  receiptHeader: 'Your Car Wash\nAdd your business details in Settings',
  receiptFooter: 'Thank you for visiting.',
  duplicateCooldownSeconds: 900,
  minConfidenceThreshold: 80,
  autoLinkDetections: true
};

const WashFlowContext = createContext<WashFlowContextType | null>(null);

export const WashFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [detections, setDetections] = useState<VehicleDetection[]>([]);

  // Persistent State (strictly real data, filtering out any previous demo items)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('washflow_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => !t.id?.startsWith('tx-10') && !t.id?.startsWith('tx-09'));
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved transactions:', e);
    }
    return initialTransactions;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('washflow_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved services:', e);
    }
    return initialServices;
  });

  const [cameras, setCameras] = useState<CameraDevice[]>(initialCameras);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('washflow_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: any) => !e.id?.startsWith('exp-1') && !e.id?.startsWith('exp-2') && !e.id?.startsWith('exp-3'));
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved expenses:', e);
    }
    return [];
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => ({
    ...initialSettings,
    businessName: user?.businessName || initialSettings.businessName,
    branch: user?.branchName || initialSettings.branch,
    location: user?.location || initialSettings.location,
    email: user?.email || initialSettings.email
  }));

  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Sale Modal State
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [salePreFill, setSalePreFill] = useState<{
    plateNumber?: string;
    vehicleClass?: VehicleClass | string;
    detectionId?: string;
  } | undefined>(undefined);

  const openRecordSaleModal = (preFill?: {
    plateNumber?: string;
    vehicleClass?: VehicleClass | string;
    detectionId?: string;
  }) => {
    setSalePreFill(preFill);
    setIsRecordSaleModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('washflow_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to persist transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('washflow_services', JSON.stringify(services));
    } catch (e) {
      console.warn('Failed to persist services:', e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem('washflow_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to persist expenses:', e);
    }
  }, [expenses]);

  // Load capture data and listen for live vehicle ingress from Supabase
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadSupabaseData = async () => {
      const rows = await fetchLiveDetections();
      if (rows !== null) {
        setIsSupabaseConnected(true);
        const mappedDetections: VehicleDetection[] = rows.map((r) => {
          const vClass = normalizeVehicleClass(r.vehicle_class);
          const matchedTx = transactions.find((t) => t.vehicleType.toLowerCase() === vClass.toLowerCase());
          return {
            id: r.id,
            entryEventId: r.id,
            vehicleClass: vClass,
            imageUrl: resolveDetectionImage(r.image_path),
            confidence: 0,
            timestamp: r.captured_at,
            capturedAt: r.captured_at,
            cameraSource: 'Camera capture',
            vehicleType: vClass,
            status: 'confirmed',
            isDuplicate: false,
            waitingForSale: !matchedTx,
            matchedTransactionId: matchedTx?.receiptNumber
          };
        });
        setDetections(mappedDetections);
      } else {
        setIsSupabaseConnected(false);
        setDetections([]);
      }

      unsubscribe = subscribeToLiveDetections((eventType, row) => {
        if (eventType === 'DELETE') {
          setDetections((prev) => prev.filter((detection) => detection.id !== row.id));
          return;
        }

        setIsSupabaseConnected(true);
        const vClass = normalizeVehicleClass(row.vehicle_class);
        const imageUrl = resolveDetectionImage(row.image_path);
        const newDetection: VehicleDetection = {
          id: row.id,
          entryEventId: row.id,
          vehicleClass: vClass,
          imageUrl,
          confidence: 0,
          timestamp: row.captured_at,
          capturedAt: row.captured_at,
          cameraSource: 'Camera capture',
          vehicleType: vClass,
          status: 'confirmed',
          isDuplicate: false,
          waitingForSale: true
        };

        setDetections((prev) => {
          if (eventType === 'UPDATE') return prev.map((d) => (d.id === row.id ? newDetection : d));
          return [newDetection, ...prev.filter((d) => d.id !== row.id)];
        });
        if (eventType === 'INSERT') showToast(`New ${vClass} ingress capture detected`);
      });
    };

    loadSupabaseData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const correctPlateNumber = (detectionId: string, newPlate: string) => {
    const formatted = newPlate.toUpperCase().trim();
    setDetections((prev) =>
      prev.map((det) =>
        det.id === detectionId
          ? {
              ...det,
              plateNumber: formatted,
              status: 'confirmed',
              manualCorrection: `Corrected from ${det.plateNumber}`
            }
          : det
      )
    );
    showToast(`Plate updated to ${formatted}`);
    logAuditEvent({
      action: 'VEHICLE_PLATE_CORRECTED',
      category: 'operations',
      details: { detectionId, newPlate: formatted },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  // Add Transaction / POS Checkout
  const addTransaction = (input: NewTransactionInput): Transaction => {
    const subtotal = input.services.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.max(0, Math.min(subtotal, input.discount || 0));
    const total = Math.max(0, subtotal - discount);

    const receiptNum = `RCP-${Math.floor(4000 + Math.random() * 5900)}`;
    const nowIso = input.timestamp || new Date().toISOString();

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
      vehiclePlate: input.vehiclePlate.toUpperCase().trim(),
      vehicleType: input.vehicleType,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      services: input.services,
      subtotal,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      status: 'Completed',
      timestamp: nowIso,
      attendantName: input.attendantName,
      notes: input.notes,
      mpesaRef: input.mpesaRef
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update matching detection to mark as billed
    setDetections((prev) =>
      prev.map((d) => {
        const matchesPlate = d.plateNumber && d.plateNumber.toUpperCase() === newTx.vehiclePlate;
        const matchesId = input.detectionId && d.id === input.detectionId;
        if (matchesPlate || matchesId) {
          return {
            ...d,
            waitingForSale: false,
            matchedTransactionId: newTx.receiptNumber
          };
        }
        return d;
      })
    );

    showToast(`Payment of ${settings.currency} ${total.toLocaleString()} recorded via ${input.paymentMethod}`);
    logAuditEvent({
      action: 'TRANSACTION_RECORDED',
      category: 'pos',
      details: {
        receiptNumber: newTx.receiptNumber,
        total: newTx.total,
        paymentMethod: newTx.paymentMethod,
        vehiclePlate: newTx.vehiclePlate
      },
      userEmail: user?.email,
      userId: user?.id
    });

    return newTx;
  };

  const refundTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'Refunded' } : t))
    );
    showToast(`Transaction ${tx?.receiptNumber || txId} marked as Refunded`);
    logAuditEvent({
      action: 'TRANSACTION_REFUNDED',
      category: 'pos',
      details: { transactionId: txId, receiptNumber: tx?.receiptNumber, amount: tx?.total },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const cancelTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'Cancelled' } : t))
    );
    showToast(`Transaction ${tx?.receiptNumber || txId} marked as Cancelled`);
    logAuditEvent({
      action: 'TRANSACTION_CANCELLED',
      category: 'pos',
      details: { transactionId: txId, receiptNumber: tx?.receiptNumber },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const addService = (newService: Omit<ServiceItem, 'id'>) => {
    const srv: ServiceItem = {
      ...newService,
      id: `srv-${services.length + 1}`
    };
    setServices((prev) => [...prev, srv]);
    showToast(`Added service: ${srv.name}`);
    logAuditEvent({
      action: 'SERVICE_CREATED',
      category: 'services',
      details: { name: srv.name, price: srv.price, category: srv.category },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast(`Service updated`);
    logAuditEvent({
      action: 'SERVICE_UPDATED',
      category: 'services',
      details: { serviceId: id, updates },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const toggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const toggleCameraStatus = (id: string) => {
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'online' ? 'offline' : 'online' }
          : c
      )
    );
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newRecord: ExpenseRecord = { ...expense, id: `expense-${Date.now()}` };
    setExpenses((prev) => [newRecord, ...prev]);
    showToast('Expense recorded');
    logAuditEvent({
      action: 'EXPENSE_RECORDED',
      category: 'expenses',
      details: { description: newRecord.description, amount: newRecord.amount, category: newRecord.category },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const addCustomer = (customer: Pick<Customer, 'name' | 'phone' | 'plateNumber' | 'preferredService'>) => {
    const newCust: Customer = {
      ...customer,
      id: `customer-${Date.now()}`,
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: 'No visits yet',
      tier: 'Regular'
    };
    setCustomers((prev) => [newCust, ...prev]);
    showToast(`Customer added: ${customer.name}`);
    logAuditEvent({
      action: 'CUSTOMER_CREATED',
      category: 'operations',
      details: { name: newCust.name, phone: newCust.phone, plate: newCust.plateNumber },
      userEmail: user?.email,
      userId: user?.id
    });
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Settings updated successfully');
    logAuditEvent({
      action: 'SETTINGS_UPDATED',
      category: 'settings',
      details: newSettings,
      userEmail: user?.email,
      userId: user?.id
    });
  };

  // Comprehensive Revenue Reconciliation Report Generator
  const getReconciliationData = (range: 'today' | 'week' | 'month' | 'all'): ReconciliationReport => {
    // 1. Filter transactions by date range
    const periodTransactions = transactions.filter((t) => matchesDateRange(t.timestamp, range));

    // 2. Separate by status
    const completedList = periodTransactions.filter((t) => t.status === 'Completed');
    const refundedList = periodTransactions.filter((t) => t.status === 'Refunded');
    const cancelledList = periodTransactions.filter((t) => t.status === 'Cancelled');

    // 3. Revenue calculations
    const totalRevenue = completedList.reduce((sum, t) => sum + t.total, 0); // Net collected revenue
    const refundedAmount = refundedList.reduce((sum, t) => sum + t.total, 0);
    const cancelledAmount = cancelledList.reduce((sum, t) => sum + t.total, 0);
    const grossRevenue = totalRevenue + refundedAmount; // Gross tickets before refund
    const completedSales = completedList.length;
    const refundedSales = refundedList.length;
    const cancelledSales = cancelledList.length;

    const averageTicket = completedSales > 0 ? Math.round(totalRevenue / completedSales) : 0;

    // 4. Ingress / Camera Traffic
    const periodDetections = detections.filter((d) => matchesDateRange(d.timestamp || d.capturedAt, range));
    const vehiclesCount = periodDetections.length;

    // Conversion & Funnel
    const conversionRate = vehiclesCount > 0 ? Math.min(100, Math.round((completedSales / vehiclesCount) * 1000) / 10) : 0;
    const unbilledVehicles = Math.max(0, vehiclesCount - completedSales);
    const potentialLeakage = unbilledVehicles * averageTicket;

    // 5. Operating Expenses in Range
    const periodExpenses = expenses.filter((e) => matchesDateRange(e.date, range));
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingProfit = totalRevenue - totalExpenses;
    const operatingProfitMargin = totalRevenue > 0 ? Math.round((netOperatingProfit / totalRevenue) * 1000) / 10 : 0;

    // 6. Expenses by Payment Method
    const expensesByMethod: Record<PaymentMethod, number> = {
      'M-Pesa': periodExpenses.filter((e) => e.paymentMethod === 'M-Pesa').reduce((sum, e) => sum + e.amount, 0),
      Cash: periodExpenses.filter((e) => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0),
      Card: periodExpenses.filter((e) => e.paymentMethod === 'Card').reduce((sum, e) => sum + e.amount, 0)
    };

    // 7. Payment Tender Breakdown & Drawer Reconciliation
    const mpesaCompleted = completedList.filter((t) => t.paymentMethod === 'M-Pesa');
    const cashCompleted = completedList.filter((t) => t.paymentMethod === 'Cash');
    const cardCompleted = completedList.filter((t) => t.paymentMethod === 'Card');

    const mpesaAmount = mpesaCompleted.reduce((sum, t) => sum + t.total, 0);
    const cashAmount = cashCompleted.reduce((sum, t) => sum + t.total, 0);
    const cardAmount = cardCompleted.reduce((sum, t) => sum + t.total, 0);

    const revenueByMethod: Record<PaymentMethod, TenderReconciliation> = {
      'M-Pesa': {
        amount: mpesaAmount,
        count: mpesaCompleted.length,
        share: totalRevenue > 0 ? Math.round((mpesaAmount / totalRevenue) * 1000) / 10 : 0,
        expensesDeducted: expensesByMethod['M-Pesa'],
        netTenderBalance: mpesaAmount - expensesByMethod['M-Pesa']
      },
      Cash: {
        amount: cashAmount,
        count: cashCompleted.length,
        share: totalRevenue > 0 ? Math.round((cashAmount / totalRevenue) * 1000) / 10 : 0,
        expensesDeducted: expensesByMethod.Cash,
        netTenderBalance: cashAmount - expensesByMethod.Cash
      },
      Card: {
        amount: cardAmount,
        count: cardCompleted.length,
        share: totalRevenue > 0 ? Math.round((cardAmount / totalRevenue) * 1000) / 10 : 0,
        expensesDeducted: expensesByMethod.Card,
        netTenderBalance: cardAmount - expensesByMethod.Card
      }
    };

    const isTenderBalanced = Math.abs((mpesaAmount + cashAmount + cardAmount) - totalRevenue) === 0;

    // 8. Dynamic Service Contribution Breakdown
    const serviceMap = new Map<string, { revenue: number; count: number; category: string }>();
    completedList.forEach((tx) => {
      tx.services.forEach((s) => {
        const existing = serviceMap.get(s.name) || { revenue: 0, count: 0, category: 'Washing' };
        existing.revenue += s.price * s.quantity;
        existing.count += s.quantity;
        serviceMap.set(s.name, existing);
      });
    });

    const totalServiceRevenue = Array.from(serviceMap.values()).reduce((sum, item) => sum + item.revenue, 0);

    const servicesBreakdown: ServiceBreakdownItem[] = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name,
        category: data.category,
        revenue: data.revenue,
        count: data.count,
        share: totalServiceRevenue > 0 ? Math.round((data.revenue / totalServiceRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 9. Hourly Traffic & Sales Aggregation
    const hourlyBuckets: Record<number, { traffic: number; sales: number; revenue: number }> = {};
    for (let h = 8; h <= 17; h++) {
      hourlyBuckets[h] = { traffic: 0, sales: 0, revenue: 0 };
    }

    periodDetections.forEach((d) => {
      const dateObj = parseSafeDate(d.timestamp || d.capturedAt);
      const hour = dateObj.getHours();
      if (hourlyBuckets[hour]) {
        hourlyBuckets[hour].traffic += 1;
      }
    });

    completedList.forEach((t) => {
      const dateObj = parseSafeDate(t.timestamp);
      const hour = dateObj.getHours();
      if (hourlyBuckets[hour]) {
        hourlyBuckets[hour].sales += 1;
        hourlyBuckets[hour].revenue += t.total;
      }
    });

    const maxTrafficHour = Math.max(
      ...Object.values(hourlyBuckets).map((b) => b.traffic + b.sales),
      1
    );

    const hourlyTraffic: HourlyTrafficItem[] = Object.entries(hourlyBuckets).map(([hourStr, data]) => {
      const h = parseInt(hourStr);
      const displayHour = h < 12 ? `${String(h).padStart(2, '0')}:00 AM` : h === 12 ? '12:00 PM' : `${String(h - 12).padStart(2, '0')}:00 PM`;
      const combinedVolume = data.traffic + data.sales;
      return {
        hour: displayHour,
        hourNumber: h,
        trafficCount: data.traffic,
        salesCount: data.sales,
        revenue: data.revenue,
        percentage: combinedVolume > 0 ? Math.min(100, Math.round((combinedVolume / maxTrafficHour) * 100)) : 0,
        isPeak: combinedVolume === maxTrafficHour && combinedVolume > 0
      };
    });

    return {
      range,
      vehiclesCount,
      completedSales,
      refundedSales,
      cancelledSales,
      conversionRate,
      unbilledVehicles,
      potentialLeakage,
      averageTicket,
      grossRevenue,
      refundedAmount,
      cancelledAmount,
      totalRevenue,
      totalExpenses,
      netOperatingProfit,
      operatingProfitMargin,
      revenueByMethod,
      expensesByMethod,
      totalCashInDrawer: revenueByMethod.Cash.netTenderBalance,
      totalMpesaBalance: revenueByMethod['M-Pesa'].netTenderBalance,
      totalCardSettlement: revenueByMethod.Card.netTenderBalance,
      isTenderBalanced,
      servicesBreakdown,
      hourlyTraffic
    };
  };

  // Dashboard Stats (Today's reconciled metrics)
  const stats = useMemo(() => {
    const todayReport = getReconciliationData('today');
    return {
      vehiclesToday: todayReport.vehiclesCount,
      totalRevenue: todayReport.totalRevenue,
      grossRevenue: todayReport.grossRevenue,
      refundedAmount: todayReport.refundedAmount,
      completedSales: todayReport.completedSales,
      averageTransaction: todayReport.averageTicket,
      conversionRate: todayReport.conversionRate,
      unbilledVehicles: todayReport.unbilledVehicles,
      potentialLeakage: todayReport.potentialLeakage,
      totalExpenses: todayReport.totalExpenses,
      netOperatingProfit: todayReport.netOperatingProfit,
      revenueByMethod: {
        'M-Pesa': todayReport.revenueByMethod['M-Pesa'].amount,
        Cash: todayReport.revenueByMethod.Cash.amount,
        Card: todayReport.revenueByMethod.Card.amount
      }
    };
  }, [detections, transactions, expenses]);

  return (
    <WashFlowContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSupabaseConnected,
        detections,
        captures: detections,
        correctPlateNumber,
        transactions,
        selectedReceipt,
        setSelectedReceipt,
        addTransaction,
        refundTransaction,
        cancelTransaction,
        isRecordSaleModalOpen,
        setIsRecordSaleModalOpen,
        salePreFill,
        openRecordSaleModal,
        services,
        addService,
        updateService,
        toggleServiceActive,
        cameras,
        toggleCameraStatus,
        customers,
        addCustomer,
        expenses,
        addExpense,
        settings,
        updateSettings,
        toastMessage,
        showToast,
        stats,
        getReconciliationData
      }}
    >
      {children}
    </WashFlowContext.Provider>
  );
};

export const useWashFlow = () => {
  const context = useContext(WashFlowContext);
  if (!context) {
    throw new Error('useWashFlow must be used within a WashFlowProvider');
  }
  return context;
};

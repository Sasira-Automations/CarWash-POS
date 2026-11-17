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
  ExpenseRecord
} from '../types';
import {
  fetchLiveDetections,
  subscribeToLiveDetections,
  normalizeVehicleClass,
  resolveDetectionImage
} from '../services/vehicleDetectionService';

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
  refundTransaction: (txId: string) => void;
  cancelTransaction: (txId: string) => void;

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

  // Expenses
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;

  // Settings
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Computed KPIs
  stats: {
    vehiclesToday: number;
    totalRevenue: number;
    completedSales: number;
    averageTransaction: number;
    conversionRate: number;
    unbilledVehicles: number;
    revenueByMethod: Record<PaymentMethod, number>;
  };
}

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [detections, setDetections] = useState<VehicleDetection[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [cameras, setCameras] = useState<CameraDevice[]>(initialCameras);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);

  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Fetch initial data from Supabase and listen for realtime ESP32-CAM detections
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadSupabaseData = async () => {
      const rows = await fetchLiveDetections();
      if (rows !== null) {
        setIsSupabaseConnected(true);
        const mappedDetections: VehicleDetection[] = rows.map((r) => ({
          id: r.id,
          entryEventId: r.id,
          vehicleClass: normalizeVehicleClass(r.vehicle_class),
          imageUrl: resolveDetectionImage(r.image_path),
          confidence: 0,
          timestamp: new Date(r.captured_at).toLocaleString(),
          cameraSource: 'ESP32-CAM',
          vehicleType: normalizeVehicleClass(r.vehicle_class),
          status: 'confirmed',
          isDuplicate: false,
          waitingForSale: true
        }));
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
          timestamp: new Date(row.captured_at).toLocaleString(),
          cameraSource: 'ESP32-CAM',
          vehicleType: vClass,
          status: 'confirmed',
          isDuplicate: false,
          waitingForSale: true
        };

        setDetections((prev) => {
          if (eventType === 'UPDATE') return prev.map((detection) => detection.id === row.id ? newDetection : detection);
          return [newDetection, ...prev.filter((detection) => detection.id !== row.id)];
        });
        if (eventType === 'INSERT') showToast(`ESP32-CAM: New ${vClass} capture received`);
      });
    };

    loadSupabaseData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const correctPlateNumber = (detectionId: string, newPlate: string) => {
    setDetections((prev) =>
      prev.map((det) =>
        det.id === detectionId
          ? {
              ...det,
              plateNumber: newPlate.toUpperCase().trim(),
              status: 'confirmed',
              manualCorrection: `Corrected from ${det.plateNumber}`
            }
          : det
      )
    );
    showToast(`Plate updated to ${newPlate.toUpperCase().trim()}`);
  };

  const refundTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'Refunded' } : t))
    );
    showToast(`Transaction ${txId} marked as Refunded`);
  };

  const cancelTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'Cancelled' } : t))
    );
    showToast(`Transaction ${txId} marked as Cancelled`);
  };

  const addService = (newService: Omit<ServiceItem, 'id'>) => {
    const srv: ServiceItem = {
      ...newService,
      id: `srv-${services.length + 1}`
    };
    setServices((prev) => [...prev, srv]);
    showToast(`Added service: ${srv.name}`);
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast(`Service updated`);
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
    setExpenses((prev) => [{ ...expense, id: `expense-${Date.now()}` }, ...prev]);
    showToast('Expense recorded');
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Settings updated successfully');
  };

  const stats = useMemo(() => {
    const completedTxList = transactions.filter((t) => t.status === 'Completed');
    const totalRevenue = completedTxList.reduce((sum, transaction) => sum + transaction.total, 0);
    const completedSales = completedTxList.length;
    const averageTransaction = completedSales ? Math.round(totalRevenue / completedSales) : 0;
    const vehiclesToday = detections.filter((detection) =>
      new Date(detection.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const conversionRate = vehiclesToday ? Math.round((completedSales / vehiclesToday) * 1000) / 10 : 0;
    const unbilledVehicles = detections.filter((detection) => detection.waitingForSale).length;

    const revenueByMethod: Record<PaymentMethod, number> = {
      'M-Pesa': completedTxList.filter((transaction) => transaction.paymentMethod === 'M-Pesa').reduce((sum, transaction) => sum + transaction.total, 0),
      Cash: completedTxList.filter((transaction) => transaction.paymentMethod === 'Cash').reduce((sum, transaction) => sum + transaction.total, 0),
      Card: completedTxList.filter((transaction) => transaction.paymentMethod === 'Card').reduce((sum, transaction) => sum + transaction.total, 0)
    };

    return {
      vehiclesToday,
      totalRevenue,
      completedSales,
      averageTransaction,
      conversionRate,
      unbilledVehicles,
      revenueByMethod
    };
  }, [detections, transactions]);

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
        refundTransaction,
        cancelTransaction,
        services,
        addService,
        updateService,
        toggleServiceActive,
        cameras,
        toggleCameraStatus,
        customers,
        expenses,
        addExpense,
        settings,
        updateSettings,
        toastMessage,
        showToast,
        stats
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

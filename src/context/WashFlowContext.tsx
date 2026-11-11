import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  ActiveTab,
  VehicleDetection,
  Transaction,
  ServiceItem,
  CameraDevice,
  Customer,
  BusinessSettings,
  PaymentMethod,
  CartItem,
  WashBay
} from '../types';

interface WashFlowContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Wash Floor Bays
  washBays: WashBay[];
  checkoutBay: (bayId: string) => void;

  // POS State
  cart: CartItem[];
  addToCart: (service: ServiceItem) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, delta: number) => void;
  clearCart: () => void;
  posPlateInput: string;
  setPosPlateInput: (plate: string) => void;
  posCustomerPhone: string;
  setPosCustomerPhone: (phone: string) => void;
  posDiscount: number;
  setPosDiscount: (discount: number) => void;
  posPaymentMethod: PaymentMethod;
  setPosPaymentMethod: (method: PaymentMethod) => void;
  completeSale: () => Transaction | null;

  // Detections
  detections: VehicleDetection[];
  correctPlateNumber: (detectionId: string, newPlate: string) => void;
  triggerManualCameraDetection: () => void;
  quickChargePlateInPOS: (plateNumber: string) => void;

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

const initialWashBays: WashBay[] = [
  {
    id: 'bay-1',
    bayNumber: 'BAY 01',
    plateNumber: 'KDA 820H',
    vehicleName: 'Toyota Axio • White',
    service: 'Exterior wash',
    elapsedMinutes: 6,
    totalEstimatedMinutes: 15,
    status: 'Washing'
  },
  {
    id: 'bay-2',
    bayNumber: 'BAY 02',
    plateNumber: 'KDC 163B',
    vehicleName: 'Subaru Forester • Black',
    service: 'Premium wash',
    elapsedMinutes: 12,
    totalEstimatedMinutes: 20,
    status: 'Washing'
  },
  {
    id: 'bay-3',
    bayNumber: 'BAY 03',
    plateNumber: 'KCZ 406Y',
    vehicleName: 'Mercedes C200 • Grey',
    service: 'Wash & vacuum',
    elapsedMinutes: 8,
    totalEstimatedMinutes: 25,
    status: 'Washing'
  },
  {
    id: 'bay-4',
    bayNumber: 'BAY 04',
    plateNumber: 'KDD 771N',
    vehicleName: 'Mazda CX-5 • Soul Red',
    service: 'Ready for checkout',
    elapsedMinutes: 20,
    totalEstimatedMinutes: 20,
    status: 'Ready'
  }
];

const initialServices: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Exterior wash',
    category: 'Washing',
    price: 500,
    durationMinutes: 20,
    active: true,
    description: 'High-pressure foam wash, wheel rims rinse, and hand towel dry.',
    popular: true
  },
  {
    id: 'srv-2',
    name: 'Wash & vacuum',
    category: 'Washing',
    price: 600,
    durationMinutes: 30,
    active: true,
    description: 'Complete high-pressure wash, cabin vacuum, dashboard wipe & tyre shine.',
    popular: true
  },
  {
    id: 'srv-3',
    name: 'Interior detailing',
    category: 'Interior',
    price: 800,
    durationMinutes: 40,
    active: true,
    description: 'Deep carpet vacuuming, leather/fabric seat conditioning, air vent steam.',
    popular: true
  },
  {
    id: 'srv-4',
    name: 'Premium wash',
    category: 'Detailing',
    price: 900,
    durationMinutes: 45,
    active: true,
    description: 'Underwash, foam wash, interior shampoo, engine steam, and spray wax.',
    popular: true
  },
  {
    id: 'srv-5',
    name: 'Engine Steam Wash',
    category: 'Specialty',
    price: 750,
    durationMinutes: 30,
    active: true,
    description: 'De-greasing foam and high-temperature steam cleaning for engine bay.',
    popular: false
  },
  {
    id: 'srv-6',
    name: 'Ceramic Liquid Waxing',
    category: 'Detailing',
    price: 1200,
    durationMinutes: 45,
    active: true,
    description: 'Hydrophobic protective liquid wax application with microfiber buff.',
    popular: true
  }
];

const initialCameras: CameraDevice[] = [
  {
    id: 'cam-gate-1',
    name: 'Entrance Gate 1 — ANPR Primary',
    location: 'Main Ingress Lane (North Gate)',
    status: 'online',
    ipAddress: '192.168.10.141',
    resolution: '1920x1080 @ 30 FPS',
    fps: 30,
    todayDetections: 49,
    lastPing: '2 seconds ago',
    firmware: 'v3.2.4-anpr-edge',
    duplicateCooldownMinutes: 15,
    anprEnabled: true
  },
  {
    id: 'cam-bay-1',
    name: 'Wash Bay 1 & 2 Live Monitor',
    location: 'Active Service Bays',
    status: 'online',
    ipAddress: '192.168.10.143',
    resolution: '1920x1080 @ 25 FPS',
    fps: 25,
    todayDetections: 43,
    lastPing: '4 seconds ago',
    firmware: 'v3.2.0-core',
    duplicateCooldownMinutes: 20,
    anprEnabled: false
  },
  {
    id: 'cam-exit-1',
    name: 'Exit Barrier Camera',
    location: 'South Egress Lane',
    status: 'online',
    ipAddress: '192.168.10.145',
    resolution: '1920x1080 @ 30 FPS',
    fps: 30,
    todayDetections: 44,
    lastPing: '1 second ago',
    firmware: 'v3.2.4-anpr-edge',
    duplicateCooldownMinutes: 15,
    anprEnabled: true
  }
];

const initialDetections: VehicleDetection[] = [
  {
    id: 'det-1049',
    plateNumber: 'KDK 284J',
    confidence: 99.2,
    timestamp: '1 min ago',
    cameraSource: 'Entrance camera • ANPR detection',
    vehicleType: 'Toyota Prado • White',
    vehicleColor: 'Pearl White',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9049',
    waitingForSale: true
  },
  {
    id: 'det-1048',
    plateNumber: 'KDM 615A',
    confidence: 98.6,
    timestamp: '2 min ago',
    cameraSource: 'Entrance camera • ANPR detection',
    vehicleType: 'Honda Fit • Silver',
    vehicleColor: 'Silver Metallic',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9048',
    waitingForSale: true
  },
  {
    id: 'det-1047',
    plateNumber: 'KDD 771N',
    confidence: 97.4,
    timestamp: '20 min ago',
    cameraSource: 'Entrance Gate 1',
    vehicleType: 'Mazda CX-5 • Soul Red',
    vehicleColor: 'Soul Red',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9047'
  },
  {
    id: 'det-1046',
    plateNumber: 'KCZ 406Y',
    confidence: 98.1,
    timestamp: '28 min ago',
    cameraSource: 'Entrance Gate 1',
    vehicleType: 'Mercedes C200 • Grey',
    vehicleColor: 'Gunmetal Grey',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9046'
  },
  {
    id: 'det-1045',
    plateNumber: 'KDC 163B',
    confidence: 96.8,
    timestamp: '32 min ago',
    cameraSource: 'Entrance Gate 1',
    vehicleType: 'Subaru Forester • Black',
    vehicleColor: 'Midnight Black',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9045'
  },
  {
    id: 'det-1044',
    plateNumber: 'KDA 820H',
    confidence: 99.0,
    timestamp: '36 min ago',
    cameraSource: 'Entrance Gate 1',
    vehicleType: 'Toyota Axio • White',
    vehicleColor: 'White',
    status: 'confirmed',
    isDuplicate: false,
    entryEventId: 'EVT-9044'
  }
];

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1043',
    receiptNumber: 'TXN-1043',
    vehiclePlate: 'KDA 481P',
    vehicleType: 'Toyota Harrier',
    customerName: 'David Mwangi',
    customerPhone: '+254 712 345 678',
    services: [
      { serviceId: 'srv-4', name: 'Premium wash', price: 900, quantity: 1 }
    ],
    subtotal: 900,
    discount: 0,
    total: 900,
    paymentMethod: 'M-Pesa',
    status: 'Completed',
    timestamp: '15:38',
    attendantName: 'Sample attendant',
    mpesaRef: 'RJG82K9L2P'
  },
  {
    id: 'tx-1042',
    receiptNumber: 'TXN-1042',
    vehiclePlate: 'KCX 204R',
    vehicleType: 'Mazda Demio',
    customerName: 'Sarah Kimani',
    customerPhone: '+254 722 890 123',
    services: [
      { serviceId: 'srv-1', name: 'Exterior wash', price: 500, quantity: 1 }
    ],
    subtotal: 500,
    discount: 0,
    total: 500,
    paymentMethod: 'Cash',
    status: 'Completed',
    timestamp: '15:31',
    attendantName: 'Sample attendant'
  },
  {
    id: 'tx-1041',
    receiptNumber: 'TXN-1041',
    vehiclePlate: 'KDG 908T',
    vehicleType: 'Nissan X-Trail',
    customerName: 'John Omondi',
    customerPhone: '+254 733 456 789',
    services: [
      { serviceId: 'srv-2', name: 'Wash & vacuum', price: 600, quantity: 1 }
    ],
    subtotal: 600,
    discount: 0,
    total: 600,
    paymentMethod: 'M-Pesa',
    status: 'Completed',
    timestamp: '15:24',
    attendantName: 'Sample attendant',
    mpesaRef: 'RJG71M3X99'
  },
  {
    id: 'tx-1040',
    receiptNumber: 'TXN-1040',
    vehiclePlate: 'KCY 317L',
    vehicleType: 'Toyota Vitz',
    customerName: 'Grace Njoroge',
    customerPhone: '+254 720 112 233',
    services: [
      { serviceId: 'srv-1', name: 'Exterior wash', price: 500, quantity: 1 }
    ],
    subtotal: 500,
    discount: 0,
    total: 500,
    paymentMethod: 'Card',
    status: 'Completed',
    timestamp: '15:17',
    attendantName: 'Sample attendant'
  },
  {
    id: 'tx-1039',
    receiptNumber: 'TXN-1039',
    vehiclePlate: 'KDB 592M',
    vehicleType: 'Volkswagen Golf',
    customerName: 'Dennis Mutua',
    customerPhone: '+254 711 987 654',
    services: [
      { serviceId: 'srv-3', name: 'Interior detailing', price: 800, quantity: 1 }
    ],
    subtotal: 800,
    discount: 0,
    total: 800,
    paymentMethod: 'M-Pesa',
    status: 'Completed',
    timestamp: '15:09',
    attendantName: 'Sample attendant',
    mpesaRef: 'RJG50P881B'
  }
];

const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'David Mwangi',
    phone: '+254 712 345 678',
    plateNumber: 'KDA 481P',
    totalVisits: 14,
    totalSpent: 16500,
    lastVisit: 'Today 15:38',
    tier: 'VIP',
    preferredService: 'Premium wash'
  },
  {
    id: 'cust-2',
    name: 'Sarah Kimani',
    phone: '+254 722 890 123',
    plateNumber: 'KCX 204R',
    totalVisits: 8,
    totalSpent: 9200,
    lastVisit: 'Today 15:31',
    tier: 'Gold',
    preferredService: 'Exterior wash'
  },
  {
    id: 'cust-3',
    name: 'John Omondi',
    phone: '+254 733 456 789',
    plateNumber: 'KDG 908T',
    totalVisits: 5,
    totalSpent: 3500,
    lastVisit: 'Today 15:24',
    tier: 'Silver',
    preferredService: 'Wash & vacuum'
  }
];

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
  const [washBays, setWashBays] = useState<WashBay[]>(initialWashBays);
  const [detections, setDetections] = useState<VehicleDetection[]>(initialDetections);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [cameras, setCameras] = useState<CameraDevice[]>(initialCameras);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);

  // POS temporary state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posPlateInput, setPosPlateInput] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const checkoutBay = (bayId: string) => {
    const bay = washBays.find((b) => b.id === bayId);
    if (!bay) return;
    setPosPlateInput(bay.plateNumber);
    // Find matching service
    const matchingSrv = services.find((s) => s.name.toLowerCase() === bay.service.toLowerCase()) || services[0];
    setCart([{ service: matchingSrv, quantity: 1 }]);
    setActiveTab('pos');
    showToast(`Checked out ${bay.plateNumber} from ${bay.bayNumber} into POS`);
  };

  // Cart actions
  const addToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
    showToast(`Added ${service.name} to cart`);
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.service.id !== serviceId));
  };

  const updateCartQuantity = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.service.id === serviceId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setPosPlateInput('');
    setPosCustomerPhone('');
    setPosDiscount(0);
  };

  const quickChargePlateInPOS = (plateNumber: string) => {
    setPosPlateInput(plateNumber);
    // Default to exterior wash if empty
    if (cart.length === 0 && services.length > 0) {
      setCart([{ service: services[0], quantity: 1 }]);
    }
    setActiveTab('pos');
    showToast(`Vehicle plate ${plateNumber} loaded into POS`);
  };

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

  const triggerManualCameraDetection = () => {
    const samplePlates = ['KDE 119V', 'KDG 329M', 'KDC 819T', 'KDF 501R'];
    const plate = samplePlates[Math.floor(Math.random() * samplePlates.length)];
    const newDetection: VehicleDetection = {
      id: `det-${1050 + detections.length}`,
      plateNumber: plate,
      confidence: 99.1,
      timestamp: 'Just now',
      cameraSource: 'Entrance camera • ANPR detection',
      vehicleType: 'Toyota Land Cruiser • Black',
      vehicleColor: 'Black',
      status: 'confirmed',
      isDuplicate: false,
      entryEventId: `EVT-${9050 + detections.length}`,
      waitingForSale: true
    };

    setDetections((prev) => [newDetection, ...prev]);
    setCameras((prev) =>
      prev.map((c) =>
        c.id === 'cam-gate-1' ? { ...c, todayDetections: c.todayDetections + 1, lastPing: 'Just now' } : c
      )
    );
    showToast(`New vehicle arrival detected: ${plate} (Entrance camera)`);
  };

  const completeSale = (): Transaction | null => {
    if (cart.length === 0) {
      showToast('Cannot complete sale: Cart is empty');
      return null;
    }
    const plate = posPlateInput.trim().toUpperCase() || 'WALK-IN';
    const subtotal = cart.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
    const total = Math.max(0, subtotal - posDiscount);
    const txIdNum = 1044 + transactions.length;
    const txReceipt = `TXN-${txIdNum}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx: Transaction = {
      id: `tx-${txIdNum}`,
      receiptNumber: txReceipt,
      vehiclePlate: plate,
      vehicleType: 'Customer Vehicle',
      customerName: posCustomerPhone ? `Customer (${posCustomerPhone.slice(-4)})` : 'Valued Customer',
      customerPhone: posCustomerPhone || undefined,
      services: cart.map((i) => ({
        serviceId: i.service.id,
        name: i.service.name,
        price: i.service.price,
        quantity: i.quantity
      })),
      subtotal,
      discount: posDiscount,
      total,
      paymentMethod: posPaymentMethod,
      status: 'Completed',
      timestamp: timeStr,
      attendantName: 'Sample attendant',
      mpesaRef: posPaymentMethod === 'M-Pesa' ? `RJG${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Mark detection as no longer waiting
    setDetections((prev) =>
      prev.map((det) =>
        det.plateNumber === plate
          ? { ...det, matchedTransactionId: txReceipt, waitingForSale: false }
          : det
      )
    );

    // Free bay if matching
    setWashBays((prev) =>
      prev.map((b) =>
        b.plateNumber === plate
          ? { ...b, status: 'Washing', elapsedMinutes: 1, plateNumber: 'KDE 119V', vehicleName: 'New Car', service: 'Exterior wash' }
          : b
      )
    );

    setSelectedReceipt(newTx);
    clearCart();
    showToast(`Payment of ${settings.currency} ${total.toLocaleString()} recorded via ${posPaymentMethod}!`);
    return newTx;
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

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Settings updated successfully');
  };

  const stats = useMemo(() => {
    const gate1Cam = cameras.find((c) => c.id === 'cam-gate-1');
    const vehiclesToday = gate1Cam ? gate1Cam.todayDetections : 49;

    const completedTxList = transactions.filter((t) => t.status === 'Completed');
    const additionalTotal = transactions
      .filter((t) => !initialTransactions.some((init) => init.id === t.id) && t.status === 'Completed')
      .reduce((sum, t) => sum + t.total, 0);

    const totalRevenue = 24500 + additionalTotal;
    const completedSales = 43 + (completedTxList.length - initialTransactions.length);
    const averageTransaction = 570;
    const conversionRate = 87.8;
    const unbilledVehicles = 6;

    const revenueByMethod: Record<PaymentMethod, number> = {
      'M-Pesa': Math.round(totalRevenue * 0.68),
      Cash: Math.round(totalRevenue * 0.22),
      Card: Math.round(totalRevenue * 0.10)
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
  }, [cameras, transactions]);

  return (
    <WashFlowContext.Provider
      value={{
        activeTab,
        setActiveTab,
        washBays,
        checkoutBay,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        posPlateInput,
        setPosPlateInput,
        posCustomerPhone,
        setPosCustomerPhone,
        posDiscount,
        setPosDiscount,
        posPaymentMethod,
        setPosPaymentMethod,
        completeSale,
        detections,
        correctPlateNumber,
        triggerManualCameraDetection,
        quickChargePlateInPOS,
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

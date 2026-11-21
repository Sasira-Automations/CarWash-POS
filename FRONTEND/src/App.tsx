import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WashFlowProvider, useWashFlow } from './context/WashFlowContext';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { VehicleMonitoringView } from './components/monitoring/VehicleMonitoringView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ServicesView } from './components/services/ServicesView';
import { CustomersView } from './components/customers/CustomersView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CamerasView } from './components/cameras/CamerasView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogsView } from './components/settings/AuditLogsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { RecordSaleModal } from './components/modals/RecordSaleModal';
import { SplashScreen } from './components/common/SplashScreen';
import { CheckCircle2 } from 'lucide-react';

const WashFlowMainApp: React.FC = () => {
  const {
    activeTab,
    selectedReceipt,
    setSelectedReceipt,
    isRecordSaleModalOpen,
    setIsRecordSaleModalOpen,
    salePreFill,
    toastMessage
  } = useWashFlow();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f4fa] text-slate-900 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopNavbar onMenuToggle={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'monitoring' && <VehicleMonitoringView />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'services' && <ServicesView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'cameras' && <CamerasView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'audit' && <AuditLogsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav onMenuToggle={() => setMobileSidebarOpen(true)} />

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          transaction={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Record Sale / POS Modal */}
      {isRecordSaleModalOpen && (
        <RecordSaleModal
          isOpen={isRecordSaleModalOpen}
          onClose={() => setIsRecordSaleModalOpen(false)}
          preFill={salePreFill}
        />
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading, isPasswordRecovery, isMfaPending } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  // Enforce authentication: show AuthPage if unauthenticated, resetting password, or awaiting 2FA verification
  if (!user || isPasswordRecovery || isMfaPending) {
    return <AuthPage />;
  }

  return (
    <WashFlowProvider>
      <WashFlowMainApp />
    </WashFlowProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

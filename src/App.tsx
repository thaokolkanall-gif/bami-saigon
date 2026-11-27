import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomBar } from './components/MobileBottomBar';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PolicyPage } from './pages/PolicyPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { SetupWizard } from './pages/admin/SetupWizard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminMenu } from './pages/admin/AdminMenu';
import { AdminAIAssistant } from './pages/admin/AdminAIAssistant';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminOperations } from './pages/admin/AdminOperations';
import { AdminPromotions } from './pages/admin/AdminPromotions';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { LuckyWheelWidget } from './components/LuckyWheelWidget';
import { useStore } from './context/StoreContext';

export default function App() {
  const { settings } = useStore();
  const [currentView, setCurrentView] = useState('home');
  const [trackingToken, setTrackingToken] = useState('');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [adminOrdersInitialFilter, setAdminOrdersInitialFilter] = useState('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Admin Auth state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('bami_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Handle URL hash changes for easy direct linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      if (hash.startsWith('track')) {
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        const token = urlParams.get('token');
        if (token) {
          setTrackingToken(token);
          setCurrentView('track');
        }
      } else if (hash.startsWith('admin')) {
        setCurrentView('admin');
        const parts = hash.split('/');
        if (parts[1]) setAdminTab(parts[1]);
      } else {
        setCurrentView(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string, token?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'track' && token) {
      setTrackingToken(token);
      window.location.hash = `track?token=${token}`;
      setCurrentView('track');
    } else if (view.startsWith('admin')) {
      window.location.hash = view;
      setCurrentView('admin');
    } else {
      window.location.hash = view;
      setCurrentView(view);
    }
  };

  const handleAdminLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    navigateTo('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('bami_token');
    localStorage.removeItem('bami_user');
    setCurrentUser(null);
    navigateTo('home');
  };

  // Determine if in Admin View
  if (currentView === 'admin') {
    if (!currentUser) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToHome={() => navigateTo('home')}
        />
      );
    }

    // Check if store needs initial setup wizard
    if (settings?.is_configured === '0') {
      return (
        <SetupWizard
          onComplete={() => navigateTo('admin')}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          window.location.hash = `admin/${tab}`;
        }}
        currentUser={currentUser}
        onLogout={handleAdminLogout}
        onViewStore={() => navigateTo('home')}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onGoToOrders={(status) => {
              if (status) setAdminOrdersInitialFilter(status);
              setAdminTab('orders');
            }}
          />
        )}
        {adminTab === 'orders' && (
          <AdminOrders initialStatusFilter={adminOrdersInitialFilter} />
        )}
        {adminTab === 'menu' && <AdminMenu />}
        {adminTab === 'ai' && <AdminAIAssistant />}
        {adminTab === 'content' && <AdminContent />}
        {adminTab === 'operations' && <AdminOperations />}
        {adminTab === 'customers' && <AdminCustomers />}
        {adminTab === 'promotions' && <AdminPromotions />}
        {adminTab === 'logs' && <AdminAuditLogs />}
      </AdminLayout>
    );
  }

  // Customer Views
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E8] text-[#4A2115]">
      {/* Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigate={(view) => navigateTo(view)}
            onOpenAccount={() => setIsAccountModalOpen(true)}
          />
        )}

        {currentView === 'menu' && (
          <MenuPage />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBackToMenu={() => navigateTo('menu')}
            onOrderSuccess={(token) => navigateTo('track', token)}
          />
        )}

        {currentView === 'track' && (
          <OrderTrackingPage
            trackingToken={trackingToken}
            onGoHome={() => navigateTo('home')}
            onGoMenu={() => navigateTo('menu')}
          />
        )}

        {currentView === 'about' && (
          <AboutPage onNavigate={(view) => navigateTo(view)} />
        )}

        {currentView === 'contact' && (
          <ContactPage />
        )}

        {currentView === 'policy' && (
          <PolicyPage />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={(view) => navigateTo(view)} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomBar
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        onCheckout={() => navigateTo('checkout')}
      />

      {/* Vòng quay may mắn */}
      <LuckyWheelWidget
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        onOpenAccount={() => setIsAccountModalOpen(true)}
      />

      {/* Customer Modals */}
      <CustomerAuthModal />
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onTrackOrder={(tok) => {
          setTrackingToken(tok);
          navigateTo('track');
        }}
      />
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer } from '../types';

interface CustomerContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { phone: string; password: string; full_name: string; email?: string; default_address?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bami_customer_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshProfile = async () => {
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customers/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        // Token expired
        localStorage.removeItem('bami_customer_token');
        setToken(null);
        setCustomer(null);
      }
    } catch (e) {
      // Offline / error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Đăng nhập không thành công' };
      }

      localStorage.setItem('bami_customer_token', data.token);
      setToken(data.token);
      setCustomer(data.customer);
      closeAuthModal();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Không thể kết nối máy chủ' };
    }
  };

  const register = async (data: { phone: string; password: string; full_name: string; email?: string; default_address?: string }) => {
    try {
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Đăng ký không thành công' };
      }

      localStorage.setItem('bami_customer_token', resData.token);
      setToken(resData.token);
      setCustomer(resData.customer);
      closeAuthModal();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Không thể kết nối máy chủ' };
    }
  };

  const logout = () => {
    localStorage.removeItem('bami_customer_token');
    setToken(null);
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

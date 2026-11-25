import React, { useState } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Phone, Clock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { settings, isOpenNow } = useStore();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'menu', label: 'Thực đơn' },
    { id: 'about', label: 'Về chúng tôi' },
    { id: 'contact', label: 'Liên hệ' },
  ];

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const storeName = settings?.store_name || 'Bami Sài Gòn';

  return (
    <>
      {/* Top Notice Bar */}
      <div className="bg-[#4A2115] text-[#FFF8E8] text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#F5BD42]" />
              <span className="hidden sm:inline">Giờ hoạt động:</span> 06:00 - 22:00 hàng ngày
            </span>
            <span className="hidden md:inline text-amber-300">|</span>
            <span className="hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Bánh nướng nóng giòn theo đơn
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {settings?.phone && (
              <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 hover:text-[#F5BD42] transition-colors">
                <Phone className="w-3 h-3 text-[#F5BD42]" />
                <span className="font-semibold">{settings.phone}</span>
              </a>
            )}
            <button 
              onClick={() => handleNavClick('admin')}
              className="text-[#F5BD42] hover:underline cursor-pointer pl-2 border-l border-amber-900"
            >
              Quản trị
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFF8E8]/95 backdrop-blur-md border-b border-[#F5BD42]/30 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Brand Name */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={storeName} className="h-12 w-auto object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5BD42] to-[#8C4A26] flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:scale-105 transition-transform">
                🥖
              </div>
            )}
            <div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[#4A2115] leading-none group-hover:text-[#8C4A26] transition-colors">
                {storeName}
              </div>
              <div className="text-xs text-[#8C4A26] font-medium tracking-wide mt-1 hidden sm:block">
                {settings?.slogan || 'Bánh Mì Truyền Thống Đậm Đà Hương Vị'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(link => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-4 py-2 rounded-xl text-base font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#F5BD42] text-[#4A2115] shadow-xs' 
                      : 'text-[#4A2115] hover:bg-[#F5BD42]/20 hover:text-[#8C4A26]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Status Indicator, Order Button, Cart */}
          <div className="flex items-center gap-3">
            {/* Open / Close Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F5BD42]/40">
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isOpenNow ? 'text-emerald-800' : 'text-rose-800'}>
                {isOpenNow ? 'Đang mở cửa' : 'Tạm ngưng nhận'}
              </span>
            </div>

            {/* CTA Order Button */}
            <button
              onClick={() => handleNavClick('menu')}
              className="hidden sm:inline-flex items-center gap-2 bg-[#8C4A26] hover:bg-[#753A1B] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Đặt món</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-white border border-[#F5BD42]/60 hover:bg-[#F5BD42]/10 text-[#4A2115] transition-all cursor-pointer shadow-xs"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-6 h-6 text-[#8C4A26]" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E11D48] text-white font-black text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-[#4A2115] hover:bg-[#F5BD42]/20 focus:outline-hidden"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FFF8E8] border-b border-[#F5BD42]/40 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  currentView === link.id
                    ? 'bg-[#F5BD42] text-[#4A2115]'
                    : 'text-[#4A2115] hover:bg-[#F5BD42]/15'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2">
              <button
                onClick={() => handleNavClick('menu')}
                className="w-full py-3 bg-[#8C4A26] text-white text-center font-bold rounded-xl shadow-md"
              >
                🥖 Đặt bánh ngay
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

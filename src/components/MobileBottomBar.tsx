import React from 'react';
import { UtensilsCrossed, Phone, MessageCircle, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';

interface MobileBottomBarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ onNavigate, currentView }) => {
  const { settings } = useStore();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();

  const phone = settings?.phone || '';
  const zalo = settings?.zalo || '';
  const cleanPhone = phone.replace(/\s+/g, '');
  const cleanZalo = zalo.replace(/\s+/g, '');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF8E8] border-t-2 border-[#F5BD42] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5">
      <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
        
        {/* Menu Tab */}
        <button
          onClick={() => {
            onNavigate('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentView === 'menu' ? 'text-[#8C4A26] font-bold' : 'text-[#4A2115] hover:text-[#8C4A26]'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Thực đơn</span>
        </button>

        {/* Call Store */}
        {cleanPhone ? (
          <a
            href={`tel:${cleanPhone}`}
            className="flex flex-col items-center justify-center py-1 text-[#4A2115] hover:text-[#8C4A26] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-0.5">Gọi quán</span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center py-1 text-gray-400 opacity-50">
            <Phone className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Gọi quán</span>
          </div>
        )}

        {/* Zalo Button */}
        {cleanZalo ? (
          <a
            href={`https://zalo.me/${cleanZalo}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center py-1 text-[#4A2115] hover:text-blue-600 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-0.5">Zalo</span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center py-1 text-gray-400 opacity-50">
            <MessageCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Zalo</span>
          </div>
        )}

        {/* Cart Drawer Button */}
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 text-[#8C4A26] font-bold transition-all"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#F5BD42] text-[#4A2115] flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E11D48] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">Giỏ hàng</span>
        </button>

      </div>
    </div>
  );
};

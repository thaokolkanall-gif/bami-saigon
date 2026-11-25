import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { isCartDrawerOpen, setIsCartDrawerOpen, items, updateQuantity, removeFromCart, subtotal, totalItemsCount } = useCart();
  const { settings } = useStore();
  const { customer, openAuthModal } = useCustomer();

  if (!isCartDrawerOpen) return null;

  const minOrder = parseInt(settings?.min_order_value || '0');
  const isBelowMinOrder = subtotal < minOrder;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-[#FFF8E8] border-b border-[#F5BD42]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#8C4A26]" />
            <h3 className="font-display font-extrabold text-xl text-[#4A2115]">
              Giỏ hàng của bạn
            </h3>
            <span className="bg-[#8C4A26] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItemsCount}
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 rounded-full text-gray-500 hover:bg-amber-200/50 hover:text-[#4A2115] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="text-6xl">🥖</span>
              <p className="text-gray-500 font-medium">Giỏ hàng của bạn đang trống</p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#F5BD42] text-[#4A2115] font-bold text-sm shadow-xs hover:bg-[#E5AC32] transition-colors"
              >
                Khám phá món ngay
              </button>
            </div>
          ) : (
            items.map(item => (
              <div 
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#FFF8E8]/50 border border-amber-200/80 flex gap-3 relative group"
              >
                <img
                  src={item.image_url || '/bami-saigon-store.jpg'}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-amber-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-sm text-[#4A2115] truncate">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.toppings && item.toppings.length > 0 && (
                    <div className="text-xs text-[#8C4A26] mt-0.5 line-clamp-1">
                      + {item.toppings.map(t => t.name).join(', ')}
                    </div>
                  )}

                  {item.note && (
                    <div className="text-[11px] text-gray-500 italic mt-0.5 truncate">
                      Ghi chú: {item.note}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-sm text-[#8C4A26]">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-white border border-amber-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-amber-100 rounded-md"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-[#4A2115]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-amber-100 rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#FFF8E8] border-t border-[#F5BD42]/40 space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="font-medium text-[#4A2115]">Tạm tính:</span>
              <span className="font-black text-xl text-[#8C4A26]">
                {subtotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {isBelowMinOrder && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
                ⚠️ Đơn hàng tối thiểu {minOrder.toLocaleString('vi-VN')}đ để đặt món.
              </p>
            )}

            {!customer ? (
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  openAuthModal('register');
                }}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-[#8C4A26] to-[#A8582C] hover:from-[#753A1B] hover:to-[#8C4A26] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#F5BD42]" />
                <span>Đăng nhập / Đăng ký để thanh toán</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onCheckout();
                }}
                disabled={isBelowMinOrder}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isBelowMinOrder
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#8C4A26] hover:bg-[#753A1B] text-white hover:shadow-xl cursor-pointer'
                }`}
              >
                <span>Tiến hành đặt hàng</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

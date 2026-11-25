import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Product, Topping } from '../types';
import { useCart } from '../context/CartContext';

interface DishDetailModalProps {
  product: Product | null;
  toppings: Topping[];
  onClose: () => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ product, toppings, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [note, setNote] = useState('');

  if (!product) return null;

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = product.price + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedToppings, note);
    onClose();
  };

  const isOutOfStock = !product.is_available;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-[#F5BD42]/30 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-56 sm:h-64 bg-amber-100 overflow-hidden shrink-0">
          <img
            src={product.image_url || '/bami-saigon-store.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors shadow-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-rose-600 text-white font-black text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                Hết hàng hôm nay
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Title & Price */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display font-extrabold text-2xl text-[#4A2115] leading-tight">
                {product.name}
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-black text-2xl text-[#8C4A26]">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {product.original_price.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
            {product.description && (
              <p className="text-sm text-[#4A2115]/80 mt-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Toppings Selection */}
          {toppings.length > 0 && !isOutOfStock && (
            <div className="space-y-3 pt-2 border-t border-amber-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#4A2115] uppercase tracking-wider">
                  Thêm nhân & topping hảo hạng:
                </span>
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  Tùy chọn
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {toppings.map(topping => {
                  const isChecked = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-[#8C4A26] bg-[#FFF8E8] text-[#4A2115] font-semibold shadow-xs' 
                          : 'border-amber-200/70 hover:border-amber-400 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-[#8C4A26] border-[#8C4A26] text-white' : 'border-gray-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs">{topping.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#8C4A26]">
                        +{topping.price.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Note */}
          {!isOutOfStock && (
            <div className="space-y-2 pt-2 border-t border-amber-100">
              <label className="block text-xs font-bold text-[#4A2115] uppercase tracking-wider">
                Ghi chú cho bếp (không cay, không rau, ít sốt...):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Không hành ngò, nhiều ớt, sốt riêng..."
                maxLength={100}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200 bg-[#FFF8E8]/50 focus:bg-white focus:outline-hidden focus:border-[#8C4A26] text-[#4A2115]"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#FFF8E8] border-t border-amber-200/60 shrink-0">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Món ăn này đã hết hàng trong ngày. Quý khách vui lòng chọn món khác.</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center bg-white border border-[#F5BD42] rounded-xl p-1 shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A2115] hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-base text-[#4A2115]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A2115] hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-4 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Thêm vào giỏ</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

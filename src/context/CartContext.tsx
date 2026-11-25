import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Topping } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, toppings: Topping[], note: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  discountAmount: number;
  setDiscountAmount: (amount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bami_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bami_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number, toppings: Topping[], note: string) => {
    // Generate unique ID based on product id, topping IDs sorted, and note
    const toppingIds = toppings.map(t => t.id).sort().join('-');
    const cartItemId = `${product.id}_${toppingIds}_${note.trim().toLowerCase()}`;

    const toppingsPrice = toppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = product.price + toppingsPrice;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          product_id: product.id,
          name: product.name,
          price: unitPrice,
          base_price: product.price,
          image_url: product.image_url,
          quantity,
          toppings,
          note
        };
        return [...prevItems, newItem];
      }
    });

    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode('');
    setDiscountAmount(0);
    localStorage.removeItem('bami_cart');
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItemsCount,
      subtotal,
      isCartDrawerOpen,
      setIsCartDrawerOpen,
      promoCode,
      setPromoCode,
      discountAmount,
      setDiscountAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

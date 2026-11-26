import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Store, CreditCard, Banknote, AlertCircle, Sparkles, Navigation, ExternalLink } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import { DeliveryMapPicker } from '../components/DeliveryMapPicker';
import confetti from 'canvas-confetti';

interface CheckoutPageProps {
  onBackToMenu: () => void;
  onOrderSuccess: (trackingToken: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToMenu, onOrderSuccess }) => {
  const { items, subtotal, clearCart, promoCode, setPromoCode, discountAmount, setDiscountAmount } = useCart();
  const { settings } = useStore();
  const { customer, openAuthModal } = useCustomer();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [customerName, setCustomerName] = useState(customer?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.default_address || '');
  const [addressNote, setAddressNote] = useState(customer?.default_address_note || '');

  useEffect(() => {
    if (customer) {
      if (!customerName) setCustomerName(customer.full_name || '');
      if (!customerPhone) setCustomerPhone(customer.phone || '');
      if (!address && customer.default_address) setAddress(customer.default_address);
      if (!addressNote && customer.default_address_note) setAddressNote(customer.default_address_note);
    }
  }, [customer]);
  
  // Distance-based map delivery state
  const storeLat = parseFloat(settings?.store_lat || '10.771971');
  const storeLng = parseFloat(settings?.store_lng || '106.692237');
  const storeAddress = settings?.address || '135 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
  const baseFee = parseInt(settings?.base_shipping_fee || '15000');
  const baseKm = parseFloat(settings?.base_shipping_km || '2');
  const feePerKm = parseInt(settings?.fee_per_km || '5000');
  const maxKm = parseFloat(settings?.max_delivery_km || '15');
  const freeKm = parseFloat(settings?.free_shipping_km || '0');
  const formulaDesc = settings?.shipping_formula_desc || '';

  const [customerLat, setCustomerLat] = useState<number>(storeLat + 0.012);
  const [customerLng, setCustomerLng] = useState<number>(storeLng + 0.012);
  const [distanceKm, setDistanceKm] = useState<number>(1.5);
  const [deliveryFee, setDeliveryFee] = useState<number>(baseFee);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);

  const [pickupTime, setPickupTime] = useState('Ngay khi chuẩn bị xong (khoảng 15-20 phút)');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');

  const [voucherInput, setVoucherInput] = useState(promoCode);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState(promoCode ? 'Đã áp dụng mã' : '');
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

  useEffect(() => {
    const custToken = localStorage.getItem('bami_customer_token');
    const headers: Record<string, string> = {};
    if (custToken) headers['Authorization'] = `Bearer ${custToken}`;

    fetch('/api/promotions', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Available vouchers for this customer
          setAvailableVouchers(data.filter(p => p.claim_status !== 'used'));
        }
      })
      .catch(() => {});
  }, [customer]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-payment flow state: after order created with transfer, show QR modal on this page
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<{
    order_code: string;
    tracking_token: string;
    total_amount: number;
  } | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const isBankTransferAllowed = settings?.allow_bank_transfer !== '0';

  useEffect(() => {
    if (!isBankTransferAllowed && paymentMethod === 'transfer') {
      setPaymentMethod('cod');
    }
  }, [isBankTransferAllowed, paymentMethod]);

  // Shipping fee logic: 0 for pickup, calculated by distance for delivery
  const actualDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + actualDeliveryFee);

  // Apply Voucher
  const handleApplyVoucher = async (customCode?: string) => {
    const targetCode = (customCode || voucherInput).trim();
    if (!targetCode) return;
    setVoucherError('');
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode, subtotal, customer_id: customer?.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error || 'Mã ưu đãi không hợp lệ');
        setDiscountAmount(0);
        setVoucherSuccess('');
      } else {
        setDiscountAmount(data.discount_amount);
        setPromoCode(data.code);
        setVoucherSuccess(`Áp dụng thành công: -${data.discount_amount.toLocaleString('vi-VN')}đ`);
      }
    } catch (e) {
      setVoucherError('Lỗi kiểm tra mã giảm giá');
    }
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customer) {
      setErrorMessage('Quý khách vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đặt hàng');
      openAuthModal('register');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Vui lòng nhập họ tên và số điện thoại nhận hàng');
      return;
    }

    if (orderType === 'delivery') {
      if (!address.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ giao hàng cụ thể hoặc chọn vị trí trên bản đồ');
        return;
      }
      if (isOutOfRange) {
        setErrorMessage(`Khoảng cách giao hàng (${distanceKm} km) vượt quá bán kính tối đa (${maxKm} km) của quán. Vui lòng chọn Nhận tại quán hoặc gọi hotline.`);
        return;
      }
    }

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng đang trống');
      return;
    }

    setIsSubmitting(true);

    // Prepare payload
    const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: orderType,
      address: orderType === 'delivery' ? address : null,
      address_note: orderType === 'delivery' ? addressNote : null,
      distance_km: orderType === 'delivery' ? distanceKm : null,
      customer_lat: orderType === 'delivery' ? customerLat : null,
      customer_lng: orderType === 'delivery' ? customerLng : null,
      pickup_time: orderType === 'pickup' ? pickupTime : null,
      order_note: orderNote,
      payment_method: paymentMethod,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        toppings: item.toppings.map(t => t.id),
        note: item.note
      })),
      promo_code: promoCode || null,
      idempotency_key: idempotencyKey,
      customer_id: customer?.id || null,
      is_prepaid: paymentMethod === 'transfer' ? 1 : 0
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi tạo đơn hàng');
        setIsSubmitting(false);
      } else {
        // If prepaid (transfer): show QR modal on this page, wait for payment confirmation
        if (data.is_pending_payment) {
          setPendingPaymentOrder({
            order_code: data.order_code,
            tracking_token: data.tracking_token,
            total_amount: data.total_amount,
          });
          setIsSubmitting(false);
          // Don't clearCart or navigate yet — wait for payment
        } else {
          // COD: immediately go to tracking
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
          clearCart();
          onOrderSuccess(data.tracking_token);
        }
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền mạng.');
      setIsSubmitting(false);
    }
  };

  // Bank transfer info
  const bankName = settings?.bank_name || 'Techcombank';
  const bankAccount = settings?.bank_account || '1903688899901';
  const bankOwner = settings?.bank_owner || 'BAMI SAI GON';
  const vietqrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${finalTotal}&addInfo=BAMI%20${customerPhone.replace(/\s+/g, '')}&accountName=${encodeURIComponent(bankOwner)}`;

  // Google Maps store directions URL
  const googleMapsStoreUrl = settings?.google_map_url || `https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLng}`;

  // SSE listener: When pendingPaymentOrder exists, listen for payment_received
  useEffect(() => {
    if (!pendingPaymentOrder) return;

    const eventSource = new EventSource('/api/orders/events');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'payment_received' && data.tracking_token === pendingPaymentOrder.tracking_token) {
          setPaymentConfirmed(true);
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          } catch (err) {}
          // After 2 seconds of celebration, navigate to tracking
          setTimeout(() => {
            clearCart();
            onOrderSuccess(pendingPaymentOrder.tracking_token);
          }, 2000);
        }
      } catch (err) {}
    };

    // Also poll every 8 seconds as fallback
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/prepay-info/${pendingPaymentOrder.tracking_token}`);
        const info = await res.json();
        if (info.payment_status === 'paid' || info.payment_status === 'verified') {
          setPaymentConfirmed(true);
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          } catch (err) {}
          setTimeout(() => {
            clearCart();
            onOrderSuccess(pendingPaymentOrder.tracking_token);
          }, 2000);
        }
      } catch (err) {}
    }, 8000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [pendingPaymentOrder]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#8C4A26] hover:text-[#753A1B] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại chọn món</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#4A2115]">
          Đặt Hàng Bami Sài Gòn
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {customer 
            ? `Xin chào ${customer.full_name}, bánh mì sẽ được nướng nóng giòn ngay sau khi xác nhận.` 
            : 'Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng.'}
        </p>
      </div>

      {!customer && (
        <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#8C4A26] text-[#F5BD42] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#4A2115]">
                Bạn chưa đăng nhập tài khoản
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Đăng ký tài khoản trong 30 giây để lưu địa chỉ, tích điểm và theo dõi đơn hàng.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-amber-300 text-[#4A2115] font-bold text-xs rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#8C4A26] text-white font-bold text-xs rounded-xl hover:bg-[#753A1B] shadow-sm transition-all cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Customer & Delivery Info */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Order Type Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-amber-200/80 grid grid-cols-2 gap-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                orderType === 'delivery'
                  ? 'bg-[#8C4A26] text-white shadow-md'
                  : 'text-gray-600 hover:bg-amber-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Giao tận nơi</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                orderType === 'pickup'
                  ? 'bg-[#8C4A26] text-white shadow-md'
                  : 'text-gray-600 hover:bg-amber-50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Nhận tại quán</span>
            </button>
          </div>

          {/* Customer Info Form */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>Thông tin khách hàng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ví dụ: 0908 123 456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>
            </div>

            {orderType === 'delivery' ? (
              <div className="space-y-4 pt-2">
                <div className="border-t border-amber-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#4A2115]">
                      🗺️ Chọn vị trí giao hàng & Tính phí tự động
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Bấm lên bản đồ hoặc kéo ghim đỏ
                    </span>
                  </div>

                  {/* Interactive Map Picker with distance calculation */}
                  <DeliveryMapPicker
                    storeLat={storeLat}
                    storeLng={storeLng}
                    storeAddress={storeAddress}
                    baseFee={baseFee}
                    baseKm={baseKm}
                    feePerKm={feePerKm}
                    maxKm={maxKm}
                    freeKm={freeKm}
                    formulaDesc={formulaDesc}
                    initialLat={customerLat}
                    initialLng={customerLng}
                    onLocationChange={({ lat, lng, distanceKm, shippingFee, suggestedAddress, isOutOfRange }) => {
                      setCustomerLat(lat);
                      setCustomerLng(lng);
                      setDistanceKm(distanceKm);
                      setDeliveryFee(shippingFee);
                      setIsOutOfRange(isOutOfRange);
                      if (suggestedAddress && !address) {
                        setAddress(suggestedAddress);
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">
                    Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà, lầu...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: 45 Lê Duẩn, Tòa nhà Diamond Plaza, Lầu 3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">
                    Ghi chú hướng dẫn giao hàng (nếu có)
                  </label>
                  <input
                    type="text"
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    placeholder="Ví dụ: Gọi trước khi đến, gửi bảo vệ lầu 1..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">
                    Thời gian bạn ghé nhận bánh
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                  >
                    <option value="Ngay khi chuẩn bị xong (khoảng 15-20 phút)">Ngay khi chuẩn bị xong (khoảng 15-20 phút)</option>
                    <option value="Sau 30 phút">Sau 30 phút</option>
                    <option value="Sau 45 phút">Sau 45 phút</option>
                    <option value="Sau 1 tiếng">Sau 1 tiếng</option>
                  </select>
                </div>

                {/* Store Location & Google Maps Card */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8C4A26] text-white flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xs text-[#4A2115]">Địa chỉ quán Bami Sài Gòn:</p>
                      <p className="text-xs text-gray-700 font-medium mt-0.5">{storeAddress}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Giờ mở cửa: 06:00 - 22:00 hàng ngày</p>
                    </div>
                  </div>

                  <a
                    href={googleMapsStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-amber-100 text-[#8C4A26] font-bold text-xs border border-amber-300 shadow-2xs transition-all"
                  >
                    <Navigation className="w-4 h-4 text-[#8C4A26]" />
                    <span>Mở Google Maps chỉ đường đến quán →</span>
                  </a>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">
                Ghi chú chung cho đơn hàng
              </label>
              <textarea
                rows={2}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ghi chú thêm cho quán (nếu có)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
              Phương thức thanh toán
            </h3>

            <div className="space-y-3">
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-[#8C4A26] bg-[#FFF8E8]' : 'border-amber-200/80 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-[#8C4A26] focus:ring-[#8C4A26]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#8C4A26]" />
                    <span className="font-bold text-sm text-[#4A2115]">
                      {orderType === 'delivery' ? 'Tiền mặt khi nhận hàng (COD)' : 'Thanh toán tiền mặt tại quầy'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thanh toán trực tiếp cho shipper hoặc thu ngân khi nhận bánh.
                  </p>
                </div>
              </label>

              {isBankTransferAllowed && (
                <label 
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'transfer' ? 'border-[#8C4A26] bg-[#FFF8E8]' : 'border-amber-200/80 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="mt-1 text-[#8C4A26] focus:ring-[#8C4A26]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#8C4A26]" />
                      <span className="font-bold text-sm text-[#4A2115]">
                        Chuyển khoản VietQR (Thanh toán trước — Shipper không thu tiền)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quét mã QR qua ứng dụng ngân hàng. Hệ thống tự động nhận diện đã thanh toán, shipper sẽ giao bánh mà không thu tiền mặt.
                    </p>

                    {/* VietQR Dynamic Preview */}
                    {paymentMethod === 'transfer' && (
                      <div className="mt-4 p-4 rounded-xl bg-white border border-amber-300 space-y-3">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <img
                            src={vietqrUrl}
                            alt="VietQR Chuyển khoản Bami Sài Gòn"
                            className="w-36 h-36 rounded-lg object-contain border border-gray-200"
                          />
                          <div className="text-xs space-y-1 text-gray-700">
                            <p><strong>Ngân hàng:</strong> {bankName}</p>
                            <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-[#8C4A26]">{bankAccount}</span></p>
                            <p><strong>Chủ tài khoản:</strong> {bankOwner}</p>
                            <p><strong>Số tiền:</strong> {finalTotal.toLocaleString('vi-VN')}đ</p>
                            <p><strong>Nội dung:</strong> BAMI {customerPhone || 'SĐT'}</p>
                          </div>
                        </div>
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                          ⚠️ Lưu ý: Quý khách có thể quét mã chuyển tiền ngay hoặc sau khi gửi đơn. Quán sẽ kiểm tra tài khoản trước khi làm bánh.
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Review */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-5 sticky top-24">
            <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
              Chi tiết đơn hàng ({items.length} món)
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-b border-gray-100 pb-2.5">
                  <div className="flex-1">
                    <p className="font-bold text-[#4A2115]">
                      {item.quantity}x {item.name}
                    </p>
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-amber-800 mt-0.5">
                        + {item.toppings.map(t => t.name).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-gray-400 italic mt-0.5">
                        Ghi chú: {item.note}
                      </p>
                    )}
                  </div>
                  <span className="font-black text-[#8C4A26]">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher input */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#4A2115]">
                  Mã giảm giá / Voucher (Mỗi khách 1 lần)
                </label>
              </div>

              {/* Danh sách voucher chờ sử dụng */}
              {availableVouchers.length > 0 && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5">
                  <span className="text-[11px] font-black text-[#8C4A26] block">
                    ⚡ Voucher chờ bạn sử dụng (Chạm để áp dụng ngay):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableVouchers.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVoucherInput(v.code);
                          handleApplyVoucher(v.code);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-left text-[11px] font-medium border transition-all cursor-pointer ${
                          voucherInput === v.code
                            ? 'bg-[#8C4A26] text-white border-[#8C4A26] shadow-xs'
                            : 'bg-white hover:bg-amber-100 text-[#4A2115] border-amber-200'
                        }`}
                      >
                        <span className="font-mono font-black">{v.code}</span>
                        <span className="ml-1 opacity-90">
                          {v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${v.discount_value.toLocaleString('vi-VN')}đ`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã ưu đãi..."
                  className="flex-1 px-3 py-2 rounded-xl border border-amber-200 text-xs font-mono font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleApplyVoucher()}
                  className="px-4 py-2 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] font-black rounded-xl text-xs cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              {voucherError && <p className="text-xs text-rose-600 mt-1">{voucherError}</p>}
              {voucherSuccess && <p className="text-xs text-emerald-600 font-semibold mt-1">✓ {voucherSuccess}</p>}
            </div>

            {/* Calculation rows */}
            <div className="space-y-2 text-sm border-t border-amber-100 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({items.reduce((s, it) => s + it.quantity, 0)} bánh):</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá voucher:</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng:</span>
                <span>
                  {orderType === 'pickup' ? (
                    <span className="text-emerald-700 font-medium">Miễn phí (Nhận tại quán)</span>
                  ) : deliveryFee === 0 ? (
                    <span className="font-semibold text-emerald-700">
                      Miễn phí giao hàng (0đ)
                      <span className="text-[11px] text-gray-500 font-normal ml-1">({distanceKm} km)</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-[#8C4A26]">
                      {deliveryFee.toLocaleString('vi-VN')}đ
                      <span className="text-[11px] text-gray-500 font-normal ml-1">({distanceKm} km)</span>
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-lg font-black text-[#4A2115] border-t border-amber-200 pt-3">
                <span>Tổng thanh toán:</span>
                <span className="text-2xl text-[#8C4A26]">{finalTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Error box */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Out of range alert */}
            {orderType === 'delivery' && isOutOfRange && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Vượt quá bán kính giao hàng ({maxKm} km)</p>
                  <p className="text-[11px] mt-0.5">Vị trí đã chọn cách quán {distanceKm} km. Vui lòng chuyển sang "Nhận tại quán" hoặc liên hệ hotline để được hỗ trợ giao đặc biệt.</p>
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0 || (orderType === 'delivery' && isOutOfRange)}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl transition-all cursor-pointer ${
                isSubmitting || (orderType === 'delivery' && isOutOfRange)
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#8C4A26] hover:bg-[#753A1B] text-white hover:shadow-2xl'
              }`}
            >
              {isSubmitting ? 'Đang gửi đơn hàng...' : 'Xác nhận gửi đơn đặt bánh'}
            </button>

            <p className="text-[11px] text-gray-500 text-center leading-tight">
              Quý khách gửi đơn không đồng nghĩa quán đã nhận làm. Nhân viên sẽ liên hệ xác nhận trong ít phút.
            </p>
          </div>
        </div>

      </form>

      {/* 💳 PREPAY WAITING MODAL — Shown after order is created with transfer method */}
      {pendingPaymentOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-amber-200 relative animate-in zoom-in-95 duration-200">
            
            {paymentConfirmed ? (
              /* ✅ Payment Confirmed - Celebration */
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-black text-2xl text-emerald-700">
                    Thanh Toán Thành Công! 🎉
                  </h3>
                  <p className="text-sm text-gray-600">
                    Đơn hàng <strong className="text-[#8C4A26]">#{pendingPaymentOrder.order_code}</strong> đã được xác nhận.
                  </p>
                  <p className="text-xs text-gray-500">
                    Đang chuyển đến trang theo dõi đơn hàng...
                  </p>
                </div>
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              /* ⏳ Waiting for Payment */
              <>
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8C4A26] bg-amber-100 px-3 py-1 rounded-full inline-block">
                    ⏳ Chờ thanh toán
                  </span>
                  <h3 className="font-display font-black text-xl text-[#4A2115]">
                    Quét Mã VietQR Để Xác Nhận Đơn
                  </h3>
                  <p className="text-xs text-gray-500">
                    Đơn #{pendingPaymentOrder.order_code} • Số tiền: <strong className="text-[#8C4A26]">{pendingPaymentOrder.total_amount.toLocaleString('vi-VN')}đ</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <img
                    src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${pendingPaymentOrder.total_amount}&addInfo=BAMI%20${pendingPaymentOrder.order_code}&accountName=${encodeURIComponent(bankOwner)}`}
                    alt={`VietQR đơn hàng ${pendingPaymentOrder.order_code}`}
                    className="w-52 h-52 rounded-xl object-contain border border-gray-200 shadow-sm bg-white p-1"
                  />

                  <div className="text-xs space-y-1 text-center text-gray-700">
                    <p><strong>Ngân hàng:</strong> {bankName}</p>
                    <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-[#8C4A26]">{bankAccount}</span></p>
                    <p><strong>Chủ tài khoản:</strong> {bankOwner}</p>
                    <p><strong>Nội dung CK:</strong> <span className="font-mono font-bold bg-amber-100 px-2 py-0.5 rounded text-[#4A2115]">BAMI {pendingPaymentOrder.order_code}</span></p>
                  </div>
                </div>

                {/* Pulsing waiting indicator */}
                <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-blue-800 font-medium">
                    Đang chờ xác nhận thanh toán từ ngân hàng... Trang sẽ tự động cập nhật.
                  </p>
                </div>

                <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-900 leading-relaxed text-center">
                  💡 <strong>Lưu ý:</strong> Đơn hàng sẽ <strong>chỉ được tiếp nhận sau khi thanh toán thành công</strong>. Hãy quét mã QR bằng ứng dụng ngân hàng để hoàn tất.
                </div>

                <button
                  onClick={() => {
                    // Allow user to cancel and go back (order stays pending_payment in DB)
                    setPendingPaymentOrder(null);
                    setPaymentConfirmed(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  ← Quay lại chỉnh sửa đơn hàng
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

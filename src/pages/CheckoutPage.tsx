import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Store, CreditCard, Banknote, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';

interface CheckoutPageProps {
  onBackToMenu: () => void;
  onOrderSuccess: (trackingToken: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToMenu, onOrderSuccess }) => {
  const { items, subtotal, clearCart, promoCode, setPromoCode, discountAmount, setDiscountAmount } = useCart();
  const { settings, zones } = useStore();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>(zones.length > 0 ? zones[0].id : '');
  const [pickupTime, setPickupTime] = useState('Ngay khi quán chuẩn bị xong (khoảng 15-20 phút)');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');

  const [voucherInput, setVoucherInput] = useState(promoCode);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState(promoCode ? 'Đã áp dụng mã' : '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected delivery zone details
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Apply Voucher
  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherError('');
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherInput.trim(), subtotal })
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

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Vui lòng nhập họ tên và số điện thoại nhận hàng');
      return;
    }

    if (orderType === 'delivery' && !address.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ giao hàng cụ thể');
      return;
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
      delivery_zone_id: orderType === 'delivery' ? selectedZoneId : null,
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
      idempotency_key: idempotencyKey
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
        // Trigger celebratory confetti
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        clearCart();
        onOrderSuccess(data.tracking_token);
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
          Không cần tạo tài khoản. Bánh mì sẽ được nướng nóng ngay sau khi quán xác nhận.
        </p>
      </div>

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
            <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
              Thông tin người nhận
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
              <>
                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">
                    Khu vực giao hàng *
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.zone_name} (Phí: {z.fee.toLocaleString('vi-VN')}đ)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">
                    Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) *
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
              </>
            ) : (
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
                <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl mt-2">
                  📍 Địa chỉ nhận bánh: <strong>{settings?.address || '135 Nguyễn Thị Minh Khai, Q.1, TP.HCM'}</strong>
                </p>
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
                      Chuyển khoản VietQR (Ngân hàng)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Quét mã QR qua ứng dụng ngân hàng. Chủ quán sẽ kiểm tra và xác nhận biên lai.
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
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#4A2115] mb-1">
                Mã giảm giá / Voucher
              </label>
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
                  onClick={handleApplyVoucher}
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
                  ) : (
                    `${deliveryFee.toLocaleString('vi-VN')}đ`
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

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl transition-all cursor-pointer ${
                isSubmitting 
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
    </div>
  );
};

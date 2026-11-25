import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Phone, MessageCircle, AlertCircle, Copy, Check, ArrowRight, ShieldAlert, Navigation, ExternalLink, CreditCard, Sparkles, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';

interface OrderTrackingPageProps {
  trackingToken: string;
  onGoHome: () => void;
  onGoMenu: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ trackingToken, onGoHome, onGoMenu }) => {
  const { settings } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const [showPrepayModal, setShowPrepayModal] = useState(false);

  const fetchOrder = () => {
    fetch(`/api/orders/track/${trackingToken}`)
      .then(res => {
        if (!res.ok) throw new Error('Không tìm thấy đơn hàng');
        return res.json();
      })
      .then(data => {
        setOrder(data.order);
        setError('');
      })
      .catch(err => {
        setError('Không tìm thấy đơn hàng hoặc mã theo dõi không hợp lệ.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds for live status update
    const interval = setInterval(fetchOrder, 10000);

    // Also listen to Real-time SSE for instant status or auto-payment confirmation
    const eventSource = new EventSource('/api/orders/events');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'payment_received' && data.tracking_token === trackingToken) {
          fetchOrder();
          setShowPrepayModal(false);
          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch (err) {}
        } else if (data.type === 'order_status_updated') {
          fetchOrder();
        }
      } catch (err) {}
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, [trackingToken]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#8C4A26] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 font-medium">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-[#4A2115]">Không Tìm Thấy Đơn Hàng</h2>
        <p className="text-sm text-gray-600">{error || 'Đường dẫn theo dõi không chính xác hoặc đã hết hạn.'}</p>
        <button
          onClick={onGoHome}
          className="px-6 py-2.5 bg-[#8C4A26] text-white font-bold rounded-xl text-sm cursor-pointer"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'new', label: 'Chờ xác nhận', desc: 'Quán đã nhận đơn' },
    { key: 'confirmed', label: 'Đã xác nhận', desc: 'Chuẩn bị nướng bánh' },
    { key: 'preparing', label: 'Đang làm bánh', desc: 'Nóng giòn tại lò' },
    { key: 'delivering', label: order.order_type === 'pickup' ? 'Chờ bạn nhận' : 'Đang giao hàng', desc: order.order_type === 'pickup' ? 'Bánh đã sẵn sàng' : 'Shipper đang trên đường' },
    { key: 'completed', label: 'Hoàn thành', desc: 'Chúc bạn ngon miệng!' },
  ];

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['new', 'confirmed', 'preparing', 'delivering', 'completed'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'pending_payment') return 'pending'; // All steps pending if waiting for payment
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  const phone = settings?.phone || '0908 123 456';
  const zalo = settings?.zalo || '0908 123 456';

  // Bank transfer info for Pre-payment
  const bankName = settings?.bank_name || 'Techcombank';
  const bankAccount = settings?.bank_account || '1903688899901';
  const bankOwner = settings?.bank_owner || 'BAMI SAI GON';
  const vietqrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${order.total_amount}&addInfo=BAMI%20${order.order_code}&accountName=${encodeURIComponent(bankOwner)}`;

  const isPaid = order.payment_status === 'paid' || order.payment_status === 'verified';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Success Hero Header */}
      <div className="text-center space-y-3">
        {order.status === 'pending_payment' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-9 h-9 animate-pulse" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-800 uppercase">
              ⏳ Chờ thanh toán
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
              Mã đơn hàng: <span className="text-[#8C4A26]">#{order.order_code}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Đơn hàng đang chờ bạn thanh toán qua chuyển khoản. Sau khi thanh toán, quán sẽ bắt đầu làm bánh.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-[#FFF8E8] border border-[#F5BD42] text-xs font-black text-[#8C4A26] uppercase">
              Đặt đơn thành công
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
              Mã đơn hàng: <span className="text-[#8C4A26]">#{order.order_code}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Cảm ơn quý khách <strong>{order.customer_name}</strong> đã đặt bánh tại Bami Sài Gòn.
            </p>
          </>
        )}

        {/* Share tracking link button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#4A2115] text-xs font-bold transition-all border border-amber-200 cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
            <span>{isCopied ? 'Đã sao chép liên kết theo dõi!' : 'Sao chép link theo dõi đơn'}</span>
          </button>
        </div>
      </div>

      {/* 🌟 PREPAY / PAID BANNER (Key Feature) */}
      {order.status === 'pending_payment' ? (
        /* ⚠️ Payment Required Banner */
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-2 border-orange-300 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full inline-block animate-pulse">
                ⚠️ Chưa thanh toán — Đơn hàng chưa được tiếp nhận
              </span>
              <h4 className="font-bold text-base text-[#4A2115]">
                Vui lòng thanh toán để xác nhận đơn hàng
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed max-w-lg">
                Quán sẽ chỉ bắt đầu làm bánh <strong>sau khi nhận được tiền chuyển khoản</strong>. Hãy quét mã VietQR bên dưới để hoàn tất thanh toán.
              </p>
            </div>

            <button
              onClick={() => setShowPrepayModal(true)}
              className="px-5 py-3 rounded-2xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2 animate-pulse"
            >
              <CreditCard className="w-4 h-4 text-[#F5BD42]" />
              <span>Quét mã VietQR thanh toán ngay →</span>
            </button>
          </div>

          {/* Pulsing waiting indicator */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-blue-800 font-medium">
              Đang chờ xác nhận thanh toán từ ngân hàng... Trang sẽ tự động cập nhật khi nhận được tiền.
            </p>
          </div>
        </div>
      ) : isPaid ? (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
              ✓ Đã Thanh Toán Trước
            </span>
            <h4 className="font-bold text-base text-emerald-900">
              Đơn hàng đã được thanh toán thành công ({order.total_amount.toLocaleString('vi-VN')}đ)
            </h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Hệ thống đã tự động đối soát tiền chuyển khoản. Shipper sẽ giao bánh tới tận tay bạn mà <strong>không thu thêm tiền mặt</strong>!
            </p>
          </div>
        </div>
      ) : order.status !== 'cancelled' ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-[#FFF8E8] to-orange-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#8C4A26] bg-[#F5BD42]/40 px-2.5 py-0.5 rounded-full inline-block">
                💳 Thanh toán linh hoạt
              </span>
              <h4 className="font-bold text-base text-[#4A2115]">
                Bạn muốn thanh toán trước qua Ngân hàng?
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed max-w-lg">
                Quét mã VietQR chuyển khoản trước để shipper giao bánh tới cửa mà bạn không cần phải chuẩn bị tiền lẻ hoặc tiếp xúc tiền mặt.
              </p>
            </div>

            <button
              onClick={() => setShowPrepayModal(true)}
              className="px-5 py-3 rounded-2xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-[#F5BD42]" />
              <span>Quét mã VietQR ngay →</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Live Status Progress Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-3 flex items-center justify-between">
          <span>Tiến độ xử lý đơn hàng</span>
          <span className="text-xs font-normal text-gray-500">Cập nhật tự động thời gian thực</span>
        </h3>

        {order.status === 'cancelled' ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
            <p className="font-black text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Đơn hàng này đã bị hủy
            </p>
            <p className="text-sm">Lý do: {order.cancel_reason || 'Không rõ lý do'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {steps.map(step => {
              const status = getStepStatus(step.key);
              return (
                <div 
                  key={step.key} 
                  className={`p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                    status === 'current' 
                      ? 'border-[#8C4A26] bg-[#FFF8E8] shadow-sm ring-2 ring-[#F5BD42]' 
                      : status === 'done' 
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900' 
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 ${
                    status === 'current' 
                      ? 'bg-[#8C4A26] text-white animate-bounce' 
                      : status === 'done' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {status === 'done' ? '✓' : ''}
                  </div>
                  <span className="font-bold text-xs">{step.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-80">{step.desc}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Info & Line Items */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-3">
          Thông tin chi tiết
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-500">Hình thức nhận bánh:</p>
            <p className="font-bold text-sm text-[#4A2115] mt-0.5">
              {order.order_type === 'pickup' ? '🏪 Nhận tại quán' : '🛵 Giao tận nơi'}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Số điện thoại:</p>
            <p className="font-bold text-sm text-[#4A2115] mt-0.5">{order.customer_phone}</p>
          </div>

          {order.order_type === 'delivery' && (
            <div className="sm:col-span-2 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-gray-500">Địa chỉ giao bánh:</p>
                {order.distance_km && (
                  <span className="text-[11px] font-bold text-[#8C4A26] bg-amber-100 px-2 py-0.5 rounded-md">
                    Cách quán: {order.distance_km} km
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-[#4A2115] mt-0.5">{order.address}</p>
              {order.address_note && (
                <p className="text-gray-500 italic text-xs">Chỉ dẫn: {order.address_note}</p>
              )}
            </div>
          )}

          {order.order_type === 'pickup' && (
            <div className="sm:col-span-2 space-y-2">
              <div>
                <p className="text-gray-500">Thời gian nhận dự kiến:</p>
                <p className="font-bold text-sm text-[#4A2115] mt-0.5">{order.pickup_time}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-[#4A2115]">Địa chỉ nhận tại quán:</span>
                  <p className="text-gray-600">{settings?.address || '135 Nguyễn Thị Minh Khai, Q.1, TP.HCM'}</p>
                </div>
                <a
                  href={settings?.google_map_url || `https://www.google.com/maps/dir/?api=1&destination=${settings?.store_lat || '10.771971'},${settings?.store_lng || '106.692237'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C4A26] text-white font-bold text-xs shrink-0 self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#F5BD42]" />
                  <span>Chỉ đường Google Maps</span>
                </a>
              </div>
            </div>
          )}

          <div>
            <p className="text-gray-500">Phương thức thanh toán:</p>
            <p className="font-bold text-sm text-[#4A2115] mt-0.5">
              {order.payment_method === 'transfer' || order.is_prepaid ? 'Chuyển khoản VietQR' : 'Tiền mặt khi nhận'}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Trạng thái thanh toán:</p>
            <p className="font-bold text-sm mt-0.5">
              {isPaid ? (
                <span className="text-emerald-700">✓ Đã thanh toán trước (0đ COD)</span>
              ) : (
                <span className="text-amber-800">Chưa thanh toán (Thanh toán khi nhận)</span>
              )}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="border-t border-amber-100 pt-4 space-y-3">
          <p className="font-bold text-xs uppercase tracking-wider text-gray-500">
            Danh sách bánh đã đặt:
          </p>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-100 pb-2">
              <div>
                <p className="font-bold text-[#4A2115]">
                  {item.quantity}x {item.product_name}
                </p>
                {item.toppings && item.toppings.length > 0 && (
                  <p className="text-amber-800 mt-0.5">+ {item.toppings.map((t: any) => t.name).join(', ')}</p>
                )}
                {item.note && <p className="text-gray-400 italic mt-0.5">Ghi chú: {item.note}</p>}
              </div>
              <span className="font-bold text-[#8C4A26]">{item.subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-amber-100 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính:</span>
            <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Giảm giá voucher:</span>
              <span>-{order.discount_amount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Phí giao hàng:</span>
            <span>{order.delivery_fee.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-base font-black text-[#4A2115] border-t border-amber-200 pt-2">
            <span>Tổng thanh toán:</span>
            <span className="text-xl text-[#8C4A26]">{order.total_amount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* Quick Action Footer: Call, Zalo, Order more */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>Gọi Hotline Quán ({phone})</span>
        </a>

        <a
          href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Nhắn tin Zalo với Quán</span>
        </a>

        <button
          onClick={onGoMenu}
          className="w-full sm:w-auto px-6 py-3.5 bg-white border-2 border-[#8C4A26] text-[#8C4A26] hover:bg-amber-50 font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Đặt thêm món khác</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 💳 PRE-PAY VIETQR MODAL */}
      {showPrepayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-amber-200 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowPrepayModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-2xl">⚡</span>
              <h3 className="font-display font-black text-xl text-[#4A2115]">
                Quét Mã VietQR Thanh Toán Trước
              </h3>
              <p className="text-xs text-gray-500">
                Đơn #{order.order_code} • Số tiền: <strong className="text-[#8C4A26]">{order.total_amount.toLocaleString('vi-VN')}đ</strong>
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
              <img
                src={vietqrUrl}
                alt={`VietQR đơn hàng ${order.order_code}`}
                className="w-48 h-48 rounded-xl object-contain border border-gray-200 shadow-sm bg-white p-1"
              />

              <div className="text-xs space-y-1 text-center text-gray-700">
                <p><strong>Ngân hàng:</strong> {bankName}</p>
                <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-[#8C4A26]">{bankAccount}</span></p>
                <p><strong>Chủ tài khoản:</strong> {bankOwner}</p>
                <p><strong>Nội dung CK:</strong> <span className="font-mono font-bold bg-amber-100 px-2 py-0.5 rounded text-[#4A2115]">BAMI {order.order_code}</span></p>
              </div>
            </div>

            <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-900 leading-relaxed text-center">
              💡 <strong>Hệ thống tự động:</strong> Sau khi bạn chuyển khoản thành công, màn hình này sẽ tự động cập nhật sang <strong>"Đã thanh toán trước"</strong> trong vài giây mà không cần bấm thêm gì!
            </div>

            <button
              onClick={() => setShowPrepayModal(false)}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
            >
              Đóng cửa sổ này
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

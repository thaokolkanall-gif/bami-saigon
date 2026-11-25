import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Phone, MessageCircle, AlertCircle, Copy, Check, ArrowRight, ShieldAlert, Navigation, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext';

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
    return () => clearInterval(interval);
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
          className="px-6 py-2.5 bg-[#8C4A26] text-white font-bold rounded-xl text-sm"
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
    { key: 'delivering', label: order.order_type === 'pickup' ? 'Sẵn sàng nhận' : 'Đang giao hàng', desc: order.order_type === 'pickup' ? 'Mời ghé quán nhận' : 'Shipper đang trên đường' },
    { key: 'completed', label: 'Hoàn thành', desc: 'Chúc ngon miệng!' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (order.status === 'cancelled') return 'cancelled';
    const statusOrder = ['new', 'confirmed', 'preparing', 'delivering', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const phone = settings?.phone || '0908 123 456';
  const zalo = settings?.zalo || '0908 123 456';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-md text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
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

      {/* Live Status Progress Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-3 flex items-center justify-between">
          <span>Tiến độ xử lý đơn hàng</span>
          <span className="text-xs font-normal text-gray-500">Tự động cập nhật mỗi 10s</span>
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
              {order.payment_method === 'transfer' ? 'Chuyển khoản VietQR' : 'Tiền mặt khi nhận'}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Trạng thái thanh toán:</p>
            <p className="font-bold text-sm mt-0.5">
              {order.payment_status === 'paid' || order.payment_status === 'verified' ? (
                <span className="text-emerald-700">✓ Đã thanh toán / Đã đối soát</span>
              ) : (
                <span className="text-amber-800">Chưa thanh toán (Chờ quán đối soát)</span>
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
          className="w-full sm:w-auto px-6 py-3.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4" />
          <span>Gọi hotline quán: {phone}</span>
        </a>

        {zalo && (
          <a
            href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Mở Zalo quán</span>
          </a>
        )}

        <button
          onClick={onGoMenu}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-amber-50 text-[#4A2115] border border-[#F5BD42] font-bold rounded-xl text-sm shadow-xs"
        >
          Đặt thêm món khác
        </button>
      </div>

    </div>
  );
};

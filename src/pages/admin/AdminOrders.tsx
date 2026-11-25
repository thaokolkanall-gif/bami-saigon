import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, MapPin, CheckCircle2, Clock, XCircle, AlertCircle, FileText, Printer, Check, Navigation, ExternalLink } from 'lucide-react';
import { Order } from '../../types';

interface AdminOrdersProps {
  initialStatusFilter?: string;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ initialStatusFilter = 'all' }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = () => {
    const token = localStorage.getItem('bami_token');
    let url = `/api/orders/admin/list?status=${statusFilter}&order_type=${orderTypeFilter}`;
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
      })
      .catch(err => console.error('Error fetching orders:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [statusFilter, orderTypeFilter, searchQuery]);

  // Update Status Workflow
  const handleUpdateStatus = async (orderId: number, nextStatus: string, note?: string) => {
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus, note })
      });

      if (res.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: nextStatus as any } : null);
        }
      }
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  // Update Payment Status
  const handleUpdatePayment = async (orderId: number, paymentStatus: string) => {
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/orders/admin/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: paymentStatus })
      });

      if (res.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, payment_status: paymentStatus as any } : null);
        }
      }
    } catch (e) {
      console.error('Failed to update payment status:', e);
    }
  };

  // Submit Cancel Order
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) return;
    setIsCancelling(true);
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch(`/api/orders/admin/${cancelModalOrder.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cancel_reason: cancelReason.trim() })
      });

      if (res.ok) {
        setCancelModalOrder(null);
        setCancelReason('');
        fetchOrders();
        if (selectedOrder && selectedOrder.id === cancelModalOrder.id) {
          setSelectedOrder(null);
        }
      }
    } catch (e) {
      console.error('Failed to cancel order:', e);
    } finally {
      setIsCancelling(false);
    }
  };

  // Print slip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi, xác nhận, chuyển bếp và đối soát thanh toán đơn bánh mì.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-[#8C4A26] hover:bg-amber-50 cursor-pointer shadow-2xs self-start"
        >
          🔄 Làm mới dữ liệu
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (#BM...), SĐT, tên khách..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-amber-200 focus:outline-hidden focus:border-[#8C4A26]"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-amber-200 bg-white font-semibold text-[#4A2115]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="new">🔴 Đơn mới (Cần duyệt)</option>
          <option value="confirmed">🔵 Đã xác nhận</option>
          <option value="preparing">🟡 Đang làm bánh</option>
          <option value="delivering">🟣 Đang giao / Chờ nhận</option>
          <option value="completed">🟢 Hoàn thành</option>
          <option value="cancelled">⚪ Đã hủy</option>
        </select>

        {/* Order Type Filter */}
        <select
          value={orderTypeFilter}
          onChange={(e) => setOrderTypeFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-amber-200 bg-white font-semibold text-[#4A2115]"
        >
          <option value="all">Tất cả hình thức</option>
          <option value="delivery">🛵 Giao tận nơi</option>
          <option value="pickup">🏪 Nhận tại quán</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-400">Đang tải danh sách đơn...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">Không có đơn hàng nào phù hợp với bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF8E8] text-[#4A2115] font-bold border-b border-amber-200/60">
                <tr>
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Món đã chọn</th>
                  <th className="py-3 px-3">Tổng tiền</th>
                  <th className="py-3 px-3">Thanh toán</th>
                  <th className="py-3 px-3">Trạng thái xử lý</th>
                  <th className="py-3 px-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr 
                    key={order.id} 
                    className={`hover:bg-amber-50/50 transition-colors cursor-pointer ${
                      order.status === 'new' ? 'bg-rose-50/40' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#8C4A26]">
                      #{order.order_code}
                      {order.status === 'new' && (
                        <span className="block text-[9px] text-rose-600 font-black animate-pulse">MỚI</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-[#4A2115]">{order.customer_name}</div>
                      <a 
                        href={`tel:${order.customer_phone.replace(/\s+/g, '')}`} 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-[11px] text-[#8C4A26] font-semibold hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </a>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="line-clamp-2 text-gray-700">
                        {order.items?.map(it => `${it.quantity}x ${it.product_name}`).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-black text-[#8C4A26] text-sm whitespace-nowrap">
                      {order.total_amount.toLocaleString('vi-VN')}đ
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        {order.is_prepaid || order.payment_status === 'paid' || order.payment_status === 'verified' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block">
                            ✓ Đã trả trước (0đ COD)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-block">
                            Chưa thu ({order.payment_method === 'transfer' ? 'Chuyển khoản' : 'COD'})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {order.payment_method === 'transfer' || order.is_prepaid ? 'Chuyển khoản VietQR' : 'Tiền mặt khi giao'}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        order.status === 'new' ? 'bg-rose-100 text-rose-700' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'delivering' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status === 'new' ? 'Chờ xác nhận' :
                         order.status === 'confirmed' ? 'Đã xác nhận' :
                         order.status === 'preparing' ? 'Đang làm bánh' :
                         order.status === 'delivering' ? 'Đang giao / Chờ nhận' :
                         order.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'new' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Xác nhận đơn
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="px-2.5 py-1 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-lg font-bold text-[11px]"
                          >
                            Vào bếp
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivering')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            {order.order_type === 'pickup' ? 'Sẵn sàng nhận' : 'Đi giao'}
                          </button>
                        )}
                        {order.status === 'delivering' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Hoàn thành
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-amber-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase text-[#8C4A26] bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Chi tiết đơn hàng
                </span>
                <h3 className="font-display font-black text-2xl text-[#4A2115] mt-1">
                  Đơn #{selectedOrder.order_code}
                </h3>
                <p className="text-xs text-gray-500">
                  Đặt lúc: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="In phiếu chế biến"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">In phiếu</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FFF8E8] p-4 rounded-2xl border border-amber-200/80">
              <div>
                <p className="text-gray-500">Khách hàng:</p>
                <p className="font-bold text-sm text-[#4A2115] mt-0.5">{selectedOrder.customer_name}</p>
                <a href={`tel:${selectedOrder.customer_phone}`} className="font-bold text-[#8C4A26] hover:underline block mt-0.5">
                  📞 {selectedOrder.customer_phone}
                </a>
              </div>

              <div>
                <p className="text-gray-500">Hình thức nhận:</p>
                <p className="font-bold text-sm text-[#4A2115] mt-0.5">
                  {selectedOrder.order_type === 'pickup' ? '🏪 Nhận tại quán' : '🛵 Giao tận nơi'}
                </p>
                {selectedOrder.pickup_time && (
                  <p className="text-gray-600 mt-0.5">Giờ nhận: {selectedOrder.pickup_time}</p>
                )}
              </div>

              {selectedOrder.order_type === 'delivery' && (
                <div className="sm:col-span-2 pt-2 border-t border-amber-200/60 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-gray-500">Địa chỉ giao hàng:</p>
                      <p className="font-bold text-sm text-[#4A2115] mt-0.5">{selectedOrder.address}</p>
                    </div>
                    {selectedOrder.distance_km && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-[#8C4A26] font-bold text-xs self-start sm:self-auto">
                        📍 Cách quán: {selectedOrder.distance_km} km
                      </span>
                    )}
                  </div>

                  {selectedOrder.address_note && (
                    <p className="text-gray-600 italic text-xs">Chỉ dẫn: {selectedOrder.address_note}</p>
                  )}

                  <div className="pt-1">
                    <a
                      href={
                        selectedOrder.customer_lat && selectedOrder.customer_lng
                          ? `https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.customer_lat},${selectedOrder.customer_lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.address || '')}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-xs shadow-2xs transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#F5BD42]" />
                      <span>Mở Google Maps dẫn đường giao hàng</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              )}

              {selectedOrder.order_note && (
                <div className="sm:col-span-2 pt-2 border-t border-amber-200/60">
                  <p className="text-gray-500">Ghi chú của khách:</p>
                  <p className="font-bold text-[#4A2115] mt-0.5">{selectedOrder.order_note}</p>
                </div>
              )}
            </div>

            {/* Shipper Payment Warning Banner */}
            {selectedOrder.is_prepaid || selectedOrder.payment_status === 'paid' || selectedOrder.payment_status === 'verified' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-2.5 shadow-2xs">
                <span className="text-xl">✅</span>
                <div>
                  <p className="uppercase tracking-wide font-black text-emerald-900">
                    ĐƠN HÀNG ĐÃ THANH TOÁN TRƯỚC 100%
                  </p>
                  <p className="text-[11px] font-normal text-emerald-800 mt-0.5">
                    Shipper giao bánh tới khách mà <strong>TUYỆT ĐỐI KHÔNG THU TIỀN MẶT</strong> (Thu hộ COD: 0đ).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-2.5">
                <span className="text-xl">💵</span>
                <div>
                  <p className="font-black text-amber-900">
                    THU TIỀN MẶT KHI GIAO (COD): {selectedOrder.total_amount.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-[11px] font-normal text-amber-800 mt-0.5">
                    Khách chưa thanh toán trước. Shipper vui lòng thu tiền mặt đầy đủ khi giao bánh.
                  </p>
                </div>
              </div>
            )}

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Danh sách bánh & đồ uống
              </h4>
              <div className="border border-amber-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-3 text-xs flex justify-between items-start">
                    <div>
                      <span className="font-bold text-[#4A2115] text-sm">
                        {item.quantity}x {item.product_name}
                      </span>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-[#8C4A26] mt-0.5 font-medium">
                          + {item.toppings.map((t: any) => t.name).join(', ')}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-gray-400 italic mt-0.5">Bếp lưu ý: {item.note}</p>
                      )}
                    </div>
                    <span className="font-black text-[#8C4A26] text-sm">
                      {item.subtotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-gray-600 border-t border-amber-100 pt-3">
              <div className="flex justify-between">
                <span>Tạm tính bánh:</span>
                <span>{selectedOrder.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Giảm giá:</span>
                  <span>-{selectedOrder.discount_amount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span>{selectedOrder.delivery_fee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-baseline text-base font-black text-[#4A2115] border-t border-amber-200 pt-2">
                <span>Tổng cộng:</span>
                <span className="text-xl text-[#8C4A26]">{selectedOrder.total_amount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Payment Verification Controls */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#4A2115]">Đối soát thanh toán:</span>
                <p className="text-gray-500 mt-0.5">
                  Hình thức: {selectedOrder.payment_method === 'transfer' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}
                </p>
              </div>

              <div className="flex gap-2">
                {selectedOrder.payment_status !== 'verified' && selectedOrder.payment_status !== 'paid' ? (
                  <button
                    onClick={() => handleUpdatePayment(selectedOrder.id, 'verified')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    ✓ Xác nhận đã thu tiền
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdatePayment(selectedOrder.id, 'unpaid')}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Đổi thành Chưa thu
                  </button>
                )}
              </div>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end">
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => setCancelModalOrder(selectedOrder)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs cursor-pointer mr-auto"
                >
                  Hủy đơn này
                </button>
              )}

              {selectedOrder.status === 'new' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                >
                  Xác nhận đơn hàng
                </button>
              )}

              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                  className="px-5 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold rounded-xl text-xs"
                >
                  Chuyển vào bếp nướng bánh
                </button>
              )}

              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'delivering')}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs"
                >
                  {selectedOrder.order_type === 'pickup' ? 'Báo bánh sẵn sàng nhận' : 'Giao cho shipper đi phát'}
                </button>
              )}

              {selectedOrder.status === 'delivering' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs"
                >
                  Hoàn thành đơn hàng
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order Modal with Mandatory Reason */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Xác nhận hủy đơn #{cancelModalOrder.order_code}</span>
            </h3>
            <p className="text-xs text-gray-600">
              Vui lòng nhập lý do hủy đơn bắt buộc để ghi nhận vào lịch sử đơn hàng.
            </p>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Khách đổi ý, Hết nguyên liệu, Khách không nghe máy..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setCancelModalOrder(null); setCancelReason(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:bg-gray-300 cursor-pointer"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

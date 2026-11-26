import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Phone, MapPin, Mail, ShoppingBag, Clock, Key, LogOut, CheckCircle2, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (token: string) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({ isOpen, onClose, onTrackOrder }) => {
  const { customer, token, logout, refreshProfile } = useCustomer();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'password'>('orders');

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Profile edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.full_name || '');
      setEmail(customer.email || '');
      setAddress(customer.default_address || '');
      setAddressNote(customer.default_address_note || '');
    }
  }, [customer]);

  const fetchOrders = useCallback(() => {
    if (!token) return;
    setIsLoadingOrders(true);
    fetch('/api/customers/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(() => {})
      .finally(() => setIsLoadingOrders(false));
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      fetchOrders();

      // Cập nhật ngầm định kỳ mỗi 8 giây khi khách đang mở modal
      const interval = setInterval(fetchOrders, 8000);

      // Nhận tín hiệu thời gian thực SSE khi admin đổi trạng thái đơn
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource('/api/orders/events');
        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'order_status_updated' || data.type === 'payment_received') {
              fetchOrders();
            }
          } catch (err) {}
        };
      } catch (e) {}

      return () => {
        clearInterval(interval);
        if (eventSource) eventSource.close();
      };
    }
  }, [isOpen, token, fetchOrders]);

  if (!isOpen || !customer) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: name,
          email,
          default_address: address,
          default_address_note: addressNote
        })
      });
      const data = await res.json();
      setIsSavingProfile(false);
      if (!res.ok) {
        setProfileError(data.error || 'Cập nhật thất bại');
      } else {
        setProfileMsg('Cập nhật thông tin thành công!');
        await refreshProfile();
        setTimeout(() => setProfileMsg(''), 3000);
      }
    } catch (e) {
      setIsSavingProfile(false);
      setProfileError('Lỗi kết nối máy chủ');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');
    setIsSavingPass(true);

    try {
      const res = await fetch('/api/customers/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });
      const data = await res.json();
      setIsSavingPass(false);
      if (!res.ok) {
        setPassError(data.error || 'Đổi mật khẩu thất bại');
      } else {
        setPassMsg('Đổi mật khẩu thành công!');
        setOldPass('');
        setNewPass('');
        setTimeout(() => setPassMsg(''), 3000);
      }
    } catch (e) {
      setIsSavingPass(false);
      setPassError('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Summary Header */}
        <div className="flex items-center gap-4 border-b border-amber-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#8C4A26] text-white flex items-center justify-center font-display font-black text-2xl shadow-md">
            {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-[#4A2115]">
              {customer.full_name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              📱 {customer.phone} {customer.email ? `• ✉️ ${customer.email}` : ''}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Thành viên thân thiết
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'border-b-2 border-[#8C4A26] text-[#8C4A26]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Lịch sử đơn ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'border-b-2 border-[#8C4A26] text-[#8C4A26]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin giao hàng</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'password' ? 'border-b-2 border-[#8C4A26] text-[#8C4A26]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-gray-500">
                Hiển thị {orders.length} đơn hàng gần nhất
              </span>
              <button
                type="button"
                onClick={() => fetchOrders()}
                disabled={isLoadingOrders}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8C4A26] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-amber-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                <span>{isLoadingOrders ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
            </div>
            {isLoadingOrders ? (
              <p className="text-xs text-gray-500 text-center py-8">Đang tải lịch sử đơn hàng...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-[#4A2115]">Bạn chưa có đơn đặt bánh nào</p>
                <p className="text-xs text-gray-500">Món bánh bạn đặt sẽ tự động lưu vào đây để theo dõi tiện lợi.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
                {orders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#4A2115]">#{ord.order_code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'delivering' ? 'bg-purple-100 text-purple-800' :
                          ord.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status === 'completed' ? 'Hoàn thành' :
                           ord.status === 'delivering' ? 'Đang giao' :
                           ord.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                        </span>
                        {ord.payment_status === 'paid' && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Đã thanh toán
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-1">
                        {new Date(ord.created_at).toLocaleString('vi-VN')} • {ord.order_type === 'delivery' ? '🛵 Giao tận nơi' : '🏪 Nhận tại quán'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-[#8C4A26]">
                        {ord.total_amount?.toLocaleString('vi-VN')}đ
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onTrackOrder(ord.tracking_token);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#8C4A26] font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Theo dõi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại (Cố định)</label>
                <input
                  type="text"
                  disabled
                  value={customer.phone}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="an.nguyen@email.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Địa chỉ giao hàng mặc định</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Ghi chú giao hàng thường dùng</label>
              <input
                type="text"
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="Ví dụ: Gọi trước khi đến, gửi bảo vệ lầu 1..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin giao hàng'}
            </button>
          </form>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
            {passMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passMsg}</span>
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mật khẩu hiện tại *</label>
              <input
                type="password"
                required
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mật khẩu mới (Tối thiểu 6 ký tự) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPass}
              className="px-6 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isSavingPass ? 'Đang đổi mật khẩu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        {/* Footer Logout button */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
          <span className="text-[11px] text-gray-400">Bami Sài Gòn ID: #{customer.id}</span>
        </div>

      </div>
    </div>
  );
};

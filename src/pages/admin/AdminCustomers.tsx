import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, MapPin, ShoppingBag, Lock, Unlock, Key, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Customer } from '../../types';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Reset password modal state
  const [resetModalCustomer, setResetModalCustomer] = useState<Customer | null>(null);
  const [newPassword, setNewPassword] = useState('bami123');
  const [isResetting, setIsResetting] = useState(false);

  const fetchCustomers = () => {
    setIsLoading(true);
    const token = localStorage.getItem('bami_token');
    let url = '/api/customers/admin/list';
    if (search.trim()) {
      url += `?search=${encodeURIComponent(search.trim())}`;
    }

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Lock / Unlock customer
  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = customer.is_active === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'mở khóa' : 'tạm khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của khách hàng "${customer.full_name}"?`)) return;

    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/customers/admin/${customer.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (res.ok) {
        setFeedback(`Đã ${actionText} tài khoản khách hàng thành công!`);
        fetchCustomers();
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Direct Reset Password for Customer
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalCustomer) return;
    setIsResetting(true);

    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/customers/admin/${resetModalCustomer.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      const data = await res.json();
      setIsResetting(false);
      if (res.ok) {
        alert(`Đã đặt lại mật khẩu cho khách ${resetModalCustomer.full_name} thành: "${newPassword}".\nBạn có thể gửi mật khẩu này cho khách!`);
        setResetModalCustomer(null);
        setNewPassword('bami123');
      } else {
        alert(data.error || 'Đặt lại mật khẩu thất bại');
      }
    } catch (e) {
      setIsResetting(false);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const totalSpentAll = customers.reduce((s, c) => s + (c.total_spent || 0), 0);
  const totalOrdersAll = customers.reduce((s, c) => s + (c.total_orders || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Title & Overview stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Khách Hàng & Thành Viên
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Danh sách thành viên đăng ký tài khoản, lịch sử mua hàng và hỗ trợ cấp lại mật khẩu.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-[#8C4A26] hover:bg-amber-50 cursor-pointer shadow-2xs self-start"
        >
          🔄 Làm mới
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng thành viên đăng ký</span>
          <p className="text-2xl font-black text-[#4A2115] mt-1">{customers.length} khách</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng số đơn thành viên</span>
          <p className="text-2xl font-black text-[#8C4A26] mt-1">{totalOrdersAll} đơn</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Doanh thu từ thành viên</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalSpentAll.toLocaleString('vi-VN')}đ</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khách, số điện thoại hoặc email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 focus:outline-hidden focus:border-[#8C4A26]"
          />
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-500">Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-sm text-[#4A2115]">Chưa có khách hàng đăng ký</p>
            <p className="text-xs text-gray-500">Khi khách hàng đăng ký tài khoản trên web, danh sách sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-100 bg-[#FFF8E8]/60 text-[11px] font-black text-[#4A2115] uppercase tracking-wider">
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-3">Địa chỉ mặc định</th>
                  <th className="py-3 px-3 text-center">Số đơn</th>
                  <th className="py-3 px-3 text-right">Tổng chi tiêu</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-sm text-[#4A2115]">{c.full_name}</span>
                        <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#8C4A26]" />
                          <span>{c.phone}</span>
                          {c.email && <span className="text-gray-400">• {c.email}</span>}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[220px] truncate text-gray-600">
                      {c.default_address || <span className="text-gray-400 italic">Chưa lưu địa chỉ</span>}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-[#4A2115]">
                      {c.total_orders || 0} đơn
                    </td>

                    <td className="py-3 px-3 text-right font-black text-[#8C4A26]">
                      {(c.total_spent || 0).toLocaleString('vi-VN')}đ
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.is_active === 1 ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setResetModalCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#8C4A26] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Cấp lại mật khẩu cho khách"
                        >
                          <Key className="w-3 h-3" />
                          <span>Cấp lại mật khẩu</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            c.is_active === 1
                              ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.is_active === 1 ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {c.is_active === 1 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

      {/* Reset Password Modal */}
      {resetModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
            <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
              Cấp lại mật khẩu cho khách hàng
            </h3>
            <p className="text-xs text-gray-600">
              Khách hàng: <strong>{resetModalCustomer.full_name}</strong> ({resetModalCustomer.phone})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Mật khẩu mới cấp cho khách *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 font-mono font-bold"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Sau khi lưu, bạn hãy nhắn mật khẩu này cho khách để họ đăng nhập vào website.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isResetting ? 'Đang lưu...' : 'Xác nhận cấp lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

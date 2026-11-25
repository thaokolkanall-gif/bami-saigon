import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle2, XCircle, DollarSign, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

interface AdminDashboardProps {
  onGoToOrders: (status?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoToOrders }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = () => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/orders/admin/stats/overview', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      })
      .catch(err => console.error('Error fetching dashboard stats:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
          Tổng Quan Hoạt Động
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Theo dõi số lượng đơn hàng, doanh thu thực tế và tiến độ nướng bánh tại quán.
        </p>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* New Orders */}
        <div 
          onClick={() => onGoToOrders('new')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Đơn mới</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-rose-600 mt-2">
            {stats?.count_new || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 group-hover:text-rose-600">Bấm để xử lý ngay →</p>
        </div>

        {/* Preparing */}
        <div 
          onClick={() => onGoToOrders('preparing')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Đang chuẩn bị</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-amber-800 mt-2">
            {stats?.count_preparing || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 group-hover:text-amber-800">Đang nướng bánh →</p>
        </div>

        {/* Delivering */}
        <div 
          onClick={() => onGoToOrders('delivering')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">Đang giao / Chờ nhận</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-blue-700 mt-2">
            {stats?.count_delivering || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 group-hover:text-blue-700">Xem đơn trên đường →</p>
        </div>

        {/* Completed */}
        <div 
          onClick={() => onGoToOrders('completed')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Hoàn thành</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-700 mt-2">
            {stats?.count_completed || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 group-hover:text-emerald-700">Lịch sử đơn xong →</p>
        </div>

        {/* Cancelled */}
        <div 
          onClick={() => onGoToOrders('cancelled')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Đơn đã hủy</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-gray-600 mt-2">
            {stats?.count_cancelled || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 group-hover:text-gray-600">Xem lý do hủy →</p>
        </div>

      </div>

      {/* Revenue Distinction Cards: Completed orders vs Actual Collected */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Completed Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Tổng giá trị đơn hoàn thành
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8C4A26] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl sm:text-3xl text-[#8C4A26]">
            {(stats?.completed_revenue || 0).toLocaleString('vi-VN')}đ
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Tính từ tất cả các đơn hàng đã phục vụ thành công.
          </p>
        </div>

        {/* Actual Collected Amount */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Tiền thực tế đã thu
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl sm:text-3xl text-emerald-700">
            {(stats?.collected_amount || 0).toLocaleString('vi-VN')}đ
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Đã xác nhận biên lai chuyển khoản hoặc thu tiền mặt thực tế.
          </p>
        </div>

        {/* Today's Stats */}
        <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Hôm nay
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl sm:text-3xl text-blue-800">
            {(stats?.today_revenue || 0).toLocaleString('vi-VN')}đ
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Gồm {stats?.today_orders || 0} đơn phát sinh trong ngày hôm nay.
          </p>
        </div>

      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#4A2115]">
            Đơn hàng gần nhất
          </h3>
          <button
            onClick={() => onGoToOrders()}
            className="text-xs font-bold text-[#8C4A26] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Chưa có đơn hàng nào phát sinh trên hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF8E8] text-[#4A2115] font-bold border-b border-amber-200/60">
                <tr>
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Hình thức</th>
                  <th className="py-3 px-3">Tổng tiền</th>
                  <th className="py-3 px-3">Thanh toán</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#8C4A26]">#{order.order_code}</td>
                    <td className="py-3 px-3 font-semibold text-[#4A2115]">
                      <div>{order.customer_name}</div>
                      <div className="text-[10px] text-gray-400">{order.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {order.order_type === 'pickup' ? 'Nhận tại quán' : 'Giao tận nơi'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-[#8C4A26]">
                      {order.total_amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.payment_status === 'verified' || order.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.payment_status === 'verified' || order.payment_status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        order.status === 'new' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'delivering' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status === 'new' ? 'Đơn mới' :
                         order.status === 'confirmed' ? 'Đã xác nhận' :
                         order.status === 'preparing' ? 'Đang làm bánh' :
                         order.status === 'delivering' ? 'Đang giao' :
                         order.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

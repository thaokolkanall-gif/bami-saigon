import React, { useState, useEffect } from 'react';
import { History, ShieldCheck } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/admin/audit-logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
          Nhật Ký Thao Tác Hệ Thống (Audit Logs)
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Theo dõi lịch sử chỉnh sửa giá, cấu hình, xử lý đơn hàng và hoạt động của tài khoản quản trị.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-400">Đang tải nhật ký...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">Chưa có bản ghi nhật ký nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF8E8] text-[#4A2115] font-bold border-b border-amber-200/60">
                <tr>
                  <th className="py-3 px-3">Thời điểm</th>
                  <th className="py-3 px-3">Người thực hiện</th>
                  <th className="py-3 px-3">Hành động</th>
                  <th className="py-3 px-3">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-amber-50/50">
                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#8C4A26]">
                      {log.username}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#4A2115]">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 text-gray-600 max-w-md">
                      {log.details}
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

import React, { useState } from 'react';
import { Lock, User, ShieldAlert, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { AdminRecovery } from './AdminRecovery';

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  if (showRecovery) {
    return <AdminRecovery onBackToLogin={() => setShowRecovery(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng nhập không thành công');
      } else {
        localStorage.setItem('bami_token', data.token);
        localStorage.setItem('bami_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[#8C4A26] text-white flex items-center justify-center text-3xl mx-auto shadow-md">
          🥖
        </div>
        <h2 className="font-display font-black text-3xl text-[#4A2115]">
          Bami Sài Gòn Admin
        </h2>
        <p className="text-xs text-gray-600">
          Hệ thống quản lý thực đơn, đơn hàng và trợ lý AI cho chủ quán
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-amber-200/80 space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">
                Tài khoản đăng nhập
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc nhanvien"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-hidden focus:border-[#8C4A26] bg-[#FFF8E8]/40"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[#4A2115]">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-xs text-[#8C4A26] hover:underline font-semibold cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-hidden focus:border-[#8C4A26] bg-[#FFF8E8]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
            </button>
          </form>

          {/* Quick Demo Credentials Helpers */}
          <div className="pt-3 border-t border-amber-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block text-center">
              Tài khoản mẫu thử nghiệm nhanh:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'admin123')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors"
              >
                <div className="font-bold text-[#8C4A26]">👑 Chủ Quán</div>
                <div className="text-[10px] text-gray-500">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('nhanvien', 'nhanvien123')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors"
              >
                <div className="font-bold text-[#4A2115]">🧑‍🍳 Nhân Viên</div>
                <div className="text-[10px] text-gray-500">nhanvien / nhanvien123</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onBackToHome}
              className="text-xs text-gray-500 hover:text-[#8C4A26] transition-colors"
            >
              ← Quay lại trang chủ khách hàng
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

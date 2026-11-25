import React, { useState } from 'react';
import { ShieldAlert, Key, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminRecoveryProps {
  onBackToLogin: () => void;
}

export const AdminRecovery: React.FC<AdminRecoveryProps> = ({ onBackToLogin }) => {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/admin-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recovery_key: recoveryKey.trim(),
          new_password: newPassword
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        setError(data.error || 'Khôi phục thất bại');
      } else {
        setSuccess('Đã khôi phục và đặt lại mật khẩu Admin thành công! Đang chuyển về trang đăng nhập...');
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('Không thể kết nối tới máy chủ');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E8] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-2xl space-y-6">
        
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C4A26] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại đăng nhập Admin</span>
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl text-[#4A2115]">
            Khôi Phục Mật Khẩu Admin
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Dành riêng cho Chủ quán. Nhập Khóa khôi phục bí mật (Master Recovery Key) để đặt lại mật khẩu tài khoản <code className="font-bold text-[#8C4A26]">admin</code>.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">
              Khóa khôi phục bí mật (Master Key) *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="Nhập Master Recovery Key..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono font-bold focus:outline-hidden focus:border-[#8C4A26]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Khóa mặc định hệ thống: <code className="text-amber-800 font-bold">BAMI_ADMIN_MASTER_KEY_2026</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">
              Mật khẩu Admin mới *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:outline-hidden focus:border-[#8C4A26]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">
              Nhập lại mật khẩu mới *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:outline-hidden focus:border-[#8C4A26]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            {isSubmitting ? 'Đang xác thực & đổi mật khẩu...' : 'Xác nhận khôi phục mật khẩu Admin'}
          </button>
        </form>

      </div>
    </div>
  );
};

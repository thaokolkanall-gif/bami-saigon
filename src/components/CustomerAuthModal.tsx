import React, { useState } from 'react';
import { X, Phone, Lock, User, MapPin, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useStore } from '../context/StoreContext';

export const CustomerAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useCustomer();
  const { settings } = useStore();

  // Login form
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Register form
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Forgot password form
  const [forgotInput, setForgotInput] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    const res = await login(loginId, loginPass);
    setIsSubmittingLogin(false);
    if (!res.success) {
      setLoginError(res.error || 'Đăng nhập không thành công');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsSubmittingReg(true);

    const res = await register({
      phone: regPhone,
      password: regPass,
      full_name: regName,
      email: regEmail,
      default_address: regAddress
    });
    setIsSubmittingReg(false);
    if (!res.success) {
      setRegError(res.error || 'Đăng ký không thành công');
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setIsSubmittingForgot(true);

    try {
      const res = await fetch('/api/customers/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_or_email: forgotInput })
      });
      const data = await res.json();
      setIsSubmittingForgot(false);
      if (!res.ok) {
        setForgotError(data.error || 'Có lỗi xảy ra');
      } else {
        setForgotToken(data.reset_token || '');
        setForgotStep('reset');
        setForgotMsg('Yêu cầu hợp lệ! Bạn có thể nhập mật khẩu mới ngay bên dưới hoặc gọi hotline để hỗ trợ.');
      }
    } catch (err) {
      setIsSubmittingForgot(false);
      setForgotError('Lỗi kết nối máy chủ');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setIsSubmittingForgot(true);

    try {
      const res = await fetch('/api/customers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: forgotToken, new_password: newPassword })
      });
      const data = await res.json();
      setIsSubmittingForgot(false);
      if (!res.ok) {
        setForgotError(data.error || 'Đặt lại mật khẩu thất bại');
      } else {
        alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
        openAuthModal('login');
      }
    } catch (err) {
      setIsSubmittingForgot(false);
      setForgotError('Lỗi kết nối máy chủ');
    }
  };

  const storePhone = settings?.phone || '0908 123 456';
  const zalo = settings?.zalo || '0908 123 456';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in duration-150">
        
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="text-center">
          <span className="text-2xl">🥖</span>
          <h3 className="font-display font-black text-2xl text-[#4A2115] mt-1">
            {authModalTab === 'login' && 'Đăng Nhập Thành Viên'}
            {authModalTab === 'register' && 'Đăng Ký Tài Khoản'}
            {authModalTab === 'forgot' && 'Khôi Phục Mật Khẩu'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {authModalTab === 'login' && 'Lưu thông tin giao hàng & xem lại lịch sử đơn bánh'}
            {authModalTab === 'register' && 'Chỉ mất 30 giây để trở thành thành viên Bami Sài Gòn'}
            {authModalTab === 'forgot' && 'Lấy lại mật khẩu dễ dàng qua SĐT hoặc liên hệ quán'}
          </p>
        </div>

        {/* Tab Switcher */}
        {authModalTab !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-amber-50 border border-amber-200/80">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authModalTab === 'login' ? 'bg-[#8C4A26] text-white shadow-xs' : 'text-gray-600 hover:text-[#4A2115]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authModalTab === 'register' ? 'bg-[#8C4A26] text-white shadow-xs' : 'text-gray-600 hover:text-[#4A2115]'
              }`}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại hoặc Email *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Ví dụ: 0908 123 456..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[#4A2115]">Mật khẩu *</label>
                <button
                  type="button"
                  onClick={() => openAuthModal('forgot')}
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
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-3.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {isSubmittingLogin ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Họ và tên *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Ví dụ: 0908 123 456"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Email (Tùy chọn)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="an.nguyen@email.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mật khẩu (Tối thiểu 6 ký tự) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Địa chỉ giao hàng mặc định (Tùy chọn)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, quận..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReg}
              className="w-full mt-2 py-3.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {isSubmittingReg ? 'Đang tạo tài khoản...' : 'Tạo tài khoản thành viên'}
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {authModalTab === 'forgot' && (
          <div className="space-y-4">
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại hoặc Email đã đăng ký *</label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="Nhập SĐT hoặc email..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="w-full py-3.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  {isSubmittingForgot ? 'Đang kiểm tra...' : 'Tiếp tục khôi phục mật khẩu'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A2115] mb-1">Nhập mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  {isSubmittingForgot ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu mới'}
                </button>
              </form>
            )}

            {/* Quick Hotline Support Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-[#4A2115] space-y-1.5">
              <p className="font-bold">📞 Cần hỗ trợ cấp lại ngay?</p>
              <p className="text-gray-600 leading-relaxed">
                Quý khách có thể gọi trực tiếp Hotline hoặc nhắn Zalo cho quán. Chủ quán có thể cấp lại mật khẩu cho bạn ngay trên hệ thống.
              </p>
              <div className="flex gap-2 pt-1 font-bold">
                <a href={`tel:${storePhone.replace(/\s+/g, '')}`} className="text-[#8C4A26] hover:underline">
                  Hotline: {storePhone}
                </a>
                <span>•</span>
                <a href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Zalo quán
                </a>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs font-bold text-gray-500 hover:text-[#4A2115] cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

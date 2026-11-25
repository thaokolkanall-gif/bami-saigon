import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Store, MapPin, Clock, UtensilsCrossed, CreditCard, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { refreshSettings } = useStore();
  const [step, setStep] = useState(1);

  // Form states
  const [storeName, setStoreName] = useState('Bami Sài Gòn');
  const [slogan, setSlogan] = useState('Bánh Mì Truyền Thống Đậm Đà Hương Vị');
  const [phone, setPhone] = useState('0908 123 456');
  const [address, setAddress] = useState('135 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM');
  const [zalo, setZalo] = useState('0908 123 456');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [bankName, setBankName] = useState('Techcombank');
  const [bankAccount, setBankAccount] = useState('1903688899901');
  const [bankOwner, setBankOwner] = useState('NGUYEN VAN CHU QUAN');
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowDelivery, setAllowDelivery] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('bami_token');

    const openingHoursObj = {
      monday: { open: openTime, close: closeTime, isOpen: true },
      tuesday: { open: openTime, close: closeTime, isOpen: true },
      wednesday: { open: openTime, close: closeTime, isOpen: true },
      thursday: { open: openTime, close: closeTime, isOpen: true },
      friday: { open: openTime, close: closeTime, isOpen: true },
      saturday: { open: openTime, close: closeTime, isOpen: true },
      sunday: { open: openTime, close: closeTime, isOpen: true }
    };

    try {
      const res = await fetch('/api/store/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store_name: storeName,
          slogan,
          phone,
          address,
          zalo,
          opening_hours: openingHoursObj,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_owner: bankOwner,
          allow_pickup: allowPickup,
          allow_delivery: allowDelivery
        })
      });

      if (res.ok) {
        await refreshSettings();
        onComplete();
      }
    } catch (e) {
      console.error('Setup failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xl space-y-8">
        
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#8C4A26] bg-amber-100 px-3 py-1 rounded-full">
            Bước {step} / 6: Thiết Lập Ban Đầu
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Khởi Tạo Thông Tin Kinh Doanh Bami Sài Gòn
          </h1>
          <p className="text-xs text-gray-500">
            Điền các thông tin cơ bản để website chính thức kích hoạt nhận đơn trực tuyến.
          </p>
        </div>

        {/* Step Progress indicators */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#8C4A26]' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Brand & Slogan */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
              <Store className="w-5 h-5 text-[#8C4A26]" />
              <span>1. Tên thương hiệu & Khẩu hiệu quán</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên cửa hàng *</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm font-bold text-[#4A2115]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Khẩu hiệu / Slogan *</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Contact & Address */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8C4A26]" />
              <span>2. Địa chỉ & Kênh liên hệ</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Địa chỉ cửa hàng *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại hotline *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Số Zalo đặt hàng *</label>
                <input
                  type="text"
                  value={zalo}
                  onChange={(e) => setZalo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Opening Hours */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8C4A26]" />
              <span>3. Khung giờ mở cửa hoạt động</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giờ mở cửa sáng</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giờ đóng cửa tối</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm font-mono font-bold"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Khung giờ này sẽ áp dụng tự động cho tất cả các ngày trong tuần.</p>
          </div>
        )}

        {/* Step 4: Methods */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#8C4A26]" />
              <span>4. Hình thức nhận hàng cho phép</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPickup}
                  onChange={(e) => setAllowPickup(e.target.checked)}
                  className="w-4 h-4 text-[#8C4A26]"
                />
                <div>
                  <span className="font-bold text-sm text-[#4A2115]">Cho phép khách nhận tại quán (Pick-up)</span>
                  <p className="text-xs text-gray-500">Khách đặt trước trên website rồi ghé quán lấy bánh.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDelivery}
                  onChange={(e) => setAllowDelivery(e.target.checked)}
                  className="w-4 h-4 text-[#8C4A26]"
                />
                <div>
                  <span className="font-bold text-sm text-[#4A2115]">Cho phép giao tận nơi (Delivery)</span>
                  <p className="text-xs text-gray-500">Giao bánh tới tận nhà khách theo khu vực được thiết lập.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Bank details */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#8C4A26]" />
              <span>5. Thông tin Chuyển khoản & VietQR</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên ngân hàng *</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ví dụ: Techcombank, Vietcombank, MB Bank..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Số tài khoản *</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên chủ tài khoản *</label>
                <input
                  type="text"
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm uppercase font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {step === 6 && (
          <div className="space-y-4 animate-in fade-in text-center py-4">
            <Sparkles className="w-12 h-12 text-[#F5BD42] mx-auto" />
            <h3 className="font-bold text-xl text-[#4A2115]">
              Sẵn Sàng Mở Cửa Nhận Đơn!
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Thông tin cửa hàng của bạn đã sẵn sàng. Sau khi kích hoạt, khách hàng có thể bắt đầu đặt bánh mì ngay trên website.
            </p>
            <div className="bg-[#FFF8E8] p-4 rounded-2xl border border-amber-200 text-xs text-left max-w-md mx-auto space-y-1">
              <p><strong>Quán:</strong> {storeName}</p>
              <p><strong>Hotline:</strong> {phone} | <strong>Zalo:</strong> {zalo}</p>
              <p><strong>Giờ mở cửa:</strong> {openTime} - {closeTime}</p>
              <p><strong>Ngân hàng:</strong> {bankName} - {bankAccount} ({bankOwner})</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-amber-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl border border-amber-200 text-[#4A2115] text-xs font-bold hover:bg-amber-50 cursor-pointer"
            >
              ← Quay lại
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Đang lưu thiết lập...' : 'Kích hoạt nhận đơn ngay'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

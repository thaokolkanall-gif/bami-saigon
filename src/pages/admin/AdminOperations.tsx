import React, { useState, useEffect } from 'react';
import { Sliders, Check, AlertTriangle, Clock, MapPin, Navigation, Compass, ExternalLink, Calculator, CreditCard, Key, Copy, Zap } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminOperations: React.FC = () => {
  const { settings, refreshSettings } = useStore();
  
  // Operating flags
  const [onlineEnabled, setOnlineEnabled] = useState(settings?.is_online_ordering_enabled === '1');
  const [isPaused, setIsPaused] = useState(settings?.is_paused === '1');
  const [allowPickup, setAllowPickup] = useState(settings?.allow_pickup === '1');
  const [allowDelivery, setAllowDelivery] = useState(settings?.allow_delivery === '1');
  const [minOrderValue, setMinOrderValue] = useState(settings?.min_order_value || '25000');
  const [prepTimeMin, setPrepTimeMin] = useState(settings?.prep_time_min || '10');
  const [prepTimeMax, setPrepTimeMax] = useState(settings?.prep_time_max || '20');

  // GPS & Distance Shipping Settings
  const [storeLat, setStoreLat] = useState(settings?.store_lat || '10.771971');
  const [storeLng, setStoreLng] = useState(settings?.store_lng || '106.692237');
  const [googleMapUrl, setGoogleMapUrl] = useState(settings?.google_map_url || '');
  const [baseKm, setBaseKm] = useState(settings?.base_shipping_km || '2');
  const [baseFee, setBaseFee] = useState(settings?.base_shipping_fee || '15000');
  const [feePerKm, setFeePerKm] = useState(settings?.fee_per_km || '5000');
  const [maxKm, setMaxKm] = useState(settings?.max_delivery_km || '15');
  const [freeShippingKm, setFreeShippingKm] = useState(settings?.free_shipping_km || '0');
  const [shippingFormulaDesc, setShippingFormulaDesc] = useState(settings?.shipping_formula_desc || '');

  // Bank & Auto Payment Webhook Settings
  const [bankName, setBankName] = useState(settings?.bank_name || 'Techcombank');
  const [bankAccount, setBankAccount] = useState(settings?.bank_account || '1903688899901');
  const [bankOwner, setBankOwner] = useState(settings?.bank_owner || 'BAMI SAI GON');
  const [webhookSecret, setWebhookSecret] = useState(settings?.webhook_secret || 'bami_webhook_sec_2026');
  const [adminRecoveryKey, setAdminRecoveryKey] = useState(settings?.admin_recovery_key || 'BAMI_ADMIN_MASTER_KEY_2026');

  // Simulator
  const [simKm, setSimKm] = useState<number>(3.5);
  const [testOrderCode, setTestOrderCode] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);

  useEffect(() => {
    if (settings) {
      setOnlineEnabled(settings.is_online_ordering_enabled === '1');
      setIsPaused(settings.is_paused === '1');
      setAllowPickup(settings.allow_pickup === '1');
      setAllowDelivery(settings.allow_delivery === '1');
      setMinOrderValue(settings.min_order_value || '25000');
      setPrepTimeMin(settings.prep_time_min || '10');
      setPrepTimeMax(settings.prep_time_max || '20');
      setStoreLat(settings.store_lat || '10.771971');
      setStoreLng(settings.store_lng || '106.692237');
      setGoogleMapUrl(settings.google_map_url || '');
      setBaseKm(settings.base_shipping_km || '2');
      setBaseFee(settings.base_shipping_fee || '15000');
      setFeePerKm(settings.fee_per_km || '5000');
      setMaxKm(settings.max_delivery_km || '15');
      setFreeShippingKm(settings.free_shipping_km || '0');
      setShippingFormulaDesc(settings.shipping_formula_desc || '');
      setBankName(settings.bank_name || 'Techcombank');
      setBankAccount(settings.bank_account || '1903688899901');
      setBankOwner(settings.bank_owner || 'BAMI SAI GON');
      setWebhookSecret(settings.webhook_secret || 'bami_webhook_sec_2026');
      setAdminRecoveryKey(settings.admin_recovery_key || 'BAMI_ADMIN_MASTER_KEY_2026');
    }
  }, [settings]);

  // Calculate simulated fee
  const calculateSimulatedFee = (km: number) => {
    const bKm = parseFloat(baseKm) || 2;
    const bFee = parseInt(baseFee) || 15000;
    const fPerKm = parseInt(feePerKm) || 5000;
    const mKm = parseFloat(maxKm) || 15;
    const freeKm = parseFloat(freeShippingKm) || 0;

    if (km > mKm) {
      return { fee: 0, outOfRange: true };
    }
    if (freeKm > 0 && km <= freeKm) {
      return { fee: 0, outOfRange: false, isFree: true };
    }
    if (km <= bKm) {
      return { fee: bFee, outOfRange: false };
    }
    const extraKm = Math.ceil(km - bKm);
    return { fee: bFee + extraKm * fPerKm, outOfRange: false };
  };

  const simResult = calculateSimulatedFee(simKm);

  // Get current GPS location of the store
  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGPS(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setStoreLat(lat);
        setStoreLng(lng);
        setFeedback(`Đã cập nhật tọa độ GPS quán: ${lat}, ${lng}`);
        setTimeout(() => setFeedback(''), 3000);
      },
      (err) => {
        setIsGettingGPS(false);
        alert('Không thể lấy vị trí GPS. Vui lòng kiểm tra quyền truy cập vị trí trên trình duyệt.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Test Auto Payment Webhook Simulation
  const handleTestSimulatePayment = async () => {
    if (!testOrderCode.trim()) {
      alert('Vui lòng nhập mã đơn (ví dụ: BM1234)');
      return;
    }

    setIsSimulating(true);
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ order_code: testOrderCode.trim() })
      });
      const data = await res.json();
      setIsSimulating(false);
      if (res.ok) {
        alert(`✅ ${data.message}\nĐơn hàng đã được tự động cập nhật "Đã thanh toán trước" trong hệ thống!`);
        setTestOrderCode('');
      } else {
        alert(data.error || 'Giả lập thanh toán thất bại');
      }
    } catch (e) {
      setIsSimulating(false);
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Webhook URL
  const webhookUrl = `${window.location.origin}/api/payments/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Save all settings
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch('/api/store/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_online_ordering_enabled: onlineEnabled ? '1' : '0',
          is_paused: isPaused ? '1' : '0',
          allow_pickup: allowPickup ? '1' : '0',
          allow_delivery: allowDelivery ? '1' : '0',
          min_order_value: minOrderValue,
          prep_time_min: prepTimeMin,
          prep_time_max: prepTimeMax,
          store_lat: storeLat,
          store_lng: storeLng,
          google_map_url: googleMapUrl,
          base_shipping_km: baseKm,
          base_shipping_fee: baseFee,
          fee_per_km: feePerKm,
          max_delivery_km: maxKm,
          free_shipping_km: freeShippingKm,
          shipping_formula_desc: shippingFormulaDesc,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_owner: bankOwner,
          webhook_secret: webhookSecret,
          admin_recovery_key: adminRecoveryKey
        })
      });

      if (res.ok) {
        setFeedback('Đã lưu cấu hình vận hành, phí giao hàng km và Webhook thành công!');
        await refreshSettings();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert('Lỗi lưu cài đặt');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
          Cài Đặt Vận Hành & Thanh Toán Tự Động
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Bật tắt nhận đơn, tính phí ship theo số km Google Maps, đối soát chuyển khoản ngân hàng và khóa khôi phục admin.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* 1. SECTION: Toggles & Operational State */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#8C4A26]" />
          <span>Trạng thái nhận đơn trực tuyến</span>
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 cursor-pointer hover:bg-amber-50/40 transition-colors">
            <div>
              <span className="font-bold text-sm text-[#4A2115]">Bật nhận đơn trên Website</span>
              <p className="text-xs text-gray-500">Khách có thể đặt món trực tiếp theo giờ mở cửa của quán.</p>
            </div>
            <input
              type="checkbox"
              checked={onlineEnabled}
              onChange={(e) => setOnlineEnabled(e.target.checked)}
              className="w-5 h-5 text-[#8C4A26] rounded-md"
            />
          </label>

          <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${
            isPaused ? 'border-rose-400 bg-rose-50/60' : 'border-amber-200 hover:bg-amber-50/40'
          }`}>
            <div>
              <span className="font-bold text-sm text-rose-700">Tạm dừng nhận đơn khẩn cấp (Quá tải lò)</span>
              <p className="text-xs text-gray-500">Khi lò nướng quá tải hoặc hết bánh đột xuất, bật tính năng này để tạm ngưng nhận đơn.</p>
            </div>
            <input
              type="checkbox"
              checked={isPaused}
              onChange={(e) => setIsPaused(e.target.checked)}
              className="w-5 h-5 text-rose-600 rounded-md"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#4A2115]">Cho phép Nhận tại quán</span>
                <p className="text-[11px] text-gray-500">Khách tự ghé lấy bánh</p>
              </div>
              <input
                type="checkbox"
                checked={allowPickup}
                onChange={(e) => setAllowPickup(e.target.checked)}
                className="w-4 h-4 text-[#8C4A26]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#4A2115]">Cho phép Giao tận nơi</span>
                <p className="text-[11px] text-gray-500">Giao bánh tới địa chỉ khách bằng bản đồ</p>
              </div>
              <input
                type="checkbox"
                checked={allowDelivery}
                onChange={(e) => setAllowDelivery(e.target.checked)}
                className="w-4 h-4 text-[#8C4A26]"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Đơn tối thiểu (VNĐ)</label>
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Thời gian chuẩn bị tối thiểu (phút)</label>
            <input
              type="number"
              value={prepTimeMin}
              onChange={(e) => setPrepTimeMin(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Thời gian chuẩn bị tối đa (phút)</label>
            <input
              type="number"
              value={prepTimeMax}
              onChange={(e) => setPrepTimeMax(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/20"
            />
          </div>
        </div>
      </div>

      {/* 2. SECTION: Store GPS Coordinates & Google Map URL */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2">
          <h3 className="font-bold text-base text-[#4A2115] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8C4A26]" />
            <span>Tọa độ GPS Quán & Đường dẫn Google Maps</span>
          </h3>
          <button
            type="button"
            onClick={handleGetCurrentGPS}
            disabled={isGettingGPS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#8C4A26] text-xs font-bold cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isGettingGPS ? 'Đang định vị...' : 'Lấy GPS vị trí quán hiện tại'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">
              Vĩ độ quán (Latitude) *
            </label>
            <input
              type="text"
              required
              value={storeLat}
              onChange={(e) => setStoreLat(e.target.value)}
              placeholder="10.771971"
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">
              Kinh độ quán (Longitude) *
            </label>
            <input
              type="text"
              required
              value={storeLng}
              onChange={(e) => setStoreLng(e.target.value)}
              placeholder="106.692237"
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#4A2115]">
              Đường dẫn Google Maps của quán
            </label>
            <a
              href={`https://www.google.com/maps?q=${storeLat},${storeLng}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#8C4A26] hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Xem vị trí trên Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="url"
            value={googleMapUrl}
            onChange={(e) => setGoogleMapUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/... hoặc để trống để hệ thống tự tạo"
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200"
          />
        </div>
      </div>

      {/* 3. SECTION: Distance-Based Shipping Fee Settings */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#8C4A26]" />
          <span>Cấu hình Phí giao hàng tự động theo khoảng cách (km)</span>
        </h3>

        {/* Editable formula description box */}
        <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-amber-200 text-xs text-[#4A2115] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">💡 Mô tả công thức tính phí (Nhập tay tùy chỉnh):</span>
            <span className="text-[11px] text-gray-500">Hiển thị cho khách hàng & Admin</span>
          </div>
          <textarea
            rows={3}
            value={shippingFormulaDesc}
            onChange={(e) => setShippingFormulaDesc(e.target.value)}
            placeholder={`Ví dụ:\n• Dưới ${freeShippingKm || '0'} km: Miễn phí giao hàng\n• Cố định ${parseInt(baseFee || '0').toLocaleString('vi-VN')}đ cho ${baseKm || '0'} km đầu\n• Mỗi km tiếp theo cộng ${parseInt(feePerKm || '0').toLocaleString('vi-VN')}đ/km\n• Tối đa ${maxKm || '0'} km`}
            className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-mono focus:outline-hidden focus:border-[#8C4A26]"
          />
          <p className="text-[11px] text-gray-500 italic">
            * Để trống nếu muốn hệ thống tự động sinh mô tả dựa trên các thông số bên dưới.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1">
              Miễn phí giao hàng dưới (km)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={freeShippingKm}
              onChange={(e) => setFreeShippingKm(e.target.value)}
              placeholder="0 (không miễn phí)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-900"
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">0 = tắt miễn phí</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Số km cơ sở (km) *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={baseKm}
              onChange={(e) => setBaseKm(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold"
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">Khoảng cách tính phí đầu</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Phí km cơ sở (VNĐ) *</label>
            <input
              type="number"
              step="1000"
              min="0"
              required
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-[#8C4A26]"
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">Cước phí khởi điểm</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Phí mỗi km tiếp theo (VNĐ) *</label>
            <input
              type="number"
              step="500"
              min="0"
              required
              value={feePerKm}
              onChange={(e) => setFeePerKm(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-[#8C4A26]"
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">Cộng thêm mỗi km phụ</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-700 mb-1">Bán kính giao tối đa (km) *</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={maxKm}
              onChange={(e) => setMaxKm(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-rose-700"
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">Cự ly xa nhất nhận giao</span>
          </div>
        </div>

        {/* Live Simulator */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#8C4A26]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A2115]">
              Công cụ thử nghiệm cước phí (Simulator)
            </h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Khoảng cách mẫu:</span>
                <span className="font-bold text-[#4A2115]">{simKm} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max={parseFloat(maxKm) + 5}
                step="0.5"
                value={simKm}
                onChange={(e) => setSimKm(parseFloat(e.target.value))}
                className="w-full accent-[#8C4A26]"
              />
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200 text-center min-w-[200px] shadow-2xs">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Cước phí khách trả</span>
              {simResult.outOfRange ? (
                <span className="text-xs font-bold text-rose-600">Vượt cự ly (Từ chối)</span>
              ) : (simResult as any).isFree ? (
                <span className="text-lg font-black text-emerald-600">
                  0đ (Miễn phí giao)
                </span>
              ) : (
                <span className="text-lg font-black text-[#8C4A26]">
                  {simResult.fee.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 🌟 SECTION: Auto Payment Webhook (SePay / Casso) */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#8C4A26]" />
          <span>Tự Động Cập Nhật "Đã Thanh Toán" Khi Khách Chuyển Khoản (Webhook)</span>
        </h3>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-[#4A2115] space-y-2">
          <p className="font-bold">⚡ Cơ chế hoạt động:</p>
          <p>
            Mỗi khi khách hàng quét mã VietQR chuyển tiền vào tài khoản ngân hàng của quán, dịch vụ đối soát (như <strong>SePay</strong> hoặc <strong>Casso</strong>) sẽ tự động gửi thông báo về Webhook này. Hệ thống sẽ so khớp mã đơn hàng (ví dụ: <code>BM8924</code>) và tự động đổi trạng thái đơn sang <strong>"Đã thanh toán trước"</strong> ngay tức thì!
          </p>
        </div>

        {/* Webhook Endpoint Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4A2115]">
            Đường dẫn Webhook của bạn (Dán vào SePay / Casso):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-gray-50 font-mono text-xs text-[#4A2115]"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWebhook ? 'Đã chép!' : 'Sao chép link'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Ngân hàng thụ hưởng</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Techcombank, MBBank..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Số tài khoản nhận tiền</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="1903..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên chủ tài khoản</label>
            <input
              type="text"
              value={bankOwner}
              onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 uppercase"
            />
          </div>
        </div>

        {/* Webhook Test Simulator */}
        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-700" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A2115]">
              Công cụ thử nghiệm tự động nhận diện thanh toán (Simulator)
            </h4>
          </div>
          <p className="text-[11px] text-gray-500">
            Nhập mã đơn hàng hiện có để thử nghiệm cơ chế tự động chuyển trạng thái "Đã thanh toán trước" mà không cần chuyển tiền thật.
          </p>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={testOrderCode}
              onChange={(e) => setTestOrderCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã đơn (Ví dụ: BM8924)..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-amber-300 uppercase font-mono font-bold"
            />
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleTestSimulatePayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              {isSimulating ? 'Đang bắn...' : 'Thử nghiệm ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. 🔑 SECTION: Emergency Admin Recovery Key */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-[#8C4A26]" />
          <span>Khóa Khôi Phục Khẩn Cấp Admin (Master Recovery Key)</span>
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed">
          Khóa này dùng để đặt lại mật khẩu cho tài khoản <code>admin</code> tại trang <strong>/admin/recovery</strong> bất cứ khi nào bạn quên mật khẩu quản trị.
        </p>

        <div className="max-w-md">
          <label className="block text-xs font-bold text-[#4A2115] mb-1">
            Khóa khôi phục bí mật (Chỉ riêng bạn biết) *
          </label>
          <input
            type="text"
            required
            value={adminRecoveryKey}
            onChange={(e) => setAdminRecoveryKey(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-300 font-mono font-bold text-[#8C4A26] bg-amber-50/30"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-8 py-3.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu cài đặt...' : 'Lưu tất cả cài đặt vận hành & Webhook'}</span>
        </button>
      </div>

    </div>
  );
};

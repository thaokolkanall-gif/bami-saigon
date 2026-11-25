import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Check, AlertTriangle, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DeliveryZone } from '../../types';

export const AdminOperations: React.FC = () => {
  const { settings, zones, refreshSettings } = useStore();
  const [onlineEnabled, setOnlineEnabled] = useState(settings?.is_online_ordering_enabled === '1');
  const [isPaused, setIsPaused] = useState(settings?.is_paused === '1');
  const [allowPickup, setAllowPickup] = useState(settings?.allow_pickup === '1');
  const [allowDelivery, setAllowDelivery] = useState(settings?.allow_delivery === '1');
  const [minOrderValue, setMinOrderValue] = useState(settings?.min_order_value || '25000');
  const [prepTimeMin, setPrepTimeMin] = useState(settings?.prep_time_min || '10');
  const [prepTimeMax, setPrepTimeMax] = useState(settings?.prep_time_max || '20');

  // New zone state
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState(15000);
  const [newZoneMin, setNewZoneMin] = useState(30000);
  const [newZoneTime, setNewZoneTime] = useState('20-30 phút');

  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (settings) {
      setOnlineEnabled(settings.is_online_ordering_enabled === '1');
      setIsPaused(settings.is_paused === '1');
      setAllowPickup(settings.allow_pickup === '1');
      setAllowDelivery(settings.allow_delivery === '1');
      setMinOrderValue(settings.min_order_value || '25000');
      setPrepTimeMin(settings.prep_time_min || '10');
      setPrepTimeMax(settings.prep_time_max || '20');
    }
  }, [settings]);

  // Save operation flags
  const handleSaveFlags = async () => {
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
          prep_time_max: prepTimeMax
        })
      });

      if (res.ok) {
        setFeedback('Đã cập nhật cài đặt vận hành thành công!');
        await refreshSettings();
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e) {}
  };

  // Add delivery zone
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/store/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          zone_name: newZoneName,
          fee: newZoneFee,
          min_order: newZoneMin,
          estimated_time: newZoneTime
        })
      });

      if (res.ok) {
        setNewZoneName('');
        await refreshSettings();
      }
    } catch (e) {}
  };

  // Delete delivery zone
  const handleDeleteZone = async (id: number) => {
    if (!confirm('Xóa khu vực giao hàng này?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      await fetch(`/api/store/zones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await refreshSettings();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
          Cài Đặt Vận Hành & Giao Hàng
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Bật tắt nhận đơn, tạm dừng khi quá tải, cài đặt khu vực giao và phí ship.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Toggles */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
          Trạng thái nhận đơn trực tuyến
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 cursor-pointer">
            <div>
              <span className="font-bold text-sm text-[#4A2115]">Bật nhận đơn trên Website</span>
              <p className="text-xs text-gray-500">Khách có thể đặt món trực tiếp 24/7 theo giờ mở cửa của quán.</p>
            </div>
            <input
              type="checkbox"
              checked={onlineEnabled}
              onChange={(e) => setOnlineEnabled(e.target.checked)}
              className="w-5 h-5 text-[#8C4A26] rounded-md"
            />
          </label>

          <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${
            isPaused ? 'border-rose-400 bg-rose-50/50' : 'border-amber-200'
          }`}>
            <div>
              <span className="font-bold text-sm text-rose-700">Tạm dừng nhận đơn khẩn cấp (Quá tải)</span>
              <p className="text-xs text-gray-500">Khi lò nướng quá tải hoặc hết bánh đột xuất, bật tính năng này để tạm ngưng nhận đơn.</p>
            </div>
            <input
              type="checkbox"
              checked={isPaused}
              onChange={(e) => setIsPaused(e.target.checked)}
              className="w-5 h-5 text-rose-600 rounded-md"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 cursor-pointer">
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

            <label className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#4A2115]">Cho phép Giao tận nơi</span>
                <p className="text-[11px] text-gray-500">Giao bánh tới địa chỉ khách</p>
              </div>
              <input
                type="checkbox"
                checked={allowDelivery}
                onChange={(e) => setAllowDelivery(e.target.checked)}
                className="w-4 h-4 text-[#8C4A26]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Đơn tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Thời gian làm bánh tối thiểu (phút)</label>
              <input
                type="number"
                value={prepTimeMin}
                onChange={(e) => setPrepTimeMin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Thời gian làm bánh tối đa (phút)</label>
              <input
                type="number"
                value={prepTimeMax}
                onChange={(e) => setPrepTimeMax(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveFlags}
            className="px-6 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            Lưu cài đặt vận hành
          </button>
        </div>
      </div>

      {/* Delivery Zones & Fees */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
          Khu vực giao hàng & Biểu phí ship
        </h3>

        {/* Existing Zones */}
        <div className="divide-y divide-gray-100">
          {zones.map(z => (
            <div key={z.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-sm text-[#4A2115]">{z.zone_name}</span>
                <p className="text-gray-500 mt-0.5">
                  Phí ship: <strong className="text-[#8C4A26]">{z.fee.toLocaleString('vi-VN')}đ</strong> • Đơn tối thiểu: {z.min_order.toLocaleString('vi-VN')}đ • Thời gian dự kiến: {z.estimated_time}
                </p>
              </div>

              <button
                onClick={() => handleDeleteZone(z.id)}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Zone Form */}
        <form onSubmit={handleAddZone} className="p-4 rounded-2xl bg-[#FFF8E8] border border-amber-200 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#8C4A26]">Thêm khu vực giao hàng mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">Tên khu vực *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Quận Bình Thạnh..."
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">Phí giao hàng (VNĐ) *</label>
              <input
                type="number"
                required
                value={newZoneFee}
                onChange={(e) => setNewZoneFee(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">Đơn tối thiểu</label>
              <input
                type="number"
                value={newZoneMin}
                onChange={(e) => setNewZoneMin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">Thời gian dự kiến</label>
              <input
                type="text"
                value={newZoneTime}
                onChange={(e) => setNewZoneTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#8C4A26] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            + Thêm khu vực này
          </button>
        </form>
      </div>

    </div>
  );
};

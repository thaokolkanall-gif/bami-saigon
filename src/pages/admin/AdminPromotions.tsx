import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Check, Sparkles, Gift, Edit3, ShoppingBag, Percent, DollarSign, Calendar, Clock, ShieldCheck, X, RotateCw, History, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Promotion, Combo } from '../../types';

interface LuckyWheelReward {
  id: number;
  label: string;
  reward_type: string;
  reward_value: string;
  probability: number;
  color: string;
  text_color: string;
  is_active: number;
  display_order: number;
}

interface LuckyWheelSpinLog {
  id: number;
  customer_id: number;
  customer_phone: string;
  full_name?: string;
  reward_label: string;
  reward_code?: string;
  created_at: string;
}

export const AdminPromotions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'combos' | 'wheel'>('vouchers');

  // Vouchers state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form states (shared for add & edit)
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(50000);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>(20000);
  const [maxUses, setMaxUses] = useState<number>(500);
  const [endDate, setEndDate] = useState<string>('');
  const [oncePerCustomer, setOncePerCustomer] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Combos / Ưu đãi state
  const [combos, setCombos] = useState<Combo[]>([]);
  const [showAddComboModal, setShowAddComboModal] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [comboPrice, setComboPrice] = useState<number>(55000);
  const [comboOriginalPrice, setComboOriginalPrice] = useState<number | ''>(65000);
  const [comboImageUrl, setComboImageUrl] = useState('/bami-saigon-store.jpg');

  // Lucky Wheel state
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [wheelRule, setWheelRule] = useState<'daily' | 'once'>('daily');
  const [wheelRewards, setWheelRewards] = useState<LuckyWheelReward[]>([]);
  const [wheelHistory, setWheelHistory] = useState<LuckyWheelSpinLog[]>([]);
  const [isSavingWheelSettings, setIsSavingWheelSettings] = useState(false);
  const [wheelMessage, setWheelMessage] = useState('');

  // Reward Modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<LuckyWheelReward | null>(null);
  const [rewardLabel, setRewardLabel] = useState('');
  const [rewardType, setRewardType] = useState('voucher');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardProb, setRewardProb] = useState<number>(10);
  const [rewardColor, setRewardColor] = useState('#EF4444');
  const [rewardTextColor, setRewardTextColor] = useState('#FFFFFF');
  const [rewardOrder, setRewardOrder] = useState<number>(1);
  const [rewardActive, setRewardActive] = useState(true);

  const toDateTimeLocal = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const applyPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setEndDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const openAddModal = () => {
    setCode('');
    setTitle('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMinOrder(50000);
    setMaxDiscount(20000);
    setMaxUses(500);
    applyPresetDays(30);
    setOncePerCustomer(true);
    setIsActive(true);
    setEditingPromo(null);
    setShowAddPromoModal(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setCode(p.code);
    setTitle(p.title);
    setDiscountType(p.discount_type);
    setDiscountValue(p.discount_value);
    setMinOrder(p.min_order_value || 0);
    setMaxDiscount(p.max_discount || '');
    setMaxUses(p.max_uses || 500);
    setEndDate(toDateTimeLocal(p.end_date));
    setOncePerCustomer(p.once_per_customer !== undefined ? p.once_per_customer === 1 : true);
    setIsActive(p.is_active === 1);
    setShowAddPromoModal(true);
  };

  const fetchPromotions = () => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/promotions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPromotions(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const fetchCombos = () => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.combos) setCombos(data.combos);
      })
      .catch(() => {});
  };

  const fetchWheelData = () => {
    const token = localStorage.getItem('bami_token');
    if (!token) return;

    fetch('/api/lucky-wheel/admin/rewards', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setWheelEnabled(data.enabled !== false);
          setWheelRule(data.rule || 'daily');
          if (Array.isArray(data.rewards)) setWheelRewards(data.rewards);
        }
      })
      .catch(() => {});

    fetch('/api/lucky-wheel/admin/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWheelHistory(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPromotions();
    fetchCombos();
    fetchWheelData();
  }, []);

  // Save Voucher (Create or Update)
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('bami_token');

    const payload = {
      code: code.toUpperCase().trim(),
      title: title.trim(),
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value: minOrder,
      max_discount: maxDiscount || null,
      max_uses: maxUses,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      once_per_customer: oncePerCustomer ? 1 : 0,
      is_active: isActive ? 1 : 0
    };

    try {
      let res;
      if (editingPromo) {
        res = await fetch(`/api/promotions/${editingPromo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/promotions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowAddPromoModal(false);
        setEditingPromo(null);
        fetchPromotions();
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi khi lưu voucher');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Delete Voucher
  const handleDeletePromo = async (id: number) => {
    if (!confirm('Xóa mã voucher này khỏi hệ thống?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchPromotions();
    } catch (e) {}
  };

  // Create Combo / Ưu đãi
  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/menu/combos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: comboName.trim(),
          description: comboDesc.trim(),
          price: comboPrice,
          original_price: comboOriginalPrice || null,
          image_url: comboImageUrl || '/bami-saigon-store.jpg',
          items_json: JSON.stringify([comboName])
        })
      });

      if (res.ok) {
        setShowAddComboModal(false);
        setComboName('');
        setComboDesc('');
        fetchCombos();
      }
    } catch (e) {}
  };

  // Delete Combo / Ưu đãi
  const handleDeleteCombo = async (id: number) => {
    if (!confirm('Xóa gói ưu đãi combo này?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      await fetch(`/api/menu/combos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCombos();
    } catch (e) {}
  };

  // Save Wheel Settings
  const handleSaveWheelSettings = async () => {
    const token = localStorage.getItem('bami_token');
    setIsSavingWheelSettings(true);
    setWheelMessage('');

    try {
      const res = await fetch('/api/lucky-wheel/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: wheelEnabled,
          rule: wheelRule
        })
      });

      if (res.ok) {
        setWheelMessage('Đã lưu cấu hình Vòng Quay May Mắn thành công!');
        setTimeout(() => setWheelMessage(''), 3000);
      }
    } catch (e) {
      alert('Không lưu được cấu hình vòng quay');
    } finally {
      setIsSavingWheelSettings(false);
    }
  };

  // Open Add Reward Modal
  const openAddRewardModal = () => {
    setEditingReward(null);
    setRewardLabel('');
    setRewardType('voucher');
    setRewardValue('');
    setRewardProb(10);
    setRewardColor('#EF4444');
    setRewardTextColor('#FFFFFF');
    setRewardOrder(wheelRewards.length + 1);
    setRewardActive(true);
    setShowRewardModal(true);
  };

  // Open Edit Reward Modal
  const openEditRewardModal = (item: LuckyWheelReward) => {
    setEditingReward(item);
    setRewardLabel(item.label);
    setRewardType(item.reward_type);
    setRewardValue(item.reward_value || '');
    setRewardProb(item.probability);
    setRewardColor(item.color || '#EF4444');
    setRewardTextColor(item.text_color || '#FFFFFF');
    setRewardOrder(item.display_order || 1);
    setRewardActive(item.is_active === 1);
    setShowRewardModal(true);
  };

  // Save Reward (Create or Update)
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('bami_token');

    const payload = {
      label: rewardLabel.trim(),
      reward_type: rewardType,
      reward_value: rewardValue.trim(),
      probability: rewardProb,
      color: rewardColor,
      text_color: rewardTextColor,
      display_order: rewardOrder,
      is_active: rewardActive ? 1 : 0
    };

    try {
      let res;
      if (editingReward) {
        res = await fetch(`/api/lucky-wheel/admin/rewards/${editingReward.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/lucky-wheel/admin/rewards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowRewardModal(false);
        setEditingReward(null);
        fetchWheelData();
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi khi lưu phần thưởng');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa ô giải thưởng này khỏi vòng quay?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/lucky-wheel/admin/rewards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWheelData();
      }
    } catch (e) {}
  };

  const getExpiryBadge = (endDateStr: string | null) => {
    if (!endDateStr) {
      return <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Vô thời hạn</span>;
    }
    const end = new Date(endDateStr);
    const now = new Date();

    const d = end.getDate().toString().padStart(2, '0');
    const m = (end.getMonth() + 1).toString().padStart(2, '0');
    const y = end.getFullYear();
    const h = end.getHours().toString().padStart(2, '0');
    const min = end.getMinutes().toString().padStart(2, '0');

    if (end < now) {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block">
            Đã hết hạn
          </span>
          <div className="text-[11px] text-gray-400 line-through">{h}:{min} {d}/{m}/{y}</div>
        </div>
      );
    }

    const diffHours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    const isUrgent = diffHours < 72;

    return (
      <div className="space-y-0.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
          isUrgent ? 'text-amber-800 bg-amber-100 animate-pulse' : 'text-emerald-700 bg-emerald-100'
        }`}>
          {isUrgent ? `⏳ Còn ${diffHours}h` : 'Còn hiệu lực'}
        </span>
        <div className="text-[11px] font-medium text-gray-600">{h}:{min} {d}/{m}/{y}</div>
      </div>
    );
  };

  const totalProb = wheelRewards.reduce((sum, r) => sum + (r.is_active ? Number(r.probability) : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Ưu Đãi & Vòng Quay May Mắn
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập mã voucher, combo ưu đãi và trò chơi Vòng quay may mắn tăng tương tác khách hàng.
          </p>
        </div>

        {activeTab === 'vouchers' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã Voucher mới</span>
          </button>
        )}

        {activeTab === 'combos' && (
          <button
            onClick={() => setShowAddComboModal(true)}
            className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Combo Ưu Đãi mới</span>
          </button>
        )}

        {activeTab === 'wheel' && (
          <button
            onClick={openAddRewardModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ô Giải Thưởng Mới</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200/80 pb-3">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-[#8C4A26] text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-amber-50 border border-amber-200/70'
          }`}
        >
          <Tag className="w-4 h-4 text-[#F5BD42]" />
          <span>Mã Voucher Giảm Giá ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('combos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'combos'
              ? 'bg-[#8C4A26] text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-amber-50 border border-amber-200/70'
          }`}
        >
          <Gift className="w-4 h-4 text-[#F5BD42]" />
          <span>Chương Trình Combo ({combos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wheel')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'wheel'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-amber-50 border border-amber-200/70'
          }`}
        >
          <RotateCw className="w-4 h-4 text-amber-500" />
          <span>Vòng Quay May Mắn ({wheelRewards.length} ô)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">Mới</span>
        </button>
      </div>

      {/* TAB 1: VOUCHERS LIST */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-[#4A2115] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C4A26] shrink-0" />
              <span>
                <strong>Tính năng mới:</strong> Thiết lập thời hạn hết hạn chính xác và quy tắc <strong>mỗi khách chỉ nhận 1 lần</strong> giúp chống gian lận và tối ưu chi phí quảng bá.
              </span>
            </div>
            <div className="text-[11px] text-gray-500 shrink-0">
              Tổng số mã: <strong>{promotions.length}</strong>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-amber-200/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#4A2115] font-bold border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-4">Mã Voucher</th>
                    <th className="py-3 px-4">Nội dung ưu đãi</th>
                    <th className="py-3 px-4">Mức giảm</th>
                    <th className="py-3 px-4">Đơn tối thiểu</th>
                    <th className="py-3 px-4">Thời gian hết hạn</th>
                    <th className="py-3 px-4">Quy tắc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {promotions.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-amber-100 text-[#8C4A26] px-2 py-1 rounded-lg border border-amber-200">
                          {p.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800">{p.title}</div>
                        {p.max_discount && (
                          <div className="text-[10px] text-gray-500">
                            Tối đa: {p.max_discount.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#8C4A26]">
                        {p.discount_type === 'percent'
                          ? `Giảm ${p.discount_value}%`
                          : `Giảm ${p.discount_value.toLocaleString('vi-VN')}đ`}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600">
                        {p.min_order_value ? `${p.min_order_value.toLocaleString('vi-VN')}đ` : 'Không giới hạn'}
                      </td>
                      <td className="py-3 px-4">
                        {getExpiryBadge(p.end_date)}
                      </td>
                      <td className="py-3 px-4">
                        {p.once_per_customer === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <ShieldCheck className="w-3 h-3" /> 1 lần/khách
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Không giới hạn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.is_active === 1 ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-[#8C4A26] hover:bg-amber-100 rounded-lg transition"
                            title="Chỉnh sửa voucher"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMBOS LIST */}
      {activeTab === 'combos' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-[#4A2115] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#8C4A26] shrink-0" />
              <span>
                Các gói Combo hiển thị tại mục <strong>"Ưu Đãi Đặc Biệt"</strong> trên trang chủ giúp khách gọi món nhanh và tiết kiệm hơn.
              </span>
            </div>
            <div className="text-[11px] text-gray-500 shrink-0">
              Tổng số combo: <strong>{combos.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.map((combo) => (
              <div key={combo.id} className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-[#4A2115]">{combo.name}</h3>
                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Xóa combo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{combo.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-sm text-[#8C4A26]">
                      {combo.price.toLocaleString('vi-VN')}đ
                    </span>
                    {combo.original_price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        {combo.original_price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-[#8C4A26] px-2 py-0.5 rounded-full">
                    Hiển thị Trang Chủ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LUCKY WHEEL (VÒNG QUAY MAY MẮN) */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          {/* Settings Box */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-[#4A2115]">Cấu Hình Hoạt Động Vòng Quay</h3>
                  <p className="text-xs text-gray-500">Quyết định bật/tắt hiển thị và luật nhận lượt quay của khách hàng</p>
                </div>
              </div>

              {wheelMessage && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{wheelMessage}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle Enable */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#4A2115]">Trạng thái nút Vòng Quay nổi trên Web</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {wheelEnabled ? 'Đang mở nút quay nổi ở góc trái dưới màn hình' : 'Đang tạm tắt, không hiển thị trên website'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wheelEnabled}
                    onChange={(e) => setWheelEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Rule Selection */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                <div className="text-xs font-bold text-[#4A2115]">Quy tắc nhận lượt quay miễn phí</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWheelRule('daily')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition ${
                      wheelRule === 'daily'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-100/50'
                    }`}
                  >
                    Mỗi ngày 1 lượt
                  </button>
                  <button
                    type="button"
                    onClick={() => setWheelRule('once')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition ${
                      wheelRule === 'once'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-100/50'
                    }`}
                  >
                    1 lượt duy nhất / tài khoản
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveWheelSettings}
                disabled={isSavingWheelSettings}
                className="px-5 py-2.5 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSavingWheelSettings ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
              </button>
            </div>
          </div>

          {/* Slices Table */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#4A2115]">Các Ô Giải Thưởng Trên Vòng Quay ({wheelRewards.length} ô)</h3>
                <p className="text-xs text-gray-500">
                  Tỷ lệ quay trúng được tính toán an toàn từ máy chủ (Server-side RNG).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">
                  Tổng tỷ lệ phân phối: <strong className="text-amber-700 font-bold">{totalProb}%</strong>
                </span>
                {totalProb !== 100 && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                    (Khuyến nghị: 100%)
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#4A2115] font-bold border-b border-amber-100">
                  <tr>
                    <th className="py-3 px-3">Thứ tự</th>
                    <th className="py-3 px-3">Màu nan</th>
                    <th className="py-3 px-4">Tên hiển thị trên ô</th>
                    <th className="py-3 px-4">Loại thưởng</th>
                    <th className="py-3 px-4">Mã Voucher nạp vào ví</th>
                    <th className="py-3 px-4">Tỷ lệ trúng</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {wheelRewards.map((reward, idx) => (
                    <tr key={reward.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-3 font-bold text-gray-500">#{reward.display_order || idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full border border-gray-300 shadow-sm inline-block shrink-0"
                            style={{ backgroundColor: reward.color }}
                          />
                          <span className="text-[10px] font-mono text-gray-400">{reward.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">{reward.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        {reward.reward_type === 'voucher' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Voucher giảm giá
                          </span>
                        )}
                        {reward.reward_type === 'free_item' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Tặng món ăn kèm
                          </span>
                        )}
                        {reward.reward_type === 'luck' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            May mắn lần sau
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#8C4A26]">
                        {reward.reward_value || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(reward.probability, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-700">{reward.probability}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reward.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {reward.is_active === 1 ? 'Bật' : 'Tắt'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditRewardModal(reward)}
                            className="p-1.5 text-gray-500 hover:text-[#8C4A26] hover:bg-amber-100 rounded-lg transition"
                            title="Sửa ô này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa ô này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* History Box */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-[#4A2115]">Lịch Sử Quay May Mắn Gần Đây</h3>
                  <p className="text-xs text-gray-500">Các lượt quay trúng thưởng của khách hàng</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {wheelHistory.length} lượt quay gần nhất
              </span>
            </div>

            {wheelHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Chưa có lượt quay nào được thực hiện. Khi khách quay, dữ liệu sẽ hiển thị tại đây.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F0] text-[#4A2115] font-bold border-b border-amber-100">
                    <tr>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-4">Khách hàng</th>
                      <th className="py-2.5 px-4">Giải thưởng trúng</th>
                      <th className="py-2.5 px-4">Mã voucher tự nạp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {wheelHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-gray-800">{item.full_name || 'Khách hàng'}</span>
                          <span className="text-gray-500 ml-1">({item.customer_phone})</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {item.reward_label}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#8C4A26]">
                          {item.reward_code || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT VOUCHER */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSavePromo} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#8C4A26]" />
                <h3 className="font-bold text-base text-[#4A2115]">
                  {editingPromo ? 'Chỉnh sửa mã Voucher' : 'Tạo mã Voucher mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPromoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mã Voucher (Viết hoa, không dấu) *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: BAMICHAO, BANHMI10K, CHAOSAI..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-amber-200 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Nội dung ưu đãi *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giảm ngay 15.000đ cho đơn hàng từ 100.000đ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Hình thức giảm</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                >
                  <option value="percent">Giảm theo %</option>
                  <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Mức giảm *</label>
                <input
                  type="number"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-[#8C4A26]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Đơn tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  value={maxDiscount}
                  placeholder="Không giới hạn"
                  onChange={(e) => setMaxDiscount(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
              </div>
            </div>

            {/* ⏰ THỜI GIAN HẾT HẠN VOUCHER */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#8C4A26] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8C4A26]" />
                  <span>Thời gian hết hạn voucher (Ngày & Giờ) *</span>
                </label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="text-[10px] text-gray-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Đặt vô thời hạn
                  </button>
                )}
              </div>

              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 font-bold bg-white text-[#4A2115]"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-500">Cài nhanh hạn dùng:</span>
                <button
                  type="button"
                  onClick={() => applyPresetDays(7)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-[#8C4A26] cursor-pointer"
                >
                  +7 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDays(30)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-[#8C4A26] cursor-pointer"
                >
                  +30 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDays(90)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-[#8C4A26] cursor-pointer"
                >
                  +3 Tháng
                </button>
              </div>
            </div>

            {/* Quy tắc mỗi khách 1 lần */}
            <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <div>
                  <div className="text-xs font-bold text-purple-900">Mỗi khách hàng chỉ nhận và dùng 1 lần duy nhất</div>
                  <div className="text-[10px] text-purple-700">Khách đã dùng đơn trước sẽ không thể nhận hay áp dụng lại.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={oncePerCustomer}
                onChange={(e) => setOncePerCustomer(e.target.checked)}
                className="w-4 h-4 text-[#8C4A26] rounded border-gray-300 focus:ring-[#8C4A26]"
              />
            </div>

            {/* Trạng thái kích hoạt */}
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-[#4A2115]">Trạng thái hiển thị trên website</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#8C4A26] rounded"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-gray-700 cursor-pointer">
                  {isActive ? 'Đang hoạt động (Hiển thị)' : 'Tạm ẩn voucher'}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setShowAddPromoModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                {editingPromo ? 'Cập nhật Voucher' : 'Lưu Voucher mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD COMBO */}
      {showAddComboModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCombo} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
              <Gift className="w-5 h-5 text-[#8C4A26]" />
              <h3 className="font-bold text-base text-[#4A2115]">Thêm Gói Ưu Đãi / Combo mới</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên combo ưu đãi *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Combo Cặp Đôi Giòn Tan"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mô tả chi tiết combo *</label>
              <textarea
                rows={2}
                required
                placeholder="Ví dụ: 2 Bánh Mì Thịt Nguội + 2 Trà Tắc Hạt Chia..."
                value={comboDesc}
                onChange={(e) => setComboDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giá ưu đãi (VNĐ) *</label>
                <input
                  type="number"
                  required
                  step="1000"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-[#8C4A26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giá gốc gạch ngang (VNĐ)</label>
                <input
                  type="number"
                  step="1000"
                  value={comboOriginalPrice}
                  onChange={(e) => setComboOriginalPrice(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setShowAddComboModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu Combo Ưu Đãi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT WHEEL REWARD */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveReward} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#4A2115]">
                  {editingReward ? 'Sửa Ô Quà Tặng' : 'Thêm Ô Quà Tặng Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRewardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên hiển thị trên nan quạt *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giảm 20.000đ, Tặng Trà Tắc..."
                value={rewardLabel}
                onChange={(e) => setRewardLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Loại phần thưởng</label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                >
                  <option value="voucher">Voucher giảm giá</option>
                  <option value="free_item">Tặng món ăn kèm</option>
                  <option value="luck">Chúc may mắn lần sau</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Mã Voucher nạp vào ví</label>
                <input
                  type="text"
                  placeholder="Ví dụ: QUAY20K, BAMICHAO..."
                  value={rewardValue}
                  onChange={(e) => setRewardValue(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-amber-200 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Tỷ lệ trúng (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={rewardProb}
                  onChange={(e) => setRewardProb(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Thứ tự hiển thị</label>
                <input
                  type="number"
                  min="1"
                  value={rewardOrder}
                  onChange={(e) => setRewardOrder(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Màu nan quạt</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rewardColor}
                    onChange={(e) => setRewardColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={rewardColor}
                    onChange={(e) => setRewardColor(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-amber-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Màu chữ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rewardTextColor}
                    onChange={(e) => setRewardTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={rewardTextColor}
                    onChange={(e) => setRewardTextColor(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-amber-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-[#4A2115]">Kích hoạt ô trên vòng quay</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rewardActiveCheck"
                  checked={rewardActive}
                  onChange={(e) => setRewardActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="rewardActiveCheck" className="text-xs text-gray-700 cursor-pointer">
                  {rewardActive ? 'Đang bật' : 'Tạm ẩn'}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setShowRewardModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                {editingReward ? 'Lưu Thay Đổi' : 'Thêm Vào Vòng Quay'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

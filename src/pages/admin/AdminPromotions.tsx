import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Check, Sparkles, Gift, Edit3, ShoppingBag, Percent, DollarSign, Calendar, Clock, ShieldCheck, X } from 'lucide-react';
import { Promotion, Combo } from '../../types';

export const AdminPromotions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'combos'>('vouchers');

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
    applyPresetDays(30); // Mặc định 30 ngày
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

  useEffect(() => {
    fetchPromotions();
    fetchCombos();
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

  const getExpiryBadge = (endDateStr: string | null) => {
    if (!endDateStr) {
      return <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Vô thời hạn</span>;
    }
    const end = new Date(endDateStr);
    const now = new Date();
    const isExpired = end.getTime() < now.getTime();
    const d = end.getDate().toString().padStart(2, '0');
    const m = (end.getMonth() + 1).toString().padStart(2, '0');
    const y = end.getFullYear();
    const h = end.getHours().toString().padStart(2, '0');
    const min = end.getMinutes().toString().padStart(2, '0');

    if (isExpired) {
      return (
        <div className="space-y-0.5">
          <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block">
            Đã hết hạn
          </span>
          <div className="text-[10px] text-gray-400 line-through">{h}:{min} {d}/{m}/{y}</div>
        </div>
      );
    }

    const diffHours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    const isUrgent = diffHours < 72; // dưới 3 ngày

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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Ưu Đãi & Voucher
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập thời gian hết hạn, quy tắc mỗi khách nhận 1 lần và quản lý hiển thị trên website.
          </p>
        </div>

        {activeTab === 'vouchers' ? (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã Voucher mới</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddComboModal(true)}
            className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Combo Ưu Đãi mới</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-amber-200/80 pb-3">
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
          <span>Chương Trình Ưu Đãi / Combo ({combos.length})</span>
        </button>
      </div>

      {/* TAB 1: VOUCHERS LIST */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-[#4A2115] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C4A26] shrink-0" />
              <span>
                💡 Mã Voucher sẽ hiển thị ở <strong>dải băng đầu trang chủ</strong>, áp dụng quy tắc <strong>mỗi khách nhận 1 lần</strong> và tự động ẩn khi tới hạn.
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#8C4A26] shrink-0">
              Nhấn biểu tượng bút để điều chỉnh thời hạn
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFF8E8] text-[#4A2115] font-bold border-b border-amber-200/60">
                  <tr>
                    <th className="py-3 px-3">Mã voucher</th>
                    <th className="py-3 px-3">Nội dung ưu đãi</th>
                    <th className="py-3 px-3">Mức giảm</th>
                    <th className="py-3 px-3">Đơn tối thiểu</th>
                    <th className="py-3 px-3">Thời hạn hết hạn</th>
                    <th className="py-3 px-3">Quy tắc</th>
                    <th className="py-3 px-3">Lượt dùng</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        Chưa có mã voucher nào. Hãy nhấn "Tạo mã Voucher mới".
                      </td>
                    </tr>
                  ) : (
                    promotions.map(promo => (
                      <tr key={promo.id} className="hover:bg-amber-50/50">
                        <td className="py-3 px-3 font-mono font-black text-[#8C4A26]">
                          <div className="flex items-center gap-1.5">
                            <span>{promo.code}</span>
                            {promo.is_active === 0 && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Tạm ẩn</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#4A2115] max-w-[200px]">
                          {promo.title}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700 whitespace-nowrap">
                          {promo.discount_type === 'percent' ? `Giảm ${promo.discount_value}%` : `Giảm ${promo.discount_value.toLocaleString('vi-VN')}đ`}
                          {promo.max_discount && (
                            <span className="block text-[10px] text-gray-400 font-normal">
                              Tối đa {promo.max_discount.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                          {promo.min_order_value.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getExpiryBadge(promo.end_date)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            1 lần / khách
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                          {promo.used_count} / {promo.max_uses}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(promo)}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                              title="Điều chỉnh thời hạn & thông tin voucher"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(promo.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Xóa voucher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMBOS / ƯU ĐÃI LIST */}
      {activeTab === 'combos' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-[#4A2115] flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#8C4A26] shrink-0" />
            <span>
              💡 Các gói Combo / Ưu Đãi tạo ở đây sẽ xuất hiện trong <strong>khối ô vuông "Chương Trình Ưu Đãi Đang Áp Dụng"</strong> trên trang chủ.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-amber-200">
                Chưa có gói ưu đãi combo nào. Nhấn "Thêm Combo Ưu Đãi mới" để tạo gói.
              </div>
            ) : (
              combos.map(combo => (
                <div key={combo.id} className="bg-white p-4 rounded-3xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        Combo Tiết Kiệm
                      </span>
                      <button
                        onClick={() => handleDeleteCombo(combo.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Xóa combo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-base text-[#4A2115] mt-2">{combo.name}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{combo.description}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-base text-[#8C4A26]">{combo.price.toLocaleString('vi-VN')}đ</span>
                      {combo.original_price && (
                        <span className="text-xs text-gray-400 line-through">{combo.original_price.toLocaleString('vi-VN')}đ</span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Đang hiển thị
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Tạo / Điều chỉnh Voucher */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSavePromo} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#8C4A26]" />
                <h3 className="font-bold text-base text-[#4A2115]">
                  {editingPromo ? 'Điều chỉnh thời hạn & thông tin Voucher' : 'Tạo mã Voucher giảm giá mới'}
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
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mã voucher *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: BAMINGON, GIAM20K"
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
                <button
                  type="button"
                  onClick={() => applyPresetDays(365)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-[#8C4A26] cursor-pointer"
                >
                  +1 Năm
                </button>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Voucher sẽ hiển thị đếm ngược thời gian hết hạn trực tiếp trên dải băng đầu trang chủ để thúc đẩy khách đặt món.
              </p>
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

      {/* Modal 2: Tạo Combo / Ưu đãi */}
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

    </div>
  );
};
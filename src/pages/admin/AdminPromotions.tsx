import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Check, Sparkles, Gift, Edit3, ShoppingBag, Percent, DollarSign } from 'lucide-react';
import { Promotion, Combo } from '../../types';

export const AdminPromotions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'combos'>('vouchers');

  // Vouchers state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(50000);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>(20000);

  // Combos / Ưu đãi state
  const [combos, setCombos] = useState<Combo[]>([]);
  const [showAddComboModal, setShowAddComboModal] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [comboPrice, setComboPrice] = useState<number>(55000);
  const [comboOriginalPrice, setComboOriginalPrice] = useState<number | ''>(65000);
  const [comboImageUrl, setComboImageUrl] = useState('/bami-saigon-store.jpg');

  const fetchPromotions = () => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/promotions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPromotions(data || []))
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

  // Create Voucher
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode.toUpperCase().trim(),
          title: newTitle,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_value: minOrder,
          max_discount: maxDiscount || null
        })
      });

      if (res.ok) {
        setShowAddPromoModal(false);
        setNewCode('');
        setNewTitle('');
        fetchPromotions();
      }
    } catch (e) {}
  };

  // Delete Voucher
  const handleDeletePromo = async (id: number) => {
    if (!confirm('Xóa mã voucher này?')) return;
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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Ưu Đãi & Voucher
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Điều chỉnh riêng biệt các mã giảm giá (Voucher) và các chương trình ưu đãi / combo đặc biệt.
          </p>
        </div>

        {activeTab === 'vouchers' ? (
          <button
            onClick={() => setShowAddPromoModal(true)}
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

      {/* Tabs Switcher: Tách biệt rõ ràng 2 chức năng */}
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
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-[#4A2115] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C4A26] shrink-0" />
            <span>
              💡 Các mã Voucher tạo ở đây sẽ <strong>tự động xuất hiện ở phần đầu trang web</strong> và trong giỏ hàng để khách hàng sao chép và nhận ưu đãi khi thanh toán.
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
                    <th className="py-3 px-3">Lượt đã dùng</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Chưa có mã voucher nào. Hãy nhấn "Tạo mã Voucher mới".
                      </td>
                    </tr>
                  ) : (
                    promotions.map(promo => (
                      <tr key={promo.id} className="hover:bg-amber-50/50">
                        <td className="py-3 px-3 font-mono font-black text-[#8C4A26]">
                          {promo.code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#4A2115]">
                          {promo.title}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {promo.discount_type === 'percent' ? `Giảm ${promo.discount_value}%` : `Giảm ${promo.discount_value.toLocaleString('vi-VN')}đ`}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {promo.min_order_value.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {promo.used_count} / {promo.max_uses}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Xóa voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal 1: Tạo Voucher */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePromo} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
              <Tag className="w-5 h-5 text-[#8C4A26]" />
              <h3 className="font-bold text-base text-[#4A2115]">Tạo mã Voucher giảm giá mới</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mã voucher (Ví dụ: BAMINGON, GIAM20K) *</label>
              <input
                type="text"
                required
                placeholder="BAMINGON"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-amber-200 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Nội dung ưu đãi *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giảm 15.000đ cho đơn từ 80.000đ..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
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
                  <option value="fixed">Giảm số tiền cố định</option>
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
                  onChange={(e) => setMaxDiscount(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
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
                className="px-5 py-2 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu Voucher
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

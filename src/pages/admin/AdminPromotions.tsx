import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Check } from 'lucide-react';
import { Promotion } from '../../types';

export const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(50000);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>(20000);

  const fetchPromotions = () => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/promotions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPromotions(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
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
        setShowAddModal(false);
        setNewCode('');
        setNewTitle('');
        fetchPromotions();
      }
    } catch (e) {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa mã giảm giá này?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchPromotions();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Chương Trình Ưu Đãi
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tạo mã voucher giảm giá %, số tiền cố định và cài đặt điều kiện giá trị đơn tối thiểu.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã ưu đãi mới</span>
        </button>
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
              {promotions.map(promo => (
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
                      onClick={() => handleDelete(promo.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-[#4A2115]">Tạo mã giảm giá mới</h3>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mã voucher (Ví dụ: BAMINGON) *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-amber-200 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tiêu đề chương trình *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giảm 10% mừng khai trương..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Loại giảm</label>
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
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
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#8C4A26] text-white rounded-xl text-xs font-bold"
              >
                Tạo mã
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

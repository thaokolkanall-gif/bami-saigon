import React, { useState, useEffect } from 'react';
import { Save, Check, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminContent: React.FC = () => {
  const { settings, refreshSettings } = useStore();
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleChange = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingField(key);
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (res.ok && result.url) {
        handleChange(key, result.url);
      } else {
        alert(result.error || 'Lỗi tải ảnh');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ khi tải ảnh');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/store/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccessMessage('Đã lưu toàn bộ thông tin nội dung website thành công!');
        await refreshSettings();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error('Save content error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Nội Dung Website
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tự do thay đổi tiêu đề, ảnh quán, câu chuyện thương hiệu, thông tin chuyển khoản và chính sách.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Section 1: Brand & Hero Banner */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
            1. Khối đầu trang & Ảnh nổi bật (Hero Banner)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên thương hiệu *</label>
              <input
                type="text"
                value={formData.store_name || ''}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs text-[#4A2115] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Khẩu hiệu (Slogan) *</label>
              <input
                type="text"
                value={formData.slogan || ''}
                onChange={(e) => handleChange('slogan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Tiêu đề lớn trang chủ (Hero Title) *</label>
            <input
              type="text"
              value={formData.hero_title || ''}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Đoạn giới thiệu ngắn (Hero Subtitle) *</label>
            <textarea
              rows={2}
              value={formData.hero_subtitle || ''}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Ảnh bìa nổi bật (Hero Image)</label>
            <div className="flex items-center gap-3">
              <img
                src={formData.hero_image || '/bami-saigon-store.jpg'}
                alt="Hero Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 bg-amber-50 shrink-0 shadow-xs"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4 text-[#8C4A26]" />
                    <span>{uploadingField === 'hero_image' ? 'Đang tải ảnh...' : 'Tải ảnh bìa từ máy / điện thoại'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingField === 'hero_image'}
                      onChange={(e) => handleUpload('hero_image', e)}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.hero_image || ''}
                  onChange={(e) => handleChange('hero_image', e.target.value)}
                  placeholder="/bami-saigon-store.jpg hoặc dán URL ảnh trực tuyến..."
                  className="w-full px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Brand Story */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
            2. Khối câu chuyện thương hiệu (Brand Story)
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Tiêu đề câu chuyện *</label>
            <input
              type="text"
              value={formData.brand_story_title || ''}
              onChange={(e) => handleChange('brand_story_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Nội dung chi tiết câu chuyện *</label>
            <textarea
              rows={4}
              value={formData.brand_story_content || ''}
              onChange={(e) => handleChange('brand_story_content', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Ảnh câu chuyện thương hiệu</label>
            <div className="flex items-center gap-3">
              <img
                src={formData.brand_story_image || '/bami-saigon-store.jpg'}
                alt="Story Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 bg-amber-50 shrink-0 shadow-xs"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4 text-[#8C4A26]" />
                    <span>{uploadingField === 'brand_story_image' ? 'Đang tải ảnh...' : 'Tải ảnh minh họa từ máy / điện thoại'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingField === 'brand_story_image'}
                      onChange={(e) => handleUpload('brand_story_image', e)}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.brand_story_image || ''}
                  onChange={(e) => handleChange('brand_story_image', e.target.value)}
                  placeholder="/bami-saigon-store.jpg hoặc dán URL ảnh trực tuyến..."
                  className="w-full px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Bank Info */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
            3. Địa chỉ & Thông tin Chuyển khoản VietQR
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Địa chỉ cửa hàng *</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại hotline *</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Zalo đặt hàng *</label>
              <input
                type="text"
                value={formData.zalo || ''}
                onChange={(e) => handleChange('zalo', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-amber-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Ngân hàng</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Số tài khoản</label>
              <input
                type="text"
                value={formData.bank_account || ''}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Chủ tài khoản</label>
              <input
                type="text"
                value={formData.bank_owner || ''}
                onChange={(e) => handleChange('bank_owner', e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs uppercase font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Policies */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-[#4A2115] border-b border-amber-100 pb-2">
            4. Chính sách giao hàng, hủy đơn & bảo mật
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Chính sách giao hàng</label>
            <textarea
              rows={2}
              value={formData.delivery_policy || ''}
              onChange={(e) => handleChange('delivery_policy', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2115] mb-1">Quy định đổi trả & hủy đơn</label>
            <textarea
              rows={2}
              value={formData.cancel_policy || ''}
              onChange={(e) => handleChange('cancel_policy', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs"
            />
          </div>
        </div>

      </form>
    </div>
  );
};

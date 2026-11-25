import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Sparkles, AlertCircle, Upload } from 'lucide-react';
import { Product, Category, Topping, Combo } from '../../types';

export const AdminMenu: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dishes' | 'categories' | 'toppings' | 'combos'>('dishes');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Edit / Add modal states
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [editTopping, setEditTopping] = useState<Partial<Topping> | null>(null);

  // Upload image handler
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditProduct(prev => prev ? { ...prev, image_url: data.url } : null);
      } else {
        alert(data.error || 'Lỗi khi tải ảnh lên');
      }
    } catch (err) {
      alert('Không thể kết nối máy chủ để tải ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchMenuData = () => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.toppings) setToppings(data.toppings);
        if (data.combos) setCombos(data.combos);
      })
      .catch(err => console.error('Error fetching menu:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Quick toggle availability (Stock)
  const handleToggleStock = async (productId: number, currentAvailable: number) => {
    const token = localStorage.getItem('bami_token');
    const newStatus = currentAvailable ? 0 : 1;

    try {
      const res = await fetch(`/api/menu/products/${productId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_available: newStatus })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: newStatus } : p));
      }
    } catch (e) {
      console.error('Failed to toggle product stock:', e);
    }
  };

  // Save Dish
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    const token = localStorage.getItem('bami_token');

    const isUpdating = Boolean(editProduct.id);
    const url = isUpdating ? `/api/menu/products/${editProduct.id}` : '/api/menu/products';
    const method = isUpdating ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editProduct)
      });

      if (res.ok) {
        setEditProduct(null);
        fetchMenuData();
      }
    } catch (e) {
      console.error('Failed to save dish:', e);
    }
  };

  // Delete Dish
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa món này khỏi menu?')) return;
    const token = localStorage.getItem('bami_token');
    try {
      const res = await fetch(`/api/menu/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchMenuData();
    } catch (e) {}
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;
    const token = localStorage.getItem('bami_token');
    const isUpdating = Boolean(editCategory.id);
    const url = isUpdating ? `/api/menu/categories/${editCategory.id}` : '/api/menu/categories';

    try {
      const res = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editCategory)
      });
      if (res.ok) {
        setEditCategory(null);
        fetchMenuData();
      }
    } catch (e) {}
  };

  // Save Topping
  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTopping) return;
    const token = localStorage.getItem('bami_token');
    const isUpdating = Boolean(editTopping.id);
    const url = isUpdating ? `/api/menu/toppings/${editTopping.id}` : '/api/menu/toppings';

    try {
      const res = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editTopping)
      });
      if (res.ok) {
        setEditTopping(null);
        fetchMenuData();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
            Quản Lý Menu & Món Ăn
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Điều chỉnh giá, thêm món mới, bật/tắt hết hàng và cài đặt topping kẹp thêm.
          </p>
        </div>

        {activeTab === 'dishes' && (
          <button
            onClick={() => setEditProduct({
              name: '',
              price: 30000,
              description: '',
              category_id: categories[0]?.id || 1,
              image_url: '/bami-saigon-store.jpg',
              is_featured: 0,
              is_available: 1
            })}
            className="px-4 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm món bánh mới</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dishes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'dishes' ? 'bg-[#8C4A26] text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-amber-50'
          }`}
        >
          🥖 Danh sách món ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'categories' ? 'bg-[#8C4A26] text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-amber-50'
          }`}
        >
          📂 Danh mục ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('toppings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'toppings' ? 'bg-[#8C4A26] text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-amber-50'
          }`}
        >
          🥓 Topping & Nhân thêm ({toppings.length})
        </button>
      </div>

      {/* Tab 1: Dishes Table */}
      {activeTab === 'dishes' && (
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FFF8E8] text-[#4A2115] font-bold border-b border-amber-200/60">
                <tr>
                  <th className="py-3 px-3">Ảnh</th>
                  <th className="py-3 px-3">Tên món & Mô tả</th>
                  <th className="py-3 px-3">Danh mục</th>
                  <th className="py-3 px-3">Giá bán</th>
                  <th className="py-3 px-3">Nổi bật</th>
                  <th className="py-3 px-3">Trạng thái kho</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => {
                  const cat = categories.find(c => c.id === product.category_id);
                  return (
                    <tr key={product.id} className="hover:bg-amber-50/50">
                      <td className="py-3 px-3">
                        <img
                          src={product.image_url || '/bami-saigon-store.jpg'}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-200"
                        />
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-[#4A2115] text-sm">{product.name}</div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                      </td>

                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {cat?.name || 'Khác'}
                      </td>

                      <td className="py-3 px-3 font-black text-[#8C4A26] text-sm">
                        {product.price.toLocaleString('vi-VN')}đ
                      </td>

                      <td className="py-3 px-3">
                        {product.is_featured === 1 ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Nổi bật
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Bình thường</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStock(product.id, product.is_available)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                            product.is_available
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {product.is_available ? '✓ Còn hàng (Mở bán)' : '✕ Hết hàng (Đang khóa)'}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditProduct(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa món"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#4A2115]">Danh mục thực đơn</h3>
            <button
              onClick={() => setEditCategory({ name: '', display_order: categories.length + 1 })}
              className="px-3 py-1.5 bg-[#8C4A26] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Thêm danh mục
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {categories.map(c => (
              <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                <span className="font-bold text-[#4A2115] text-sm">{c.name}</span>
                <button
                  onClick={() => setEditCategory(c)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sửa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Toppings */}
      {activeTab === 'toppings' && (
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#4A2115]">Topping kẹp thêm</h3>
            <button
              onClick={() => setEditTopping({ name: '', price: 5000, is_available: 1 })}
              className="px-3 py-1.5 bg-[#8C4A26] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Thêm topping
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {toppings.map(t => (
              <div key={t.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#4A2115]">{t.name}</span>
                  <span className="text-[#8C4A26] font-bold ml-2">+{t.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <button
                  onClick={() => setEditTopping(t)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sửa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProduct} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-[#4A2115]">
              {editProduct.id ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Tên món *</label>
              <input
                type="text"
                required
                value={editProduct.name || ''}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={editProduct.price || 0}
                  onChange={(e) => setEditProduct({ ...editProduct, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Danh mục *</label>
                <select
                  value={editProduct.category_id || categories[0]?.id}
                  onChange={(e) => setEditProduct({ ...editProduct, category_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Mô tả ngắn</label>
              <textarea
                rows={2}
                value={editProduct.description || ''}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2115] mb-1">Ảnh món ăn</label>
              <div className="flex items-center gap-3">
                <img
                  src={editProduct.image_url || '/bami-saigon-store.jpg'}
                  alt="Ảnh món"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 bg-amber-50 shrink-0 shadow-xs"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                      <Upload className="w-4 h-4 text-[#8C4A26]" />
                      <span>{isUploading ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy / điện thoại'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={handleUploadImage}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Hoặc dán đường dẫn URL ảnh trực tuyến..."
                    value={editProduct.image_url || ''}
                    onChange={(e) => setEditProduct({ ...editProduct, image_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={editProduct.is_featured === 1}
                  onChange={(e) => setEditProduct({ ...editProduct, is_featured: e.target.checked ? 1 : 0 })}
                />
                <span className="font-bold">Món nổi bật trang chủ</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={editProduct.is_available === 1}
                  onChange={(e) => setEditProduct({ ...editProduct, is_available: e.target.checked ? 1 : 0 })}
                />
                <span className="font-bold">Còn hàng</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#8C4A26] text-white rounded-xl text-xs font-bold"
              >
                Lưu món
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-[#4A2115]">
              {editCategory.id ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h3>
            <input
              type="text"
              required
              placeholder="Tên danh mục..."
              value={editCategory.name || ''}
              onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#8C4A26] text-white rounded-xl text-xs font-bold"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Topping Modal */}
      {editTopping && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveTopping} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-[#4A2115]">
              {editTopping.id ? 'Sửa Topping' : 'Thêm Topping'}
            </h3>
            <input
              type="text"
              required
              placeholder="Tên topping..."
              value={editTopping.name || ''}
              onChange={(e) => setEditTopping({ ...editTopping, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
            />
            <input
              type="number"
              required
              placeholder="Giá thêm (VNĐ)..."
              value={editTopping.price || 0}
              onChange={(e) => setEditTopping({ ...editTopping, price: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditTopping(null)}
                className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#8C4A26] text-white rounded-xl text-xs font-bold"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

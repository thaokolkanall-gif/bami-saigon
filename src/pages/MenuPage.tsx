import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Product, Category, Topping } from '../types';
import { DishDetailModal } from '../components/DishDetailModal';
import { useStore } from '../context/StoreContext';

export const MenuPage: React.FC = () => {
  const { isOpenNow } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategories(data.categories);
        if (data.products) setProducts(data.products);
        if (data.toppings) setToppings(data.toppings);
      })
      .catch(err => console.error('Failed to load menu:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategoryId === 'all' || product.category_id === selectedCategoryId;
    const matchesSearch = searchQuery.trim() === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#4A2115]">
          Thực Đơn Bami Sài Gòn
        </h1>
        <p className="text-sm sm:text-base text-[#4A2115]/80">
          Khám phá trọn bộ các loại bánh mì nướng nóng giòn, kẹp nhân đậm đà cùng thức uống tươi mát.
        </p>
        {!isOpenNow && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Quán hiện đang ngoài giờ mở cửa hoặc tạm ngưng nhận đơn. Quý khách vẫn có thể xem trước thực đơn.</span>
          </div>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm món bánh mì, đồ uống..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#F5BD42]/60 focus:outline-hidden focus:border-[#8C4A26] shadow-xs text-sm text-[#4A2115]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-[#8C4A26] text-white shadow-md'
                : 'bg-white text-[#4A2115] border border-amber-200/80 hover:bg-amber-50'
            }`}
          >
            Tất cả món ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#8C4A26] text-white shadow-md'
                    : 'bg-white text-[#4A2115] border border-amber-200/80 hover:bg-amber-50'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-amber-100/50 rounded-3xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-amber-200 p-8 space-y-3">
          <span className="text-5xl">🔍</span>
          <h3 className="font-bold text-lg text-[#4A2115]">Không tìm thấy món ăn phù hợp</h3>
          <p className="text-xs text-gray-500">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển danh mục.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategoryId('all'); }}
            className="px-4 py-2 rounded-xl bg-[#F5BD42] text-[#4A2115] font-bold text-xs"
          >
            Xem toàn bộ món
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const isOutOfStock = !product.is_available;
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-3xl overflow-hidden border border-amber-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 bg-amber-50 overflow-hidden">
                  <img
                    src={product.image_url || '/bami-saigon-store.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.is_featured === 1 && (
                      <span className="bg-[#F5BD42] text-[#4A2115] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                        Nổi bật
                      </span>
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-rose-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[#4A2115] group-hover:text-[#8C4A26] transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-100 flex items-center justify-between">
                    <div>
                      <span className="font-black text-xl text-[#8C4A26]">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          {product.original_price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#8C4A26] hover:bg-[#753A1B] text-white cursor-pointer'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Hết hàng' : 'Thêm món'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedProduct && (
        <DishDetailModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
        />
      )}

    </div>
  );
};

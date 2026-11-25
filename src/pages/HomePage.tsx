import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Clock, Phone, MapPin, ShieldCheck, Tag, ShoppingBag, Navigation } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Combo, Promotion, Topping } from '../types';
import { DishDetailModal } from '../components/DishDetailModal';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { settings } = useStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setFeaturedProducts(data.products.filter((p: Product) => p.is_featured === 1));
        }
        if (data.combos) {
          setCombos(data.combos);
        }
        if (data.toppings) {
          setToppings(data.toppings);
        }
      })
      .catch(err => console.error('Error fetching home menu:', err));

    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const now = new Date();
          const active = data.filter(p => 
            p.is_active === 1 && 
            (!p.start_date || new Date(p.start_date) <= now) &&
            (!p.end_date || new Date(p.end_date) >= now)
          );
          setPromotions(active);
        }
      })
      .catch(() => {});
  }, []);

  const heroImage = settings?.hero_image || '/bami-saigon-store.jpg';
  const heroTitle = settings?.hero_title || 'Bánh Mì Sài Gòn Giòn Rụm, Đậm Đà Hương Vị Xưa';
  const heroSubtitle = settings?.hero_subtitle || 'Từng chiếc bánh được nướng nóng hổi tại chỗ, hòa quyện pate béo thơm, thịt nguội thượng hạng và sốt gia truyền trứ danh.';

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5BD42]/20 via-[#FFF8E8] to-[#FFF8E8] pt-8 sm:pt-16 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Headline & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#F5BD42] shadow-xs text-xs font-bold text-[#8C4A26]">
                <Sparkles className="w-3.5 h-3.5 text-[#F5BD42]" />
                <span>Bánh Mì Truyền Thống Sài Gòn 100% Nóng Giòn</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-[#4A2115] leading-[1.15] tracking-tight">
                {heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-[#4A2115]/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('menu')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-extrabold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Đặt món ngay</span>
                </button>

                <button
                  onClick={() => onNavigate('menu')}
                  className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-amber-50 text-[#4A2115] border-2 border-[#F5BD42] font-bold text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Xem toàn bộ menu</span>
                  <ArrowRight className="w-4 h-4 text-[#8C4A26]" />
                </button>
              </div>

              {/* Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#4A2115]/80 font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">✓</div>
                  <span>Vỏ giòn rụm nướng tại chỗ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">✓</div>
                  <span>Pate gan béo thơm gia truyền</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">✓</div>
                  <span>Giao nhanh giữ nhiệt tận nơi</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image with Decorative Framing */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow backdrop */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#F5BD42] to-[#8C4A26] rounded-3xl opacity-20 blur-xl transform -rotate-3"></div>
                
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl aspect-4/3 bg-amber-100 group">
                  <img
                    src={heroImage}
                    alt={settings?.store_name || 'Bami Sài Gòn'}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20">
                    <p className="text-xs uppercase font-extrabold tracking-wider text-[#F5BD42]">Cửa Hàng Bami Sài Gòn</p>
                    <p className="text-sm font-semibold truncate">{settings?.address || '135 Nguyễn Thị Minh Khai, Q.1'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PROMOTIONS & COMBOS BANNER (Hidden when no active promos) */}
      {(promotions.length > 0 || combos.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#F5BD42] via-[#E5AC32] to-[#8C4A26] p-6 sm:p-8 text-[#4A2115] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-white bg-black/20 px-3 py-1 rounded-full">
                  Chương Trình Ưu Đãi Đang Áp Dụng
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {promotions.map(promo => (
                  <div key={promo.id} className="bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-white shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-base text-[#8C4A26] bg-[#FFF8E8] px-2.5 py-1 rounded-lg border border-[#F5BD42]">
                          {promo.code}
                        </span>
                        <span className="text-xs font-bold text-rose-600">
                          {promo.discount_type === 'percent' ? `Giảm ${promo.discount_value}%` : `Giảm ${promo.discount_value.toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-[#4A2115] mt-2 leading-snug">
                        {promo.title}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Đơn từ: {promo.min_order_value.toLocaleString('vi-VN')}đ</span>
                      <button
                        onClick={() => onNavigate('menu')}
                        className="text-[#8C4A26] font-bold hover:underline"
                      >
                        Dùng ngay →
                      </button>
                    </div>
                  </div>
                ))}

                {combos.slice(0, 2).map(combo => (
                  <div key={combo.id} className="bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-white shadow-md flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Combo Tiết Kiệm
                      </span>
                      <h4 className="font-bold text-sm text-[#4A2115] mt-1 line-clamp-1">{combo.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{combo.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-sm text-[#8C4A26]">{combo.price.toLocaleString('vi-VN')}đ</span>
                        {combo.original_price && (
                          <span className="text-[11px] text-gray-400 line-through">{combo.original_price.toLocaleString('vi-VN')}đ</span>
                        )}
                      </div>
                      <button
                        onClick={() => onNavigate('menu')}
                        className="text-xs font-bold px-3 py-1 bg-[#8C4A26] text-white rounded-lg hover:bg-[#753A1B]"
                      >
                        Đặt combo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. FEATURED DISHES BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-[#8C4A26] mb-1">
              Thực Đơn Được Yêu Thích Nhất
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-[#4A2115]">
              Món Nổi Bật Tại Quán
            </h2>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="inline-flex items-center gap-1.5 font-bold text-sm text-[#8C4A26] hover:text-[#753A1B] cursor-pointer"
          >
            <span>Xem tất cả món</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map(product => {
            const isOutOfStock = !product.is_available;
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-3xl overflow-hidden border border-amber-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 bg-amber-50 overflow-hidden">
                  <img
                    src={product.image_url || '/bami-saigon-store.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="bg-[#F5BD42] text-[#4A2115] text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
                      Nổi bật
                    </span>
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#4A2115] group-hover:text-[#8C4A26] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-[#8C4A26]">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.original_price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`p-2.5 rounded-xl shadow-xs transition-all ${
                        isOutOfStock 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] group-hover:bg-[#8C4A26] group-hover:text-white'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BRAND STORY BLOCK */}
      <section className="bg-white py-16 border-y border-amber-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Story Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border-4 border-[#FFF8E8] shadow-xl aspect-4/3 bg-amber-50">
                <img
                  src={settings?.brand_story_image || '/bami-saigon-store.jpg'}
                  alt={settings?.brand_story_title || 'Hành Trình Bami Sài Gòn'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Story Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-xs font-bold text-[#8C4A26]">
                <ShieldCheck className="w-4 h-4 text-[#8C4A26]" />
                <span>Tâm Huyết & Chất Lượng</span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#4A2115] leading-tight">
                {settings?.brand_story_title || 'Hành Trình Bami Sài Gòn'}
              </h2>

              <div className="text-base text-[#4A2115]/80 space-y-4 leading-relaxed">
                <p>
                  {settings?.brand_story_content || 'Bami Sài Gòn sinh ra từ niềm đam mê lưu giữ hương vị ổ bánh mì đường phố Sài Gòn quen thuộc nhưng với chất lượng vệ sinh chuẩn mực và nguyên liệu chọn lọc khắt khe nhất.'}
                </p>
                <p>
                  Mỗi ổ bánh khi đến tay thực khách đều được nướng nóng giòn tan, phết lớp pate gan béo thơm nhà làm và chan đẫm sốt bơ trứng vàng ươm chuẩn phong vị Sài Gòn xưa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F5BD42]/40">
                  <div className="font-black text-xl text-[#8C4A26]">100% Nóng Giòn</div>
                  <div className="text-xs text-gray-600 mt-1">Nướng lại ngay khi khách đặt</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F5BD42]/40">
                  <div className="font-black text-xl text-[#8C4A26]">Pate Nhà Làm</div>
                  <div className="text-xs text-gray-600 mt-1">Béo ngậy thơm ngon không phụ gia</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. STORE INFO & CONTACT BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FFF8E8] border-2 border-[#F5BD42]/40 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#8C4A26]">Ghé Thăm Chúng Tôi</span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115] mt-1">
                  Thông Tin Cửa Hàng
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="font-bold text-[#4A2115] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8C4A26]" />
                    <span>Địa chỉ:</span>
                  </div>
                  <p className="text-gray-600 pl-6">{settings?.address || '135 Nguyễn Thị Minh Khai, Q.1, TP.HCM'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#4A2115] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8C4A26]" />
                    <span>Giờ mở cửa:</span>
                  </div>
                  <p className="text-gray-600 pl-6">06:00 - 22:00 (Tất cả các ngày trong tuần)</p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#4A2115] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#8C4A26]" />
                    <span>Hotline giao hàng:</span>
                  </div>
                  <p className="text-[#8C4A26] font-extrabold pl-6 text-base">{settings?.phone || '0908 123 456'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#4A2115] flex items-center gap-2">
                    <span className="text-blue-600 font-bold">Zalo</span>
                    <span>Hỗ trợ trực tuyến:</span>
                  </div>
                  <p className="text-blue-600 font-bold pl-6">{settings?.zalo || '0908 123 456'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href={settings?.google_map_url || `https://www.google.com/maps/dir/?api=1&destination=${settings?.store_lat || '10.771971'},${settings?.store_lng || '106.692237'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] font-black text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4 text-[#8C4A26]" />
                  <span>Chỉ đường trên Google Maps</span>
                </a>
                {settings?.phone && (
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="px-6 py-3 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Gọi hotline quán</span>
                  </a>
                )}
                {settings?.zalo && (
                  <a
                    href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Nhắn Zalo đặt hàng</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-2xl">⚡</span>
                <h4 className="font-bold text-lg text-[#4A2115] mt-2">Đặt Hàng Siêu Tốc</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Không cần đăng ký tài khoản rườm rà. Chọn món, nhập số điện thoại và địa chỉ, bánh sẽ được nướng nóng và giao ngay đến bạn.
                </p>
              </div>
              <button
                onClick={() => onNavigate('menu')}
                className="w-full mt-6 py-3 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] font-black rounded-xl text-sm shadow-xs transition-colors"
              >
                Chọn món ngay bây giờ
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Dish Modal */}
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

import React from 'react';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useStore();

  const storeName = settings?.store_name || 'Bami Sài Gòn';
  const address = settings?.address || '135 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
  const phone = settings?.phone || '0908 123 456';
  const cleanPhone = phone.replace(/\s+/g, '');

  return (
    <footer className="bg-[#4A2115] text-[#FFF8E8] pt-14 pb-24 md:pb-14 border-t-4 border-[#F5BD42]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🥖</span>
              <span className="font-display font-extrabold text-2xl tracking-wide text-[#F5BD42]">
                {storeName}
              </span>
            </div>
            <p className="text-amber-100/80 text-sm leading-relaxed">
              {settings?.slogan || 'Bánh Mì Truyền Thống Đậm Đà Hương Vị Sài Gòn Xưa. Nóng giòn tận tay, đậm đà khó quên.'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-[#8C4A26] flex items-center justify-center text-amber-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs text-amber-200/90 font-medium">
                Vệ sinh ATTP 100% • Nguyên liệu tươi mới mỗi ngày
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-[#F5BD42] border-b border-amber-900 pb-2">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-sm text-amber-100/90 font-medium">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Trang chủ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('menu')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Thực đơn đầy đủ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Câu chuyện thương hiệu
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Địa chỉ & Liên hệ
                </button>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-[#F5BD42] border-b border-amber-900 pb-2">
              Chính Sách
            </h4>
            <ul className="space-y-2 text-sm text-amber-100/90 font-medium">
              <li>
                <button onClick={() => onNavigate('policy')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Chính sách giao hàng & đóng gói
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policy')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Quy định đổi trả & hủy đơn
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policy')} className="hover:text-[#F5BD42] transition-colors cursor-pointer">
                  Chính sách bảo mật thông tin
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="text-[#F5BD42] hover:underline cursor-pointer">
                  Dành cho quản trị viên (Admin)
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-[#F5BD42] border-b border-amber-900 pb-2">
              Liên Hệ Đặt Món
            </h4>
            <div className="space-y-2.5 text-sm text-amber-100/90">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#F5BD42] shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#F5BD42] shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-[#F5BD42] font-bold text-amber-200">
                  {phone}
                </a>
              </div>
              {settings?.zalo && (
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#F5BD42] shrink-0" />
                  <a 
                    href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="hover:text-[#F5BD42] font-medium"
                  >
                    Zalo: {settings.zalo}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#F5BD42] shrink-0" />
                <span>06:00 - 22:00 (Mỗi ngày)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-amber-900/60 text-center text-xs text-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {storeName}. Toàn bộ quyền được bảo lưu.</p>
          <p className="flex items-center gap-1">
            Đậm đà hương vị bánh mì Sài Gòn <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </p>
        </div>
      </div>
    </footer>
  );
};

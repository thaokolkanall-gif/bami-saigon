import React from 'react';
import { ShieldCheck, Heart, Sparkles, Award } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { settings } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider text-[#8C4A26] bg-amber-100 px-3 py-1 rounded-full">
          Câu Chuyện Thương Hiệu
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#4A2115]">
          {settings?.brand_story_title || 'Hành Trình Bami Sài Gòn'}
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Lưu giữ trọn vẹn hương vị ổ bánh mì đường phố Sài Gòn quen thuộc qua nhiều thế hệ.
        </p>
      </div>

      {/* Main Feature Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-amber-100 aspect-4/3">
          <img
            src={settings?.brand_story_image || '/bami-saigon-store.jpg'}
            alt="Cửa hàng Bami Sài Gòn"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4 text-[#4A2115]/90 text-sm sm:text-base leading-relaxed">
          <p>
            {settings?.brand_story_content || 'Bami Sài Gòn sinh ra từ niềm đam mê lưu giữ hương vị ổ bánh mì đường phố Sài Gòn quen thuộc nhưng với chất lượng vệ sinh chuẩn mực và nguyên liệu chọn lọc khắt khe nhất.'}
          </p>
          <p>
            Mỗi buổi sớm mai, lò bánh mì Bami Sài Gòn đỏ lửa nướng từng mẻ bánh vàng ruộm. Tiếng vỏ bánh giòn vỡ tan khi cắn, hòa cùng vị béo ngậy của pate gan làm trong ngày, thịt nguội thơm ngậy và sốt trứng gà vàng óng tạo nên phong vị ẩm thực đường phố không thể nhầm lẫn.
          </p>
          <p className="font-medium text-[#8C4A26]">
            Chúng tôi tin rằng: Một chiếc bánh mì ngon không chỉ làm no bụng, mà còn mang lại niềm vui cho cả ngày dài làm việc!
          </p>
        </div>
      </div>

      {/* 4 Pillars of Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#8C4A26] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-[#4A2115]">Vỏ Bánh Nướng Giòn</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Luôn nướng nóng lại bánh trước khi giao, đảm bảo độ giòn rụm hoàn hảo tận tay thực khách.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#8C4A26] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-[#4A2115]">Pate Gan Thượng Hạng</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Công thức pate gan gia truyền béo ngậy, ngọt bùi tự nhiên, hấp tươi mới mỗi ngày.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#8C4A26] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-[#4A2115]">100% Sạch & An Toàn</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Rau củ ngâm rửa kỹ càng, thịt có nguồn gốc rõ ràng, đạt chứng nhận ATTP tuyệt đối.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#8C4A26] flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base text-[#4A2115]">Tận Tâm Phục Vụ</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Luôn lắng nghe mọi góp ý để mỗi ổ bánh mì ngày càng hoàn thiện và trọn vẹn hơn.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-6">
        <button
          onClick={() => onNavigate('menu')}
          className="px-8 py-4 bg-[#8C4A26] hover:bg-[#753A1B] text-white font-extrabold text-base rounded-2xl shadow-xl transition-all cursor-pointer"
        >
          Khám phá thực đơn ngay hôm nay
        </button>
      </div>

    </div>
  );
};

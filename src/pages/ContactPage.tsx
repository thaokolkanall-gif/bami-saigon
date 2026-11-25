import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Clock, Send, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ContactPage: React.FC = () => {
  const { settings } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setName('');
      setPhone('');
      setMessage('');
    }, 1500);
  };

  const address = settings?.address || '135 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
  const storePhone = settings?.phone || '0908 123 456';
  const zalo = settings?.zalo || '0908 123 456';
  const storeLat = settings?.store_lat || '10.771971';
  const storeLng = settings?.store_lng || '106.692237';
  const googleMapUrl = settings?.google_map_url || `https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLng}`;

  // Embedded map iframe URL
  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#4A2115]">
          Liên Hệ Bami Sài Gòn
        </h1>
        <p className="text-sm text-gray-600">
          Ghé trực tiếp tiệm bánh hoặc liên hệ hotline để đặt tiệc số lượng lớn, giao nhanh tận nơi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Contact Info & Map Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-lg text-[#4A2115] border-b border-amber-100 pb-3">
            Thông tin cửa hàng
          </h3>

          <div className="space-y-4 text-sm text-[#4A2115]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#8C4A26] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Địa chỉ quán:</p>
                <p className="text-gray-600 mt-0.5">{address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#8C4A26] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Hotline đặt món & phản ánh:</p>
                <a href={`tel:${storePhone.replace(/\s+/g, '')}`} className="text-[#8C4A26] font-extrabold text-base hover:underline">
                  {storePhone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Kênh chat Zalo:</p>
                <a 
                  href={`https://zalo.me/${zalo.replace(/\s+/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 font-bold hover:underline"
                >
                  {zalo}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#8C4A26] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Giờ phục vụ:</p>
                <p className="text-gray-600 mt-0.5">06:00 - 22:00 (Từ Thứ Hai đến Chủ Nhật)</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#F5BD42]" />
              <span>Chỉ đường trên Google Maps →</span>
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white hover:bg-amber-50 text-[#4A2115] border border-amber-300 font-bold text-xs transition-all"
            >
              <span>Xem địa điểm</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Message Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs">
          <h3 className="font-bold text-lg text-[#4A2115] border-b border-amber-100 pb-3 mb-4">
            Gửi tin nhắn cho chúng tôi
          </h3>

          {isSent ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="font-bold text-base text-[#4A2115]">Đã gửi tin nhắn thành công!</p>
              <p className="text-xs text-gray-500">Quán sẽ liên hệ lại với quý khách trong thời gian sớm nhất.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Họ tên của bạn *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2115] mb-1">Nội dung tin nhắn *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Góp ý hoặc yêu cầu đặt số lượng lớn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-[#FFF8E8]/40 text-sm focus:bg-white focus:outline-hidden focus:border-[#8C4A26]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#8C4A26] hover:bg-[#753A1B] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi góp ý / tin nhắn</span>
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Embedded Google Map Section */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-[#4A2115] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8C4A26]" />
              <span>Bản Đồ Chỉ Đường Đến Bami Sài Gòn</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Địa chỉ: {address}
            </p>
          </div>
          <a
            href={googleMapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] font-black text-xs shadow-2xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Mở chỉ đường trong Google Maps App</span>
          </a>
        </div>

        <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-amber-200 bg-amber-50 relative">
          <iframe
            title="Bami Sài Gòn Google Maps"
            src={embedMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

    </div>
  );
};

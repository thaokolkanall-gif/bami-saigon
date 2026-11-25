import React from 'react';
import { useStore } from '../context/StoreContext';

export const PolicyPage: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      <div className="text-center space-y-2">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#4A2115]">
          Chính Sách & Quy Định Hoạt Động
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Cập nhật quy định về giao hàng, hủy đơn và bảo mật thông tin tại Bami Sài Gòn.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs space-y-8 text-sm text-[#4A2115]/90 leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-bold text-lg text-[#8C4A26] border-b border-amber-100 pb-2">
            1. Chính sách giao hàng & đóng gói
          </h2>
          <p>
            {settings?.delivery_policy || 'Bánh mì được nướng giòn và đóng gói trong túi giấy giữ nhiệt an toàn vệ sinh ngay sau khi quán hoàn tất. Thời gian giao hàng phụ thuộc vào khoảng cách và tình hình giao thông, trung bình từ 15 đến 30 phút.'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Quán chỉ bắt đầu nướng bánh sau khi nhân viên gọi điện hoặc nhắn tin xác nhận đơn với khách hàng.</li>
            <li>Phí giao hàng được tính theo khu vực hiển thị rõ ràng tại bước thanh toán.</li>
            <li>Trường hợp địa chỉ ngoài khu vực hỗ trợ, nhân viên sẽ liên hệ để báo phương án giao phù hợp.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-bold text-lg text-[#8C4A26] border-b border-amber-100 pb-2">
            2. Quy định đổi trả & hủy đơn
          </h2>
          <p>
            {settings?.cancel_policy || 'Quý khách vui lòng gọi hotline hoặc nhắn Zalo cho quán trong vòng 5 phút sau khi đặt đơn nếu có nhu cầu thay đổi món hoặc hủy đơn hàng.'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Nếu bánh đã vào lò nướng hoặc shipper đã nhận bánh đi giao, đơn hàng không thể hủy.</li>
            <li>Trường hợp bánh bị nhầm món hoặc chất lượng không đúng cam kết, quán sẽ nướng lại bánh mới hoặc hoàn lại tiền cho khách hàng.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-bold text-lg text-[#8C4A26] border-b border-amber-100 pb-2">
            3. Chính sách bảo mật thông tin
          </h2>
          <p>
            {settings?.privacy_policy || 'Bami Sài Gòn cam kết bảo mật tuyệt đối họ tên, số điện thoại và địa chỉ nhận hàng của quý khách. Mọi thông tin chỉ được lưu trữ nhằm mục đích xử lý đơn hàng và liên hệ hỗ trợ giao hàng.'}
          </p>
          <p className="text-gray-600">
            Trang theo dõi đơn hàng sử dụng mã truy cập bảo mật ngẫu nhiên, người khác không thể xem thông tin đơn bằng cách nhập số thứ tự đơn tuần tự.
          </p>
        </section>

      </div>

    </div>
  );
};

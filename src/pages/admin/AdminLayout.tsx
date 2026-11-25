import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Bot, Settings, 
  Tag, Sliders, FileText, Bell, Volume2, VolumeX, LogOut, ChevronRight, Menu, X, ArrowUpRight, Users
} from 'lucide-react';
import { soundChime } from '../../components/NotificationAudio';
import { useStore } from '../../context/StoreContext';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  onViewStore: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onViewStore,
  children
}) => {
  const { settings } = useStore();
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundChime.isEnabled());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState('');

  // Toggle audio
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundChime.setEnabled(next);
  };

  // Test sound
  const handleTestSound = () => {
    soundChime.playChime();
    setSoundFeedback('Đã phát chuông thử nghiệm!');
    setTimeout(() => setSoundFeedback(''), 2500);
  };

  // Listen for Server-Sent Events (SSE) for real-time new order notification & sound
  useEffect(() => {
    const eventSource = new EventSource('/api/orders/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_order') {
          setUnreadOrdersCount(prev => prev + 1);
          soundChime.playChime();
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const isOwner = currentUser?.role === 'owner';

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, badge: unreadOrdersCount },
    { id: 'menu', label: 'Quản lý Menu', icon: UtensilsCrossed },
    { id: 'ai', label: 'Trợ lý AI tiếng Việt', icon: Bot, isHighlight: true },
    { id: 'content', label: 'Nội dung Website', icon: FileText, ownerOnly: true },
    { id: 'operations', label: 'Vận hành & Giao hàng', icon: Sliders, ownerOnly: true },
    { id: 'customers', label: 'Khách hàng', icon: Users, ownerOnly: true },
    { id: 'promotions', label: 'Ưu đãi & Voucher', icon: Tag, ownerOnly: true },
    { id: 'logs', label: 'Nhật ký thao tác', icon: Settings, ownerOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#4A2115]">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-amber-200/80 shadow-xs shrink-0">
        
        {/* Brand header */}
        <div className="p-5 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🥖</span>
            <div>
              <div className="font-display font-black text-lg text-[#4A2115] leading-none">
                Bami Sài Gòn
              </div>
              <div className="text-[11px] text-[#8C4A26] font-semibold mt-1">
                Trang Quản Trị
              </div>
            </div>
          </div>
        </div>

        {/* User profile & role badge */}
        <div className="p-4 mx-3 my-3 bg-[#FFF8E8] rounded-2xl border border-[#F5BD42]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-[#4A2115]">
              {currentUser?.full_name || currentUser?.username}
            </div>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
              isOwner ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-900'
            }`}>
              {isOwner ? '👑 Chủ Quán (Toàn quyền)' : '🧑‍🍳 Nhân Viên (Xử lý đơn)'}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (item.id === 'orders') setUnreadOrdersCount(0);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#8C4A26] text-white shadow-xs'
                    : item.isHighlight
                    ? 'bg-amber-100/70 text-[#8C4A26] hover:bg-amber-200'
                    : 'text-[#4A2115] hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isHighlight ? 'text-[#8C4A26]' : 'text-amber-800'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[#E11D48] text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sound Chime Control Box */}
        <div className="p-4 m-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#4A2115] flex items-center gap-1.5">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              Âm báo đơn mới
            </span>
            <button
              onClick={handleToggleSound}
              className={`text-[10px] font-black px-2 py-1 rounded-md transition-colors cursor-pointer ${
                soundEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {soundEnabled ? 'Đang BẬT' : 'Đang TẮT'}
            </button>
          </div>
          <button
            onClick={handleTestSound}
            className="w-full py-1 text-[11px] font-bold text-[#8C4A26] bg-white rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            🔔 Bấm thử âm báo
          </button>
          {soundFeedback && (
            <p className="text-[10px] text-emerald-700 font-semibold text-center">{soundFeedback}</p>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-amber-100 flex items-center justify-between gap-2">
          <button
            onClick={onViewStore}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#4A2115] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Xem website</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-amber-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥖</span>
          <span className="font-display font-extrabold text-base text-[#4A2115]">Bami Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestSound}
            className="p-2 rounded-lg bg-amber-100 text-[#8C4A26]"
            title="Thử âm báo"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-amber-50 text-[#4A2115]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-amber-200 p-4 space-y-1 shadow-lg animate-in slide-in-from-top">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
                  isActive ? 'bg-[#8C4A26] text-white' : 'text-[#4A2115] hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
          <div className="pt-2 flex gap-2">
            <button
              onClick={onViewStore}
              className="flex-1 py-2 bg-amber-100 rounded-xl text-xs font-bold text-center"
            >
              Xem website
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {/* Sound alert advisory reminder banner */}
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-center justify-between gap-2">
          <span>
            ℹ️ <strong>Lưu ý âm báo:</strong> Âm báo đơn mới hoạt động khi trình duyệt mở tab này và cho phép phát âm thanh. Nhấn nút <strong>"Bấm thử âm báo"</strong> ở góc trái để cấp quyền âm thanh nếu chưa nghe thấy.
          </span>
          <button onClick={handleTestSound} className="shrink-0 font-bold text-[#8C4A26] hover:underline">
            Thử âm thanh →
          </button>
        </div>

        {children}
      </main>

    </div>
  );
};

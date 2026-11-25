import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, Check, X, Undo2, AlertCircle, History, MessageSquare } from 'lucide-react';
import { AiProposal } from '../../types';
import { useStore } from '../../context/StoreContext';

export const AdminAIAssistant: React.FC = () => {
  const { refreshSettings } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; proposals?: AiProposal[] }>>([
    {
      sender: 'ai',
      text: 'Xin chào Chủ Quán Bami Sài Gòn! Tôi là trợ lý AI thông minh. Bạn có thể yêu cầu tôi chỉnh sửa giá món, đánh dấu hết hàng, cập nhật giờ mở cửa hoặc viết lại câu chuyện thương hiệu bằng tiếng Việt tự nhiên.'
    }
  ]);
  const [currentProposals, setCurrentProposals] = useState<AiProposal[] | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState('');
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  // Fetch AI audit logs
  const fetchLogs = () => {
    const token = localStorage.getItem('bami_token');
    fetch('/api/admin/ai/logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAiLogs(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Quick preset chips
  const presets = [
    'Đổi giá bánh mì đặc biệt thành 35.000 đồng',
    'Đánh dấu bánh mì gà nấm hương hết hàng hôm nay',
    'Mở bán lại bánh mì que',
    'Đổi giờ mở cửa từ 06:00 đến 22:30',
    'Viết lại đoạn giới thiệu quán ngắn gọn hơn'
  ];

  // Send Prompt to AI
  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || prompt;
    if (!textToSend.trim()) return;

    setPrompt('');
    setApplySuccessMessage('');
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setIsLoading(true);

    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.error || 'Có lỗi xảy ra khi xử lý yêu cầu.' }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: data.explanation,
          proposals: data.proposals
        }]);

        if (data.proposals && data.proposals.length > 0) {
          setCurrentProposals(data.proposals);
        } else {
          setCurrentProposals(null);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Lỗi mạng: Không thể kết nối với dịch vụ AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Changes
  const handleApply = async () => {
    if (!currentProposals || currentProposals.length === 0) return;
    setIsApplying(true);
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch('/api/admin/ai/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: messages[messages.length - 2]?.text || 'Yêu cầu qua AI',
          proposals: currentProposals
        })
      });

      const data = await res.json();
      if (res.ok) {
        setApplySuccessMessage('Đã lưu thay đổi vào cơ sở dữ liệu thành công!');
        setCurrentProposals(null);
        await refreshSettings();
        fetchLogs();
      }
    } catch (e) {
      console.error('Failed to apply diff:', e);
    } finally {
      setIsApplying(false);
    }
  };

  // Revert Previous AI change
  const handleRevert = async (logId: number) => {
    if (!confirm('Bạn có chắc muốn hoàn tác thay đổi này?')) return;
    const token = localStorage.getItem('bami_token');

    try {
      const res = await fetch(`/api/admin/ai/revert/${logId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Đã hoàn tác thay đổi thành công!');
        await refreshSettings();
        fetchLogs();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[#8C4A26] text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant v1.0 • Google Gemini & Tiếng Việt Tự Nhiên</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A2115]">
          Trợ Lý AI Chỉnh Sửa Nội Dung & Thực Đơn
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Nhập câu lệnh bằng tiếng Việt thông thường. AI sẽ đọc dữ liệu, hiển thị bảng so sánh (Diff) và chỉ áp dụng khi bạn bấm xác nhận.
        </p>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Mẫu câu thử nghiệm nhanh:
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset)}
              className="px-3 py-1.5 bg-white border border-amber-200 hover:border-[#8C4A26] hover:bg-amber-50 rounded-xl text-xs font-semibold text-[#4A2115] transition-all cursor-pointer shadow-2xs text-left"
            >
              💬 "{preset}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area & Diff Proposals Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Chat Box */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-amber-200/80 shadow-xs flex flex-col h-[520px]">
          
          {/* Messages */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-[#8C4A26] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#8C4A26] text-white rounded-br-xs font-medium'
                    : 'bg-[#FFF8E8] text-[#4A2115] border border-amber-200/80 rounded-bl-xs'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                <div className="w-4 h-4 border-2 border-[#8C4A26] border-t-transparent rounded-full animate-spin"></div>
                <span>Trợ lý AI đang phân tích dữ liệu cửa hàng...</span>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            className="p-3 bg-[#FFF8E8] border-t border-amber-200/60 rounded-b-3xl flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập yêu cầu tiếng Việt (Ví dụ: Đổi giá bánh mì...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:border-[#8C4A26]"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-2.5 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-gray-300"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

        {/* Right Column: Diff Proposal Table */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-[#4A2115] border-b border-amber-100 pb-2 flex items-center justify-between">
              <span>Bảng so sánh đề xuất (Diff Preview)</span>
              <span className="text-[10px] text-gray-400">Kiểm tra trước khi lưu</span>
            </h3>

            {applySuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{applySuccessMessage}</span>
              </div>
            )}

            {!currentProposals || currentProposals.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
                <p>Chưa có đề xuất thay đổi nào đang chờ duyệt.</p>
                <p className="text-[11px] text-gray-400">Hãy nhập yêu cầu trong khung chat bên cạnh.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {currentProposals.map((prop, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#FFF8E8] border border-amber-200 space-y-2 text-xs">
                    <div className="font-bold text-[#8C4A26]">{prop.target_name}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-gray-200">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Hiện tại</span>
                        <span className="text-gray-700 font-medium line-through">{prop.current_value}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                        <span className="text-emerald-700 block text-[9px] uppercase font-bold">Đề xuất mới</span>
                        <span className="text-emerald-800 font-bold">{prop.proposed_value}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 italic">
                      Lý do: {prop.explanation}
                    </p>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCurrentProposals(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isApplying ? 'Đang lưu...' : 'Áp dụng ngay'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History of AI Changes (Audit Log & Revert) */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Nhật ký thay đổi của AI gần đây</span>
            </h4>

            {aiLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Chưa có lịch sử thay đổi.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {aiLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#4A2115] truncate max-w-[180px]">"{log.prompt}"</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN')} - Trạng thái: {log.status === 'applied' ? 'Đã áp dụng' : 'Đã hoàn tác'}
                      </p>
                    </div>

                    {log.status === 'applied' && (
                      <button
                        onClick={() => handleRevert(log.id)}
                        className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#8C4A26] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Hoàn tác</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

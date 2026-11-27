import React, { useState, useEffect, useRef } from 'react';
import { Gift, Sparkles, Trophy, AlertCircle, ArrowRight, CheckCircle2, RotateCw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCustomer } from '../context/CustomerContext';

interface WheelReward {
  id: number;
  label: string;
  reward_type: string;
  color: string;
  text_color: string;
  display_order: number;
}

interface SpinResult {
  id: number;
  label: string;
  reward_type: string;
  reward_value: number;
  code?: string;
  message?: string;
}

interface LuckyWheelSectionProps {
  onNavigate?: (view: string) => void;
  onOpenAccount?: () => void;
}

export const LuckyWheelSection: React.FC<LuckyWheelSectionProps> = ({ onNavigate, onOpenAccount }) => {
  const { customer, token, openAuthModal, refreshProfile } = useCustomer();
  const [isEnabled, setIsEnabled] = useState(true);
  const [rule, setRule] = useState('daily');
  const [rewards, setRewards] = useState<WheelReward[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<SpinResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API for ticking and winning sounds
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio fallback silent
    }
  };

  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {
      // Audio fallback silent
    }
  };

  // Fetch wheel public rewards
  const fetchRewards = async () => {
    try {
      const res = await fetch('/api/lucky-wheel/rewards');
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled !== false);
        setRule(data.rule || 'daily');
        if (Array.isArray(data.rewards) && data.rewards.length > 0) {
          setRewards(data.rewards);
        }
      }
    } catch (e) {
      console.warn('Không tải được cấu hình vòng quay:', e);
    }
  };

  // Fetch customer spin status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/lucky-wheel/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCanSpin(!!data.can_spin);
        setSpinsLeft(data.spins_left || 0);
        setStatusMessage(data.message || '');
      }
    } catch (e) {
      console.warn('Không kiểm tra được lượt quay:', e);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [token]);

  // Draw wheel on canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 18;
    const numSlices = rewards.length;
    const arc = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Save context for wheel rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotationAngle);

    // Cheerful slice color palette
    const defaultColors = [
      '#EF4444', '#F97316', '#F59E0B', '#10B981',
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
    ];

    // Draw slices
    for (let i = 0; i < numSlices; i++) {
      const item = rewards[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Slice sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = item.color || defaultColors[i % defaultColors.length];
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text in slice
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = item.text_color || '#FFFFFF';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;

      let text = item.label || '';
      if (text.length > 18) {
        text = text.substring(0, 16) + '...';
      }
      ctx.fillText(text, radius - 24, 0);
      ctx.restore();
    }

    // Outer golden ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = '#F5BD42';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Decorative bulb lights along outer edge
    const numBulbs = numSlices * 3;
    for (let b = 0; b < numBulbs; b++) {
      const bAngle = (b * 2 * Math.PI) / numBulbs;
      const bx = (radius + 4) * Math.cos(bAngle);
      const by = (radius + 4) * Math.sin(bAngle);

      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = b % 2 === 0 ? '#FEF08A' : '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();

    // Draw center circle hub
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(center, center, 5, center, center, 32);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F5BD42';
    ctx.stroke();

    // Center icon
    ctx.fillStyle = '#8C4A26';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', center, center);

    // Draw Top Pointer (Arrow pointing down at the wheel)
    ctx.beginPath();
    ctx.moveTo(center - 16, 4);
    ctx.lineTo(center + 16, 4);
    ctx.lineTo(center, 32);
    ctx.closePath();
    ctx.fillStyle = '#DC2626'; // Vivid red pointer
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Pointer light
    ctx.beginPath();
    ctx.arc(center, 12, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [rewards]);

  // Handle spin action
  const handleSpin = async () => {
    if (isSpinning) return;
    if (!token) {
      openAuthModal('login');
      return;
    }
    if (!canSpin) {
      alert(statusMessage || 'Hôm nay bạn đã dùng hết lượt quay. Hãy quay lại vào ngày mai nhé!');
      return;
    }

    initAudio();
    setIsSpinning(true);
    setWonReward(null);

    try {
      const res = await fetch('/api/lucky-wheel/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsSpinning(false);
        alert(data.message || 'Không thể quay thưởng lúc này. Vui lòng thử lại sau.');
        return;
      }

      const targetIndex = data.target_index ?? 0;
      const numSlices = rewards.length;
      const sliceAngle = (2 * Math.PI) / numSlices;

      // Pointer is at Top (3*PI/2 radians = 270 degrees)
      const targetCenterAngle = (targetIndex + 0.5) * sliceAngle;
      const topPointerAngle = 1.5 * Math.PI;

      const curMod = currentRotationRef.current % (2 * Math.PI);
      let diff = (topPointerAngle - targetCenterAngle) - curMod;
      while (diff < 0) diff += 2 * Math.PI;

      const fullRotations = 6 * (2 * Math.PI);
      const totalDelta = fullRotations + diff;

      const startAngle = currentRotationRef.current;
      const duration = 5200; // 5.2 seconds
      const startTime = performance.now();

      let lastTickSlice = -1;
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutCubic(progress);
        const currentAngle = startAngle + totalDelta * ease;

        currentRotationRef.current = currentAngle;
        drawWheel(currentAngle);

        const currentSliceUnderPointer = Math.floor(
          ((topPointerAngle - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle
        );
        if (currentSliceUnderPointer !== lastTickSlice) {
          lastTickSlice = currentSliceUnderPointer;
          playTickSound();
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          setCanSpin(false);
          setSpinsLeft(0);
          setWonReward(data.reward);

          playWinSound();

          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });

          refreshProfile();
          fetchStatus();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } catch (err: any) {
      setIsSpinning(false);
      alert('Đã có lỗi xảy ra khi quay thưởng. Vui lòng kiểm tra lại mạng!');
    }
  };

  // If disabled by admin, hide completely
  if (!isEnabled) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#8C4A26]/10 via-[#FFF8E8] to-[#FFF8E8] py-8 sm:py-12 border-b border-amber-200/80">
      {/* Decorative festive blur bubbles */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-4 -translate-y-1/2 w-72 h-72 bg-red-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#F5BD42] shadow-sm text-xs font-bold text-[#8C4A26]">
            <Sparkles className="w-4 h-4 text-[#F5BD42] animate-spin" />
            <span className="uppercase tracking-wide">Trò Chơi May Mắn • 100% Nhận Quà</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-[#4A2115] tracking-tight">
            🎡 VÒNG QUAY MAY MẮN BAMI
          </h2>

          <p className="text-xs sm:text-sm text-[#4A2115]/80 font-medium">
            Quay là trúng — Nhận ngay voucher giảm giá hoặc món ăn kèm nạp thẳng vào ví tài khoản của bạn!
          </p>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white text-xs text-[#8C4A26] border border-amber-200 shadow-2xs transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
              <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
            </button>

            <span className="text-[11px] font-bold text-[#8C4A26] bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-full">
              {rule === 'daily' ? 'Mỗi ngày 1 lượt quay miễn phí' : '1 lượt quay cho mỗi tài khoản'}
            </span>
          </div>
        </div>

        {/* Central Wheel Display */}
        <div className="flex flex-col items-center justify-center relative">
          
          {/* Wheel Frame */}
          <div className="relative p-3 sm:p-5 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-red-500 shadow-2xl border-4 border-amber-200 select-none">
            
            {/* Outer halo light */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 opacity-40 blur-lg animate-pulse pointer-events-none" />

            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="relative z-10 w-[290px] h-[290px] sm:w-[380px] sm:h-[380px] drop-shadow-xl cursor-pointer"
              onClick={handleSpin}
            />

            {/* Big Centered Spin Button overlay */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed scale-95'
                  : 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-[#4A2115] hover:scale-110 active:scale-95 border-3 border-white ring-4 ring-amber-400/50'
              }`}
            >
              <span className="text-sm sm:text-base leading-none">QUAY</span>
              <span className="text-[9px] sm:text-[10px] leading-tight font-extrabold opacity-90">NGAY</span>
            </button>
          </div>

          {/* Customer Status & Interactive Actions below wheel */}
          <div className="w-full max-w-md mt-6 text-center">
            {!customer ? (
              <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-300 shadow-sm space-y-2">
                <p className="text-xs text-[#4A2115] font-semibold">
                  🎁 Bạn chưa đăng nhập. Vui lòng đăng nhập bằng số điện thoại để nhận ngay 1 lượt quay miễn phí hôm nay!
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase bg-[#8C4A26] hover:bg-[#753A1B] text-white transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Đăng nhập / Đăng ký để quay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-left">
                    <span className="text-gray-500">Khách hàng: </span>
                    <strong className="text-[#4A2115]">{customer.full_name || customer.phone}</strong>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    canSpin ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {canSpin ? 'Còn 1 lượt quay' : 'Đã hết lượt hôm nay'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={isSpinning || !canSpin}
                    className={`flex-1 py-3 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide transition shadow-md flex items-center justify-center gap-2 ${
                      canSpin && !isSpinning
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white hover:scale-102 active:scale-98 animate-pulse cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'Đang quay may mắn...' : canSpin ? 'Bấm vào đây để quay ngay!' : 'Hôm nay đã quay xong'}</span>
                  </button>

                  {onOpenAccount && (
                    <button
                      type="button"
                      onClick={onOpenAccount}
                      className="py-3 px-4 rounded-xl text-xs font-bold text-[#8C4A26] bg-amber-100 hover:bg-amber-200 transition border border-amber-300 cursor-pointer shrink-0"
                      title="Xem các mã giảm giá bạn đã nhận"
                    >
                      Ví Voucher
                    </button>
                  )}
                </div>

                {!canSpin && (
                  <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Voucher của bạn đã được lưu sẵn trong ví. Bạn có thể sử dụng khi đặt món!</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reward preview badges */}
          <div className="w-full max-w-3xl mt-6 pt-4 border-t border-amber-200/60 text-center">
            <span className="text-[11px] font-bold text-[#8C4A26] uppercase tracking-wider block mb-2">
              Các phần quà hấp dẫn trong vòng quay:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rewards.map((r, i) => (
                <div
                  key={r.id || i}
                  className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-[#4A2115] border border-amber-200 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Winner Announcement Modal Dialog */}
        {wonReward && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-b from-[#8C4A26] to-[#4A2115] rounded-3xl max-w-sm w-full p-6 text-center text-white border-4 border-amber-300 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-lg mx-auto mb-3 animate-bounce">
                <Gift className="w-9 h-9 text-[#4A2115]" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                🎉 CHÚC MỪNG BẠN!
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                Bạn đã quay trúng phần quà may mắn:
              </p>

              <div className="my-4 px-4 py-3 rounded-2xl bg-white/10 border-2 border-yellow-300/80 shadow-inner">
                <div className="text-lg font-black text-yellow-300 drop-shadow">
                  {wonReward.label}
                </div>
                {wonReward.code && (
                  <div className="mt-1 text-xs font-mono font-bold bg-black/40 text-yellow-200 py-1 px-3 rounded-lg border border-yellow-300/40 inline-block">
                    Mã: {wonReward.code}
                  </div>
                )}
              </div>

              <p className="text-xs text-amber-100/90 leading-relaxed mb-5">
                {wonReward.code
                  ? '🎉 Voucher đã được tự động nạp thẳng vào Ví Voucher của bạn. Hãy đặt món ngay để được giảm giá nhé!'
                  : 'Cảm ơn bạn đã tham gia cùng Bami Sài Gòn! Chúc bạn một ngày tràn đầy năng lượng.'}
              </p>

              <div className="space-y-2">
                {onNavigate && (
                  <button
                    onClick={() => {
                      setWonReward(null);
                      onNavigate('menu');
                    }}
                    className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase bg-yellow-400 hover:bg-yellow-300 text-[#4A2115] transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đặt món dùng ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {onOpenAccount && wonReward.code && (
                  <button
                    onClick={() => {
                      setWonReward(null);
                      onOpenAccount();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white/20 hover:bg-white/30 text-white transition border border-white/30 cursor-pointer"
                  >
                    Xem Ví Voucher Của Tôi
                  </button>
                )}

                <button
                  onClick={() => setWonReward(null)}
                  className="w-full py-2 text-xs text-white/70 hover:text-white transition cursor-pointer"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

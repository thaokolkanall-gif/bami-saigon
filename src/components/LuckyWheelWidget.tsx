import React, { useState, useEffect, useRef } from 'react';
import { Gift, X, Sparkles, Trophy, AlertCircle, ArrowRight, CheckCircle2, RotateCw, Volume2, VolumeX } from 'lucide-react';
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

interface LuckyWheelWidgetProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  onOpenAccount?: () => void;
}

export const LuckyWheelWidget: React.FC<LuckyWheelWidgetProps> = ({ currentView, onNavigate, onOpenAccount }) => {
  const { customer, token, openAuthModal, refreshProfile } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);
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
  }, [token, isOpen]);

  // Draw wheel on canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;
    const numSlices = rewards.length;
    const arc = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Save context for wheel rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotationAngle);

    // Default cheerful slice color palette
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
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text in slice
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = item.text_color || '#FFFFFF';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      // Wrap or shorten text
      let text = item.label || '';
      if (text.length > 18) {
        text = text.substring(0, 16) + '...';
      }
      ctx.fillText(text, radius - 20, 0);
      ctx.restore();
    }

    // Outer golden ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#EAB308'; // Amber-500
    ctx.lineWidth = 8;
    ctx.stroke();

    // Decorative bulb lights along outer edge
    const numBulbs = numSlices * 3;
    for (let b = 0; b < numBulbs; b++) {
      const bAngle = (b * 2 * Math.PI) / numBulbs;
      const bx = (radius + 2) * Math.cos(bAngle);
      const by = (radius + 2) * Math.sin(bAngle);

      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, 2 * Math.PI);
      ctx.fillStyle = b % 2 === 0 ? '#FEF08A' : '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();

    // Draw center circle hub
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(center, center, 5, center, center, 28);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#EAB308';
    ctx.stroke();

    // Center star / icon
    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', center, center);

    // Draw Top Pointer (Arrow pointing down at the wheel)
    // Pointer is located at top (center, 10)
    ctx.beginPath();
    ctx.moveTo(center - 14, 2);
    ctx.lineTo(center + 14, 2);
    ctx.lineTo(center, 28);
    ctx.closePath();
    ctx.fillStyle = '#DC2626'; // Red pointer
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Pointer shadow dot
    ctx.beginPath();
    ctx.arc(center, 8, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
  };

  // Re-draw whenever canvas, rewards, or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        drawWheel(currentRotationRef.current);
      }, 50);
    }
  }, [isOpen, rewards]);

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

      // Pointer is at Top (3*PI/2 or -PI/2 radians = 270 degrees)
      // When wheel rotation is R, slice i center is at angle i * sliceAngle + sliceAngle/2
      // We want: (targetIndex + 0.5) * sliceAngle + R = 3 * Math.PI / 2 (mod 2*PI)
      // So R = 3*Math.PI/2 - (targetIndex + 0.5) * sliceAngle (mod 2*PI)
      const targetCenterAngle = (targetIndex + 0.5) * sliceAngle;
      const topPointerAngle = 1.5 * Math.PI; // 270 degrees

      // Current normalized angle
      const curMod = currentRotationRef.current % (2 * Math.PI);
      let diff = (topPointerAngle - targetCenterAngle) - curMod;
      while (diff < 0) diff += 2 * Math.PI;

      // Add 6 full spins (12 * Math.PI) for high-speed excitement
      const fullRotations = 6 * (2 * Math.PI);
      const totalDelta = fullRotations + diff;

      const startAngle = currentRotationRef.current;
      const endAngle = startAngle + totalDelta;
      const duration = 5200; // 5.2 seconds
      const startTime = performance.now();

      let lastTickSlice = -1;

      // Ease out cubic function for smooth, realistic deceleration
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutCubic(progress);
        const currentAngle = startAngle + totalDelta * ease;

        currentRotationRef.current = currentAngle;
        drawWheel(currentAngle);

        // Sound trigger when wheel passes each slice boundary
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
          // Animation finished!
          setIsSpinning(false);
          setCanSpin(false);
          setSpinsLeft(0);
          setWonReward(data.reward);

          playWinSound();

          // Confetti celebration
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });

          // Refresh user context so new voucher is instantly visible
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

  // Do not render anything if the feature is completely disabled by admin or on home page (where wheel is already displayed large)
  if (!isEnabled) return null;
  if (currentView === 'home' && !isOpen) return null;

  return (
    <>
      {/* Floating Action Button (Fixed Left-Bottom) */}
      <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40">
        <button
          onClick={() => {
            initAudio();
            setIsOpen(true);
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-amber-200"
          title="Vòng Quay May Mắn - 100% Trúng Quà"
        >
          {/* Pulsing glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-red-500 opacity-60 blur-sm group-hover:opacity-100 transition animate-pulse pointer-events-none" />

          {/* Rotating wheel icon */}
          <div className="relative w-8 h-8 flex items-center justify-center bg-white/20 rounded-full">
            <RotateCw className="w-5 h-5 text-yellow-200 group-hover:rotate-180 transition-transform duration-700" />
            <Gift className="w-3.5 h-3.5 absolute text-white" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black uppercase tracking-wider text-yellow-200 drop-shadow flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" /> Vòng Quay May Mắn
            </span>
            <span className="text-[11px] font-medium text-white/95 drop-shadow">
              100% Có Quà • Miễn Phí!
            </span>
          </div>

          {/* Badge indicator */}
          {customer && canSpin && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white text-[9px] font-bold text-white items-center justify-center">
                1
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Main Wheel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-amber-600 via-orange-600 to-red-700 rounded-3xl shadow-2xl border-4 border-amber-300 p-4 sm:p-6 text-white overflow-hidden max-h-[95vh] flex flex-col justify-between">
            {/* Background festive stars */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10 mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                  title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/70" />}
                </button>
                <div className="inline-flex items-center gap-1.5 bg-amber-400/30 px-3 py-1 rounded-full text-xs font-bold text-yellow-100 border border-amber-300/40">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  {rule === 'daily' ? 'Mỗi ngày 1 lượt miễn phí' : '1 lượt quay tài khoản'}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isSpinning) setIsOpen(false);
                }}
                disabled={isSpinning}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div className="text-center relative z-10 mb-3">
              <h2 className="text-xl sm:text-2xl font-black text-yellow-300 tracking-wide uppercase drop-shadow-md flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
                Vòng Quay May Mắn
              </h2>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                Quay là trúng • Voucher tự nạp ngay vào ví của bạn!
              </p>
            </div>

            {/* Canvas Wheel Area */}
            <div className="relative flex items-center justify-center my-1 select-none">
              <canvas
                ref={canvasRef}
                width={330}
                height={330}
                className="max-w-[280px] max-h-[280px] sm:max-w-[320px] sm:max-h-[320px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              />

              {/* Big Center Spin Button overlay */}
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full font-black text-sm uppercase tracking-wider shadow-lg flex flex-col items-center justify-center transition-transform active:scale-90 ${
                  isSpinning
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-b from-yellow-300 to-amber-500 text-red-900 hover:scale-110 border-2 border-white cursor-pointer'
                }`}
              >
                <span className="text-base sm:text-lg leading-none">QUAY</span>
                <span className="text-[9px] leading-tight font-bold opacity-80">NGAY</span>
              </button>
            </div>

            {/* Status & Bottom Action Area */}
            <div className="mt-3 relative z-10 text-center">
              {!customer ? (
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                  <p className="text-xs text-amber-100 mb-2">
                    Vui lòng đăng nhập bằng số điện thoại để nhận ngay 1 lượt quay miễn phí!
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full py-2 px-4 rounded-xl font-bold text-xs uppercase bg-yellow-400 text-red-900 hover:bg-yellow-300 transition shadow flex items-center justify-center gap-1.5"
                  >
                    Đăng nhập / Đăng ký ngay
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/20 flex items-center justify-between gap-2">
                  <div className="text-left text-xs">
                    <div className="font-semibold text-yellow-200">
                      Khách hàng: <span className="text-white">{customer.full_name || customer.phone}</span>
                    </div>
                    <div className="text-[11px] text-amber-100 flex items-center gap-1 mt-0.5">
                      {canSpin ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span>Bạn đang có <b className="text-yellow-300">1 lượt quay</b> hôm nay!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>Đã quay hôm nay. Hẹn gặp lại bạn vào ngày mai!</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={isSpinning || !canSpin}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition shadow shrink-0 ${
                      canSpin && !isSpinning
                        ? 'bg-yellow-400 text-red-900 hover:bg-yellow-300 animate-pulse'
                        : 'bg-white/20 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {isSpinning ? 'Đang quay...' : canSpin ? 'Quay ngay' : 'Đã hết lượt'}
                  </button>
                </div>
              )}
            </div>

            {/* Winner Announcement Popup */}
            {wonReward && (
              <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg mb-3 animate-bounce">
                  <Gift className="w-9 h-9" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-yellow-300 uppercase tracking-wide">
                  Chúc Mừng Bạn!
                </h3>
                <p className="text-xs text-gray-200 mt-1 max-w-xs">
                  Bạn đã quay trúng phần quà may mắn:
                </p>

                <div className="my-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 border-2 border-yellow-300 shadow-xl max-w-xs w-full">
                  <div className="text-lg font-black text-white drop-shadow">
                    {wonReward.label}
                  </div>
                  {wonReward.code && (
                    <div className="mt-1 text-xs font-mono font-bold bg-black/30 text-yellow-200 py-1 px-2 rounded border border-yellow-200/40 inline-block">
                      Mã: {wonReward.code}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-amber-200/90 max-w-xs leading-relaxed mb-4">
                  {wonReward.code
                    ? '🎉 Voucher đã được tự động lưu vào ví của bạn. Bạn có thể áp dụng ngay khi đặt món!'
                    : 'Cảm ơn bạn đã tham gia cùng Bami Sài Gòn! Chúc bạn ngày mới vui vẻ.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setWonReward(null);
                        onNavigate('menu');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase bg-yellow-400 text-red-900 hover:bg-yellow-300 transition shadow flex items-center justify-center gap-1.5"
                    >
                      Đặt món dùng ngay
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onOpenAccount && wonReward.code && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setWonReward(null);
                        onOpenAccount();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white/20 text-white hover:bg-white/30 transition border border-white/30"
                    >
                      Xem Ví Voucher
                    </button>
                  )}

                  <button
                    onClick={() => setWonReward(null)}
                    className="w-full py-2 px-4 rounded-xl text-xs text-white/70 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

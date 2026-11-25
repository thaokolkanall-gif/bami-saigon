import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface DeliveryMapPickerProps {
  storeLat: number;
  storeLng: number;
  storeAddress: string;
  baseFee: number;
  baseKm: number;
  feePerKm: number;
  maxKm: number;
  freeKm?: number;
  formulaDesc?: string;
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (data: {
    lat: number;
    lng: number;
    distanceKm: number;
    shippingFee: number;
    suggestedAddress?: string;
    isOutOfRange: boolean;
  }) => void;
}

// Helper: Haversine distance in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const DeliveryMapPicker: React.FC<DeliveryMapPickerProps> = ({
  storeLat,
  storeLng,
  storeAddress,
  baseFee,
  baseKm,
  feePerKm,
  maxKm,
  freeKm = 0,
  formulaDesc = '',
  initialLat,
  initialLng,
  onLocationChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number }>(() => ({
    lat: initialLat || (storeLat + 0.015),
    lng: initialLng || (storeLng + 0.015)
  }));

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(baseFee);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Compute fee from distance
  const computeFee = (dist: number) => {
    const outOfRange = dist > maxKm;
    let fee = baseFee;
    if (freeKm > 0 && dist <= freeKm) {
      fee = 0;
    } else if (dist > baseKm) {
      const extraKm = Math.ceil(dist - baseKm);
      fee = baseFee + extraKm * feePerKm;
    }
    return { fee, outOfRange };
  };

  // Update customer location
  const updatePosition = (lat: number, lng: number, suggestedAddress?: string) => {
    setCustomerPos({ lat, lng });
    const dist = calculateHaversineKm(storeLat, storeLng, lat, lng);
    setDistanceKm(dist);

    const { fee, outOfRange } = computeFee(dist);
    setShippingFee(fee);
    setIsOutOfRange(outOfRange);

    onLocationChange({
      lat,
      lng,
      distanceKm: dist,
      shippingFee: fee,
      suggestedAddress,
      isOutOfRange: outOfRange
    });

    // Update map marker & line
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([lat, lng]);
    }
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        [storeLat, storeLng],
        [lat, lng]
      ]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
  };

  // Reverse Geocode from Coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          updatePosition(lat, lng, data.display_name);
        }
      }
    } catch (e) {
      // Keep coordinates
    }
  };

  // Search Address
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const q = `${searchQuery.trim()}, Hồ Chí Minh, Việt Nam`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updatePosition(lat, lng, data[0].display_name);
        } else {
          alert('Không tìm thấy địa chỉ này trên bản đồ. Bạn có thể nhấn trực tiếp lên bản đồ để chọn vị trí giao hàng.');
        }
      }
    } catch (err) {
      alert('Lỗi kết nối khi tìm kiếm địa chỉ.');
    } finally {
      setIsSearching(false);
    }
  };

  // GPS Geolocation
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        alert('Không thể lấy vị trí hiện tại. Bạn vui lòng bấm trực tiếp lên bản đồ để chọn vị trí giao bánh.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([storeLat, storeLng], 14);
    mapInstanceRef.current = map;

    // OpenStreetMap Tiles (Fast, 100% Free, Reliable)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Custom Icons
    const storeIcon = L.divIcon({
      html: `
        <div style="background-color: #8C4A26; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid #F5BD42; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          🥖
        </div>
      `,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const customerIcon = L.divIcon({
      html: `
        <div style="background-color: #E11D48; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: bounce 1s infinite alternate;">
          📍
        </div>
      `,
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    // 1. Store Marker
    const storeMarker = L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);
    storeMarker.bindPopup(`<b>Bami Sài Gòn</b><br/>${storeAddress}`).openPopup();

    // 2. Customer Marker (Draggable)
    const customerMarker = L.marker([customerPos.lat, customerPos.lng], {
      icon: customerIcon,
      draggable: true
    }).addTo(map);
    customerMarkerRef.current = customerMarker;

    // 3. Polyline between store & customer
    const polyline = L.polyline(
      [
        [storeLat, storeLng],
        [customerPos.lat, customerPos.lng]
      ],
      { color: '#8C4A26', weight: 3, dashArray: '6, 8', opacity: 0.8 }
    ).addTo(map);
    routeLineRef.current = polyline;

    // Calculate initial distance & fee
    const initialDist = calculateHaversineKm(storeLat, storeLng, customerPos.lat, customerPos.lng);
    setDistanceKm(initialDist);
    const { fee, outOfRange } = computeFee(initialDist);
    setShippingFee(fee);
    setIsOutOfRange(outOfRange);

    onLocationChange({
      lat: customerPos.lat,
      lng: customerPos.lng,
      distanceKm: initialDist,
      shippingFee: fee,
      isOutOfRange
    });

    // Event: Click on map to pick location
    map.on('click', (e: L.LeafLMouseEvent) => {
      const { lat, lng } = e.latlng;
      reverseGeocode(lat, lng);
    });

    // Event: Drag customer marker
    customerMarker.on('dragend', () => {
      const pos = customerMarker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${customerPos.lat},${customerPos.lng}&destination=${storeLat},${storeLng}`;

  return (
    <div className="space-y-3">
      
      {/* Search & GPS Tool Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchAddress} className="flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên đường, phường để tìm trên bản đồ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:border-[#8C4A26]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3.5 py-2 bg-[#8C4A26] hover:bg-[#753A1B] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            {isSearching ? 'Đang tìm...' : 'Tìm vị trí'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGetGPS}
          disabled={isLocating}
          className="px-3.5 py-2 bg-[#F5BD42] hover:bg-[#E5AC32] text-[#4A2115] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Đang định vị...' : 'Vị trí của tôi (GPS)'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm h-64 sm:h-72 bg-amber-50">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Guidance Tooltip */}
        <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-amber-300 text-[11px] font-bold text-[#4A2115] shadow-xs">
          👉 Nhấp lên bản đồ hoặc kéo ghim đỏ 📍 để chọn đúng vị trí nhận bánh
        </div>

        {/* Google Maps link */}
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-2 right-2 z-20 bg-white/95 hover:bg-white text-blue-700 px-2.5 py-1 rounded-lg border border-gray-300 text-[11px] font-bold shadow-md flex items-center gap-1"
        >
          <span>Mở Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Live Distance & Fee Calculation Result Box */}
      <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
        isOutOfRange 
          ? 'bg-rose-50 border-rose-300 text-rose-800' 
          : 'bg-[#FFF8E8] border-[#F5BD42] text-[#4A2115]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm">
              🛵 Khoảng cách: <span className="text-[#8C4A26] font-black">{distanceKm} km</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="font-extrabold text-sm">
              Phí giao hàng: {shippingFee === 0 ? (
                <span className="text-emerald-700 font-black">Miễn phí giao hàng (0đ)</span>
              ) : (
                <span className="text-[#8C4A26] font-black">{shippingFee.toLocaleString('vi-VN')}đ</span>
              )}
            </span>
          </div>

          <span className="text-[10px] text-gray-500 font-medium">
            {formulaDesc ? (
              <span>(Công thức: {formulaDesc})</span>
            ) : (
              <span>(Công thức: {freeKm > 0 ? `Dưới ${freeKm} km: Miễn phí | ` : ''}{baseFee.toLocaleString('vi-VN')}đ cho {baseKm} km đầu + {feePerKm.toLocaleString('vi-VN')}đ/km tiếp theo)</span>
            )}
          </span>
        </div>

        {isOutOfRange && (
          <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 pt-1 border-t border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Khoảng cách ({distanceKm} km) vượt quá bán kính giao hàng tối đa của quán ({maxKm} km). Quý khách vui lòng chọn Nhận tại quán hoặc gọi hotline!</span>
          </p>
        )}
      </div>

    </div>
  );
};

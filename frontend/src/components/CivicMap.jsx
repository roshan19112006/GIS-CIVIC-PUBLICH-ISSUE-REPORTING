import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Flame, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import issueService from '../services/issueService';

// Status color mapping for Leaflet SVG pin markers
const statusColors = {
  pending: '#F59E0B',     // Amber
  assigned: '#3B82F6',    // Blue
  in_progress: '#8B5CF6', // Purple
  resolved: '#10B981',   // Emerald
  closed: '#64748B',     // Slate
  reopened: '#EF4444'     // Red
};

// Create custom colored SVG marker icon
const createMarkerIcon = (status = 'pending', isPulsing = false) => {
  const color = statusColors[status] || '#3B82F6';
  const pulseClass = isPulsing ? 'pulsing-marker' : '';

  const html = `
    <div class="custom-marker-pin ${pulseClass}" style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export const CivicMap = ({
  center = [13.0827, 80.2707], // Default Chennai Ripon Building / GCC Center
  zoom = 12,
  markers = [],
  selectedLocation = null,
  onLocationSelect = null,
  interactiveSelection = false,
  showHeatmapToggle = false,
  height = '500px',
  onMarkerClick = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const selectionMarkerRef = useRef(null);
  const heatmapLayerRef = useRef(null);

  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false // Custom controls
      });

      // OpenStreetMap standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Layers group for complaint markers
      const markerGroup = L.featureGroup().addTo(map);
      markersLayerRef.current = markerGroup;

      // Click event for selecting location
      if (interactiveSelection) {
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          if (onLocationSelect) {
            onLocationSelect({ lat, lng, type: 'map_click' });
          }
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & zoom if changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center?.[0], center?.[1], zoom]);

  // Handle selected location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      const latlng = [selectedLocation.lat, selectedLocation.lng];

      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.setLatLng(latlng);
      } else {
        const marker = L.marker(latlng, {
          icon: createMarkerIcon('reopened', true),
          zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-2 text-xs font-sans">
            <b class="text-rose-600 block mb-1">Selected Location</b>
            <div>Lat: ${selectedLocation.lat.toFixed(6)}</div>
            <div>Lng: ${selectedLocation.lng.toFixed(6)}</div>
          </div>
        `).openPopup();

        selectionMarkerRef.current = marker;
      }

      map.panTo(latlng, { animate: true });
    } else if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }
  }, [selectedLocation]);

  // Update complaint markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markersLayerRef.current;
    if (!map || !markerGroup) return;

    markerGroup.clearLayers();

    if (isHeatmapActive) {
      // Render heatmap canvas overlay
      renderHeatmapOverlay(markers, map);
      return;
    } else {
      clearHeatmapOverlay();
    }

    if (Array.isArray(markers) && markers.length > 0) {
      markers.forEach((issue) => {
        const lat = parseFloat(issue.latitude || issue.lat);
        const lng = parseFloat(issue.longitude || issue.lng);

        if (isNaN(lat) || isNaN(lng)) return;

        const marker = L.marker([lat, lng], {
          icon: createMarkerIcon(issue.status || 'pending', issue.priority === 'urgent')
        });

        const statusPillColor = statusColors[issue.status] || '#3B82F6';
        const thumbnailHtml = issue.thumbnail_url
          ? `<img src="${issueService.getImageUrl(issue.thumbnail_url)}" alt="Complaint" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />`
          : '';

        const popupContent = `
          <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 220px; max-width: 260px; padding: 4px;">
            ${thumbnailHtml}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">${issue.ticket_id || 'TICKET'}</span>
              <span style="background-color: ${statusPillColor}20; color: ${statusPillColor}; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: capitalize;">
                ${(issue.status || 'pending').replace('_', ' ')}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3;">
              ${issue.title || 'Civic Issue'}
            </h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569; line-height: 1.3;">
              ${issue.category_name || 'Municipal Issue'} ${issue.ward_name ? '• ' + issue.ward_name : ''}
            </p>
            ${issue.address ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">📍 ${issue.address}</div>` : ''}
            <a href="/issues/${issue.id}" style="
              display: block;
              text-align: center;
              background-color: #026fc7;
              color: #ffffff;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              text-decoration: none;
            ">View Issue Details &rarr;</a>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(issue));
        }

        markerGroup.addLayer(marker);
      });
    }
  }, [markers, isHeatmapActive]);

  // Heatmap Canvas Overlay generator (custom fallback or canvas circles)
  const renderHeatmapOverlay = (items, map) => {
    clearHeatmapOverlay();
    const circles = [];

    items.forEach((issue) => {
      const lat = parseFloat(issue.latitude || issue.lat);
      const lng = parseFloat(issue.longitude || issue.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const weight = issue.priority === 'urgent' ? 0.8 : issue.priority === 'high' ? 0.6 : 0.4;
      const radius = issue.priority === 'urgent' ? 450 : 300;

      const circle = L.circle([lat, lng], {
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: weight * 0.4,
        radius: radius,
        weight: 1
      }).addTo(map);

      circles.push(circle);
    });

    heatmapLayerRef.current = circles;
  };

  const clearHeatmapOverlay = () => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.forEach((c) => c.remove());
      heatmapLayerRef.current = null;
    }
  };

  // Browser Geolocation
  const handleCaptureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoLoading(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16);
        }

        if (onLocationSelect) {
          onLocationSelect({ lat, lng, type: 'gps' });
        }
      },
      (err) => {
        setGeoLoading(false);
        let msg = 'Failed to retrieve location.';
        if (err.code === 1) msg = 'Location access permission denied.';
        else if (err.code === 2) msg = 'Position unavailable.';
        else if (err.code === 3) msg = 'Geolocation request timed out.';
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height }}>
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Geolocation Button */}
        <button
          type="button"
          onClick={handleCaptureCurrentLocation}
          disabled={geoLoading}
          className="bg-white hover:bg-slate-50 text-slate-700 p-2.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 text-xs font-semibold transition active:scale-95"
          title="Detect Current Location via GPS"
        >
          <Navigation className={`w-4 h-4 text-civic-600 ${geoLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{geoLoading ? 'Locating...' : 'Use GPS Location'}</span>
        </button>

        {/* Heatmap Toggle */}
        {showHeatmapToggle && (
          <button
            type="button"
            onClick={() => setIsHeatmapActive(!isHeatmapActive)}
            className={`p-2.5 rounded-lg shadow-md border flex items-center gap-1.5 text-xs font-semibold transition ${
              isHeatmapActive
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Toggle Issue Density Heatmap"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">{isHeatmapActive ? 'Heatmap: ON' : 'Heatmap'}</span>
          </button>
        )}

        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 hover:bg-slate-50 text-slate-700 border-b border-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 hover:bg-slate-50 text-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Geolocation Error Alert */}
      {geoError && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-lg shadow-md flex items-center justify-between gap-3">
          <span>⚠️ {geoError}</span>
          <button onClick={() => setGeoError(null)} className="text-rose-900 font-bold">&times;</button>
        </div>
      )}

      {/* Legend overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-[11px] hidden md:flex items-center gap-3 text-slate-700">
        <span className="font-semibold text-slate-900">Status:</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pending</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Assigned</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> In Progress</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Resolved</span>
      </div>
    </div>
  );
};

export default CivicMap;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Compass, 
  Info, 
  ThumbsUp, 
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Locate,
  Flame
} from 'lucide-react';
import { CivicIssue, IssueCategory, IssueStatus } from '../types';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

interface InteractiveMapProps {
  issues: CivicIssue[];
  onUpvoteIssue: (id: string) => void;
  onSelectIssue: (issue: CivicIssue) => void;
}

// Distance helper (Haversine formula)
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

const getDaysOpen = (dateStr: string) => {
  try {
    const created = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  } catch {
    return 3;
  }
};

// Deck.gl Heatmap component matching CF7 and standard overlay patterns
function DeckGlHeatmap({ issues, visible }: { issues: CivicIssue[]; visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible) return;

    const data = issues
      .filter(i => i.gps && i.gps.lat && i.gps.lng)
      .map(i => [i.gps!.lng, i.gps!.lat]);

    const layer = new HeatmapLayer({
      id: 'heatmap-layer',
      data,
      getPosition: (d: any) => d,
      getWeight: () => 1,
      radiusPixels: 45,
      intensity: 1.5,
      threshold: 0.05,
    });

    const overlay = new GoogleMapsOverlay({
      layers: [layer],
    });

    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
    };
  }, [map, visible, issues]);

  return null;
}

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  props: { children: React.ReactNode };
  state: { hasError: boolean; error: Error | null } = {
    hasError: false,
    error: null
  };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Google Maps rendering error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-white p-6 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xs">
            ⚠️
          </div>
          <div className="space-y-1 px-4">
            <h4 className="text-xs font-black text-gray-900">Map Interface Suspended</h4>
            <p className="text-[10px] text-gray-500 leading-normal max-w-xs mx-auto">
              The map interface crashed during rendering. This is usually caused by an inactive **Maps JavaScript API** on your Google Cloud Console project or missing Map ID credentials.
            </p>
          </div>

          <div className="w-full max-w-[320px] bg-red-50/70 border border-red-100 rounded-xl p-3 text-left text-[9px] text-red-800 font-mono leading-relaxed max-h-24 overflow-y-auto">
            <span className="font-extrabold uppercase text-[8px] text-red-600 block mb-0.5">Console Exception:</span>
            {this.state.error?.message || "ApiNotActivatedMapError / Invalid Marker"}
          </div>

          <div className="text-[9px] text-[#1a73e8] font-bold bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 max-w-xs">
            💡 **Quick Fix:** In your Google Cloud Console, search for **"Maps JavaScript API"** and click **Enable** to activate maps on your API Key!
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function InteractiveMap({
  issues,
  onUpvoteIssue,
  onSelectIssue
}: InteractiveMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'All'>('All');
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // User location tracking (defaults to Bhubaneswar, India)
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number}>({ 
    lat: 20.2961, 
    lng: 85.8245 
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Auto-detect browser geolocation on load
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation access failed:', error.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Filter issues to display on map
  const filteredIssues = issues.filter(issue => {
    const matchCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchStatus = selectedStatus === 'All' || issue.status === selectedStatus;
    const hasGps = Boolean(issue.gps && issue.gps.lat && issue.gps.lng);
    return matchCategory && matchStatus && hasGps;
  });

  // Calculate nearby issues within 500 meters of current userLocation
  const nearbyIssues = issues.filter(issue => {
    if (!issue.gps) return false;
    const dist = getDistanceInMeters(issue.gps.lat, issue.gps.lng, userLocation.lat, userLocation.lng);
    return dist <= 500;
  });

  const activeIssue = issues.find(i => i.id === activePinId);

  const getMarkerColor = (severity: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (severity) {
      case 'Critical': return '#ea4335'; // Red
      case 'High': return '#ff6d01'; // Orange
      case 'Medium': return '#fbbc05'; // Yellow
      case 'Low': return '#34a853'; // Green
      default: return '#70757a';
    }
  };

  const getCategoryEmoji = (category: IssueCategory) => {
    switch (category) {
      case 'Pothole': return '🕳️';
      case 'Water Leakage': return '💧';
      case 'Damaged Streetlight': return '💡';
      case 'Waste Dumping': return '🗑️';
      case 'Broken Footpath': return '🧱';
      case 'Flooding': return '🌊';
      case 'Other': return '📌';
      default: return '📌';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden max-w-lg mx-auto flex flex-col h-[700px]">
      
      {/* 1. Map Header & Toggles */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-[#1a73e8] animate-spin" style={{ animationDuration: '8s' }} />
            <span>Interactive Ward Map</span>
          </h3>
          <div className="flex items-center space-x-2">
            {/* Heatmap Layer Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1 border transition ${
                showHeatmap 
                  ? 'bg-amber-500 border-amber-600 text-white shadow-xs' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
            </button>
            <span className="text-[10px] bg-green-50 border border-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              <span>Bhubaneswar Ward 42</span>
            </span>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="space-y-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition ${
                selectedCategory === 'All' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Types
            </button>
            {(['Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Dumping', 'Broken Footpath', 'Flooding', 'Other'] as IssueCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition flex items-center space-x-1 ${
                  selectedCategory === cat
                    ? 'bg-[#1a73e8] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{getCategoryEmoji(cat)}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0">Status:</span>
              {(['All', 'Open', 'In Progress', 'Resolved'] as (IssueStatus | 'All')[]).map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    selectedStatus === st
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Manual Recenter Button */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  setIsLocating(true);
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setIsLocating(false);
                  }, () => setIsLocating(false));
                }
              }}
              className="text-[10px] font-bold text-blue-600 flex items-center space-x-1 hover:underline"
            >
              <Locate className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Center on Me</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Embedded Google Map with Map Viewport */}
      <div className="flex-1 bg-sky-50/10 relative overflow-hidden min-h-[250px]">
        <MapErrorBoundary>
          <Map
            defaultCenter={{ lat: 20.2961, lng: 85.8245 }}
            center={userLocation}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            gestureHandling={'cooperative'}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              scaleControl: true,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            }}
          >
            {/* Deck.gl heatmap integration */}
            <DeckGlHeatmap issues={issues} visible={showHeatmap} />

            {/* User Current Location Marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation} title="Your Location">
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></span>
                  <span className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></span>
                </div>
              </AdvancedMarker>
            )}

            {/* Plot all filtered issues as custom colored AdvancedMarkers */}
            {filteredIssues.map((issue) => {
              if (!issue.gps) return null;
              const color = getMarkerColor(issue.severity);
              const isActive = activePinId === issue.id;

              return (
                <AdvancedMarker
                  key={issue.id}
                  position={{ lat: issue.gps.lat, lng: issue.gps.lng }}
                  title={issue.title}
                  onClick={() => setActivePinId(issue.id)}
                >
                  <Pin 
                    background={color} 
                    borderColor={isActive ? '#111827' : '#ffffff'} 
                    glyphColor="#ffffff" 
                    scale={isActive ? 1.25 : 1.0}
                  >
                    <span className="text-xs leading-none select-none">{getCategoryEmoji(issue.category)}</span>
                  </Pin>
                </AdvancedMarker>
              );
            })}

            {/* Google Maps InfoWindow popup card */}
            {activePinId && activeIssue && activeIssue.gps && (
              <InfoWindow
                position={{ lat: activeIssue.gps.lat, lng: activeIssue.gps.lng }}
                onCloseClick={() => setActivePinId(null)}
              >
                <div className="p-1 min-w-[200px] max-w-[220px] text-gray-800 space-y-2">
                  <img 
                    src={activeIssue.photoUrl} 
                    alt={activeIssue.title} 
                    className="w-full h-20 rounded-lg object-cover border border-gray-150"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getMarkerColor(activeIssue.severity) }}
                      >
                        {activeIssue.category}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 shrink-0">
                        ⏳ {getDaysOpen(activeIssue.date)}d open
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-gray-950 leading-tight">
                      {activeIssue.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
                      {activeIssue.description}
                    </p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[10px] font-bold">
                      <span className="text-blue-600 flex items-center space-x-0.5">
                        <span>👍</span>
                        <span>{activeIssue.upvotes} upvotes</span>
                      </span>
                      <span className={`flex items-center space-x-1 ${
                        activeIssue.status === 'Resolved' ? 'text-green-600' : activeIssue.status === 'In Progress' ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{activeIssue.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </MapErrorBoundary>
      </div>

      {/* 3. Collapsible / Scrollable "Nearby Issues" within 500m Section */}
      <div className="bg-gray-50 border-t border-gray-100 p-3 max-h-[140px] overflow-y-auto scrollbar-none shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span>Nearby Issues (Within 500m)</span>
          </span>
          <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-full">
            {nearbyIssues.length} found
          </span>
        </div>

        {nearbyIssues.length > 0 ? (
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {nearbyIssues.map(issue => {
              const distance = getDistanceInMeters(issue.gps!.lat, issue.gps!.lng, userLocation.lat, userLocation.lng);
              const isSelected = activePinId === issue.id;

              return (
                <button
                  key={issue.id}
                  onClick={() => {
                    setActivePinId(issue.id);
                    if (issue.gps) {
                      setUserLocation({ lat: issue.gps.lat, lng: issue.gps.lng });
                    }
                  }}
                  className={`p-2 rounded-xl text-left border shrink-0 w-48 transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-white border-blue-500 shadow-xs ring-2 ring-blue-100' 
                      : 'bg-white border-gray-150 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold truncate text-gray-700">
                        {getCategoryEmoji(issue.category)} {issue.category}
                      </span>
                      <span className="text-[9px] text-blue-600 font-extrabold shrink-0">
                        {Math.round(distance)}m away
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-900 truncate leading-tight">
                      {issue.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 w-full">
                    <span className="text-[9px] font-bold text-gray-400">
                      👍 {issue.upvotes} validations
                    </span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      issue.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-[10px] font-bold text-gray-400">No reported issues found within 500m of your location.</p>
            <p className="text-[9px] text-gray-300 mt-0.5">Use "Center on Me" or report a new issue to view here!</p>
          </div>
        )}
      </div>

      {/* 4. Floating Overlay Card for selected Pin */}
      <div className="bg-white border-t border-gray-100 p-3 h-[125px] flex items-center justify-center shrink-0">
        {activeIssue ? (
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150 flex space-x-3 w-full transition-all">
            {/* Issue Image */}
            <img 
              src={activeIssue.photoUrl} 
              alt={activeIssue.title} 
              className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
              referrerPolicy="no-referrer"
            />

            {/* Issue Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  {/* Category and Severity */}
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white`}
                    style={{ backgroundColor: getMarkerColor(activeIssue.severity) }}
                  >
                    {activeIssue.category}
                  </span>

                  {/* Status Indicator */}
                  <span className={`text-[9px] font-extrabold flex items-center space-x-1 ${
                    activeIssue.status === 'Resolved' ? 'text-green-600' : activeIssue.status === 'In Progress' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {activeIssue.status === 'Resolved' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{activeIssue.status}</span>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-gray-900 mt-1 truncate">
                  {activeIssue.title}
                </h4>
                <p className="text-[9px] text-gray-500 truncate leading-snug">
                  📍 {activeIssue.location} • ⏳ {getDaysOpen(activeIssue.date)} days open
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200/50">
                {/* Upvote Button */}
                <button
                  onClick={() => onUpvoteIssue(activeIssue.id)}
                  className={`flex items-center space-x-1 text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                    activeIssue.hasUpvoted 
                      ? 'bg-blue-100 text-[#1a73e8]' 
                      : 'bg-gray-150 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ThumbsUp className={`w-2.5 h-2.5 ${activeIssue.hasUpvoted ? 'fill-blue-500' : ''}`} />
                  <span>{activeIssue.upvotes} {activeIssue.hasUpvoted ? 'Validated' : 'Validate'}</span>
                </button>

                {/* Inspect Details */}
                <button
                  onClick={() => onSelectIssue(activeIssue)}
                  className="text-[9px] text-[#1a73e8] font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>Verify Feed</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 space-y-0.5 py-2">
            <MapPin className="w-5 h-5 text-gray-300 mx-auto animate-bounce" />
            <p className="text-[10px] font-bold text-gray-500">Tap any marker on the map</p>
            <p className="text-[9px]">Select a community street issue to validate and view status</p>
          </div>
        )}
      </div>

    </div>
  );
}

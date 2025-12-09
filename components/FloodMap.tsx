
import React, { useState, useRef } from 'react';
import { Reservoir, River, SimulationState, CityProfile } from '../types';
import { HISTORICAL_EVENTS } from '../constants';
import { Map as MapIcon, Activity, Layers, ZoomIn, ZoomOut, Navigation, Zap, Globe, ExternalLink, CloudLightning, MapPin, AlertTriangle, X, Clock, Calendar } from 'lucide-react';

interface FloodMapProps {
  reservoirs: Reservoir[];
  rivers: River[];
  simulationState: SimulationState;
  cityProfile: CityProfile;
}

const FloodMap: React.FC<FloodMapProps> = ({ reservoirs, rivers, simulationState, cityProfile }) => {
  const [viewMode, setViewMode] = useState<'schematic' | 'geo' | 'external' | 'forecast' | 'historical'>('geo');
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [activeBottleneck, setActiveBottleneck] = useState<{x: number, y: number, name: string} | null>(null);
  const [activeHistoricalIndex, setActiveHistoricalIndex] = useState(0);
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Dynamic visual calculations based on simulation
  const rainIntensity = simulationState.rainfallIntensityMmHr;
  
  // --- INTERACTION HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(0.5, Math.min(4, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a bottleneck
    if ((e.target as Element).closest('.bottleneck-marker')) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    setActiveBottleneck(null); // Deselect on map click
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- HELPER: Bottleneck Coordinates ---
  const getBottleneckCoords = (rIdx: number, bIdx: number, mode: string) => {
    if (mode === 'schematic') {
        // Map to the schematic lines
        // River 0 (Primary): 230,150 -> 500,280
        if (rIdx === 0) return bIdx === 0 ? { x: 300, y: 185 } : { x: 450, y: 255 };
        // River 1 (Secondary): 280,300 -> 550,520
        if (rIdx === 1) return bIdx === 0 ? { x: 500, y: 480 } : { x: 350, y: 360 }; 
        return null;
    }
    // Geo/Forecast Mode Coords (Approximate along the SVG curves)
    // River 0: M100,300 ... T860,250
    if (rIdx === 0) return bIdx === 0 ? { x: 300, y: 340 } : { x: 700, y: 265 };
    // River 1: M150,550 ... T860,500
    if (rIdx === 1) return bIdx === 0 ? { x: 780, y: 505 } : { x: 400, y: 570 };
    // River 2 (Canal): M750,50 ... L780,800
    if (rIdx === 2) return { x: 780, y: 250 };
    return null;
  };

  // --- STYLING HELPERS ---
  const getRoadStatusColor = (vulnerability: 'low' | 'medium' | 'high') => {
    if (viewMode === 'historical') {
       // Historical road status simple logic based on current event rainfall
       const currentEvent = HISTORICAL_EVENTS[activeHistoricalIndex];
       if (currentEvent.rainfall > 100) return vulnerability === 'high' ? '#ef4444' : '#f97316';
       if (currentEvent.rainfall > 50) return vulnerability === 'high' ? '#f97316' : '#334155';
       return '#334155';
    }

    if (rainIntensity < 20) return '#334155'; // Dark slate (Normal traffic)
    
    if (vulnerability === 'high') {
       if (rainIntensity > 30) return '#ef4444'; // Red (Flooded)
       if (rainIntensity > 10) return '#f97316'; // Orange (Slow)
    }
    if (vulnerability === 'medium') {
       if (rainIntensity > 60) return '#ef4444';
       if (rainIntensity > 30) return '#f97316';
    }
    // Low vulnerability roads
    if (rainIntensity > 100) return '#f97316';
    return '#334155';
  };

  const getRiskOpacity = () => {
    if (rainIntensity > 80) return 0.7;
    if (rainIntensity > 40) return 0.4;
    return 0;
  };

  const getRiverColor = (status: 'Normal' | 'Warning' | 'Critical') => {
    switch (status) {
      case 'Critical': return '#ef4444'; // Red
      case 'Warning': return '#f97316';  // Orange
      default: return '#3b82f6';         // Blue
    }
  };

  const getRiverWidth = (baseWidth: number, flowCusecs: number, designCapacity: number) => {
    const ratio = flowCusecs / designCapacity;
    // Increase width significantly if over capacity
    return baseWidth * (1 + (ratio * 0.5));
  };

  // Forecast Logic
  const getForecastZoneStyle = (baseSensitivty: number) => {
    // baseSensitivity: 1.0 = normal, >1.0 = highly vulnerable (low lying), <1.0 = elevated
    const riskScore = rainIntensity * baseSensitivty;
    
    // Default: Safe/Low
    let color = '#0ea5e9'; // Sky Blue
    let opacity = 0;

    if (riskScore > 10) {
        opacity = 0.2; // Show faint blue for minor rain
    }
    
    if (riskScore > 30) {
        color = '#3b82f6'; // Blue
        opacity = 0.4;
    }
    if (riskScore > 60) {
        color = '#8b5cf6'; // Violet
        opacity = 0.5;
    }
    if (riskScore > 90) {
        color = '#ef4444'; // Red
        opacity = 0.6;
    }

    return { fill: color, opacity };
  };

  // Historical Logic
  const getHistoricalZoneStyle = (zoneIndex: number) => {
    const currentEvent = HISTORICAL_EVENTS[activeHistoricalIndex];
    const isAffected = currentEvent.zones.includes(zoneIndex);

    if (!isAffected) return { fill: '#0ea5e9', opacity: 0 };
    
    let color = '#3b82f6';
    if (currentEvent.impact === 'Critical' || currentEvent.impact === 'Catastrophic') color = '#ef4444';
    else if (currentEvent.impact === 'High') color = '#8b5cf6';

    return { fill: color, opacity: 0.6 };
  };

  const showGeoBase = viewMode === 'geo' || viewMode === 'forecast' || viewMode === 'historical';

  return (
    <div className="h-full w-full bg-[#0f172a] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col group">
      
      {/* --- HUD CONTROLS --- */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Mode Switcher */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-1 rounded-lg shadow-xl flex flex-col gap-1">
          <button 
            onClick={() => { setViewMode('geo'); setScale(1); setOffset({x:0, y:0}); setActiveBottleneck(null); }}
            className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'geo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <MapIcon className="w-3 h-3" /> Digital Twin
          </button>
          
          <button 
            onClick={() => { setViewMode('forecast'); setScale(1); setOffset({x:0, y:0}); setActiveBottleneck(null); }}
            className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'forecast' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <CloudLightning className="w-3 h-3" /> Forecast
          </button>
          
          <button 
            onClick={() => { setViewMode('historical'); setScale(1); setOffset({x:0, y:0}); setActiveBottleneck(null); }}
            className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'historical' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Clock className="w-3 h-3" /> Historical
          </button>

          {cityProfile.externalMapUrl && (
            <button 
              onClick={() => { setViewMode('external'); setActiveBottleneck(null); }}
              className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'external' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Globe className="w-3 h-3" /> External Source
            </button>
          )}

          <button 
            onClick={() => { setViewMode('schematic'); setActiveBottleneck(null); }}
            className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'schematic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity className="w-3 h-3" /> Schematic
          </button>
        </div>

        {viewMode === 'geo' && (
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-1 rounded-lg shadow-xl animate-fade-in">
             <button 
              onClick={() => setShowRiskOverlay(!showRiskOverlay)}
              className={`w-full px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${showRiskOverlay ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Layers className="w-3 h-3" /> Impact Hotspots
            </button>
          </div>
        )}
      </div>

      {/* --- Active Region Overlay --- */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 pointer-events-none">
          <MapPin className="w-4 h-4 text-blue-400" />
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Viewing Region ({cityProfile.level})</span>
             <span className="text-sm font-bold text-white">{cityProfile.name}</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pop. Density</span>
             <span className="text-xs font-mono text-slate-200">{cityProfile.populationDensity}</span>
          </div>
      </div>

      {/* Zoom Controls (Geo/Forecast/Historical Mode) */}
      {showGeoBase && (
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
           <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col">
              <button onClick={() => setScale(s => Math.min(s + 0.5, 4))} className="p-3 hover:bg-slate-800 text-slate-300 border-b border-slate-700"><ZoomIn className="w-5 h-5" /></button>
              <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="p-3 hover:bg-slate-800 text-slate-300"><ZoomOut className="w-5 h-5" /></button>
           </div>
           <button 
             onClick={() => { setScale(1); setOffset({x:0,y:0}); }}
             className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
             title="Reset View"
           >
             <Navigation className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* Status Indicator (Live or Historical) */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3">
         {viewMode === 'historical' ? (
           <div className="flex flex-col items-end animate-fade-in">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {HISTORICAL_EVENTS[activeHistoricalIndex].date}
              </span>
              <span className={`text-sm font-bold ${HISTORICAL_EVENTS[activeHistoricalIndex].rainfall > 100 ? 'text-red-500' : 'text-blue-400'}`}>
                {HISTORICAL_EVENTS[activeHistoricalIndex].label}
              </span>
              <span className="text-[10px] text-slate-500">
                {HISTORICAL_EVENTS[activeHistoricalIndex].rainfall} mm | {HISTORICAL_EVENTS[activeHistoricalIndex].impact}
              </span>
           </div>
         ) : (
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rainfall Intensity</span>
              <span className={`text-sm font-bold ${rainIntensity > 50 ? 'text-red-500' : 'text-blue-400'}`}>
                {rainIntensity} mm/hr
              </span>
           </div>
         )}
         
         <div className={`p-2 rounded-full ${rainIntensity > 50 || (viewMode === 'historical' && HISTORICAL_EVENTS[activeHistoricalIndex].impact === 'Catastrophic') ? 'bg-red-500/20 animate-pulse' : 'bg-blue-500/20'}`}>
            {viewMode === 'historical' ? <HistoryIcon active={true} /> : rainIntensity > 50 ? <Zap className="w-5 h-5 text-red-500" /> : <MapIcon className="w-5 h-5 text-blue-500" />}
         </div>
      </div>

      {/* Historical Time Slider */}
      {viewMode === 'historical' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl w-[80%] max-w-lg animate-fade-in-up">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Event Timeline
              </span>
              <span className="text-xs text-white font-mono bg-slate-800 px-2 py-0.5 rounded">
                {activeHistoricalIndex + 1} / {HISTORICAL_EVENTS.length}
              </span>
           </div>
           <input 
             type="range" 
             min="0" 
             max={HISTORICAL_EVENTS.length - 1} 
             step="1"
             value={activeHistoricalIndex}
             onChange={(e) => setActiveHistoricalIndex(parseInt(e.target.value))}
             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
           />
           <div className="flex justify-between mt-2 px-1">
              {HISTORICAL_EVENTS.map((ev, idx) => (
                <div key={ev.id} className="flex flex-col items-center cursor-pointer" onClick={() => setActiveHistoricalIndex(idx)}>
                   <div className={`w-1.5 h-1.5 rounded-full mb-1 transition-all ${idx === activeHistoricalIndex ? 'bg-blue-500 scale-150' : 'bg-slate-600'}`}></div>
                   <span className={`text-[8px] transition-colors ${idx === activeHistoricalIndex ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{ev.date.split(' ')[0]}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Forecast Legend */}
      {viewMode === 'forecast' && (
        <div className="absolute bottom-6 left-6 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl">
           <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
             <CloudLightning className="w-3 h-3 text-blue-400" /> Inundation Forecast
           </h4>
           <div className="space-y-1.5">
             <div className="flex items-center gap-2 text-[10px] text-slate-300">
               <div className="w-3 h-3 rounded-sm bg-red-500 opacity-60"></div> Critical {'>'} 2ft
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-300">
               <div className="w-3 h-3 rounded-sm bg-purple-500 opacity-50"></div> Severe 1-2ft
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-300">
               <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-40"></div> Moderate {'<'} 1ft
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-300">
               <div className="w-3 h-3 rounded-sm bg-sky-500 opacity-20"></div> Low Risk
             </div>
           </div>
        </div>
      )}

      {/* --- EXTERNAL MAP VIEW (IFRAME) --- */}
      {viewMode === 'external' && cityProfile.externalMapUrl && (
        <div className="flex-1 w-full h-full relative bg-white">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg z-10 text-xs font-bold flex items-center gap-2">
             <Globe className="w-3 h-3 text-blue-400" />
             Live External Source: OpenStreetMap
             <a href={cityProfile.externalMapUrl} target="_blank" rel="noopener noreferrer" className="ml-2 p-1 bg-slate-800 rounded hover:bg-slate-700">
               <ExternalLink className="w-3 h-3" />
             </a>
          </div>
          <iframe 
            src={cityProfile.externalMapUrl} 
            className="w-full h-full border-0"
            title="External Flood Map"
          />
        </div>
      )}

      {/* --- DIGITAL TWIN / FORECAST / SCHEMATIC / HISTORICAL --- */}
      {viewMode !== 'external' && (
        <div 
          ref={mapRef}
          className={`flex-1 w-full h-full relative overflow-hidden cursor-${isDragging ? 'grabbing' : 'grab'}`}
          onWheel={showGeoBase ? handleWheel : undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={showGeoBase ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            style={{ 
              transform: showGeoBase ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : 'none',
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              width: '100%',
              height: '100%'
            }}
            className="flex items-center justify-center"
          >
            <svg viewBox="0 0 1000 800" className="w-full h-full min-w-[1000px] min-h-[800px]">
              <defs>
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                  </pattern>
                  <radialGradient id="hotspotGradient">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  {/* Forecast Hatching Pattern */}
                  <pattern id="forecastHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                     <rect width="4" height="8" transform="translate(0,0)" fillOpacity="0.1" fill="white" />
                  </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="1000" height="800" fill="#0f172a" />
              <rect width="1000" height="800" fill="url(#grid)" opacity="0.3" />

              {/* --- CITY GEOMETRY (GEO & FORECAST & HISTORICAL MODE) --- */}
              {showGeoBase && (
                <>
                  {/* Landmass Contour */}
                  <path d="M0,0 L850,0 Q820,300 850,800 L0,800 Z" fill="#172033" />
                  
                  {/* Bay of Bengal (Right Side) */}
                  <path d="M850,0 L1000,0 L1000,800 L850,800 Q820,300 850,0" fill="#0b1120" />
                  
                  {/* --- ARTERIAL ROADS (Dynamic Color) --- */}
                  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                      {/* GST Road equivalent */}
                      <path d="M200,800 L350,500 L450,300" stroke={getRoadStatusColor('high')} strokeWidth="6" />
                      
                      {/* Main Artery */}
                      <path d="M450,300 L650,150" stroke={getRoadStatusColor('medium')} strokeWidth="8" />
                      
                      {/* Coast Road / IT Corridor */}
                      <path d="M600,800 L650,500 L550,350" stroke={getRoadStatusColor('medium')} strokeWidth="5" />
                      
                      {/* West-East Connect */}
                      <path d="M50,250 L400,250 L650,150" stroke={getRoadStatusColor('medium')} strokeWidth="6" />
                      
                      {/* Ring Road */}
                      <path d="M350,500 L400,250 L600,100" stroke={getRoadStatusColor('high')} strokeWidth="5" />
                  </g>

                  {/* --- DISTRICT ZONES (Dynamic Names) --- */}
                  <text x="680" y="200" fill="#475569" fontSize="14" fontWeight="bold">{cityProfile.mapConfig.districts[0]}</text>
                  <text x="300" y="650" fill="#475569" fontSize="14" fontWeight="bold">{cityProfile.mapConfig.districts[1]}</text>
                  <text x="650" y="600" fill="#475569" fontSize="14" fontWeight="bold">{cityProfile.mapConfig.districts[2]}</text>

                  {/* --- LANDMARKS --- */}
                  <g transform="translate(250, 650)">
                    <circle r="15" fill="#334155" />
                    <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="10">{cityProfile.mapConfig.landmarks[0]}</text>
                  </g>
                  
                  <g transform="translate(650, 150)">
                      <rect x="-10" y="-10" width="20" height="20" fill="#334155" />
                      <text x="0" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10">{cityProfile.mapConfig.landmarks[1]}</text>
                  </g>
                </>
              )}

              {/* --- WATER BODIES (Shared) --- */}
              <g opacity="0.8">
                {/* River 1 */}
                <path 
                  d="M100,300 Q300,350 500,280 T860,250" 
                  fill="none" 
                  stroke={getRiverColor(rivers[0].status)} 
                  strokeWidth={showGeoBase ? getRiverWidth(4, rivers[0].currentFlowCusecs, rivers[0].designCapacityCusecs) : 4}
                  filter="url(#neon-glow)"
                />
                {showGeoBase && (
                  <text x="500" y="270" fill={getRiverColor(rivers[0].status)} fontSize="12" textAnchor="middle" transform="rotate(-5 500,270)">
                    {cityProfile.mapConfig.riverNames[0]} ({rivers[0].status})
                  </text>
                )}
                
                {/* River 2 */}
                <path 
                  d="M150,550 Q350,600 550,520 T860,500" 
                  fill="none" 
                  stroke={getRiverColor(rivers[1].status)} 
                  strokeWidth={showGeoBase ? getRiverWidth(5, rivers[1].currentFlowCusecs, rivers[1].designCapacityCusecs) : 5}
                  filter="url(#neon-glow)"
                />
                {showGeoBase && (
                  <text x="500" y="550" fill={getRiverColor(rivers[1].status)} fontSize="12" textAnchor="middle" transform="rotate(-5 500,550)">
                    {cityProfile.mapConfig.riverNames[1]} ({rivers[1].status})
                  </text>
                )}

                {/* Canal (North-South Intersect) */}
                <path 
                  d="M750,50 L780,250 L800,500 L780,800" 
                  fill="none" 
                  stroke={rainIntensity > 50 || (viewMode === 'historical' && HISTORICAL_EVENTS[activeHistoricalIndex].impact === 'Critical') ? '#ef4444' : '#0ea5e9'} 
                  strokeWidth="2" 
                  strokeDasharray="4,4"
                />
              </g>

              {/* --- FORECAST / HISTORICAL ZONES --- */}
              {(viewMode === 'forecast' || viewMode === 'historical') && (
                <g style={{ mixBlendMode: 'screen' }}>
                  {/* Zone 1: Southern Low-lying (High Sensitivity) */}
                  <path 
                    d="M100,800 L400,800 Q450,600 500,550 L200,500 Z" 
                    {...(viewMode === 'historical' ? getHistoricalZoneStyle(0) : getForecastZoneStyle(1.4))}
                    className="transition-all duration-1000"
                  />
                  
                  {/* Zone 2: Central Urban (Med Sensitivity) */}
                  <path 
                    d="M100,0 L500,0 L500,300 Q400,350 200,300 Z" 
                    {...(viewMode === 'historical' ? getHistoricalZoneStyle(1) : getForecastZoneStyle(0.8))}
                    className="transition-all duration-1000"
                  />

                  {/* Zone 3: Coastal/East (High Sensitivity to surge) */}
                  <path 
                    d="M500,0 L850,0 Q820,300 850,800 L500,800 Q550,500 500,0 Z" 
                    {...(viewMode === 'historical' ? getHistoricalZoneStyle(2) : getForecastZoneStyle(1.2))}
                    className="transition-all duration-1000"
                  />
                  
                  {/* Pattern Overlay for "Forecast/Historical" feel */}
                  <rect width="1000" height="800" fill="url(#forecastHatch)" opacity="0.1" pointerEvents="none" />
                </g>
              )}

              {/* --- IMPACT HOTSPOTS (Digital Twin Mode Only) --- */}
              {viewMode === 'geo' && showRiskOverlay && rainIntensity > 20 && (
                <g>
                   {/* Main Flood Zones (Organic Shapes) */}
                   <g className="animate-pulse" style={{ mixBlendMode: 'screen' }}>
                    <path d="M480,500 Q550,450 600,520 T480,500" fill="#ef4444" opacity={getRiskOpacity()} filter="url(#neon-glow)" />
                    <path d="M450,300 Q500,250 550,320 T450,300" fill="#f97316" opacity={getRiskOpacity()} />
                    <path d="M500,100 Q600,50 700,120 T500,100" fill="#ef4444" opacity={getRiskOpacity() * 0.8} />
                   </g>

                   {/* SPECIFIC IMPACT DOTS (High Precision) */}
                   {rainIntensity > 30 && (
                     <g>
                       {/* Hotspots Cluster 1: South */}
                       <circle cx="540" cy="500" r="4" fill="#ef4444" className="animate-ping" style={{animationDuration: '1.5s'}} />
                       <circle cx="540" cy="500" r="2" fill="white" />
                       
                       <circle cx="520" cy="510" r="4" fill="#ef4444" className="animate-ping" style={{animationDuration: '2s', animationDelay: '0.5s'}} />
                       <circle cx="520" cy="510" r="2" fill="white" />

                       {/* Hotspots Cluster 2: Central */}
                       <circle cx="480" cy="300" r="4" fill="#ef4444" className="animate-ping" style={{animationDuration: '1.2s'}} />
                       <circle cx="480" cy="300" r="2" fill="white" />
                       
                       {/* Hotspots Cluster 3: North */}
                       <circle cx="600" cy="100" r="4" fill="#ef4444" className="animate-ping" style={{animationDuration: '1.8s'}} />
                       <circle cx="600" cy="100" r="2" fill="white" />

                       {/* Static Labels for Dots */}
                        <g transform="translate(550, 500)">
                          <rect x="5" y="-10" width="80" height="20" rx="4" fill="rgba(0,0,0,0.7)" />
                          <text x="45" y="4" fill="white" fontSize="10" textAnchor="middle">Critical Impact</text>
                        </g>
                     </g>
                   )}
                </g>
              )}

              {/* --- SCHEMATIC VIEW ELEMENTS --- */}
              {viewMode === 'schematic' && (
                <g>
                  {/* Abstract Nodes */}
                  <circle cx="200" cy="150" r="30" fill="#1e293b" stroke={getRiverColor(rivers[0].status)} strokeWidth={rivers[0].status !== 'Normal' ? 4 : 2} />
                  <text x="200" y="155" textAnchor="middle" fill="white" fontSize="10">{reservoirs[2].name}</text>
                  
                  <circle cx="250" cy="300" r="30" fill="#1e293b" stroke={getRiverColor(rivers[1].status)} strokeWidth={rivers[1].status !== 'Normal' ? 4 : 2} />
                  <text x="250" y="305" textAnchor="middle" fill="white" fontSize="10">{reservoirs[0].name}</text>

                  {/* Flow Lines matching River Status */}
                  <line 
                    x1="230" y1="150" x2="500" y2="280" 
                    stroke={getRiverColor(rivers[0].status)} 
                    strokeWidth={rivers[0].status !== 'Normal' ? 4 : 2} 
                    strokeDasharray="5,5" 
                    className={rivers[0].status !== 'Normal' ? "animate-pulse" : ""}
                  />
                  <line 
                    x1="280" y1="300" x2="550" y2="520" 
                    stroke={getRiverColor(rivers[1].status)} 
                    strokeWidth={rivers[1].status !== 'Normal' ? 4 : 2} 
                    strokeDasharray="5,5" 
                    className={rivers[1].status !== 'Normal' ? "animate-pulse" : ""}
                  />

                  {/* Status Labels Schematic */}
                  <text x="365" y="200" fill={getRiverColor(rivers[0].status)} fontSize="10" textAnchor="middle" transform="rotate(20 365,200)">
                     {rivers[0].status.toUpperCase()} FLOW
                  </text>
                  <text x="415" y="400" fill={getRiverColor(rivers[1].status)} fontSize="10" textAnchor="middle" transform="rotate(35 415,400)">
                     {rivers[1].status.toUpperCase()} FLOW
                  </text>
                </g>
              )}

              {/* --- BOTTLENECK MARKERS (GEO & SCHEMATIC) --- */}
              {(viewMode === 'geo' || viewMode === 'schematic') && (
                <g>
                  {rivers.map((river, rIdx) => 
                     river.bottlenecks.map((bn, bIdx) => {
                       const pos = getBottleneckCoords(rIdx, bIdx, viewMode);
                       if (!pos) return null;

                       return (
                         <g 
                           key={`${river.id}-${bIdx}`} 
                           transform={`translate(${pos.x}, ${pos.y})`}
                           className="cursor-pointer bottleneck-marker hover:scale-125 transition-transform"
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveBottleneck({ x: pos.x, y: pos.y, name: bn });
                           }}
                         >
                            {/* Marker Shape: Warning Triangle */}
                            <path 
                              d="M0,-10 L7,4 L-7,4 Z" 
                              fill="#f59e0b" 
                              stroke="#ffffff" 
                              strokeWidth="1.5" 
                              className="drop-shadow-lg"
                            />
                            <circle r="1" fill="black" cy="0" />
                         </g>
                       );
                     })
                  )}
                </g>
              )}

              {/* --- ACTIVE BOTTLENECK TOOLTIP --- */}
              {activeBottleneck && (viewMode === 'geo' || viewMode === 'schematic') && (
                <g 
                  transform={`translate(${activeBottleneck.x}, ${activeBottleneck.y - 18})`} 
                  className="animate-fade-in pointer-events-none"
                >
                   {/* Tooltip Background */}
                   <rect x="-80" y="-30" width="160" height="26" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                   
                   {/* Tooltip Text */}
                   <text x="0" y="-14" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
                     {activeBottleneck.name}
                   </text>
                   
                   {/* Tooltip Arrow */}
                   <path d="M-6,-4 L0,2 L6,-4" fill="#1e293b" stroke="#64748b" strokeWidth="1" strokeDasharray="0 15 5 0" />
                   {/* Hide bottom stroke of arrow to merge with rect */}
                   <path d="M-5.5,-5 L5.5,-5" fill="#1e293b" stroke="#1e293b" strokeWidth="2" />
                </g>
              )}

            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon for Historical View
const HistoryIcon = ({ active }: { active: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-slate-500'}`}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export default FloodMap;

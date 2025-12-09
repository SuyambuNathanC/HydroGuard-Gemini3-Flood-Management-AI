
import React from 'react';
import { SimulationState, CityProfile } from '../types';
import { CloudRain, RefreshCw, Play, RotateCcw, AlertOctagon, Waves, Sun, ChevronDown } from 'lucide-react';

interface SimulationProps {
  cityProfile: CityProfile;
  // Controlled props from Parent (App.tsx)
  draftState: SimulationState;
  setDraftState: (state: SimulationState) => void;
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  // Execution
  onRunSimulation: () => void;
  isSimulating: boolean;
}

const PRESETS = [
  { 
    id: 'monsoon_peak', 
    label: 'Monsoon Peak (Extreme)', 
    config: { rainfallIntensityMmHr: 110, durationHours: 24, tideLevelMeters: 1.2, soilSaturationPercent: 95 } 
  },
  { 
    id: 'tropical_storm', 
    label: 'Tropical Storm', 
    config: { rainfallIntensityMmHr: 65, durationHours: 6, tideLevelMeters: 2.5, soilSaturationPercent: 80 } 
  },
  { 
    id: 'standard_rain', 
    label: 'Standard Seasonal Rain', 
    config: { rainfallIntensityMmHr: 25, durationHours: 4, tideLevelMeters: 0.5, soilSaturationPercent: 50 } 
  },
  { 
    id: 'dry_spell', 
    label: 'Dry Spell / Summer', 
    config: { rainfallIntensityMmHr: 0, durationHours: 720, tideLevelMeters: 0.2, soilSaturationPercent: 20 } 
  },
  { 
    id: 'drought', 
    label: 'Severe Drought / Failed Monsoon', 
    config: { rainfallIntensityMmHr: 0, durationHours: 2160, tideLevelMeters: 0.1, soilSaturationPercent: 5 } 
  },
];

const Simulation: React.FC<SimulationProps> = ({ 
  cityProfile, 
  draftState, 
  setDraftState, 
  activePresetId, 
  setActivePresetId, 
  onRunSimulation, 
  isSimulating 
}) => {

  const getRiskLevel = (intensity: number, saturation: number) => {
    // Flood Logic
    if (intensity > cityProfile.rainfallThresholdPerHour) return { label: 'Severe Flooding', color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Critical infrastructure failure likely' };
    if (intensity > cityProfile.operationalLimitPerHour) return { label: 'Localized Inundation', color: 'text-orange-500', bg: 'bg-orange-500/10', desc: 'Drainage capacity exceeded' };
    
    // Drought Logic
    if (intensity === 0 && saturation <= 10) return { label: 'Severe Drought', color: 'text-amber-600', bg: 'bg-amber-600/10', desc: 'Acute water scarcity. Aquifers depleted.' };
    if (intensity === 0 && saturation <= 25) return { label: 'Water Stress', color: 'text-yellow-500', bg: 'bg-yellow-500/10', desc: 'Reservoir evaporation high.' };

    if (intensity > 0) return { label: 'Manageable', color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Standard operations' };
    return { label: 'Normal / Stable', color: 'text-slate-400', bg: 'bg-slate-800', desc: 'No active weather event' };
  };

  const risk = getRiskLevel(draftState.rainfallIntensityMmHr, draftState.soilSaturationPercent);
  const totalAccumulation = draftState.rainfallIntensityMmHr * draftState.durationHours;
  const isDrought = draftState.rainfallIntensityMmHr === 0 && draftState.soilSaturationPercent < 30;

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setDraftState(preset.config);
      setActivePresetId(presetId);
    }
  };

  const handleReset = () => {
    const defaultState = {
      rainfallIntensityMmHr: 0,
      durationHours: 12,
      tideLevelMeters: 0.5,
      soilSaturationPercent: 40
    };
    setDraftState(defaultState);
    setActivePresetId('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-10">
      {/* Controls */}
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex flex-col gap-6 backdrop-blur-sm">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Scenario Config
          </h3>
          <p className="text-sm text-slate-400">Simulate rainfall events or drought conditions to project impact.</p>
        </div>

        {/* Presets Dropdown */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quick Scenarios</label>
          <div className="relative">
            <select 
              value={activePresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="" disabled>Select a Preset...</option>
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-6 border-t border-slate-700/50 pt-6">
          {/* Rainfall Slider */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Rainfall Intensity</label>
              <span className={`text-sm font-bold ${draftState.rainfallIntensityMmHr > 50 ? 'text-red-400' : 'text-blue-400'}`}>
                {draftState.rainfallIntensityMmHr} mm/hr
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="150" 
              value={draftState.rainfallIntensityMmHr}
              onChange={(e) => setDraftState({...draftState, rainfallIntensityMmHr: Number(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Duration Slider */}
          <div>
             <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Duration (Hours)</label>
              <span className="text-sm font-bold text-blue-400">{draftState.durationHours} hrs</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="2200" // Extended for drought (3 months approx)
              step="1"
              value={draftState.durationHours}
              onChange={(e) => setDraftState({...draftState, durationHours: Number(e.target.value)})}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

           {/* Saturation Slider */}
           <div>
             <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Soil Saturation</label>
              <span className={`text-sm font-bold ${draftState.soilSaturationPercent < 20 ? 'text-amber-500' : 'text-blue-400'}`}>
                {draftState.soilSaturationPercent}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={draftState.soilSaturationPercent}
              onChange={(e) => setDraftState({...draftState, soilSaturationPercent: Number(e.target.value)})}
              className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${draftState.soilSaturationPercent < 20 ? 'accent-amber-500' : 'accent-blue-500'}`}
            />
          </div>
        </div>

        <div className="mt-auto flex gap-3">
          <button 
            onClick={handleReset}
            disabled={isSimulating}
            className="px-4 py-3 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700 transition-all"
            title="Reset to defaults"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isSimulating 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {isSimulating ? (
              <>Running Models...</>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Feedback Visualization */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className={`p-5 rounded-xl border border-slate-700 text-center relative overflow-hidden group ${isDrought ? 'bg-amber-900/20' : 'bg-slate-800/80'}`}>
             <div className={`absolute top-0 left-0 w-full h-1 ${isDrought ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
             {isDrought ? (
                <Sun className="w-8 h-8 text-amber-500/20 absolute top-4 left-4" />
             ) : (
                <CloudRain className="w-8 h-8 text-blue-500/20 absolute top-4 left-4" />
             )}
             
             <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">{isDrought ? 'Rainfall Deficit' : 'Total Accumulation'}</div>
             <div className="text-3xl font-bold text-white">
                {isDrought ? '100%' : `${totalAccumulation.toLocaleString()} mm`}
             </div>
             <div className="text-xs text-slate-500 mt-1">Over {draftState.durationHours} hours</div>
           </div>
           
           <div className={`p-5 rounded-xl border border-slate-700 text-center relative overflow-hidden ${risk.bg}`}>
             <div className={`absolute top-0 left-0 w-full h-1 ${risk.color.replace('text', 'bg')}`}></div>
             <AlertOctagon className={`w-8 h-8 opacity-20 absolute top-4 right-4 ${risk.color}`} />
             <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Projected Outcome</div>
             <div className={`text-3xl font-bold ${risk.color}`}>{risk.label}</div>
             <div className="text-xs text-slate-400 mt-1">{risk.desc}</div>
           </div>
        </div>

        {/* Visualizer */}
        <div className={`border border-slate-800 rounded-xl relative overflow-hidden h-[400px] flex flex-col items-center justify-center group shadow-inner shadow-black/50 transition-colors duration-1000 ${isDrought ? 'bg-[#1a1510]' : 'bg-slate-900'}`}>
          
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             {/* Rain Animation */}
             {draftState.rainfallIntensityMmHr > 0 && [...Array(20)].map((_, i) => (
                <div key={i} className="absolute bg-blue-500 w-[1px] h-10 animate-pulse" 
                     style={{
                       left: `${Math.random() * 100}%`,
                       top: `${Math.random() * 100}%`,
                       animationDelay: `${Math.random()}s`,
                       opacity: draftState.rainfallIntensityMmHr > 0 ? 0.5 : 0
                     }}>
                </div>
             ))}
             
             {/* Heat Haze Animation for Drought */}
             {isDrought && [...Array(10)].map((_, i) => (
                <div key={i} className="absolute bg-amber-500 w-[50px] h-[50px] rounded-full blur-3xl animate-pulse"
                    style={{
                       left: `${Math.random() * 100}%`,
                       top: `${Math.random() * 100}%`,
                       animationDuration: '4s',
                       opacity: 0.1
                    }}
                ></div>
             ))}
          </div>
          
          <div className="relative z-10 max-w-lg text-center p-6 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800">
             {isDrought ? (
                <Sun className="w-12 h-12 mx-auto mb-4 text-amber-500 animate-pulse" />
             ) : (
                <Waves className={`w-12 h-12 mx-auto mb-4 ${draftState.rainfallIntensityMmHr > 32 ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
             )}
             
             <h2 className="text-xl font-bold text-white mb-2">
               {isDrought ? 'Water Security Assessment' : 'Hydrological Impact Preview'}
             </h2>
             <p className="text-slate-300 text-sm leading-relaxed">
               {draftState.rainfallIntensityMmHr > cityProfile.rainfallThresholdPerHour ? 
                `CRITICAL: At ${draftState.rainfallIntensityMmHr}mm/hr, ISWD (Storm Water Drains) capacity is exceeded. Expect widespread inundation in low-lying areas. River backflow probable due to ${draftState.tideLevelMeters}m tide.` :
                draftState.rainfallIntensityMmHr > cityProfile.operationalLimitPerHour ?
                `WARNING: Rainfall exceeds operational safety limits. Street logging anticipated. Pumps must be deployed to subways.` :
                isDrought ? 
                `DROUGHT WARNING: Zero rainfall detected with critically low soil saturation (${draftState.soilSaturationPercent}%). Reservoir evaporation rates will spike. Groundwater recharge is negligible. Initiate water rationing protocols immediately.` :
                `NORMAL: Conditions are within manageable limits. Standard monitoring protocols apply.`
               }
             </p>
          </div>

          {/* Dynamic Overlay: Water OR Parched Earth Effect */}
          {!isDrought ? (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-600/30 border-t border-blue-400/50 transition-all duration-1000 ease-in-out backdrop-blur-sm"
              style={{ 
                height: `${Math.min((draftState.rainfallIntensityMmHr / 120) * 100, 100)}%` 
              }}
            >
               <div className="absolute top-2 right-4 text-xs font-bold text-blue-200 flex items-center gap-2">
                 <Waves className="w-3 h-3" /> Flood Level Est.
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cracked-ground.png')] mix-blend-overlay"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;


import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Droplets, AlertTriangle, Activity, Waves, Bell, CloudLightning, MapPin, Users, CheckCircle } from 'lucide-react';
import { Reservoir, River, CityProfile, Alert } from '../types';
import { RAINFALL_DATA } from '../constants';

interface DashboardProps {
  reservoirs: Reservoir[];
  rivers: River[];
  cityProfile: CityProfile;
  alerts: Alert[];
  isSimulationMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ reservoirs, rivers, cityProfile, alerts, isSimulationMode }) => {
  const totalCapacity = reservoirs.reduce((acc, r) => acc + r.capacityMcft, 0);
  const currentStorage = reservoirs.reduce((acc, r) => acc + r.currentLevelMcft, 0);
  const storagePercentage = (currentStorage / totalCapacity) * 100;

  const chartData = reservoirs.map(r => ({
    name: r.name.split(' ')[0], 
    Capacity: r.capacityMcft,
    Current: r.currentLevelMcft,
    percent: (r.currentLevelMcft / r.capacityMcft) * 100
  }));

  const getBarColor = (percent: number) => {
    if (percent > 90) return '#ef4444'; // red
    if (percent > 75) return '#f97316'; // orange
    return '#3b82f6'; // blue
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {isSimulationMode && (
        <div className="bg-indigo-600/20 border border-indigo-500/50 p-3 rounded-lg flex items-center gap-3 animate-pulse">
          <CloudLightning className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-200 font-medium">SIMULATION MODE ACTIVE: Data reflects projected impact based on current scenario configuration.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Region Info */}
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-16 h-16 text-white" />
           </div>
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Region</p>
              <h3 className="text-lg font-bold text-white mt-1 leading-tight">{cityProfile.name.split(',')[0]}</h3>
            </div>
            <div className={`p-2 rounded-lg ${
                cityProfile.level === 'Country' ? 'bg-indigo-500/10 text-indigo-400' :
                cityProfile.level === 'State' ? 'bg-purple-500/10 text-purple-400' :
                'bg-blue-500/10 text-blue-400'
            }`}>
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
             <div className="flex justify-between items-center text-xs text-slate-300">
               <span>Pop Density:</span>
               <span className="font-mono font-bold">{cityProfile.populationDensity}</span>
             </div>
             <div className="flex justify-between items-center text-xs text-slate-300">
               <span>Level:</span>
               <span className="uppercase font-bold tracking-wider">{cityProfile.level}</span>
             </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Flood Risk Index</p>
              <h3 className={`text-2xl font-bold mt-1 ${isSimulationMode ? 'text-red-400' : 'text-orange-400'}`}>
                {isSimulationMode ? 'High (Simulated)' : 'Moderate'}
              </h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Based on river capacity & soil saturation</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Avg Rainfall</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                 {isSimulationMode ? '>50' : '12'} <span className="text-sm font-normal text-slate-400">mm/hr</span>
              </h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
           <p className="text-xs text-slate-400 mt-4">Threshold: {cityProfile.operationalLimitPerHour} mm/hr</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Water Storage</p>
              <h3 className="text-2xl font-bold text-white mt-1">{currentStorage.toLocaleString()} <span className="text-sm font-normal text-slate-400">Mcft</span></h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${storagePercentage}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{storagePercentage.toFixed(1)}% of {totalCapacity.toLocaleString()} Mcft capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area - Reservoir & Rainfall */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservoir Chart */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Reservoir Levels vs Capacity</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                    cursor={{fill: '#334155', opacity: 0.4}}
                  />
                  <Bar dataKey="Current" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.percent)} />
                    ))}
                  </Bar>
                  <Bar dataKey="Capacity" fill="#334155" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall Chart */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Rainfall Intensity (Actual vs Forecast)</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={isSimulationMode ? RAINFALL_DATA.map(d => ({...d, actual: d.actual ? d.actual + 20 : null, forecast: d.forecast + 30})) : RAINFALL_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
                  <Area type="monotone" dataKey="forecast" stroke="#6366f1" fillOpacity={1} fill="url(#colorForecast)" name="Forecast" />
                  <Area type="monotone" dataKey="actual" stroke="#06b6d4" fillOpacity={1} fill="url(#colorActual)" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: River Status & Alerts */}
        <div className="space-y-6">
          {/* Alerts Feed */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Live Alerts
              </h3>
              {alerts.some(a => a.severity === 'critical') && (
                 <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] text-red-400 font-bold uppercase">Critical</span>
                 </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
                  <CheckCircle className="w-8 h-8 opacity-20" />
                  <span className="text-sm">No active alerts</span>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="bg-slate-900/40 border border-slate-700/50 p-3 rounded-lg hover:border-slate-600 transition-colors group">
                     <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                     </div>
                     <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{alert.title}</h4>
                     <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.message}</p>
                     <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-600" /> 
                        <span className="uppercase tracking-wider">{alert.location}</span>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* River Status */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
             <h3 className="text-lg font-semibold text-white mb-4">River Flow Status</h3>
             <div className="space-y-4">
               {rivers.map(river => (
                <div key={river.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{river.name}</span>
                    <span className={`${
                      river.status === 'Critical' ? 'text-red-400' :
                      river.status === 'Warning' ? 'text-orange-400' : 'text-green-400'
                    } font-medium text-xs`}>{river.status}</span>
                  </div>
                   <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${river.status === 'Normal' ? 'bg-blue-500' : river.status === 'Warning' ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min((river.currentFlowCusecs / river.designCapacityCusecs) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

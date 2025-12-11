
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LayoutDashboard, CloudRain, MessageSquare, MapPin, Menu, Bell, HardHat, Map, Siren, ChevronDown, CheckCircle, Clock, ShieldAlert, X, Database, Terminal, BookOpen } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Simulation from './components/Simulation';
import AgentChat from './components/AgentChat';
import InfraStrategist from './components/InfraStrategist';
import FloodMap from './components/FloodMap';
import DisasterRecovery from './components/DisasterRecovery';
import KnowledgeBase from './components/KnowledgeBase';
import BackendProbe from './components/BackendProbe';
import ApiDocs from './components/ApiDocs';
import { CITIES, INITIAL_RESERVOIRS, INITIAL_RIVERS, MOCK_ALERTS, MOCK_RECOVERY_TASKS, MOCK_RESPONSE_TEAMS } from './constants';
import { SimulationState, Reservoir, River, Alert, CityProfile, RecoveryTask, ResponseTeam, CityDocument, AgentRole, ChatMessage } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'simulation' | 'agents' | 'infra' | 'recovery' | 'knowledge' | 'tests' | 'docs'>('dashboard');
  
  // Set default to Chennai
  const [selectedCityId, setSelectedCityId] = useState<string>('chennai');
  
  // LIVE Simulation State (Drives Dashboard, Map, Alerts)
  const [activeSimulationState, setActiveSimulationState] = useState<SimulationState>({
    rainfallIntensityMmHr: 0,
    durationHours: 12,
    tideLevelMeters: 0.5,
    soilSaturationPercent: 30
  });

  // DRAFT Simulation State (Persists the form inputs in Simulation tab)
  const [draftSimulation, setDraftSimulation] = useState<SimulationState>({
    rainfallIntensityMmHr: 0,
    durationHours: 12,
    tideLevelMeters: 0.5,
    soilSaturationPercent: 30
  });
  
  // DRAFT Preset ID (Persists the dropdown selection)
  const [draftPresetId, setDraftPresetId] = useState<string>('');

  const [isSimulating, setIsSimulating] = useState(false);

  // --- RECOVERY STATE (Lifted for Global Access) ---
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>(MOCK_RECOVERY_TASKS);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>(MOCK_RESPONSE_TEAMS);
  
  // --- KNOWLEDGE BASE STATE (RAG Context) ---
  const [documents, setDocuments] = useState<CityDocument[]>([]);

  // --- CHAT STATE (Lifted for Persistence) ---
  const [chatHistory, setChatHistory] = useState<Record<AgentRole, ChatMessage[]>>({
    [AgentRole.MONITOR]: [],
    [AgentRole.ORCHESTRATOR]: [],
    [AgentRole.PLANNER]: [],
    [AgentRole.STRATEGIST]: []
  });

  // Notification Panel State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'alerts' | 'tasks'>('alerts');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Simulated Logged In Team
  const CURRENT_USER_TEAM = 'PWD-Team-Alpha';

  // Get current city object
  const currentCity = useMemo(() => 
    CITIES.find(c => c.id === selectedCityId) || CITIES.find(c => c.id === 'chennai')!, 
  [selectedCityId]);

  // Derived state based on ACTIVE simulation AND selected city
  const { simulatedReservoirs, simulatedRivers, activeAlerts } = useMemo(() => {
    // Basic hydrology logic for simulation visual feedback
    const intensity = activeSimulationState.rainfallIntensityMmHr;
    const isSimMode = intensity > 0 || (intensity === 0 && activeSimulationState.soilSaturationPercent < 20); // Sim mode for Flood OR Drought
    
    // Impact factors
    const flowMultiplier = 1 + (intensity * 0.05); // 50mm = 3.5x flow
    const levelMultiplier = 1 + (intensity * 0.005);
    
    // Drought Factors
    const isDrought = intensity === 0 && activeSimulationState.soilSaturationPercent < 20;
    const droughtLevelMultiplier = isDrought ? 0.6 : 1; // Drop levels by 40% in severe drought sim
    
    // 1. Reskin Reservoirs with City Names
    const cityResNames = currentCity.mapConfig.reservoirNames;
    const newReservoirs: Reservoir[] = INITIAL_RESERVOIRS.map((r, idx) => ({
      ...r,
      name: cityResNames[idx] || r.name, // Overwrite name
      currentLevelMcft: Math.min(
        r.capacityMcft, 
        r.currentLevelMcft * (isSimMode && !isDrought ? levelMultiplier : droughtLevelMultiplier)
      ),
      inflowCusecs: r.inflowCusecs * (isSimMode ? flowMultiplier * (isDrought ? 0.1 : 2) : 1),
      outflowCusecs: r.outflowCusecs * (isSimMode ? flowMultiplier * (isDrought ? 1.5 : 1) : 1), // Higher outflow demand in drought
    }));

    // 2. Reskin Rivers with City Names
    const cityRiverNames = currentCity.mapConfig.riverNames;
    const newRivers: River[] = INITIAL_RIVERS.map((r, idx) => {
      const newFlow = r.currentFlowCusecs * (isSimMode ? flowMultiplier * (isDrought ? 0.2 : 1) : 1);
      let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
      
      const ratio = newFlow / r.designCapacityCusecs;
      if (ratio > 0.9) status = 'Critical';
      else if (ratio > 0.7) status = 'Warning';
      
      return {
        ...r,
        name: cityRiverNames[idx] || r.name, // Overwrite name
        currentFlowCusecs: Math.floor(newFlow),
        status
      };
    });

    // Generate alerts based on simulation
    let newAlerts: Alert[] = [...MOCK_ALERTS];
    if (isSimMode) {
      if (intensity > 50) {
        newAlerts.unshift({
          id: 'sim-1',
          severity: 'critical',
          title: 'Simulated: Flash Flood Warning',
          message: `Rainfall intensity of ${intensity}mm/hr is overwhelming SWD capacity in ${currentCity.name}.`,
          timestamp: 'Just now',
          location: 'Citywide'
        });
      }
      if (newReservoirs[0].currentLevelMcft > newReservoirs[0].capacityMcft * 0.95) {
         newAlerts.unshift({
          id: 'sim-2',
          severity: 'high',
          title: `Simulated: ${newReservoirs[0].name} Surplus`,
          message: `Reservoir near capacity. Automated gate release impending.`,
          timestamp: 'Just now',
          location: newReservoirs[0].name
        });
      }

      // Drought Alerts
      if (isDrought) {
        newAlerts.unshift({
          id: 'sim-drought-1',
          severity: 'critical',
          title: 'Simulated: Severe Water Scarcity',
          message: `Failed monsoon simulation. Reservoir levels dropping rapidly. Soil saturation at ${activeSimulationState.soilSaturationPercent}%.`,
          timestamp: 'Forecast',
          location: 'Citywide'
        });
         newAlerts.unshift({
          id: 'sim-drought-2',
          severity: 'medium',
          title: 'Advisory: Supply Rationing',
          message: `Recommend cutting non-essential water supply to commercial zones.`,
          timestamp: 'Forecast',
          location: 'Metro Water'
        });
      }
    }

    return {
      simulatedReservoirs: newReservoirs,
      simulatedRivers: newRivers,
      activeAlerts: newAlerts
    };

  }, [activeSimulationState, currentCity]);

  // Derived Action Items for Current User
  const myActionItems = recoveryTasks.filter(t => t.assignedTeam === CURRENT_USER_TEAM && t.status !== 'Resolved');

  const handleRunSimulation = () => {
    setIsSimulating(true);
    // Simulate processing time
    setTimeout(() => {
      // Commit the DRAFT state to the ACTIVE state
      setActiveSimulationState(draftSimulation);
      setIsSimulating(false);
      // Switch to dashboard to see results
      setActiveTab('dashboard');
    }, 800);
  };

  // Close notification on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">HydroGuard</h1>
            <p className="text-xs text-slate-500">Flood Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Operations Console</span>
          </button>
          
          <button
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'map' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="font-medium">Flood Map</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'simulation' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Simulation Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'recovery' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Siren className="w-5 h-5" />
            <span className="font-medium">Disaster Recovery</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'agents' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">AI Agent Hub</span>
          </button>

           <button
            onClick={() => setActiveTab('infra')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'infra' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <HardHat className="w-5 h-5" />
            <span className="font-medium">Infra Strategist</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'knowledge' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium">Knowledge Base</span>
          </button>

          <div className="my-2 border-t border-slate-800"></div>

          <button
            onClick={() => setActiveTab('tests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'tests' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-5 h-5" />
            <span className="font-medium">System Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'docs' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">API Reference</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 relative">
             <p className="font-bold text-slate-300 mb-2">Active Region</p>
             
             {/* Region Selector */}
             <div className="relative mb-2">
               <select 
                 value={selectedCityId}
                 onChange={(e) => setSelectedCityId(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
               >
                 <optgroup label="Country Level">
                    {CITIES.filter(c => c.level === 'Country').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </optgroup>
                 <optgroup label="State Level">
                    {CITIES.filter(c => c.level === 'State').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </optgroup>
                 <optgroup label="City Level">
                    {CITIES.filter(c => c.level === 'City').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </optgroup>
                 <optgroup label="District / Local">
                    {CITIES.filter(c => c.level === 'District').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </optgroup>
               </select>
               <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
             </div>

             <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50">
               <span>Level:</span>
               <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                 currentCity.level === 'Country' ? 'bg-indigo-500/20 text-indigo-400' :
                 currentCity.level === 'State' ? 'bg-purple-500/20 text-purple-400' :
                 currentCity.level === 'District' ? 'bg-emerald-500/20 text-emerald-400' :
                 'bg-blue-500/20 text-blue-400'
               }`}>
                 {currentCity.level}
               </span>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 md:hidden">
             <Menu className="w-6 h-6 text-slate-400" />
             <span className="font-bold">HydroGuard</span>
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'map' && 'Live Flood Map'}
              {activeTab === 'simulation' && 'Flood Scenario Simulation'}
              {activeTab === 'recovery' && 'Disaster Recovery Admin'}
              {activeTab === 'agents' && 'AI Command Center'}
              {activeTab === 'infra' && 'Infrastructure Strategy'}
              {activeTab === 'knowledge' && 'City Knowledge Base'}
              {activeTab === 'tests' && 'Backend Logic Diagnostics'}
              {activeTab === 'docs' && 'API Documentation'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 relative">
             {activeSimulationState.rainfallIntensityMmHr > 0 || (activeSimulationState.rainfallIntensityMmHr === 0 && activeSimulationState.soilSaturationPercent < 20) ? (
               <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Simulating</span>
             </div>
             ) : (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium text-red-400 uppercase tracking-wide">Live Monitoring</span>
               </div>
             )}
             
             {/* Notification Bell */}
             <div ref={notificationRef} className="relative">
               <button 
                 onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                 className={`relative p-2 transition-colors ${isNotificationOpen ? 'text-white bg-slate-800 rounded-lg' : 'text-slate-400 hover:text-white'}`}
               >
                 <Bell className="w-5 h-5" />
                 {(activeAlerts.length > 0 || myActionItems.length > 0) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-slate-900"></span>
                 )}
               </button>

               {/* Dropdown Panel */}
               {isNotificationOpen && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-down">
                    <div className="flex border-b border-slate-700">
                      <button 
                        onClick={() => setNotificationTab('alerts')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${notificationTab === 'alerts' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                      >
                        Alerts ({activeAlerts.length})
                      </button>
                      <button 
                        onClick={() => setNotificationTab('tasks')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${notificationTab === 'tasks' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                      >
                        My Tasks ({myActionItems.length})
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-2">
                       {notificationTab === 'alerts' ? (
                          activeAlerts.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-xs">No active alerts</div>
                          ) : (
                            <div className="space-y-2">
                              {activeAlerts.map(alert => (
                                <div key={alert.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                   <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 
                                        alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {alert.severity}
                                      </span>
                                      <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                                   </div>
                                   <p className="text-sm font-medium text-slate-200">{alert.title}</p>
                                </div>
                              ))}
                            </div>
                          )
                       ) : (
                          myActionItems.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-xs">You have no pending tasks.</div>
                          ) : (
                            <div className="space-y-2">
                               {myActionItems.map(task => (
                                 <button 
                                   key={task.id} 
                                   onClick={() => { setActiveTab('recovery'); setIsNotificationOpen(false); }}
                                   className="w-full text-left bg-purple-500/5 hover:bg-purple-500/10 p-3 rounded-lg border border-purple-500/10 group"
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[10px] font-bold text-purple-300 uppercase">Action Item</span>
                                      <ShieldAlert className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-sm text-slate-300 line-clamp-2">{task.description}</p>
                                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {task.timestamp}
                                    </div>
                                 </button>
                               ))}
                            </div>
                          )
                       )}
                    </div>
                    
                    <div className="p-2 border-t border-slate-700 bg-slate-950">
                      <button 
                        onClick={() => setIsNotificationOpen(false)}
                        className="w-full py-2 text-xs text-slate-400 hover:text-white"
                      >
                        Close Panel
                      </button>
                    </div>
                 </div>
               )}
             </div>

             <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-help" title={`Logged in as: ${CURRENT_USER_TEAM}`}>
               OP
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 relative">
          {activeTab === 'dashboard' && (
            <Dashboard 
              reservoirs={simulatedReservoirs} 
              rivers={simulatedRivers}
              cityProfile={currentCity}
              alerts={activeAlerts}
              isSimulationMode={activeSimulationState.rainfallIntensityMmHr > 0 || (activeSimulationState.rainfallIntensityMmHr === 0 && activeSimulationState.soilSaturationPercent < 20)}
            />
          )}
          {activeTab === 'map' && (
             <FloodMap 
               reservoirs={simulatedReservoirs}
               rivers={simulatedRivers}
               simulationState={activeSimulationState}
               cityProfile={currentCity}
             />
          )}
          {activeTab === 'simulation' && (
            <Simulation 
              cityProfile={currentCity}
              draftState={draftSimulation}
              setDraftState={setDraftSimulation}
              activePresetId={draftPresetId}
              setActivePresetId={setDraftPresetId}
              onRunSimulation={handleRunSimulation} 
              isSimulating={isSimulating}
            />
          )}
          {activeTab === 'recovery' && (
            <DisasterRecovery 
              simulationState={activeSimulationState}
              tasks={recoveryTasks}
              setTasks={setRecoveryTasks}
              teams={responseTeams}
              setTeams={setResponseTeams}
              currentUserTeam={CURRENT_USER_TEAM}
            />
          )}
          {activeTab === 'agents' && (
            <AgentChat 
              reservoirs={simulatedReservoirs} 
              rivers={simulatedRivers}
              simulationState={activeSimulationState}
              cityProfile={currentCity}
              knowledgeBase={documents}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
            />
          )}
          {activeTab === 'infra' && (
            <InfraStrategist 
              cityProfile={currentCity}
              simulationState={activeSimulationState}
            />
          )}
          {activeTab === 'knowledge' && (
            <KnowledgeBase
              documents={documents}
              setDocuments={setDocuments}
            />
          )}
          {activeTab === 'tests' && (
            <BackendProbe />
          )}
          {activeTab === 'docs' && (
            <ApiDocs />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

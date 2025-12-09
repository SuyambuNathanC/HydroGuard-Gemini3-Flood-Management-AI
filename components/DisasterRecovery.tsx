
import React, { useState, useMemo, useEffect } from 'react';
import { RecoveryTask, ResponseTeam, SimulationState } from '../types';
import { CITIES } from '../constants';
import { generateRecoveryActions, generateProactiveRecoveryPlan } from '../services/geminiService';
import { 
  Siren, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Radio, 
  ShieldAlert, 
  Users, 
  Bot, 
  MessageSquarePlus,
  LayoutList,
  Activity,
  Briefcase,
  History,
  UserCheck
} from 'lucide-react';

interface DisasterRecoveryProps {
  simulationState: SimulationState;
  tasks: RecoveryTask[];
  setTasks: React.Dispatch<React.SetStateAction<RecoveryTask[]>>;
  teams: ResponseTeam[];
  setTeams: React.Dispatch<React.SetStateAction<ResponseTeam[]>>;
  currentUserTeam: string;
}

const DisasterRecovery: React.FC<DisasterRecoveryProps> = ({ 
  simulationState, 
  tasks, 
  setTasks, 
  teams, 
  setTeams,
  currentUserTeam 
}) => {
  const [viewMode, setViewMode] = useState<'command' | 'status' | 'my_tasks' | 'history'>('command');
  
  // New Task Form State
  const [newLocation, setNewLocation] = useState('');
  const [adminInstruction, setAdminInstruction] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formMode, setFormMode] = useState<'idle' | 'drafting'>('idle');

  // Derive all possible locations for auto-complete
  const locationSuggestions = useMemo(() => {
    const locations = new Set<string>();
    CITIES.forEach(city => {
      locations.add(city.name);
      city.mapConfig.districts.forEach(d => locations.add(d));
      city.mapConfig.landmarks.forEach(l => locations.add(l));
    });
    return Array.from(locations);
  }, []);

  // --- AUTOMATIC RECOVERY PLAN TRIGGER ---
  useEffect(() => {
    const checkAndGenerateAutoPlan = async () => {
      // Trigger if rainfall is high OR very low (drought) and no plan is currently being drafted
      const isCritical = simulationState.rainfallIntensityMmHr > 50;
      const isDrought = simulationState.rainfallIntensityMmHr === 0 && simulationState.soilSaturationPercent < 20;
      
      if ((isCritical || isDrought) && formMode === 'idle') {
        setIsGenerating(true);
        setFormMode('drafting');
        
        // Find current city from context (simplified, assuming first city for demo or active one if passed)
        const city = CITIES[2]; // Defaulting to Chennai for this demo logic, ideally passed via props
        
        const autoPlan = await generateProactiveRecoveryPlan(city, simulationState);
        setGeneratedPlan(autoPlan);
        setNewLocation(city.name); // Default to citywide
        setIsGenerating(false);
      }
    };

    checkAndGenerateAutoPlan();
  }, [simulationState.rainfallIntensityMmHr, simulationState.soilSaturationPercent]);


  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setFormMode('drafting');
    
    // Pass location (can be empty for citywide) and admin instructions
    const plan = await generateRecoveryActions(newLocation, simulationState, adminInstruction);
    setGeneratedPlan(plan);
    setIsGenerating(false);
  };

  const handleCreateTask = () => {
    if (!generatedPlan) return;
    
    const newTask: RecoveryTask = {
      id: Date.now().toString(),
      location: newLocation || 'Citywide Command',
      description: generatedPlan,
      status: 'Pending',
      priority: simulationState.rainfallIntensityMmHr > 50 ? 'Critical' : 'High',
      timestamp: 'Just now',
      aiSuggested: true
    };
    
    setTasks([newTask, ...tasks]);
    setNewLocation('');
    setAdminInstruction('');
    setGeneratedPlan('');
    setFormMode('idle');
  };

  const updateTaskStatus = (taskId: string, newStatus: RecoveryTask['status']) => {
    setTasks(prev => {
      const updatedTasks = prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      
      // If task is resolved, free up the team
      if (newStatus === 'Resolved') {
        const task = prev.find(t => t.id === taskId);
        if (task && task.assignedTeam) {
          setTeams(currentTeams => currentTeams.map(team => 
            team.name === task.assignedTeam 
              ? { ...team, status: 'Available', currentLocation: undefined } 
              : team
          ));
        }
      }
      return updatedTasks;
    });
  };

  const assignTeam = (taskId: string, teamName: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update Task
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTeam: teamName, status: 'Dispatched' } : t));

    // Update Team Status
    setTeams(prev => prev.map(t => 
      t.name === teamName 
        ? { ...t, status: 'Deployed', currentLocation: task.location } 
        : t
    ));
  };

  const availableTeams = teams.filter(t => t.status === 'Available');

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Pending': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Dispatched': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'In Progress': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Resolved': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default: return 'text-slate-400';
    }
  };

  // Helper to render a task card
  const renderTaskCard = (task: RecoveryTask, showActions = true) => (
    <div key={task.id} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 transition-all hover:bg-slate-800/60 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </div>
            <h4 className="text-white font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              {task.location}
            </h4>
        </div>
        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusColor(task.status)}`}>
          {task.status === 'Resolved' && <CheckCircle className="w-3 h-3" />}
          {task.status}
        </div>
      </div>

      <div className="pl-2 border-l-2 border-slate-700 ml-1 mb-3">
        <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{task.description}</p>
      </div>

      <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.timestamp}</span>
            {task.aiSuggested && <span className="flex items-center gap-1 text-purple-400"><Bot className="w-3 h-3" /> AI Generated</span>}
        </div>

        {showActions && task.status !== 'Resolved' && (
          <div className="flex items-center gap-2">
              {task.status === 'Pending' && (
                <select 
                  onChange={(e) => assignTeam(task.id, e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Assign Team...</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.type})</option>
                  ))}
                </select>
              )}
              {task.assignedTeam && (
                <span className="text-blue-300 font-medium bg-blue-500/10 px-2 py-1 rounded">
                  Assigned: {task.assignedTeam}
                </span>
              )}
              
              {task.status !== 'Pending' && (
                <button 
                  onClick={() => updateTaskStatus(task.id, 'Resolved')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <CheckCircle className="w-3 h-3" /> Mark Resolved
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 pb-10">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase">Active Missions</p>
             <h3 className="text-2xl font-bold text-white mt-1">{tasks.filter(t => t.status !== 'Resolved').length}</h3>
           </div>
           <div className="p-3 bg-red-500/20 rounded-lg">
             <Siren className="w-6 h-6 text-red-500" />
           </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase">Teams Deployed</p>
             <h3 className="text-2xl font-bold text-white mt-1">{teams.filter(t => t.status === 'Deployed').length} / {teams.length}</h3>
           </div>
           <div className="p-3 bg-blue-500/20 rounded-lg">
             <Users className="w-6 h-6 text-blue-500" />
           </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase">Resolved</p>
             <h3 className="text-2xl font-bold text-emerald-400 mt-1">{tasks.filter(t => t.status === 'Resolved').length}</h3>
           </div>
           <div className="p-3 bg-emerald-500/20 rounded-lg">
             <CheckCircle className="w-6 h-6 text-emerald-500" />
           </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase">AI Assistance</p>
             <h3 className="text-2xl font-bold text-purple-400 mt-1">{tasks.filter(t => t.aiSuggested).length}</h3>
           </div>
           <div className="p-3 bg-purple-500/20 rounded-lg">
             <Bot className="w-6 h-6 text-purple-500" />
           </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg w-fit border border-slate-800">
         <button 
           onClick={() => setViewMode('command')}
           className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'command' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
           <Radio className="w-4 h-4" /> Command Center
         </button>
         <button 
           onClick={() => setViewMode('status')}
           className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'status' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
           <LayoutList className="w-4 h-4" /> Field Ops
         </button>
         <button 
           onClick={() => setViewMode('my_tasks')}
           className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'my_tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
           <UserCheck className="w-4 h-4" /> My Tasks
         </button>
         <button 
           onClick={() => setViewMode('history')}
           className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
           <History className="w-4 h-4" /> History
         </button>
      </div>

      {/* --- COMMAND CENTER VIEW --- */}
      {viewMode === 'command' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column: Interactive Command Center */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              <h3 className="font-bold text-white">Create Mission</h3>
            </div>
            
            <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
               <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Location (Optional)</label>
                    <input 
                      type="text" 
                      list="location-suggestions"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g., T. Nagar or Leave empty for Citywide"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <datalist id="location-suggestions">
                      {locationSuggestions.map((loc, idx) => (
                        <option key={idx} value={loc} />
                      ))}
                    </datalist>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Directives / Specific Needs</label>
                    <div className="relative">
                      <textarea 
                        value={adminInstruction}
                        onChange={(e) => setAdminInstruction(e.target.value)}
                        placeholder="e.g. 'We need 5 boats for evacuation immediately' or 'Send food packets to relief camp'"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24"
                      />
                      <MessageSquarePlus className="absolute bottom-3 right-3 w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Provide instructions and let AI format the operational plan.
                    </p>
                 </div>

                 <button 
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                 >
                   {isGenerating ? (
                     <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Plan...
                     </>
                   ) : (
                     <>
                      <Bot className="w-4 h-4" /> 
                      {formMode === 'drafting' ? 'Regenerate Plan' : 'Generate Action Plan'}
                     </>
                   )}
                 </button>
               </div>

               <div className="border-t border-slate-700/50 my-1"></div>

               {/* Step 2: AI Output & Draft */}
               {formMode === 'drafting' ? (
                 <div className="flex-1 flex flex-col gap-2 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        Review & Dispatch Orders
                        {isGenerating && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                      </label>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                        {simulationState.rainfallIntensityMmHr > 50 ? 'Auto-Triggered' : 'Draft Mode'}
                      </span>
                    </div>
                    
                    <textarea 
                      value={generatedPlan}
                      onChange={(e) => setGeneratedPlan(e.target.value)}
                      className="flex-1 min-h-[150px] bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-sm text-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed font-mono"
                      placeholder="AI generated steps will appear here..."
                    />
                    
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => { setFormMode('idle'); setGeneratedPlan(''); }}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={handleCreateTask}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                      >
                        <ShieldAlert className="w-4 h-4" /> Confirm & Dispatch
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center flex-col text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                     <ShieldAlert className="w-12 h-12 mb-2 opacity-30" />
                     <p className="text-sm">Ready for new commands</p>
                     <p className="text-xs text-slate-500 mt-1">Select location or instruct AI above</p>
                 </div>
               )}
            </div>
          </div>

          {/* Right Column: Mission Log */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Mission Log
                </h3>
                <span className="text-xs text-slate-500">Live Updates</span>
             </div>

             <div className="flex-1 overflow-y-auto p-4">
                {tasks.map(task => renderTaskCard(task))}
             </div>
          </div>
        </div>
      )}

      {/* --- STATUS (FIELD OPS) VIEW --- */}
      {viewMode === 'status' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
           {/* Column 1: Team Assignments (Individual Level) */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
                 <h3 className="font-bold text-white flex items-center gap-2">
                   <Briefcase className="w-5 h-5 text-blue-400" />
                   Team Assignments
                 </h3>
                 <span className="text-xs text-slate-500">Real-time Deployment</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {teams.map(team => {
                   const activeTask = tasks.find(t => t.assignedTeam === team.name && t.status !== 'Resolved');
                   return (
                     <div key={team.id} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <div className="font-bold text-white text-base">{team.name}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wide">{team.type}</div>
                           </div>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                             team.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' :
                             team.status === 'Deployed' ? 'bg-blue-500/20 text-blue-400' :
                             'bg-slate-500/20 text-slate-400'
                           }`}>
                             {team.status}
                           </span>
                        </div>
                        
                        {/* Active Action Item */}
                        {team.status === 'Deployed' && activeTask ? (
                          <div className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded p-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1">
                               <Activity className="w-3 h-3" /> CURRENT ACTION ITEM
                            </div>
                            <p className="text-sm text-slate-200 leading-snug">{activeTask.description}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                               <MapPin className="w-3 h-3" /> {activeTask.location}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-slate-500 italic flex items-center gap-2">
                             <CheckCircle className="w-3 h-3" /> Standby - Ready for assignment
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Column 2: Critical Watch (Critical Level) */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
                 <h3 className="font-bold text-white flex items-center gap-2">
                   <ShieldAlert className="w-5 h-5 text-red-500" />
                   Critical Incident Watch
                 </h3>
                 <span className="text-xs text-slate-500">Priority Level: CRITICAL</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {tasks.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <CheckCircle className="w-16 h-16 mb-2 text-emerald-500" />
                      <p>No critical incidents pending.</p>
                   </div>
                 ) : (
                   tasks.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').map(task => (
                      <div key={task.id} className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-red-100 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-red-500" /> {task.location}
                            </h4>
                            <span className="text-[10px] font-mono text-red-400">{task.timestamp}</span>
                         </div>
                         <p className="text-sm text-slate-300 mb-3">{task.description}</p>
                         <div className="flex justify-between items-center pt-2 border-t border-red-500/20">
                            <div className="text-xs text-slate-400">
                               Status: <span className="text-white font-medium">{task.status}</span>
                            </div>
                            {task.assignedTeam ? (
                              <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                                On Scene: {task.assignedTeam}
                              </span>
                            ) : (
                              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded animate-pulse">
                                Unassigned
                              </span>
                            )}
                         </div>
                      </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}
      
      {/* --- MY TASKS VIEW --- */}
      {viewMode === 'my_tasks' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                My Assigned Tasks ({currentUserTeam})
              </h3>
              <span className="text-xs text-slate-500">Pending Action</span>
           </div>
           <div className="flex-1 overflow-y-auto p-4">
              {tasks.filter(t => t.assignedTeam === currentUserTeam && t.status !== 'Resolved').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                   <UserCheck className="w-16 h-16 mb-2" />
                   <p>You have no pending tasks.</p>
                </div>
              ) : (
                tasks.filter(t => t.assignedTeam === currentUserTeam && t.status !== 'Resolved').map(task => renderTaskCard(task))
              )}
           </div>
        </div>
      )}

      {/* --- HISTORY VIEW --- */}
      {viewMode === 'history' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Task History
              </h3>
              <span className="text-xs text-slate-500">Resolved Items</span>
           </div>
           <div className="flex-1 overflow-y-auto p-4">
              {tasks.filter(t => t.status === 'Resolved').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                   <History className="w-16 h-16 mb-2" />
                   <p>No task history available yet.</p>
                </div>
              ) : (
                tasks.filter(t => t.status === 'Resolved').map(task => renderTaskCard(task, false))
              )}
           </div>
        </div>
      )}

    </div>
  );
};

export default DisasterRecovery;

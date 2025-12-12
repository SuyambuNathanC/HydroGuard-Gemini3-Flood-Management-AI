
import React, { useState } from 'react';
import { 
  LayoutDashboard, Map, MapPin, Siren, MessageSquare, HardHat, Database, 
  Terminal, BookOpen, CloudRain, RotateCcw, ShieldAlert, Bot, FileText, 
  CheckCircle, ChevronRight, Activity, Layers, Search
} from 'lucide-react';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'dashboard', label: 'Operations Console', icon: LayoutDashboard },
    { id: 'simulation', label: 'Simulation Lab', icon: MapPin },
    { id: 'recovery', label: 'Disaster Recovery', icon: Siren },
    { id: 'agents', label: 'AI Agent Hub', icon: MessageSquare },
    { id: 'infra', label: 'Infra Strategist', icon: HardHat },
    { id: 'map', label: 'Digital Twin Map', icon: Map },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  ];

  return (
    <div className="flex h-full gap-6">
      {/* Navigation Sidebar */}
      <div className="w-64 shrink-0 hidden lg:block">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sticky top-0">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Table of Contents</h3>
          <div className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-12 pb-20">
          
          {/* --- GETTING STARTED --- */}
          <section id="getting-started" className="scroll-mt-6">
            <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/20 rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-white mb-4">HydroGuard AI User Manual</h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Welcome to HydroGuard AI, an advanced flood management and decision support system. 
                This platform integrates real-time sensor data, hydrological simulations, and Generative AI 
                to help city officials predict, manage, and mitigate urban flooding risks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="font-bold text-white">Monitor</h4>
                  <p className="text-xs text-slate-400 mt-1">Track reservoir levels and rainfall in real-time.</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <Bot className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="font-bold text-white">Simulate</h4>
                  <p className="text-xs text-slate-400 mt-1">Run "what-if" scenarios for floods or droughts.</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <ShieldAlert className="w-6 h-6 text-red-400 mb-2" />
                  <h4 className="font-bold text-white">Respond</h4>
                  <p className="text-xs text-slate-400 mt-1">Dispatch teams and manage recovery tasks.</p>
                </div>
              </div>
            </div>
          </section>

          {/* --- OPERATIONS CONSOLE --- */}
          <section id="dashboard" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-blue-400" /> Operations Console
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                The Dashboard is your landing page. It provides an immediate "Health Check" of the city's water systems.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-400 space-y-2 ml-2">
                <li><strong className="text-white">KPI Cards:</strong> View Flood Risk Index, Average Rainfall, and Total Water Storage at a glance.</li>
                <li><strong className="text-white">Live Charts:</strong> Compare Reservoir Levels vs Capacity and Actual vs Forecasted Rainfall.</li>
                <li><strong className="text-white">Alerts Feed:</strong> Real-time notifications about critical water levels or traffic disruptions.</li>
                <li><strong className="text-white">Simulation Indicator:</strong> If a simulation is running, a banner will appear indicating data is projected, not live.</li>
              </ul>
            </div>
          </section>

          {/* --- SIMULATION LAB --- */}
          <section id="simulation" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-400" /> Simulation Lab
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Running Scenarios</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Use the sliders to adjust Rainfall Intensity, Duration, and Soil Saturation. 
                    Or select a preset like "Monsoon Peak" or "Severe Drought".
                  </p>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-4">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                      <CloudRain className="w-4 h-4 text-blue-400" /> Run Simulation Button
                    </div>
                    <p className="text-xs text-slate-300">
                      Clicking this applies the weather parameters to the entire system. 
                      <span className="text-emerald-400 font-bold ml-1">
                        Note: Existing tasks, chat history, and infrastructure plans are PRESERVED. 
                      </span>
                      This allows you to see how your current operational setup copes with changing weather.
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                      <RotateCcw className="w-4 h-4 text-slate-400" /> Reset Button (Icon)
                    </div>
                    <p className="text-xs text-slate-300">
                      Found near the "Run" button. Clicking this performs a 
                      <span className="text-red-400 font-bold ml-1">Full System Wipe</span>. 
                      It clears all tasks, chats, plans, and resets weather to default. Use this to start a fresh session.
                    </p>
                  </div>
                </div>
                <div className="relative h-64 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center">
                   <div className="text-center">
                      <Activity className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Visualizer Panel</p>
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- DISASTER RECOVERY --- */}
          <section id="recovery" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Siren className="w-6 h-6 text-red-400" /> Disaster Recovery
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <p className="text-slate-300 text-sm">
                Manage field operations during a crisis. This module works in tandem with the Simulation Lab.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 font-bold text-white">1</div>
                  <div>
                    <h4 className="font-bold text-white">Auto-Generated Plans</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      If rainfall exceeds 50mm/hr, the AI automatically drafts a "Command Center" plan. You can edit this plan or create tasks manually by typing instructions like "Send boats to Velachery".
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 font-bold text-white">2</div>
                  <div>
                    <h4 className="font-bold text-white">Team Assignment</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Assign available teams (NDRF, PWD, Medical) to pending tasks. Once a team is assigned, their status changes to "Deployed".
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 font-bold text-white">3</div>
                  <div>
                    <h4 className="font-bold text-white">Resolution & Persistence</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Mark tasks as "Resolved" to free up teams. <strong className="text-emerald-400">Important:</strong> Tasks persist even if you change simulation parameters, allowing you to track long-running relief efforts across varying weather conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- AI AGENT HUB --- */}
          <section id="agents" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-400" /> AI Agent Hub
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3">4 Specialized Personas</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-500/20 rounded text-emerald-400"><Activity className="w-4 h-4" /></div>
                    <div>
                      <span className="block text-sm font-bold text-white">Situation Monitor</span>
                      <span className="text-xs text-slate-400">Analyzes raw sensor data and identifies anomalies.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-orange-500/20 rounded text-orange-400"><ShieldAlert className="w-4 h-4" /></div>
                    <div>
                      <span className="block text-sm font-bold text-white">Alert Orchestrator</span>
                      <span className="text-xs text-slate-400">Drafts public warnings and prioritizes risks.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-500/20 rounded text-blue-400"><Map className="w-4 h-4" /></div>
                    <div>
                      <span className="block text-sm font-bold text-white">Action Planner</span>
                      <span className="text-xs text-slate-400">Generates operational playbooks and SOPs.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500/20 rounded text-purple-400"><HardHat className="w-4 h-4" /></div>
                    <div>
                      <span className="block text-sm font-bold text-white">Infra Strategist</span>
                      <span className="text-xs text-slate-400">Long-term planning, budget, and ROI analysis.</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3">RAG & Multimodal</h3>
                <p className="text-sm text-slate-400 mb-4">
                  The agents are "Context Aware". They know the current simulation state, active recovery tasks, and infrastructure plans.
                </p>
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <h4 className="text-xs font-bold text-white uppercase mb-2">Capabilities</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Upload PDFs/Text to the Knowledge Base to give agents "memory" of city policies.</li>
                    <li>Upload Images/Video in chat for visual analysis.</li>
                    <li>Agents can "Create Tasks" directly in the Recovery module.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* --- INFRA STRATEGIST --- */}
          <section id="infra" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <HardHat className="w-6 h-6 text-orange-400" /> Infra Strategist
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-300 text-sm mb-4">
                Plan long-term resilience projects like new drains, dams, or desilting operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h4 className="font-bold text-white text-sm mb-2">Interactive Strategy Lab</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Chat with the AI to brainstorm solutions. The AI can generate structured proposals with costs, timelines, and impact scores.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded w-fit">
                      <CheckCircle className="w-3 h-3" /> Save to Drafts
                    </div>
                 </div>
                 <div>
                    <h4 className="font-bold text-white text-sm mb-2">Portfolio Management</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      View approved projects, track budget usage (₹ Cr), and monitor progress.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded w-fit">
                      <Activity className="w-3 h-3" /> Compare Proposals
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* --- DIGITAL TWIN MAP --- */}
          <section id="map" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Map className="w-6 h-6 text-emerald-400" /> Digital Twin Map
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <li className="bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-white font-bold text-sm block mb-1">Digital Twin Mode</span>
                  <span className="text-xs text-slate-400">Live view of river flow, road traffic status, and critical bottlenecks. Shows "Impact Hotspots" (red pulses) during high rainfall.</span>
                </li>
                <li className="bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-white font-bold text-sm block mb-1">Forecast Mode</span>
                  <span className="text-xs text-slate-400">Heatmap visualization of predicted inundation zones based on terrain elevation.</span>
                </li>
                <li className="bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-white font-bold text-sm block mb-1">Historical Mode</span>
                  <span className="text-xs text-slate-400">Replay past events (e.g., Dec 2015 Floods) to see which zones were affected.</span>
                </li>
                <li className="bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-white font-bold text-sm block mb-1">Schematic Mode</span>
                  <span className="text-xs text-slate-400">Simplified engineering view of river nodes and reservoir connections.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* --- KNOWLEDGE BASE --- */}
          <section id="knowledge" className="scroll-mt-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-yellow-400" /> Knowledge Base
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
               <div className="flex-1">
                 <p className="text-slate-300 text-sm mb-4">
                   This module powers the <strong>Retrieval Augmented Generation (RAG)</strong> system.
                 </p>
                 <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                   <li>Upload documents (PDF/Text/JSON) containing city policies, sensor logs, or budget reports.</li>
                   <li>The system automatically analyzes and "indexes" the document.</li>
                   <li>AI Agents can now "read" these documents to answer specific questions (e.g., "What is the budget for North Canal desilting?").</li>
                 </ol>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 w-full md:w-1/3 text-center">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Supports .txt, .json, .csv</p>
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default UserGuide;

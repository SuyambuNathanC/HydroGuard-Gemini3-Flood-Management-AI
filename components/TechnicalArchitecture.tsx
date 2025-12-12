
import React from 'react';
import { Cpu, Brain, Zap, Database, GitBranch, Server, Layers, Code, ArrowRight, FileJson, Sparkles, HardDrive, Network, AlertTriangle, CheckCircle, Scale, Siren, HardHat } from 'lucide-react';

const TechnicalArchitecture: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 p-8 rounded-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Cpu className="w-64 h-64 text-indigo-400" />
           </div>
           <div className="relative z-10">
             <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
               <Brain className="w-10 h-10 text-indigo-400" />
               Technical Solution & AI Architecture
             </h1>
             <p className="text-lg text-indigo-200 leading-relaxed max-w-3xl">
                HydroGuard-AI is a <strong>State-Aware Intelligent System</strong> powered by Google's Gemini 2.5, utilizing a "Context Injection" architecture to bridge immediate disaster response with long-term resilience planning.
             </p>
           </div>
        </div>

        {/* --- EXECUTIVE SUMMARY (Problem & Solution) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem Statement */}
            <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-xl relative group hover:border-red-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AlertTriangle className="w-24 h-24 text-red-500" />
                </div>
                <h3 className="text-red-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Problem Statement
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                   Urban flooding arises from limited drainage and fragmented decision-making, while dry seasons suffer from a critical lack of integrated storage planning. Cities currently lack a unified, real-time system to safely route water, ensure security, and connect ground-level teams.
                </p>
            </div>

            {/* Solution Statement */}
            <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-xl relative group hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <CheckCircle className="w-24 h-24 text-emerald-500" />
                </div>
                <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> HydroGuard-AI Solution
                </h3>
                <div className="space-y-3 relative z-10">
                   <p className="text-slate-300 text-sm leading-relaxed">
                     A real-time, Multi-Modal AI platform bridging tactical operations and strategic planning.
                   </p>
                   <ul className="space-y-2 text-sm text-slate-300">
                       <li className="flex gap-2">
                           <Siren className="w-4 h-4 text-emerald-500 shrink-0" />
                           <span>
                             <strong>Disaster Recovery (Immediate):</strong> AI-driven tactical response plans for real-time flood routing & rescue.
                           </span>
                       </li>
                       <li className="flex gap-2">
                           <HardHat className="w-4 h-4 text-emerald-500 shrink-0" />
                           <span>
                             <strong>Infra Strategist (Permanent):</strong> Generates long-term engineering solutions to ensure future water security.
                           </span>
                       </li>
                       <li className="flex gap-2">
                           <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                           <span>
                             <strong>Client-Side Gemini AI:</strong> Zero-latency decision engine handling UI loads, backed by scalable Big Data architecture.
                           </span>
                       </li>
                   </ul>
                </div>
            </div>
        </div>

        {/* --- ARCHITECTURE DIAGRAM SECTION --- */}
        <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-400" />
                High-Level System Architecture
            </h2>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-slate-900 px-4 py-2 rounded-bl-xl border-b border-l border-slate-800 text-xs font-bold text-slate-500 uppercase">
                    System Topology
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-stretch">
                    {/* CLIENT SIDE (ACTIVE) */}
                    <div className="flex-1 bg-slate-900/80 border-2 border-emerald-500/30 rounded-xl p-6 relative">
                        <div className="absolute -top-3 left-6 bg-emerald-900 border border-emerald-500 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Live Client-Side Core
                        </div>
                        
                        <div className="space-y-6 mt-4">
                            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg text-center">
                                <div className="font-bold text-white mb-1">React SPA (Browser)</div>
                                <div className="text-xs text-slate-400">UI • State • Logic</div>
                            </div>
                            
                            <div className="flex justify-center">
                                <ArrowRight className="w-6 h-6 text-emerald-500 transform rotate-90" />
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/50 p-4 rounded-lg text-center shadow-lg shadow-indigo-900/20">
                                <div className="font-bold text-indigo-300 mb-1 flex justify-center items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Gemini 2.5 Flash
                                </div>
                                <div className="text-xs text-indigo-400/80">
                                Zero-Latency Reasoning<br/>
                                Function Calling • Multimodal
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 border-t border-slate-700/50 pt-4 text-center">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Handles "Small Load"</span>
                            <p className="text-[10px] text-slate-500 mt-1">Real-time decisions, UI interactions, Immediate Analysis</p>
                        </div>
                    </div>

                    {/* SEPARATOR */}
                    <div className="flex items-center justify-center">
                        <div className="h-full w-[2px] bg-slate-800 hidden md:block relative">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-2 text-slate-600 font-bold text-xs border border-slate-800 rounded">
                                VS
                            </div>
                        </div>
                    </div>

                    {/* BACKEND SIDE (FUTURE) */}
                    <div className="flex-1 bg-slate-900/30 border-2 border-dashed border-slate-700 rounded-xl p-6 relative opacity-70 hover:opacity-100 transition-opacity">
                        <div className="absolute -top-3 left-6 bg-slate-800 border border-slate-600 text-slate-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            <HardDrive className="w-3 h-3" /> Future Backend Extension
                        </div>
                        <div className="absolute top-4 right-4 text-[10px] font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 px-2 py-1 rounded">
                            EXTENDABLE
                        </div>

                        <div className="space-y-4 mt-4 grayscale hover:grayscale-0 transition-all duration-500">
                             {/* ADDED: Frontend SPA Node to show E2E */}
                             <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg text-center opacity-50">
                                <div className="font-bold text-slate-300 mb-1">Frontend SPA</div>
                                <div className="text-[10px] text-slate-500">HTTP / WebSocket</div>
                            </div>

                             <div className="flex justify-center">
                                <ArrowRight className="w-5 h-5 text-slate-600 transform rotate-90" />
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-center">
                                <div className="font-bold text-slate-300 mb-1">FastAPI / Python Cluster</div>
                                <div className="text-xs text-slate-500">Orchestration • Heavy Compute</div>
                            </div>
                            
                            <div className="flex justify-center gap-8">
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="w-5 h-5 text-slate-600 transform rotate-90" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="w-5 h-5 text-slate-600 transform rotate-90" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg text-center">
                                    <div className="font-bold text-slate-300 mb-1 text-xs">Vector DB</div>
                                    <div className="text-[10px] text-slate-500">
                                    Knowledge @ Scale
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg text-center">
                                    <div className="font-bold text-slate-300 mb-1 text-xs">Big Data ML</div>
                                    <div className="text-[10px] text-slate-500">
                                    Hydrology Models
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-700/50 pt-4 text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Handles "Big Load"</span>
                            <p className="text-[10px] text-slate-600 mt-1">National Scale Data, Terabyte Satellite Imagery, Hist. Archives</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- CORE CONCEPT 1: IN-MEMORY STATE & BRAIN DUMP --- */}
        <section className="space-y-4">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Database className="w-6 h-6 text-emerald-400" />
             1. The "Brain Dump" & In-Memory State
           </h2>
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Beyond Static Mocks</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      While the application initializes with constant data (to simulate a pre-existing city state), it operates entirely on <strong>Mutable In-Memory Data Structures</strong> (React State).
                    </p>
                    <ul className="space-y-3">
                       <li className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                          <GitBranch className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                             <span className="text-sm font-bold text-white block">State Persistence</span>
                             <span className="text-xs text-slate-400">
                               When you create a Task, Draft a Proposal, or Edit a Plan, that data persists in memory. 
                               Clicking "Run Simulation" updates the environment but <strong>preserves your operational data</strong>, allowing you to test how your specific plans hold up against different weather scenarios.
                             </span>
                          </div>
                       </li>
                       <li className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                          <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                             <span className="text-sm font-bold text-white block">The "Context Injection" Loop</span>
                             <span className="text-xs text-slate-400">
                               Every time you interact with an AI Agent, the system performs a <strong>"Brain Dump"</strong>. It serializes the <i>current</i> state of Rivers, Reservoirs, Active Tasks, and Infrastructure Plans into a structured prompt context.
                             </span>
                          </div>
                       </li>
                    </ul>
                 </div>
                 
                 {/* Visual Diagram of Context Injection */}
                 <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 relative flex flex-col justify-center">
                    <div className="absolute top-2 right-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">Architecture Diagram</div>
                    
                    <div className="flex items-center justify-between gap-4 mb-4">
                       <div className="flex flex-col gap-2 w-1/3">
                          <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded text-xs text-center text-blue-300">Live Sensor Data</div>
                          <div className="bg-red-900/20 border border-red-500/30 p-2 rounded text-xs text-center text-red-300">Active Recovery Tasks</div>
                          <div className="bg-purple-900/20 border border-purple-500/30 p-2 rounded text-xs text-center text-purple-300">Infra Portfolio</div>
                       </div>
                       <div className="flex flex-col items-center">
                          <ArrowRight className="w-6 h-6 text-slate-600 mb-1" />
                          <span className="text-[10px] text-slate-500">Serialized</span>
                          <ArrowRight className="w-6 h-6 text-slate-600 mt-1" />
                       </div>
                       <div className="bg-slate-800 border border-slate-600 p-4 rounded-lg w-1/3 text-center shadow-xl shadow-indigo-500/10">
                          <Brain className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <div className="text-xs font-bold text-white">Gemini Context Window</div>
                       </div>
                    </div>
                    
                    <div className="text-center">
                       <ArrowRight className="w-6 h-6 text-emerald-500 mx-auto transform rotate-90" />
                    </div>
                    
                    <div className="mt-2 bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-lg text-center">
                       <span className="text-sm font-bold text-emerald-400">Dynamic, Context-Aware Response</span>
                       <p className="text-[10px] text-emerald-200/70 mt-1">"I see you have 3 critical tasks in T. Nagar. Based on the 50mm rainfall..."</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- CORE CONCEPT 2: GEMINI INTEGRATION --- */}
        <section className="space-y-4">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Sparkles className="w-6 h-6 text-purple-400" />
             2. Pervasive AI Integration
           </h2>
           <p className="text-slate-400 text-sm">
             Gemini 2.5 Flash is not just a chatbot here. It is the core compute engine for decision logic, creative generation, and data analysis throughout the application.
           </p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-indigo-500/50 transition-colors">
                 <div className="bg-indigo-500/10 w-fit p-2 rounded-lg mb-3">
                    <FileJson className="w-6 h-6 text-indigo-400" />
                 </div>
                 <h4 className="font-bold text-white mb-2">Structured Generation</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   The <strong>Infra Strategist</strong> uses Gemini to generate valid JSON objects for infrastructure proposals. It creates costs, timelines, and risk assessments dynamically based on the city profile, ensuring the UI can render them as interactive cards.
                 </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-red-500/50 transition-colors">
                 <div className="bg-red-500/10 w-fit p-2 rounded-lg mb-3">
                    <Zap className="w-6 h-6 text-red-400" />
                 </div>
                 <h4 className="font-bold text-white mb-2">Reactive Logic</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   In <strong>Disaster Recovery</strong>, the system auto-triggers Gemini when rainfall exceeds 50mm/hr. It feeds the specific simulation metrics to the model, which then generates a tactical "Action Plan" tailored to that exact weather event.
                 </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/50 transition-colors">
                 <div className="bg-emerald-500/10 w-fit p-2 rounded-lg mb-3">
                    <Server className="w-6 h-6 text-emerald-400" />
                 </div>
                 <h4 className="font-bold text-white mb-2">Backend Simulation (Probe)</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   The <strong>Backend Probe</strong> tool uses Gemini to simulate a Python runtime. We send raw Python code (hydrology formulas) to the LLM, asking it to "Act as an Interpreter". This validates our logic logic without needing a dedicated Python server.
                 </p>
              </div>
              
              {/* Feature 4 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-yellow-500/50 transition-colors">
                 <div className="bg-yellow-500/10 w-fit p-2 rounded-lg mb-3">
                    <Database className="w-6 h-6 text-yellow-400" />
                 </div>
                 <h4 className="font-bold text-white mb-2">RAG & Document Analysis</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   The <strong>Knowledge Base</strong> processes uploaded text files. Gemini analyzes content to extract "Key Facts" and a "Summary". These extracted bits are injected into the context window of all Agents, giving them "Long Term Memory" of city policies.
                 </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-blue-500/50 transition-colors">
                 <div className="bg-blue-500/10 w-fit p-2 rounded-lg mb-3">
                    <Code className="w-6 h-6 text-blue-400" />
                 </div>
                 <h4 className="font-bold text-white mb-2">Dynamic Routing</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   User queries are classified by Gemini to determine intent (e.g., "Is this a budget question or a rescue question?"). This allows the system to route commands or adopt the correct persona (Strategist vs Planner) seamlessly.
                 </p>
              </div>
           </div>
        </section>

        {/* --- CORE CONCEPT 3: PRODUCTION BACKEND & BIG DATA SCALABILITY --- */}
        <section className="bg-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden">
            {/* Visual flair */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                <HardDrive className="w-6 h-6 text-blue-400" />
                3. Production Backend & Big Data Architecture
            </h2>
            
            <div className="relative z-10">
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    While the main dashboard is optimized for client-side interaction (as highlighted above), a robust <strong>Production Backend (FastAPI + ChromaDB)</strong> exists to handle national-scale environmental data when required.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Network className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-bold text-white">Big Data Hydrology</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            The backend infrastructure (referenced in <code>backend/requirements.txt</code>) is designed to process terabytes of satellite terrain data for state-wide flood modeling.
                        </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Database className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-bold text-white">Vector Database (ChromaDB)</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            For indexing millions of historical policy documents and sensor logs that exceed the browser's memory limit, enabling retrieval at a massive scale.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- SUMMARY --- */}
        <section className="bg-indigo-900/20 border border-indigo-500/20 p-6 rounded-xl">
           <h3 className="text-lg font-bold text-white mb-2">Why This Matters</h3>
           <p className="text-sm text-indigo-200">
             By maintaining a live, mutable state object in the browser and continuously syncing it with a powerful LLM like Gemini, 
             HydroGuard creates a <strong>Digital Twin</strong> that feels alive. It remembers your decisions, reacts to your simulations, 
             and provides counsel based on the specific reality you have constructed in the session—far surpassing the capabilities of a static mocked application.
           </p>
        </section>

      </div>
    </div>
  );
};

export default TechnicalArchitecture;

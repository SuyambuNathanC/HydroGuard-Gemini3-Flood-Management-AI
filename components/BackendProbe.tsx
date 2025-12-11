
import React, { useState } from 'react';
import { Terminal, Play, ShieldCheck, CheckCircle, XCircle, Activity, Server, Brain, HardHat, Siren, Database, Code } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { INITIAL_RESERVOIRS, INITIAL_RIVERS } from '../constants';

// Initialize Gemini Client for System Tests
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PYTHON BACKEND LOGIC (To be executed by Gemini) ---
const PYTHON_CORE_LOGIC = `
import json

# 1. HYDROLOGY ENGINE
def calculate_runoff(rain_mm_hr, area_sq_km, efficiency):
    runoff_coefficient = efficiency / 100
    # Q = C * I * A (Simplified for Cusecs)
    return int(rain_mm_hr * area_sq_km * runoff_coefficient * 0.5)

def simulate_time_step(capacity, current_level, river_cap, river_flow, inflow, hours):
    inflow_vol = (inflow * 3600 * hours) / 1000000
    new_level = current_level + inflow_vol
    overflow = new_level > capacity
    
    if overflow:
        new_level = capacity
    
    # River Logic: Base + Runoff (20%) + Dam Release (150% if overflow)
    new_flow = river_flow + (inflow * 0.2)
    if overflow:
        new_flow += (inflow * 1.5)

    pct_full = (new_level / capacity) * 100
    
    return {
        "newLevel": new_level, 
        "newFlow": int(new_flow), 
        "overflow": overflow, 
        "pctFull": pct_full
    }

# 2. PRIORITIZATION ENGINE
def calculate_priority(depth, loc_type, pop):
    score = 0
    if depth > 5: score += 50
    elif depth > 2: score += 30
    else: score += 10
    
    if loc_type == 'Hospital': score += 40
    elif loc_type == 'Residential': score += 20
    else: score += 10
    
    if pop > 1000: score += 20
    elif pop > 100: score += 10
    
    if score >= 80: return 'Critical'
    if score >= 50: return 'High'
    if score >= 30: return 'Medium'
    return 'Low'

# 3. INFRA VALIDATION
def validate_proposal(cost_cr, impact_score):
    if cost_cr <= 0 or impact_score <= 0:
        return {"isValid": False, "efficiency": "Invalid"}
        
    ratio = cost_cr / impact_score
    efficiency = 'Moderate'
    if ratio <= 5: efficiency = 'High Value'
    elif ratio > 20: efficiency = 'Low Efficiency'
    
    return {"isValid": True, "efficiency": efficiency}

# --- TEST RUNNER ---
def run_diagnostics():
    results = {}
    
    # Hydrology Test
    runoff_norm = calculate_runoff(15, 426, 60)
    sim_norm = simulate_time_step(3645, 2850, 60000, 15000, runoff_norm, 4)
    results['hydro_normal'] = sim_norm
    
    runoff_ext = calculate_runoff(180, 426, 95)
    sim_ext = simulate_time_step(3645, 3462, 60000, 40000, runoff_ext, 12)
    results['hydro_extreme'] = sim_ext
    
    # Recovery Test
    results['priority_hospital'] = calculate_priority(6, 'Hospital', 5000)
    results['priority_road'] = calculate_priority(1, 'Road', 10)
    
    # Infra Test
    results['infra_high_value'] = validate_proposal(45, 9)
    
    return json.dumps(results)

print(run_diagnostics())
`;

interface TestResult {
  scenario: string;
  category: 'Hydrology' | 'Recovery' | 'Infra' | 'AI Core' | 'Knowledge';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  passed: boolean;
  failureReason?: string;
}

const BackendProbe: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  // --- AI EXECUTION HELPERS ---

  const executePythonSuite = async () => {
    try {
      addLog("Transmitting Python Core Logic to Gemini Kernel...");
      
      const prompt = `
      ACT AS A PYTHON INTERPRETER.
      Execute the following Python code exactly as written.
      The code ends with a print statement that outputs a JSON string.
      
      RETURN ONLY THE RAW JSON OUTPUT. DO NOT USE MARKDOWN BLOCK.
      
      CODE:
      ${PYTHON_CORE_LOGIC}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      const text = (response.text || "").trim().replace(/```json|```/g, '');
      return JSON.parse(text);
    } catch (e) {
      addLog(`CRITICAL ERROR: AI Python Execution Failed - ${e}`);
      return null;
    }
  };

  const executeAgentClassification = async (query: string) => {
    try {
      // Improved prompt with explicit definitions to distinguish Strategist (Budget) from Planner (Action)
      const prompt = `
      Classify the intent of this user query into one of these agents: 
      - Strategist: Long-term infrastructure, budget, finance, ROI analysis, master planning.
      - Planner: Immediate disaster response, field operations, tactical execution, evacuation.
      - Orchestrator: Real-time alerts, warnings, high-level coordination.
      - Monitor: Sensor data, weather tracking, status updates.
      
      Query: "${query}"
      
      Return ONLY the agent name.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      return (response.text || "").trim();
    } catch (e) {
      return "Error";
    }
  };

  const executeRAGExtraction = async (text: string) => {
    try {
      const prompt = `
      Extract key technical terms (Protocol, Budget, Drainage, etc.) from this text:
      "${text}"
      Return as comma-separated list.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      return (response.text || "").trim();
    } catch (e) {
      return "";
    }
  };

  // --- MAIN TEST RUNNER ---

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);

    addLog("INITIALIZING HYDROGUARD AI DIAGNOSTICS...");
    await new Promise(r => setTimeout(r, 400));

    // 1. EXECUTE PYTHON SUITE VIA AI
    addLog("------------------------------------------------");
    addLog("[PHASE 1] REMOTE PYTHON LOGIC EXECUTION");
    addLog("Invoking Gemini-2.5-Flash as Python Runtime...");
    
    const pythonResults = await executePythonSuite();
    
    if (!pythonResults) {
        addLog("ABORTING: Failed to receive valid execution result from AI.");
        setIsRunning(false);
        return;
    }
    
    addLog("Received Computed Results from AI Model.");
    await new Promise(r => setTimeout(r, 500));

    // --- PARSE & VALIDATE HYDROLOGY ---
    addLog("[SUITE 1/5] HYDROLOGY ENGINE");
    const hydroNorm = pythonResults.hydro_normal;
    const hydroPassed = !hydroNorm.overflow && hydroNorm.newFlow < 60000;
    
    setResults(prev => [...prev, {
      scenario: "Hydrology: Normal Rainfall (15mm/hr)",
      category: 'Hydrology',
      inputs: { rain: 15, duration: 4, engine: 'Python/AI' },
      outputs: { level: `${hydroNorm.pctFull.toFixed(1)}%`, flow: hydroNorm.newFlow },
      passed: hydroPassed,
      failureReason: hydroPassed ? undefined : "Unexpected overflow in normal conditions"
    }]);
    addLog(`> Normal Rain Scenario: ${hydroPassed ? 'PASSED' : 'FAILED'}`);

    const hydroExt = pythonResults.hydro_extreme;
    const extPassed = hydroExt.overflow || hydroExt.newFlow > 60000;
    
    setResults(prev => [...prev, {
      scenario: "Hydrology: Extreme Event (180mm/hr)",
      category: 'Hydrology',
      inputs: { rain: 180, duration: 12, engine: 'Python/AI' },
      outputs: { overflow: hydroExt.overflow, flow: hydroExt.newFlow },
      passed: extPassed,
      failureReason: extPassed ? undefined : "Failed to predict flood in extreme scenario"
    }]);
    addLog(`> Extreme Flood Scenario: ${extPassed ? 'PASSED' : 'FAILED'}`);

    // --- PARSE & VALIDATE RECOVERY ---
    await new Promise(r => setTimeout(r, 300));
    addLog("------------------------------------------------");
    addLog("[SUITE 2/5] DISASTER PRIORITIZATION");
    
    const pospPrio = pythonResults.priority_hospital;
    const hospPassed = pospPrio === 'Critical';
    setResults(prev => [...prev, {
      scenario: "Priority: Hospital Inundation",
      category: 'Recovery',
      inputs: { depth: 6, type: 'Hospital' },
      outputs: { priority: pospPrio },
      passed: hospPassed,
      failureReason: `AI calculated ${pospPrio}, expected Critical`
    }]);
    addLog(`> Hospital Logic: ${pospPrio} -> ${hospPassed ? 'PASSED' : 'FAILED'}`);

    // --- PARSE & VALIDATE INFRA ---
    addLog("------------------------------------------------");
    addLog("[SUITE 3/5] INFRASTRUCTURE VALIDATION");
    
    const infraRes = pythonResults.infra_high_value;
    const infraPassed = infraRes.efficiency === 'High Value';
    setResults(prev => [...prev, {
      scenario: "ROI: High Value Proposal",
      category: 'Infra',
      inputs: { cost: 45, impact: 9 },
      outputs: { efficiency: infraRes.efficiency },
      passed: infraPassed,
      failureReason: `AI Calculated ${infraRes.efficiency}, expected High Value`
    }]);
    addLog(`> ROI Calculation: ${infraRes.efficiency} -> ${infraPassed ? 'PASSED' : 'FAILED'}`);

    // 2. EXECUTE NLP TESTS
    await new Promise(r => setTimeout(r, 300));
    addLog("------------------------------------------------");
    addLog("[PHASE 2] NLP & COGNITIVE ENGINE");
    addLog("[SUITE 4/5] KNOWLEDGE BASE RAG");

    const ragText = "Standard Operating Protocol for Flood Drainage Systems. Budget allocation: 50Cr.";
    addLog(`Sending to AI: "${ragText.substring(0, 30)}..."`);
    const ragOutput = await executeRAGExtraction(ragText);
    const ragPassed = ragOutput.toLowerCase().includes('protocol') && ragOutput.toLowerCase().includes('drainage');

    setResults(prev => [...prev, {
      scenario: "RAG: Entity Extraction",
      category: 'Knowledge',
      inputs: { text: "Protocol... Drainage..." },
      outputs: { extracted: ragOutput },
      passed: ragPassed,
      failureReason: "Failed to extract key terms"
    }]);
    addLog(`> Extraction: ${ragOutput} -> ${ragPassed ? 'PASSED' : 'FAILED'}`);

    // 3. AGENT ROUTING
    addLog("------------------------------------------------");
    addLog("[SUITE 5/5] AI AGENT HUB");
    
    const query = "Create a budget plan for the new dam";
    const agentOutput = await executeAgentClassification(query);
    const agentPassed = agentOutput.includes('Strategist');

    setResults(prev => [...prev, {
      scenario: `AI Routing: "${query}"`,
      category: 'AI Core',
      inputs: { query },
      outputs: { routedTo: agentOutput },
      passed: agentPassed,
      failureReason: `Routed to ${agentOutput}, expected Strategist`
    }]);
    addLog(`> Intent Classification: ${agentOutput} -> ${agentPassed ? 'PASSED' : 'FAILED'}`);

    addLog("------------------------------------------------");
    addLog("FULL DIAGNOSTICS COMPLETE.");
    setIsRunning(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Hydrology': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'Recovery': return <Siren className="w-4 h-4 text-red-400" />;
      case 'Infra': return <HardHat className="w-4 h-4 text-orange-400" />;
      case 'AI Core': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'Knowledge': return <Database className="w-4 h-4 text-emerald-400" />;
      default: return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex justify-between items-center backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Server className="w-6 h-6 text-emerald-400" />
            Backend Logic Simulator v4.0 (AI-Powered)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Validates Python backend logic by invoking Gemini as a remote runtime environment.
          </p>
        </div>
        <button 
          onClick={runTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
            isRunning 
            ? 'bg-slate-700 text-slate-400 cursor-wait' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
          }`}
        >
          {isRunning ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Running Live AI Diagnostics...' : 'Execute Full Test Suite'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Terminal Output */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl flex flex-col font-mono text-sm shadow-inner">
           <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center gap-2">
             <Terminal className="w-4 h-4 text-slate-500" />
             <span className="text-slate-400 text-xs uppercase tracking-wider">System Console</span>
           </div>
           <div className="flex-1 p-4 overflow-y-auto space-y-2 text-slate-300">
             {logs.length === 0 ? (
               <div className="opacity-50 text-center mt-10">
                 <Code className="w-12 h-12 mx-auto mb-2" />
                 <p>Ready to compile & execute.</p>
               </div>
             ) : (
               logs.map((log, i) => (
                 <div key={i} className={`${log.includes('PASSED') ? 'text-emerald-400' : log.includes('FAILED') ? 'text-red-400 font-bold' : log.includes('ABORTING') ? 'text-red-500' : ''}`}>
                   {log}
                 </div>
               ))
             )}
             {isRunning && <div className="animate-pulse text-emerald-500">_</div>}
           </div>
        </div>

        {/* Visual Results Board */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {results.length === 0 && !isRunning && (
             <div className="flex-1 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-500">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
                <p>No test results available.</p>
                <p className="text-xs">Run the diagnostics to invoke the AI Kernel.</p>
             </div>
          )}

          {results.map((res, idx) => (
            <div key={idx} className={`bg-slate-900 border-l-4 rounded-r-xl p-5 shadow-lg animate-fade-in-up ${res.passed ? 'border-emerald-500' : 'border-red-500'}`}>
               <div className="flex justify-between items-start mb-3">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       {getCategoryIcon(res.category)}
                       <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{res.category}</span>
                    </div>
                    <h3 className="font-bold text-white text-lg">{res.scenario}</h3>
                 </div>
                 {res.passed ? (
                   <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase bg-emerald-900/20 px-2 py-1 rounded">
                     <CheckCircle className="w-4 h-4" /> Passed
                   </div>
                 ) : (
                   <div className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase bg-red-900/20 px-2 py-1 rounded">
                     <XCircle className="w-4 h-4" /> Failed
                   </div>
                 )}
               </div>

               {!res.passed && res.failureReason && (
                 <div className="mb-3 p-2 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-300">
                   Reason: {res.failureReason}
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Inputs</span>
                    <ul className="space-y-1 text-slate-300">
                      {Object.entries(res.inputs).map(([k, v]) => (
                        <li key={k}><span className="text-slate-500">{k}:</span> {v}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Outputs (AI Generated)</span>
                    <ul className="space-y-1">
                      {Object.entries(res.outputs).map(([k, v]) => (
                        <li key={k} className="text-white"><span className="text-slate-500">{k}:</span> {v}</li>
                      ))}
                    </ul>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackendProbe;

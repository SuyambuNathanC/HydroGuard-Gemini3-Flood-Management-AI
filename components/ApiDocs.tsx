
import React, { useState } from 'react';
import { BookOpen, Server, Globe, Database, Cpu, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const ApiDocs: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['All', 'Simulation', 'Recovery', 'Infrastructure', 'AI Agents'];

  const endpoints = [
    {
      id: 'sim-run',
      method: 'POST',
      path: '/api/v1/simulation/run',
      category: 'Simulation',
      summary: 'Execute Hydrology Simulation',
      description: 'Runs a time-step simulation to calculate reservoir levels and river flow based on rainfall intensity and soil saturation.',
      request: {
        "rainfall_intensity": 45,
        "duration_hours": 4,
        "soil_saturation": 60,
        "tide_level": 0.5
      },
      response: {
        "status": "success",
        "data": {
          "reservoirs": [
            { "id": "res-1", "level_mcft": 3000, "percent_full": 82.3 }
          ],
          "rivers": [
            { "id": "riv-1", "flow_cusecs": 15500, "status": "Warning" }
          ],
          "alerts_triggered": true
        }
      }
    },
    {
      id: 'recovery-prio',
      method: 'POST',
      path: '/api/v1/recovery/prioritize',
      category: 'Recovery',
      summary: 'Calculate Rescue Priority',
      description: 'Determines the urgency score and priority level for a specific location based on flood depth and population vulnerability.',
      request: {
        "location_id": "loc-123",
        "flood_depth_ft": 6.5,
        "location_type": "Hospital",
        "population_at_risk": 450
      },
      response: {
        "priority_level": "Critical",
        "score": 95,
        "recommended_action": "Immediate Evacuation",
        "required_resources": ["Boat", "Medical Team"]
      }
    },
    {
      id: 'infra-valid',
      method: 'POST',
      path: '/api/v1/infra/validate',
      category: 'Infrastructure',
      summary: 'Validate Project Proposal',
      description: 'Analyzes an infrastructure proposal for cost-efficiency and strategic alignment using the internal Python logic engine.',
      request: {
        "project_type": "Drainage",
        "estimated_cost_cr": 45.5,
        "impact_score": 9,
        "timeline_months": 12
      },
      response: {
        "is_valid": true,
        "efficiency_rating": "High Value",
        "roi_index": 0.85,
        "ai_analysis": "Project cost is justified by the high impact score."
      }
    },
    {
      id: 'agent-query',
      method: 'POST',
      path: '/api/v1/agents/query',
      category: 'AI Agents',
      summary: 'Query AI Agent',
      description: 'Sends a natural language query to a specific AI persona (Monitor, Planner, Strategist) with RAG context injection.',
      request: {
        "agent_role": "Strategist",
        "query": "Draft a budget for the new dam project",
        "context_filters": {
          "include_rag": true,
          "city_id": "chennai"
        }
      },
      response: {
        "agent_response": "Based on the 2024 Master Plan...",
        "citations": ["Budget_Report_2023.pdf"],
        "suggested_actions": ["Review allocations", "Approve draft"]
      }
    },
    {
      id: 'knowledge-upload',
      method: 'PUT',
      path: '/api/v1/knowledge/{doc_id}',
      category: 'AI Agents',
      summary: 'Index Document',
      description: 'Uploads and indexes a document into the Vector Database for RAG retrieval.',
      request: {
        "file_name": "SOP_Flood_2024.pdf",
        "content_type": "application/pdf",
        "content_base64": "JVBERi0xLjQK..."
      },
      response: {
        "doc_id": "doc-882",
        "status": "Indexed",
        "chunks_created": 45,
        "summary": "Standard operating procedures for urban flooding."
      }
    }
  ];

  const filteredEndpoints = activeCategory === 'All' 
    ? endpoints 
    : endpoints.filter(e => e.category === activeCategory);

  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'POST': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PUT': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-10">
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Server className="w-6 h-6 text-indigo-400" />
            REST API Reference
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Documentation for the HydroGuard Backend API endpoints.
          </p>
        </div>
        
        {/* Category Filter */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredEndpoints.map((endpoint) => (
          <div key={endpoint.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-colors">
            {/* Header */}
            <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className={`px-2 py-1 rounded text-xs font-bold font-mono border ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-slate-200 font-mono">{endpoint.path}</code>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                   {endpoint.category}
                 </span>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Description & Params */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{endpoint.summary}</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  {endpoint.description}
                </p>
                
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                   <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-400 uppercase">Request Body</span>
                     <button 
                        onClick={() => handleCopy(JSON.stringify(endpoint.request, null, 2), `req-${endpoint.id}`)}
                        className="text-slate-500 hover:text-white transition-colors"
                     >
                        {copiedId === `req-${endpoint.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                     </button>
                   </div>
                   <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                     {JSON.stringify(endpoint.request, null, 2)}
                   </pre>
                </div>
              </div>

              {/* Response */}
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">200 OK</span>
                 </div>
                 <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden h-full max-h-[300px]">
                   <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-400 uppercase">Response Body</span>
                     <button 
                        onClick={() => handleCopy(JSON.stringify(endpoint.response, null, 2), `res-${endpoint.id}`)}
                        className="text-slate-500 hover:text-white transition-colors"
                     >
                        {copiedId === `res-${endpoint.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                     </button>
                   </div>
                   <pre className="p-3 text-xs font-mono text-blue-300 overflow-x-auto custom-scrollbar">
                     {JSON.stringify(endpoint.response, null, 2)}
                   </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiDocs;

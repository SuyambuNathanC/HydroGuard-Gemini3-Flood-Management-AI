
import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, ChatMessage, SimulationState, Reservoir, River, CityProfile, CityDocument, RecoveryTask, InfraPlan } from '../types';
import { generateAgentResponse } from '../services/geminiService';
import { 
  Send, Bot, User, Brain, AlertOctagon, Activity, Map, Radio, 
  CheckCircle, ThumbsUp, ThumbsDown, GitCompare, MoreHorizontal, MoreVertical,
  TrendingUp, FileText, ClipboardList, ShieldAlert, ArrowRight, TrendingDown, Minus,
  Paperclip, Image as ImageIcon, File, X, Lightbulb, Users, MapPin, Share2, Video, Mic, Database
} from 'lucide-react';

interface AgentChatProps {
  reservoirs: Reservoir[];
  rivers: River[];
  simulationState: SimulationState;
  cityProfile: CityProfile;
  knowledgeBase: CityDocument[];
  chatHistory: Record<AgentRole, ChatMessage[]>;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<AgentRole, ChatMessage[]>>>;
  // New Props for Cross-Module Awareness
  recoveryTasks?: RecoveryTask[];
  infraPlans?: InfraPlan[];
}

// Comparison Data Interface
interface ComparisonData {
  type: 'comparison_card';
  title: string;
  summary: string;
  items: {
    metric: string;
    current: string;
    baseline: string;
    status: 'Critical' | 'Warning' | 'Stable';
    trend: 'up' | 'down' | 'flat';
  }[];
  recommendation: string;
}

// Critical Alert Interface
interface CriticalAlertData {
  type: 'critical_alert';
  severity: 'Critical' | 'High';
  title: string;
  message: string;
  action_items: string[];
}

const AgentChat: React.FC<AgentChatProps> = ({ 
  reservoirs, 
  rivers, 
  simulationState, 
  cityProfile, 
  knowledgeBase,
  chatHistory,
  setChatHistory,
  recoveryTasks,
  infraPlans
}) => {
  const [activeRole, setActiveRole] = useState<AgentRole>(AgentRole.MONITOR);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // For message actions
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false); // For header actions
  
  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_units'); // 'all_units', 'commanders', 'specific_team'

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<{file: File, preview: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive current messages based on active tab
  const messages = chatHistory[activeRole];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRole]);

  // Click outside listener for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Close Message Menu
      if (activeMenuId && !target.closest('.action-menu-trigger')) {
        setActiveMenuId(null);
      }
      // Close Header Menu
      if (isHeaderMenuOpen && !target.closest('.header-menu-trigger')) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId, isHeaderMenuOpen]);

  // --- FILE HANDLING ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      let fileType = 'file';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      reader.onloadend = () => {
        setSelectedFile({
          file,
          preview: reader.result as string,
          type: fileType
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- MESSAGING ---

  const handleSend = async (overrideText?: string, isComparisonRequest: boolean = false) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !selectedFile) return;

    // Construct User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    if (selectedFile) {
      userMsg.attachment = {
        name: selectedFile.file.name,
        type: selectedFile.type as any,
        url: selectedFile.preview
      };
    }

    setChatHistory(prev => ({
      ...prev,
      [activeRole]: [...prev[activeRole], userMsg]
    }));

    if (!overrideText) {
      setInput('');
      clearFile();
    }
    setIsLoading(true);

    // Prepare Attachment Data for API if exists
    let attachmentData = undefined;
    if (userMsg.attachment && userMsg.attachment.url) {
      // Extract base64 content (remove data:image/png;base64, prefix)
      const base64Data = userMsg.attachment.url.split(',')[1];
      attachmentData = {
        base64: base64Data,
        mimeType: selectedFile?.file.type || 'image/jpeg'
      };
    }

    const responseText = await generateAgentResponse(
      activeRole,
      textToSend,
      {
        simulation: simulationState,
        reservoirs: reservoirs,
        rivers: rivers,
        city: cityProfile, // Passed City Context
        knowledgeBase: knowledgeBase, // Passed Knowledge Base
        recoveryTasks: recoveryTasks, // Passed Recovery Tasks
        infraPlans: infraPlans // Passed Infra Plans
      },
      isComparisonRequest,
      attachmentData,
      messages // Pass History
    );

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
      agentRole: activeRole
    };

    setChatHistory(prev => ({
      ...prev,
      [activeRole]: [...prev[activeRole], aiMsg]
    }));
    setIsLoading(false);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setChatHistory(prev => {
      const roleHistory = prev[activeRole];
      const updatedHistory = roleHistory.map(msg => 
        msg.id === msgId ? { ...msg, feedback: type } : msg
      );
      return { ...prev, [activeRole]: updatedHistory };
    });
  };

  const handleAction = (action: string, msg: ChatMessage) => {
    setActiveMenuId(null);
    let prompt = "";
    
    // Check if message content is JSON to handle prompt context correctly
    const isStructured = msg.text.trim().startsWith('{') && msg.text.includes('"type":');
    prompt = isStructured 
      ? `Regarding the data above: ` 
      : `Regarding your last point: "${msg.text.substring(0, 50)}...": `;

    switch(action) {
      case 'analyze':
        // Explicitly ask for TEXT to avoid JSON loop
        handleSend(prompt + "Perform a deep root cause analysis in plain text. Explain why this is happening.");
        break;
      case 'forecast':
        handleSend(prompt + "Forecast the trend for the next 24 hours.");
        break;
      case 'report':
        handleSend(prompt + "Generate a formal incident report summary.");
        break;
      case 'assign':
        const taskMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: "✅ **Task Created:** I have logged this as a high-priority action item in the Disaster Recovery module.",
          timestamp: new Date(),
          agentRole: activeRole
        };
        setChatHistory(prev => ({ ...prev, [activeRole]: [...prev[activeRole], taskMsg] }));
        break;
      case 'broadcast':
        let contentToBroadcast = msg.text;
        if (isStructured) {
          try {
             const data = JSON.parse(msg.text);
             contentToBroadcast = `[${data.severity || 'ALERT'}] ${data.title}: ${data.message || data.summary}`;
          } catch(e) { /* fallback */ }
        }
        setBroadcastContent(contentToBroadcast);
        setIsBroadcastModalOpen(true);
        break;
    }
  };
  
  const handleHeaderAction = (action: string) => {
    setIsHeaderMenuOpen(false);
    switch(action) {
      case 'analysis':
        handleSend("Provide a comprehensive system analysis considering all current sensor inputs. Respond in plain text.");
        break;
      case 'forecast':
        handleSend("Generate a 48-hour strategic forecast based on current trajectory.");
        break;
      case 'broadcast':
        setBroadcastContent('');
        setIsBroadcastModalOpen(true);
        break;
      case 'immediate_action':
        handleSend("Generate an IMMEDIATE RESPONSE PROTOCOL list for the current situation. Focus on life safety and asset protection.");
        break;
    }
  };

  const submitBroadcast = () => {
    if (!broadcastContent.trim()) return;
    
    // Simulate Broadcast
    const taskMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      text: `📢 **Broadcast Sent**\n**To:** ${broadcastTarget === 'all_units' ? 'All Field Units' : broadcastTarget === 'commanders' ? 'Gold Command' : 'Team Alpha'}\n**Message:** "${broadcastContent}"`,
      timestamp: new Date(),
      agentRole: activeRole
    };
    setChatHistory(prev => ({ ...prev, [activeRole]: [...prev[activeRole], taskMsg] }));
    
    setIsBroadcastModalOpen(false);
    setBroadcastContent('');
  };

  const handleCompareScenarios = () => {
    let comparisonPrompt = "";
    switch(activeRole) {
      case AgentRole.MONITOR: comparisonPrompt = "Compare current metrics (Rainfall, Inflow) against the historical baseline."; break;
      case AgentRole.ORCHESTRATOR: comparisonPrompt = "Compare current alert volume and severity against standard operating thresholds."; break;
      case AgentRole.PLANNER: comparisonPrompt = "Compare standard response protocols vs. recommended aggressive response for this scenario."; break;
      case AgentRole.STRATEGIST: comparisonPrompt = "Compare cost-benefit of short-term relief vs long-term infrastructure investment."; break;
      default: comparisonPrompt = "Compare current status vs baseline.";
    }
    handleSend(comparisonPrompt, true);
  };

  const roles = [
    { id: AgentRole.MONITOR, icon: Activity, label: 'Situation Monitor', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: AgentRole.ORCHESTRATOR, icon: AlertOctagon, label: 'Alert Orchestrator', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: AgentRole.PLANNER, icon: Map, label: 'Action Planner', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: AgentRole.STRATEGIST, icon: Brain, label: 'Infra Strategist', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  // --- RENDER HELPERS ---

  const renderComparisonCard = (data: ComparisonData) => (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mt-2 mb-2 w-full max-w-lg shadow-lg">
       <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
          <h4 className="font-bold text-white flex items-center gap-2">
             <GitCompare className="w-4 h-4 text-blue-400" />
             {data.title}
          </h4>
       </div>
       <div className="text-sm text-slate-300 mb-4 bg-slate-800/50 p-2 rounded border-l-2 border-blue-500">
         {data.summary}
       </div>
       <div className="grid gap-2 mb-4">
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
             <span>Metric</span>
             <span>Current</span>
             <span>Baseline</span>
             <span className="text-right">Status</span>
          </div>
          {data.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-4 items-center text-sm bg-slate-800/50 p-2 rounded border border-slate-700/30">
               <span className="font-medium text-slate-200 truncate pr-2">{item.metric}</span>
               <span className="font-mono text-white">{item.current}</span>
               <span className="font-mono text-slate-400">{item.baseline}</span>
               <div className="flex justify-end">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                    item.status === 'Critical' ? 'bg-red-500/20 text-red-400' : 
                    item.status === 'Warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.status}
                    {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    {item.trend === 'flat' && <Minus className="w-3 h-3" />}
                  </span>
               </div>
            </div>
          ))}
       </div>
       <div className="pt-3 border-t border-slate-700">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Recommendation:</span>
          <p className="text-sm text-white mt-1">{data.recommendation}</p>
       </div>
    </div>
  );

  const renderCriticalAlert = (data: CriticalAlertData) => (
    <div className={`mt-2 mb-2 w-full max-w-lg border rounded-lg p-4 shadow-2xl relative overflow-hidden ${
      data.severity === 'Critical' 
        ? 'bg-red-950/40 border-red-500/50' 
        : 'bg-orange-950/40 border-orange-500/50'
    }`}>
      {/* Background Pulse Effect */}
      <div className={`absolute top-0 left-0 w-1 h-full ${data.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
      
      <div className="flex items-start gap-3 mb-3">
         <div className={`p-2 rounded-lg shrink-0 ${data.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
            <ShieldAlert className="w-6 h-6 animate-pulse" />
         </div>
         <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${data.severity === 'Critical' ? 'text-red-400' : 'text-orange-400'}`}>
              {data.severity} Alert
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">{data.title}</h3>
         </div>
      </div>

      <div className="text-slate-200 text-sm mb-4 leading-relaxed">
        {data.message}
      </div>

      {data.action_items && data.action_items.length > 0 && (
        <div className="bg-black/20 rounded p-3">
           <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Required Actions</h5>
           <ul className="space-y-2">
             {data.action_items.map((action, idx) => (
               <li key={idx} className="flex items-start gap-2 text-sm text-white">
                 <CheckCircle className={`w-4 h-4 mt-0.5 ${data.severity === 'Critical' ? 'text-red-400' : 'text-orange-400'}`} />
                 {action}
               </li>
             ))}
           </ul>
        </div>
      )}
    </div>
  );

  const renderMessageContent = (msg: ChatMessage) => {
    // 1. Render Attachments if any
    let attachmentContent = null;
    if (msg.attachment) {
      attachmentContent = (
        <div className="mb-3">
          {msg.attachment.type === 'image' ? (
            <img src={msg.attachment.url} alt="Uploaded" className="max-w-xs rounded-lg border border-slate-600" />
          ) : msg.attachment.type === 'video' ? (
             <video src={msg.attachment.url} controls className="max-w-xs rounded-lg border border-slate-600" />
          ) : msg.attachment.type === 'audio' ? (
             <audio src={msg.attachment.url} controls className="w-full max-w-xs" />
          ) : (
            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 w-fit">
               <FileText className="w-4 h-4 text-blue-400" />
               <span className="text-xs text-slate-300">{msg.attachment.name}</span>
            </div>
          )}
        </div>
      );
    }

    // 2. Parse Structured Data (JSON) or Plain Text
    let content = null;
    const cleanText = msg.text.trim();
    
    // Check if it looks like JSON
    if ((cleanText.startsWith('{') && cleanText.endsWith('}')) || (cleanText.startsWith('[') && cleanText.endsWith(']'))) {
      try {
        const data = JSON.parse(cleanText);
        if (data.type === 'comparison_card') {
          content = renderComparisonCard(data as ComparisonData);
        } else if (data.type === 'critical_alert') {
          content = renderCriticalAlert(data as CriticalAlertData);
        } else {
          // Fallback for generic JSON: Display the message/text content if available, otherwise stringify.
          // This handles cases where the model returns JSON for standard responses.
           const fallbackText = data.message || data.text || data.summary || JSON.stringify(data, null, 2);
           content = <div className="text-slate-200 whitespace-pre-wrap">{fallbackText}</div>;
        }
      } catch (e) {
        // Fallback if JSON parse fails
        content = <div className="text-slate-200 whitespace-pre-wrap">{msg.text}</div>;
      }
    } else {
      content = <div className="text-slate-200 whitespace-pre-wrap">{msg.text}</div>;
    }

    return (
      <>
        {attachmentContent}
        {content}
      </>
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 relative">
      {/* ... (Previous code remains, including Sidebar, Header) ... */}
      
      {/* Sidebar - Agents */}
      <div className="w-64 flex flex-col gap-2 shrink-0">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 px-2">Select AI Agent</h3>
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRole(r.id)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
              activeRole === r.id 
                ? 'bg-slate-800 border border-slate-700 shadow-md' 
                : 'hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-md ${r.bg}`}>
              <r.icon className={`w-5 h-5 ${r.color}`} />
            </div>
            <div>
              <div className={`text-sm font-medium ${activeRole === r.id ? 'text-white' : 'text-slate-300'}`}>{r.label}</div>
            </div>
          </button>
        ))}

        {/* Knowledge Base Status Indicator */}
        <div className="mt-6 px-2">
           <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Connected Knowledge</h3>
           <div className={`flex items-center gap-2 p-2 rounded-lg border ${knowledgeBase.filter(d => d.status === 'Ready').length > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <Database className={`w-4 h-4 ${knowledgeBase.filter(d => d.status === 'Ready').length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="flex flex-col">
                 <span className="text-xs text-white font-medium">{knowledgeBase.filter(d => d.status === 'Ready').length} Documents</span>
                 <span className="text-[10px] text-slate-400">Available for RAG</span>
              </div>
           </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl flex flex-col overflow-hidden backdrop-blur-sm relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center relative">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">{activeRole}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-2">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {cityProfile.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCompareScenarios}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>

            {/* Quick Action for Planner */}
            {activeRole === AgentRole.PLANNER && (
               <button 
                 onClick={() => handleHeaderAction('immediate_action')}
                 className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-red-900/20 transition-colors animate-pulse"
               >
                 <ShieldAlert className="w-3.5 h-3.5" />
                 Execute Immediate Protocol
               </button>
            )}

            {/* Header Three Dot Menu */}
            <div className="relative header-menu-trigger">
               <button 
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className={`p-1.5 rounded-lg border border-transparent hover:bg-slate-700 hover:border-slate-600 text-slate-400 transition-colors ${isHeaderMenuOpen ? 'bg-slate-700 text-white' : ''}`}
               >
                 <MoreVertical className="w-4 h-4" />
               </button>
               {isHeaderMenuOpen && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-down">
                    <div className="p-2 border-b border-slate-700/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50">Global Actions</div>
                    <button onClick={() => handleHeaderAction('analysis')} className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/30">
                       <Activity className="w-3.5 h-3.5 text-blue-400" /> Deep System Analysis
                    </button>
                    <button onClick={() => handleHeaderAction('forecast')} className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/30">
                       <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Strategic Forecast
                    </button>
                    <button onClick={() => handleHeaderAction('broadcast')} className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                       <Radio className="w-3.5 h-3.5 text-red-400" /> Broadcast to Teams
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
               <Brain className="w-16 h-16 mb-4" />
               <p>Select an agent and start the conversation.</p>
               <p className="text-sm mt-2">Upload images, video, or audio for multimodal analysis.</p>
             </div>
          )}
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start group'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="max-w-[85%] flex flex-col gap-2">
                <div 
                  className={`p-3 rounded-2xl text-sm leading-relaxed relative ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>

                {/* Agent Action Bar */}
                {msg.role === 'model' && (
                  <div className="flex items-center justify-between gap-4 px-1 h-6">
                    {/* Feedback Controls */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleFeedback(msg.id, 'up')}
                         className={`p-1 rounded hover:bg-slate-700 transition-colors ${msg.feedback === 'up' ? 'text-green-400' : 'text-slate-500'}`}
                         title="Helpful"
                       >
                         <ThumbsUp className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={() => handleFeedback(msg.id, 'down')}
                         className={`p-1 rounded hover:bg-slate-700 transition-colors ${msg.feedback === 'down' ? 'text-red-400' : 'text-slate-500'}`}
                         title="Not Helpful"
                       >
                         <ThumbsDown className="w-3.5 h-3.5" />
                       </button>
                    </div>

                    {/* Action Menu Trigger (Message Specific) */}
                    <div className="relative action-menu-trigger">
                      <button 
                         onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                         className={`p-1 rounded hover:bg-slate-700 text-slate-400 transition-colors ${activeMenuId === msg.id ? 'bg-slate-700 text-white' : ''}`}
                      >
                         <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === msg.id && (
                        <div className="absolute top-6 left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                           <button onClick={() => handleAction('analyze', msg)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <Activity className="w-3 h-3" /> Deep Analysis
                           </button>
                           <button onClick={() => handleAction('forecast', msg)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <TrendingUp className="w-3 h-3" /> Forecast Trend
                           </button>
                           <button onClick={() => handleAction('assign', msg)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <ShieldAlert className="w-3 h-3" /> Create Task
                           </button>
                           <button onClick={() => handleAction('broadcast', msg)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <Radio className="w-3 h-3" /> Broadcast
                           </button>
                           <div className="h-px bg-slate-700 mx-2"></div>
                           <button onClick={() => handleAction('report', msg)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Generate Report
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
           {/* File Preview */}
           {selectedFile && (
             <div className="mb-2 flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700 w-fit animate-fade-in">
                {selectedFile.type === 'image' ? (
                   <ImageIcon className="w-4 h-4 text-purple-400" />
                ) : selectedFile.type === 'video' ? (
                   <Video className="w-4 h-4 text-red-400" />
                ) : selectedFile.type === 'audio' ? (
                   <Mic className="w-4 h-4 text-yellow-400" />
                ) : (
                   <File className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-xs text-white max-w-[200px] truncate">{selectedFile.file.name}</span>
                <button onClick={clearFile} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
             </div>
           )}

          <div className="flex gap-2">
            {/* File Upload Trigger */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.txt,.csv,.json"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${selectedFile ? 'bg-slate-800 text-blue-400 border-blue-500/50' : ''}`}
              title="Upload Image, Video, Audio, or Doc"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask ${activeRole} about uploaded docs or incidents...`}
              disabled={isLoading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- BROADCAST MODAL --- */}
        {isBroadcastModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                   <h3 className="font-bold text-white flex items-center gap-2">
                     <Radio className="w-5 h-5 text-red-400" />
                     Broadcast Message
                   </h3>
                   <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-white">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-6">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Audience</label>
                      <select 
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="all_units">All Units</option>
                        <option value="commanders">Commanders Only</option>
                        <option value="specific_team">Specific Team (Alpha)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message</label>
                      <textarea 
                        value={broadcastContent}
                        onChange={(e) => setBroadcastContent(e.target.value)}
                        placeholder="Type alert message..."
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 h-24"
                      />
                   </div>
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-2">
                   <button onClick={() => setIsBroadcastModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                   <button 
                     onClick={submitBroadcast}
                     className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm flex items-center gap-2"
                   >
                     <Share2 className="w-4 h-4" /> Send Broadcast
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChat;

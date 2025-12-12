
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InfraPlan, ChatMessage, CityProfile, SimulationState } from '../types';
import { analyzeInfraPlan, generateStrategyChatResponse, generateProactiveProposal } from '../services/geminiService';
import { 
  HardHat, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  MessageSquare,
  Layout,
  Send,
  Bot,
  User,
  Plus,
  ArrowRightLeft,
  X,
  PieChart,
  Calendar,
  Edit3,
  Save,
  PlayCircle,
  FileText,
  AlertTriangle,
  Info,
  MapPin,
  Upload,
  RefreshCw,
  Trash2,
  Paperclip,
  Download,
  Video,
  Mic,
  Image as ImageIcon
} from 'lucide-react';

interface InfraStrategistProps {
  cityProfile?: CityProfile;
  simulationState?: SimulationState;
  // Lifted Props for Persistence
  plans: InfraPlan[];
  setPlans: React.Dispatch<React.SetStateAction<InfraPlan[]>>;
  drafts: InfraPlan[];
  setDrafts: React.Dispatch<React.SetStateAction<InfraPlan[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const InfraStrategist: React.FC<InfraStrategistProps> = ({ 
  cityProfile, 
  simulationState,
  plans,
  setPlans,
  drafts,
  setDrafts,
  messages,
  setMessages
}) => {
  // --- STATE ---
  const [activeView, setActiveView] = useState<'strategy' | 'portfolio'>('portfolio');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Chat Input State (Local)
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<{file: File, preview: string, type: string} | null>(null);
  
  // Interaction State
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InfraPlan | null>(null); // For detailed view

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InfraPlan>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const chatFileUploadRef = useRef<HTMLInputElement>(null);

  // --- AUTOMATIC GENERATION EFFECT ---
  // Ensure we have an intro message if history is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'intro',
        role: 'model',
        text: `Hello. I am your Infrastructure Strategist. I have analyzed the current situation for ${cityProfile?.name || 'the region'} and identified key challenges.`,
        timestamp: new Date()
      }]);
    }
  }, [messages.length, cityProfile?.name, setMessages]);

  useEffect(() => {
    const triggerProactiveAnalysis = async () => {
      if (!cityProfile || !simulationState) return;

      setIsTyping(true);
      
      // Generate a proactive proposal based on current context
      const autoProposals = await generateProactiveProposal(cityProfile, simulationState);
      
      if (autoProposals && autoProposals.length > 0) {
        
        // Add introductory message
        setMessages(prev => [...prev, {
          id: `intro-text-${Date.now()}`,
          role: 'model',
          text: `Based on the active simulation (Rainfall: ${simulationState.rainfallIntensityMmHr}mm/hr) and ${cityProfile.name}'s topography, I have generated a **Strategic Roadmap** covering immediate, medium-term, and long-term interventions:`,
          timestamp: new Date()
        }]);

        // Add each proposal as a separate message card
        // Map index to strategic term
        const terms: ('Short-Term' | 'Medium-Term' | 'Long-Term')[] = ['Short-Term', 'Medium-Term', 'Long-Term'];

        const newMessages: ChatMessage[] = autoProposals.map((prop, index) => ({
          id: `auto-${Date.now()}-${index}`,
          role: 'model',
          text: '', // Empty text as the card displays the content
          timestamp: new Date(),
          proposal: {
            ...prop as InfraPlan,
            id: `auto-prop-${Date.now()}-${index}`,
            status: 'Draft',
            progress: 0,
            spentBudget: '₹0 Cr',
            forecastStatus: 'On Track',
            strategicTerm: terms[index] || 'Medium-Term' // Assign Term
          }
        }));

        setMessages(prev => [...prev, ...newMessages]);
      } else {
        // Fallback message if generation fails or returns empty
        const fallbackMsg: ChatMessage = {
           id: Date.now().toString(),
           role: 'model',
           text: "I've reviewed the current metrics. No critical infrastructure gaps detected requiring immediate automated proposal. You can manually request one.",
           timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
      setIsTyping(false);
    };

    // Trigger only if we are in strategy view and messages are just intro (or context changed significantly - simplified here to on mount/view switch if empty)
    if (activeView === 'strategy' && messages.length <= 1) {
       triggerProactiveAnalysis();
    }
  }, [activeView, cityProfile, simulationState]); 

  // --- DERIVED METRICS ---
  const metrics = useMemo(() => {
    let totalAllocated = 0;
    let totalSpent = 0;
    
    plans.filter(p => p.status === 'Active' || p.status === 'Approved').forEach(p => {
      // Parse "₹120 Cr" -> 120
      const cost = parseInt(p.estimatedCost.replace(/[^0-9]/g, '')) || 0;
      const spent = p.spentBudget ? parseInt(p.spentBudget.replace(/[^0-9]/g, '')) : 0;
      
      totalAllocated += cost;
      totalSpent += spent;
    });

    const activeCount = plans.filter(p => p.status === 'Active').length;
    
    // Weighted progress
    const totalProgress = plans
      .filter(p => p.status === 'Active')
      .reduce((acc, p) => acc + (p.progress || 0), 0);
    const avgProgress = activeCount > 0 ? Math.round(totalProgress / activeCount) : 0;

    return {
      allocated: totalAllocated,
      spent: totalSpent,
      percentSpent: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      avgProgress
    };
  }, [plans]);

  // --- ACTIONS ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  // --- CHAT & UPLOAD LOGIC ---
  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    if (selectedFile) {
        userMsg.attachment = {
            name: selectedFile.file.name,
            type: selectedFile.type as any,
            url: selectedFile.preview
        };
    }

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedFile(null);
    setIsTyping(true);

    // Prepare Attachment Data for API if exists
    let attachmentData = undefined;
    if (userMsg.attachment && userMsg.attachment.url) {
      const base64Data = userMsg.attachment.url.split(',')[1];
      attachmentData = {
        base64: base64Data,
        mimeType: selectedFile?.file.type || 'image/jpeg'
      };
    }

    // Pass History, City Profile, and Simulation State to service
    const { text, proposal } = await generateStrategyChatResponse(
      inputValue,
      messages, 
      cityProfile && simulationState ? { city: cityProfile, simulation: simulationState } : undefined,
      attachmentData
    );

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: text,
      timestamp: new Date()
    };

    // If API returned a proposal, attach it to the message but DO NOT auto-save to drafts yet
    if (proposal) {
      aiMsg.proposal = {
        ...proposal as InfraPlan,
        id: `prop-${Date.now()}`,
        status: 'Draft',
        progress: 0,
        spentBudget: '₹0 Cr',
        forecastStatus: 'On Track'
      };
    }

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleSaveDraft = (msgId: string, proposal: InfraPlan) => {
    if (drafts.find(d => d.id === proposal.id)) return;
    
    // Add to drafts
    setDrafts(prev => [proposal, ...prev]);
    
    // Mark message as saved to update UI
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isSaved: true } : m));
  };

  const handleApproveFromChat = (msgId: string, proposal: InfraPlan) => {
    const approvedPlan: InfraPlan = { ...proposal, status: 'Proposed', startDate: new Date().toISOString().split('T')[0] };
    setPlans(prev => [...prev, approvedPlan]);
    
    // Also mark as saved/processed in chat so user knows it's done
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isSaved: true } : m));
    
    // Switch to portfolio to see it
    setActiveView('portfolio');
  };

  const handleApproveDraft = (draft: InfraPlan) => {
    const approvedPlan: InfraPlan = { ...draft, status: 'Proposed', startDate: new Date().toISOString().split('T')[0] };
    setPlans(prev => [...prev, approvedPlan]);
    setDrafts(prev => prev.filter(d => d.id !== draft.id));
    setActiveView('portfolio');
  };

  const generateTextReport = (plan: InfraPlan) => {
    return `
INFRASTRUCTURE STRATEGIC PROPOSAL
---------------------------------
Title: ${plan.title}
Date: ${new Date().toLocaleDateString()}
Status: ${plan.status}
Strategic Term: ${plan.strategicTerm || 'N/A'}

OVERVIEW
--------
Description: ${plan.description}
Estimated Cost: ${plan.estimatedCost}
Timeline: ${plan.timeline}
Impact Score: ${plan.impactScore}/10

TECHNICAL SPECIFICATIONS
------------------------
Type: ${plan.type}
Water Path: ${plan.waterPath || 'N/A'}
Capacity: ${plan.totalCapacity || 'N/A'}
Length/Area: ${plan.length || 'N/A'}
Soil Condition: ${plan.soilUrbanCondition || 'N/A'}

IMMEDIATE ACTION ITEMS
----------------------
${plan.immediateActions ? plan.immediateActions.map(a => `- ${a}`).join('\n') : 'None listed.'}

ANALYSIS
--------
Benefits:
${plan.benefits ? plan.benefits.map(b => `- ${b}`).join('\n') : 'N/A'}

Risks:
${plan.risks ? plan.risks.map(r => `- ${r}`).join('\n') : 'N/A'}

AI STRATEGIC ANALYSIS
---------------------
${plan.aiAnalysis || 'Analysis pending.'}
    `.trim();
  };

  const handleDownload = (plan: InfraPlan) => {
    const reportText = generateTextReport(plan);
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(reportText);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Report-${plan.title.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- EDITING LOGIC ---
  const handleStartEdit = (plan: InfraPlan) => {
    setEditingId(plan.id);
    setEditForm({ ...plan });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = (originalId: string, context: 'chat' | 'draft' | 'detail' | 'portfolio') => {
    // 1. Update in Messages if it exists there
    setMessages(prev => prev.map(m => {
       if (m.proposal?.id === originalId) {
         return { ...m, proposal: { ...m.proposal, ...editForm } as InfraPlan };
       }
       return m;
    }));

    // 2. Update in Drafts if it exists there
    setDrafts(prev => prev.map(d => d.id === originalId ? { ...d, ...editForm } as InfraPlan : d));

    // 3. Update in Plans if it exists there
    setPlans(prev => prev.map(p => p.id === originalId ? { ...p, ...editForm } as InfraPlan : p));

    // 4. Update Selected Plan if open
    if (selectedPlan && selectedPlan.id === originalId) {
      setSelectedPlan({ ...selectedPlan, ...editForm } as InfraPlan);
    }

    setEditingId(null);
    setEditForm({});
  };

  const handleCreateManualProposal = (asDraft: boolean = true) => {
    const newPlan: InfraPlan = {
      id: `manual-${Date.now()}`,
      title: editForm.title || 'New Proposal',
      description: editForm.description || 'Description pending...',
      estimatedCost: editForm.estimatedCost || '₹0 Cr',
      timeline: editForm.timeline || 'TBD',
      type: editForm.type || 'Drainage',
      impactScore: editForm.impactScore || 5,
      status: asDraft ? 'Draft' : 'Proposed',
      waterPath: editForm.waterPath || '',
      totalCapacity: editForm.totalCapacity || '',
      length: editForm.length || '',
      soilUrbanCondition: editForm.soilUrbanCondition || '',
      benefits: editForm.benefits || [],
      risks: editForm.risks || [],
      progress: 0
    };
    
    if (asDraft) {
      setDrafts(prev => [newPlan, ...prev]);
    } else {
      setPlans(prev => [newPlan, ...prev]);
    }
    
    setShowCreateModal(false);
    setEditForm({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setEditForm(prev => ({ ...prev, ...json }));
      } catch (err) {
        alert("Failed to parse JSON file. Please ensure it matches the proposal format.");
      }
    };
    reader.readAsText(file);
  };


  // --- ANALYSIS LOGIC (FIXED) ---

  const handleAnalyze = async (targetPlan: InfraPlan) => {
    if (!targetPlan) return;
    
    setAnalyzingId(targetPlan.id);
    const analysis = await analyzeInfraPlan(targetPlan);
    setAnalyzingId(null);

    // 1. Update in Detail View if active
    if (selectedPlan && selectedPlan.id === targetPlan.id) {
        setSelectedPlan(prev => prev ? { ...prev, aiAnalysis: analysis } : null);
    }

    // 2. Update in Drafts
    setDrafts(prev => prev.map(p => p.id === targetPlan.id ? { ...p, aiAnalysis: analysis } : p));

    // 3. Update in Active Plans
    setPlans(prev => prev.map(p => p.id === targetPlan.id ? { ...p, aiAnalysis: analysis } : p));
    
    // 4. Update in Chat Messages (Critical for ephemeral chat proposals)
    setMessages(prev => prev.map(msg => 
      msg.proposal?.id === targetPlan.id 
      ? { ...msg, proposal: { ...msg.proposal, aiAnalysis: analysis } } 
      : msg
    ));
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // Fixed Logic to merge all potential plans for lookup
  const getPlansForComparison = () => {
    // Collect all plans from chat messages that have proposals
    const chatProposals = messages
      .filter(m => m.proposal)
      .map(m => m.proposal!);
      
    // Create a map to deduplicate by ID
    const allMap = new Map<string, InfraPlan>();
    
    [...plans, ...drafts, ...chatProposals].forEach(p => {
        if (!allMap.has(p.id)) allMap.set(p.id, p);
    });

    return Array.from(allMap.values()).filter(p => compareList.includes(p.id));
  };

  // Helper to render edit inputs
  const renderEditFields = () => (
    <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
       <div>
         <label className="text-[10px] text-slate-400 uppercase font-bold">Title</label>
         <input 
           className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
           value={editForm.title || ''}
           onChange={e => setEditForm({ ...editForm, title: e.target.value })}
         />
       </div>
       <div>
         <label className="text-[10px] text-slate-400 uppercase font-bold">Description</label>
         <textarea 
           className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 h-16"
           value={editForm.description || ''}
           onChange={e => setEditForm({ ...editForm, description: e.target.value })}
         />
       </div>
       <div className="grid grid-cols-2 gap-2">
         <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold">Cost</label>
            <input 
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              value={editForm.estimatedCost || ''}
              onChange={e => setEditForm({ ...editForm, estimatedCost: e.target.value })}
            />
         </div>
         <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold">Timeline</label>
            <input 
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              value={editForm.timeline || ''}
              onChange={e => setEditForm({ ...editForm, timeline: e.target.value })}
            />
         </div>
       </div>
       <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold">Type</label>
            <select 
               className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
               value={editForm.type || 'Drainage'}
               onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}
            >
              <option value="Drainage">Drainage</option>
              <option value="Storage">Storage</option>
              <option value="Policy">Policy</option>
            </select>
          </div>
          <div>
             <label className="text-[10px] text-slate-400 uppercase font-bold">Impact (1-10)</label>
             <input 
               type="number" max="10" min="1"
               className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
               value={editForm.impactScore || 5}
               onChange={e => setEditForm({ ...editForm, impactScore: parseInt(e.target.value) })}
             />
          </div>
       </div>
       {/* Detailed Tech Specs for Manual/Edit */}
       <div className="pt-2 border-t border-slate-700/50 mt-2">
         <div className="grid grid-cols-2 gap-2">
            <div>
               <label className="text-[10px] text-slate-400 uppercase font-bold">Capacity</label>
               <input 
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                  value={editForm.totalCapacity || ''}
                  onChange={e => setEditForm({ ...editForm, totalCapacity: e.target.value })}
                  placeholder="e.g. 5000 cusecs"
               />
            </div>
             <div>
               <label className="text-[10px] text-slate-400 uppercase font-bold">Length/Area</label>
               <input 
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                  value={editForm.length || ''}
                  onChange={e => setEditForm({ ...editForm, length: e.target.value })}
                  placeholder="e.g. 4.5 km"
               />
            </div>
         </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 pb-10 relative">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-6">
           <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <HardHat className="w-6 h-6 text-purple-400" />
               Infra Strategist
             </h2>
             <p className="text-slate-400 text-xs mt-1">
               {cityProfile ? `Planning for ${cityProfile.name}` : 'AI-driven capital project planning'}
             </p>
           </div>
           
           {/* View Toggle */}
           <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setActiveView('strategy')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'strategy' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <MessageSquare className="w-3 h-3" /> Strategy Lab
              </button>
              <button 
                onClick={() => setActiveView('portfolio')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'portfolio' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Layout className="w-3 h-3" /> Portfolio
              </button>
           </div>
        </div>

        <div className="flex gap-6 divide-x divide-slate-700">
           <div className="px-4 text-right">
             <div className="text-xl font-bold text-white">₹{metrics.allocated} Cr</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-wider">Allocated Budget</div>
           </div>
           <div className="px-4 text-right">
             <div className="text-xl font-bold text-blue-400">₹{metrics.spent} Cr</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Spent ({metrics.percentSpent}%)</div>
           </div>
           <div className="px-4 text-right">
             <div className="text-xl font-bold text-emerald-400">{metrics.avgProgress}%</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Progression</div>
           </div>
        </div>
      </div>

      {/* --- VIEW: STRATEGY LAB (CHAT & DRAFTS) --- */}
      {activeView === 'strategy' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left: Chat Interface */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur text-sm font-bold text-slate-300 flex justify-between items-center">
              <span>Interactive Planning Assistant</span>
              <button 
                onClick={() => { setEditForm({}); setShowCreateModal(true); }}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Create / Upload Proposal
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map(msg => (
                 <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   {/* Only show message bubble if text exists (auto-generated proposals might have empty text) */}
                   {msg.text && (
                     <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>}
                       {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-slate-300" /></div>}
                       
                       <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                         {msg.attachment && (
                            <div className="mb-2 bg-black/20 p-2 rounded flex items-center gap-2">
                                {msg.attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> : 
                                 msg.attachment.type === 'video' ? <Video className="w-4 h-4" /> : 
                                 <FileText className="w-4 h-4" />}
                                <span className="text-xs underline">{msg.attachment.name}</span>
                            </div>
                         )}
                         {msg.text}
                       </div>
                     </div>
                   )}

                   {/* --- INLINE PROPOSAL CARD --- */}
                   {msg.proposal && (
                     <div className="mt-2 ml-11 max-w-[95%] bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl animate-fade-in-up">
                        
                        {/* EDIT MODE */}
                        {editingId === msg.proposal.id ? (
                           <div className="space-y-4">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-white">Edit Proposal</span>
                                <button onClick={handleCancelEdit}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
                             </div>
                             {renderEditFields()}
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => handleSaveEdit(msg.proposal!.id, 'chat')}
                                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                               >
                                 <Save className="w-3 h-3" /> Save Changes
                               </button>
                             </div>
                           </div>
                        ) : (
                           // DISPLAY MODE
                           <>
                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                    <div className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                                        Suggested Proposal
                                    </div>
                                    {/* STRATEGIC TERM BADGE */}
                                    {msg.proposal.strategicTerm && (
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            msg.proposal.strategicTerm === 'Short-Term' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                            msg.proposal.strategicTerm === 'Medium-Term' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                            'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                        }`}>
                                            {msg.proposal.strategicTerm}
                                        </div>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-3">
                                   <span className="text-white font-bold text-lg">{msg.proposal.estimatedCost}</span>
                                   <button 
                                     onClick={() => handleStartEdit(msg.proposal!)}
                                     className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                     title="Edit Content"
                                   >
                                     <Edit3 className="w-4 h-4" />
                                   </button>
                                   <button 
                                     onClick={() => handleDownload(msg.proposal!)}
                                     className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                     title="Download Report"
                                   >
                                     <Download className="w-4 h-4" />
                                   </button>
                                 </div>
                              </div>
                              <h4 className="font-bold text-white mb-1">{msg.proposal.title}</h4>
                              <p className="text-xs text-slate-400 mb-3">{msg.proposal.description}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-300 mb-4 bg-slate-900/50 p-2 rounded">
                                 <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {msg.proposal.timeline}</span>
                                 <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Impact: {msg.proposal.impactScore}/10</span>
                                 <span className="flex items-center gap-1 uppercase"><HardHat className="w-3 h-3 text-slate-500" /> {msg.proposal.type}</span>
                              </div>
                              
                              {/* Inline AI Analysis Text */}
                              {msg.proposal.aiAnalysis && (
                                <div className="mb-4 bg-indigo-900/20 border border-indigo-500/20 p-3 rounded-lg">
                                   <h5 className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                     <Sparkles className="w-3 h-3" /> AI Analysis
                                   </h5>
                                   <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                     {msg.proposal.aiAnalysis}
                                   </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                 <button 
                                    onClick={() => setSelectedPlan(msg.proposal!)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Details
                                 </button>
                                 
                                 <button 
                                    onClick={() => handleAnalyze(msg.proposal!)}
                                    className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-2 ${
                                        analyzingId === msg.proposal.id 
                                        ? 'bg-indigo-700 text-slate-300 cursor-wait' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    }`}
                                    disabled={analyzingId === msg.proposal.id}
                                  >
                                    {analyzingId === msg.proposal.id ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" /> 
                                            {msg.proposal.aiAnalysis ? 'Re-Analyze' : 'Generate Analysis'}
                                        </>
                                    )}
                                  </button>

                                 <div className="flex-1"></div>

                                 {!msg.isSaved ? (
                                  <>
                                    <button 
                                      onClick={() => handleSaveDraft(msg.id, msg.proposal!)}
                                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold flex items-center justify-center gap-2 border border-slate-600 mr-2"
                                    >
                                      <Save className="w-3.5 h-3.5" /> Save
                                    </button>
                                    <button 
                                      onClick={() => handleApproveFromChat(msg.id, msg.proposal!)}
                                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" /> Launch
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-center py-1 text-xs font-bold text-slate-500 flex items-center justify-center gap-2 bg-slate-900/50 rounded px-3">
                                    <CheckCircle className="w-3.5 h-3.5" /> Processed
                                  </div>
                                )}
                              </div>
                           </>
                        )}
                     </div>
                   )}
                 </div>
               ))}
               {isTyping && (
                 <div className="flex gap-2 text-slate-500 text-xs ml-12 animate-pulse">
                   <span>AI is drafting comprehensive roadmap...</span>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>

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
                       <FileText className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-xs text-white max-w-[200px] truncate">{selectedFile.file.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                 </div>
               )}
               
               <div className="flex gap-2">
                   <input 
                      type="file" 
                      ref={chatFileUploadRef}
                      onChange={handleChatFileSelect}
                      accept="image/*,video/*,audio/*,.pdf,.txt"
                      className="hidden"
                    />
                   <button 
                      onClick={() => chatFileUploadRef.current?.click()}
                      className={`p-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${selectedFile ? 'bg-slate-800 text-blue-400 border-blue-500/50' : ''}`}
                      title="Upload Evidence/Data"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                   <input 
                     value={inputValue}
                     onChange={e => setInputValue(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                     placeholder="Discuss problems or ask to draft a proposal..."
                     className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                   />
                   <button 
                     onClick={handleSendMessage}
                     disabled={(!inputValue.trim() && !selectedFile) || isTyping}
                     className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 rounded-lg"
                   >
                     <Send className="w-5 h-5" />
                   </button>
               </div>
            </div>
          </div>

          {/* Right: Draft Board (Saved Drafts) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Save className="w-4 h-4 text-yellow-400" /> Saved Drafts
                </h3>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{drafts.length} Items</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {drafts.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10 px-4">
                    <p className="text-sm">No saved drafts.</p>
                    <p className="text-xs mt-2">Chat with the AI and click "Save" on proposals to collect them here.</p>
                  </div>
                ) : (
                  drafts.map(draft => (
                    <div key={draft.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative group hover:border-purple-500/50 transition-colors">
                       <div className="absolute top-2 right-2 flex gap-1">
                          <button onClick={() => toggleCompare(draft.id)} className={`p-1.5 rounded hover:bg-slate-700 ${compareList.includes(draft.id) ? 'bg-blue-500 text-white' : 'text-slate-400'}`} title="Compare">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleStartEdit(draft)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                       </div>
                       
                       <div className="mb-2 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{draft.type}</span>
                          {/* DRAFT TERM BADGE */}
                          {draft.strategicTerm && (
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    draft.strategicTerm === 'Short-Term' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    draft.strategicTerm === 'Medium-Term' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                    {draft.strategicTerm.split('-')[0]}
                                </div>
                            )}
                       </div>
                       <h4 className="font-bold text-white text-sm mb-1 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSelectedPlan(draft)}>{draft.title}</h4>
                       <p className="text-xs text-slate-400 mb-3 line-clamp-2">{draft.description}</p>
                       
                       <div className="flex gap-3 text-xs text-slate-300 mb-3">
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-slate-500" /> {draft.estimatedCost}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {draft.timeline}</span>
                       </div>

                       <div className="flex gap-2 mb-2">
                          <button 
                            onClick={() => setSelectedPlan(draft)}
                            className="flex-1 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center gap-1"
                          >
                             <FileText className="w-3 h-3" /> View Details
                          </button>
                          <button 
                            onClick={() => handleAnalyze(draft)} 
                            className="flex-1 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center gap-1"
                            disabled={!!draft.aiAnalysis}
                          >
                             <Sparkles className="w-3 h-3 text-purple-400" /> {draft.aiAnalysis ? 'Analyzed' : 'AI Analyze'}
                          </button>
                       </div>
                       <button 
                          onClick={() => handleApproveDraft(draft)}
                          className="w-full py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded font-bold flex items-center justify-center gap-2"
                        >
                           <PlayCircle className="w-3 h-3" /> Approve Proposal
                        </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- FLOATING COMPARE BUTTON (FIXED POS) --- */}
      {compareList.length > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
           <button 
             onClick={() => setShowCompareModal(true)}
             className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 animate-bounce-in ring-2 ring-white/20"
           >
             <ArrowRightLeft className="w-5 h-5" /> Compare ({compareList.length}) Items
           </button>
        </div>
      )}

      {/* --- VIEW: PORTFOLIO DASHBOARD --- */}
      {activeView === 'portfolio' && (
        <div className="flex-1 overflow-y-auto">
          {plans.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
               <HardHat className="w-16 h-16 mb-4 opacity-20" />
               <p>No active infrastructure plans.</p>
               <button onClick={() => setActiveView('strategy')} className="mt-4 text-blue-400 hover:underline">Go to Strategy Lab to create one.</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {plans.map(plan => (
                 <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <button 
                          onClick={() => toggleCompare(plan.id)} 
                          className={`p-2 rounded-lg border ${compareList.includes(plan.id) ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                          title="Add to Compare"
                        >
                         <ArrowRightLeft className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="flex justify-between items-start mb-3">
                       <div className="flex gap-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              plan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 
                              plan.status === 'Approved' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'
                           }`}>
                             {plan.status}
                           </span>
                           {plan.strategicTerm && (
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    plan.strategicTerm === 'Short-Term' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    plan.strategicTerm === 'Medium-Term' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                    {plan.strategicTerm.split('-')[0]}
                                </span>
                            )}
                       </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 pr-8 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSelectedPlan(plan)}>{plan.title}</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">{plan.description}</p>

                    {/* Progress Section */}
                    {(plan.status === 'Active' || plan.status === 'Approved') && (
                      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 mb-4">
                         <div className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>Progress</span>
                            <span className="font-bold">{plan.progress || 0}%</span>
                         </div>
                         <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${plan.progress || 0}%` }}></div>
                         </div>
                         
                         <div className="flex justify-between items-center text-xs">
                            <div className="flex gap-3">
                               <div className="text-slate-500">
                                  Spent: <span className="text-slate-200">{plan.spentBudget || '₹0'}</span>
                               </div>
                               <div className="text-slate-500">
                                  Total: <span className="text-slate-200">{plan.estimatedCost}</span>
                               </div>
                            </div>
                            {plan.forecastStatus && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                plan.forecastStatus === 'On Track' ? 'bg-emerald-500/20 text-emerald-400' : 
                                plan.forecastStatus === 'Delayed' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {plan.forecastStatus}
                              </span>
                            )}
                         </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto">
                       <button 
                         onClick={() => setSelectedPlan(plan)}
                         className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center justify-center gap-2"
                       >
                          <FileText className="w-3 h-3" /> View Details
                       </button>
                       <button 
                         onClick={() => handleAnalyze(plan)}
                         disabled={!!plan.aiAnalysis}
                         className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center justify-center gap-2"
                       >
                          <Sparkles className="w-3 h-3 text-purple-400" /> {plan.aiAnalysis ? 'Analyzed' : 'Analyze'}
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* --- COMPARISON MODAL --- */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <ArrowRightLeft className="w-5 h-5 text-blue-400" /> Strategic Comparison
                 </h3>
                 <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                 <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${compareList.length}, minmax(350px, 1fr))` }}>
                    {getPlansForComparison().map(plan => (
                      <div key={plan.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col h-full relative">
                         <button onClick={() => toggleCompare(plan.id)} className="absolute top-4 right-4 text-slate-500 hover:text-white" title="Remove">
                            <X className="w-4 h-4" />
                         </button>
                         <h4 className="font-bold text-white text-lg mb-2 h-14 line-clamp-2 pr-6">{plan.title}</h4>
                         <div className="flex gap-2 mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${plan.status === 'Draft' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {plan.status}
                            </span>
                            {plan.strategicTerm && (
                                <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-700 text-slate-300">
                                    {plan.strategicTerm}
                                </span>
                            )}
                         </div>

                         <div className="space-y-4 text-sm flex-1">
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Total Allocated</span>
                               <span className="text-white font-mono">{plan.estimatedCost}</span>
                            </div>
                            
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Timeline</span>
                               <span className="text-white">{plan.timeline}</span>
                            </div>

                             {/* --- NEW TECHNICAL FIELDS --- */}
                             <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Water Path</span>
                               <span className="text-white text-right max-w-[50%] truncate">{plan.waterPath || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Capacity</span>
                               <span className="text-white text-right max-w-[50%] truncate">{plan.totalCapacity || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Length/Area</span>
                               <span className="text-white text-right max-w-[50%] truncate">{plan.length || "N/A"}</span>
                            </div>

                            <div className="border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400 block mb-1">Key Benefits</span>
                               <ul className="list-disc list-inside text-xs text-emerald-300">
                                  {plan.benefits?.slice(0,3).map((b,i) => <li key={i}>{b}</li>) || <li className="text-slate-500">Not detailed</li>}
                               </ul>
                            </div>

                            <div className="border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400 block mb-1">Risks & Challenges</span>
                               <ul className="list-disc list-inside text-xs text-orange-300">
                                  {plan.risks?.slice(0,2).map((r,i) => <li key={i}>{r}</li>) || <li className="text-slate-500">Not detailed</li>}
                               </ul>
                            </div>

                            <div className="border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400 block mb-1">Soil/Urban Conditions</span>
                               <p className="text-xs text-slate-300">{plan.soilUrbanCondition || "Standard urban fill"}</p>
                            </div>

                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                               <span className="text-slate-400">Impact Score</span>
                               <span className="text-emerald-400 font-bold">{plan.impactScore}/10</span>
                            </div>
                            
                            {/* ROI / AI Analysis */}
                            <div className="pt-2">
                               <span className="text-slate-400 block mb-1 text-xs uppercase">AI Strategic Fit</span>
                               <div className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded border border-slate-700 min-h-[100px] overflow-y-auto max-h-[150px] whitespace-pre-line">
                                 {plan.aiAnalysis || "Analysis not generated yet."}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- DETAILED PLAN MODAL (UPDATED WITH EDIT) --- */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            selectedPlan.status === 'Draft' ? 'bg-purple-500/20 text-purple-400' : 
                            selectedPlan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                            {selectedPlan.status}
                        </span>
                        {/* TERM BADGE DETAIL */}
                        {selectedPlan.strategicTerm && (
                            <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                                {selectedPlan.strategicTerm}
                            </span>
                        )}
                        <span className="text-slate-500 text-sm flex items-center gap-1"><HardHat className="w-3 h-3" /> {selectedPlan.type}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {selectedPlan.title}
                        {editingId !== selectedPlan.id && (
                          <button onClick={() => handleStartEdit(selectedPlan)} className="text-slate-500 hover:text-white p-1">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(selectedPlan)} className="text-slate-500 hover:text-white p-1 ml-2">
                            <Download className="w-4 h-4" />
                        </button>
                      </h2>
                      <p className="text-slate-400 mt-1">{selectedPlan.description}</p>
                   </div>
                   <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors">
                     <X className="w-5 h-5" />
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8">
                   {editingId === selectedPlan.id ? (
                      <div className="max-w-xl mx-auto">
                         <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-white">Edit Mode</h3>
                           <button onClick={handleCancelEdit} className="text-xs text-red-400 hover:text-red-300">Cancel</button>
                         </div>
                         {renderEditFields()}
                         <button 
                           onClick={() => handleSaveEdit(selectedPlan.id, 'detail')}
                           className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold"
                         >
                           Save Changes
                         </button>
                      </div>
                   ) : (
                     <>
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Estimated Cost</div>
                                <div className="text-xl font-bold text-white">{selectedPlan.estimatedCost}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Timeline</div>
                                <div className="text-xl font-bold text-white">{selectedPlan.timeline}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Impact Score</div>
                                <div className="text-xl font-bold text-emerald-400">{selectedPlan.impactScore}/10</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Risk Level</div>
                                <div className="text-xl font-bold text-orange-400">Medium</div>
                            </div>
                        </div>

                        {/* Immediate Actions */}
                        {selectedPlan.immediateActions && selectedPlan.immediateActions.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> Immediate Actions Required
                                </h4>
                                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                                    <ul className="space-y-2">
                                        {selectedPlan.immediateActions.map((action, idx) => (
                                            <li key={idx} className="flex gap-2 text-sm text-red-200">
                                                <CheckCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Deep Dive Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-blue-400" /> Technical Specs
                                    </h4>
                                    <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Water Path</span>
                                            <span className="text-white font-medium">{selectedPlan.waterPath || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Total Capacity</span>
                                            <span className="text-white font-medium">{selectedPlan.totalCapacity || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Length / Coverage</span>
                                            <span className="text-white font-medium">{selectedPlan.length || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Soil Condition</span>
                                            <span className="text-white font-medium">{selectedPlan.soilUrbanCondition || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-orange-400" /> Risks & Challenges
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedPlan.risks?.map((r, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-300 bg-orange-900/10 p-2 rounded border border-orange-500/20">
                                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> {r}
                                            </li>
                                        )) || <p className="text-slate-500 italic text-sm">No risks listed.</p>}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Key Benefits
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedPlan.benefits?.map((b, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-300 bg-emerald-900/10 p-2 rounded border border-emerald-500/20">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {b}
                                            </li>
                                        )) || <p className="text-slate-500 italic text-sm">No benefits listed.</p>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Strategic Analysis
                                    </h4>
                                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
                                        {selectedPlan.aiAnalysis || (
                                            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                                <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                                                <p>Analysis not yet generated.</p>
                                                <button 
                                                  onClick={() => { handleAnalyze(selectedPlan); }}
                                                  disabled={analyzingId === selectedPlan.id}
                                                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                                                >
                                                  {analyzingId === selectedPlan.id ? 'Generating...' : 'Generate Analysis Now'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                     </>
                   )}
               </div>
               
               <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                   <button onClick={() => toggleCompare(selectedPlan.id)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${compareList.includes(selectedPlan.id) ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'}`}>
                      {compareList.includes(selectedPlan.id) ? 'Remove Comparison' : 'Add to Compare'}
                   </button>
                   {selectedPlan.status === 'Draft' && (
                       <button onClick={() => { handleApproveDraft(selectedPlan); setSelectedPlan(null); }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/50">
                          Approve & Launch Project
                       </button>
                   )}
               </div>
           </div>
        </div>
      )}

      {/* --- CREATE PROPOSAL MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                 <h3 className="font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-purple-400" /> Create New Proposal
                 </h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 {/* Upload Option */}
                 <div className="mb-6 p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 text-center hover:bg-slate-800/50 transition-colors">
                    <input 
                      type="file" 
                      ref={fileUploadRef}
                      className="hidden"
                      accept=".json"
                      onChange={handleFileUpload}
                    />
                    <div className="bg-slate-800 p-3 rounded-full w-fit mx-auto mb-3">
                       <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <button 
                      onClick={() => fileUploadRef.current?.click()}
                      className="text-sm font-bold text-blue-400 hover:underline"
                    >
                      Upload JSON Definition
                    </button>
                    <p className="text-xs text-slate-500 mt-2">or fill the details manually below</p>
                 </div>
                 
                 <div className="bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    {renderEditFields()}
                 </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 rounded-b-xl">
                 <button 
                   onClick={() => setShowCreateModal(false)}
                   className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => handleCreateManualProposal(true)}
                   className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold"
                 >
                   Save Draft
                 </button>
                 <button 
                   onClick={() => handleCreateManualProposal(false)}
                   className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-bold shadow-lg shadow-purple-900/50"
                 >
                   Activate Proposal
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InfraStrategist;

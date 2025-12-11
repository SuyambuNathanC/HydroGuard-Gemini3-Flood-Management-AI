
import React, { useRef, useState } from 'react';
import { CityDocument } from '../types';
import { analyzeDocumentContent, constructRagContext } from '../services/geminiService';
import { 
  Database, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Search,
  Eye,
  FileBarChart,
  Terminal,
  X
} from 'lucide-react';

interface KnowledgeBaseProps {
  documents: CityDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<CityDocument[]>>;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ documents, setDocuments }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRagPreview, setShowRagPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      
      const newDocId = `doc-${Date.now()}`;
      
      // 1. Create Initial Entry
      const newDoc: CityDocument = {
        id: newDocId,
        name: file.name,
        type: file.name.toLowerCase().includes('report') ? 'Report' : 'Policy',
        uploadDate: new Date().toLocaleDateString(),
        status: 'Analyzing',
        rawContent: text
      };
      
      setDocuments(prev => [newDoc, ...prev]);

      // 2. Perform RAG Analysis (Extract Summary & Key Facts)
      const analysis = await analyzeDocumentContent(file.name, text);
      
      // 3. Update Doc with Analysis
      setDocuments(prev => prev.map(d => 
        d.id === newDocId ? { ...d, status: 'Ready', summary: analysis.summary, keyFacts: analysis.keyFacts } : d
      ));
      
      setUploading(false);
    };
    
    // For demo simplicity, we assume text-based files. 
    // In a real app, we'd use pdf.js for PDFs.
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Generate the actual context string using the service helper
  const ragContextString = constructRagContext(documents);

  return (
    <div className="h-full flex flex-col gap-6 pb-10 relative">
      
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex justify-between items-center backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-400" />
            City Knowledge Base
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload policies, sensor logs, and reports. Agents will use this data for analysis.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowRagPreview(true)}
             className="flex items-center gap-2 bg-slate-900 border border-slate-600 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
           >
             <Terminal className="w-4 h-4" /> Inspect RAG Context
           </button>
           <div className="text-right">
             <div className="text-2xl font-bold text-white">{documents.length}</div>
             <div className="text-xs text-slate-500 uppercase tracking-wider">Indexed Documents</div>
           </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/30 hover:border-emerald-500/50 hover:bg-slate-900/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.json,.csv,.md" // Restricting for demo simplicity
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center animate-pulse">
             <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
             <p className="text-emerald-400 font-bold">Analyzing Document...</p>
             <p className="text-slate-500 text-xs mt-1">Extracting entities & summarizing content</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-slate-800 rounded-full mb-4">
              <UploadCloud className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Upload City Documents</h3>
            <p className="text-slate-400 text-sm mt-2 text-center max-w-md">
              Drag & drop files here or click to browse. <br/>
              <span className="text-xs text-slate-500">(Supports .txt, .csv, .json, .md for automatic RAG analysis)</span>
            </p>
          </>
        )}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col hover:border-slate-600 transition-all group">
             <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                 <div className="bg-slate-800 p-2.5 rounded-lg">
                   <FileText className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm truncate max-w-[150px]" title={doc.name}>{doc.name}</h4>
                   <span className="text-[10px] text-slate-500 uppercase tracking-wide">{doc.type} • {doc.uploadDate}</span>
                 </div>
               </div>
               <button onClick={() => handleDelete(doc.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>

             {/* Status / Analysis */}
             <div className="flex-1">
               {doc.status === 'Analyzing' ? (
                 <div className="flex items-center gap-2 text-xs text-yellow-500 mt-2">
                   <Loader2 className="w-3 h-3 animate-spin" /> Processing content...
                 </div>
               ) : (
                 <div className="space-y-3">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                       <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                         <span className="text-emerald-500 font-bold uppercase text-[10px] mr-1">Summary:</span>
                         {doc.summary || "No summary available."}
                       </p>
                    </div>
                    {doc.keyFacts && doc.keyFacts.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.keyFacts.slice(0, 3).map((fact, i) => (
                          <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                            {fact}
                          </span>
                        ))}
                        {doc.keyFacts.length > 3 && <span className="text-[9px] text-slate-500 py-1">+ {doc.keyFacts.length - 3} more</span>}
                      </div>
                    )}
                 </div>
               )}
             </div>

             <div className="border-t border-slate-800 mt-4 pt-3 flex justify-between items-center">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${doc.status === 'Ready' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                  {doc.status === 'Ready' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {doc.status === 'Ready' ? 'Indexed & Active' : 'Processing'}
                </span>
                <button className="text-xs text-blue-400 hover:text-white flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View Raw
                </button>
             </div>
          </div>
        ))}
        
        {/* Placeholder if empty */}
        {documents.length === 0 && !uploading && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
              <FileBarChart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Knowledge Base is empty.</p>
              <p className="text-xs">Upload documents to empower the AI Agents.</p>
           </div>
        )}
      </div>

      {/* --- RAG PREVIEW MODAL --- */}
      {showRagPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-white flex items-center gap-2">
                   <Terminal className="w-5 h-5 text-emerald-400" />
                   Live Context Inspector (System Instruction)
                 </h3>
                 <button onClick={() => setShowRagPreview(false)} className="text-slate-400 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-4 bg-slate-950/50 flex items-center gap-2 border-b border-slate-800">
                 <div className="text-xs text-slate-400">
                    This is the exact data structure currently injected into the Gemini Agent's memory window.
                    It aggregates summaries and facts from all "Ready" documents.
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-0 bg-[#1e1e1e]">
                 <pre className="p-6 text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                   {ragContextString || "// No documents indexed. RAG context is empty."}
                 </pre>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
                 <button 
                   onClick={() => setShowRagPreview(false)}
                   className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold"
                 >
                   Close Inspector
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;

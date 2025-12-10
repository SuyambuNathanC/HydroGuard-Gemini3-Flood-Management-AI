
export interface Reservoir {
  id: string;
  name: string;
  capacityMcft: number; // Full capacity in Million Cubic Feet
  currentLevelMcft: number;
  inflowCusecs: number;
  outflowCusecs: number;
  lastUpdated: string;
}

export interface River {
  id: string;
  name: string;
  designCapacityCusecs: number;
  currentFlowCusecs: number;
  status: 'Normal' | 'Warning' | 'Critical';
  bottlenecks: string[];
}

export type LocationLevel = 'District' | 'City' | 'State' | 'Country';

export interface CityProfile {
  id: string;
  name: string;
  level: LocationLevel; // Hierarchy level
  rainfallThresholdPerHour: number; // In mm/hr (Design capacity)
  operationalLimitPerHour: number; // In mm/hr (Real-world flooding start)
  populationDensity: string;
  imperviousSurfacePercentage: number;
  externalMapUrl?: string; // URL for external flood map views (e.g., OSM)
  // Dynamic Map Data
  mapConfig: {
    districts: [string, string, string]; // Top, Bottom-Left, Bottom-Right
    landmarks: [string, string]; // Airport code, Central Station name
    riverNames: [string, string]; // Top river, Bottom river
    reservoirNames: string[]; // To remap the mock reservoirs
  };
}

export interface SimulationState {
  rainfallIntensityMmHr: number;
  durationHours: number;
  tideLevelMeters: number;
  soilSaturationPercent: number;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  location: string;
}

export interface InfraPlan {
  id: string;
  title: string;
  description: string;
  estimatedCost: string; // e.g. "₹120 Cr"
  timeline: string;
  impactScore: number; // 1-10
  status: 'Draft' | 'Proposed' | 'Under Review' | 'Approved' | 'Active' | 'Completed';
  type: 'Drainage' | 'Storage' | 'Policy';
  aiAnalysis?: string;
  // New Tracking Fields
  progress?: number; // 0-100
  spentBudget?: string; // e.g. "₹40 Cr"
  forecastStatus?: 'On Track' | 'Delayed' | 'Critical';
  startDate?: string;
  // New Detailed Technical Fields
  waterPath?: string;
  totalCapacity?: string;
  benefits?: string[];
  risks?: string[];
  challenges?: string[];
  length?: string;
  soilUrbanCondition?: string;
  estimationBreakdown?: string;
  strategicTerm?: 'Short-Term' | 'Medium-Term' | 'Long-Term'; // New Field
  immediateActions?: string[]; // New Field for specific next steps
}

export interface RecoveryTask {
  id: string;
  location: string;
  description: string; // The instruction
  status: 'Pending' | 'Dispatched' | 'In Progress' | 'Resolved';
  priority: 'Critical' | 'High' | 'Medium';
  assignedTeam?: string;
  timestamp: string;
  aiSuggested?: boolean;
}

export interface ResponseTeam {
  id: string;
  name: string;
  type: 'NDRF' | 'Fire & Rescue' | 'Public Works' | 'Medical';
  status: 'Available' | 'Deployed' | 'Resting';
  currentLocation?: string;
}

export enum AgentRole {
  MONITOR = 'Situation Monitor',
  ORCHESTRATOR = 'Alert Orchestrator',
  PLANNER = 'Action Planner',
  STRATEGIST = 'Infrastructure Strategist'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  agentRole?: AgentRole;
  feedback?: 'up' | 'down';
  attachment?: {
    name: string;
    type: 'image' | 'file' | 'video' | 'audio';
    url?: string; // For preview
  };
  // New: For inline proposals from Strategist
  proposal?: InfraPlan;
  isSaved?: boolean;
}

// --- KNOWLEDGE BASE TYPES ---
export interface CityDocument {
  id: string;
  name: string;
  type: 'Policy' | 'Report' | 'SensorLog' | 'MapData';
  uploadDate: string;
  status: 'Analyzing' | 'Ready' | 'Error';
  summary?: string;
  keyFacts?: string[]; // Extracted RAG data
  rawContent?: string; // Stored text for context injection
}

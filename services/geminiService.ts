
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { AgentRole, SimulationState, Reservoir, River, InfraPlan, ChatMessage, CityProfile, CityDocument } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PUBLIC HELPER: Construct RAG Context ---
// This function mimics the Vector DB retrieval by formatting the active documents into a prompt context.
export const constructRagContext = (knowledgeBase?: CityDocument[]): string => {
  if (!knowledgeBase || knowledgeBase.length === 0) return "";

  const readyDocs = knowledgeBase.filter(d => d.status === 'Ready');
  if (readyDocs.length === 0) return "";

  return `
  \n**KNOWLEDGE BASE (RAG CONTEXT):**
  The following official city documents have been uploaded and indexed.
  USE this information to answer user queries accurately. Cite the document name when relevant.
  
  ${readyDocs.map(doc => `
  --- SOURCE DOCUMENT: "${doc.name}" (${doc.type}) ---
  SUMMARY: ${doc.summary}
  KEY EXTRACTED FACTS: ${doc.keyFacts?.join('; ')}
  RAW EXCERPT: ${doc.rawContent ? doc.rawContent.substring(0, 500).replace(/\n/g, ' ') + "..." : "N/A"}
  ---------------------------------------------
  `).join('\n')}
  `;
};

const getSystemInstruction = (role: AgentRole, city?: CityProfile, knowledgeBase?: CityDocument[]): string => {
  const locationContext = city ? `ACTIVE REGION: ${city.name} (${city.level}). Pop Density: ${city.populationDensity}.` : "";
  
  // Use the shared RAG construction logic
  const ragContext = constructRagContext(knowledgeBase);

  const baseInstruction = `You are an advanced AI assistant for the 'Smart Flood & Water Security System'. ${locationContext} ${ragContext} Your output should be professional, concise, and actionable for city officials and engineers.
  
  **UNSTRUCTURED DATA ANALYSIS:**
  If the user provides a VIDEO, AUDIO, or PDF:
  1. Analyze the content deeply (e.g., water flow speed in video, distress level in audio).
  2. If the file shows a completed task (e.g., a clear drain, a built wall), acknowledge it as a "Status Update".
  3. If it shows a hazard, flag it immediately.
  `;

  const severityInstruction = `
  OUTPUT RULES:
  1. **DEFAULT MODE (TEXT)**: For most queries (analysis, questions, conversational responses), use standard text/markdown. Do NOT use JSON unless specifically required below.
  2. **CRITICAL ALERTS (JSON)**: If identifying a NEW Critical/High risk event that requires immediate alerting, return a JSON object with 'type': 'critical_alert'.
  3. **COMPARISONS (JSON)**: If user asks to COMPARE, return a JSON object with 'type': 'comparison_card'.
  
  JSON Schema for Critical/High Priority Alerts:
  {
    "type": "critical_alert",
    "severity": "Critical" | "High",
    "title": "Short Warning Title",
    "message": "Detailed operational message...",
    "action_items": ["Action 1", "Action 2"]
  }

  JSON Schema for Comparison Card:
  {
    "type": "comparison_card",
    "title": "Comparison Title",
    "summary": "Short executive summary.",
    "items": [
      {
        "metric": "Metric Name",
        "current": "Current Value",
        "baseline": "Historical/Baseline Value",
        "status": "Critical" | "Warning" | "Stable",
        "trend": "up" | "down" | "flat"
      }
    ],
    "recommendation": "Strategic advice based on comparison."
  }
  `;

  switch (role) {
    case AgentRole.MONITOR:
      return `${baseInstruction} ${severityInstruction} You are the Situation Monitor (Agent 1). Analyze sensor data and uploaded documents. Monitor for BOTH Flooding AND Drought.`;
    
    case AgentRole.ORCHESTRATOR:
      return `${baseInstruction} ${severityInstruction} You are the Alert Orchestrator (Agent 2). Prioritize risks and draft alerts based on sensor data and document protocols.`;
    
    case AgentRole.PLANNER:
      return `${baseInstruction} ${severityInstruction} You are the Action Planner (Agent 3). Generate operational playbooks. Use the Knowledge Base to find standard operating procedures (SOPs).`;
    
    case AgentRole.STRATEGIST:
      return `${baseInstruction} ${severityInstruction} You are the Infrastructure Strategist (Agent 4). Plan long-term resilience. Use the Knowledge Base to reference past master plans and budget reports.`;
    default:
      return baseInstruction;
  }
};

const formatChatHistory = (history: ChatMessage[]): string => {
  return history.slice(-10).map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`).join('\n');
};

// --- NEW: Document Analysis (RAG Ingestion) ---
export const analyzeDocumentContent = async (fileName: string, content: string): Promise<{summary: string, keyFacts: string[]}> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
    Analyze the following city infrastructure document and extract structured intelligence.
    
    DOCUMENT NAME: ${fileName}
    CONTENT START:
    ${content.substring(0, 10000)} ... (truncated if too long)
    CONTENT END.
    
    TASK:
    1. Generate a concise 2-sentence EXECUTIVE SUMMARY.
    2. Extract up to 5 KEY FACTS (Dates, Budget Numbers, Locations, Risk Factors, or Protocols).
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "summary": "...",
      "keyFacts": ["Fact 1", "Fact 2", "Fact 3"]
    }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Doc Analysis Error:", error);
    return { summary: "Analysis failed.", keyFacts: [] };
  }
};

export const generateAgentResponse = async (
  role: AgentRole,
  userPrompt: string,
  contextData?: {
    simulation?: SimulationState;
    reservoirs?: Reservoir[];
    rivers?: River[];
    city?: CityProfile;
    knowledgeBase?: CityDocument[]; // Pass KB to agents
  },
  comparisonMode: boolean = false,
  attachmentData?: { base64: string; mimeType: string },
  history: ChatMessage[] = []
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash'; 

    let contextString = "";
    if (contextData) {
      contextString = `
      CURRENT SYSTEM CONTEXT (Mode: ${contextData.simulation?.rainfallIntensityMmHr ? 'SIMULATION' : 'LIVE'}):
      Location: ${contextData.city?.name || 'Unknown'}
      ${contextData.simulation ? `Simulation Config: Rainfall ${contextData.simulation.rainfallIntensityMmHr}mm/hr, Tide ${contextData.simulation.tideLevelMeters}m, Soil Saturation ${contextData.simulation.soilSaturationPercent}%.` : ''}
      ${contextData.reservoirs ? `Reservoirs: ${contextData.reservoirs.map(r => `${r.name}: ${(r.currentLevelMcft/r.capacityMcft*100).toFixed(1)}% full`).join(', ')}.` : ''}
      ${contextData.rivers ? `Rivers: ${contextData.rivers.map(r => `${r.name}: ${r.status}`).join(', ')}.` : ''}
      `;
    }

    const historyString = history.length > 0 ? `\nPREVIOUS CONVERSATION:\n${formatChatHistory(history)}\n` : "";

    let fullPrompt = `${contextString}${historyString}\n\nUser Query: ${userPrompt}`;

    if (comparisonMode) {
      fullPrompt += `
      CRITICAL INSTRUCTION: Return a JSON 'comparison_card'.
      `;
    }

    const parts: any[] = [];
    parts.push({ text: fullPrompt });

    if (attachmentData) {
      parts.push({
        inlineData: {
          mimeType: attachmentData.mimeType,
          data: attachmentData.base64
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: getSystemInstruction(role, contextData?.city, contextData?.knowledgeBase),
        temperature: 0.4, 
        responseMimeType: comparisonMode ? "application/json" : "text/plain"
      }
    });

    let finalText = response.text || "I processed the data but could not generate a textual response.";
    // Improved regex to strip code blocks but preserve content if it was text
    finalText = finalText.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();

    return finalText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Agent. Please check your network or API Key configuration.";
  }
};

export const generateStrategyChatResponse = async (
  userPrompt: string, 
  history: ChatMessage[],
  context?: { city: CityProfile; simulation: SimulationState; knowledgeBase?: CityDocument[] },
  attachmentData?: { base64: string; mimeType: string }
): Promise<{text: string, proposal?: Partial<InfraPlan>}> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    // Inject KB logic here as well
    const contextStr = context ? `
    CONTEXT:
    City: ${context.city.name}
    Current Status: Rainfall ${context.simulation.rainfallIntensityMmHr}mm/hr, Saturation ${context.simulation.soilSaturationPercent}%
    ` : "";

    const historyStr = formatChatHistory(history);

    const prompt = `
    ${contextStr}
    PREVIOUS CHAT: ${historyStr}
    CURRENT QUERY: "${userPrompt}"
    `;

    const parts: any[] = [{ text: prompt }];
    if (attachmentData) {
      parts.push({
        inlineData: {
          mimeType: attachmentData.mimeType,
          data: attachmentData.base64
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        // Pass KB here too
        systemInstruction: getSystemInstruction(AgentRole.STRATEGIST, context?.city, context?.knowledgeBase),
        temperature: 0.4
      }
    });

    const text = response.text || "Error processing request.";
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let proposal: Partial<InfraPlan> | undefined;
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        proposal = JSON.parse(jsonMatch[1]);
      } catch (e) { console.warn(e); }
    }

    const displayText = text.replace(/```json[\s\S]*?```/, "").trim();
    return { text: displayText, proposal };
  } catch (error) {
    return { text: "Error connecting to Strategy AI." };
  }
};

// ... existing proactive functions remain unchanged (they can be updated similarly if needed, but these are the main two chat points) ...
export const generateProactiveProposal = async (
  city: CityProfile,
  simulation: SimulationState
): Promise<Partial<InfraPlan>[] | null> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
    ACT AS: Infrastructure Strategist (Agent 4)
    TASK: Automatically generate a comprehensive STRATEGIC ROADMAP (3 Distinct Proposals) based on the current situation for ${city.name}.
    
    CONTEXT:
    - City: ${city.name} (${city.level})
    - Population Density: ${city.populationDensity}
    - Current Simulation: Rainfall ${simulation.rainfallIntensityMmHr}mm/hr, Saturation ${simulation.soilSaturationPercent}%
    
    REQUIREMENT:
    Generate exactly 3 proposals in an array covering:
    1. **Immediate/Short-Term**: Quick fix (e.g., Desilting, Mobile Pumps, Temporary Barriers).
    2. **Medium-Term**: Structural upgrade (e.g., Stormwater Drain expansion, River bank strengthening).
    3. **Long-Term**: Resilience/Policy (e.g., New Reservoirs, Sponge City regulations, Inter-basin transfer).
    
    OUTPUT:
    Return ONLY a valid JSON ARRAY of objects. No conversational text.
    
    JSON Schema:
    [
      {
        "title": "Title 1",
        "description": "Technical summary.",
        "estimatedCost": "₹XX Cr",
        "timeline": "XX Months",
        "type": "Drainage" | "Storage" | "Policy",
        "impactScore": 9,
        "waterPath": "Technical route description",
        "totalCapacity": "Capacity specs",
        "benefits": ["Benefit 1", "Benefit 2"],
        "risks": ["Risk 1", "Risk 2"],
        "challenges": ["Challenge 1"],
        "length": "Dimensions",
        "soilUrbanCondition": "Soil context",
        "immediateActions": ["Action 1", "Action 2"]
      },
      ... (2 more items)
    ]
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(AgentRole.STRATEGIST, city),
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    // Clean up potentially wrapped JSON markdown
    const jsonStr = text.replace(/```json\s*|\s*```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Proactive Proposal Error:", error);
    return null;
  }
};

export const generateProactiveRecoveryPlan = async (
  city: CityProfile,
  simulation: SimulationState
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
    ACT AS: Action Planner (Agent 3) - Disaster Response
    TASK: IMMEDIATE CRISIS RESPONSE PLAN for ${city.name}.
    
    SITUATION:
    - Rainfall: ${simulation.rainfallIntensityMmHr} mm/hr
    - Tide: ${simulation.tideLevelMeters} m
    - Soil Saturation: ${simulation.soilSaturationPercent}%
    
    Generate 3-4 bullet points of IMMEDIATE tactical actions for field teams (NDRF/Police/Public Works).
    Focus on life safety, pumping, and traffic diversion.
    Direct commands only. No fluff.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(AgentRole.PLANNER, city),
        temperature: 0.3
      }
    });

    return response.text || "Deploy assessment teams to low-lying areas immediately.";
  } catch (error) {
    return "Error generating plan.";
  }
};

export const analyzeInfraPlan = async (plan: InfraPlan): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
    Analyze the following infrastructure proposal for Chennai:
    
    DETAILS:
    Title: ${plan.title}
    Description: ${plan.description}
    Cost: ${plan.estimatedCost}
    Type: ${plan.type}
    Water Path: ${plan.waterPath || 'N/A'}
    Conditions: ${plan.soilUrbanCondition || 'N/A'}
    
    TASK:
    Provide a comprehensive, professional engineering analysis (approx 150 words).
    
    STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS (Do not use JSON, use Markdown):
    
    **Strategic Alignment:**
    [Explain how this fits into the wider city master plan or water security goals.]
    
    **Technical Feasibility:**
    [Analyze the path, soil conditions, and engineering complexity.]
    
    **Cost-Benefit Analysis:**
    [Justify the ROI based on flood reduction vs capital expenditure.]
    
    **Risk Assessment:**
    [Highlight key implementation risks.]
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(AgentRole.STRATEGIST),
        temperature: 0.3
      }
    });

    return response.text || "Analysis could not be generated.";
  } catch (error) {
    return "Error generating analysis.";
  }
};

export const generateRecoveryActions = async (
  location: string, 
  simulation: SimulationState,
  adminInstruction?: string
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
    Generate a precise disaster recovery/response action plan for: ${location || "Entire City Region"}.
    
    Current Conditions:
    - Rainfall Intensity: ${simulation.rainfallIntensityMmHr} mm/hr
    - Duration: ${simulation.durationHours} hours
    - Tide Level: ${simulation.tideLevelMeters} m
    - Soil Saturation: ${simulation.soilSaturationPercent}%

    Admin Specific Instructions: ${adminInstruction || "None provided. Use standard protocols."}
    
    Task:
    Create a set of operational orders for field teams.
    - If Rainfall is High: Focus on rescue, pumps, and evacuation.
    - If Rainfall is 0 and conditions suggest Drought: Focus on water distribution, checking pipe leaks, and community water supply management.
    
    Output Format:
    Strictly 3-4 bullet points. Direct imperative commands. Do not use markdown formatting like **bold**.
    Example: 
    - Deploy 3 inflatable boats to North Main road junction.
    - Distribute 500 food packets to community center.
    - Set up dewatering pumps (50HP) at subway entrance.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(AgentRole.PLANNER),
        temperature: 0.4
      }
    });

    return response.text || "Could not generate action plan.";
  } catch (error) {
    return "Error generating plan. Please create manually.";
  }
};

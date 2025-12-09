
import { CityProfile, Reservoir, River, Alert, InfraPlan, RecoveryTask, ResponseTeam } from './types';

export const CITIES: CityProfile[] = [
  // --- COUNTRY LEVEL ---
  {
    id: 'india',
    name: "India (National View)",
    level: 'Country',
    rainfallThresholdPerHour: 100,
    operationalLimitPerHour: 60,
    populationDensity: "431 / sq km",
    imperviousSurfacePercentage: 45,
    externalMapUrl: "https://www.openstreetmap.org/#map=5/22.97/79.65",
    mapConfig: {
      districts: ["NORTH INDIA", "DECCAN PLATEAU", "COASTAL PLAINS"],
      landmarks: ["New Delhi", "Mumbai"],
      riverNames: ["Ganga", "Godavari"],
      reservoirNames: ["Indira Sagar", "Nagarjuna Sagar", "Hirakud", "Tehri", "Bhakra"]
    }
  },
  // --- STATE LEVEL ---
  {
    id: 'tn',
    name: "Tamil Nadu, India",
    level: 'State',
    rainfallThresholdPerHour: 85,
    operationalLimitPerHour: 50,
    populationDensity: "555 / sq km",
    imperviousSurfacePercentage: 55,
    externalMapUrl: "https://www.openstreetmap.org/#map=7/11.127/78.656",
    mapConfig: {
      districts: ["KANCHIPURAM", "COIMBATORE", "MADURAI"],
      landmarks: ["Chennai Port", "Nilgiris"],
      riverNames: ["Kaveri River", "Palar River"],
      reservoirNames: ["Mettur Dam", "Bhavanisagar", "Vaigai", "Aliyar", "Papanasam"]
    }
  },
  // --- CITY LEVEL ---
  {
    id: 'chennai',
    name: "Chennai, India",
    level: 'City',
    rainfallThresholdPerHour: 79,
    operationalLimitPerHour: 32,
    populationDensity: "26,553 / sq km",
    imperviousSurfacePercentage: 64,
    externalMapUrl: "https://www.openstreetmap.in/flood-map/chennai.html#12/13.04/80.2",
    mapConfig: {
      districts: ["CHENNAI CENTRAL", "TAMBARAM", "OMR IT CORRIDOR"],
      landmarks: ["✈️ MAA", "Central"],
      riverNames: ["Cooum River", "Adyar River"],
      reservoirNames: ["Chembarambakkam", "Red Hills", "Poondi", "Cholavaram", "Veeranam"]
    }
  },
  {
    id: 'mumbai',
    name: "Mumbai, India",
    level: 'City',
    rainfallThresholdPerHour: 55,
    operationalLimitPerHour: 25,
    populationDensity: "32,303 / sq km",
    imperviousSurfacePercentage: 85,
    externalMapUrl: "https://www.openstreetmap.org/#map=11/19.0800/72.8800",
    mapConfig: {
      districts: ["BANDRA WEST", "NAVI MUMBAI", "COLABA"],
      landmarks: ["✈️ BOM", "CSMT"],
      riverNames: ["Mithi River", "Dahisar River"],
      reservoirNames: ["Tulsi Lake", "Vihar Lake", "Powai Lake", "Modak Sagar", "Tansa"]
    }
  },
  // --- DISTRICT LEVEL ---
  {
    id: 'tnagar',
    name: "T. Nagar (Chennai Central)",
    level: 'District',
    rainfallThresholdPerHour: 40,
    operationalLimitPerHour: 20,
    populationDensity: "45,000 / sq km",
    imperviousSurfacePercentage: 92,
    externalMapUrl: "https://www.openstreetmap.org/#map=15/13.0405/80.2337",
    mapConfig: {
      districts: ["PANAGAL PARK", "MAMBALAM", "G.N. CHETTY"],
      landmarks: ["Bus Terminus", "Skywalk"],
      riverNames: ["Mambalam Canal", "Adyar Tributary"],
      reservoirNames: ["Local Tank 1", "Local Tank 2", "Temple Tank", "Drainage Sump A", "Drainage Sump B"]
    }
  },
  {
    id: 'bengaluru',
    name: "Bengaluru, India",
    level: 'City',
    rainfallThresholdPerHour: 60,
    operationalLimitPerHour: 40,
    populationDensity: "19,000 / sq km",
    imperviousSurfacePercentage: 78,
    mapConfig: {
      districts: ["INDIRANAGAR", "ELECTRONIC CITY", "WHITEFIELD"],
      landmarks: ["✈️ BLR", "Majestic"],
      riverNames: ["Vrishabhavathi", "Arkavathi"],
      reservoirNames: ["Bellandur Lake", "Ulsoor Lake", "Sankey Tank", "Hebbal Lake", "Agara Lake"]
    }
  },
  {
    id: 'nyc',
    name: "New York City, USA",
    level: 'City',
    rainfallThresholdPerHour: 45,
    operationalLimitPerHour: 35,
    populationDensity: "11,313 / sq km",
    imperviousSurfacePercentage: 72,
    mapConfig: {
      districts: ["MANHATTAN", "BROOKLYN", "QUEENS"],
      landmarks: ["✈️ JFK", "Grand Central"],
      riverNames: ["Hudson River", "East River"],
      reservoirNames: ["Central Park Res", "Jerome Park", "Silver Lake", "Hillview", "Kensico"]
    }
  }
];

// Base Hydrology templates (names will be overwritten dynamically)
export const INITIAL_RESERVOIRS: Reservoir[] = [
  {
    id: 'res-1',
    name: 'Primary Reservoir', // Placeholder
    capacityMcft: 3645,
    currentLevelMcft: 2850,
    inflowCusecs: 1200,
    outflowCusecs: 500,
    lastUpdated: '10 mins ago'
  },
  {
    id: 'res-2',
    name: 'Secondary Reservoir',
    capacityMcft: 3300,
    currentLevelMcft: 2500,
    inflowCusecs: 800,
    outflowCusecs: 200,
    lastUpdated: '12 mins ago'
  },
  {
    id: 'res-3',
    name: 'Main Catchment',
    capacityMcft: 3231,
    currentLevelMcft: 3000,
    inflowCusecs: 9500,
    outflowCusecs: 8000,
    lastUpdated: '5 mins ago'
  },
  {
    id: 'res-4',
    name: 'Auxiliary Lake',
    capacityMcft: 1081,
    currentLevelMcft: 400,
    inflowCusecs: 150,
    outflowCusecs: 0,
    lastUpdated: '15 mins ago'
  },
  {
    id: 'res-5',
    name: 'Downstream Tank',
    capacityMcft: 1465,
    currentLevelMcft: 1100,
    inflowCusecs: 600,
    outflowCusecs: 600,
    lastUpdated: '20 mins ago'
  }
];

export const INITIAL_RIVERS: River[] = [
  {
    id: 'riv-1',
    name: 'Primary River', // Placeholder
    designCapacityCusecs: 60000,
    currentFlowCusecs: 15000,
    status: 'Normal',
    bottlenecks: ['Airport Runway Extension', 'Encroachments near Delta']
  },
  {
    id: 'riv-2',
    name: 'Secondary River',
    designCapacityCusecs: 22000,
    currentFlowCusecs: 18000,
    status: 'Warning',
    bottlenecks: ['Narrow river mouth', 'Urban waste dumping']
  },
  {
    id: 'riv-3',
    name: 'Canal Network',
    designCapacityCusecs: 125000,
    currentFlowCusecs: 45000,
    status: 'Normal',
    bottlenecks: ['Industrial blockages']
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'medium',
    title: 'High Inflow Alert',
    message: 'Reservoir inflow increased to 9,500 cusecs due to upstream catchment rain.',
    timestamp: '10 mins ago',
    location: 'Catchment Area A'
  },
  {
    id: '2',
    severity: 'low',
    title: 'Slight Waterlogging',
    message: 'Slow traffic due to water stagnation reported in subway.',
    timestamp: '25 mins ago',
    location: 'Downtown'
  },
  {
    id: '3',
    severity: 'high',
    title: 'River Level Warning',
    message: 'River level approaching danger mark near low-lying settlements.',
    timestamp: '1 hour ago',
    location: 'River Basin'
  }
];

export const MOCK_INFRA_PLANS: InfraPlan[] = [
  {
    id: 'p1',
    title: 'Integrated Stormwater Drain Network',
    description: 'Construction of new micro-drains connecting to marshlands to reduce flooding in residential zones.',
    estimatedCost: '₹120 Cr',
    timeline: '18 Months',
    impactScore: 9,
    status: 'Active',
    type: 'Drainage',
    progress: 45,
    spentBudget: '₹54 Cr',
    forecastStatus: 'On Track',
    startDate: '2023-08-01',
    strategicTerm: 'Medium-Term',
    immediateActions: ['Conduct drone survey of blocked segments', 'Deploy silt removal teams'],
    waterPath: 'North-East Arterial to Marsh',
    totalCapacity: '4000 cusecs',
    length: '12 km',
    soilUrbanCondition: 'Sandy clay, high density encroachment',
    benefits: ['Reduces street logging by 60%', 'Improves groundwater recharge'],
    risks: ['Underground cable interference', 'Traffic diversion required']
  },
  {
    id: 'p2',
    title: 'River Mouth Desilting',
    description: 'Dredging sandbars at the estuary to increase discharge rate into the sea by 20%.',
    estimatedCost: '₹45 Cr',
    timeline: '6 Months',
    impactScore: 8,
    status: 'Active',
    type: 'Policy',
    progress: 78,
    spentBudget: '₹38 Cr',
    forecastStatus: 'Delayed',
    startDate: '2024-01-15',
    strategicTerm: 'Short-Term',
    immediateActions: ['Deploy heavy dredgers', 'Monitor tidal inflow'],
    waterPath: 'Estuary Outfall',
    totalCapacity: 'Discharge +20%',
    length: '2 km',
    soilUrbanCondition: 'Marine sediment',
    benefits: ['Prevents backflow during high tide', 'Protects coastal settlements'],
    risks: ['Environmental clearance delays', 'High tide equipment risk']
  },
  {
    id: 'p3',
    title: 'New Check Dam Construction',
    description: 'Create upstream storage to buffer heavy inflows during monsoon peaks.',
    estimatedCost: '₹80 Cr',
    timeline: '24 Months',
    impactScore: 7,
    status: 'Proposed',
    type: 'Storage',
    progress: 0,
    spentBudget: '₹0 Cr',
    forecastStatus: 'On Track',
    startDate: 'TBD',
    strategicTerm: 'Long-Term',
    immediateActions: ['Land acquisition survey', 'Hydrological modeling'],
    waterPath: 'Upstream Basin Catchment',
    totalCapacity: '500 Mcft',
    length: 'N/A',
    soilUrbanCondition: 'Rocky terrain',
    benefits: ['Buffers peak flood water', 'Boosts summer water supply'],
    risks: ['Land acquisition legalities', 'Upstream village displacement']
  }
];

export const RAINFALL_DATA = [
  { time: '00:00', actual: 2, forecast: 2 },
  { time: '04:00', actual: 5, forecast: 4 },
  { time: '08:00', actual: 12, forecast: 10 },
  { time: '12:00', actual: 28, forecast: 30 },
  { time: '16:00', actual: 45, forecast: 42 },
  { time: '20:00', actual: null, forecast: 55 },
  { time: '24:00', actual: null, forecast: 40 },
];

export const MOCK_RECOVERY_TASKS: RecoveryTask[] = [
  {
    id: 't1',
    location: 'Central Subway',
    description: 'Deploy 2 high-capacity suction pumps (50 HP) to clear logged water. Divert traffic.',
    status: 'In Progress',
    priority: 'High',
    assignedTeam: 'PWD-Team-Alpha',
    timestamp: '20 mins ago',
    aiSuggested: true
  },
  {
    id: 't2',
    location: 'Main Market Road',
    description: 'Clear garbage clogging the storm water drain inlet.',
    status: 'Pending',
    priority: 'Medium',
    timestamp: '45 mins ago',
    aiSuggested: false
  },
  {
    id: 't3',
    location: 'Low Level Bridge',
    description: 'Barricade bridge entry. Water level 2ft above road surface.',
    status: 'Dispatched',
    priority: 'Critical',
    assignedTeam: 'Police-Patrol-9',
    timestamp: '1 hour ago',
    aiSuggested: true
  }
];

export const MOCK_RESPONSE_TEAMS: ResponseTeam[] = [
  { id: 'tm1', name: 'Disaster-Response-Unit', type: 'NDRF', status: 'Available' },
  { id: 'tm2', name: 'PWD-Team-Alpha', type: 'Public Works', status: 'Deployed', currentLocation: 'Central Subway' },
  { id: 'tm3', name: 'Fire-Rescue-04', type: 'Fire & Rescue', status: 'Available' },
  { id: 'tm4', name: 'Med-Response-Rapid', type: 'Medical', status: 'Resting' },
];

export const HISTORICAL_EVENTS = [
  { id: 'h1', date: 'Dec 2015', label: 'Historic Deluge', rainfall: 280, impact: 'Catastrophic', zones: [0, 1, 2] },
  { id: 'h2', date: 'Nov 2021', label: 'Cyclonic Surge', rainfall: 110, impact: 'High', zones: [0, 2] },
  { id: 'h3', date: 'Dec 2023', label: 'Cyclone Michaung', rainfall: 140, impact: 'Critical', zones: [0, 1] },
  { id: 'h4', date: 'Oct 2024', label: 'Early Monsoon', rainfall: 45, impact: 'Moderate', zones: [1] },
];

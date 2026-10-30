import type {
  Disruption,
  Shipment,
  RecoveryPlan,
  Supplier,
  InventoryItem,
  AuditEvent,
  Notification,
  ActivityEvent,
} from '@/types';

export const DEMO_USER = {
  name: 'Priya Sharma',
  role: 'Supply Chain Analyst',
  email: 'priya.sharma@disruptioniq.demo',
  avatar: 'PS',
};

export const APPROVAL_RULES = [
  'A plan must be submitted before it can be approved.',
  'The person who proposes or materially modifies a plan cannot approve that same plan.',
  'Changes to a plan invalidate its previous approval and require revalidation.',
  'Only the currently approved plan version can be executed.',
  'Administrators cannot bypass business approvals.',
];

export const disruptions: Disruption[] = [
  {
    id: 'DIS-2026-0417',
    type: 'Vehicle Breakdown',
    status: 'Active',
    severity: 'Critical',
    corridor: 'Delhi – Chennai Corridor',
    origin: 'Delhi Warehouse',
    destination: 'Chennai Warehouse',
    affectedShipments: 14,
    affectedOrders: 38,
    estimatedDelayHrs: 26,
    detectedAt: '2026-10-29 06:42 IST',
    summary:
      'Truck RT-0447 suffered an engine failure on NH-44 near Nagpur, halting 14 shipments bound for the Chennai warehouse. Rerouting and supplier-sourcing recovery options are under review.',
    timeline: [
      { id: 't1', time: '06:42 IST', label: 'Incident Detected', description: 'Telemetry loss from truck RT-0447 on NH-44 near Nagpur.' },
      { id: 't2', time: '06:55 IST', label: 'Confirmed Breakdown', description: 'Driver reported engine failure. Vehicle immobile on highway shoulder.' },
      { id: 't3', time: '07:10 IST', label: 'Impact Assessment', description: '14 shipments and 38 orders identified as affected.' },
      { id: 't4', time: '07:30 IST', label: 'Risk Analysis Initiated', description: 'AI risk ranking engine began evaluating affected orders.' },
      { id: 't5', time: '08:15 IST', label: 'Recovery Plan Drafted', description: 'Plan RP-1042 v1 created with rerouting and supplier-sourcing options.' },
      { id: 't6', time: '09:00 IST', label: 'Plan Submitted for Approval', description: 'Plan v2 submitted by Priya Sharma for manager review.' },
    ],
  },
  {
    id: 'DIS-2026-0416',
    type: 'Weather Disruption',
    status: 'Monitoring',
    severity: 'Medium',
    corridor: 'East Coast Route',
    origin: 'Visakhapatnam Hub',
    destination: 'Chennai Warehouse',
    affectedShipments: 6,
    affectedOrders: 12,
    estimatedDelayHrs: 8,
    detectedAt: '2026-10-29 04:20 IST',
    summary:
      'Heavy rainfall reported along the east coast route. 6 shipments are delayed with potential for further disruption if conditions worsen.',
    timeline: [
      { id: 't1', time: '04:20 IST', label: 'Weather Alert', description: 'Heavy rainfall advisory issued for east coast districts.' },
      { id: 't2', time: '05:00 IST', label: 'Shipments Flagged', description: '6 shipments on the affected corridor identified.' },
      { id: 't3', time: '05:30 IST', label: 'Monitoring Activated', description: 'Operations team set to monitoring status pending weather update.' },
    ],
  },
  {
    id: 'DIS-2026-0415',
    type: 'Customs Hold',
    status: 'Investigating',
    severity: 'Low',
    corridor: 'Port-to-Warehouse Route',
    origin: 'Chennai Port',
    destination: 'Chennai Warehouse',
    affectedShipments: 3,
    affectedOrders: 5,
    estimatedDelayHrs: 4,
    detectedAt: '2026-10-28 22:10 IST',
    summary:
      'Three inbound containers placed on customs hold at Chennai Port. Documentation review in progress.',
    timeline: [
      { id: 't1', time: '22:10 IST', label: 'Customs Hold', description: '3 containers flagged for documentation review.' },
      { id: 't2', time: '22:45 IST', label: 'Investigation Started', description: 'Customs broker contacted for documentation support.' },
    ],
  },
];

export const shipments: Shipment[] = [
  { id: 'SHP-900124', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Delayed', priority: 'Urgent', carrier: 'FastFreight Logistics', eta: '2026-10-31 14:00', delayRisk: 92, customerImpact: 'High — SLA breach imminent', orderId: 'ORD-50081', linkedDisruptionId: 'DIS-2026-0417' },
  { id: 'SHP-900125', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Held', priority: 'High', carrier: 'FastFreight Logistics', eta: '2026-10-31 18:00', delayRisk: 88, customerImpact: 'High — committed delivery window missed', orderId: 'ORD-50082', linkedDisruptionId: 'DIS-2026-0417' },
  { id: 'SHP-900126', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Held', priority: 'High', carrier: 'IndiaTrans', eta: '2026-11-01 09:00', delayRisk: 85, customerImpact: 'Medium — customer notified of delay', orderId: 'ORD-50083', linkedDisruptionId: 'DIS-2026-0417' },
  { id: 'SHP-900127', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Rerouted', priority: 'Medium', carrier: 'IndiaTrans', eta: '2026-11-01 16:00', delayRisk: 45, customerImpact: 'Low — rerouted via alternate route', orderId: 'ORD-50084', linkedDisruptionId: 'DIS-2026-0417' },
  { id: 'SHP-900128', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Delayed', priority: 'High', carrier: 'BlueHaul', eta: '2026-11-01 12:00', delayRisk: 78, customerImpact: 'Medium — partial order affected', orderId: 'ORD-50085', linkedDisruptionId: 'DIS-2026-0417' },
  { id: 'SHP-900129', origin: 'Visakhapatnam Hub', destination: 'Chennai Warehouse', status: 'Delayed', priority: 'Medium', carrier: 'BlueHaul', eta: '2026-10-31 10:00', delayRisk: 62, customerImpact: 'Low — buffer time available', orderId: 'ORD-50086', linkedDisruptionId: 'DIS-2026-0416' },
  { id: 'SHP-900130', origin: 'Visakhapatnam Hub', destination: 'Chennai Warehouse', status: 'Delayed', priority: 'Low', carrier: 'FastFreight Logistics', eta: '2026-10-31 15:00', delayRisk: 58, customerImpact: 'Low — non-critical items', orderId: 'ORD-50087', linkedDisruptionId: 'DIS-2026-0416' },
  { id: 'SHP-900131', origin: 'Chennai Port', destination: 'Chennai Warehouse', status: 'Held', priority: 'Medium', carrier: 'PortLink', eta: '2026-10-30 20:00', delayRisk: 40, customerImpact: 'Low — customs documentation pending', orderId: 'ORD-50088', linkedDisruptionId: 'DIS-2026-0415' },
  { id: 'SHP-900132', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'In Transit', priority: 'Low', carrier: 'IndiaTrans', eta: '2026-11-02 10:00', delayRisk: 15, customerImpact: 'None — on schedule', orderId: 'ORD-50089', linkedDisruptionId: null },
  { id: 'SHP-900133', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Delivered', priority: 'Low', carrier: 'BlueHaul', eta: '2026-10-28 09:00', delayRisk: 0, customerImpact: 'None — delivered on time', orderId: 'ORD-50090', linkedDisruptionId: null },
  { id: 'SHP-900134', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'In Transit', priority: 'Medium', carrier: 'FastFreight Logistics', eta: '2026-11-01 08:00', delayRisk: 20, customerImpact: 'None — on schedule', orderId: 'ORD-50091', linkedDisruptionId: null },
  { id: 'SHP-900135', origin: 'Delhi Warehouse', destination: 'Chennai Warehouse', status: 'Delayed', priority: 'Urgent', carrier: 'IndiaTrans', eta: '2026-11-01 22:00', delayRisk: 90, customerImpact: 'High — pharmaceutical cold chain at risk', orderId: 'ORD-50092', linkedDisruptionId: 'DIS-2026-0417' },
];

export const recoveryPlans: RecoveryPlan[] = [
  {
    id: 'RP-1042',
    version: 'v2',
    strategy: 'Alternate Route Rerouting',
    description:
      'Reroute all unaffected-in-transit shipments via an alternate highway corridor to bypass the breakdown site. Deploy replacement trucks from the Nagpur partner depot.',
    ordersProtected: 28,
    costBreakdown: [
      { label: 'Replacement truck deployment', amount: 85000, type: 'estimated' },
      { label: 'Additional fuel (alternate route)', amount: 32000, type: 'estimated' },
      { label: 'Driver overtime', amount: 18000, type: 'estimated' },
      { label: 'Contingency buffer', amount: 15000, type: 'synthetic' },
    ],
    totalCost: 150000,
    riskLevel: 'Medium',
    validationStatus: 'Validated',
    approvalStatus: 'Pending Approval',
    proposer: 'Priya Sharma',
    submittedAt: '2026-10-29 09:00 IST',
    approvedBy: null,
    approvedAt: null,
    assumptions: [
      'Alternate route NH-530 has current road clearance.',
      'Two replacement trucks are available at Nagpur partner depot.',
      'Customer SLAs allow a 24-hour extension for non-urgent orders.',
    ],
    risks: [
      'Alternate route adds approximately 180 km and 4 hours transit time.',
      'Replacement truck availability not confirmed at time of drafting.',
    ],
    versionHistory: [
      { version: 'v1', date: '2026-10-29 08:15 IST', author: 'Priya Sharma', changes: 'Initial plan draft with rerouting strategy.' },
      { version: 'v2', date: '2026-10-29 09:00 IST', author: 'Priya Sharma', changes: 'Added cost breakdown and risk assessment. Submitted for approval.' },
    ],
    disruptionId: 'DIS-2026-0417',
  },
  {
    id: 'RP-1043',
    version: 'v1',
    strategy: 'Supplier Split-Shipment',
    description:
      'Source critical SKUs from verified suppliers near the destination to fulfill urgent orders directly, bypassing the disrupted corridor entirely.',
    ordersProtected: 22,
    costBreakdown: [
      { label: 'Supplier procurement (urgent)', amount: 210000, type: 'estimated' },
      { label: 'Local last-mile delivery', amount: 28000, type: 'estimated' },
      { label: 'Expedited handling fees', amount: 12000, type: 'estimated' },
      { label: 'Contingency buffer', amount: 20000, type: 'synthetic' },
    ],
    totalCost: 270000,
    riskLevel: 'High',
    validationStatus: 'Pending Validation',
    approvalStatus: 'Pending Approval',
    proposer: 'Priya Sharma',
    submittedAt: '2026-10-29 09:30 IST',
    approvedBy: null,
    approvedAt: null,
    assumptions: [
      'Supplier stock availability is unverified at this time.',
      'Local delivery capacity can absorb 22 additional orders.',
      'Urgent orders can be partially fulfilled from supplier stock.',
    ],
    risks: [
      'Supplier stock availability not yet confirmed.',
      'Higher cost than rerouting strategy.',
      'Partial fulfillment may require customer notification.',
    ],
    versionHistory: [
      { version: 'v1', date: '2026-10-29 09:30 IST', author: 'Priya Sharma', changes: 'Initial draft with supplier split-shipment strategy.' },
    ],
    disruptionId: 'DIS-2026-0417',
  },
  {
    id: 'RP-1044',
    version: 'v1',
    strategy: 'Hold & Consolidate',
    description:
      'Hold all affected shipments until the breakdown is cleared, then consolidate into a single high-capacity convoy to Chennai. Lowest cost but longest delay.',
    ordersProtected: 38,
    costBreakdown: [
      { label: 'Storage at interim depot', amount: 22000, type: 'estimated' },
      { label: 'Consolidation convoy dispatch', amount: 45000, type: 'estimated' },
      { label: 'Contingency buffer', amount: 8000, type: 'synthetic' },
    ],
    totalCost: 75000,
    riskLevel: 'Low',
    validationStatus: 'Validation Failed',
    approvalStatus: 'Draft',
    proposer: 'Priya Sharma',
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    assumptions: [
      'Breakdown clearance estimated within 12 hours.',
      'Interim depot at Nagpur has capacity for 14 shipments.',
      'All 38 orders can tolerate a 24-36 hour delay.',
    ],
    risks: [
      'High SLA breach risk for urgent orders.',
      'Breakdown clearance time is an estimate and may extend.',
      'Cold-chain pharmaceutical orders cannot be held this long.',
    ],
    versionHistory: [
      { version: 'v1', date: '2026-10-29 10:00 IST', author: 'Priya Sharma', changes: 'Initial draft. Not submitted — validation flagged cold-chain risk.' },
    ],
    disruptionId: 'DIS-2026-0417',
  },
  {
    id: 'RP-1038',
    version: 'v3',
    strategy: 'Multi-Modal Rail + Road',
    description:
      'Previously approved plan for a prior disruption. Reroute shipments via rail to Chennai and last-mile road delivery. Superseded by newer version.',
    ordersProtected: 18,
    costBreakdown: [
      { label: 'Rail freight', amount: 95000, type: 'confirmed' },
      { label: 'Last-mile road', amount: 25000, type: 'confirmed' },
    ],
    totalCost: 120000,
    riskLevel: 'Medium',
    validationStatus: 'Stale',
    approvalStatus: 'Superseded',
    proposer: 'Arjun Mehta',
    submittedAt: '2026-10-25 11:00 IST',
    approvedBy: 'Rohan Kapoor',
    approvedAt: '2026-10-25 14:30 IST',
    assumptions: [
      'Rail capacity was available at the time of approval.',
      'This plan was approved for a prior, now-resolved disruption.',
    ],
    risks: ['Plan is stale and tied to a resolved incident.'],
    versionHistory: [
      { version: 'v1', date: '2026-10-24 09:00 IST', author: 'Arjun Mehta', changes: 'Initial draft.' },
      { version: 'v2', date: '2026-10-24 15:00 IST', author: 'Arjun Mehta', changes: 'Added rail capacity assumption.' },
      { version: 'v3', date: '2026-10-25 11:00 IST', author: 'Arjun Mehta', changes: 'Cost refinement and submission.' },
    ],
    disruptionId: 'DIS-2026-0410',
  },
];

export const suppliers: Supplier[] = [
  { id: 'SUP-001', name: 'NovaPack Industries', type: 'Packaging Materials', location: 'Chennai, TN', rating: null, onTimeRate: null, categories: ['Containers', 'Protective Packaging'], contactName: 'Karthik R', contactEmail: 'karthik@novapack.demo', verified: false },
  { id: 'SUP-002', name: 'Aegis Pharma Supply', type: 'Pharmaceutical Raw Materials', location: 'Hyderabad, TS', rating: null, onTimeRate: null, categories: ['Active Ingredients', 'Cold-Chain Items'], contactName: 'Dr. Niharika V', contactEmail: 'niharika@aegispharma.demo', verified: false },
  { id: 'SUP-003', name: 'TransLink Fleet Partners', type: 'Transport & Fleet', location: 'Nagpur, MH', rating: null, onTimeRate: null, categories: ['Truck Rental', 'Driver Services'], contactName: 'Suresh P', contactEmail: 'suresh@translink.demo', verified: false },
  { id: 'SUP-004', name: 'Vertex Electronics Supply', type: 'Electronic Components', location: 'Bengaluru, KA', rating: null, onTimeRate: null, categories: ['Semiconductors', 'PCBs'], contactName: 'Anita G', contactEmail: 'anita@vertexelec.demo', verified: false },
  { id: 'SUP-005', name: 'GreenGrocer Distributors', type: 'Food & Grocery', location: 'Chennai, TN', rating: null, onTimeRate: null, categories: ['Perishables', 'Dry Goods'], contactName: 'Mohan S', contactEmail: 'mohan@greengrocer.demo', verified: false },
  { id: 'SUP-006', name: 'Fortis Industrial Supply', type: 'Industrial Equipment', location: 'Pune, MH', rating: null, onTimeRate: null, categories: ['Machinery Parts', 'Tools'], contactName: 'Rajesh K', contactEmail: 'rajesh@fortisind.demo', verified: false },
];

export const inventoryItems: InventoryItem[] = [
  { id: 'INV-001', sku: 'PHARMA-CP-001', name: 'Cold-Pack Pharmaceutical Kit', warehouse: 'Delhi', quantity: 420, unit: 'units', reorderLevel: 150, status: 'In Stock' },
  { id: 'INV-002', sku: 'ELEC-PCB-022', name: 'Circuit Board Assembly', warehouse: 'Delhi', quantity: 85, unit: 'units', reorderLevel: 100, status: 'Low Stock' },
  { id: 'INV-003', sku: 'PKG-CTR-100', name: 'Shipping Container (Standard)', warehouse: 'Delhi', quantity: 310, unit: 'units', reorderLevel: 80, status: 'In Stock' },
  { id: 'INV-004', sku: 'IND-TOOL-014', name: 'Industrial Tool Set', warehouse: 'Delhi', quantity: 0, unit: 'sets', reorderLevel: 25, status: 'Out of Stock' },
  { id: 'INV-005', sku: 'FOOD-PER-003', name: 'Perishable Food Crate', warehouse: 'Chennai', quantity: 12, unit: 'crates', reorderLevel: 50, status: 'Critical' },
  { id: 'INV-006', sku: 'PHARMA-CP-001', name: 'Cold-Pack Pharmaceutical Kit', warehouse: 'Chennai', quantity: 65, unit: 'units', reorderLevel: 100, status: 'Low Stock' },
  { id: 'INV-007', sku: 'ELEC-SEM-008', name: 'Semiconductor Module', warehouse: 'Chennai', quantity: 240, unit: 'units', reorderLevel: 90, status: 'In Stock' },
  { id: 'INV-008', sku: 'PKG-CTR-100', name: 'Shipping Container (Standard)', warehouse: 'Chennai', quantity: 180, unit: 'units', reorderLevel: 80, status: 'In Stock' },
];

export const auditEvents: AuditEvent[] = [
  { id: 'AUD-001', actor: 'System', action: 'Detected disruption', entity: 'Disruption', entityId: 'DIS-2026-0417', timestamp: '2026-10-29 06:42 IST', planVersion: null, simulated: true, category: 'disruption' },
  { id: 'AUD-002', actor: 'AI Risk Engine', action: 'Completed risk analysis', entity: 'Disruption', entityId: 'DIS-2026-0417', timestamp: '2026-10-29 07:30 IST', planVersion: null, simulated: true, category: 'disruption' },
  { id: 'AUD-003', actor: 'Priya Sharma', action: 'Created recovery plan', entity: 'Recovery Plan', entityId: 'RP-1042', timestamp: '2026-10-29 08:15 IST', planVersion: 'v1', simulated: true, category: 'plan' },
  { id: 'AUD-004', actor: 'Priya Sharma', action: 'Modified recovery plan', entity: 'Recovery Plan', entityId: 'RP-1042', timestamp: '2026-10-29 08:50 IST', planVersion: 'v2', simulated: true, category: 'plan' },
  { id: 'AUD-005', actor: 'Priya Sharma', action: 'Submitted plan for approval', entity: 'Recovery Plan', entityId: 'RP-1042', timestamp: '2026-10-29 09:00 IST', planVersion: 'v2', simulated: true, category: 'approval' },
  { id: 'AUD-006', actor: 'Priya Sharma', action: 'Created recovery plan', entity: 'Recovery Plan', entityId: 'RP-1043', timestamp: '2026-10-29 09:30 IST', planVersion: 'v1', simulated: true, category: 'plan' },
  { id: 'AUD-007', actor: 'Validation Service', action: 'Validation failed for plan', entity: 'Recovery Plan', entityId: 'RP-1044', timestamp: '2026-10-29 10:05 IST', planVersion: 'v1', simulated: true, category: 'plan' },
  { id: 'AUD-008', actor: 'Rohan Kapoor', action: 'Approved recovery plan', entity: 'Recovery Plan', entityId: 'RP-1038', timestamp: '2026-10-25 14:30 IST', planVersion: 'v3', simulated: true, category: 'approval' },
  { id: 'AUD-009', actor: 'Arjun Mehta', action: 'Submitted plan for approval', entity: 'Recovery Plan', entityId: 'RP-1038', timestamp: '2026-10-25 11:00 IST', planVersion: 'v3', simulated: true, category: 'approval' },
  { id: 'AUD-010', actor: 'System', action: 'Shipment status changed to Delayed', entity: 'Shipment', entityId: 'SHP-900124', timestamp: '2026-10-29 06:50 IST', planVersion: null, simulated: true, category: 'shipment' },
  { id: 'AUD-011', actor: 'System', action: 'Inventory reorder threshold reached', entity: 'Inventory', entityId: 'INV-005', timestamp: '2026-10-28 18:00 IST', planVersion: null, simulated: true, category: 'inventory' },
  { id: 'AUD-012', actor: 'System', action: 'Weather alert received for east coast', entity: 'Disruption', entityId: 'DIS-2026-0416', timestamp: '2026-10-29 04:20 IST', planVersion: null, simulated: true, category: 'disruption' },
];

export const notifications: Notification[] = [
  { id: 'N1', title: 'Critical Disruption Detected', message: 'Vehicle breakdown on Delhi–Chennai corridor affecting 14 shipments.', time: '3 hours ago', read: false, type: 'alert' },
  { id: 'N2', title: 'Recovery Plan Submitted', message: 'Plan RP-1042 v2 awaiting your approval.', time: '2 hours ago', read: false, type: 'info' },
  { id: 'N3', title: 'Inventory Alert', message: 'Perishable Food Crate at Chennai warehouse below reorder level.', time: '5 hours ago', read: false, type: 'warning' },
  { id: 'N4', title: 'Plan Validation Failed', message: 'RP-1044 v1 failed validation: cold-chain risk detected.', time: '6 hours ago', read: true, type: 'warning' },
  { id: 'N5', title: 'Weather Advisory', message: 'Heavy rainfall monitoring on east coast route.', time: '8 hours ago', read: true, type: 'alert' },
];

export const activityEvents: ActivityEvent[] = [
  { id: 'A1', type: 'disruption', title: 'Disruption Detected', description: 'Vehicle breakdown on Delhi–Chennai corridor (DIS-2026-0417).', time: '06:42 IST', actor: 'System' },
  { id: 'A2', type: 'analysis', title: 'Risk Analysis Complete', description: '38 orders ranked by delay risk and customer impact.', time: '07:30 IST', actor: 'AI Risk Engine' },
  { id: 'A3', type: 'plan', title: 'Recovery Plan Drafted', description: 'RP-1042 v1 created with rerouting strategy.', time: '08:15 IST', actor: 'Priya Sharma' },
  { id: 'A4', type: 'plan', title: 'Recovery Plan Modified', description: 'RP-1042 updated to v2 with cost breakdown and risk assessment.', time: '08:50 IST', actor: 'Priya Sharma' },
  { id: 'A5', type: 'approval', title: 'Plan Submitted for Approval', description: 'RP-1042 v2 submitted for manager review.', time: '09:00 IST', actor: 'Priya Sharma' },
  { id: 'A6', type: 'plan', title: 'Alternative Plan Created', description: 'RP-1043 v1 drafted with supplier split-shipment strategy.', time: '09:30 IST', actor: 'Priya Sharma' },
  { id: 'A7', type: 'plan', title: 'Validation Failed', description: 'RP-1044 v1 failed validation — cold-chain risk flagged.', time: '10:05 IST', actor: 'Validation Service' },
];

export type DisruptionStatus = 'Active' | 'Monitoring' | 'Resolved' | 'Investigating';
export type DisruptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  description: string;
  icon?: string;
}

export interface Disruption {
  id: string;
  type: string;
  status: DisruptionStatus;
  severity: DisruptionSeverity;
  corridor: string;
  origin: string;
  destination: string;
  affectedShipments: number;
  affectedOrders: number;
  estimatedDelayHrs: number;
  detectedAt: string;
  summary: string;
  timeline: TimelineEvent[];
}

export type ShipmentStatus = 'In Transit' | 'Delayed' | 'Held' | 'Rerouted' | 'Delivered';
export type ShipmentPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  carrier: string;
  eta: string;
  delayRisk: number;
  customerImpact: string;
  orderId: string;
  linkedDisruptionId: string | null;
}

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type PlanValidationStatus = 'Validated' | 'Pending Validation' | 'Validation Failed' | 'Stale';
export type PlanApprovalStatus = 'Approved' | 'Pending Approval' | 'Rejected' | 'Draft' | 'Superseded';

export interface CostBreakdownItem {
  label: string;
  amount: number;
  type: 'confirmed' | 'estimated' | 'synthetic';
}

export interface PlanVersion {
  version: string;
  date: string;
  author: string;
  changes: string;
}

export interface RecoveryPlan {
  id: string;
  version: string;
  strategy: string;
  description: string;
  ordersProtected: number;
  costBreakdown: CostBreakdownItem[];
  totalCost: number;
  riskLevel: RiskLevel;
  validationStatus: PlanValidationStatus;
  approvalStatus: PlanApprovalStatus;
  proposer: string;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  assumptions: string[];
  risks: string[];
  versionHistory: PlanVersion[];
  disruptionId: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number | null;
  onTimeRate: number | null;
  categories: string[];
  contactName: string;
  contactEmail: string;
  verified: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  warehouse: 'Delhi' | 'Chennai';
  quantity: number;
  unit: string;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  planVersion: string | null;
  simulated: boolean;
  category: 'disruption' | 'plan' | 'approval' | 'shipment' | 'inventory' | 'system';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'info' | 'success' | 'warning';
}

export interface ActivityEvent {
  id: string;
  type: 'disruption' | 'analysis' | 'plan' | 'approval' | 'shipment';
  title: string;
  description: string;
  time: string;
  actor: string;
}

"""Domain models for the Decision Intelligence Engine.

These mirror the frontend TypeScript types so that data shapes are consistent
across the stack. All models are Pydantic v2 BaseModel subclasses so they can
be used directly for validation, serialization, and OpenAPI schema generation.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ─────────────────────────────────────────────────────────────


class DisruptionStatus(str, Enum):
    active = "Active"
    monitoring = "Monitoring"
    resolved = "Resolved"
    investigating = "Investigating"


class DisruptionSeverity(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class ShipmentStatus(str, Enum):
    in_transit = "In Transit"
    delayed = "Delayed"
    held = "Held"
    rerouted = "Rerouted"
    delivered = "Delivered"


class ShipmentPriority(str, Enum):
    urgent = "Urgent"
    high = "High"
    medium = "Medium"
    low = "Low"


class RiskLevel(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class PlanValidationStatus(str, Enum):
    validated = "Validated"
    pending = "Pending Validation"
    failed = "Validation Failed"
    stale = "Stale"


class PlanApprovalStatus(str, Enum):
    approved = "Approved"
    pending = "Pending Approval"
    rejected = "Rejected"
    draft = "Draft"
    superseded = "Superseded"


class CostType(str, Enum):
    confirmed = "confirmed"
    estimated = "estimated"
    synthetic = "synthetic"


class Warehouse(str, Enum):
    delhi = "Delhi"
    chennai = "Chennai"


class InventoryStatus(str, Enum):
    in_stock = "In Stock"
    low_stock = "Low Stock"
    critical = "Critical"
    out_of_stock = "Out of Stock"


# ─── Core domain entities ──────────────────────────────────────────────


class TimelineEvent(BaseModel):
    id: str
    time: str
    label: str
    description: str


class Disruption(BaseModel):
    id: str
    type: str
    status: DisruptionStatus
    severity: DisruptionSeverity
    corridor: str
    origin: str
    destination: str
    affected_shipments: int
    affected_orders: int
    estimated_delay_hrs: int
    detected_at: str
    summary: str
    timeline: list[TimelineEvent] = Field(default_factory=list)


class Order(BaseModel):
    """An order linked to a shipment. Extends the frontend model with
    fields needed by the risk engine (deadline, sku, quantity, is_cold_chain)."""
    order_id: str
    shipment_id: str
    destination: str
    priority: ShipmentPriority
    status: ShipmentStatus
    carrier: str
    eta: str
    customer_impact: str
    linked_disruption_id: Optional[str] = None
    deadline: Optional[str] = None
    sku: Optional[str] = None
    quantity: int = 1
    is_cold_chain: bool = False


class Shipment(BaseModel):
    id: str
    origin: str
    destination: str
    status: ShipmentStatus
    priority: ShipmentPriority
    carrier: str
    eta: str
    delay_risk: int
    customer_impact: str
    order_id: str
    linked_disruption_id: Optional[str] = None
    is_cold_chain: bool = False
    sku: Optional[str] = None
    quantity: int = 1


class CostBreakdownItem(BaseModel):
    label: str
    amount: float
    type: CostType


class PlanVersion(BaseModel):
    version: str
    date: str
    author: str
    changes: str


class InventoryItem(BaseModel):
    id: str
    sku: str
    name: str
    warehouse: Warehouse
    quantity: int
    unit: str
    reorder_level: int
    status: InventoryStatus


class Supplier(BaseModel):
    id: str
    name: str
    type: str
    location: str
    rating: Optional[float] = None
    on_time_rate: Optional[float] = None
    categories: list[str] = Field(default_factory=list)
    contact_name: str
    contact_email: str
    verified: bool = False


# ─── Risk-scoring outputs ──────────────────────────────────────────────


class RiskFactor(BaseModel):
    """A single transparent factor contributing to an order's risk score."""
    name: str
    weight: float
    raw_value: float
    normalized_value: float
    contribution: float
    explanation: str


class RiskScore(BaseModel):
    """Explainable risk score for a single affected order."""
    order_id: str
    shipment_id: str
    score: int = Field(ge=0, le=100, description="Rule-based demo risk score (0–100)")
    score_type: str = "rule_based_demo"
    risk_level: RiskLevel
    factors: list[RiskFactor]
    primary_reason: str
    confidence: str = Field(description="High, Medium, or Low — based on data completeness")
    missing_data: list[str] = Field(default_factory=list)
    deadline: Optional[str] = None
    is_cold_chain: bool = False


# ─── Recovery plan outputs ─────────────────────────────────────────────


class RecoveryOption(BaseModel):
    id: str
    strategy: str
    description: str
    affected_order_ids: list[str]
    orders_protected: int
    orders_unprotected: int
    cost_breakdown: list[CostBreakdownItem]
    total_cost: float
    cost_confidence: str = "synthetic"
    risk_level: RiskLevel
    feasibility: str = Field(description="Feasible, Conditionally Feasible, Infeasible")
    assumptions: list[str]
    operational_risks: list[str]
    missing_information: list[str]
    requires_inventory_check: bool = False
    requires_supplier_verification: bool = False


class RecoveryComparison(BaseModel):
    cheapest_option_id: Optional[str] = None
    most_protected_option_id: Optional[str] = None
    lowest_risk_option_id: Optional[str] = None
    summary: str

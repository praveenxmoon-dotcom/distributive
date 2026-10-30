"""Synthetic demo data for the Decision Intelligence Engine.

This mirrors the frontend demo data so the backend and UI stay consistent.
All data is explicitly marked as synthetic — no real shipments, orders,
inventory, or suppliers are represented.
"""
from __future__ import annotations

from .models import (
    CostType,
    Disruption,
    DisruptionSeverity,
    DisruptionStatus,
    InventoryItem,
    InventoryStatus,
    PlanApprovalStatus,
    PlanValidationStatus,
    RecoveryOption,
    RiskLevel,
    Shipment,
    ShipmentPriority,
    ShipmentStatus,
    Supplier,
    TimelineEvent,
    Warehouse,
)

SYNTHETIC_NOTE = "All data is synthetic and for demo purposes only."

# ─── Disruptions ───────────────────────────────────────────────────────

disruptions: list[Disruption] = [
    Disruption(
        id="DIS-2026-0417",
        type="Vehicle Breakdown",
        status=DisruptionStatus.active,
        severity=DisruptionSeverity.critical,
        corridor="Delhi – Chennai Corridor",
        origin="Delhi Warehouse",
        destination="Chennai Warehouse",
        affected_shipments=14,
        affected_orders=38,
        estimated_delay_hrs=26,
        detected_at="2026-10-29 06:42 IST",
        summary=(
            "Truck RT-0447 suffered an engine failure on NH-44 near Nagpur, "
            "halting 14 shipments bound for the Chennai warehouse. Rerouting "
            "and supplier-sourcing recovery options are under review."
        ),
        timeline=[
            TimelineEvent(id="t1", time="06:42 IST", label="Incident Detected",
                         description="Telemetry loss from truck RT-0447 on NH-44 near Nagpur."),
            TimelineEvent(id="t2", time="06:55 IST", label="Confirmed Breakdown",
                         description="Driver reported engine failure. Vehicle immobile on highway shoulder."),
            TimelineEvent(id="t3", time="07:10 IST", label="Impact Assessment",
                         description="14 shipments and 38 orders identified as affected."),
            TimelineEvent(id="t4", time="07:30 IST", label="Risk Analysis Initiated",
                         description="AI risk ranking engine began evaluating affected orders."),
            TimelineEvent(id="t5", time="08:15 IST", label="Recovery Plan Drafted",
                         description="Plan RP-1042 v1 created with rerouting and supplier-sourcing options."),
            TimelineEvent(id="t6", time="09:00 IST", label="Plan Submitted for Approval",
                         description="Plan v2 submitted by Priya Sharma for manager review."),
        ],
    ),
    Disruption(
        id="DIS-2026-0416",
        type="Weather Disruption",
        status=DisruptionStatus.monitoring,
        severity=DisruptionSeverity.medium,
        corridor="East Coast Route",
        origin="Visakhapatnam Hub",
        destination="Chennai Warehouse",
        affected_shipments=6,
        affected_orders=12,
        estimated_delay_hrs=8,
        detected_at="2026-10-29 04:20 IST",
        summary=(
            "Heavy rainfall reported along the east coast route. 6 shipments "
            "are delayed with potential for further disruption if conditions worsen."
        ),
        timeline=[
            TimelineEvent(id="t1", time="04:20 IST", label="Weather Alert",
                         description="Heavy rainfall advisory issued for east coast districts."),
            TimelineEvent(id="t2", time="05:00 IST", label="Shipments Flagged",
                         description="6 shipments on the affected corridor identified."),
            TimelineEvent(id="t3", time="05:30 IST", label="Monitoring Activated",
                         description="Operations team set to monitoring status pending weather update."),
        ],
    ),
    Disruption(
        id="DIS-2026-0415",
        type="Customs Hold",
        status=DisruptionStatus.investigating,
        severity=DisruptionSeverity.low,
        corridor="Port-to-Warehouse Route",
        origin="Chennai Port",
        destination="Chennai Warehouse",
        affected_shipments=3,
        affected_orders=5,
        estimated_delay_hrs=4,
        detected_at="2026-10-28 22:10 IST",
        summary=(
            "Three inbound containers placed on customs hold at Chennai Port. "
            "Documentation review in progress."
        ),
        timeline=[
            TimelineEvent(id="t1", time="22:10 IST", label="Customs Hold",
                         description="3 containers flagged for documentation review."),
            TimelineEvent(id="t2", time="22:45 IST", label="Investigation Started",
                         description="Customs broker contacted for documentation support."),
        ],
    ),
]

# ─── Shipments (with extended fields for the risk engine) ─────────────

shipments: list[Shipment] = [
    Shipment(id="SHP-900124", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.delayed, priority=ShipmentPriority.urgent,
             carrier="FastFreight Logistics", eta="2026-10-31 14:00",
             delay_risk=92, customer_impact="High — SLA breach imminent",
             order_id="ORD-50081", linked_disruption_id="DIS-2026-0417",
             sku="PHARMA-CP-001", quantity=50, is_cold_chain=True),
    Shipment(id="SHP-900125", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.held, priority=ShipmentPriority.high,
             carrier="FastFreight Logistics", eta="2026-10-31 18:00",
             delay_risk=88, customer_impact="High — committed delivery window missed",
             order_id="ORD-50082", linked_disruption_id="DIS-2026-0417",
             sku="ELEC-PCB-022", quantity=30, is_cold_chain=False),
    Shipment(id="SHP-900126", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.held, priority=ShipmentPriority.high,
             carrier="IndiaTrans", eta="2026-11-01 09:00",
             delay_risk=85, customer_impact="Medium — customer notified of delay",
             order_id="ORD-50083", linked_disruption_id="DIS-2026-0417",
             sku="PKG-CTR-100", quantity=200, is_cold_chain=False),
    Shipment(id="SHP-900127", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.rerouted, priority=ShipmentPriority.medium,
             carrier="IndiaTrans", eta="2026-11-01 16:00",
             delay_risk=45, customer_impact="Low — rerouted via alternate route",
             order_id="ORD-50084", linked_disruption_id="DIS-2026-0417",
             sku="ELEC-SEM-008", quantity=80, is_cold_chain=False),
    Shipment(id="SHP-900128", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.delayed, priority=ShipmentPriority.high,
             carrier="BlueHaul", eta="2026-11-01 12:00",
             delay_risk=78, customer_impact="Medium — partial order affected",
             order_id="ORD-50085", linked_disruption_id="DIS-2026-0417",
             sku="PHARMA-CP-001", quantity=15, is_cold_chain=True),
    Shipment(id="SHP-900129", origin="Visakhapatnam Hub", destination="Chennai Warehouse",
             status=ShipmentStatus.delayed, priority=ShipmentPriority.medium,
             carrier="BlueHaul", eta="2026-10-31 10:00",
             delay_risk=62, customer_impact="Low — buffer time available",
             order_id="ORD-50086", linked_disruption_id="DIS-2026-0416",
             sku="FOOD-PER-003", quantity=40, is_cold_chain=True),
    Shipment(id="SHP-900130", origin="Visakhapatnam Hub", destination="Chennai Warehouse",
             status=ShipmentStatus.delayed, priority=ShipmentPriority.low,
             carrier="FastFreight Logistics", eta="2026-10-31 15:00",
             delay_risk=58, customer_impact="Low — non-critical items",
             order_id="ORD-50087", linked_disruption_id="DIS-2026-0416",
             sku="PKG-CTR-100", quantity=100, is_cold_chain=False),
    Shipment(id="SHP-900131", origin="Chennai Port", destination="Chennai Warehouse",
             status=ShipmentStatus.held, priority=ShipmentPriority.medium,
             carrier="PortLink", eta="2026-10-30 20:00",
             delay_risk=40, customer_impact="Low — customs documentation pending",
             order_id="ORD-50088", linked_disruption_id="DIS-2026-0415",
             sku="ELEC-SEM-008", quantity=60, is_cold_chain=False),
    Shipment(id="SHP-900132", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.in_transit, priority=ShipmentPriority.low,
             carrier="IndiaTrans", eta="2026-11-02 10:00",
             delay_risk=15, customer_impact="None — on schedule",
             order_id="ORD-50089", linked_disruption_id=None),
    Shipment(id="SHP-900133", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.delivered, priority=ShipmentPriority.low,
             carrier="BlueHaul", eta="2026-10-28 09:00",
             delay_risk=0, customer_impact="None — delivered on time",
             order_id="ORD-50090", linked_disruption_id=None),
    Shipment(id="SHP-900134", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.in_transit, priority=ShipmentPriority.medium,
             carrier="FastFreight Logistics", eta="2026-11-01 08:00",
             delay_risk=20, customer_impact="None — on schedule",
             order_id="ORD-50091", linked_disruption_id=None),
    Shipment(id="SHP-900135", origin="Delhi Warehouse", destination="Chennai Warehouse",
             status=ShipmentStatus.delayed, priority=ShipmentPriority.urgent,
             carrier="IndiaTrans", eta="2026-11-01 22:00",
             delay_risk=90, customer_impact="High — pharmaceutical cold chain at risk",
             order_id="ORD-50092", linked_disruption_id="DIS-2026-0417",
             sku="PHARMA-CP-001", quantity=25, is_cold_chain=True),
]

# ─── Inventory (only Delhi and Chennai warehouses) ────────────────────

inventory: list[InventoryItem] = [
    InventoryItem(id="INV-001", sku="PHARMA-CP-001", name="Cold-Pack Pharmaceutical Kit",
                  warehouse=Warehouse.delhi, quantity=420, unit="units",
                  reorder_level=150, status=InventoryStatus.in_stock),
    InventoryItem(id="INV-002", sku="ELEC-PCB-022", name="Circuit Board Assembly",
                  warehouse=Warehouse.delhi, quantity=85, unit="units",
                  reorder_level=100, status=InventoryStatus.low_stock),
    InventoryItem(id="INV-003", sku="PKG-CTR-100", name="Shipping Container (Standard)",
                  warehouse=Warehouse.delhi, quantity=310, unit="units",
                  reorder_level=80, status=InventoryStatus.in_stock),
    InventoryItem(id="INV-004", sku="IND-TOOL-014", name="Industrial Tool Set",
                  warehouse=Warehouse.delhi, quantity=0, unit="sets",
                  reorder_level=25, status=InventoryStatus.out_of_stock),
    InventoryItem(id="INV-005", sku="FOOD-PER-003", name="Perishable Food Crate",
                  warehouse=Warehouse.chennai, quantity=12, unit="crates",
                  reorder_level=50, status=InventoryStatus.critical),
    InventoryItem(id="INV-006", sku="PHARMA-CP-001", name="Cold-Pack Pharmaceutical Kit",
                  warehouse=Warehouse.chennai, quantity=65, unit="units",
                  reorder_level=100, status=InventoryStatus.low_stock),
    InventoryItem(id="INV-007", sku="ELEC-SEM-008", name="Semiconductor Module",
                  warehouse=Warehouse.chennai, quantity=240, unit="units",
                  reorder_level=90, status=InventoryStatus.in_stock),
    InventoryItem(id="INV-008", sku="PKG-CTR-100", name="Shipping Container (Standard)",
                  warehouse=Warehouse.chennai, quantity=180, unit="units",
                  reorder_level=80, status=InventoryStatus.in_stock),
]

# ─── Suppliers (external partners — separate from company warehouses) ─

suppliers: list[Supplier] = [
    Supplier(id="SUP-001", name="NovaPack Industries", type="Packaging Materials",
             location="Chennai, TN", rating=None, on_time_rate=None,
             categories=["Containers", "Protective Packaging"],
             contact_name="Karthik R", contact_email="karthik@novapack.demo",
             verified=False),
    Supplier(id="SUP-002", name="Aegis Pharma Supply", type="Pharmaceutical Raw Materials",
             location="Hyderabad, TS", rating=None, on_time_rate=None,
             categories=["Active Ingredients", "Cold-Chain Items"],
             contact_name="Dr. Niharika V", contact_email="niharika@aegispharma.demo",
             verified=False),
    Supplier(id="SUP-003", name="TransLink Fleet Partners", type="Transport & Fleet",
             location="Nagpur, MH", rating=None, on_time_rate=None,
             categories=["Truck Rental", "Driver Services"],
             contact_name="Suresh P", contact_email="suresh@translink.demo",
             verified=False),
    Supplier(id="SUP-004", name="Vertex Electronics Supply", type="Electronic Components",
             location="Bengaluru, KA", rating=None, on_time_rate=None,
             categories=["Semiconductors", "PCBs"],
             contact_name="Anita G", contact_email="anita@vertexelec.demo",
             verified=False),
    Supplier(id="SUP-005", name="GreenGrocer Distributors", type="Food & Grocery",
             location="Chennai, TN", rating=None, on_time_rate=None,
             categories=["Perishables", "Dry Goods"],
             contact_name="Mohan S", contact_email="mohan@greengrocer.demo",
             verified=False),
    Supplier(id="SUP-006", name="Fortis Industrial Supply", type="Industrial Equipment",
             location="Pune, MH", rating=None, on_time_rate=None,
             categories=["Machinery Parts", "Tools"],
             contact_name="Rajesh K", contact_email="rajesh@fortisind.demo",
             verified=False),
]

# ─── Demo users (for approval workflow tests) ──────────────────────────

demo_users = {
    "priya.sharma": {
        "name": "Priya Sharma",
        "role": "Supply Chain Analyst",
        "email": "priya.sharma@disruptioniq.demo",
    },
    "rohan.kapoor": {
        "name": "Rohan Kapoor",
        "role": "Operations Manager",
        "email": "rohan.kapoor@disruptioniq.demo",
    },
    "arjun.mehta": {
        "name": "Arjun Mehta",
        "role": "Supply Chain Analyst",
        "email": "arjun.mehta@disruptioniq.demo",
    },
}


def get_disruption(disruption_id: str) -> Disruption | None:
    for d in disruptions:
        if d.id == disruption_id:
            return d
    return None


def get_shipments_for_disruption(disruption_id: str) -> list[Shipment]:
    return [s for s in shipments if s.linked_disruption_id == disruption_id]


def get_inventory_by_sku(sku: str) -> list[InventoryItem]:
    return [i for i in inventory if i.sku == sku]


def get_inventory_by_warehouse(warehouse: Warehouse) -> list[InventoryItem]:
    return [i for i in inventory if i.warehouse == warehouse]


def get_suppliers_by_category(category: str) -> list[Supplier]:
    return [s for s in suppliers if category in s.categories]

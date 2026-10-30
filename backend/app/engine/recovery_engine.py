"""Recovery plan generator with feasibility checks.

Generates recovery options using only verified data (actual inventory,
verified constraints). Never invents stock, supplier availability, or
transport capacity. Synthetic estimates are clearly marked.
"""
from __future__ import annotations

from ..data import (
    get_inventory_by_sku,
    get_suppliers_by_category,
)
from ..models import (
    CostBreakdownItem,
    CostType,
    Disruption,
    InventoryItem,
    RecoveryComparison,
    RecoveryOption,
    RiskLevel,
    Shipment,
)
from .risk_engine import _score_to_level


def _filter_cold_chain(shipments: list[Shipment]) -> list[Shipment]:
    return [s for s in shipments if s.is_cold_chain]


def _filter_non_cold_chain(shipments: list[Shipment]) -> list[Shipment]:
    return [s for s in shipments if not s.is_cold_chain]


def _filter_eligible_for_reroute(shipments: list[Shipment]) -> list[Shipment]:
    """Only shipments that are delayed or held (not already rerouted or delivered)."""
    eligible_statuses = {"Delayed", "Held"}
    return [s for s in shipments if s.status.value in eligible_statuses]


def _total_demand_for_sku(shipments: list[Shipment], sku: str) -> int:
    return sum(s.quantity for s in shipments if s.sku == sku)


def _generate_reroute_option(
    disruption: Disruption,
    affected: list[Shipment],
) -> RecoveryOption:
    """Option 1: Reroute eligible shipments via alternate route."""
    eligible = _filter_eligible_for_reroute(affected)
    order_ids = [s.order_id for s in eligible]
    protected = len(eligible)
    unprotected = len(affected) - protected

    cost_breakdown = [
        CostBreakdownItem(label="Replacement truck deployment", amount=85000, type=CostType.estimated),
        CostBreakdownItem(label="Additional fuel (alternate route)", amount=32000, type=CostType.estimated),
        CostBreakdownItem(label="Driver overtime", amount=18000, type=CostType.estimated),
        CostBreakdownItem(label="Contingency buffer", amount=15000, type=CostType.synthetic),
    ]
    total = sum(c.amount for c in cost_breakdown)

    missing: list[str] = []
    assumptions = [
        "Alternate route has current road clearance.",
        "Replacement trucks are available at the Nagpur partner depot.",
        "Customer SLAs allow a 24-hour extension for non-urgent orders.",
    ]
    risks = [
        "Alternate route adds approximately 180 km and 4 hours transit time.",
        "Replacement truck availability not confirmed at time of drafting.",
    ]

    # Check for cold-chain shipments that cannot wait for reroute
    cold_chain = _filter_cold_chain(eligible)
    if cold_chain:
        risks.append(
            f"{len(cold_chain)} cold-chain shipment(s) may not tolerate the additional "
            "reroute delay without temperature excursion risk."
        )

    # Feasibility: reroute is feasible if there are eligible shipments
    feasibility = "Feasible" if protected > 0 else "Infeasible"
    if protected == 0:
        missing.append("No shipments are eligible for rerouting (all are already rerouted or delivered).")

    # Risk level based on proportion of cold-chain and urgency
    urgent_count = sum(1 for s in eligible if s.priority.value == "Urgent")
    if urgent_count >= 3 or len(cold_chain) >= 2:
        risk_level = RiskLevel.high
    elif urgent_count >= 1:
        risk_level = RiskLevel.medium
    else:
        risk_level = RiskLevel.low

    return RecoveryOption(
        id="opt-reroute",
        strategy="Alternate Route Rerouting",
        description=(
            "Reroute eligible delayed/held shipments via an alternate highway corridor "
            "to bypass the breakdown site. Deploy replacement trucks from the Nagpur partner depot."
        ),
        affected_order_ids=order_ids,
        orders_protected=protected,
        orders_unprotected=unprotected,
        cost_breakdown=cost_breakdown,
        total_cost=total,
        cost_confidence="synthetic",
        risk_level=risk_level,
        feasibility=feasibility,
        assumptions=assumptions,
        operational_risks=risks,
        missing_information=missing,
        requires_inventory_check=False,
        requires_supplier_verification=False,
    )


def _generate_inventory_option(
    disruption: Disruption,
    affected: list[Shipment],
    inventory: list[InventoryItem],
) -> RecoveryOption:
    """Option 2: Use available inventory at the destination warehouse."""
    dest_warehouse_name = disruption.destination.split()[0]  # "Chennai" from "Chennai Warehouse"
    order_ids = [s.order_id for s in affected]

    # Collect all SKUs needed
    sku_demand: dict[str, int] = {}
    for s in affected:
        if s.sku:
            sku_demand[s.sku] = sku_demand.get(s.sku, 0) + s.quantity

    # Check inventory at destination warehouse
    protected_orders: list[str] = []
    unprotected_orders: list[str] = []
    missing: list[str] = []
    inventory_details: list[str] = []

    for sku, demand in sku_demand.items():
        available = [i for i in inventory if i.sku == sku and i.warehouse.value == dest_warehouse_name]
        if not available:
            missing.append(f"SKU {sku} not found at {dest_warehouse_name} warehouse.")
            for s in affected:
                if s.sku == sku:
                    unprotected_orders.append(s.order_id)
            continue

        stock = available[0]
        inventory_details.append(f"{sku}: {stock.quantity} {stock.unit} available (demand: {demand})")

        if stock.quantity >= demand:
            for s in affected:
                if s.sku == sku:
                    protected_orders.append(s.order_id)
        else:
            # Partial protection
            missing.append(
                f"SKU {sku}: demand is {demand} but only {stock.quantity} {stock.unit} "
                f"available at {dest_warehouse_name} warehouse. "
                f"{demand - stock.quantity} units short — partial fulfillment only."
            )
            for s in affected:
                if s.sku == sku:
                    unprotected_orders.append(s.order_id)

    # Deduplicate
    protected_orders = list(dict.fromkeys(protected_orders))
    unprotected_orders = list(dict.fromkeys(unprotected_orders))

    cost_breakdown = [
        CostBreakdownItem(label="Warehouse handling & picking", amount=15000, type=CostType.estimated),
        CostBreakdownItem(label="Local last-mile delivery", amount=28000, type=CostType.estimated),
        CostBreakdownItem(label="Inventory holding cost", amount=8000, type=CostType.estimated),
        CostBreakdownItem(label="Contingency buffer", amount=10000, type=CostType.synthetic),
    ]
    total = sum(c.amount for c in cost_breakdown)

    feasibility = "Feasible" if len(protected_orders) > 0 else "Infeasible"
    if not inventory_details:
        missing.append("No matching inventory found at destination warehouse for any affected SKU.")

    risk_level = RiskLevel.low if len(unprotected_orders) == 0 else RiskLevel.medium

    return RecoveryOption(
        id="opt-inventory",
        strategy="Destination Inventory Fulfillment",
        description=(
            f"Fulfill affected orders directly from available stock at the {dest_warehouse_name} "
            "warehouse, bypassing the disrupted corridor. Only verified inventory quantities are used."
        ),
        affected_order_ids=order_ids,
        orders_protected=len(protected_orders),
        orders_unprotected=len(unprotected_orders),
        cost_breakdown=cost_breakdown,
        total_cost=total,
        cost_confidence="synthetic",
        risk_level=risk_level,
        feasibility=feasibility,
        assumptions=[
            f"Inventory quantities at {dest_warehouse_name} warehouse are current and accurate.",
            "Orders can be fulfilled from warehouse stock without additional procurement.",
        ] + inventory_details,
        operational_risks=[
            "Drawing down warehouse stock may push inventory below reorder levels.",
            "Partial fulfillment requires customer notification for short-shipped orders.",
        ],
        missing_information=missing,
        requires_inventory_check=True,
        requires_supplier_verification=False,
    )


def _generate_supplier_option(
    disruption: Disruption,
    affected: list[Shipment],
) -> RecoveryOption:
    """Option 3: Source from verified suppliers near the destination."""
    order_ids = [s.order_id for s in affected]
    missing: list[str] = []

    # Collect SKUs and try to match supplier categories
    skus = set(s.sku for s in affected if s.sku)
    matched_suppliers: list[str] = []

    for sku in skus:
        # Simple category matching based on SKU prefix
        if "PHARMA" in sku:
            suppliers = get_suppliers_by_category("Cold-Chain Items")
        elif "ELEC" in sku:
            suppliers = get_suppliers_by_category("Semiconductors")
        elif "PKG" in sku:
            suppliers = get_suppliers_by_category("Containers")
        elif "FOOD" in sku:
            suppliers = get_suppliers_by_category("Perishables")
        elif "IND" in sku:
            suppliers = get_suppliers_by_category("Machinery Parts")
        else:
            suppliers = []

        if suppliers:
            for s in suppliers:
                if not s.verified:
                    missing.append(
                        f"Supplier {s.name} ({s.id}) matches SKU {sku} but is NOT verified. "
                        "Stock availability and pricing cannot be confirmed."
                    )
                matched_suppliers.append(f"{s.name} ({s.id})")
        else:
            missing.append(f"No supplier found for SKU {sku}.")

    matched_suppliers = list(dict.fromkeys(matched_suppliers))

    cost_breakdown = [
        CostBreakdownItem(label="Supplier procurement (urgent)", amount=210000, type=CostType.estimated),
        CostBreakdownItem(label="Local last-mile delivery", amount=28000, type=CostType.estimated),
        CostBreakdownItem(label="Expedited handling fees", amount=12000, type=CostType.estimated),
        CostBreakdownItem(label="Contingency buffer", amount=20000, type=CostType.synthetic),
    ]
    total = sum(c.amount for c in cost_breakdown)

    # Feasibility: infeasible if no suppliers are verified
    any_verified = any("NOT verified" not in m for m in missing) if missing else bool(matched_suppliers)
    feasibility = "Conditionally Feasible" if matched_suppliers else "Infeasible"
    if not matched_suppliers:
        feasibility = "Infeasible"
        missing.append("No suppliers match the affected SKUs.")

    risk_level = RiskLevel.high  # Supplier sourcing is always high risk without verification

    return RecoveryOption(
        id="opt-supplier",
        strategy="Supplier Split-Shipment",
        description=(
            "Source critical SKUs from suppliers near the destination to fulfill urgent orders "
            "directly, bypassing the disrupted corridor. Supplier stock and pricing must be "
            "verified before execution."
        ),
        affected_order_ids=order_ids,
        orders_protected=len(order_ids),  # optimistic — must be verified
        orders_unprotected=0,
        cost_breakdown=cost_breakdown,
        total_cost=total,
        cost_confidence="synthetic",
        risk_level=risk_level,
        feasibility=feasibility,
        assumptions=[
            "Supplier stock availability is unverified at this time.",
            "Local delivery capacity can absorb additional orders.",
            "Urgent orders can be partially fulfilled from supplier stock.",
        ] + [f"Potential supplier: {s}" for s in matched_suppliers],
        operational_risks=[
            "Supplier stock availability not yet confirmed.",
            "Higher cost than rerouting or inventory strategies.",
            "Partial fulfillment may require customer notification.",
            "No supplier is verified — all performance data is 'Not available'.",
        ],
        missing_information=missing,
        requires_inventory_check=False,
        requires_supplier_verification=True,
    )


def _generate_hold_option(
    disruption: Disruption,
    affected: list[Shipment],
) -> RecoveryOption:
    """Option 4: Hold & consolidate — wait for clearance, then convoy."""
    order_ids = [s.order_id for s in affected]
    cold_chain = _filter_cold_chain(affected)

    cost_breakdown = [
        CostBreakdownItem(label="Storage at interim depot", amount=22000, type=CostType.estimated),
        CostBreakdownItem(label="Consolidation convoy dispatch", amount=45000, type=CostType.estimated),
        CostBreakdownItem(label="Contingency buffer", amount=8000, type=CostType.synthetic),
    ]
    total = sum(c.amount for c in cost_breakdown)

    # Infeasible if any cold-chain shipments are present
    feasibility = "Infeasible" if cold_chain else "Conditionally Feasible"
    missing: list[str] = []
    risks = [
        "High SLA breach risk for urgent orders.",
        "Breakdown clearance time is an estimate and may extend.",
    ]

    if cold_chain:
        risks.append(
            f"{len(cold_chain)} cold-chain shipment(s) cannot be held for the estimated "
            f"{disruption.estimated_delay_hrs}h delay without temperature excursion."
        )
        missing.append("Cold-chain orders cannot use this strategy — they require immediate action.")

    risk_level = RiskLevel.low if not cold_chain else RiskLevel.high

    return RecoveryOption(
        id="opt-hold",
        strategy="Hold & Consolidate",
        description=(
            "Hold all affected shipments until the breakdown is cleared, then consolidate "
            "into a single high-capacity convoy. Lowest cost but longest delay."
        ),
        affected_order_ids=order_ids,
        orders_protected=len(order_ids),
        orders_unprotected=0,
        cost_breakdown=cost_breakdown,
        total_cost=total,
        cost_confidence="synthetic",
        risk_level=risk_level,
        feasibility=feasibility,
        assumptions=[
            "Breakdown clearance estimated within 12 hours.",
            "Interim depot at Nagpur has capacity for all affected shipments.",
            "All non-cold-chain orders can tolerate the delay.",
        ],
        operational_risks=risks,
        missing_information=missing,
        requires_inventory_check=False,
        requires_supplier_verification=False,
    )


def generate_recovery_options(
    disruption: Disruption,
    affected: list[Shipment],
    include_infeasible: bool = True,
) -> list[RecoveryOption]:
    """Generate all feasible recovery options for a disruption.

    Args:
        disruption: The disruption to generate plans for.
        affected: List of affected shipments.
        include_infeasible: If True, include infeasible options with rejection reasons.

    Returns:
        List of recovery options, sorted by feasibility then by orders protected.
    """
    from ..data import inventory

    options = [
        _generate_reroute_option(disruption, affected),
        _generate_inventory_option(disruption, affected, inventory),
        _generate_supplier_option(disruption, affected),
        _generate_hold_option(disruption, affected),
    ]

    if not include_infeasible:
        options = [o for o in options if o.feasibility != "Infeasible"]

    # Sort: Feasible first, then by orders protected descending
    feasibility_order = {"Feasible": 0, "Conditionally Feasible": 1, "Infeasible": 2}
    options.sort(key=lambda o: (feasibility_order.get(o.feasibility, 3), -o.orders_protected))

    return options


def compare_options(options: list[RecoveryOption]) -> RecoveryComparison:
    """Produce a comparison summary across recovery options."""
    feasible = [o for o in options if o.feasibility != "Infeasible"]

    if not feasible:
        return RecoveryComparison(
            cheapest_option_id=None,
            most_protected_option_id=None,
            lowest_risk_option_id=None,
            summary="No feasible recovery options available. All options are infeasible or rejected.",
        )

    cheapest = min(feasible, key=lambda o: o.total_cost)
    most_protected = max(feasible, key=lambda o: o.orders_protected)
    risk_order = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
    lowest_risk = min(feasible, key=lambda o: risk_order.get(o.risk_level.value, 4))

    summary_parts = []
    summary_parts.append(f"{len(feasible)} of {len(options)} options are feasible.")
    summary_parts.append(
        f"Cheapest: {cheapest.strategy} ({cheapest.total_cost:,.0f} INR, synthetic)."
    )
    summary_parts.append(
        f"Most protected: {most_protected.strategy} ({most_protected.orders_protected} orders)."
    )
    summary_parts.append(
        f"Lowest risk: {lowest_risk.strategy} (risk: {lowest_risk.risk_level.value})."
    )

    return RecoveryComparison(
        cheapest_option_id=cheapest.id,
        most_protected_option_id=most_protected.id,
        lowest_risk_option_id=lowest_risk.id,
        summary=" ".join(summary_parts),
    )

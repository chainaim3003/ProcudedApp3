//! DvP check and 3-way matching logic

use soroban_sdk::Env;

use crate::errors::ContractError;
use crate::storage::DataKey;
use crate::types::{CustomerInvoice, PurchaseOrder, WarehouseReceipt, FULFILLED};

/// DvP check function - wrapper that calls three_way_match
pub fn dvp_check(env: &Env, trade_id: u64) -> Result<(), ContractError> {
    // Get trade state
    let trade = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify trade is in FULFILLED state
    let trade: crate::types::TradeEscrow = trade;
    if trade.state != FULFILLED {
        return Err(ContractError::TradeNotFulfilled);
    }

    // Check all documents exist
    if !env
        .storage()
        .instance()
        .has(&DataKey::PurchaseOrder(trade_id))
    {
        return Err(ContractError::PurchaseOrderNotFound);
    }

    if !env
        .storage()
        .instance()
        .has(&DataKey::CustomerInvoice(trade_id))
    {
        return Err(ContractError::CustomerInvoiceNotFound);
    }

    if !env
        .storage()
        .instance()
        .has(&DataKey::WarehouseReceipt(trade_id))
    {
        return Err(ContractError::WarehouseReceiptNotFound);
    }

    // Call three-way match
    three_way_match(env, trade_id)?;

    Ok(())
}

/// Three-way matching with variance logic
pub fn three_way_match(env: &Env, trade_id: u64) -> Result<(), ContractError> {
    // Get all three documents
    let po: PurchaseOrder = env
        .storage()
        .instance()
        .get(&DataKey::PurchaseOrder(trade_id))
        .ok_or(ContractError::PurchaseOrderNotFound)?;

    let ci: CustomerInvoice = env
        .storage()
        .instance()
        .get(&DataKey::CustomerInvoice(trade_id))
        .ok_or(ContractError::CustomerInvoiceNotFound)?;

    let wr: WarehouseReceipt = env
        .storage()
        .instance()
        .get(&DataKey::WarehouseReceipt(trade_id))
        .ok_or(ContractError::WarehouseReceiptNotFound)?;

    // ===== MATCH 1: DESCRIPTION (EXACT MATCH) =====
    if po.po_description != ci.ci_description {
        return Err(ContractError::DescriptionMismatch);
    }
    if po.po_description != wr.wr_description {
        return Err(ContractError::DescriptionMismatch);
    }
    if ci.ci_description != wr.wr_description {
        return Err(ContractError::DescriptionMismatch);
    }

    // ===== MATCH 2: QUANTITY (≤5% VARIANCE) =====
    check_quantity_variance(po.quantity, ci.quantity)?;
    check_quantity_variance(po.quantity, wr.quantity)?;
    check_quantity_variance(ci.quantity, wr.quantity)?;

    // ===== MATCH 3: TOTAL PRICE (≤2% VARIANCE) =====
    check_price_variance(po.total_price, ci.total_price)?;
    check_price_variance(po.total_price, wr.total_price)?;
    check_price_variance(ci.total_price, wr.total_price)?;

    Ok(())
}

/// Check if quantity variance is within 5% tolerance
fn check_quantity_variance(val1: u64, val2: u64) -> Result<(), ContractError> {
    if val1 == 0 {
        return Err(ContractError::DivisionByZero);
    }

    let diff = if val1 > val2 {
        val1 - val2
    } else {
        val2 - val1
    };

    // Calculate variance percentage: (diff / val1) * 100
    // To avoid floating point, we use: (diff * 100) / val1
    let variance_percent = (diff as u128)
        .checked_mul(100)
        .ok_or(ContractError::OverflowError)?
        / (val1 as u128);

    if variance_percent > 5 {
        return Err(ContractError::QuantityVarianceTooHigh);
    }

    Ok(())
}

/// Check if price variance is within 2% tolerance
fn check_price_variance(val1: i128, val2: i128) -> Result<(), ContractError> {
    if val1 == 0 {
        return Err(ContractError::DivisionByZero);
    }

    // Get absolute difference
    let diff = if val1 > val2 {
        val1 - val2
    } else {
        val2 - val1
    };

    // Calculate variance percentage: (diff / val1) * 100
    // Convert to u128 for calculation
    let abs_val1 = val1.abs() as u128;
    let abs_diff = diff.abs() as u128;

    let variance_percent = abs_diff
        .checked_mul(100)
        .ok_or(ContractError::OverflowError)?
        / abs_val1;

    if variance_percent > 2 {
        return Err(ContractError::PriceVarianceTooHigh);
    }

    Ok(())
}

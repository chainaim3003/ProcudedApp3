//! Trade lifecycle management functions

use soroban_sdk::{Address, Env, String, Vec};

use crate::errors::ContractError;
use crate::registry::{get_buyer_info, get_seller_info, is_buyer_active, is_seller_active};
use crate::storage::DataKey;
use crate::types::{
    CustomerInvoice, PurchaseOrder, TradeEscrow, VLEIDocuments, WarehouseReceipt, CANCELLED,
    FULFILLED, ORDERED, REJECTED, SETTLED,
};

/// Create a new trade with purchase order
pub fn create_trade(
    env: &Env,
    buyer: &Address,
    seller: &Address,
    po_description: String,
    quantity: u64,
    unit_price: i128,
    total_price: i128,
    po_json_ipfs_hash: String,
    buyer_lei_ipfs: String,
    seller_lei_ipfs: String,
) -> Result<u64, ContractError> {
    // Verify buyer and seller are different
    if buyer == seller {
        return Err(ContractError::BuyerCannotBeSeller);
    }

    // Verify buyer is registered and active
    is_buyer_active(env, buyer)?;

    // Verify seller is registered and active
    is_seller_active(env, seller)?;

    // Validate amount
    if total_price <= 0 {
        return Err(ContractError::InvalidAmount);
    }

    // Get LEI IDs from registry
    let buyer_info = get_buyer_info(env, buyer)?;
    let seller_info = get_seller_info(env, seller)?;

    // Get next trade ID
    let trade_id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextTradeId)
        .unwrap_or(1);

    // Create trade escrow
    let trade = TradeEscrow {
        trade_id,
        buyer: buyer.clone(),
        seller: seller.clone(),
        amount: total_price,
        state: ORDERED,
        created_at: env.ledger().timestamp(),
        fulfilled_at: 0,
        settled_at: 0,
        marketplace_fee: 0,
        escrow_balance: 0,
    };

    // Create purchase order
    let po = PurchaseOrder {
        po_description,
        quantity,
        unit_price,
        total_price,
        po_json_ipfs_hash,
        created_by: buyer.clone(),
        created_at: env.ledger().timestamp(),
    };

    // Create vLEI documents
    let vlei_docs = VLEIDocuments {
        buyer_lei: buyer_info.lei_id,
        buyer_lei_ipfs,
        buyer_validated: false,
        seller_lei: seller_info.lei_id,
        seller_lei_ipfs,
        seller_validated: false,
        validation_timestamp: env.ledger().timestamp(),
    };

    // Store trade
    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    // Store purchase order
    env.storage()
        .instance()
        .set(&DataKey::PurchaseOrder(trade_id), &po);

    // Store vLEI documents
    env.storage()
        .instance()
        .set(&DataKey::VLEIDocuments(trade_id), &vlei_docs);

    // Add to buyer trades
    add_to_buyer_trades(env, buyer, trade_id);

    // Add to seller trades
    add_to_seller_trades(env, seller, trade_id);

    // Increment trade ID
    env.storage()
        .instance()
        .set(&DataKey::NextTradeId, &(trade_id + 1));

    Ok(trade_id)
}

/// Fund escrow (buyer adds amount + marketplace fee)
pub fn fund_escrow(
    env: &Env,
    buyer: &Address,
    trade_id: u64,
    payment_amount: i128,
    marketplace_fee_rate: u32,
) -> Result<(), ContractError> {
    let mut trade: TradeEscrow = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify caller is buyer
    if &trade.buyer != buyer {
        return Err(ContractError::NotBuyer);
    }

    // Verify trade is in ORDERED state
    if trade.state != ORDERED {
        return Err(ContractError::InvalidTradeState);
    }

    // Verify not already funded
    if trade.escrow_balance > 0 {
        return Err(ContractError::EscrowAlreadyFunded);
    }

    // Calculate marketplace fee
    let marketplace_fee = (trade.amount as i128)
        .checked_mul(marketplace_fee_rate as i128)
        .ok_or(ContractError::OverflowError)?
        / 10000;

    let total_required = trade
        .amount
        .checked_add(marketplace_fee)
        .ok_or(ContractError::OverflowError)?;

    // Verify payment amount is sufficient
    if payment_amount < total_required {
        return Err(ContractError::InsufficientEscrowFunding);
    }

    // Update trade
    trade.escrow_balance = payment_amount;
    trade.marketplace_fee = marketplace_fee;

    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    Ok(())
}

/// Fulfill order by seller (add CI and WR)
pub fn fulfill_order(
    env: &Env,
    seller: &Address,
    trade_id: u64,
    ci_description: String,
    ci_quantity: u64,
    ci_unit_price: i128,
    ci_total_price: i128,
    ci_json_ipfs_hash: String,
    wr_description: String,
    wr_quantity: u64,
    wr_unit_price: i128,
) -> Result<(), ContractError> {
    let mut trade: TradeEscrow = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify caller is seller
    if &trade.seller != seller {
        return Err(ContractError::NotSeller);
    }

    // Verify trade is in ORDERED state
    if trade.state != ORDERED {
        return Err(ContractError::InvalidTradeState);
    }

    // Verify escrow is funded
    if trade.escrow_balance == 0 {
        return Err(ContractError::EscrowNotFunded);
    }

    // Verify buyer vLEI is validated
    let vlei_docs: VLEIDocuments = env
        .storage()
        .instance()
        .get(&DataKey::VLEIDocuments(trade_id))
        .ok_or(ContractError::VLEIDocumentsNotFound)?;

    if !vlei_docs.buyer_validated {
        return Err(ContractError::BuyerVLEINotValidated);
    }

    // Create customer invoice
    let ci = CustomerInvoice {
        ci_description,
        quantity: ci_quantity,
        unit_price: ci_unit_price,
        total_price: ci_total_price,
        ci_json_ipfs_hash,
        created_by: seller.clone(),
        created_at: env.ledger().timestamp(),
    };

    // Create warehouse receipt
    let wr = WarehouseReceipt {
        wr_description,
        quantity: wr_quantity,
        unit_price: wr_unit_price,
        total_price: ci_total_price, // Use CI total price since we removed wr_total_price
        wr_json_ipfs_hash: String::from_str(env, ""), // Empty IPFS hash since we removed it
        warehouse_location: String::from_str(env, ""), // Empty location since we removed it
        created_by: seller.clone(),
        created_at: env.ledger().timestamp(),
    };

    // Store documents
    env.storage()
        .instance()
        .set(&DataKey::CustomerInvoice(trade_id), &ci);
    env.storage()
        .instance()
        .set(&DataKey::WarehouseReceipt(trade_id), &wr);

    // Update trade state
    trade.state = FULFILLED;
    trade.fulfilled_at = env.ledger().timestamp();

    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    Ok(())
}

/// Reject order by seller
pub fn reject_order(
    env: &Env,
    seller: &Address,
    trade_id: u64,
) -> Result<(), ContractError> {
    let mut trade: TradeEscrow = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify caller is seller
    if &trade.seller != seller {
        return Err(ContractError::NotSeller);
    }

    // Verify trade is in ORDERED state
    if trade.state != ORDERED {
        return Err(ContractError::InvalidTradeState);
    }

    // Update trade state
    trade.state = REJECTED;

    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    // Note: Actual refund would happen via payment transaction
    // This just updates the state

    Ok(())
}

/// Cancel trade by buyer (before fulfillment)
pub fn cancel_trade(
    env: &Env,
    buyer: &Address,
    trade_id: u64,
) -> Result<(), ContractError> {
    let mut trade: TradeEscrow = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify caller is buyer
    if &trade.buyer != buyer {
        return Err(ContractError::NotBuyer);
    }

    // Verify trade is in ORDERED state
    if trade.state != ORDERED {
        return Err(ContractError::InvalidTradeState);
    }

    // Update trade state
    trade.state = CANCELLED;

    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    // Note: Actual refund would happen via payment transaction

    Ok(())
}

/// Accept trade and settle (buyer triggers DvP)
pub fn accept_trade(
    env: &Env,
    buyer: &Address,
    trade_id: u64,
    platform_treasury: &Address,
) -> Result<(), ContractError> {
    let mut trade: TradeEscrow = env
        .storage()
        .instance()
        .get(&DataKey::Trade(trade_id))
        .ok_or(ContractError::TradeNotFound)?;

    // Verify caller is buyer
    if &trade.buyer != buyer {
        return Err(ContractError::NotBuyer);
    }

    // Verify trade is in FULFILLED state
    if trade.state != FULFILLED {
        return Err(ContractError::TradeNotFulfilled);
    }

    // Call DvP check (which calls three_way_match internally)
    crate::matching::dvp_check(env, trade_id)?;

    // If we reach here, DvP check passed
    // Update trade state
    trade.state = SETTLED;
    trade.settled_at = env.ledger().timestamp();

    env.storage()
        .instance()
        .set(&DataKey::Trade(trade_id), &trade);

    // Note: Actual payment transfers would happen via separate payment transactions
    // The contract just validates and updates state
    // In a full implementation, this would trigger internal transfers to:
    // - seller (trade.amount)
    // - platform_treasury (trade.marketplace_fee)

    Ok(())
}

/// Validate buyer vLEI
pub fn validate_buyer_vlei(
    env: &Env,
    trade_id: u64,
) -> Result<(), ContractError> {
    let mut vlei_docs: VLEIDocuments = env
        .storage()
        .instance()
        .get(&DataKey::VLEIDocuments(trade_id))
        .ok_or(ContractError::VLEIDocumentsNotFound)?;

    // In production, this would call GLEIF API or oracle
    // For now, we just mark as validated
    vlei_docs.buyer_validated = true;
    vlei_docs.validation_timestamp = env.ledger().timestamp();

    env.storage()
        .instance()
        .set(&DataKey::VLEIDocuments(trade_id), &vlei_docs);

    Ok(())
}

/// Validate seller vLEI
pub fn validate_seller_vlei(
    env: &Env,
    trade_id: u64,
) -> Result<(), ContractError> {
    let mut vlei_docs: VLEIDocuments = env
        .storage()
        .instance()
        .get(&DataKey::VLEIDocuments(trade_id))
        .ok_or(ContractError::VLEIDocumentsNotFound)?;

    // In production, this would call GLEIF API or oracle
    // For now, we just mark as validated
    vlei_docs.seller_validated = true;
    vlei_docs.validation_timestamp = env.ledger().timestamp();

    env.storage()
        .instance()
        .set(&DataKey::VLEIDocuments(trade_id), &vlei_docs);

    Ok(())
}

/// Helper: Add trade to buyer's trade list
fn add_to_buyer_trades(env: &Env, buyer: &Address, trade_id: u64) {
    let mut trades: Vec<u64> = env
        .storage()
        .instance()
        .get(&DataKey::BuyerTrades(buyer.clone()))
        .unwrap_or(Vec::new(env));

    trades.push_back(trade_id);

    env.storage()
        .instance()
        .set(&DataKey::BuyerTrades(buyer.clone()), &trades);
}

/// Helper: Add trade to seller's trade list
fn add_to_seller_trades(env: &Env, seller: &Address, trade_id: u64) {
    let mut trades: Vec<u64> = env
        .storage()
        .instance()
        .get(&DataKey::SellerTrades(seller.clone()))
        .unwrap_or(Vec::new(env));

    trades.push_back(trade_id);

    env.storage()
        .instance()
        .set(&DataKey::SellerTrades(seller.clone()), &trades);
}

//! MarketplaceEscrowV1 Contract Implementation

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, String, Vec};

use crate::errors::ContractError;
use crate::registry;
use crate::storage::DataKey;
use crate::trade;
use crate::types::{
    BuyerInfo, CustomerInvoice, PurchaseOrder, SellerInfo, TradeEscrow, VLEIDocuments,
    WarehouseReceipt,
};

#[contract]
pub struct MarketplaceEscrowV1;

#[contractimpl]
impl MarketplaceEscrowV1 {
    /// Constructor - Initialize the marketplace
    pub fn __constructor(
        env: &Env,
        platform_treasury: Address,
        marketplace_fee_rate: u32,
    ) -> Result<(), ContractError> {
        // Validate fee rate (max 10%)
        if marketplace_fee_rate > 1000 {
            return Err(ContractError::InvalidFeeRate);
        }

        // Set contract owner
        let owner = env.current_contract_address();
        env.storage().instance().set(&DataKey::ContractOwner, &owner);

        // Set platform treasury
        env.storage()
            .instance()
            .set(&DataKey::PlatformTreasury, &platform_treasury);

        // Set marketplace fee rate
        env.storage()
            .instance()
            .set(&DataKey::MarketplaceFeeRate, &marketplace_fee_rate);

        // Initialize next trade ID
        env.storage().instance().set(&DataKey::NextTradeId, &1u64);

        Ok(())
    }

    // ========== REGISTRY FUNCTIONS ==========

    /// Register a new buyer
    pub fn register_buyer(
        env: Env,
        buyer_address: Address,
        buyer_name: String,
        buyer_lei_id: String,
    ) -> Result<(), ContractError> {
        // Require owner authorization
        Self::require_owner(&env)?;

        registry::register_buyer(&env, buyer_address, buyer_name, buyer_lei_id)
    }

    /// Register a new seller
    pub fn register_seller(
        env: Env,
        seller_address: Address,
        seller_name: String,
        seller_lei_id: String,
    ) -> Result<(), ContractError> {
        // Require owner authorization
        Self::require_owner(&env)?;

        registry::register_seller(&env, seller_address, seller_name, seller_lei_id)
    }

    /// Deactivate a buyer
    pub fn deactivate_buyer(env: Env, buyer_address: Address) -> Result<(), ContractError> {
        // Require owner authorization
        Self::require_owner(&env)?;

        registry::deactivate_buyer(&env, &buyer_address)
    }

    /// Deactivate a seller
    pub fn deactivate_seller(env: Env, seller_address: Address) -> Result<(), ContractError> {
        // Require owner authorization
        Self::require_owner(&env)?;

        registry::deactivate_seller(&env, &seller_address)
    }

    /// Get buyer information
    pub fn get_buyer_info(env: Env, buyer_address: Address) -> Result<BuyerInfo, ContractError> {
        registry::get_buyer_info(&env, &buyer_address)
    }

    /// Get seller information
    pub fn get_seller_info(
        env: Env,
        seller_address: Address,
    ) -> Result<SellerInfo, ContractError> {
        registry::get_seller_info(&env, &seller_address)
    }

    /// Get all registered buyers
    pub fn get_all_buyers(env: Env) -> Vec<BuyerInfo> {
        registry::get_all_buyers(&env)
    }

    /// Get all registered sellers
    pub fn get_all_sellers(env: Env) -> Vec<SellerInfo> {
        registry::get_all_sellers(&env)
    }

    // ========== TRADE LIFECYCLE FUNCTIONS ==========

    /// Create a new trade with purchase order
    pub fn create_trade(
        env: Env,
        buyer: Address,
        seller: Address,
        po_description: String,
        quantity: u64,
        unit_price: i128,
        total_price: i128,
        po_json_ipfs_hash: String,
        buyer_lei_ipfs: String,
        seller_lei_ipfs: String,
    ) -> Result<u64, ContractError> {
        buyer.require_auth();

        trade::create_trade(
            &env,
            &buyer,
            &seller,
            po_description,
            quantity,
            unit_price,
            total_price,
            po_json_ipfs_hash,
            buyer_lei_ipfs,
            seller_lei_ipfs,
        )
    }

    /// Fund escrow (buyer adds payment)
    pub fn fund_escrow(env: Env, buyer: Address, trade_id: u64, payment_amount: i128) -> Result<(), ContractError> {
        buyer.require_auth();

        let marketplace_fee_rate: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MarketplaceFeeRate)
            .unwrap_or(25);

        trade::fund_escrow(&env, &buyer, trade_id, payment_amount, marketplace_fee_rate)
    }

    /// Validate buyer vLEI
    pub fn validate_buyer_vlei(env: Env, trade_id: u64) -> Result<(), ContractError> {
        // In production, this would require seller authorization
        trade::validate_buyer_vlei(&env, trade_id)
    }

    /// Validate seller vLEI
    pub fn validate_seller_vlei(env: Env, trade_id: u64) -> Result<(), ContractError> {
        // In production, this would require buyer authorization
        trade::validate_seller_vlei(&env, trade_id)
    }

    /// Fulfill order (seller ships goods)
    pub fn fulfill_order(
        env: Env,
        seller: Address,
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
        seller.require_auth();

        trade::fulfill_order(
            &env,
            &seller,
            trade_id,
            ci_description,
            ci_quantity,
            ci_unit_price,
            ci_total_price,
            ci_json_ipfs_hash,
            wr_description,
            wr_quantity,
            wr_unit_price,
        )
    }

    /// Reject order (seller rejects)
    pub fn reject_order(env: Env, seller: Address, trade_id: u64) -> Result<(), ContractError> {
        seller.require_auth();

        trade::reject_order(&env, &seller, trade_id)
    }

    /// Cancel trade (buyer cancels before fulfillment)
    pub fn cancel_trade(env: Env, buyer: Address, trade_id: u64) -> Result<(), ContractError> {
        buyer.require_auth();

        trade::cancel_trade(&env, &buyer, trade_id)
    }

    /// Accept trade (buyer triggers DvP and settlement)
    pub fn accept_trade(env: Env, buyer: Address, trade_id: u64) -> Result<(), ContractError> {
        buyer.require_auth();

        let platform_treasury: Address = env
            .storage()
            .instance()
            .get(&DataKey::PlatformTreasury)
            .ok_or(ContractError::Unauthorized)?;

        trade::accept_trade(&env, &buyer, trade_id, &platform_treasury)
    }

    // ========== QUERY FUNCTIONS ==========

    /// Get trade details
    pub fn get_trade(env: Env, trade_id: u64) -> Result<TradeEscrow, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Trade(trade_id))
            .ok_or(ContractError::TradeNotFound)
    }

    /// Get purchase order
    pub fn get_purchase_order(env: Env, trade_id: u64) -> Result<PurchaseOrder, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::PurchaseOrder(trade_id))
            .ok_or(ContractError::PurchaseOrderNotFound)
    }

    /// Get customer invoice
    pub fn get_customer_invoice(
        env: Env,
        trade_id: u64,
    ) -> Result<CustomerInvoice, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::CustomerInvoice(trade_id))
            .ok_or(ContractError::CustomerInvoiceNotFound)
    }

    /// Get warehouse receipt
    pub fn get_warehouse_receipt(
        env: Env,
        trade_id: u64,
    ) -> Result<WarehouseReceipt, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::WarehouseReceipt(trade_id))
            .ok_or(ContractError::WarehouseReceiptNotFound)
    }

    /// Get vLEI documents
    pub fn get_vlei_documents(env: Env, trade_id: u64) -> Result<VLEIDocuments, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::VLEIDocuments(trade_id))
            .ok_or(ContractError::VLEIDocumentsNotFound)
    }

    /// Get trades by buyer
    pub fn get_trades_by_buyer(env: Env, buyer: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::BuyerTrades(buyer))
            .unwrap_or(Vec::new(&env))
    }

    /// Get trades by seller
    pub fn get_trades_by_seller(env: Env, seller: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::SellerTrades(seller))
            .unwrap_or(Vec::new(&env))
    }

    /// Calculate escrow cost (amount + marketplace fee)
    pub fn calculate_escrow_cost(env: Env, amount: i128) -> Result<(i128, i128), ContractError> {
        let marketplace_fee_rate: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MarketplaceFeeRate)
            .unwrap_or(25);

        let fee = amount
            .checked_mul(marketplace_fee_rate as i128)
            .ok_or(ContractError::OverflowError)?
            / 10000;

        let total = amount.checked_add(fee).ok_or(ContractError::OverflowError)?;

        Ok((total, fee))
    }

    /// Upgrade contract (admin only)
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), ContractError> {
        Self::require_owner(&env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }

    // ========== INTERNAL HELPER FUNCTIONS ==========

    /// Require contract owner authorization
    fn require_owner(env: &Env) -> Result<(), ContractError> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::ContractOwner)
            .ok_or(ContractError::NotContractOwner)?;
        
        owner.require_auth();
        Ok(())
    }
}

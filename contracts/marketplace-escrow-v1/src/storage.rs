//! Storage keys for the MarketplaceEscrowV1 contract

use soroban_sdk::{contracttype, symbol_short, Address, String, Symbol};

/// Storage keys for global state and data maps
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // Global state
    NextTradeId,
    PlatformTreasury,
    MarketplaceFeeRate,
    ContractOwner,
    
    // Buyer/Seller Registry
    RegisteredBuyer(Address),
    RegisteredSeller(Address),
    BuyerByName(String),
    SellerByName(String),
    AllBuyers,
    AllSellers,
    
    // Trade data
    Trade(u64),
    PurchaseOrder(u64),
    CustomerInvoice(u64),
    WarehouseReceipt(u64),
    VLEIDocuments(u64),
    
    // Trade indices
    BuyerTrades(Address),
    SellerTrades(Address),
}

/// Symbols for quick access
pub const NEXT_TRADE_ID: Symbol = symbol_short!("NEXT_ID");
pub const OWNER: Symbol = symbol_short!("OWNER");

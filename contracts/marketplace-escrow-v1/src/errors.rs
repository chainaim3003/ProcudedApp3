//! Error types for the MarketplaceEscrowV1 contract

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    // Registry errors (1-19)
    BuyerNotRegistered = 1,
    SellerNotRegistered = 2,
    BuyerAlreadyRegistered = 3,
    SellerAlreadyRegistered = 4,
    BuyerInactive = 5,
    SellerInactive = 6,
    BuyerNameTaken = 7,
    SellerNameTaken = 8,
    
    // Authorization errors (20-39)
    Unauthorized = 20,
    NotContractOwner = 21,
    NotBuyer = 22,
    NotSeller = 23,
    
    // Trade state errors (40-59)
    InvalidTradeState = 40,
    TradeNotFound = 41,
    TradeAlreadyExists = 42,
    TradeNotOrdered = 43,
    TradeNotFulfilled = 44,
    BuyerCannotBeSeller = 45,
    
    // Escrow errors (60-79)
    InsufficientEscrowFunding = 60,
    EscrowNotFunded = 61,
    EscrowAlreadyFunded = 62,
    
    // Document errors (80-99)
    PurchaseOrderNotFound = 80,
    CustomerInvoiceNotFound = 81,
    WarehouseReceiptNotFound = 82,
    VLEIDocumentsNotFound = 83,
    BuyerVLEINotValidated = 84,
    SellerVLEINotValidated = 85,
    
    // Matching errors (100-119)
    DescriptionMismatch = 100,
    QuantityVarianceTooHigh = 101,
    PriceVarianceTooHigh = 102,
    ThreeWayMatchFailed = 103,
    
    // General errors (120-139)
    InvalidAmount = 120,
    InvalidFeeRate = 121,
    OverflowError = 122,
    DivisionByZero = 123,
}

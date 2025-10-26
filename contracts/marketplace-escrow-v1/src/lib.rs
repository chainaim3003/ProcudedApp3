#![no_std]

//! # MarketplaceEscrowV1 Contract
//!
//! A comprehensive marketplace escrow smart contract for Stellar blockchain
//! featuring buyer/seller registry, 3-way document matching, and DvP settlement.
//!
//! ## Features
//! - Buyer and seller registration with LEI IDs
//! - Trade lifecycle management (Ordered → Fulfilled → Settled)
//! - Purchase Order, Customer Invoice, and Warehouse Receipt with IPFS storage
//! - 3-way matching with variance tolerance (5% quantity, 2% price)
//! - Delivery vs Payment (DvP) automated settlement
//! - GLEIF/vLEI validation support
//!
//! ## Trade States
//! - ORDERED (0): Buyer created PO and funded escrow
//! - FULFILLED (1): Seller shipped goods and submitted CI + WR
//! - SETTLED (2): 3-way match passed, payment released
//! - REJECTED (3): Seller rejected the order
//! - CANCELLED (4): Buyer cancelled before fulfillment

mod contract;
mod errors;
mod matching;
mod registry;
mod storage;
mod trade;
mod types;

pub use contract::MarketplaceEscrowV1;
pub use errors::ContractError;
pub use types::*;

#[cfg(test)]
mod test;

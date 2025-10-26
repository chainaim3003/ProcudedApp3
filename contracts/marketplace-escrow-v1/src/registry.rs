//! Buyer and Seller registry functions

use soroban_sdk::{Address, Env, String, Vec};

use crate::errors::ContractError;
use crate::storage::DataKey;
use crate::types::{BuyerInfo, SellerInfo};

/// Register a new buyer
pub fn register_buyer(
    env: &Env,
    buyer_address: Address,
    buyer_name: String,
    buyer_lei_id: String,
) -> Result<(), ContractError> {
    // Check if buyer already registered
    if env
        .storage()
        .instance()
        .has(&DataKey::RegisteredBuyer(buyer_address.clone()))
    {
        return Err(ContractError::BuyerAlreadyRegistered);
    }

    // Check if name already taken
    if env
        .storage()
        .instance()
        .has(&DataKey::BuyerByName(buyer_name.clone()))
    {
        return Err(ContractError::BuyerNameTaken);
    }

    let buyer_info = BuyerInfo {
        name: buyer_name.clone(),
        lei_id: buyer_lei_id,
        wallet_address: buyer_address.clone(),
        registered_at: env.ledger().timestamp(),
        is_active: true,
    };

    // Store buyer info
    env.storage()
        .instance()
        .set(&DataKey::RegisteredBuyer(buyer_address.clone()), &buyer_info);

    // Store name mapping
    env.storage()
        .instance()
        .set(&DataKey::BuyerByName(buyer_name), &buyer_address);

    // Add to all buyers list
    let mut all_buyers: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::AllBuyers)
        .unwrap_or(Vec::new(env));
    all_buyers.push_back(buyer_address);
    env.storage()
        .instance()
        .set(&DataKey::AllBuyers, &all_buyers);

    Ok(())
}

/// Register a new seller
pub fn register_seller(
    env: &Env,
    seller_address: Address,
    seller_name: String,
    seller_lei_id: String,
) -> Result<(), ContractError> {
    // Check if seller already registered
    if env
        .storage()
        .instance()
        .has(&DataKey::RegisteredSeller(seller_address.clone()))
    {
        return Err(ContractError::SellerAlreadyRegistered);
    }

    // Check if name already taken
    if env
        .storage()
        .instance()
        .has(&DataKey::SellerByName(seller_name.clone()))
    {
        return Err(ContractError::SellerNameTaken);
    }

    let seller_info = SellerInfo {
        name: seller_name.clone(),
        lei_id: seller_lei_id,
        wallet_address: seller_address.clone(),
        registered_at: env.ledger().timestamp(),
        is_active: true,
    };

    // Store seller info
    env.storage()
        .instance()
        .set(&DataKey::RegisteredSeller(seller_address.clone()), &seller_info);

    // Store name mapping
    env.storage()
        .instance()
        .set(&DataKey::SellerByName(seller_name), &seller_address);

    // Add to all sellers list
    let mut all_sellers: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::AllSellers)
        .unwrap_or(Vec::new(env));
    all_sellers.push_back(seller_address);
    env.storage()
        .instance()
        .set(&DataKey::AllSellers, &all_sellers);

    Ok(())
}

/// Get buyer info
pub fn get_buyer_info(env: &Env, buyer_address: &Address) -> Result<BuyerInfo, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::RegisteredBuyer(buyer_address.clone()))
        .ok_or(ContractError::BuyerNotRegistered)
}

/// Get seller info
pub fn get_seller_info(env: &Env, seller_address: &Address) -> Result<SellerInfo, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::RegisteredSeller(seller_address.clone()))
        .ok_or(ContractError::SellerNotRegistered)
}

/// Check if buyer is registered and active
pub fn is_buyer_active(env: &Env, buyer_address: &Address) -> Result<(), ContractError> {
    let buyer_info = get_buyer_info(env, buyer_address)?;
    if !buyer_info.is_active {
        return Err(ContractError::BuyerInactive);
    }
    Ok(())
}

/// Check if seller is registered and active
pub fn is_seller_active(env: &Env, seller_address: &Address) -> Result<(), ContractError> {
    let seller_info = get_seller_info(env, seller_address)?;
    if !seller_info.is_active {
        return Err(ContractError::SellerInactive);
    }
    Ok(())
}

/// Deactivate buyer
pub fn deactivate_buyer(env: &Env, buyer_address: &Address) -> Result<(), ContractError> {
    let mut buyer_info = get_buyer_info(env, buyer_address)?;
    buyer_info.is_active = false;
    env.storage()
        .instance()
        .set(&DataKey::RegisteredBuyer(buyer_address.clone()), &buyer_info);
    Ok(())
}

/// Deactivate seller
pub fn deactivate_seller(env: &Env, seller_address: &Address) -> Result<(), ContractError> {
    let mut seller_info = get_seller_info(env, seller_address)?;
    seller_info.is_active = false;
    env.storage()
        .instance()
        .set(&DataKey::RegisteredSeller(seller_address.clone()), &seller_info);
    Ok(())
}

/// Get all buyers
pub fn get_all_buyers(env: &Env) -> Vec<BuyerInfo> {
    let all_buyers: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::AllBuyers)
        .unwrap_or(Vec::new(env));

    let mut buyer_infos = Vec::new(env);
    for buyer_addr in all_buyers.iter() {
        if let Ok(buyer_info) = get_buyer_info(env, &buyer_addr) {
            buyer_infos.push_back(buyer_info);
        }
    }
    buyer_infos
}

/// Get all sellers
pub fn get_all_sellers(env: &Env) -> Vec<SellerInfo> {
    let all_sellers: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::AllSellers)
        .unwrap_or(Vec::new(env));

    let mut seller_infos = Vec::new(env);
    for seller_addr in all_sellers.iter() {
        if let Ok(seller_info) = get_seller_info(env, &seller_addr) {
            seller_infos.push_back(seller_info);
        }
    }
    seller_infos
}

#![cfg(test)]

use crate::{
    contract::MarketplaceEscrowV1, types::*, BuyerInfo, ContractError, CustomerInvoice,
    PurchaseOrder, SellerInfo, TradeEscrow, WarehouseReceipt,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

fn create_contract() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MarketplaceEscrowV1, ());
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Initialize contract
    client.constructor(&treasury, &25); // 0.25% fee

    (env, contract_id, admin, buyer, seller)
}

#[test]
fn test_initialize() {
    let (env, contract_id, _admin, _buyer, _seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Test calculate_escrow_cost
    let (total, fee) = client.calculate_escrow_cost(&10000);
    assert_eq!(fee, 25); // 0.25% of 10000
    assert_eq!(total, 10025);
}

#[test]
fn test_register_buyer() {
    let (env, contract_id, admin, buyer, _seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Register buyer
    let buyer_name = String::from_str(&env, "Tommy Hilfiger");
    let buyer_lei = String::from_str(&env, "549300VGEJK8QMIYGZ34");

    client.register_buyer(&buyer, &buyer_name, &buyer_lei);

    // Verify buyer registered
    let buyer_info = client.get_buyer_info(&buyer);
    assert_eq!(buyer_info.name, buyer_name);
    assert_eq!(buyer_info.lei_id, buyer_lei);
    assert_eq!(buyer_info.is_active, true);
}

#[test]
fn test_register_seller() {
    let (env, contract_id, admin, _buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Register seller
    let seller_name = String::from_str(&env, "Jupiter Knitting");
    let seller_lei = String::from_str(&env, "213800ABCDEF1234XYZ");

    client.register_seller(&seller, &seller_name, &seller_lei);

    // Verify seller registered
    let seller_info = client.get_seller_info(&seller);
    assert_eq!(seller_info.name, seller_name);
    assert_eq!(seller_info.lei_id, seller_lei);
    assert_eq!(seller_info.is_active, true);
}

#[test]
#[should_panic(expected = "BuyerAlreadyRegistered")]
fn test_register_buyer_duplicate() {
    let (env, contract_id, admin, buyer, _seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    let buyer_name = String::from_str(&env, "Tommy Hilfiger");
    let buyer_lei = String::from_str(&env, "549300VGEJK8QMIYGZ34");

    // Register once
    client.register_buyer(&buyer, &buyer_name, &buyer_lei);

    // Try to register again (should fail)
    client.register_buyer(&buyer, &buyer_name, &buyer_lei);
}

#[test]
fn test_create_trade() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Register buyer and seller
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    // Create trade
    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000, // 15 XLM in stroops
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    assert_eq!(trade_id, 1);

    // Verify trade created
    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.trade_id, 1);
    assert_eq!(trade.buyer, buyer);
    assert_eq!(trade.seller, seller);
    assert_eq!(trade.state, ORDERED);
    assert_eq!(trade.amount, 15000_0000000);
}

#[test]
fn test_fund_escrow() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &10000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    // Calculate required escrow
    let (total_required, fee) = client.calculate_escrow_cost(&10000_0000000);
    assert_eq!(fee, 25_0000000); // 0.25% fee

    // Fund escrow
    client.fund_escrow(&trade_id, &total_required);

    // Verify escrow funded
    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.escrow_balance, total_required);
    assert_eq!(trade.marketplace_fee, fee);
}

#[test]
fn test_fulfill_order() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    let (total_required, _) = client.calculate_escrow_cost(&15000_0000000);
    client.fund_escrow(&trade_id, &total_required);

    // Validate buyer vLEI
    client.validate_buyer_vlei(&trade_id);

    // Fulfill order
    client.fulfill_order(
        &trade_id,
        &String::from_str(&env, "Cotton T-shirts"), // CI description
        &1000,                                       // CI quantity
        &15_0000000,                                 // CI unit price
        &15000_0000000,                              // CI total
        &String::from_str(&env, "QmCI123"),
        &String::from_str(&env, "Cotton T-shirts"), // WR description
        &1000,                                       // WR quantity
        &15_0000000,                                 // WR unit price
        &15000_0000000,                              // WR total
        &String::from_str(&env, "QmWR123"),
        &String::from_str(&env, "Warehouse A"),
    );

    // Verify fulfilled
    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.state, FULFILLED);
}

#[test]
fn test_accept_trade_exact_match() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    let (total_required, _) = client.calculate_escrow_cost(&15000_0000000);
    client.fund_escrow(&trade_id, &total_required);
    client.validate_buyer_vlei(&trade_id);

    client.fulfill_order(
        &trade_id,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmCI123"),
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmWR123"),
        &String::from_str(&env, "Warehouse A"),
    );

    // Accept trade (triggers DvP)
    client.accept_trade(&trade_id);

    // Verify settled
    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.state, SETTLED);
}

#[test]
fn test_accept_trade_with_quantity_variance() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    let (total_required, _) = client.calculate_escrow_cost(&15000_0000000);
    client.fund_escrow(&trade_id, &total_required);
    client.validate_buyer_vlei(&trade_id);

    // Fulfill with 4% quantity variance (within 5% tolerance)
    client.fulfill_order(
        &trade_id,
        &String::from_str(&env, "Cotton T-shirts"),
        &1040, // 4% more than PO
        &15_0000000,
        &15600_0000000, // Adjusted total
        &String::from_str(&env, "QmCI123"),
        &String::from_str(&env, "Cotton T-shirts"),
        &1040,
        &15_0000000,
        &15600_0000000,
        &String::from_str(&env, "QmWR123"),
        &String::from_str(&env, "Warehouse A"),
    );

    // Accept trade (should pass with variance)
    client.accept_trade(&trade_id);

    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.state, SETTLED);
}

#[test]
#[should_panic(expected = "DescriptionMismatch")]
fn test_accept_trade_description_mismatch() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    let (total_required, _) = client.calculate_escrow_cost(&15000_0000000);
    client.fund_escrow(&trade_id, &total_required);
    client.validate_buyer_vlei(&trade_id);

    // Fulfill with different description
    client.fulfill_order(
        &trade_id,
        &String::from_str(&env, "Polyester T-shirts"), // DIFFERENT!
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmCI123"),
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmWR123"),
        &String::from_str(&env, "Warehouse A"),
    );

    // This should fail
    client.accept_trade(&trade_id);
}

#[test]
fn test_reject_order() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    // Reject order
    client.reject_order(&trade_id);

    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.state, REJECTED);
}

#[test]
fn test_cancel_trade() {
    let (env, contract_id, admin, buyer, seller) = create_contract();
    let client = MarketplaceEscrowV1Client::new(&env, &contract_id);

    // Setup
    client.register_buyer(
        &buyer,
        &String::from_str(&env, "Tommy Hilfiger"),
        &String::from_str(&env, "549300VGEJK8QMIYGZ34"),
    );

    client.register_seller(
        &seller,
        &String::from_str(&env, "Jupiter Knitting"),
        &String::from_str(&env, "213800ABCDEF1234XYZ"),
    );

    let trade_id = client.create_trade(
        &seller,
        &String::from_str(&env, "Cotton T-shirts"),
        &1000,
        &15_0000000,
        &15000_0000000,
        &String::from_str(&env, "QmPO123"),
        &String::from_str(&env, "QmBuyerLEI"),
        &String::from_str(&env, "QmSellerLEI"),
    );

    // Cancel trade
    client.cancel_trade(&trade_id);

    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.state, CANCELLED);
}

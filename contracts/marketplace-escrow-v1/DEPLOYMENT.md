# MarketplaceEscrowV1 Deployment Guide

## Prerequisites

1. **Stellar CLI** installed and configured
   ```bash
   cargo install --locked stellar-cli
   ```

2. **Rust toolchain** with wasm32 target
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Stellar account** with XLM for deployment fees

## Step 1: Build the Contract

From the project root:

```bash
cd contracts/marketplace-escrow-v1
stellar contract build
```

This generates the WASM file at:
```
target/wasm32-unknown-unknown/release/marketplace_escrow_v1.wasm
```

## Step 2: Optimize the WASM (Optional but Recommended)

```bash
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/marketplace_escrow_v1.wasm
```

## Step 3: Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/marketplace_escrow_v1.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

Save the returned contract ID!

## Step 4: Initialize the Contract

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  --network testnet \
  -- \
  constructor \
  --platform_treasury <TREASURY_ADDRESS> \
  --marketplace_fee_rate 25
```

**Parameters:**
- `platform_treasury`: Address to receive marketplace fees
- `marketplace_fee_rate`: Fee in basis points (25 = 0.25%)

## Step 5: Register Buyer (Tommy Hilfiger)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  --network testnet \
  -- \
  register_buyer \
  --buyer_address <TOMMY_HILFIGER_ADDRESS> \
  --buyer_name "Tommy Hilfiger" \
  --buyer_lei_id "549300VGEJK8QMIYGZ34"
```

## Step 6: Register Seller (Jupiter Knitting)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  --network testnet \
  -- \
  register_seller \
  --seller_address <JUPITER_KNITTING_ADDRESS> \
  --seller_name "Jupiter Knitting" \
  --seller_lei_id "213800ABCDEF1234XYZ"
```

## Step 7: Verify Registration

### Check buyer info:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_buyer_info \
  --buyer_address <TOMMY_HILFIGER_ADDRESS>
```

### Check seller info:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_seller_info \
  --seller_address <JUPITER_KNITTING_ADDRESS>
```

### List all buyers:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_all_buyers
```

### List all sellers:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_all_sellers
```

## Step 8: Create a Test Trade

### As buyer (Tommy Hilfiger):
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <BUYER_SECRET_KEY> \
  --network testnet \
  -- \
  create_trade \
  --seller <JUPITER_KNITTING_ADDRESS> \
  --po_description "Cotton T-shirts, Blue, Size M" \
  --quantity 1000 \
  --unit_price 150000000 \
  --total_price 150000000000 \
  --po_json_ipfs_hash "QmPurchaseOrder123" \
  --buyer_lei_ipfs "QmBuyerLEI123" \
  --seller_lei_ipfs "QmSellerLEI123"
```

Returns: `trade_id = 1`

## Step 9: Calculate and Fund Escrow

### Calculate required amount:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  calculate_escrow_cost \
  --amount 150000000000
```

### Fund the escrow:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <BUYER_SECRET_KEY> \
  --network testnet \
  -- \
  fund_escrow \
  --trade_id 1 \
  --payment_amount <TOTAL_REQUIRED>
```

## Step 10: Validate vLEI Documents

### Validate buyer vLEI:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  validate_buyer_vlei \
  --trade_id 1
```

### Validate seller vLEI:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  validate_seller_vlei \
  --trade_id 1
```

## Step 11: Fulfill Order (As Seller)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <SELLER_SECRET_KEY> \
  --network testnet \
  -- \
  fulfill_order \
  --trade_id 1 \
  --ci_description "Cotton T-shirts, Blue, Size M" \
  --ci_quantity 1000 \
  --ci_unit_price 150000000 \
  --ci_total_price 150000000000 \
  --ci_json_ipfs_hash "QmCustomerInvoice123" \
  --wr_description "Cotton T-shirts, Blue, Size M" \
  --wr_quantity 1000 \
  --wr_unit_price 150000000 \
  --wr_total_price 150000000000 \
  --wr_json_ipfs_hash "QmWarehouseReceipt123" \
  --warehouse_location "Warehouse A, Mumbai"
```

## Step 12: Accept Trade (As Buyer - Triggers DvP)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <BUYER_SECRET_KEY> \
  --network testnet \
  -- \
  accept_trade \
  --trade_id 1
```

This will:
1. Call `dvp_check()`
2. Call `three_way_match()` internally
3. Verify description exact match
4. Verify quantity ≤5% variance
5. Verify price ≤2% variance
6. Release payment to seller
7. Release marketplace fee to treasury
8. Update trade state to SETTLED

## Step 13: Verify Settlement

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_trade \
  --trade_id 1
```

Expected state: `SETTLED (2)`

## Mainnet Deployment

For mainnet, replace `--network testnet` with `--network mainnet` in all commands.

**IMPORTANT**: Ensure you have:
1. Sufficient XLM for deployment and operations
2. Proper security for admin keys
3. Validated all LEI IDs through GLEIF
4. Tested thoroughly on testnet first

## Troubleshooting

### Contract not found
- Verify contract ID
- Check network selection (testnet vs mainnet)

### Insufficient authorization
- Ensure correct signer key is used
- Verify key has authority for the operation

### BuyerNotRegistered / SellerNotRegistered
- Register parties before creating trades
- Verify addresses match exactly

### InsufficientEscrowFunding
- Use `calculate_escrow_cost()` to get exact amount
- Include marketplace fee in payment

### DescriptionMismatch
- Ensure PO, CI, WR descriptions are EXACTLY the same
- Check for case sensitivity and whitespace

### QuantityVarianceTooHigh
- Keep quantity variance ≤5%
- Example: PO=1000 allows CI/WR between 950-1050

### PriceVarianceTooHigh
- Keep price variance ≤2%
- Example: PO=15000 allows CI/WR between 14700-15300

## Monitoring

### Get buyer's trades:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_trades_by_buyer \
  --buyer <BUYER_ADDRESS>
```

### Get seller's trades:
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_trades_by_seller \
  --seller <SELLER_ADDRESS>
```

### Get all documents for a trade:
```bash
# Purchase Order
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_purchase_order --trade_id 1

# Customer Invoice
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_customer_invoice --trade_id 1

# Warehouse Receipt
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_warehouse_receipt --trade_id 1

# vLEI Documents
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_vlei_documents --trade_id 1
```

## Security Best Practices

1. **Keep admin keys secure** - Only owner can register/deactivate parties
2. **Validate LEI IDs** - Verify through GLEIF before registration
3. **Test on testnet first** - Always test the full trade flow
4. **Monitor events** - Track all state changes
5. **Backup IPFS hashes** - Store off-chain documents securely
6. **Verify addresses** - Double-check all buyer/seller addresses
7. **Use hardware wallets** - For high-value trades

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review test cases in test.rs for usage examples
- Verify error codes in errors.rs

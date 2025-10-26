# MarketplaceEscrowV1 - Quick Reference Card

## 🚀 Quick Start

### Build Contract
```bash
cd contracts/marketplace-escrow-v1
stellar contract build
```

### Run Tests
```bash
cargo test
```

### Deploy
```bash
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/marketplace_escrow_v1.wasm --network testnet
```

---

## 📋 Contract Functions Cheat Sheet

### 🔐 Admin Only
| Function | Parameters | Description |
|----------|-----------|-------------|
| `register_buyer` | address, name, lei_id | Add buyer to registry |
| `register_seller` | address, name, lei_id | Add seller to registry |
| `deactivate_buyer` | address | Deactivate buyer |
| `deactivate_seller` | address | Deactivate seller |

### 👤 Buyer Functions
| Function | Parameters | Description |
|----------|-----------|-------------|
| `create_trade` | seller, po_details, ipfs | Create new trade |
| `fund_escrow` | trade_id, amount | Fund escrow (amount + fee) |
| `accept_trade` | trade_id | Trigger DvP settlement |
| `cancel_trade` | trade_id | Cancel before fulfillment |

### 🏭 Seller Functions
| Function | Parameters | Description |
|----------|-----------|-------------|
| `fulfill_order` | trade_id, ci_details, wr_details | Ship goods |
| `reject_order` | trade_id | Reject order |

### 📊 Query Functions
| Function | Returns | Description |
|----------|---------|-------------|
| `get_trade` | TradeEscrow | Get trade details |
| `get_buyer_info` | BuyerInfo | Get buyer details |
| `get_seller_info` | SellerInfo | Get seller details |
| `get_all_buyers` | Vec<BuyerInfo> | List all buyers |
| `get_all_sellers` | Vec<SellerInfo> | List all sellers |

---

## 🔢 Trade States

| Code | State | Description |
|------|-------|-------------|
| 0 | ORDERED | PO created, escrow funded |
| 1 | FULFILLED | Goods shipped, CI+WR submitted |
| 2 | SETTLED | Payment released |
| 3 | REJECTED | Seller rejected |
| 4 | CANCELLED | Buyer cancelled |

---

## ⚖️ Matching Rules

### Description
- **Rule**: EXACT match
- **Example**: PO="Cotton T-shirts" must equal CI="Cotton T-shirts"
- **Case Sensitive**: Yes

### Quantity
- **Rule**: ≤5% variance
- **Formula**: `|val1 - val2| / val1 * 100 ≤ 5`
- **Example Pass**: PO=1000, CI=1040 (4% variance) ✅
- **Example Fail**: PO=1000, WR=1060 (6% variance) ❌

### Total Price
- **Rule**: ≤2% variance
- **Formula**: `|val1 - val2| / val1 * 100 ≤ 2`
- **Example Pass**: PO=15000, CI=15250 (1.67% variance) ✅
- **Example Fail**: PO=15000, WR=15350 (2.33% variance) ❌

---

## 🎬 Trade Flow (5 Steps)

```
1. ADMIN: Register buyer & seller
   └─> register_buyer(), register_seller()

2. BUYER: Create trade + fund escrow
   └─> create_trade(), fund_escrow()

3. SELLER: Fulfill order
   └─> fulfill_order(ci_details, wr_details)

4. BUYER: Accept trade (triggers DvP)
   └─> accept_trade()
   
5. CONTRACT: 3-way match → release payment
   └─> dvp_check() → three_way_match() → SETTLED
```

---

## 💰 Fee Calculation

**Default Fee**: 0.25% (25 basis points)

```
Example:
Trade Amount: 15,000 XLM
Marketplace Fee: 15,000 * 0.0025 = 37.5 XLM
Total Required: 15,037.5 XLM

Payout:
├─ Seller: 15,000 XLM
└─ Treasury: 37.5 XLM
```

**Calculate in code**:
```bash
stellar contract invoke --id <ID> -- calculate_escrow_cost --amount 15000_0000000
```

---

## ❌ Common Errors

| Error | Code | Cause | Solution |
|-------|------|-------|----------|
| BuyerNotRegistered | 1 | Buyer not in registry | Register buyer first |
| SellerNotRegistered | 2 | Seller not in registry | Register seller first |
| InsufficientEscrowFunding | 60 | Payment too low | Use calculate_escrow_cost() |
| EscrowNotFunded | 61 | Escrow empty | Call fund_escrow() |
| BuyerVLEINotValidated | 84 | vLEI not validated | Call validate_buyer_vlei() |
| DescriptionMismatch | 100 | PO/CI/WR don't match | Ensure exact match |
| QuantityVarianceTooHigh | 101 | >5% difference | Keep within 5% variance |
| PriceVarianceTooHigh | 102 | >2% difference | Keep within 2% variance |

---

## 📦 Data Structures

### BuyerInfo
```rust
name: String              // "Tommy Hilfiger"
lei_id: String           // "549300VGEJK8QMIYGZ34"
wallet_address: Address
registered_at: u64
is_active: bool
```

### TradeEscrow
```rust
trade_id: u64
buyer: Address
seller: Address
amount: i128
state: u32               // 0=ORDERED, 1=FULFILLED, 2=SETTLED
escrow_balance: i128
marketplace_fee: i128
```

### PurchaseOrder
```rust
po_description: String
quantity: u64
unit_price: i128
total_price: i128
po_json_ipfs_hash: String
```

### CustomerInvoice
```rust
ci_description: String   // Must match PO
quantity: u64            // ≤5% variance from PO
total_price: i128        // ≤2% variance from PO
ci_json_ipfs_hash: String
```

### WarehouseReceipt
```rust
wr_description: String   // Must match PO
quantity: u64            // ≤5% variance from PO
total_price: i128        // ≤2% variance from PO
wr_json_ipfs_hash: String
warehouse_location: String
```

---

## 🧪 Testing Examples

### Test Exact Match
```rust
create_trade(description="Cotton T-shirts", quantity=1000, price=15000)
fund_escrow(total=15037.5)
fulfill_order(ci_desc="Cotton T-shirts", ci_qty=1000, ci_price=15000,
              wr_desc="Cotton T-shirts", wr_qty=1000, wr_price=15000)
accept_trade() // ✅ PASS
```

### Test 4% Quantity Variance (Pass)
```rust
create_trade(quantity=1000)
fulfill_order(ci_qty=1040, wr_qty=1040)  // 4% variance
accept_trade() // ✅ PASS
```

### Test 6% Quantity Variance (Fail)
```rust
create_trade(quantity=1000)
fulfill_order(ci_qty=1060, wr_qty=1060)  // 6% variance
accept_trade() // ❌ FAIL: QuantityVarianceTooHigh
```

### Test Description Mismatch (Fail)
```rust
create_trade(description="Cotton T-shirts")
fulfill_order(ci_desc="Polyester T-shirts")  // Different!
accept_trade() // ❌ FAIL: DescriptionMismatch
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Complete contract documentation |
| DEPLOYMENT.md | Step-by-step deployment guide |
| IMPLEMENTATION_SUMMARY.md | What was implemented |
| ARCHITECTURE.md | Architecture diagrams |
| QUICK_REFERENCE.md | This cheat sheet |

---

## 🔗 Useful Commands

### Get contract info
```bash
stellar contract info --id <CONTRACT_ID> --network testnet
```

### Query trade
```bash
stellar contract invoke --id <ID> -- get_trade --trade_id 1
```

### Get buyer's trades
```bash
stellar contract invoke --id <ID> -- get_trades_by_buyer --buyer <ADDRESS>
```

### List all buyers
```bash
stellar contract invoke --id <ID> -- get_all_buyers
```

### List all sellers
```bash
stellar contract invoke --id <ID> -- get_all_sellers
```

---

## 🎯 Key Reminders

✅ **Register** buyers/sellers before trading  
✅ **Include** marketplace fee when funding escrow  
✅ **Validate** vLEI before fulfillment  
✅ **Exact match** required for descriptions  
✅ **5% tolerance** for quantity variance  
✅ **2% tolerance** for price variance  
✅ **Test** on testnet before mainnet  
✅ **Backup** IPFS hashes securely  

---

## 🆘 Need Help?

1. Check README.md for detailed docs
2. Review test.rs for usage examples
3. See DEPLOYMENT.md for deployment steps
4. Check errors.rs for error codes
5. Review ARCHITECTURE.md for flow diagrams

---

**Contract Version**: 0.0.1  
**Stellar SDK**: 22.0.8  
**License**: Apache-2.0

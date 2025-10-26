# Marketplace Escrow V1 - Deployment Status

## ✅ Local Deployment Complete

### Contract Details
- **Contract Name**: marketplace-escrow-v1
- **Network**: Standalone Network (Local)
- **Contract ID**: `CBMVXOY2Q4VNANMZNXTII2RXSVYXQL4OWSYOCVOKC7XBDBH2MLV34UCM`
- **WASM Location**: `target/stellar/local/marketplace_escrow_v1.wasm`
- **WASM Hash**: `6c0117a13b0ce96829b09ed2acd62f11e020b5317abd58cd6a06aad157a22030`

### Constructor Parameters (deployed with)
- `platform_treasury`: me (default account)
- `marketplace_fee_rate`: 250 (2.5%)

### Available Functions (27 total)
- `__constructor` - Initialize marketplace
- `register_buyer` - Register a new buyer
- `register_seller` - Register a new seller
- `create_trade` - Create new trade with PO
- `fund_escrow` - Buyer adds payment
- `fulfill_order` - Seller ships goods
- `accept_trade` - Buyer triggers DvP settlement
- `cancel_trade` - Buyer cancels
- `reject_order` - Seller rejects
- `validate_buyer_vlei` - Validate buyer vLEI
- `validate_seller_vlei` - Validate seller vLEI
- And 16 more getter functions...

## 📦 Generated Artifacts

### TypeScript Client
- **Package**: `packages/marketplace_escrow_v1/`
- **Import file**: `src/contracts/marketplace_escrow_v1.ts`
- **Bundle files**: 
  - `packages/marketplace_escrow_v1/dist/index.js`
  - `packages/marketplace_escrow_v1/dist/index.d.ts`

### Usage in React
```typescript
import marketplaceEscrow from '../contracts/marketplace_escrow_v1';

// Example: Register a buyer
const result = await marketplaceEscrow.register_buyer({
  buyer_address: buyerAddress,
  buyer_name: "Acme Corp",
  buyer_lei_id: "LEI123456789"
});
```

## 🚀 Next Steps for Testnet/Mainnet Deployment

### Prerequisites
Install the stellar-registry CLI:
```bash
cargo install stellar-registry
# or
npm install -g @stellar/registry-cli
```

### Deployment Workflow

#### 1. Publish Contract to Registry
```bash
stellar-registry publish \
  --wasm target/stellar/local/marketplace_escrow_v1.wasm \
  --wasm-name marketplace-escrow-v1
```

#### 2. Deploy to Testnet
```bash
# Set environment to testnet
export STELLAR_SCAFFOLD_ENV=staging

# Deploy with constructor parameters
stellar-registry deploy \
  --contract-name marketplace-escrow-testnet \
  --wasm-name marketplace-escrow-v1 \
  -- \
  --platform_treasury <TESTNET_TREASURY_ADDRESS> \
  --marketplace_fee_rate 250
```

#### 3. Create Local Alias
```bash
stellar-registry create-alias marketplace-escrow-testnet
```

#### 4. Test the Deployment
```bash
stellar contract invoke \
  --id marketplace-escrow-testnet \
  -- \
  register_buyer \
  --buyer_address <ADDRESS> \
  --buyer_name "Test Buyer" \
  --buyer_lei_id "LEI_TEST"
```

### Production (Mainnet)
Similar workflow but with `STELLAR_SCAFFOLD_ENV=production` and mainnet addresses.

## 🧪 Testing Locally

The contract is live on your local Stellar network at:
- **RPC URL**: http://localhost:8000/rpc
- **Horizon URL**: http://localhost:8000

You can interact with it via:
1. **Frontend**: http://localhost:5173 (when running `npm run dev`)
2. **TypeScript client**: Import from `src/contracts/marketplace_escrow_v1.ts`
3. **Direct CLI** (if you have stellar-cli installed)

## 📝 Configuration Files

### environments.toml
Contains deployment configuration for different environments (development, staging, production).

### Current Development Config
```toml
[development.contracts.marketplace_escrow_v1]
client = true
constructor_args = "--platform_treasury me --marketplace_fee_rate 250"
```

## ✨ Status Summary
- ✅ Contract compiled successfully
- ✅ Deployed to local network
- ✅ TypeScript bindings generated
- ✅ NPM package built
- ✅ Ready for frontend integration
- ⏳ Testnet deployment (requires stellar-registry CLI)
- ⏳ Mainnet deployment (requires stellar-registry CLI)

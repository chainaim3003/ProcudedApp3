# Testnet Deployment Guide

## Prerequisites
- Stellar CLI installed (`cargo install stellar-cli@22.0.1`)
- Contract WASM built (`stellar-scaffold build`)
- Testnet account funded (done automatically by stellar-scaffold)

## Deployment Steps

### Option 1: Using stellar-scaffold (Automated)

```bash
# Set environment to staging (testnet)
export STELLAR_SCAFFOLD_ENV=staging

# Build and deploy to testnet
stellar-scaffold build --build-clients
```

The `environments.toml` file has been configured with testnet settings:
- Network: https://soroban-testnet.stellar.org
- Passphrase: "Test SDF Network ; September 2015"
- Account: testnet-user (auto-created and funded)

### Option 2: Manual Deployment Using Stellar CLI

If stellar-scaffold deployment fails, use these manual steps:

```bash
# 1. Deploy the contract WASM
stellar contract deploy \
  --wasm target/stellar/local/marketplace_escrow_v1.wasm \
  --source testnet-user \
  --network testnet

# This will output a contract ID like: CBMV...UCM

# 2. Initialize the contract (call constructor)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source testnet-user \
  --network testnet \
  -- __constructor \
  --platform_treasury <TESTNET_USER_ADDRESS> \
  --marketplace_fee_rate 250

# 3. Update environments.toml with the deployed contract ID
# Add under [staging.contracts]:
# marketplace_escrow_v1 = { id = "CBMV...UCM", client = true }

# 4. Regenerate TypeScript bindings for testnet
stellar-scaffold build --build-clients
```

### Getting Testnet Account Address

```bash
# Get the testnet-user public key
stellar keys address testnet-user
```

## Post-Deployment

### Update environments.toml

After manual deployment, update the `[staging.contracts]` section:

```toml
[staging.contracts]
marketplace_escrow_v1 = { id = "YOUR_DEPLOYED_CONTRACT_ID", client = true }
```

### Regenerate TypeScript Bindings

```bash
# This generates the TypeScript client for testnet
export STELLAR_SCAFFOLD_ENV=staging
stellar-scaffold build --build-clients
```

### Verify Deployment

```bash
# Check contract info
stellar contract info id <CONTRACT_ID> --network testnet

# Test a function call
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source testnet-user \
  --network testnet \
  -- get_all_buyers
```

## Environment Variables for Frontend

Update your `.env` file to point to testnet:

```env
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_MARKETPLACE_ESCROW_CONTRACT_ID=<YOUR_DEPLOYED_CONTRACT_ID>
```

## Contract Functions Available

- `register_buyer` / `register_seller`
- `create_trade`
- `fund_escrow`
- `fulfill_order`
- `accept_trade`
- `cancel_trade`
- `get_all_buyers` / `get_all_sellers`
- `get_trade`
- And 18 more functions...

See `DEPLOYMENT_STATUS.md` for the complete list of available functions.

## Troubleshooting

### Error: Account not funded
```bash
stellar keys fund testnet-user --network testnet
```

### Error: Contract not found
Make sure you're using the correct contract ID and network:
```bash
stellar contract info id <CONTRACT_ID> --network testnet
```

### Error: Build failed
Make sure all dependencies are up to date:
```bash
cargo update
stellar-scaffold build
```

## Next Steps

1. Deploy contract to testnet ✓
2. Update frontend to use testnet contract ID
3. Test buyer/seller registration from UI
4. Test trade creation and escrow workflow
5. Deploy to mainnet (when ready)

## Resources

- Stellar Testnet Explorer: https://stellar.expert/explorer/testnet
- Soroban RPC: https://soroban-testnet.stellar.org
- Friendbot (fund testnet accounts): https://friendbot.stellar.org

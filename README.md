# entitymanager-scripts

Register FSP addresses with EntityManager: **Ledger** (Identity + Delegation) and **hot wallet** (Submit, SubmitSignatures, SigningPolicy). Step A = propose on Ledger; Step B = confirm (hot for 3 roles, Ledger for Delegation).

## Setup

```bash
npm install
cp .env.example .env
```

**Edit `.env`** (order = same as `.env.example`):

1. `USE_TESTNET` — `1` testnet, `0` mainnet  
2. `ENTITY_MANAGER_ADDRESS` — contract address  
3. `LEDGER_IDENTITY_PATH`, `LEDGER_DELEGATION_PATH` — defaults `44'/60'/0'/0/0`, `44'/60'/0'/0/1`  
4. `SUBMIT_ADDRESS`, `SUBMIT_SIGNATURES_ADDRESS`, `SIGNING_POLICY_ADDRESS` — hot wallet addresses  
5. `SUBMIT_PRIVATE_KEY`, `SUBMIT_SIGNATURES_PRIVATE_KEY`, `SIGNING_POLICY_PRIVATE_KEY` — must match 4  
6. `PUBLIC_KEY_X`, `PUBLIC_KEY_Y`, `SORTITION_SIGNATURE` — for registerPublicKey.js  
7. `NODE_ID`, `CERTIFICATE_RAW`, `VALIDATOR_SIGNATURE` — for registerNodeId.js  

## Run

```bash
node stepA.js            # Identity proposes 4 roles on Ledger
node stepB.js            # Each role confirms (hot wallet ×3, Ledger for Delegation)
node registerPublicKey.js   # Identity registers public key on Ledger
node registerNodeId.js      # Identity registers node ID on Ledger
```

Run Step A first, then Step B. If it hangs at "Connecting to Ledger…", plug in the device, unlock it, and open the Ethereum app.


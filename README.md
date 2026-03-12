# entitymanager-scripts

Register FSP addresses with EntityManager: **Ledger** (Identity + Delegation) and **hot wallet** (Submit, SubmitSignatures, SigningPolicy). Step A = propose on Ledger; Step B = confirm (hot for 3 roles, Ledger for Delegation).

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`: set `ENTITY_MANAGER_ADDRESS`, the three hot wallet addresses (`SUBMIT_ADDRESS`, `SUBMIT_SIGNATURES_ADDRESS`, `SIGNING_POLICY_ADDRESS`), and the three hot wallet private keys (`SUBMIT_PRIVATE_KEY`, `SUBMIT_SIGNATURES_PRIVATE_KEY`, `SIGNING_POLICY_PRIVATE_KEY`). Each key’s address must match the corresponding `*_ADDRESS`.

- **Network**: `USE_TESTNET=1` (or omit) = Coston2 testnet; `USE_TESTNET=0` = Flare mainnet.

## Run

```bash
node stepA.js   # Identity proposes on Ledger (connect device, unlock, open Ethereum app)
node stepB.js   # Each role confirms (hot wallet for 3, Ledger for Delegation)
```

Run Step A first, then Step B. If it hangs at "Connecting to Ledger…", plug in the device, unlock it, and open the Ethereum app.

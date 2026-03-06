# FSP Address Registration (Cold + Hot Wallet)

Register FSP (Flare Service Provider) addresses with **Ledger** (cold wallet) and **hot wallet** keys. Uses the EntityManager contract: Identity proposes each role address; each role then confirms.

- **Cold wallet (Ledger)**: Identity signs all **propose** txs (Step A); Delegation signs its **confirm** (Step B). No private keys for these roles.
- **Hot wallet (.env)**: Submit, SubmitSignatures, and SigningPolicy sign their **confirm** txs in Step B via private keys.

## Prerequisites

- **Node.js** 18+ (ESM)
- **Ledger** device: connect, unlock, open **Ethereum** app
- **.env** with contract address and hot wallet keys (see below)

## Setup

1. Clone or copy the project, then install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env and edit:

   ```bash
   cp .env.example .env
   ```

   Fill in:

   - `ENTITY_MANAGER_ADDRESS` — EntityManager contract (testnet or mainnet)
   - `SUBMIT_PRIVATE_KEY`, `SUBMIT_SIGNATURES_PRIVATE_KEY`, `SIGNING_POLICY_PRIVATE_KEY` — hot wallet keys whose **addresses match** the Ledger addresses at paths 1, 2, 3

3. **Network**: set `USE_TESTNET=1` (or omit) for **Coston2 testnet**; set `USE_TESTNET=0` for **Flare mainnet**. Testnet uses `testbuild/EntityManager.json`, mainnet uses `build/EntityManager.json`.

## Ledger Paths (BIP-44)

Default paths (override with `LEDGER_*_PATH` in .env if needed):

| Path              | Role            | Usage                          |
|-------------------|-----------------|--------------------------------|
| `44'/60'/0'/0/0`  | Identity        | Sign propose (Step A); read    |
| `44'/60'/0'/0/1`  | Submit          | Read address; confirm = hot    |
| `44'/60'/0'/0/2`  | SubmitSignatures| Read address; confirm = hot    |
| `44'/60'/0'/0/3`  | SigningPolicy   | Read address; confirm = hot   |
| `44'/60'/0'/0/4`  | Delegation      | Sign confirm (Step B); read   |

Cold wallet (device signing): **Identity** and **Delegation** only. The other three paths are used only to **read** addresses; their confirm txs are signed with the hot wallet keys from .env.

## Run

1. **Step A** — Identity proposes all four roles (confirm each tx on the Ledger):

   ```bash
   node stepA.js
   ```

   If the script hangs after “Connecting to Ledger…”, connect the device, unlock it, and open the Ethereum app.

2. **Step B** — Each role confirms (hot wallet for Submit / SubmitSignatures / SigningPolicy; Ledger for Delegation):

   ```bash
   node stepB.js
   ```

Run Step A once, then Step B. The same .env and Ledger setup are used for both.

## Files

| File               | Purpose                                      |
|--------------------|----------------------------------------------|
| `registerShared.js`| Shared config, RPC, paths, Ledger/hot tx helpers |
| `stepA.js`         | Propose (Identity on Ledger)                 |
| `stepB.js`         | Confirm (hot for 3 roles, Ledger for Delegation) |
| `.env`             | Your secrets (not committed)                 |
| `.env.example`     | Template; all options documented in comments |

## Troubleshooting

- **“Connecting to Ledger…” then hangs** — Plug in Ledger, unlock, open Ethereum app. No software can substitute for the device.
- **Missing ENTITY_MANAGER_ADDRESS** — Set it in .env for the correct network (testnet vs mainnet).
- **“hot wallet address in .env does not match Ledger”** — The three hot wallet addresses must match the addresses shown on Ledger for paths 1, 2, 3. Fix keys or Ledger paths so they align.

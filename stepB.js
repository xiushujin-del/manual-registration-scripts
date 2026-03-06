/** Step B: Each role confirms (hot wallet for Submit/SubmitSignatures/SigningPolicy, Ledger for Delegation). */
import { paths, getContract, config, HOT_KEYS, web3, getLedgerEth, getAddress, sendTxWithLedger, sendTxWithHotWallet, networkName } from "./registerShared.js";

const ROLES = ["Submit", "SubmitSignatures", "SigningPolicy", "Delegation"];

async function main() {
  console.log("Network:", networkName);
  const missing = ["Submit", "SubmitSignatures", "SigningPolicy"].filter((n) => !HOT_KEYS[n]);
  if (missing.length) throw new Error("Missing in .env: " + missing.map((n) => n + "_PRIVATE_KEY").join(", "));

  console.log("Connecting to Ledger... (connect device, unlock, open Ethereum app; will wait until ready)");
  const contract = getContract();
  const eth = await getLedgerEth();
  const identityAddress = (await getAddress(eth, paths.Identity)).toLowerCase();
  if (!identityAddress) throw new Error("Could not read Identity from Ledger");
  console.log("Identity:", identityAddress);

  const rolePaths = {};
  const roleAddrs = {};
  for (const name of ROLES) {
    roleAddrs[name] = (await getAddress(eth, paths[name])).toLowerCase();
    rolePaths[name] = paths[name];
    console.log(name + ":", roleAddrs[name]);
    if (HOT_KEYS[name]) {
      const key = HOT_KEYS[name].startsWith("0x") ? HOT_KEYS[name] : "0x" + HOT_KEYS[name];
      if (web3.eth.accounts.privateKeyToAccount(key).address.toLowerCase() !== roleAddrs[name])
        throw new Error(name + " hot wallet address in .env does not match Ledger");
    }
  }

  const to = contract.options.address;
  for (const [name, , confirmMethod] of config) {
    console.log("\nConfirm", name, HOT_KEYS[name] ? "(hot wallet)" : "- confirm on Ledger");
    const data = contract.methods[confirmMethod](identityAddress).encodeABI();
    if (HOT_KEYS[name]) await sendTxWithHotWallet(HOT_KEYS[name], to, data);
    else await sendTxWithLedger(eth, rolePaths[name], to, data, roleAddrs[name]);
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("\nStep B done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

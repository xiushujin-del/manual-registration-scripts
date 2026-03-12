/** Step B: Each role confirms (hot wallet for Submit/SubmitSignatures/SigningPolicy, Ledger for Delegation). */
import { paths, getContract, config, HOT_KEYS, web3, getLedgerEth, getAddress, getRoleAddress, sendTxWithLedger, sendTxWithHotWallet, networkName } from "./registerShared.js";

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

  const roleAddrs = {};
  for (const name of ROLES) {
    roleAddrs[name] = await getRoleAddress(eth, name);
    console.log(name + ":", roleAddrs[name]);
    if (HOT_KEYS[name]) {
      const key = HOT_KEYS[name].startsWith("0x") ? HOT_KEYS[name] : "0x" + HOT_KEYS[name];
      if (web3.eth.accounts.privateKeyToAccount(key).address.toLowerCase() !== roleAddrs[name])
        throw new Error(name + " private key address does not match " + name + "_ADDRESS in .env");
    }
  }

  const to = contract.options.address;
  for (const [name, , confirmMethod] of config) {
    const data = contract.methods[confirmMethod](identityAddress).encodeABI();
    const isHot = !!HOT_KEYS[name];
    console.log("\nConfirm", name, isHot ? "(hot wallet)" : "- confirm on Ledger");
    console.log("  method:", confirmMethod, "| params:", { identityAddress });
    if (isHot) {
      console.log("  sendTxWithHotWallet:", { to, data, fromAddress: roleAddrs[name] });
      await sendTxWithHotWallet(HOT_KEYS[name], to, data);
    } else {
      console.log("  sendTxWithLedger:", { fromPath: paths[name], to, data, fromAddress: roleAddrs[name] });
      await sendTxWithLedger(eth, paths[name], to, data, roleAddrs[name]);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("\nStep B done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

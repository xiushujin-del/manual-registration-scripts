/** Step A: Identity signs propose for all 4 roles on Ledger. Run this first. */
import { paths, getContract, config, getLedgerEth, getAddress, sendTxWithLedger, networkName } from "./registerShared.js";

const ROLES = ["Submit", "SubmitSignatures", "SigningPolicy", "Delegation"];

async function main() {
  console.log("Network:", networkName);
  console.log("Connecting to Ledger... (connect device, unlock, open Ethereum app; will wait until ready)");
  const contract = getContract();
  const eth = await getLedgerEth();

  const identityPath = paths.Identity;
  const identityAddress = (await getAddress(eth, identityPath)).toLowerCase();
  if (!identityAddress) throw new Error("Could not read Identity from Ledger");
  console.log("Identity:", identityAddress);

  const roleAddrs = {};
  for (const name of ROLES) {
    roleAddrs[name] = (await getAddress(eth, paths[name])).toLowerCase();
    console.log(name + ":", roleAddrs[name]);
  }

  const to = contract.options.address;
  for (const [name, proposeMethod] of config) {
    console.log("\nPropose", name, "- confirm on Ledger");
    await sendTxWithLedger(eth, identityPath, to, contract.methods[proposeMethod](roleAddrs[name]).encodeABI(), identityAddress);
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("\nStep A done. Run stepB.js next.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

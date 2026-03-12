/** Register public key (Identity signs on Ledger). */
import { paths, getContract, getLedgerEth, getAddress, sendTxWithLedger, networkName } from "./registerShared.js";

function toBytes32(hex) {
  const s = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (s.length > 64 || !/^[0-9a-fA-F]*$/.test(s)) throw new Error("bytes32 must be up to 64 hex chars");
  return "0x" + s.padStart(64, "0");
}

async function main() {
  console.log("Network:", networkName);
  const part1 = process.env.PUBLIC_KEY_X;
  const part2 = process.env.PUBLIC_KEY_Y;
  const _verificationData = process.env.SORTITION_SIGNATURE;
  if (!part1 || !part2 || !_verificationData) throw new Error("Set PUBLIC_KEY_X, PUBLIC_KEY_Y, SORTITION_SIGNATURE in .env");
  const _part1 = toBytes32(part1);
  const _part2 = toBytes32(part2);

  console.log("Connecting to Ledger... (connect device, unlock, open Ethereum app; will wait until ready)");
  const contract = getContract();
  const eth = await getLedgerEth();
  const identityPath = paths.Identity;
  const identityAddress = (await getAddress(eth, identityPath)).toLowerCase();
  if (!identityAddress) throw new Error("Could not read Identity from Ledger");
  console.log("Identity:", identityAddress);

  const data = contract.methods.registerPublicKey(_part1, _part2, _verificationData).encodeABI();
  const to = contract.options.address;
  console.log("\nregisterPublicKey - confirm on Ledger");
  console.log("  method: registerPublicKey | params:", { _part1, _part2, _verificationData });
  console.log("  sendTxWithLedger:", { fromPath: identityPath, to, data, fromAddress: identityAddress });
  await sendTxWithLedger(eth, identityPath, to, data, identityAddress);
  console.log("\nregisterPublicKey done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

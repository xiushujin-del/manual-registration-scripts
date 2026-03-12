/** Register node ID (Identity signs on Ledger). */
import { paths, getContract, getLedgerEth, getAddress, sendTxWithLedger, networkName } from "./registerShared.js";

function toBytes20(hex) {
  const s = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (s.length > 40 || !/^[0-9a-fA-F]*$/.test(s)) throw new Error("NODE_ID must be up to 40 hex chars (bytes20)");
  return "0x" + s.padStart(40, "0");
}

async function main() {
  console.log("Network:", networkName);
  const _nodeId = toBytes20(process.env.NODE_ID || "");
  const _certificateRaw = process.env.CERTIFICATE_RAW;
  const _signature = process.env.VALIDATOR_SIGNATURE;
  if (!process.env.NODE_ID || !_certificateRaw || !_signature) throw new Error("Set NODE_ID, CERTIFICATE_RAW, VALIDATOR_SIGNATURE in .env");

  console.log("Connecting to Ledger... (connect device, unlock, open Ethereum app; will wait until ready)");
  const contract = getContract();
  const eth = await getLedgerEth();
  const identityPath = paths.Identity;
  const identityAddress = (await getAddress(eth, identityPath)).toLowerCase();
  if (!identityAddress) throw new Error("Could not read Identity from Ledger");
  console.log("Identity:", identityAddress);

  const data = contract.methods.registerNodeId(_nodeId, _certificateRaw, _signature).encodeABI();
  const to = contract.options.address;
  console.log("\nregisterNodeId - confirm on Ledger");
  console.log("  method: registerNodeId | params:", { _nodeId, _certificateRaw, _signature });
  console.log("  sendTxWithLedger:", { fromPath: identityPath, to, data, fromAddress: identityAddress });
  await sendTxWithLedger(eth, identityPath, to, data, identityAddress);
  console.log("\nregisterNodeId done.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

/**
 * Shared config for Step A / Step B. Switch via USE_TESTNET in .env (default: testnet).
 * Design: Identity and Delegation sign on Ledger only — no private keys for cold wallet.
 */
import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { Web3 } from "web3";
import { createCustomCommon, Mainnet } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { RLP } from "@ethereumjs/rlp";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import Eth from "@ledgerhq/hw-app-eth";
import abiTest from "./testbuild/EntityManager.json" with { type: "json" };
import abiMain from "./build/EntityManager.json" with { type: "json" };

const isTestnet = process.env.USE_TESTNET !== "0" && process.env.USE_TESTNET !== "false";
export const CHAIN_ID = isTestnet ? 114 : 14;
export const RPC = isTestnet
  ? "https://coston2-api.flare.network/ext/C/rpc"
  : "https://flare-api.flare.network/ext/C/rpc";
export const abi = isTestnet ? abiTest : abiMain;
export const web3 = new Web3(RPC);
export const common = createCustomCommon({ chainId: CHAIN_ID }, Mainnet);
export const networkName = isTestnet ? "Coston2 testnet" : "Flare mainnet";

export const paths = {
  Identity: process.env.LEDGER_IDENTITY_PATH || "44'/60'/0'/0/0",
  Submit: process.env.LEDGER_SUBMIT_PATH || "44'/60'/0'/0/1",
  SubmitSignatures: process.env.LEDGER_SUBMIT_SIGNATURES_PATH || "44'/60'/0'/0/2",
  SigningPolicy: process.env.LEDGER_SIGNING_POLICY_PATH || "44'/60'/0'/0/3",
  Delegation: process.env.LEDGER_DELEGATION_PATH || "44'/60'/0'/0/4",
};

export const config = [
  ["Submit", "proposeSubmitAddress", "confirmSubmitAddressRegistration"],
  ["SubmitSignatures", "proposeSubmitSignaturesAddress", "confirmSubmitSignaturesAddressRegistration"],
  ["SigningPolicy", "proposeSigningPolicyAddress", "confirmSigningPolicyAddressRegistration"],
  ["Delegation", "proposeDelegationAddress", "confirmDelegationAddressRegistration"],
];

export const HOT_KEYS = {
  Submit: process.env.SUBMIT_PRIVATE_KEY,
  SubmitSignatures: process.env.SUBMIT_SIGNATURES_PRIVATE_KEY,
  SigningPolicy: process.env.SIGNING_POLICY_PRIVATE_KEY,
};

export function getContract() {
  if (!process.env.ENTITY_MANAGER_ADDRESS) throw new Error("Set ENTITY_MANAGER_ADDRESS in .env");
  return new web3.eth.Contract(abi, process.env.ENTITY_MANAGER_ADDRESS);
}

export async function getLedgerEth() {
  const transport = await TransportNodeHid.default.create();
  return new Eth(transport);
}

export async function getAddress(eth, path) {
  const p = path.startsWith("m/") ? path.slice(2) : path;
  const { address } = await eth.getAddress(p, false, false);
  return address;
}

export async function sendTxWithLedger(eth, fromPath, to, data, fromAddress) {
  const nonce = await web3.eth.getTransactionCount(fromAddress);
  const gasPrice = await web3.eth.getGasPrice();
  const payload = {
    nonce: BigInt(nonce),
    gasPrice: BigInt(gasPrice),
    gasLimit: 200000n,
    to,
    value: 0n,
    data: data.startsWith("0x") ? data : "0x" + data,
  };
  const unsigned = createLegacyTx(payload, { common });
  const rawHex = "0x" + Buffer.from(RLP.encode(unsigned.getMessageToSign())).toString("hex");
  const sig = await eth.signTransaction((fromPath.startsWith("m/") ? fromPath.slice(2) : fromPath), rawHex.replace(/^0x/, ""), null, null);
  const signed = createLegacyTx(
    { ...payload, v: BigInt("0x" + sig.v), r: BigInt("0x" + sig.r), s: BigInt("0x" + sig.s) },
    { common }
  );
  return web3.eth.sendSignedTransaction("0x" + Buffer.from(signed.serialize()).toString("hex"));
}

export async function sendTxWithHotWallet(privateKeyHex, to, data) {
  const key = privateKeyHex.startsWith("0x") ? privateKeyHex : "0x" + privateKeyHex;
  const account = web3.eth.accounts.privateKeyToAccount(key);
  const gasPrice = await web3.eth.getGasPrice();
  const gasPriceHex = typeof gasPrice === "string" && gasPrice.startsWith("0x") ? gasPrice : "0x" + BigInt(gasPrice).toString(16);
  const tx = {
    nonce: await web3.eth.getTransactionCount(account.address),
    gasPrice: gasPriceHex,
    gasLimit: "0x30d40", // 200000
    to,
    value: "0x0",
    data: data.startsWith("0x") ? data : "0x" + data,
    chainId: CHAIN_ID,
  };
  const signed = await web3.eth.accounts.signTransaction(tx, account.privateKey);
  return web3.eth.sendSignedTransaction(signed.rawTransaction);
}

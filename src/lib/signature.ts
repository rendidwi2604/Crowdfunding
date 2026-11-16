import { keccak256, toUtf8Bytes } from 'ethers';
import { metadataSchema } from './campaigns';
export function metadataMessage(txHash: string, metadata: unknown, contract: string) {
  const data = metadataSchema.parse(metadata);
  return `RuangBaik: publish campaign metadata\nChain: 11155111\nContract: ${contract.toLowerCase()}\nTransaction: ${txHash.toLowerCase()}\nContent: ${keccak256(toUtf8Bytes(JSON.stringify(data)))}`;
}
export function profileMessage(address: string, name: string, bio: string) {
  return `RuangBaik: register wallet identity\nChain: 11155111\nAddress: ${address.toLowerCase()}\nName: ${name.trim()}\nBio: ${bio.trim()}`;
}

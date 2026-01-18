/**
 * Stacks Address Encoding Helpers
 * 
 * These functions help encode Stacks addresses into the bytes32 format
 * required by Circle's xReserve protocol for cross-chain transfers.
 */

import { c32addressDecode } from 'c32check';

/**
 * Address version bytes for Stacks addresses
 */
export const STACKS_ADDRESS_VERSIONS = {
  // Mainnet
  P: 22,  // Standard principal (starts with 'SP')
  M: 20,  // Multisig (starts with 'SM')
  // Testnet  
  T: 26,  // Standard principal (starts with 'ST')
  N: 21,  // Multisig (starts with 'SN')
} as const;

/**
 * Encode a Stacks address to bytes32 format for xReserve
 * 
 * The format is: 11 bytes of 0x00 padding + 1 byte version + 20 bytes hash
 * Total: 32 bytes
 * 
 * @param stacksAddress - A valid Stacks address (e.g., "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
 * @returns bytes32 hex string (with 0x prefix)
 */
export function encodeStacksAddressToBytes32(stacksAddress: string): `0x${string}` {
  try {
    // Decode the c32 address to get version and hash bytes
    const [version, hash160] = c32addressDecode(stacksAddress);
    
    // Convert version to hex byte
    const versionByte = version.toString(16).padStart(2, '0');
    
    // The hash is already a hex string without 0x prefix
    // It should be 20 bytes (40 hex chars)
    const hashHex = hash160.padStart(40, '0');
    
    // Create 11 bytes of zero padding (22 hex chars)
    const padding = '0'.repeat(22);
    
    // Combine: padding (11 bytes) + version (1 byte) + hash (20 bytes) = 32 bytes
    const bytes32 = `0x${padding}${versionByte}${hashHex}`;
    
    return bytes32 as `0x${string}`;
  } catch (error) {
    throw new Error(`Invalid Stacks address: ${stacksAddress}`);
  }
}

/**
 * Simple encoder for Stacks addresses without external dependencies
 * Uses the manual c32 decoding approach
 */
export function encodeStacksAddressSimple(stacksAddress: string): `0x${string}` {
  // Validate address format
  if (!isValidStacksAddress(stacksAddress)) {
    throw new Error(`Invalid Stacks address format: ${stacksAddress}`);
  }
  
  // Get version byte based on prefix
  const prefix = stacksAddress.substring(0, 2);
  let versionByte: number;
  
  switch (prefix) {
    case 'SP':
      versionByte = 22;
      break;
    case 'SM':
      versionByte = 20;
      break;
    case 'ST':
      versionByte = 26;
      break;
    case 'SN':
      versionByte = 21;
      break;
    default:
      throw new Error(`Unknown Stacks address prefix: ${prefix}`);
  }
  
  // Decode base58check to get the hash160
  const decoded = decodeC32Address(stacksAddress);
  
  // Create padding + version + hash
  const padding = '00'.repeat(11); // 11 zero bytes
  const version = versionByte.toString(16).padStart(2, '0');
  const hash = decoded.hash.padStart(40, '0');
  
  return `0x${padding}${version}${hash}`;
}

/**
 * Validate a Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check prefix (SP, SM for mainnet; ST, SN for testnet)
  const validPrefixes = ['SP', 'SM', 'ST', 'SN'];
  const prefix = address.substring(0, 2);
  
  if (!validPrefixes.includes(prefix)) {
    return false;
  }
  
  // Check length (typically 38-41 characters)
  if (address.length < 38 || address.length > 41) {
    return false;
  }
  
  // Check that remaining characters are valid c32 characters
  const c32Chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const addressBody = address.substring(2).toUpperCase();
  
  for (const char of addressBody) {
    if (!c32Chars.includes(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate an Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check for 0x prefix and 40 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * C32 character set for decoding
 */
const C32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Decode a c32 address to version and hash
 * Simplified implementation for address encoding
 */
function decodeC32Address(address: string): { version: number; hash: string } {
  const addressUpper = address.toUpperCase();
  const prefix = addressUpper.substring(0, 2);
  const body = addressUpper.substring(2);
  
  // Determine version from prefix
  let version: number;
  switch (prefix) {
    case 'SP':
      version = 22;
      break;
    case 'SM':
      version = 20;
      break;
    case 'ST':
      version = 26;
      break;
    case 'SN':
      version = 21;
      break;
    default:
      throw new Error(`Unknown prefix: ${prefix}`);
  }
  
  // Decode c32 to bytes
  const bytes = c32Decode(body);
  
  // The first byte is version (already known), rest is hash160 (20 bytes)
  // Remove the version byte and checksum (last 4 bytes)
  const hash = bytes.slice(1, 21);
  const hashHex = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return { version, hash: hashHex };
}

/**
 * Decode c32 string to byte array
 */
function c32Decode(input: string): Uint8Array {
  // Convert c32 string to number
  let n = BigInt(0);
  for (const char of input) {
    const index = C32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid c32 character: ${char}`);
    }
    n = n * 32n + BigInt(index);
  }
  
  // Convert to bytes
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n = n >> 8n;
  }
  
  // Pad to correct length (version + hash160 + checksum = 25 bytes)
  while (bytes.length < 25) {
    bytes.unshift(0);
  }
  
  return new Uint8Array(bytes);
}

/**
 * Encode an Ethereum address to bytes32 format
 * Simply left-pads the 20-byte address with 12 zero bytes
 */
export function encodeEthereumAddressToBytes32(ethAddress: string): `0x${string}` {
  if (!isValidEthereumAddress(ethAddress)) {
    throw new Error(`Invalid Ethereum address: ${ethAddress}`);
  }
  
  // Remove 0x prefix if present
  const addressHex = ethAddress.toLowerCase().replace('0x', '');
  
  // Left-pad with 12 zero bytes (24 hex chars)
  const padding = '0'.repeat(24);
  
  return `0x${padding}${addressHex}`;
}

/**
 * Format a bytes32 value for display (truncated)
 */
export function formatBytes32(bytes32: string): string {
  if (bytes32.length <= 18) return bytes32;
  return `${bytes32.substring(0, 10)}...${bytes32.substring(bytes32.length - 8)}`;
}

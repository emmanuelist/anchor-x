/**
 * Bridge Withdraw Service
 * 
 * Handles USDCx withdrawals from Stacks to Ethereum (USDCx → USDC)
 * Burns USDCx on Stacks, triggering mint on Ethereum via xReserve
 */

import { 
  openContractCall,
  type ContractCallOptions,
} from '@stacks/connect';
import { 
  uintCV,
  bufferCV,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import type { NetworkEnvironment } from '../constants/contracts';
import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  PROTOCOL_CONSTANTS,
  getStacksContractId,
} from '../constants/contracts';
import { isValidEthereumAddress } from './encoding';

// ============ Types ============

export interface WithdrawParams {
  /** Amount in display units (e.g., "100.00" for 100 USDCx) */
  amount: string;
  /** Ethereum address to receive USDC */
  ethereumRecipient: `0x${string}`;
  /** Stacks address sending USDCx */
  stacksSender: string;
  /** Network environment */
  network?: NetworkEnvironment;
}

export interface WithdrawResult {
  /** Transaction ID on Stacks */
  txId: string;
  /** Amount withdrawn in micro units */
  amount: bigint;
  /** Recipient Ethereum address */
  recipient: `0x${string}`;
}

export type WithdrawStep = 
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'broadcasting'
  | 'pending'
  | 'completed'
  | 'error';

export interface WithdrawProgress {
  step: WithdrawStep;
  txId?: string;
  error?: string;
}

// ============ Helper Functions ============

/**
 * Convert Ethereum address (hex) to buffer for Clarity
 */
function ethereumAddressToBuffer(address: `0x${string}`): Uint8Array {
  // Remove 0x prefix and convert to bytes
  const hexString = address.slice(2);
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Parse amount string to micro units (6 decimals)
 */
function parseAmount(amount: string): bigint {
  const [whole, decimal = ''] = amount.split('.');
  const paddedDecimal = decimal.padEnd(PROTOCOL_CONSTANTS.USDC_DECIMALS, '0').slice(0, PROTOCOL_CONSTANTS.USDC_DECIMALS);
  const microUnits = whole + paddedDecimal;
  return BigInt(microUnits);
}

// ============ Withdraw Functions ============

/**
 * Execute a withdrawal from Stacks to Ethereum
 * 
 * Burns USDCx on Stacks, which triggers USDC mint on Ethereum via xReserve
 * 
 * @param params Withdrawal parameters
 * @param onProgress Callback for progress updates
 * @returns Promise that resolves when tx is submitted
 */
export async function executeWithdraw(
  params: WithdrawParams,
  onProgress?: (progress: WithdrawProgress) => void
): Promise<WithdrawResult> {
  const {
    amount,
    ethereumRecipient,
    stacksSender,
    network = 'testnet',
  } = params;

  // Validate inputs
  if (!isValidEthereumAddress(ethereumRecipient)) {
    throw new Error(`Invalid Ethereum recipient address: ${ethereumRecipient}`);
  }

  onProgress?.({ step: 'preparing' });

  // Parse amount
  const amountMicro = parseAmount(amount);
  
  // Check minimum withdrawal amount (protocol enforced)
  const minWithdraw = await getMinWithdrawAmount(network);
  if (amountMicro < minWithdraw) {
    const minDisplay = (Number(minWithdraw) / 1_000_000).toFixed(2);
    throw new Error(`Minimum withdrawal amount is $${minDisplay} USDCx. The usdcx-v1 contract enforces this minimum.`);
  }
  
  // Get contract details
  const networkType = network === 'mainnet' ? 'mainnet' : 'testnet';
  const usdcxV1Contract = getStacksContractId(networkType, 'usdcxV1');
  const usdcxTokenContract = getStacksContractId(networkType, 'usdcxToken');
  const [usdcxV1Address, usdcxV1Name] = usdcxV1Contract.split('.');

  // Convert Ethereum address to bytes for native-recipient
  const nativeRecipientBuffer = ethereumAddressToBuffer(ethereumRecipient);

  // Note: The burn function in usdcx-v1 burns tokens internally rather than transferring them.
  // The contract itself enforces the correct amount is burned, so we use Allow mode.
  // The contract's internal checks provide security for this operation.

  return new Promise((resolve, reject) => {
    onProgress?.({ step: 'signing' });

    const options: ContractCallOptions = {
      contractAddress: usdcxV1Address,
      contractName: usdcxV1Name,
      functionName: 'burn',
      functionArgs: [
        uintCV(amountMicro),                              // amount
        uintCV(PROTOCOL_CONSTANTS.ETHEREUM_NATIVE_DOMAIN), // native-domain (0 for Ethereum)
        bufferCV(nativeRecipientBuffer),                   // native-recipient (Ethereum address)
      ],
      network: NETWORK_CONFIG[network].stacks.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow, // Allow mode - contract handles burn internally
      postConditions: [], // No external post-conditions needed
      onFinish: (data) => {
        onProgress?.({ step: 'pending', txId: data.txId });
        
        resolve({
          txId: data.txId,
          amount: amountMicro,
          recipient: ethereumRecipient,
        });
      },
      onCancel: () => {
        const error = 'Transaction was cancelled by user';
        onProgress?.({ step: 'error', error });
        reject(new Error(error));
      },
    };

    try {
      const result = openContractCall(options);
      // openContractCall may return void or a Promise
      if (result && typeof result.catch === 'function') {
        result.catch((error: Error) => {
          const errorMessage = error.message || 'Failed to execute withdrawal';
          onProgress?.({ step: 'error', error: errorMessage });
          reject(error);
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to open wallet';
      onProgress?.({ step: 'error', error: errorMessage });
      reject(error);
    }
  });
}

/**
 * Calculate minimum withdrawal amount
 * Returns the minimum amount that can be withdrawn (based on protocol)
 * 
 * The usdcx-v1 contract has a minimum withdrawal amount requirement.
 * As of testnet, this is 4,800,000 micro-units ($4.80 USDC)
 */
export async function getMinWithdrawAmount(
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  // The usdcx-v1 contract enforces a minimum withdrawal amount
  // Testnet: 4,800,000 micro-units ($4.80)
  // This can be queried via get-min-withdrawal-amount read-only function
  return BigInt(4_800_000);
}

/**
 * Get withdrawal fee estimate
 * Returns estimated fee for withdrawal in micro units
 */
export function getWithdrawFeeEstimate(): bigint {
  // Withdrawal fees are typically handled by the xReserve protocol
  // The burn function itself doesn't charge a fee on Stacks
  // But there may be fees on the Ethereum side
  // Return 0 for now as the fee structure depends on xReserve configuration
  return BigInt(0);
}

/**
 * Check if withdrawal amount is valid
 */
export async function validateWithdrawAmount(
  amount: string,
  userBalance: bigint,
  network: NetworkEnvironment = 'testnet'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const amountMicro = parseAmount(amount);
    const minAmount = await getMinWithdrawAmount(network);

    if (amountMicro <= 0n) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (amountMicro < minAmount) {
      const minAmountDisplay = Number(minAmount) / 1_000_000;
      return { valid: false, error: `Minimum withdrawal is ${minAmountDisplay} USDCx` };
    }

    if (amountMicro > userBalance) {
      return { valid: false, error: 'Insufficient USDCx balance' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: 'Invalid amount format' };
  }
}

/**
 * Format micro units to display string
 */
export function formatUSDCx(microUnits: bigint): string {
  const num = Number(microUnits);
  return (num / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Get Stacks explorer URL for transaction
 */
export function getStacksExplorerUrl(
  txId: string,
  network: NetworkEnvironment = 'testnet'
): string {
  const baseUrl = NETWORK_CONFIG[network].stacks.explorerUrl;
  return `${baseUrl}/txid/${txId}`;
}

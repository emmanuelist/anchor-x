/**
 * Bridge Deposit Service
 * 
 * Handles USDC deposits from Ethereum to Stacks (USDC → USDCx)
 * Uses Circle's xReserve protocol
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  custom,
  parseUnits,
  type Hash,
} from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import type { NetworkEnvironment } from '../constants/contracts';
import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  X_RESERVE_ABI,
  ERC20_ABI,
  PROTOCOL_CONSTANTS,
} from '../constants/contracts';
import { encodeStacksAddressToBytes32, isValidStacksAddress } from './encoding';

// ============ Types ============

export interface DepositParams {
  /** Amount in display units (e.g., "100.00" for 100 USDC) */
  amount: string;
  /** Stacks address to receive USDCx */
  stacksRecipient: string;
  /** Ethereum address sending USDC */
  ethereumSender: `0x${string}`;
  /** Network environment */
  network?: NetworkEnvironment;
  /** Maximum fee (in display units, default "0") */
  maxFee?: string;
}

export interface DepositResult {
  /** Approval transaction hash */
  approvalTxHash: Hash | null;
  /** Deposit transaction hash */
  depositTxHash: Hash;
  /** Amount deposited in micro units */
  amount: bigint;
  /** Recipient Stacks address */
  recipient: string;
}

export type DepositStep = 
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'waiting-approval'
  | 'depositing'
  | 'waiting-deposit'
  | 'completed'
  | 'error';

export interface DepositProgress {
  step: DepositStep;
  approvalTxHash?: Hash;
  depositTxHash?: Hash;
  error?: string;
}

// ============ Deposit Functions ============

/**
 * Execute a full deposit flow: approve + deposit
 * 
 * @param params Deposit parameters
 * @param onProgress Callback for progress updates
 * @returns Deposit result with transaction hashes
 */
export async function executeDeposit(
  params: DepositParams,
  onProgress?: (progress: DepositProgress) => void
): Promise<DepositResult> {
  const {
    amount,
    stacksRecipient,
    ethereumSender,
    network = 'testnet',
    maxFee = '0',
  } = params;

  // Validate inputs
  if (!isValidStacksAddress(stacksRecipient)) {
    throw new Error(`Invalid Stacks recipient address: ${stacksRecipient}`);
  }

  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected');
  }

  const chain = network === 'mainnet' ? mainnet : sepolia;
  const expectedChainId = network === 'mainnet' ? 1 : 11155111; // Mainnet or Sepolia
  const rpcUrl = NETWORK_CONFIG[network].ethereum.rpcUrl;
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;

  // Ensure wallet is on the correct chain before proceeding
  try {
    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    
    if (parseInt(currentChainId, 16) !== expectedChainId) {
      console.log(`Switching from chain ${parseInt(currentChainId, 16)} to ${expectedChainId}`);
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added to wallet, try to add it
        if (switchError.code === 4902) {
          const chainConfig = network === 'mainnet' 
            ? {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://ethereum.publicnode.com'],
                blockExplorerUrls: ['https://etherscan.io'],
              }
            : {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              };
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
        } else {
          throw new Error(`Please switch to ${network === 'mainnet' ? 'Ethereum Mainnet' : 'Sepolia Testnet'} in your wallet`);
        }
      }
    }
  } catch (chainError: any) {
    throw new Error(`Network switch failed: ${chainError.message || 'Please manually switch to the correct network'}`);
  }

  // Create clients
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    chain,
    transport: custom(window.ethereum),
    account: ethereumSender,
  });

  // Parse amounts
  const value = parseUnits(amount, PROTOCOL_CONSTANTS.USDC_DECIMALS);
  const maxFeeValue = parseUnits(maxFee, PROTOCOL_CONSTANTS.USDC_DECIMALS);

  // Encode Stacks recipient to bytes32
  const remoteRecipient = encodeStacksAddressToBytes32(stacksRecipient);
  const hookData = '0x' as `0x${string}`;

  let approvalTxHash: Hash | null = null;

  try {
    // Step 1: Check current allowance
    onProgress?.({ step: 'checking-allowance' });
    
    const currentAllowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ethereumSender, xReserveAddress],
    }) as bigint;

    // Step 2: Approve if needed
    if (currentAllowance < value) {
      onProgress?.({ step: 'approving' });

      approvalTxHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [xReserveAddress, value],
        account: ethereumSender,
      });

      onProgress?.({ step: 'waiting-approval', approvalTxHash });

      // Wait for approval confirmation
      await publicClient.waitForTransactionReceipt({ 
        hash: approvalTxHash,
        confirmations: 1,
      });
    }

    // Step 3: Execute deposit
    onProgress?.({ step: 'depositing', approvalTxHash });

    const depositTxHash = await walletClient.writeContract({
      address: xReserveAddress,
      abi: X_RESERVE_ABI,
      functionName: 'depositToRemote',
      args: [
        value,
        PROTOCOL_CONSTANTS.STACKS_DOMAIN_ID,
        remoteRecipient,
        usdcAddress,
        maxFeeValue,
        hookData,
      ],
      account: ethereumSender,
    });

    onProgress?.({ step: 'waiting-deposit', approvalTxHash, depositTxHash });

    // Wait for deposit confirmation
    await publicClient.waitForTransactionReceipt({ 
      hash: depositTxHash,
      confirmations: 1,
    });

    onProgress?.({ step: 'completed', approvalTxHash, depositTxHash });

    return {
      approvalTxHash,
      depositTxHash,
      amount: value,
      recipient: stacksRecipient,
    };

  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error during deposit';
    onProgress?.({ 
      step: 'error', 
      approvalTxHash, 
      error: errorMessage 
    });
    throw error;
  }
}

/**
 * Check if approval is needed before deposit
 */
export async function needsApproval(
  ownerAddress: `0x${string}`,
  amount: string,
  network: NetworkEnvironment = 'testnet'
): Promise<boolean> {
  const chain = network === 'mainnet' ? mainnet : sepolia;
  const rpcUrl = NETWORK_CONFIG[network].ethereum.rpcUrl;
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const value = parseUnits(amount, PROTOCOL_CONSTANTS.USDC_DECIMALS);

  const currentAllowance = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [ownerAddress, xReserveAddress],
  }) as bigint;

  return currentAllowance < value;
}

/**
 * Approve USDC spending for xReserve (separate step)
 */
export async function approveUSDC(
  ownerAddress: `0x${string}`,
  amount: string,
  network: NetworkEnvironment = 'testnet'
): Promise<Hash> {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected');
  }

  const chain = network === 'mainnet' ? mainnet : sepolia;
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;

  const walletClient = createWalletClient({
    chain,
    transport: custom(window.ethereum),
    account: ownerAddress,
  });

  const value = parseUnits(amount, PROTOCOL_CONSTANTS.USDC_DECIMALS);

  return walletClient.writeContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [xReserveAddress, value],
    account: ownerAddress,
  });
}

/**
 * Estimate gas cost for deposit
 */
export async function estimateDepositGas(
  params: DepositParams
): Promise<{ approvalGas: bigint; depositGas: bigint; totalGas: bigint; gasPriceWei: bigint }> {
  const {
    amount,
    stacksRecipient,
    ethereumSender,
    network = 'testnet',
    maxFee = '0',
  } = params;

  const chain = network === 'mainnet' ? mainnet : sepolia;
  const rpcUrl = NETWORK_CONFIG[network].ethereum.rpcUrl;
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const value = parseUnits(amount, PROTOCOL_CONSTANTS.USDC_DECIMALS);
  const maxFeeValue = parseUnits(maxFee, PROTOCOL_CONSTANTS.USDC_DECIMALS);
  const remoteRecipient = encodeStacksAddressToBytes32(stacksRecipient);
  const hookData = '0x' as `0x${string}`;

  // Get gas price
  const gasPriceWei = await publicClient.getGasPrice();

  // Estimate approval gas
  let approvalGas = 0n;
  const needsApprovalCheck = await needsApproval(ethereumSender, amount, network);
  
  if (needsApprovalCheck) {
    try {
      approvalGas = await publicClient.estimateContractGas({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [xReserveAddress, value],
        account: ethereumSender,
      });
    } catch {
      approvalGas = 50000n; // Default estimate
    }
  }

  // Estimate deposit gas
  let depositGas = 150000n; // Default estimate
  try {
    depositGas = await publicClient.estimateContractGas({
      address: xReserveAddress,
      abi: X_RESERVE_ABI,
      functionName: 'depositToRemote',
      args: [
        value,
        PROTOCOL_CONSTANTS.STACKS_DOMAIN_ID,
        remoteRecipient,
        usdcAddress,
        maxFeeValue,
        hookData,
      ],
      account: ethereumSender,
    });
  } catch {
    // Use default estimate
  }

  return {
    approvalGas,
    depositGas,
    totalGas: approvalGas + depositGas,
    gasPriceWei,
  };
}

/**
 * Format gas cost to ETH display string
 */
export function formatGasCost(gas: bigint, gasPriceWei: bigint): string {
  const costWei = gas * gasPriceWei;
  const costEth = Number(costWei) / 1e18;
  return costEth.toFixed(6);
}

/**
 * Enhanced Transaction Notifications
 * Provides rich notifications for bridge operations
 */

import { toast } from 'sonner';

export type TransactionType = 'deposit' | 'withdraw' | 'transfer';
export type TransactionStatus = 'pending' | 'confirming' | 'completed' | 'failed';

interface NotificationOptions {
  txHash?: string;
  amount?: string;
  explorerUrl?: string;
}

/**
 * Show transaction submitted notification
 */
export function notifyTransactionSubmitted(
  type: TransactionType,
  options: NotificationOptions = {}
) {
  const { txHash, amount, explorerUrl } = options;
  
  const titles: Record<TransactionType, string> = {
    deposit: '🚀 Deposit Submitted',
    withdraw: '🔥 Withdrawal Initiated',
    transfer: '📤 Transfer Sent',
  };
  
  const descriptions: Record<TransactionType, string> = {
    deposit: amount ? `Bridging ${amount} USDC to Stacks...` : 'Your USDC is being bridged to Stacks...',
    withdraw: amount ? `Burning ${amount} USDCx...` : 'Your USDCx burn is processing...',
    transfer: amount ? `Sending ${amount} USDCx...` : 'Your transfer is processing...',
  };

  toast(titles[type], {
    description: descriptions[type],
    duration: 5000,
    action: explorerUrl ? {
      label: 'View',
      onClick: () => window.open(explorerUrl, '_blank'),
    } : undefined,
  });
}

/**
 * Show transaction confirming notification
 */
export function notifyTransactionConfirming(
  type: TransactionType,
  options: NotificationOptions = {}
) {
  const { explorerUrl } = options;
  
  const titles: Record<TransactionType, string> = {
    deposit: '⏳ Waiting for Confirmations',
    withdraw: '⏳ Waiting for Attestation',
    transfer: '⏳ Confirming on Stacks',
  };
  
  const descriptions: Record<TransactionType, string> = {
    deposit: 'Transaction confirmed. Waiting for bridge attestation...',
    withdraw: 'Burn confirmed. Circle attestation service is processing...',
    transfer: 'Transaction is being confirmed on Stacks network...',
  };

  toast(titles[type], {
    description: descriptions[type],
    duration: 8000,
    action: explorerUrl ? {
      label: 'Track',
      onClick: () => window.open(explorerUrl, '_blank'),
    } : undefined,
  });
}

/**
 * Show transaction completed notification with celebration
 */
export function notifyTransactionCompleted(
  type: TransactionType,
  options: NotificationOptions = {}
) {
  const { amount, explorerUrl } = options;
  
  const titles: Record<TransactionType, string> = {
    deposit: '🎉 Deposit Complete!',
    withdraw: '🎉 Withdrawal Complete!',
    transfer: '✅ Transfer Complete!',
  };
  
  const descriptions: Record<TransactionType, string> = {
    deposit: amount ? `${amount} USDCx has been minted to your wallet!` : 'USDCx has been minted to your wallet!',
    withdraw: amount ? `${amount} USDC has been released to Ethereum!` : 'USDC has been released to Ethereum!',
    transfer: amount ? `${amount} USDCx successfully sent!` : 'USDCx successfully sent!',
  };

  toast.success(titles[type], {
    description: descriptions[type],
    duration: 10000,
    action: explorerUrl ? {
      label: 'View',
      onClick: () => window.open(explorerUrl, '_blank'),
    } : undefined,
  });
}

/**
 * Show transaction failed notification
 */
export function notifyTransactionFailed(
  type: TransactionType,
  error?: string,
  options: NotificationOptions = {}
) {
  const { explorerUrl } = options;
  
  const titles: Record<TransactionType, string> = {
    deposit: '❌ Deposit Failed',
    withdraw: '❌ Withdrawal Failed',
    transfer: '❌ Transfer Failed',
  };

  toast.error(titles[type], {
    description: error || 'Transaction was rejected or failed. Please try again.',
    duration: 10000,
    action: explorerUrl ? {
      label: 'Details',
      onClick: () => window.open(explorerUrl, '_blank'),
    } : undefined,
  });
}

/**
 * Show wallet connection notification
 */
export function notifyWalletConnected(chain: 'ethereum' | 'stacks', address: string) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const chainName = chain === 'ethereum' ? 'Ethereum' : 'Stacks';
  const emoji = chain === 'ethereum' ? '🔷' : '🟠';
  
  toast.success(`${emoji} ${chainName} Connected`, {
    description: `Wallet ${shortAddress} connected successfully`,
    duration: 4000,
  });
}

/**
 * Show wallet disconnection notification
 */
export function notifyWalletDisconnected(chain?: 'ethereum' | 'stacks') {
  const chainName = chain === 'ethereum' ? 'Ethereum' : chain === 'stacks' ? 'Stacks' : 'All wallets';
  
  toast(`👋 ${chainName} Disconnected`, {
    description: 'You have been disconnected from the wallet',
    duration: 3000,
  });
}

/**
 * Show approval notification
 */
export function notifyApprovalSubmitted(amount: string) {
  toast('🔐 Approval Submitted', {
    description: `Approving ${amount} USDC for bridge contract...`,
    duration: 5000,
  });
}

export function notifyApprovalCompleted(amount: string) {
  toast.success('✅ Approval Complete', {
    description: `${amount} USDC approved. You can now proceed with the deposit.`,
    duration: 5000,
  });
}

/**
 * Show balance update notification
 */
export function notifyBalanceUpdated(token: 'USDC' | 'USDCx', newBalance: string) {
  toast(`💰 Balance Updated`, {
    description: `Your ${token} balance: ${newBalance}`,
    duration: 3000,
  });
}

/**
 * Show network switch notification
 */
export function notifyNetworkSwitch(network: string) {
  toast('🔄 Network Changed', {
    description: `Switched to ${network}`,
    duration: 3000,
  });
}

/**
 * Show copy to clipboard notification
 */
export function notifyCopied(what: string = 'Address') {
  toast.success(`📋 ${what} Copied`, {
    description: 'Copied to clipboard',
    duration: 2000,
  });
}

/**
 * Show error notification
 */
export function notifyError(title: string, description?: string) {
  toast.error(title, {
    description: description || 'An unexpected error occurred',
    duration: 8000,
  });
}

/**
 * Show info notification
 */
export function notifyInfo(title: string, description?: string) {
  toast(title, {
    description,
    duration: 5000,
  });
}

/**
 * Show warning notification
 */
export function notifyWarning(title: string, description?: string) {
  toast.warning(title, {
    description,
    duration: 6000,
  });
}

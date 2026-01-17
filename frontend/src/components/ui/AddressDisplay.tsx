import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { formatAddress } from '@/lib/mockData';
import { toast } from 'sonner';

interface AddressDisplayProps {
  address: string;
  chain?: 'ethereum' | 'stacks';
  className?: string;
  showCopy?: boolean;
  showExternalLink?: boolean;
  truncate?: boolean;
  startChars?: number;
  endChars?: number;
}

export function AddressDisplay({
  address,
  chain = 'ethereum',
  className,
  showCopy = true,
  showExternalLink = false,
  truncate = true,
  startChars = 6,
  endChars = 4,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = truncate 
    ? formatAddress(address, startChars, endChars) 
    : address;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = () => {
    if (chain === 'ethereum') {
      return `https://etherscan.io/address/${address}`;
    }
    return `https://explorer.stacks.co/address/${address}`;
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-sm', className)}>
      <span className="text-muted-foreground">{displayAddress}</span>
      
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
          title="Copy address"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {showExternalLink && (
        <a
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
          title="View in explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}

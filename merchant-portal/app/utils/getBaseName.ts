import { getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

/**
 * Fetches the Base Name for a given wallet address.
 * Returns the base name as a string or null if not found.
 */
export async function getBaseName(address: string): Promise<string | null> {
  try {
    console.log('[BaseName DEBUG] Calling getName with:', { address, base });
    const result = await getName({ address, chain: base });
    console.log('[BaseName DEBUG] getName result:', result);
    if (result && typeof result === 'string') {
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Base Name:', error);
    return null;
  }
}

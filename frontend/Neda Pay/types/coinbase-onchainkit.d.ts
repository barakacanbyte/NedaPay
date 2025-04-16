declare module '@coinbase/onchainkit' {
  import { ReactNode } from 'react';
  import { Config } from 'wagmi';

  // Define the useOnchainKit hook with more specific types
  export function useOnchainKit(): {
    address: string | undefined;
    chain: any;
    connect: (options?: any) => Promise<void>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    isDisconnecting: boolean;
    status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting';
  };

  // Define other exports with more specific types
  export function createConfig(options: any): any;
  export function getDefaultConfig(options: any): any;
  
  // Define OnchainProvider with proper props type
  export interface OnchainProviderProps {
    children: ReactNode;
    config?: any;
  }
  
  export function OnchainProvider(props: OnchainProviderProps): JSX.Element;
}

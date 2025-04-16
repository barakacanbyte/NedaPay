declare module '@coinbase/onchainkit' {
  // Define the useOnchainKit hook
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

  // Define other exports as needed
  export function createConfig(options: any): any;
  export function getDefaultConfig(options: any): any;
  export function OnchainProvider(props: { children: React.ReactNode; config?: any }): JSX.Element;
}

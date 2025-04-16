declare module 'wagmi' {
  import { ReactNode } from 'react';
  import { Config } from '@wagmi/core';

  export interface WagmiProviderProps {
    config: Config;
    children: ReactNode;
  }

  export function WagmiProvider(props: WagmiProviderProps): JSX.Element;
  
  export function createConfig(config: any): Config;
}

declare module 'wagmi/chains' {
  export const baseSepolia: {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: {
      default: {
        http: string[];
      };
      public: {
        http: string[];
      };
    };
    blockExplorers: {
      default: {
        name: string;
        url: string;
      };
    };
    testnet: boolean;
  };
}

declare module 'wagmi/connectors' {
  export function coinbaseWallet(config: { appName: string }): any;
  export function metaMask(): any;
}

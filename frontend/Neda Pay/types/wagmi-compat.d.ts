declare module 'wagmi' {
  import { ReactNode } from 'react';
  
  export interface WagmiConfigProps {
    children: ReactNode;
    config?: any;
  }
  
  export function WagmiConfig(props: WagmiConfigProps): JSX.Element;
  export function WagmiProvider(props: WagmiConfigProps): JSX.Element;
}

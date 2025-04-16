declare module '@coinbase/onchainkit/wagmi' {
  import { Config } from 'wagmi';
  
  export interface OnchainKitConfig {
    wagmiConfig?: Config;
    appName?: string;
  }
  
  export function getDefaultConfig(config: OnchainKitConfig): Config;
}

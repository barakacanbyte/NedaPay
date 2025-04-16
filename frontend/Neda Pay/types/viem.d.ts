declare module 'viem' {
  export type Address = `0x${string}`;
  
  export interface Transport {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
  }
  
  export function http(url: string): Transport;
  
  export interface Chain {
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
  }
}

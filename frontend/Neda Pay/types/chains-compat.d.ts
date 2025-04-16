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

  export const base: {
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

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: string;
    NEXT_PUBLIC_CHAIN_ID: string;
    NEXT_PUBLIC_TSHC_ADDRESS: string;
    NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: string;
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: string;
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}

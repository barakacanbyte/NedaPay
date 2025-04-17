// Global wallet state management

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  signature: string | null;
}

// Default empty state
const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  signature: null
};

// Save wallet state to localStorage
export const saveWalletState = (state: WalletState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('wallet_state', JSON.stringify(state));
    console.log('Wallet state saved:', state);
    
    // Dispatch a custom event to notify other components of the state change
    window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: state }));
  } catch (error) {
    console.error('Error saving wallet state:', error);
  }
};

// Load wallet state from localStorage
export const loadWalletState = (): WalletState => {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const stateJson = localStorage.getItem('wallet_state');
    if (!stateJson) return initialState;
    
    const state = JSON.parse(stateJson) as WalletState;
    console.log('Wallet state loaded:', state);
    return state;
  } catch (error) {
    console.error('Error loading wallet state:', error);
    return initialState;
  }
};

// Clear wallet state from localStorage
export const clearWalletState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('wallet_state');
    console.log('Wallet state cleared');
    
    // Dispatch a custom event to notify other components of the state change
    window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: initialState }));
  } catch (error) {
    console.error('Error clearing wallet state:', error);
  }
};

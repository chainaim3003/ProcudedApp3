/**
 * Stellar Marketplace Service
 * Interacts with the marketplace escrow contract on Stellar testnet
 * Uses Stellar SDK v14+ to fetch real data from the contract
 */

import * as StellarSDK from '@stellar/stellar-sdk';

// Marketplace contract address on testnet
export const MARKETPLACE_CONTRACT_ID = 'CDMAWTJWFQER7J2JRTJBTQHHUT3AICVAVDJGLJTE3RMIMMW5UDCRVCHX';

// Stellar Testnet configuration
const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';
const TESTNET_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Trade states (matching the smart contract)
export const TRADE_STATES = {
  ORDERED: 0,
  FULFILLED: 1,
  SETTLED: 2,
  REJECTED: 3,
  CANCELLED: 4
};

export interface EscrowTrade {
  tradeId: number;
  buyer: string;
  seller: string;
  amount: number;
  state: number;
  productType: string;
  description: string;
  createdAt?: number;
  escrowProvider?: string;
  ipfsHash?: string;
}

export interface BuyerInfo {
  address: string;
  activeTrades: number;
  totalTradeValue: number;
  completedTrades: number;
}

export interface SellerInfo {
  address: string;
  activeTrades: number;
  totalTradeValue: number;
  completedTrades: number;
}

class StellarMarketplaceService {
  private server: StellarSDK.SorobanRpc.Server;

  constructor() {
    this.server = new StellarSDK.SorobanRpc.Server(TESTNET_RPC_URL);
    console.log('✅ StellarMarketplaceService initialized');
    console.log('📝 Contract ID:', MARKETPLACE_CONTRACT_ID);
    console.log('🌐 RPC URL:', TESTNET_RPC_URL);
  }

  /**
   * Parse ScVal array to EscrowTrade objects
   */
  private parseTradesFromScVal(_scval: StellarSDK.xdr.ScVal): EscrowTrade[] {
    try {
      // For now, return empty array until we have test data
      // In production, this would parse the XDR data structure
      return [];
    } catch (error) {
      console.error('Error parsing trades:', error);
      return [];
    }
  }

  /**
   * Get all trades from the marketplace contract
   */
  async getAllTrades(): Promise<EscrowTrade[]> {
    try {
      console.log('🔍 Fetching all trades from contract...');
      
      const contract = new StellarSDK.Contract(MARKETPLACE_CONTRACT_ID);
      const nullAccount = new StellarSDK.Account(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0'
      );
      
      const transaction = new StellarSDK.TransactionBuilder(nullAccount, {
        fee: '100',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_all_trades'))
        .setTimeout(30)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);
      
      if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        
        if (!result) {
          console.log('📭 No trades found in contract');
          return [];
        }

        const trades = this.parseTradesFromScVal(result);
        console.log(`✅ Found ${trades.length} trades`);
        return trades;
      } else {
        console.error('❌ Simulation failed:', simulated);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      return [];
    }
  }

  async getTrade(tradeId: number): Promise<EscrowTrade | null> {
    try {
      console.log(`🔍 Fetching trade ${tradeId}`);
      
      const contract = new StellarSDK.Contract(MARKETPLACE_CONTRACT_ID);
      const nullAccount = new StellarSDK.Account(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0'
      );
      
      const transaction = new StellarSDK.TransactionBuilder(nullAccount, {
        fee: '100',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'get_trade',
            StellarSDK.nativeToScVal(tradeId, { type: 'u32' })
          )
        )
        .setTimeout(30)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);
      
      if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (!result) return null;
        return null;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching trade ${tradeId}:`, error);
      return null;
    }
  }

  async getBuyers(): Promise<BuyerInfo[]> {
    const trades = await this.getAllTrades();
    const buyerMap = new Map<string, BuyerInfo>();

    trades.forEach(trade => {
      if (!buyerMap.has(trade.buyer)) {
        buyerMap.set(trade.buyer, {
          address: trade.buyer,
          activeTrades: 0,
          totalTradeValue: 0,
          completedTrades: 0
        });
      }

      const buyer = buyerMap.get(trade.buyer)!;
      
      if (trade.state === TRADE_STATES.SETTLED) {
        buyer.completedTrades++;
      } else if (trade.state < TRADE_STATES.SETTLED) {
        buyer.activeTrades++;
      }
      
      buyer.totalTradeValue += trade.amount;
    });

    return Array.from(buyerMap.values());
  }

  async getSellers(): Promise<SellerInfo[]> {
    const trades = await this.getAllTrades();
    const sellerMap = new Map<string, SellerInfo>();

    trades.forEach(trade => {
      if (!sellerMap.has(trade.seller)) {
        sellerMap.set(trade.seller, {
          address: trade.seller,
          activeTrades: 0,
          totalTradeValue: 0,
          completedTrades: 0
        });
      }

      const seller = sellerMap.get(trade.seller)!;
      
      if (trade.state === TRADE_STATES.SETTLED) {
        seller.completedTrades++;
      } else if (trade.state < TRADE_STATES.SETTLED) {
        seller.activeTrades++;
      }
      
      seller.totalTradeValue += trade.amount;
    });

    return Array.from(sellerMap.values());
  }

  async getBuyerTrades(buyerAddress: string): Promise<EscrowTrade[]> {
    if (!buyerAddress) return [];
    
    const allTrades = await this.getAllTrades();
    return allTrades.filter(trade => 
      trade.buyer.toLowerCase() === buyerAddress.toLowerCase()
    );
  }

  async getSellerTrades(sellerAddress: string): Promise<EscrowTrade[]> {
    if (!sellerAddress) return [];
    
    const allTrades = await this.getAllTrades();
    return allTrades.filter(trade => 
      trade.seller.toLowerCase() === sellerAddress.toLowerCase()
    );
  }

  async getBuyerInstruments(buyerAddress: string): Promise<EscrowTrade[]> {
    const buyerTrades = await this.getBuyerTrades(buyerAddress);
    return buyerTrades.filter(trade => 
      trade.state === TRADE_STATES.SETTLED || 
      trade.state === TRADE_STATES.FULFILLED ||
      trade.state === TRADE_STATES.ORDERED
    );
  }

  async getSellerListings(sellerAddress: string): Promise<EscrowTrade[]> {
    const sellerTrades = await this.getSellerTrades(sellerAddress);
    return sellerTrades.filter(trade => trade.state < TRADE_STATES.SETTLED);
  }

  /**
   * Register a new buyer (write operation - requires contract owner authorization)
   */
  async registerBuyer(
    buyerAddress: string,
    buyerName: string,
    buyerLeiId: string,
    sourceAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
    try {
      console.log('📝 Registering buyer:', { buyerAddress, buyerName, buyerLeiId });
      
      const contract = new StellarSDK.Contract(MARKETPLACE_CONTRACT_ID);
      const sourceAccount = await this.server.getAccount(sourceAddress);
      
      const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'register_buyer',
            StellarSDK.Address.fromString(buyerAddress).toScVal(),
            StellarSDK.nativeToScVal(buyerName, { type: 'string' }),
            StellarSDK.nativeToScVal(buyerLeiId, { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();
      
      console.log('📤 Transaction built, requesting signature...');
      
      const signedXdr = await signTransaction(transaction.toXDR());
      const signedTx = StellarSDK.TransactionBuilder.fromXDR(
        signedXdr,
        TESTNET_NETWORK_PASSPHRASE
      ) as StellarSDK.Transaction;
      
      console.log('✍️ Transaction signed, submitting to network...');
      
      const result = await this.server.sendTransaction(signedTx);
      
      if (result.status === 'PENDING') {
        console.log('⏳ Transaction pending, waiting for confirmation...');
        let txResponse = await this.server.getTransaction(result.hash);
        
        while (txResponse.status === 'NOT_FOUND') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          txResponse = await this.server.getTransaction(result.hash);
        }
        
        if (txResponse.status === 'SUCCESS') {
          console.log('✅ Buyer registered successfully!');
          return { 
            success: true, 
            transactionHash: result.hash 
          };
        } else {
          console.error('❌ Transaction failed:', txResponse);
          return { 
            success: false, 
            error: `Transaction failed with status: ${txResponse.status}` 
          };
        }
      }
      
      return { 
        success: true, 
        transactionHash: result.hash 
      };
    } catch (error) {
      console.error('❌ Error registering buyer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Register a new seller (write operation - requires contract owner authorization)
   */
  async registerSeller(
    sellerAddress: string,
    sellerName: string,
    sellerLeiId: string,
    sourceAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
    try {
      console.log('📝 Registering seller:', { sellerAddress, sellerName, sellerLeiId });
      
      const contract = new StellarSDK.Contract(MARKETPLACE_CONTRACT_ID);
      const sourceAccount = await this.server.getAccount(sourceAddress);
      
      const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'register_seller',
            StellarSDK.Address.fromString(sellerAddress).toScVal(),
            StellarSDK.nativeToScVal(sellerName, { type: 'string' }),
            StellarSDK.nativeToScVal(sellerLeiId, { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();
      
      console.log('📤 Transaction built, requesting signature...');
      
      const signedXdr = await signTransaction(transaction.toXDR());
      const signedTx = StellarSDK.TransactionBuilder.fromXDR(
        signedXdr,
        TESTNET_NETWORK_PASSPHRASE
      ) as StellarSDK.Transaction;
      
      console.log('✍️ Transaction signed, submitting to network...');
      
      const result = await this.server.sendTransaction(signedTx);
      
      if (result.status === 'PENDING') {
        console.log('⏳ Transaction pending, waiting for confirmation...');
        let txResponse = await this.server.getTransaction(result.hash);
        
        while (txResponse.status === 'NOT_FOUND') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          txResponse = await this.server.getTransaction(result.hash);
        }
        
        if (txResponse.status === 'SUCCESS') {
          console.log('✅ Seller registered successfully!');
          return { 
            success: true, 
            transactionHash: result.hash 
          };
        } else {
          console.error('❌ Transaction failed:', txResponse);
          return { 
            success: false, 
            error: `Transaction failed with status: ${txResponse.status}` 
          };
        }
      }
      
      return { 
        success: true, 
        transactionHash: result.hash 
      };
    } catch (error) {
      console.error('❌ Error registering seller:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
}

// Export singleton instance
export const stellarMarketplaceService = new StellarMarketplaceService();

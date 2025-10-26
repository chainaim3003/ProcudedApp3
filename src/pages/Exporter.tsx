/**
 * Seller (Exporter) Screen - Stellar Version
 * NO MOCK DATA - All data fetched from Stellar contract
 */
import React, { useState, useEffect } from 'react'
import { Layout, Text } from "@stellar/design-system"
import { stellarMarketplaceService, TRADE_STATES, EscrowTrade, MARKETPLACE_CONTRACT_ID } from '../services/stellarMarketplace'

// ==================== INTERFACES ====================

interface ConnectedWallet {
  address: string;
  isConnected: boolean;
}

// ==================== UTILITIES ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

const getStateLabel = (state: number): { label: string; color: string } => {
  const states: { [key: number]: { label: string; color: string } } = {
    0: { label: 'Created - Awaiting Funding', color: 'bg-yellow-100 text-yellow-800' },
    1: { label: 'Escrowed - Funded', color: 'bg-blue-100 text-blue-800' },
    2: { label: 'Executed', color: 'bg-green-100 text-green-800' },
    3: { label: 'Payment Acknowledged', color: 'bg-purple-100 text-purple-800' },
    4: { label: 'Expired', color: 'bg-gray-100 text-gray-800' },
    5: { label: 'Completed', color: 'bg-green-100 text-green-800' }
  };
  return states[state] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
}

// ==================== MAIN COMPONENT ====================

export default function Exporter() {
  // Wallet state - This should come from wallet provider context
  const [wallet, setWallet] = useState<ConnectedWallet>({ address: '', isConnected: false })
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'my-listings' | 'all-trades'>('my-listings')
  
  // Seller data state - NO MOCK DATA
  const [myListings, setMyListings] = useState<EscrowTrade[]>([])
  const [allSellerTrades, setAllSellerTrades] = useState<EscrowTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ==================== EFFECTS ====================

  // Load real data when wallet connects
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      loadSellerData()
    } else {
      // Clear data when wallet disconnects
      setMyListings([])
      setAllSellerTrades([])
    }
  }, [wallet.address, wallet.isConnected])

  // ==================== DATA LOADING - NO MOCK DATA ====================

  const loadSellerData = async () => {
    if (!wallet.address) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📡 Loading seller data for:', wallet.address)

      // Fetch real active listings from contract
      const listings = await stellarMarketplaceService.getSellerListings(wallet.address)
      console.log(`✅ Loaded ${listings.length} active listings`)
      setMyListings(listings)

      // Fetch all seller trades (including completed)
      const allTrades = await stellarMarketplaceService.getSellerTrades(wallet.address)
      console.log(`✅ Loaded ${allTrades.length} total seller trades`)
      setAllSellerTrades(allTrades)

    } catch (err) {
      console.error('❌ Error loading seller data:', err)
      setError('Failed to load your trades from the contract')
    } finally {
      setLoading(false)
    }
  }

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadSellerData()
  }

  const handleConnectWallet = () => {
    // This should integrate with actual wallet connection
    // For now, show message that wallet integration is needed
    setError('Wallet integration required. Please implement wallet connection.')
  }

  // ==================== RENDER ====================

  return (
    <Layout.Content>
      <Layout.Inset>
        <div style={{ padding: '2rem' }}>
          <Text as="h1" size="xl" style={{ marginBottom: '0.5rem' }}>
            📦 Seller (Exporter) Screen
          </Text>
          <Text as="p" size="md" style={{ marginBottom: '1rem', color: '#666' }}>
            Manage your trade listings and sales from Stellar blockchain
          </Text>
          <Text as="p" size="sm" style={{ marginBottom: '2rem', color: '#999', fontFamily: 'monospace' }}>
            Contract: {MARKETPLACE_CONTRACT_ID}
          </Text>

          {/* Wallet Connection Status */}
          {!wallet.isConnected ? (
            <div style={{ 
              padding: '2rem', 
              background: '#fef3c7', 
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🔌</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 'bold', color: '#78350f', marginBottom: '0.5rem' }}>
                    Wallet Connection Required
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '1rem' }}>
                    Connect your Stellar wallet to view your trade listings and manage your sales.
                    All data is fetched directly from the Stellar blockchain contract.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#d97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Wallet Info */}
              <div style={{
                padding: '1rem',
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#059669', marginRight: '0.5rem' }}>✓</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#065f46' }}>Connected:</span>
                    <code style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      background: '#a7f3d0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                    </code>
                  </div>
                  <button
                    onClick={handleRefresh}
                    style={{
                      fontSize: '0.875rem',
                      color: '#047857',
                      background: 'none',
                      border: 'none',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div style={{
                  padding: '1rem',
                  background: '#d1fae5',
                  border: '1px solid #6ee7b7',
                  color: '#065f46',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  {success}
                </div>
              )}

              {error && (
                <div style={{
                  padding: '1rem',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}

              {/* Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                borderBottom: '2px solid #e5e7eb',
                marginBottom: '2rem'
              }}>
                <button
                  onClick={() => setActiveTab('my-listings')}
                  style={{
                    padding: '1rem 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'my-listings' ? '3px solid #3b82f6' : 'none',
                    color: activeTab === 'my-listings' ? '#3b82f6' : '#666',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🏪 My Active Listings ({myListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('all-trades')}
                  style={{
                    padding: '1rem 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'all-trades' ? '3px solid #3b82f6' : 'none',
                    color: activeTab === 'all-trades' ? '#3b82f6' : '#666',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📊 All My Trades ({allSellerTrades.length})
                </button>
              </div>

              {/* MY ACTIVE LISTINGS TAB */}
              {activeTab === 'my-listings' && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      🏪 My Active Listings
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      Trades where you are the seller that are still pending (from Stellar contract)
                    </p>
                  </div>

                  {/* Loading State */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ 
                        width: '3rem',
                        height: '3rem',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                      }}></div>
                      <p style={{ color: '#666' }}>Loading your listings from contract...</p>
                    </div>
                  ) : myListings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        No active listings
                      </h3>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                        You don't have any active trade listings in the marketplace contract.
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                        Create a trade listing to see it appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {myListings.map((listing) => {
                        const stateInfo = getStateLabel(listing.state);
                        return (
                          <div
                            key={listing.tradeId}
                            style={{
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderLeft: '4px solid #3b82f6',
                              borderRadius: '8px',
                              padding: '1.5rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    Trade #{listing.tradeId}
                                  </h3>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }} className={stateInfo.color}>
                                    {stateInfo.label}
                                  </span>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    {listing.productType}
                                  </span>
                                </div>
                                <p style={{ color: '#666', marginBottom: '0.75rem' }}>{listing.description}</p>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    <strong>Buyer:</strong>{' '}
                                    <code style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                                      {listing.buyer.slice(0, 8)}...{listing.buyer.slice(-8)}
                                    </code>
                                  </div>
                                  <div>
                                    <strong>Created:</strong> {formatDate(listing.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', marginLeft: '1.5rem' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
                                  {formatCurrency(listing.amount)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>USD</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary Stats */}
                  {!loading && myListings.length > 0 && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                      borderRadius: '8px',
                      border: '1px solid #93c5fd'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📊 Listings Summary
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Active Listings</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{myListings.length}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Total Value</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                            {formatCurrency(myListings.reduce((sum, l) => sum + l.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Awaiting Funding</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {myListings.filter(l => l.state === TRADE_STATES.CREATED).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ALL MY TRADES TAB */}
              {activeTab === 'all-trades' && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      📊 All My Trades
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      Complete history of trades where you are the seller (from Stellar contract)
                    </p>
                  </div>

                  {/* Loading State */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ 
                        width: '3rem',
                        height: '3rem',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                      }}></div>
                      <p style={{ color: '#666' }}>Loading your trade history from contract...</p>
                    </div>
                  ) : allSellerTrades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        No trades found
                      </h3>
                      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                        You don't have any trades in the marketplace contract yet.
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                        Create a trade to see it appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {allSellerTrades.map((trade) => {
                        const stateInfo = getStateLabel(trade.state);
                        return (
                          <div
                            key={trade.tradeId}
                            style={{
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '1.25rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Trade #{trade.tradeId}</h4>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }} className={stateInfo.color}>
                                    {stateInfo.label}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>{trade.description}</p>
                              </div>
                              <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                  {formatCurrency(trade.amount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary Stats */}
                  {!loading && allSellerTrades.length > 0 && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%)',
                      borderRadius: '8px',
                      border: '1px solid #c4b5fd'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📊 Trade History Summary
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Total Trades</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{allSellerTrades.length}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Total Revenue</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                            {formatCurrency(allSellerTrades.reduce((sum, t) => sum + t.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Completed</p>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                            {allSellerTrades.filter(t => t.state === TRADE_STATES.COMPLETED).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

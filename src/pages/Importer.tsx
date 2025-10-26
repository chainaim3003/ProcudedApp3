/**
 * Buyer (Importer) Screen - Stellar Version
 * NO MOCK DATA - All data fetched from Stellar contract
 */

import React, { useState, useEffect } from 'react'
import { Layout } from "@stellar/design-system"
import { stellarMarketplaceService, TRADE_STATES, EscrowTrade, MARKETPLACE_CONTRACT_ID } from '../services/stellarMarketplace'
import './Importer.css'

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

const getStateLabel = (state: number): string => {
  const labels: { [key: number]: string } = {
    0: 'Created',
    1: 'Escrowed',
    2: 'Executed',
    3: 'Payment Acknowledged',
    4: 'Expired',
    5: 'Completed'
  };
  return labels[state] || 'Unknown';
}

// ==================== MAIN COMPONENT ====================

export default function Importer() {
  // Wallet state - This should come from wallet provider context
  const [wallet, setWallet] = useState<ConnectedWallet>({ address: '', isConnected: false })
  
  // Tab state
  const [currentTab, setCurrentTab] = useState<'purchases' | 'my-trades'>('my-trades')

  // Purchases state - NO MOCK DATA
  const [purchasedInstruments, setPurchasedInstruments] = useState<EscrowTrade[]>([])
  const [myTrades, setMyTrades] = useState<EscrowTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ==================== EFFECTS ====================

  // Load real data when wallet connects
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      loadBuyerData()
    } else {
      // Clear data when wallet disconnects
      setPurchasedInstruments([])
      setMyTrades([])
    }
  }, [wallet.address, wallet.isConnected])

  // ==================== DATA LOADING - NO MOCK DATA ====================

  const loadBuyerData = async () => {
    if (!wallet.address) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📡 Loading buyer data for:', wallet.address)

      // Fetch real purchased instruments from contract
      const instruments = await stellarMarketplaceService.getBuyerInstruments(wallet.address)
      console.log(`✅ Loaded ${instruments.length} purchased instruments`)
      setPurchasedInstruments(instruments)

      // Fetch all buyer trades (including pending)
      const allBuyerTrades = await stellarMarketplaceService.getBuyerTrades(wallet.address)
      console.log(`✅ Loaded ${allBuyerTrades.length} total trades`)
      setMyTrades(allBuyerTrades)

    } catch (err) {
      console.error('❌ Error loading buyer data:', err)
      setError('Failed to load your trades from the contract')
    } finally {
      setLoading(false)
    }
  }

  // ==================== HANDLERS ====================

  const handleRefresh = () => {
    loadBuyerData()
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
        <div className="importer-page min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏪 Buyer (Importer) Screen
              </h1>
              <p className="text-gray-600 mb-3">
                View your trade purchases and instruments from Stellar blockchain
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Contract: {MARKETPLACE_CONTRACT_ID}
              </p>
            </div>

            {/* Wallet Connection Status */}
            {!wallet.isConnected ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🔌</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Wallet Connection Required
                    </h3>
                    <p className="text-sm text-yellow-800 mb-4">
                      Connect your Stellar wallet to view your purchased instruments and trades.
                      All data is fetched directly from the Stellar blockchain contract.
                    </p>
                    <button
                      onClick={handleConnectWallet}
                      className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Wallet Info */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm font-medium text-green-800">Connected:</span>
                      <code className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                      </code>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="text-sm text-green-700 hover:text-green-900 font-medium"
                    >
                      🔄 Refresh Data
                    </button>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                  <nav className="flex space-x-8 px-6 border-b border-gray-200">
                    <button
                      onClick={() => setCurrentTab('my-trades')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        currentTab === 'my-trades'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📊 My Trades ({myTrades.length})
                    </button>
                    <button
                      onClick={() => setCurrentTab('purchases')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        currentTab === 'purchases'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📦 Purchased Instruments ({purchasedInstruments.length})
                    </button>
                  </nav>
                </div>

                {/* MY TRADES TAB */}
                {currentTab === 'my-trades' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          📊 My Trades
                        </h2>
                        <p className="text-sm text-gray-500">
                          All trades where you are the buyer (from Stellar contract)
                        </p>
                      </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your trades from contract...</p>
                      </div>
                    ) : myTrades.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No trades found</h3>
                        <p className="text-gray-500 mb-4">
                          You don't have any trades in the marketplace contract yet.
                        </p>
                        <p className="text-sm text-gray-400">
                          Create a trade to see it appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myTrades.map((trade) => (
                          <div
                            key={trade.tradeId}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Trade #{trade.tradeId}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    trade.state === TRADE_STATES.COMPLETED ? 'bg-green-100 text-green-800' :
                                    trade.state === TRADE_STATES.ESCROWED ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {getStateLabel(trade.state)}
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {trade.productType}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-3">{trade.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Seller:</span>
                                    <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                      {trade.seller.slice(0, 6)}...{trade.seller.slice(-6)}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Created:</span>
                                    <span className="ml-2 font-medium">{formatDate(trade.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-6">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                  {formatCurrency(trade.amount)}
                                </div>
                                <div className="text-xs text-gray-500">USD Value</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary Stats */}
                    {!loading && myTrades.length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                          📊 Trade Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Trades</p>
                            <p className="text-2xl font-bold text-gray-900">{myTrades.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Value</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(myTrades.reduce((sum, t) => sum + t.amount, 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Completed</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {myTrades.filter(t => t.state === TRADE_STATES.COMPLETED).length}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PURCHASED INSTRUMENTS TAB */}
                {currentTab === 'purchases' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          📦 My Purchased Instruments
                        </h2>
                        <p className="text-sm text-gray-500">
                          Completed and escrowed trades (from Stellar contract)
                        </p>
                      </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your instruments from contract...</p>
                      </div>
                    ) : purchasedInstruments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No purchased instruments yet</h3>
                        <p className="text-gray-500 mb-4">
                          You don't have any completed or escrowed trades in the contract yet.
                        </p>
                        <p className="text-sm text-gray-400">
                          Complete a trade to see your purchased instruments here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchasedInstruments.map((instrument) => (
                          <div
                            key={instrument.tradeId}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {getStateLabel(instrument.state)}
                                  </span>
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {instrument.productType}
                                  </span>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {instrument.description}
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-600">
                                    <strong>Trade ID:</strong> #{instrument.tradeId}
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Seller:</strong>{' '}
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {instrument.seller.slice(0, 8)}...{instrument.seller.slice(-8)}
                                    </code>
                                  </p>
                                  <p className="text-gray-600">
                                    <strong>Created:</strong> {formatDate(instrument.createdAt)}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right ml-6">
                                <p className="text-3xl font-bold text-green-600 mb-2">
                                  {formatCurrency(instrument.amount)}
                                </p>
                                <div className="text-xs text-gray-500">Purchase Value</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary Stats */}
                    {!loading && purchasedInstruments.length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                          📊 Portfolio Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Instruments</p>
                            <p className="text-2xl font-bold text-gray-900">{purchasedInstruments.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Value</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatCurrency(purchasedInstruments.reduce((sum, i) => sum + i.amount, 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Product Types</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {new Set(purchasedInstruments.map(i => i.productType)).size}
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
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

/**
 * Marketplace - Stellar Version with Real Contract Integration
 */
import React, { useState, useEffect } from 'react'
import { Layout, Text } from "@stellar/design-system"
import { stellarMarketplaceService, TRADE_STATES, EscrowTrade, MARKETPLACE_CONTRACT_ID } from '../services/stellarMarketplace'

export default function Marketplace() {
  const [trades, setTrades] = useState<EscrowTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'awaiting' | 'escrowed' | 'all'>('awaiting')

  useEffect(() => {
    loadTrades()
  }, [])

  const loadTrades = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('📡 Loading trades from Stellar contract...')
      
      const tradesData = await stellarMarketplaceService.getAllTrades()
      setTrades(tradesData)
      
      console.log(`✅ Loaded ${tradesData.length} trades from contract`)
    } catch (err) {
      console.error('❌ Error loading trades:', err)
      setError('Failed to load trades from contract. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades.filter(trade => {
    if (activeTab === 'awaiting') return trade.state === TRADE_STATES.CREATED
    if (activeTab === 'escrowed') return trade.state === TRADE_STATES.ESCROWED
    return true
  })

  const handleFund = async (tradeId: number) => {
    alert(`Funding trade #${tradeId} - Integration with wallet coming soon`)
    // Wallet integration would go here
  }

  if (loading) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <Text as="p" size="lg">Loading trades from Stellar contract...</Text>
            <Text as="p" size="sm" style={{ color: '#666', marginTop: '0.5rem' }}>
              Contract: {MARKETPLACE_CONTRACT_ID}
            </Text>
          </div>
        </Layout.Inset>
      </Layout.Content>
    )
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <div style={{ padding: '2rem' }}>
          <Text as="h1" size="xl" style={{ marginBottom: '0.5rem' }}>
            💰 Marketplace Escrow
          </Text>
          <Text as="p" size="md" style={{ marginBottom: '1rem', color: '#666' }}>
            Secure trade financing with smart contract escrow protection
          </Text>
          <Text as="p" size="sm" style={{ marginBottom: '2rem', color: '#999', fontFamily: 'monospace' }}>
            Contract: {MARKETPLACE_CONTRACT_ID}
          </Text>

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee', 
              border: '1px solid #fcc',
              borderRadius: '8px',
              marginBottom: '2rem',
              color: '#c00'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
                {trades.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Trades</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
                {trades.filter(t => t.state === TRADE_STATES.CREATED).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Awaiting Funding</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {trades.filter(t => t.state === TRADE_STATES.ESCROWED).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>In Escrow</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('awaiting')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'awaiting' ? '3px solid #6366f1' : 'none',
                color: activeTab === 'awaiting' ? '#6366f1' : '#666',
                fontWeight: activeTab === 'awaiting' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              💵 Awaiting Funding ({trades.filter(t => t.state === TRADE_STATES.CREATED).length})
            </button>
            <button
              onClick={() => setActiveTab('escrowed')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'escrowed' ? '3px solid #6366f1' : 'none',
                color: activeTab === 'escrowed' ? '#6366f1' : '#666',
                fontWeight: activeTab === 'escrowed' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              🔒 Escrowed ({trades.filter(t => t.state === TRADE_STATES.ESCROWED).length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'all' ? '3px solid #6366f1' : 'none',
                color: activeTab === 'all' ? '#6366f1' : '#666',
                fontWeight: activeTab === 'all' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              📊 All Trades ({trades.length})
            </button>
          </div>

          {/* Trades List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredTrades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <Text as="p" size="md" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  No trades in this category
                </Text>
                <Text as="p" size="sm" style={{ color: '#666' }}>
                  {trades.length === 0 
                    ? 'No trades have been created in the contract yet.'
                    : 'Switch tabs to view other trade categories.'}
                </Text>
              </div>
            ) : (
              filteredTrades.map((trade) => (
                <div
                  key={trade.tradeId}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #6366f1',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Trade #{trade.tradeId}
                      </h3>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                      }}>
                        {trade.productType}
                      </div>
                      <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        {trade.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
                        ${trade.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>USD</div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                        Buyer
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {trade.buyer.slice(0, 4)}...{trade.buyer.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                        Seller
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {trade.seller.slice(0, 4)}...{trade.seller.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                        Status
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {trade.state === TRADE_STATES.CREATED ? 'Created' : 
                         trade.state === TRADE_STATES.ESCROWED ? 'Escrowed' : 
                         trade.state === TRADE_STATES.COMPLETED ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      📊 View Details
                    </button>
                    
                    {trade.state === TRADE_STATES.CREATED && (
                      <button
                        onClick={() => handleFund(trade.tradeId)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        💰 Fund Escrow
                      </button>
                    )}

                    {trade.state === TRADE_STATES.ESCROWED && (
                      <button
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Execute Trade
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

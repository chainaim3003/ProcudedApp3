/**
 * Marketplace - Simplified Version
 */
import React, { useState, useEffect } from 'react'
import { Layout, Text } from "@stellar/design-system"

const TRADE_STATES = {
  CREATED: 0,
  ESCROWED: 1,
  EXECUTED: 2,
}

interface EscrowTrade {
  tradeId: number
  buyer: string
  seller: string
  amount: number
  state: number
  productType: string
  description: string
}

export default function Marketplace() {
  const [trades, setTrades] = useState<EscrowTrade[]>([])
  const [activeTab, setActiveTab] = useState<'awaiting' | 'escrowed' | 'all'>('awaiting')

  useEffect(() => {
    const mockTrades: EscrowTrade[] = [
      {
        tradeId: 101,
        buyer: 'GB...XYZ',
        seller: 'GC...ABC',
        amount: 150000,
        state: TRADE_STATES.CREATED,
        productType: 'Textiles',
        description: 'Cotton Fabric Export - 10 tons',
      },
      {
        tradeId: 102,
        buyer: 'GB...XYZ',
        seller: 'GC...DEF',
        amount: 75000,
        state: TRADE_STATES.CREATED,
        productType: 'Food-Tea',
        description: 'Premium Tea Export - 2 tons',
      },
      {
        tradeId: 103,
        buyer: 'GB...XYZ',
        seller: 'GC...GHI',
        amount: 200000,
        state: TRADE_STATES.ESCROWED,
        productType: 'Electronics',
        description: 'Electronics Components - Bulk',
      }
    ]
    setTrades(mockTrades)
  }, [])

  const filteredTrades = trades.filter(trade => {
    if (activeTab === 'awaiting') return trade.state === TRADE_STATES.CREATED
    if (activeTab === 'escrowed') return trade.state === TRADE_STATES.ESCROWED
    return true
  })

  const handleFund = async (tradeId: number) => {
    alert(`Funding trade #${tradeId} - This is a demo`)
    setTrades(prev => prev.map(t => 
      t.tradeId === tradeId ? { ...t, state: TRADE_STATES.ESCROWED } : t
    ))
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <div style={{ padding: '2rem' }}>
          <Text as="h1" size="xl" style={{ marginBottom: '1rem' }}>
            💰 Escrow V5 Marketplace
          </Text>
          <Text as="p" size="md" style={{ marginBottom: '2rem', color: '#666' }}>
            Secure trade financing with smart contract escrow protection
          </Text>

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
                <Text as="p" size="md">No trades in this category</Text>
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
                        {trade.buyer}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                        Seller
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {trade.seller}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                        Status
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {trade.state === TRADE_STATES.CREATED ? 'Created' : 'Escrowed'}
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

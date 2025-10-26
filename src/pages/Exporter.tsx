/**
 * Exporter Dashboard - Simplified Version
 */
import React, { useState, useEffect } from 'react'
import { Layout, Text } from "@stellar/design-system"

interface RWAAsset {
  id: string
  assetId: number
  blReference: string
  cargoDescription: string
  cargoValue: number
  currency: string
  status: 'ACTIVE' | 'LISTED'
  originPort: string
  destinationPort: string
  vesselName: string
  riskScore: number
  isListed?: boolean
  listingPrice?: number
}

export default function Exporter() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'myrwas'>('marketplace')
  const [rwaAssets, setRWAAssets] = useState<RWAAsset[]>([])

  useEffect(() => {
    const mockAssets: RWAAsset[] = [
      {
        id: '1',
        assetId: 1001,
        blReference: 'BL-2025-001',
        cargoDescription: 'Cotton Fabric Export',
        cargoValue: 150000,
        currency: 'USD',
        status: 'ACTIVE',
        originPort: 'Chennai',
        destinationPort: 'Hamburg',
        vesselName: 'Ocean Star',
        riskScore: 75,
        isListed: false
      },
      {
        id: '2',
        assetId: 1002,
        blReference: 'BL-2025-002',
        cargoDescription: 'Spices Export',
        cargoValue: 75000,
        currency: 'USD',
        status: 'LISTED',
        originPort: 'Kochi',
        destinationPort: 'Dubai',
        vesselName: 'Maritime Express',
        riskScore: 80,
        isListed: true,
        listingPrice: 73000
      }
    ]
    setRWAAssets(mockAssets)
  }, [])

  return (
    <Layout.Content>
      <Layout.Inset>
        <div style={{ padding: '2rem' }}>
          <Text as="h1" size="xl" style={{ marginBottom: '1rem' }}>
            📦 Enhanced Exporter Dashboard
          </Text>
          <Text as="p" size="md" style={{ marginBottom: '2rem', color: '#666' }}>
            Manage your trade documents and RWA tokens
          </Text>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('marketplace')}
              style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'marketplace' ? '3px solid #3b82f6' : 'none',
                color: activeTab === 'marketplace' ? '#3b82f6' : '#666',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🏬 Marketplace Actions
            </button>
            <button
              onClick={() => setActiveTab('myrwas')}
              style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'myrwas' ? '3px solid #3b82f6' : 'none',
                color: activeTab === 'myrwas' ? '#3b82f6' : '#666',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💎 My RWAs ({rwaAssets.length})
            </button>
          </div>

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ 
                background: 'white',
                border: '2px solid #fed7aa',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🏪</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Direct Sale</h3>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>Simple buyer-seller transaction</p>
                  </div>
                </div>
                <ul style={{ marginBottom: '1.5rem', paddingLeft: '0', listStyle: 'none' }}>
                  <li style={{ marginBottom: '0.5rem' }}>✓ 1% marketplace fee</li>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Instant settlement</li>
                  <li>✓ Full title transfer</li>
                </ul>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  🏪 List for Direct Sale
                </button>
              </div>

              <div style={{ 
                background: 'white',
                border: '2px solid #bfdbfe',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', marginRight: '1rem' }}>🚀</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Fractional Investment</h3>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>Tokenize and raise capital</p>
                  </div>
                </div>
                <ul style={{ marginBottom: '1.5rem', paddingLeft: '0', listStyle: 'none' }}>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Fractionalized shares</li>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Global investor access</li>
                  <li>✓ Yield opportunities</li>
                </ul>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  🚀 Create Investment Pool
                </button>
              </div>
            </div>
          )}

          {/* My RWAs Tab */}
          {activeTab === 'myrwas' && (
            <div>
              {rwaAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                  <Text as="p" size="md">No RWA assets yet</Text>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {rwaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {asset.cargoDescription}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>
                            Reference: {asset.blReference} • Asset ID: {asset.assetId}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            ${asset.cargoValue.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>{asset.currency}</div>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem',
                        padding: '1rem',
                        background: '#f9fafb',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>Origin</div>
                          <div style={{ fontWeight: '600' }}>{asset.originPort}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>Destination</div>
                          <div style={{ fontWeight: '600' }}>{asset.destinationPort}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>Vessel</div>
                          <div style={{ fontWeight: '600' }}>{asset.vesselName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>Risk Score</div>
                          <div style={{ fontWeight: '600' }}>{asset.riskScore}/100</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}>
                          📊 View Details
                        </button>
                        {!asset.isListed && (
                          <>
                            <button style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: '#ea580c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}>
                              🏪 List for Sale
                            </button>
                            <button style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: '#9333ea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}>
                              💹 Fractionalize
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

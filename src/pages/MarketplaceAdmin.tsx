/**
 * Marketplace Admin - List and manage buyers and sellers
 * NO MOCK DATA - All data from Stellar contract
 */
import React, { useState, useEffect } from 'react'
import { Layout, Text } from "@stellar/design-system"
import { stellarMarketplaceService, BuyerInfo, SellerInfo, MARKETPLACE_CONTRACT_ID } from '../services/stellarMarketplace'
import { useWallet } from '../hooks/useWallet'

export default function MarketplaceAdmin() {
  const { address, signTransaction } = useWallet()
  const [buyers, setBuyers] = useState<BuyerInfo[]>([])
  const [sellers, setSellers] = useState<SellerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers' | 'add-buyer' | 'add-seller'>('buyers')

  // Form states for adding buyer
  const [buyerForm, setBuyerForm] = useState({
    name: '',
    lei: '',
    address: ''
  })

  // Form states for adding seller
  const [sellerForm, setSellerForm] = useState({
    name: '',
    lei: '',
    address: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('📡 Loading buyers and sellers from Stellar contract...')
      
      const [buyersData, sellersData] = await Promise.all([
        stellarMarketplaceService.getBuyers(),
        stellarMarketplaceService.getSellers()
      ])
      
      setBuyers(buyersData)
      setSellers(sellersData)
      
      console.log(`✅ Loaded ${buyersData.length} buyers and ${sellersData.length} sellers`)
    } catch (err) {
      console.error('❌ Error loading data:', err)
      setError('Failed to load data from contract. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if wallet is connected
    if (!address) {
      setError('❌ Please connect your wallet first')
      return
    }

    // Check if signTransaction is available
    if (!signTransaction) {
      setError('❌ Wallet sign function not available')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      console.log('📝 Registering buyer:', buyerForm)
      console.log('🔐 Using wallet address:', address)
      
      // Call the actual contract function
      const result = await stellarMarketplaceService.registerBuyer(
        buyerForm.address,
        buyerForm.name,
        buyerForm.lei,
        address, // Source address (contract owner)
        signTransaction
      )
      
      if (result.success) {
        setSuccess(`✅ Buyer "${buyerForm.name}" registered successfully! Transaction: ${result.transactionHash?.slice(0, 8)}...`)
        setBuyerForm({ name: '', lei: '', address: '' })
        
        // Reload data
        await loadData()
        
        // Switch back to buyers list
        setTimeout(() => {
          setActiveTab('buyers')
          setSuccess('')
        }, 3000)
      } else {
        setError(`❌ Failed to register buyer: ${result.error}`)
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(`❌ Failed to register buyer: ${(err as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if wallet is connected
    if (!address) {
      setError('❌ Please connect your wallet first')
      return
    }

    // Check if signTransaction is available
    if (!signTransaction) {
      setError('❌ Wallet sign function not available')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      console.log('📝 Registering seller:', sellerForm)
      console.log('🔐 Using wallet address:', address)
      
      // Call the actual contract function
      const result = await stellarMarketplaceService.registerSeller(
        sellerForm.address,
        sellerForm.name,
        sellerForm.lei,
        address, // Source address (contract owner)
        signTransaction
      )
      
      if (result.success) {
        setSuccess(`✅ Seller "${sellerForm.name}" registered successfully! Transaction: ${result.transactionHash?.slice(0, 8)}...`)
        setSellerForm({ name: '', lei: '', address: '' })
        
        // Reload data
        await loadData()
        
        // Switch back to sellers list
        setTimeout(() => {
          setActiveTab('sellers')
          setSuccess('')
        }, 3000)
      } else {
        setError(`❌ Failed to register seller: ${result.error}`)
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      setError(`❌ Failed to register seller: ${(err as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && buyers.length === 0 && sellers.length === 0) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <Text as="p" size="lg">Loading marketplace participants...</Text>
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
            👥 Marketplace Admin
          </Text>
          <Text as="p" size="md" style={{ marginBottom: '1rem', color: '#666' }}>
            Manage buyers and sellers in the marketplace
          </Text>
          <Text as="p" size="sm" style={{ marginBottom: '1rem', color: '#999', fontFamily: 'monospace' }}>
            Contract: {MARKETPLACE_CONTRACT_ID}
          </Text>

          {/* Wallet Status */}
          {!address && (
            <div style={{ 
              padding: '1rem', 
              background: '#fef3c7', 
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#92400e'
            }}>
              ⚠️ Please connect your wallet to register buyers and sellers
            </div>
          )}

          {address && (
            <div style={{ 
              padding: '1rem', 
              background: '#d1fae5', 
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#065f46',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              ✅ Connected: {address.slice(0, 8)}...{address.slice(-8)}
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div style={{ 
              padding: '1rem', 
              background: '#d1fae5', 
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#065f46'
            }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee', 
              border: '1px solid #fcc',
              borderRadius: '8px',
              marginBottom: '2rem',
              color: '#c00'
            }}>
              {error}
            </div>
          )}

          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {buyers.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Buyers</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {sellers.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Sellers</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
                {buyers.reduce((sum, b) => sum + b.activeTrades, 0) + 
                 sellers.reduce((sum, s) => sum + s.activeTrades, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Active Trades</div>
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
              onClick={() => setActiveTab('buyers')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'buyers' ? '3px solid #3b82f6' : 'none',
                color: activeTab === 'buyers' ? '#3b82f6' : '#666',
                fontWeight: activeTab === 'buyers' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              🛒 Buyers ({buyers.length})
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'sellers' ? '3px solid #3b82f6' : 'none',
                color: activeTab === 'sellers' ? '#3b82f6' : '#666',
                fontWeight: activeTab === 'sellers' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              🏪 Sellers ({sellers.length})
            </button>
            <button
              onClick={() => setActiveTab('add-buyer')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'add-buyer' ? '3px solid #10b981' : 'none',
                color: activeTab === 'add-buyer' ? '#10b981' : '#666',
                fontWeight: activeTab === 'add-buyer' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              ➕ Add Buyer
            </button>
            <button
              onClick={() => setActiveTab('add-seller')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'add-seller' ? '3px solid #10b981' : 'none',
                color: activeTab === 'add-seller' ? '#10b981' : '#666',
                fontWeight: activeTab === 'add-seller' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              ➕ Add Seller
            </button>
          </div>

          {/* ADD BUYER TAB */}
          {activeTab === 'add-buyer' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                ➕ Register New Buyer
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '2rem' }}>
                Add a new buyer to the marketplace with their company information and LEI credentials.
              </p>

              <form onSubmit={handleAddBuyer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Buyer Name *
                  </label>
                  <input
                    type="text"
                    value={buyerForm.name}
                    onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })}
                    placeholder="e.g., Global Import Trading Co."
                    required
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Buyer LEI (Legal Entity Identifier) *
                  </label>
                  <input
                    type="text"
                    value={buyerForm.lei}
                    onChange={(e) => setBuyerForm({ ...buyerForm, lei: e.target.value })}
                    placeholder="e.g., 549300IMPORTER123"
                    required
                    disabled={isSubmitting}
                    maxLength={20}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    20-character alphanumeric Legal Entity Identifier
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Stellar Address *
                  </label>
                  <input
                    type="text"
                    value={buyerForm.address}
                    onChange={(e) => setBuyerForm({ ...buyerForm, address: e.target.value })}
                    placeholder="G..."
                    required
                    disabled={isSubmitting}
                    maxLength={56}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    56-character Stellar public address starting with 'G'
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || !address}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: (isSubmitting || !address) ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: (isSubmitting || !address) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? '⏳ Registering...' : '✅ Register Buyer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('buyers')}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.875rem 1.5rem',
                      background: 'white',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADD SELLER TAB */}
          {activeTab === 'add-seller' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                ➕ Register New Seller
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '2rem' }}>
                Add a new seller to the marketplace with their company information and LEI credentials.
              </p>

              <form onSubmit={handleAddSeller} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Seller Name *
                  </label>
                  <input
                    type="text"
                    value={sellerForm.name}
                    onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                    placeholder="e.g., Jupiter Knitting Company"
                    required
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Seller LEI (Legal Entity Identifier) *
                  </label>
                  <input
                    type="text"
                    value={sellerForm.lei}
                    onChange={(e) => setSellerForm({ ...sellerForm, lei: e.target.value })}
                    placeholder="e.g., 549300SELLER456"
                    required
                    disabled={isSubmitting}
                    maxLength={20}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    20-character alphanumeric Legal Entity Identifier
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Stellar Address *
                  </label>
                  <input
                    type="text"
                    value={sellerForm.address}
                    onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                    placeholder="G..."
                    required
                    disabled={isSubmitting}
                    maxLength={56}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    56-character Stellar public address starting with 'G'
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || !address}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: (isSubmitting || !address) ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: (isSubmitting || !address) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? '⏳ Registering...' : '✅ Register Seller'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sellers')}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.875rem 1.5rem',
                      background: 'white',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* BUYERS LIST TAB - keeping the rest of the component unchanged */}
          {activeTab === 'buyers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {buyers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                  <Text as="p" size="md" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    No buyers found
                  </Text>
                  <Text as="p" size="sm" style={{ color: '#666', marginBottom: '1rem' }}>
                    No buyer accounts have been registered in the contract yet.
                  </Text>
                  <button
                    onClick={() => setActiveTab('add-buyer')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Add First Buyer
                  </button>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#666'
                  }}>
                    <div>Buyer Address</div>
                    <div>Active Trades</div>
                    <div>Completed Trades</div>
                    <div>Total Trade Value</div>
                  </div>
                  
                  {/* Table Rows */}
                  {buyers.map((buyer) => (
                    <div
                      key={buyer.address}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {buyer.address.slice(0, 8)}...{buyer.address.slice(-8)}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#eab308' }}>
                        {buyer.activeTrades}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                        {buyer.completedTrades}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6366f1' }}>
                        ${buyer.totalTradeValue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* SELLERS LIST TAB */}
          {activeTab === 'sellers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sellers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏪</div>
                  <Text as="p" size="md" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    No sellers found
                  </Text>
                  <Text as="p" size="sm" style={{ color: '#666', marginBottom: '1rem' }}>
                    No seller accounts have been registered in the contract yet.
                  </Text>
                  <button
                    onClick={() => setActiveTab('add-seller')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Add First Seller
                  </button>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#666'
                  }}>
                    <div>Seller Address</div>
                    <div>Active Trades</div>
                    <div>Completed Trades</div>
                    <div>Total Trade Value</div>
                  </div>
                  
                  {/* Table Rows */}
                  {sellers.map((seller) => (
                    <div
                      key={seller.address}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {seller.address.slice(0, 8)}...{seller.address.slice(-8)}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#eab308' }}>
                        {seller.activeTrades}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                        {seller.completedTrades}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6366f1' }}>
                        ${seller.totalTradeValue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

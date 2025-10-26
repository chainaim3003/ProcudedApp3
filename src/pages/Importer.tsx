/**
 * Enhanced Importer Dashboard Component - Stellar Version
 * (Updated to import custom CSS and include semantic class names)
 */

// test commit
import React, { useState, useEffect } from 'react'
import { Layout } from "@stellar/design-system"
import './Importer.css' // <-- new CSS import (place file next to this TSX)

// ==================== INTERFACES ====================

interface TradeInstrument {
  instrumentId: bigint
  assetId: number
  blReference: string
  cargoDescription: string
  cargoValue: number
  status: string
  productType?: string
  seller?: string
  createdAt?: string
}

interface vLEIEndorsedPO {
  issuer: string
  holder: string
  endorsement: string
  timestamp: string
  documentHash: string
  signature?: string
  metadata?: any
}

interface EscrowTrade {
  tradeId: number
  buyer: string
  seller: string
  amount: bigint
  state: number
  productType: string
  description: string
  ipfsHash: string
  txId?: string
  explorerUrl?: string
}

// ==================== CONSTANTS ====================

const DEFAULT_SELLER_EXPORTER = 'GCEXAMPLESELLERADDRESS234567890ABCDEFGHIJKLMNOP'
const DEFAULT_SELLER_NAME = 'Jupiter Knitting Company'

const PRODUCT_TYPES = [
  { value: 'Textiles', label: 'Textiles', description: 'Cotton fabrics, synthetic materials, garments' },
  { value: 'Electronics', label: 'Electronics', description: 'Consumer electronics, semiconductors, components' },
  { value: 'Food-Tea', label: 'Food & Tea', description: 'Premium tea varieties, food products' },
  { value: 'Industrial', label: 'Industrial Equipment', description: 'Manufacturing machinery, tools' },
  { value: 'Raw Materials', label: 'Raw Materials', description: 'Base materials, chemicals, metals' },
  { value: 'Healthcare', label: 'Healthcare Products', description: 'Medical devices, pharmaceutical products' }
]

// ==================== UTILITIES ====================

const generateIPFSHash = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = 'Qm'
  for (let i = 0; i < 44; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const usdToXLM = (usd: number, xlmPrice: number = 0.12): number => {
  return usd / xlmPrice
}

// Reusable button class constants to keep styling consistent across the page
// NOTE: we keep tailwind utility classes while adding semantic class names
const BTN_PRIMARY = 'btn btn--primary rounded-lg font-semibold text-white transition-colors inline-flex items-center justify-center'
const BTN_PURPLE_LG = BTN_PRIMARY + ' btn--purple-lg px-6 py-4 bg-[#644fc1] hover:bg-[#523fb0]'
const BTN_PURPLE = BTN_PRIMARY + ' btn--purple px-5 py-3 bg-[#644fc1] hover:bg-[#523fb0] text-sm'
const BTN_HIGHLIGHT = 'btn--highlight font-mono bg-[#f3f0ff] text-[#644fc1] px-2 py-0.5 rounded-md font-semibold ml-3 text-sm'

// Mock vLEI service
const mockVLEIService = {
  getEndorsedPO: async (): Promise<vLEIEndorsedPO> => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      issuer: 'LEI:549300TESTISSUER001',
      holder: 'LEI:549300TESTHOLDER001',
      endorsement: 'VLEI_ENDORSEMENT_SIGNATURE_12345',
      timestamp: new Date().toISOString(),
      documentHash: 'sha256:' + generateIPFSHash(),
      signature: 'ED25519_SIGNATURE_MOCK_DATA',
      metadata: {
        poNumber: 'PO-2024-' + Math.floor(Math.random() * 10000),
        issueDate: new Date().toISOString().split('T')[0],
        amount: 100000,
        currency: 'USD'
      }
    }
  }
}

// ==================== MAIN COMPONENT ====================

export default function Importer() {
  const [currentTab, setCurrentTab] = useState<'purchases' | 'create-trade'>('create-trade')

  // Purchases state
  const [purchasedInstruments, setPurchasedInstruments] = useState<TradeInstrument[]>([])
  const [loading, setLoading] = useState(true)

  // Create trade state
  const [formData, setFormData] = useState({
    sellerName: DEFAULT_SELLER_NAME,
    sellerExporterAddress: DEFAULT_SELLER_EXPORTER,
    cargoDescription: 'Premium Tea Shipment',
    cargoValue: 100000,
    productType: 'Food-Tea',
    purchaseOrderFile: null as File | null,
    vLEIEndorsedPO: null as vLEIEndorsedPO | null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [createdTradeId, setCreatedTradeId] = useState<number | null>(null)
  const [createdTxId, setCreatedTxId] = useState<string | null>(null)
  const [isLoadingVLEI, setIsLoadingVLEI] = useState(false)
  const [vLEILoaded, setVLEILoaded] = useState(false)
  const [isLoadingImporterVLEI, setIsLoadingImporterVLEI] = useState(false)
  const [importerVLEIData, setImporterVLEIData] = useState<string>('')
  const [isLoadingSellerVLEI, setIsLoadingSellerVLEI] = useState(false)
  const [sellerVLEIData, setSellerVLEIData] = useState<string>('')

  // Opt-in state
  const [optInAssetId, setOptInAssetId] = useState('')
  const [isOptingIn, setIsOptingIn] = useState(false)
  const [optInSuccess, setOptInSuccess] = useState('')
  const [optInError, setOptInError] = useState('')

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadMockData()
  }, [])

  useEffect(() => {
    const selectedProduct = PRODUCT_TYPES.find(p => p.value === formData.productType)
    if (selectedProduct && !formData.cargoDescription.includes('Custom')) {
      setFormData(prev => ({
        ...prev,
        cargoDescription: selectedProduct.description.split(',')[0] + ' Shipment'
      }))
    }
  }, [formData.productType])

  // ==================== DATA LOADING ====================

  const loadMockData = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockPurchases: TradeInstrument[] = [
      {
        instrumentId: BigInt(2001),
        assetId: 2001,
        blReference: 'BL-2024-050',
        cargoDescription: 'Premium Cotton Textiles - 1000 units',
        cargoValue: 250000,
        status: 'OWNED',
        productType: 'Textiles',
        seller: 'Jupiter Knitting Company',
        createdAt: '2024-10-15'
      },
      {
        instrumentId: BigInt(2002),
        assetId: 2002,
        blReference: 'BL-2024-051',
        cargoDescription: 'Industrial Machinery Components',
        cargoValue: 180000,
        status: 'OWNED',
        productType: 'Industrial',
        seller: 'Global Manufacturing Ltd',
        createdAt: '2024-10-18'
      },
      {
        instrumentId: BigInt(2003),
        assetId: 2003,
        blReference: 'BL-2024-052',
        cargoDescription: 'Premium Tea Varieties - 500kg',
        cargoValue: 75000,
        status: 'OWNED',
        productType: 'Food-Tea',
        seller: 'Ceylon Tea Exporters',
        createdAt: '2024-10-20'
      }
    ]

    setPurchasedInstruments(mockPurchases)
    setLoading(false)
  }

  // ==================== HANDLERS ====================

  const handleProductTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, productType: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/json') {
        setFormData(prev => ({ ...prev, purchaseOrderFile: file }))
        setUploadedFileName(file.name)
        setError('')

        // Try to parse and load the JSON
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string)
            setFormData(prev => ({ ...prev, vLEIEndorsedPO: json }))
            setVLEILoaded(true)
            setSuccess('✅ Purchase Order JSON loaded successfully!')
          } catch (err) {
            setError('❌ Invalid JSON file')
          }
        }
        reader.readAsText(file)
      } else {
        setError('❌ Please upload a JSON file')
      }
    }
  }

  const handleLoadVLEIPO = async () => {
    setIsLoadingVLEI(true)
    setError('')

    try {
      const endorsedPO = await mockVLEIService.getEndorsedPO()
      setFormData(prev => ({ ...prev, vLEIEndorsedPO: endorsedPO }))
      setVLEILoaded(true)
      setSuccess('✅ vLEI Purchase Order loaded successfully!')
    } catch (err) {
      setError('❌ Failed to load vLEI Purchase Order')
    } finally {
      setIsLoadingVLEI(false)
    }
  }

  const handleLoadImporterVLEI = async () => {
    setIsLoadingImporterVLEI(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockData = {
        lei: 'LEI:549300IMPORTER123',
        legalName: 'Global Import Trading Co.',
        jurisdiction: 'US-DE',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      }
      setImporterVLEIData(JSON.stringify(mockData, null, 2))
      setSuccess('✅ Importer vLEI credentials loaded!')
    } catch (err) {
      setError('❌ Failed to load Importer vLEI')
    } finally {
      setIsLoadingImporterVLEI(false)
    }
  }

  const handleLoadSellerVLEI = async () => {
    setIsLoadingSellerVLEI(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockData = {
        lei: 'LEI:549300SELLER456',
        legalName: formData.sellerName,
        jurisdiction: 'IN-TN',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      }
      setSellerVLEIData(JSON.stringify(mockData, null, 2))
      setSuccess('✅ Seller/Exporter vLEI credentials loaded!')
    } catch (err) {
      setError('❌ Failed to load Seller vLEI')
    } finally {
      setIsLoadingSellerVLEI(false)
    }
  }

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO) {
      setError('❌ Please upload a Purchase Order or load vLEI PO')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2500))

      const mockTradeId = Math.floor(Math.random() * 10000)
      const mockTxId = 'stellar:tx:' + generateIPFSHash().substring(0, 32)

      setCreatedTradeId(mockTradeId)
      setCreatedTxId(mockTxId)
      setSuccess('✅ Trade created successfully on Stellar blockchain!')

      // Reset form after success
      setTimeout(() => {
        resetForm()
      }, 3000)

    } catch (err) {
      setError('❌ Failed to create trade: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      sellerName: DEFAULT_SELLER_NAME,
      sellerExporterAddress: DEFAULT_SELLER_EXPORTER,
      cargoDescription: 'Premium Tea Shipment',
      cargoValue: 100000,
      productType: 'Food-Tea',
      purchaseOrderFile: null,
      vLEIEndorsedPO: null
    })
    setUploadedFileName('')
    setVLEILoaded(false)
    setCreatedTradeId(null)
    setCreatedTxId(null)
    setImporterVLEIData('')
    setSellerVLEIData('')
  }

  const handleOptInToAsset = async () => {
    if (!optInAssetId) {
      setOptInError('Please enter an Asset ID')
      return
    }

    setIsOptingIn(true)
    setOptInError('')
    setOptInSuccess('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setOptInSuccess('✅ Successfully opted-in to Asset ID: ' + optInAssetId)
      setOptInAssetId('')
    } catch (err) {
      setOptInError('❌ Failed to opt-in to asset')
    } finally {
      setIsOptingIn(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  // ==================== RENDER ====================

  return (
    <Layout.Content>
      <Layout.Inset>
        {/* Add semantic container class so custom CSS can target everything */}
        <div className="importer-page min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏪 Importer Dashboard Enhanced
              </h1>
              <p className="text-gray-600">
                Manage your trade finance operations on Stellar blockchain
              </p>
            </div>

            {/* Global Success/Error Messages */}
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

            {/* Transaction Success */}
            {createdTxId && (
              <div className="bg-blue-100 border border-blue-400 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-900 mb-2">🎉 Trade Created Successfully!</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Trade ID:</strong> {createdTradeId}</p>
                  <p><strong>Transaction:</strong> <code className="bg-blue-200 px-2 py-1 rounded text-xs">{createdTxId}</code></p>
                  <p className="text-xs mt-2">✓ Your trade is now live on Stellar blockchain</p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <nav className="flex space-x-8 px-6 border-b border-gray-200">
                <button
                  role="tab"
                  aria-selected={currentTab === 'create-trade'}
                  onClick={() => setCurrentTab('create-trade')}
                  className={`tab-btn py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentTab === 'create-trade'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  ➕ Create Trade
                </button>
                <button
                  role="tab"
                  aria-selected={currentTab === 'purchases'}
                  onClick={() => setCurrentTab('purchases')}
                  className={`tab-btn py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentTab === 'purchases'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  📦 My Purchases ({purchasedInstruments.length})
                </button>
              </nav>
            </div>

            {/* MY PURCHASES TAB */}
            {currentTab === 'purchases' && (
              <div className="form-card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      📦 My Purchased Instruments
                    </h2>
                    <p className="text-sm text-gray-500">View and manage your trade assets on Stellar</p>
                  </div>
                  <button
                    onClick={loadMockData}
                    className="btn btn-purple"
                  >
                    🔄
                    <span className="ml-2">Refresh</span>
                    <span className="btn-highlight">New</span>
                  </button>
                </div>

                {/* Opt-in Section */}
                <div className="form-section" style={{ background: 'linear-gradient(135deg, rgba(100,79,193,0.05) 0%, rgba(236,72,153,0.05) 100%)', border: '1px solid rgba(100,79,193,0.15)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <div className="section-title" style={{ marginBottom: '16px', paddingBottom: '0', border: 'none' }}>
                    <div className="icon">🔓</div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#644fc1', margin: 0 }}>
                        Opt-in to Asset
                      </h3>
                      <p className="muted" style={{ marginTop: '4px' }}>
                        Before receiving trade instruments, you must opt-in to the asset on Stellar
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="input-group flex-1">
                      <input
                        type="text"
                        value={optInAssetId}
                        onChange={(e) => setOptInAssetId(e.target.value)}
                        placeholder="Enter Asset ID (e.g., 2001)"
                      />
                    </div>
                    <button
                      onClick={handleOptInToAsset}
                      disabled={isOptingIn || !optInAssetId}
                      className="btn btn-primary"
                    >
                      🔓
                      <span className="ml-3">{isOptingIn ? 'Opting-in...' : 'Opt-in'}</span>
                      <span className="btn-highlight">Asset</span>
                    </button>
                  </div>

                  {optInSuccess && (
                    <div className="alert alert-success" style={{ marginTop: '12px' }}>
                      {optInSuccess}
                    </div>
                  )}

                  {optInError && (
                    <div className="alert alert-error" style={{ marginTop: '12px' }}>
                      {optInError}
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your purchases...</p>
                  </div>
                ) : purchasedInstruments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No purchases yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start by creating a trade or purchasing from the marketplace
                    </p>
                    <button
                      onClick={() => setCurrentTab('create-trade')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Create Your First Trade
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedInstruments.map((instrument) => (
                      <div
                        key={instrument.assetId}
                        className="instrument-card"
                      >
                        <div className="meta">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="kicker" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                                {instrument.status}
                              </span>
                              <span className="kicker">
                                {instrument.productType}
                              </span>
                            </div>
                            <h4 className="mb-2">
                              {instrument.cargoDescription}
                            </h4>
                            <div className="space-y-1">
                              <p className="small-muted">
                                <strong style={{ color: '#644fc1' }}>BL Reference:</strong> {instrument.blReference}
                              </p>
                              <p className="small-muted">
                                <strong style={{ color: '#644fc1' }}>Seller:</strong> {instrument.seller || 'Unknown'}
                              </p>
                              <p className="small-muted">
                                <strong style={{ color: '#644fc1' }}>Created:</strong> {instrument.createdAt || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p style={{ fontSize: '32px', fontWeight: '800', color: '#644fc1', marginBottom: '8px', lineHeight: '1' }}>
                              {formatCurrency(instrument.cargoValue)}
                            </p>
                            <div style={{ background: 'rgba(100,79,193,0.08)', padding: '8px 12px', borderRadius: '8px', marginTop: '8px' }}>
                              <p className="small-muted" style={{ marginBottom: '2px' }}>
                                <strong>Asset ID:</strong> {instrument.assetId}
                              </p>
                              <p className="small-muted" style={{ color: '#644fc1', fontWeight: '600' }}>
                                ~{usdToXLM(instrument.cargoValue).toFixed(2)} XLM
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="actions">
                          <button className="btn btn-purple flex-1 justify-center">
                            📄
                            <span className="ml-3">View Details</span>
                            <span className="btn-highlight">Info</span>
                          </button>
                          <button className="btn btn-ghost flex-1">
                            📤
                            <span className="ml-3">Transfer</span>
                          </button>
                          <button className="btn btn-purple flex-1 justify-center">
                            🔍
                            <span className="ml-3">Explorer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Stats */}
                {!loading && purchasedInstruments.length > 0 && (
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, rgba(100,79,193,0.05) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(100,79,193,0.12)', marginTop: '24px' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#644fc1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📊 Portfolio Summary
                    </h3>
                    <div className="stats">
                      <div>
                        <p className="small-muted mb-1">Total Instruments</p>
                        <p style={{ fontSize: '28px', fontWeight: '800', color: '#644fc1' }}>{purchasedInstruments.length}</p>
                      </div>
                      <div>
                        <p className="small-muted mb-1">Total Value</p>
                        <p style={{ fontSize: '28px', fontWeight: '800', color: '#644fc1' }}>
                          {formatCurrency(purchasedInstruments.reduce((sum, i) => sum + i.cargoValue, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="small-muted mb-1">Product Types</p>
                        <p style={{ fontSize: '28px', fontWeight: '800', color: '#644fc1' }}>
                          {new Set(purchasedInstruments.map(i => i.productType || 'Unknown')).size}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CREATE TRADE TAB */}
            {currentTab === 'create-trade' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  ➕ Create New Trade in Escrow
                </h2>

                <form onSubmit={handleCreateTrade} className="space-y-6">

                  {/* Seller/Exporter Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">🏭</span> Seller/Exporter Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={formData.sellerName}
                          onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter seller/exporter company name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stellar Address *
                        </label>
                        <input
                          type="text"
                          value={formData.sellerExporterAddress}
                          onChange={(e) => setFormData({ ...formData, sellerExporterAddress: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                          placeholder="GXXXXXXXXX..."
                          required
                        />
                      </div>
                    </div>

                    {/* Load Seller vLEI Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleLoadSellerVLEI}
                        disabled={isLoadingSellerVLEI}
                        className={`${BTN_PURPLE} rounded-md disabled:opacity-50 gap-3`}
                      >
                        {isLoadingSellerVLEI ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </span>
                        ) : (
                          '🔐 Load Seller vLEI'
                        )}
                      </button>
                    </div>

                    {/* Seller vLEI Data Display */}
                    {sellerVLEIData && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Seller vLEI Credentials
                        </label>
                        <textarea
                          value={sellerVLEIData}
                          readOnly
                          rows={6}
                          className="w-full px-3 py-2 border border-indigo-300 rounded-lg font-mono text-xs bg-indigo-50 text-gray-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Importer vLEI Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                      <span className="mr-2">🔐</span> Importer vLEI Credentials
                    </h3>
                    <p className="text-sm text-purple-700 mb-4">
                      Load your verifiable Legal Entity Identifier credentials to authenticate this trade
                    </p>

                    <button
                      type="button"
                      onClick={handleLoadImporterVLEI}
                      disabled={isLoadingImporterVLEI}
                      className={`${BTN_PURPLE} rounded-md disabled:opacity-50 gap-3`}
                    >
                      {isLoadingImporterVLEI ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </span>
                      ) : (
                        '🔐 Load Importer vLEI'
                      )}
                    </button>

                    {/* Importer vLEI Data Display */}
                    {importerVLEIData && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Your vLEI Credentials (JSON)
                        </label>
                        <textarea
                          value={importerVLEIData}
                          readOnly
                          rows={6}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg font-mono text-xs bg-purple-50 text-gray-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type *
                    </label>
                    <select
                      value={formData.productType}
                      onChange={(e) => handleProductTypeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the type of goods being traded
                    </p>
                  </div>

                  {/* Cargo Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo Value (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.cargoValue}
                        onChange={(e) => setFormData({ ...formData, cargoValue: parseInt(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="100000"
                        min="1"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Equivalent: ~{usdToXLM(formData.cargoValue).toFixed(2)} XLM (at $0.12/XLM)
                    </p>
                  </div>

                  {/* Cargo Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.cargoDescription}
                      onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Provide detailed description of the cargo..."
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-filled based on product type. You can edit as needed.
                    </p>
                  </div>

                  {/* Purchase Order Upload with vLEI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Order *
                    </label>

                    {/* vLEI Status Badge */}
                    {vLEILoaded && (
                      <div className="mb-3 bg-green-50 border border-green-300 rounded-lg p-3">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-sm font-medium text-green-800">vLEI Endorsement Loaded</span>
                          <span className="ml-auto text-xs text-green-600">Verified & Ready for Storage</span>
                        </div>
                      </div>
                    )}

                    {/* File Upload Area - added semantic class file-drop */}
                    <div className="file-drop border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="purchase-order-upload"
                      />
                      <label htmlFor="purchase-order-upload" className="cursor-pointer block">
                        <div className="text-gray-600 mb-2">
                          {uploadedFileName && !vLEILoaded ? (
                            <span className="text-green-600">📄 {uploadedFileName}</span>
                          ) : (
                            <span>📄 Upload Purchase Order JSON</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {uploadedFileName && !vLEILoaded ? 'Click to change file' : 'Click to select a JSON file'}
                        </div>
                      </label>
                    </div>

                    {/* Get vLEI PO Button */}
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadVLEIPO}
                        disabled={isLoadingVLEI}
                        className={`${BTN_PURPLE} rounded-md disabled:opacity-50 gap-3`}
                      >
                        {isLoadingVLEI ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </span>
                        ) : (
                          '🔐 Get vLEI PO'
                        )}
                      </button>
                    </div>

                    {/* vLEI PO JSON Response - Editable */}
                    {vLEILoaded && formData.vLEIEndorsedPO && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          vLEI PO JSON Response (Editable)
                        </label>
                        <textarea
                          value={JSON.stringify(formData.vLEIEndorsedPO, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value)
                              setFormData({ ...formData, vLEIEndorsedPO: parsed })
                            } catch (err) {
                              // Allow typing invalid JSON
                            }
                          }}
                          rows={8}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg font-mono text-xs bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Purchase Order vLEI JSON data..."
                        />
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(formData.vLEIEndorsedPO, null, 2))
                              showSuccess('vLEI PO JSON copied to clipboard!')
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            📋 Copy to Clipboard
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Upload a JSON file or click "Get vLEI PO" to load a vLEI-endorsed purchase order.
                      vLEI endorsements will be stored on-chain.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO)}
                      className={`w-full ${isSubmitting || (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO)
                        ? 'bg-gray-400 cursor-not-allowed py-3 px-6 rounded-lg'
                        : BTN_PURPLE_LG
                        }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating Trade on Stellar Blockchain...</span>
                        </span>
                      ) : (
                        <>
                          🚀
                          <span className="ml-3">Create Trade in Escrow</span>
                          <span className={BTN_HIGHLIGHT}>vLEI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* XLM Balance Warning */}
                  {(vLEILoaded || importerVLEIData || sellerVLEIData) && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                        💰 Important: XLM Balance Required
                      </h4>
                      <p className="text-xs text-yellow-800 mb-2">
                        Creating a trade with vLEI documents requires storing large JSON files on-chain.
                      </p>
                      <div className="bg-yellow-100 rounded p-2 text-xs font-mono text-yellow-900">
                        <div>• Trade Amount: {usdToXLM(formData.cargoValue).toFixed(2)} XLM</div>
                        <div>• Storage Cost: ~5-10 XLM (for vLEI documents)</div>
                        <div>• Transaction Fees: ~0.01 XLM</div>
                        <div className="border-t border-yellow-300 mt-1 pt-1 font-bold">
                          Total Required: ~{(usdToXLM(formData.cargoValue) + 10).toFixed(2)} XLM
                        </div>
                      </div>
                      <p className="text-xs text-yellow-800 mt-2">
                        ⚠️ Ensure your wallet has at least <strong>{(usdToXLM(formData.cargoValue) + 15).toFixed(0)} XLM</strong> before submitting.
                      </p>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      ℹ️ What happens next?
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>✓ Your trade will be created on the Stellar blockchain (State: CREATED)</li>
                      {vLEILoaded && (
                        <li className="text-purple-700 font-medium">
                          ✓ vLEI endorsement will be stored on-chain (~5-10 XLM)
                        </li>
                      )}
                      <li>✓ The trade will be visible in the marketplace for funding</li>
                      <li>✓ You or a Financier must fund the escrow to lock funds (State: ESCROWED)</li>
                      <li>✓ The seller/exporter will then fulfill the order and transfer the instrument</li>
                      <li>✓ Payment is released atomically when the instrument is transferred</li>
                      <li>✓ All actions and documents are recorded on the Stellar blockchain</li>
                    </ul>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}

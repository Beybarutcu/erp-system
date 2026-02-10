'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api'
import { Package, TrendingUp, AlertTriangle, Search, Filter } from 'lucide-react'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'lots' | 'available' | 'aging'>('available')
  const [search, setSearch] = useState('')

  // Available stock
  const { data: availableStock, isLoading: loadingAvailable } = useQuery({
    queryKey: ['inventory-available', search],
    queryFn: () => inventoryApi.getAvailable({ search }),
    enabled: activeTab === 'available',
  })

  // All lots
  const { data: lots, isLoading: loadingLots } = useQuery({
    queryKey: ['inventory-lots', search],
    queryFn: () => inventoryApi.getLots({ search }),
    enabled: activeTab === 'lots',
  })

  // Aging stock
  const { data: agingStock, isLoading: loadingAging } = useQuery({
    queryKey: ['inventory-aging'],
    queryFn: () => inventoryApi.getAging(),
    enabled: activeTab === 'aging',
  })

  const isLoading = loadingAvailable || loadingLots || loadingAging

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
          <p className="text-gray-600 mt-1">FIFO bazlı stok takibi ve lot yönetimi</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Package className="h-5 w-5 mr-2" />
          Yeni Lot
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kullanılabilir Stok
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lots'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tüm Lotlar
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'aging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Yaşlanan Stok
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün veya lot ara..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Available Stock */}
      {activeTab === 'available' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Toplam Miktar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lot Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  En Eski Lot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ort. Maliyet
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : availableStock?.data && availableStock.data.length > 0 ? (
                availableStock.data.map((item: any) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product?.translations?.[0]?.name || item.product?.code}
                          </div>
                          <div className="text-sm text-gray-500">{item.product?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.totalQuantity?.toLocaleString()} adet
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{item.lotCount} lot</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {item.oldestLotDate
                          ? new Date(item.oldestLotDate).toLocaleDateString('tr-TR')
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ₺{item.avgCost?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        Detay
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Tüket
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Stok bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Aging Stock */}
      {activeTab === 'aging' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : agingStock?.data && agingStock.data.length > 0 ? (
            agingStock.data.map((lot: any) => (
              <div key={lot.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <AlertTriangle
                        className={`h-5 w-5 mr-2 ${
                          lot.riskLevel === 'HIGH'
                            ? 'text-red-500'
                            : lot.riskLevel === 'MEDIUM'
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <h3 className="text-lg font-medium text-gray-900">
                        {lot.product?.translations?.[0]?.name || lot.product?.code}
                      </h3>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Lot No</p>
                        <p className="text-sm font-medium text-gray-900">{lot.lotNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Miktar</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lot.currentQuantity} adet
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Yaş</p>
                        <p className="text-sm font-medium text-gray-900">{lot.ageInDays} gün</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Alış Tarihi</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(lot.receivedDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lot.riskLevel === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : lot.riskLevel === 'MEDIUM'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {lot.riskLevel}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Yaşlanan stok yok
            </div>
          )}
        </div>
      )}

      {/* FIFO Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">FIFO (First In, First Out)</h4>
            <p className="text-sm text-blue-700 mt-1">
              Stok tüketiminde otomatik olarak en eski tarihli lotlar öncelikli kullanılır. Bu sayede
              stok yaşlanması önlenir ve malzeme kalitesi korunur.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
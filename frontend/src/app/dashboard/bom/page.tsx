'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bomApi, productsApi } from '@/lib/api'
import { GitBranch, ChevronRight, ChevronDown, Package, Search } from 'lucide-react'

interface BOMNode {
  id: string
  productCode: string
  productName: string
  quantity: number
  level: number
  children?: BOMNode[]
  operationType?: string
  cycleTimeSeconds?: number
  scrapRate?: number
}

function BOMTreeNode({ node, isExpanded, onToggle }: { 
  node: BOMNode
  isExpanded: boolean
  onToggle: () => void 
}) {
  const hasChildren = node.children && node.children.length > 0
  const indent = node.level * 32

  return (
    <div>
      <div
        className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        style={{ paddingLeft: `${indent + 16}px` }}
        onClick={hasChildren ? onToggle : undefined}
      >
        {hasChildren ? (
          <button className="mr-2 text-gray-400">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="mr-2 w-4" />
        )}

        <Package className="h-5 w-5 text-gray-400 mr-3" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">{node.productName}</span>
            <span className="ml-2 text-xs text-gray-500">({node.productCode})</span>
          </div>
          {node.operationType && (
            <div className="text-xs text-gray-500 mt-1">
              İşlem: {node.operationType}
              {node.cycleTimeSeconds && ` • ${node.cycleTimeSeconds}s`}
              {node.scrapRate && node.scrapRate > 0 && ` • Fire: %${node.scrapRate}`}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900">{node.quantity}x</span>
          <div className="text-xs text-gray-500">Seviye {node.level}</div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <BOMTreeNodeWrapper key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function BOMTreeNodeWrapper({ node }: { node: BOMNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  return (
    <BOMTreeNode
      node={node}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    />
  )
}

export default function BOMPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Get all products
  const { data: products } = useQuery({
    queryKey: ['products', { search: searchQuery }],
    queryFn: () => productsApi.getAll({ search: searchQuery, limit: 50 }),
  })

  // Get BOM tree for selected product
  const { data: bomTree, isLoading: loadingBOM } = useQuery({
    queryKey: ['bom-tree', selectedProductId],
    queryFn: () => bomApi.getTree(selectedProductId),
    enabled: !!selectedProductId,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ürün Ağacı (BOM)</h1>
        <p className="text-gray-600 mt-1">
          Ürün reçetelerini görüntüleyin ve malzeme ihtiyacı hesaplayın
        </p>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Seçin
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
            {products?.data?.map((product: any) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`p-3 border rounded-lg text-left hover:border-blue-500 transition-colors ${
                  selectedProductId === product.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {product.translations?.[0]?.name || product.code}
                </div>
                <div className="text-xs text-gray-500 mt-1">{product.code}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BOM Tree */}
      {selectedProductId && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <GitBranch className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Ürün Ağacı</h2>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Tümünü Aç
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Tümünü Kapat
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Malzeme Hesapla
              </button>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loadingBOM ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : bomTree?.data && Array.isArray(bomTree.data) && bomTree.data.length > 0 ? (
              <div>
                {bomTree.data.map((node: BOMNode) => (
                  <BOMTreeNodeWrapper key={node.id} node={node} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Bu ürün için BOM tanımlanmamış
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedProductId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <GitBranch className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Ürün Ağacını Görüntüle
          </h3>
          <p className="text-blue-700">
            Yukarıdan bir ürün seçerek BOM ağacını görüntüleyebilirsiniz
          </p>
        </div>
      )}
    </div>
  )
}
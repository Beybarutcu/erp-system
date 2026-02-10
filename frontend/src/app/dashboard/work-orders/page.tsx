'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { workOrdersApi } from '@/lib/api'
import { 
  ClipboardList, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  Clock,
  Plus,
  Filter,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS = {
  PLANNED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  PLANNED: 'Planlandı',
  IN_PROGRESS: 'Devam Ediyor',
  PAUSED: 'Duraklatıldı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
}

export default function WorkOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', { status: statusFilter !== 'ALL' ? statusFilter : undefined, page }],
    queryFn: () => workOrdersApi.getAll({ 
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page,
      limit: 20 
    }),
  })

  const stats = [
    { label: 'Planlandı', value: data?.data?.filter((wo: any) => wo.status === 'PLANNED').length || 0, color: 'text-gray-600' },
    { label: 'Devam Ediyor', value: data?.data?.filter((wo: any) => wo.status === 'IN_PROGRESS').length || 0, color: 'text-blue-600' },
    { label: 'Tamamlandı', value: data?.data?.filter((wo: any) => wo.status === 'COMPLETED').length || 0, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Emirleri</h1>
          <p className="text-gray-600 mt-1">Üretim iş emirlerini takip edin ve yönetin</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Yeni İş Emri
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <ClipboardList className={`h-12 w-12 ${stat.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Durum:</span>
          <div className="flex space-x-2">
            {['ALL', 'PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'Tümü' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İş Emri No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ürün
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Makine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İlerleme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tarih
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((wo: any) => {
                const progress = wo.progress?.progressPercentage || 0
                return (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/work-orders/${wo.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {wo.woNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {wo.product?.translations?.[0]?.name || wo.product?.code}
                          </div>
                          <div className="text-sm text-gray-500">{wo.product?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {wo.machine?.translations?.[0]?.name || wo.machine?.code || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          STATUS_COLORS[wo.status as keyof typeof STATUS_COLORS]
                        }`}
                      >
                        {STATUS_LABELS[wo.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{wo.producedQuantity || 0} / {wo.plannedQuantity}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {wo.plannedStartDate
                          ? new Date(wo.plannedStartDate).toLocaleDateString('tr-TR')
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {wo.status === 'PLANNED' && (
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          <Play className="h-4 w-4 inline" />
                        </button>
                      )}
                      {wo.status === 'IN_PROGRESS' && (
                        <button className="text-yellow-600 hover:text-yellow-900 mr-3">
                          <Pause className="h-4 w-4 inline" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/work-orders/${wo.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  İş emri bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Toplam <span className="font-medium">{data.pagination.total}</span> iş emri
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Üretim Takibi</h4>
            <p className="text-sm text-blue-700 mt-1">
              İş emirleri otomatik olarak FIFO prensibiyle malzeme tüketir. Her üretim kaydı
              malzeme stokunu düşürür ve lot bazında takip sağlar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
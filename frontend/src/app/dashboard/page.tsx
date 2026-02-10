'use client'

import { useQuery } from '@tanstack/react-query'
import { workOrdersApi, machinesApi, inventoryApi, productsApi } from '@/lib/api'
import { Package, ClipboardList, Settings, Archive, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: workOrders } = useQuery({
    queryKey: ['work-orders', { status: 'IN_PROGRESS' }],
    queryFn: () => workOrdersApi.getAll({ status: 'IN_PROGRESS', limit: 5 }),
  })

  const { data: machines } = useQuery({
    queryKey: ['machines', { status: 'ACTIVE' }],
    queryFn: () => machinesApi.getAll({ status: 'ACTIVE', limit: 10 }),
  })

  const { data: agingStock } = useQuery({
    queryKey: ['inventory-aging'],
    queryFn: () => inventoryApi.getAging({ daysThreshold: 90 }),
  })

  const { data: products } = useQuery({
    queryKey: ['products-count'],
    queryFn: () => productsApi.getAll({ limit: 1 }),
  })

  const stats = [
    {
      name: 'Toplam Ürün',
      value: products?.pagination?.total || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Aktif İş Emirleri',
      value: workOrders?.pagination?.total || 0,
      icon: ClipboardList,
      color: 'bg-green-500',
    },
    {
      name: 'Aktif Makineler',
      value: machines?.pagination?.total || 0,
      icon: Settings,
      color: 'bg-purple-500',
    },
    {
      name: 'Yaşlanan Stok',
      value: agingStock?.data?.length || 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hoş Geldiniz</h1>
        <p className="text-gray-600 mt-1">Üretim durumunuza genel bakış</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Devam Eden İş Emirleri</h2>
        </div>
        <div className="p-6">
          {workOrders?.data && workOrders.data.length > 0 ? (
            <div className="space-y-4">
              {workOrders.data.map((wo: any) => (
                <div key={wo.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{wo.woNumber}</p>
                    <p className="text-sm text-gray-600">{wo.product?.translations?.[0]?.name || 'Ürün'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {wo.producedQuantity} / {wo.plannedQuantity}
                    </p>
                    <div className="mt-1 w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((wo.producedQuantity / wo.plannedQuantity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Devam eden iş emri yok</p>
          )}
        </div>
      </div>

      {/* Active Machines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Aktif Makineler</h2>
          </div>
          <div className="p-6">
            {machines?.data && machines.data.length > 0 ? (
              <div className="space-y-3">
                {machines.data.slice(0, 5).map((machine: any) => (
                  <div key={machine.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">{machine.code}</span>
                    </div>
                    <span className="text-xs text-gray-500">{machine.machineType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aktif makine yok</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stok Uyarıları</h2>
          </div>
          <div className="p-6">
            {agingStock?.data && agingStock.data.length > 0 ? (
              <div className="space-y-3">
                {agingStock.data.slice(0, 5).map((lot: any) => (
                  <div key={lot.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {lot.product?.translations?.[0]?.name || lot.product?.code}
                      </span>
                      <p className="text-xs text-gray-500">{lot.ageInDays} gün</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lot.riskLevel === 'HIGH' 
                        ? 'bg-red-100 text-red-800' 
                        : lot.riskLevel === 'MEDIUM'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lot.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Stok uyarısı yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

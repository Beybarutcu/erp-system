'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { machinesApi } from '@/lib/api'
import { Settings, Activity, Wrench, AlertTriangle, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  BROKEN: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS = {
  ACTIVE: 'Aktif',
  MAINTENANCE: 'Bakımda',
  BROKEN: 'Arızalı',
  INACTIVE: 'Pasif',
}

function UtilizationBar({ rate }: { rate: number }) {
  let color = 'bg-green-500'
  if (rate > 85) color = 'bg-red-500'
  else if (rate > 70) color = 'bg-yellow-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>Kapasite Kullanımı</span>
        <span className="font-semibold">{rate.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function MachinesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['machines', { status: statusFilter !== 'ALL' ? statusFilter : undefined }],
    queryFn: () => machinesApi.getAll({ 
      status: statusFilter !== 'ALL' ? statusFilter : undefined 
    }),
  })

  const stats = [
    { 
      label: 'Toplam Makine', 
      value: data?.pagination?.total || 0, 
      icon: Settings,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    { 
      label: 'Aktif', 
      value: data?.data?.filter((m: any) => m.status === 'ACTIVE').length || 0, 
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    { 
      label: 'Bakımda', 
      value: data?.data?.filter((m: any) => m.status === 'MAINTENANCE').length || 0, 
      icon: Wrench,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    },
    { 
      label: 'Arızalı', 
      value: data?.data?.filter((m: any) => m.status === 'BROKEN').length || 0, 
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Makineler</h1>
          <p className="text-gray-600 mt-1">Makine durumları ve kapasite kullanımı</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Yeni Makine
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Durum:</span>
          <div className="flex space-x-2">
            {['ALL', 'ACTIVE', 'MAINTENANCE', 'BROKEN', 'INACTIVE'].map((status) => (
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

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((machine: any) => (
            <div
              key={machine.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {machine.translations?.[0]?.name || machine.code}
                      </h3>
                      <p className="text-sm text-gray-500">{machine.code}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      STATUS_COLORS[machine.status as keyof typeof STATUS_COLORS]
                    }`}
                  >
                    {STATUS_LABELS[machine.status as keyof typeof STATUS_LABELS]}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tip:</span>
                    <span className="font-medium text-gray-900">{machine.machineType}</span>
                  </div>
                  {machine.capacityPerHour && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kapasite:</span>
                      <span className="font-medium text-gray-900">
                        {machine.capacityPerHour} adet/saat
                      </span>
                    </div>
                  )}
                  {machine.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lokasyon:</span>
                      <span className="font-medium text-gray-900">{machine.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">İş Emirleri:</span>
                    <span className="font-medium text-gray-900">
                      {machine._count?.workOrders || 0} adet
                    </span>
                  </div>
                </div>

                {/* Utilization (Mock Data - will be real when API is ready) */}
                {machine.status === 'ACTIVE' && (
                  <div className="mb-4">
                    <UtilizationBar rate={Math.random() * 100} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/machines/${machine.id}`}
                    className="flex-1 px-3 py-2 text-sm text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Detay
                  </Link>
                  {machine.status === 'ACTIVE' && (
                    <button className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
                      Bakım Planla
                    </button>
                  )}
                  {machine.status === 'BROKEN' && (
                    <button className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      Onarıldı
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500">
            Makine bulunamadı
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Kapasite Yönetimi</h4>
            <p className="text-sm text-blue-700 mt-1">
              Makine kapasite kullanımları otomatik hesaplanır. %70'in üzerindeki kullanım
              sarı, %85'in üzerindeki kullanım kırmızı renkte gösterilir. Bakım planlamaları
              kapasite hesaplamalarına dahil edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
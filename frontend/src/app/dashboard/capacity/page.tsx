'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { capacityApi } from '@/lib/api'
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Calendar } from 'lucide-react'

function CapacityCard({ 
  machine, 
  utilization 
}: { 
  machine: any
  utilization: number 
}) {
  let statusColor = 'text-green-600'
  let bgColor = 'bg-green-50'
  let barColor = 'bg-green-500'
  let status = 'AVAILABLE'

  if (utilization > 100) {
    statusColor = 'text-red-600'
    bgColor = 'bg-red-50'
    barColor = 'bg-red-500'
    status = 'OVERLOADED'
  } else if (utilization > 85) {
    statusColor = 'text-orange-600'
    bgColor = 'bg-orange-50'
    barColor = 'bg-orange-500'
    status = 'CRITICAL'
  } else if (utilization > 70) {
    statusColor = 'text-yellow-600'
    bgColor = 'bg-yellow-50'
    barColor = 'bg-yellow-500'
    status = 'BUSY'
  }

  return (
    <div className={`rounded-lg p-4 ${bgColor} border border-gray-200`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{machine.name}</h3>
        <span className={`text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Kullanım Oranı</span>
          <span className={`font-semibold ${statusColor}`}>{utilization.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {machine.machineType}
        </div>
      </div>
    </div>
  )
}

export default function CapacityPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const { data: overview, isLoading } = useQuery({
    queryKey: ['capacity-overview', dateRange],
    queryFn: () => capacityApi.getOverview({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  })

  const { data: forecast } = useQuery({
    queryKey: ['capacity-forecast'],
    queryFn: () => capacityApi.getForecast(30),
  })

  const summaryStats = [
    {
      label: 'Kullanılabilir',
      value: overview?.summary?.available || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Meşgul',
      value: overview?.summary?.busy || 0,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Kritik',
      value: overview?.summary?.critical || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Aşırı Yüklü',
      value: overview?.summary?.overloaded || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kapasite Planlama</h1>
        <p className="text-gray-600 mt-1">
          Makine kapasitelerini görüntüleyin ve gelecek planlaması yapın
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1"></div>
          <div className="text-sm text-gray-600">
            Ortalama Kullanım: 
            <span className="font-semibold text-gray-900 ml-2">
              {overview?.summary?.averageUtilization?.toFixed(1) || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryStats.map((stat) => (
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

      {/* Machines Capacity Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Makine Kapasiteleri</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Kullanılabilir (&lt;70%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Meşgul (70-85%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Kritik (85-100%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Aşırı Yüklü (&gt;100%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : overview?.machines && overview.machines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.machines.map((item: any) => (
                <CapacityCard
                  key={item.machine.id}
                  machine={item.machine}
                  utilization={item.utilizationRate || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Kapasite verisi yok
            </div>
          )}
        </div>
      </div>

      {/* Bottlenecks Alert */}
      {overview?.bottlenecks && overview.bottlenecks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Darboğaz Uyarısı
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Aşağıdaki makineler aşırı yüklenmiş durumda:
              </p>
              <div className="space-y-2">
                {overview.bottlenecks.map((bottleneck: any) => (
                  <div
                    key={bottleneck.machineId}
                    className="bg-white rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {bottleneck.machineName || bottleneck.machineCode}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({bottleneck.machineCode})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {bottleneck.utilizationRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-red-500">
                        +{bottleneck.overloadedBy.toFixed(1)}% fazla
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Kapasite Hesaplama</h4>
            <p className="text-sm text-blue-700 mt-1">
              Kapasite kullanımı, vardiya saatleri, planlı bakımlar ve mevcut iş emirleri
              baz alınarak otomatik hesaplanır. %100'ün üzerindeki değerler fazla mesai
              veya ek makine ihtiyacını gösterir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
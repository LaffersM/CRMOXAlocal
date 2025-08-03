import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Users, 
  UserPlus, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  Zap,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  prospects: number
  clients: number
  devis: number
  commandes: number
  factures: number
  ca_total: number
  marge_totale: number
  prime_cee_totale: number
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    prospects: 0,
    clients: 0,
    devis: 0,
    commandes: 0,
    factures: 0,
    ca_total: 0,
    marge_totale: 0,
    prime_cee_totale: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        // Enhanced demo data
        setStats({
          prospects: 12,
          clients: 8,
          devis: 15,
          commandes: 6,
          factures: 4,
          ca_total: 45000,
          marge_totale: 12000,
          prime_cee_totale: 3500
        })
        setMonthlyData([
          { month: 'Jan', ca: 15000 },
          { month: 'Fév', ca: 18000 },
          { month: 'Mar', ca: 12000 },
          { month: 'Avr', ca: 22000 },
          { month: 'Mai', ca: 19000 },
          { month: 'Juin', ca: 25000 }
        ])
        setStatusData([
          { name: 'Brouillon', value: 5, color: '#6B7280' },
          { name: 'Envoyé', value: 7, color: '#3B82F6' },
          { name: 'Accepté', value: 3, color: '#10B981' },
          { name: 'Refusé', value: 1, color: '#EF4444' }
        ])
        return
      }

      // Fetch data with error handling for each table
      const fetchWithFallback = async (table: string) => {
        try {
          const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
          return { count: count || 0, error }
        } catch {
          return { count: 0, error: null }
        }
      }

      // Fetch basic counts with fallbacks
      const [prospects, clients, devis, commandes, factures] = await Promise.all([
        fetchWithFallback('prospects'),
        fetchWithFallback('clients'),
        fetchWithFallback('devis'),
        fetchWithFallback('commandes'),
        fetchWithFallback('factures')
      ])

      // Fetch financial data with error handling
      let devisData = []
      let facturesData = []

      try {
        const { data: devisResponse } = await supabase
          .from('devis')
          .select('total_ttc, marge_totale, cee_montant_total, statut, created_at')
        devisData = devisResponse || []
      } catch (error) {
        console.warn('Erreur récupération devis:', error)
      }

      try {
        const { data: facturesResponse } = await supabase
          .from('factures')
          .select('total_ttc, date_facture, created_at')
          .eq('statut', 'payee')
        facturesData = facturesResponse || []
      } catch (error) {
        console.warn('Erreur récupération factures:', error)
      }

      // Calculate totals with fallbacks
      const ca_total = facturesData.reduce((sum, f) => sum + (f.total_ttc || 0), 0)
      const marge_totale = devisData.reduce((sum, d) => sum + (d.marge_totale || 0), 0)
      const prime_cee_totale = devisData.reduce((sum, d) => sum + (d.cee_montant_total || 0), 0)

      // Prepare monthly data from the last 6 months
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        return {
          month: date.toLocaleString('fr-FR', { month: 'short' }),
          fullDate: date
        }
      }).reverse()

      const monthlyStats = last6Months.map(({ month, fullDate }) => {
        const monthData = facturesData.filter(f => {
          const factureDate = new Date(f.date_facture || f.created_at)
          return factureDate.getMonth() === fullDate.getMonth() && 
                 factureDate.getFullYear() === fullDate.getFullYear()
        })
        return {
          month,
          ca: monthData.reduce((sum, f) => sum + (f.total_ttc || 0), 0)
        }
      })

      // Prepare status data with French labels and colors
      const statusMapping = {
        'brouillon': { label: 'Brouillon', color: '#6B7280' },
        'envoye': { label: 'Envoyé', color: '#3B82F6' },
        'accepte': { label: 'Accepté', color: '#10B981' },    
        'refuse': { label: 'Refusé', color: '#EF4444' },
        'expire': { label: 'Expiré', color: '#F59E0B' }
      }

      const statusStats = devisData.reduce((acc: any, devis) => {
        const status = devis.statut || 'brouillon'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      const statusArray = Object.entries(statusStats).map(([status, count]) => ({
        name: statusMapping[status as keyof typeof statusMapping]?.label || status,
        value: count,
        color: statusMapping[status as keyof typeof statusMapping]?.color || '#6B7280'
      }))

      setStats({
        prospects: prospects.count,
        clients: clients.count,
        devis: devis.count,
        commandes: commandes.count,
        factures: factures.count,
        ca_total,
        marge_totale,
        prime_cee_totale
      })

      setMonthlyData(monthlyStats)
      setStatusData(statusArray)

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue {profile?.prenom}, voici un aperçu de votre activité
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prospects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.prospects}</p>
              <p className="text-xs text-gray-500 mt-1">Pipeline commercial</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
              <p className="text-xs text-gray-500 mt-1">Base clients active</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Devis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.devis}</p>
              <p className="text-xs text-gray-500 mt-1">Propositions commerciales</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.commandes}</p>
              <p className="text-xs text-gray-500 mt-1">En cours de traitement</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ca_total)}</p>
              <p className="text-xs text-gray-500 mt-1">Factures payées</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Marge totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.marge_totale)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.ca_total > 0 ? `${((stats.marge_totale / stats.ca_total) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primes CEE</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.prime_cee_totale)}</p>
              <p className="text-xs text-gray-500 mt-1">Économies d'énergie</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            CA mensuel (6 derniers mois)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'CA']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="ca" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Statut des devis
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun devis pour le moment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
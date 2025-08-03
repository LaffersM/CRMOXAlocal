import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Client } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { ClientForm } from './ClientForm'
import { ClientDetails } from './ClientDetails'

export function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'city'>('all')
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      if (!isSupabaseConfigured()) {
        // Enhanced demo data
        setClients([
          {
            id: '1',
            nom: 'Jean Dupont',
            entreprise: 'Industrie Verte SA',
            siret: '12345678901234',
            email: 'jean.dupont@industrie-verte.fr',
            telephone: '01 23 45 67 89',
            adresse: '123 Rue de la Paix',
            ville: 'Paris',
            code_postal: '75001',
            pays: 'France',
            contact_principal: 'Jean Dupont - Directeur Technique',
            notes: 'Client premium, projets récurrents',
            commercial_id: profile?.id,
            prospect_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Marie Martin',
            entreprise: 'EcoTech Solutions',
            siret: '98765432109876',
            email: 'marie.martin@ecotech.com',
            telephone: '01 98 76 54 32',
            adresse: '456 Avenue des Champs',
            ville: 'Lyon',
            code_postal: '69000',
            pays: 'France',
            contact_principal: 'Marie Martin - Responsable Achats',
            notes: 'Spécialisé dans les solutions énergétiques',
            commercial_id: profile?.id,
            prospect_id: null,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours plus tôt
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            nom: 'Pierre Durand',
            entreprise: 'Manufacturing Plus',
            siret: '11122233344455',
            email: 'p.durand@manufplus.fr',
            telephone: '04 56 78 90 12',
            adresse: '789 Boulevard Industriel',
            ville: 'Marseille',
            code_postal: '13000',
            pays: 'France',
            contact_principal: 'Pierre Durand - Chef de projet',
            notes: 'Intéressé par les solutions CEE',
            commercial_id: profile?.id,
            prospect_id: null,
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 jours plus tôt
            updated_at: new Date().toISOString()
          }
        ])
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      setError('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchClients(true)
  }

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      setError(null)

      if (!isSupabaseConfigured()) {
        const newClient: Client = {
          id: Date.now().toString(),
          ...clientData,
          commercial_id: profile?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Client
        setClients([newClient, ...clients])
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, commercial_id: profile?.id }])
        .select()
        .single()

      if (error) throw error
      setClients([data, ...clients])
      setShowForm(false)
    } catch (error: any) {
      console.error('Error creating client:', error)
      setError('Erreur lors de la création du client')
    }
  }

  const handleUpdateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      setError(null)

      if (!isSupabaseConfigured()) {
        setClients(clients.map(c => 
          c.id === id ? { ...c, ...clientData, updated_at: new Date().toISOString() } : c
        ))
        setEditingClient(null)
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .update({ ...clientData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setClients(clients.map(c => c.id === id ? data : c))
      setEditingClient(null)
      setShowForm(false)
    } catch (error: any) {
      console.error('Error updating client:', error)
      setError('Erreur lors de la modification du client')
    }
  }

  const handleDeleteClient = async (id: string) => {
    const client = clients.find(c => c.id === id)
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${client?.entreprise}" ?`)) return

    try {
      setError(null)

      if (!isSupabaseConfigured()) {
        setClients(clients.filter(c => c.id !== id))
        return
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      setClients(clients.filter(c => c.id !== id))
    } catch (error: any) {
      console.error('Error deleting client:', error)
      setError('Erreur lors de la suppression du client')
    }
  }

  const exportToCSV = () => {
    const csvData = clients.map(client => ({
      Nom: client.nom,
      Entreprise: client.entreprise,
      Email: client.email || '',
      Téléphone: client.telephone || '',
      Ville: client.ville || '',
      'Code postal': client.code_postal || '',
      SIRET: client.siret || '',
      'Date création': new Date(client.created_at).toLocaleDateString('fr-FR')
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtrage avancé
  const getFilteredClients = () => {
    let filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase()
      return client.nom.toLowerCase().includes(searchLower) ||
             client.entreprise.toLowerCase().includes(searchLower) ||
             client.email?.toLowerCase().includes(searchLower) ||
             client.ville?.toLowerCase().includes(searchLower) ||
             client.siret?.includes(searchTerm)
    })

    switch (filterBy) {
      case 'recent':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(c => new Date(c.created_at) > thirtyDaysAgo)
        break
      case 'city':
        filtered = filtered.sort((a, b) => (a.ville || '').localeCompare(b.ville || ''))
        break
      default:
        // 'all' - pas de filtre supplémentaire
        break
    }

    return filtered
  }

  const filteredClients = getFilteredClients()

  // Statistiques calculées
  const stats = {
    total: clients.length,
    newThisMonth: clients.filter(c => {
      const created = new Date(c.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length,
    citiesCovered: new Set(clients.map(c => c.ville).filter(Boolean)).size,
    withSiret: clients.filter(c => c.siret).length
  }

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Clients
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez votre portefeuille clients ({clients.length} client{clients.length !== 1 ? 's' : ''})
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            {clients.length > 0 && (
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </button>
            )}
            <button
              onClick={() => {
                setEditingClient(null)
                setShowForm(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Villes couvertes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.citiesCovered}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avec SIRET</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withSiret}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, entreprise, email, ville ou SIRET..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'recent' | 'city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les clients</option>
              <option value="recent">Récents (30 jours)</option>
              <option value="city">Trier par ville</option>
            </select>
          </div>
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredClients.length} résultat{filteredClients.length !== 1 ? 's' : ''} pour "{searchTerm}"
          </p>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                    {client.siret && (
                      <div className="text-xs text-gray-500">SIRET: {client.siret}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{client.entreprise}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                            {client.email}
                          </a>
                        </div>
                      )}
                      {client.telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          <a href={`tel:${client.telephone}`} className="hover:text-blue-600">
                            {client.telephone}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.ville && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.ville} {client.code_postal && `(${client.code_postal})`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setShowForm(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || filterBy !== 'all' ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterBy !== 'all'
                ? 'Aucun client ne correspond à vos critères.'
                : 'Commencez par ajouter votre premier client.'
              }
            </p>
            {!searchTerm && filterBy === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={editingClient 
            ? (data) => handleUpdateClient(editingClient.id, data)
            : handleCreateClient
          }
          onCancel={() => {
            setShowForm(false)
            setEditingClient(null)
          }}
        />
      )}

      {showDetails && selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => {
            setShowDetails(false)
            setSelectedClient(null)
          }}
          onEdit={() => {
            setEditingClient(selectedClient)
            setShowForm(true)
            setShowDetails(false)
          }}
        />
      )}
    </div>
  )
}
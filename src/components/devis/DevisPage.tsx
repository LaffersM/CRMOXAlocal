import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, OXADevis, Client, Article } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import ConversionDevisModal from '../commandes/ConversionDevisModal';
import { ShoppingCart } from 'lucide-react';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Euro,
  TrendingUp,
  Send,
  Check,
  X,
  Clock,
  Zap,
  ChevronDown,
  Package,
  Receipt
} from 'lucide-react'
import OXADevisGenerator from './OXADevisGenerator'
import { DevisDetails } from './DevisDetails'

// Composant pour le dropdown de statut
interface StatusDropdownProps {
  currentStatus: string;
  devisId: string;
  onStatusChange: (devisId: string, newStatus: string, triggerConversion?: boolean) => void;
  disabled?: boolean;
}

function StatusDropdown({ currentStatus, devisId, onStatusChange, disabled }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: Clock },
    { value: 'envoye', label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Send },
    { value: 'accepte', label: 'Accepté', color: 'bg-green-100 text-green-800', icon: Check },
    { value: 'refuse', label: 'Refusé', color: 'bg-red-100 text-red-800', icon: X },
    { value: 'expire', label: 'Expiré', color: 'bg-orange-100 text-orange-800', icon: Calendar }
  ]

  const currentStatusData = statusOptions.find(s => s.value === currentStatus)
  const StatusIcon = currentStatusData?.icon || Clock

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      // Si on passe en "accepté", déclencher la modal de conversion
      if (newStatus === 'accepte' && currentStatus !== 'accepte') {
        onStatusChange(devisId, newStatus, true) // true = déclencher conversion
      } else {
        onStatusChange(devisId, newStatus, false)
      }
    }
    setIsOpen(false)
  }

  if (disabled) {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${currentStatusData?.color}`}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {currentStatusData?.label}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full hover:opacity-80 transition-opacity ${currentStatusData?.color}`}
        title="Cliquer pour changer le statut"
      >
        <StatusIcon className="h-3 w-3 mr-1" />
        {currentStatusData?.label}
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute z-20 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg">
            {statusOptions.map((status) => {
              const Icon = status.icon
              const isSelected = status.value === currentStatus

              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusSelect(status.value)}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center ${isSelected ? 'bg-blue-50 font-medium' : ''
                    }`}
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {status.label}
                  {isSelected && <Check className="h-3 w-3 ml-auto text-blue-600" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Modal de conversion
interface ConversionModalProps {
  isOpen: boolean;
  devis: OXADevis | null;
  client: Client | null;
  onClose: () => void;
  onConvertToCommande: () => void;
  onConvertToFacture: () => void;
}

function ConversionModal({ isOpen, devis, client, onClose, onConvertToCommande, onConvertToFacture }: ConversionModalProps) {
  if (!isOpen || !devis) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Devis accepté !
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Le devis <span className="font-medium">{devis.numero}</span> pour {client?.entreprise} a été accepté.
            </p>
            <p className="text-sm text-gray-600">
              Que souhaitez-vous faire maintenant ?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onConvertToCommande}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Convertir en Commande</div>
                  <div className="text-sm text-gray-500">Suivre l'installation et la livraison</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
            </button>

            <button
              onClick={onConvertToFacture}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Convertir en Facture</div>
                  <div className="text-sm text-gray-500">Facturation directe</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Décider plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DevisPage() {
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [devisToConvert, setDevisToConvert] = useState<OXADevis | null>(null);
  const [showPlanificationModal, setShowPlanificationModal] = useState(false);
  const [selectedDevisForConversion, setSelectedDevisForConversion] = useState<OXADevis | null>(null)
  const { profile } = useAuth()
  const [devis, setDevis] = useState<OXADevis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showOXAGenerator, setShowOXAGenerator] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDevis, setSelectedDevis] = useState<OXADevis | null>(null)
  const [editingDevis, setEditingDevis] = useState<OXADevis | null>(null)

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'gray' },
    { value: 'brouillon', label: 'Brouillon', color: 'gray' },
    { value: 'envoye', label: 'Envoyé', color: 'blue' },
    { value: 'accepte', label: 'Accepté', color: 'green' },
    { value: 'refuse', label: 'Refusé', color: 'red' },
    { value: 'expire', label: 'Expiré', color: 'orange' }
  ]

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo data avec les nouvelles structures
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
            notes: 'Client premium',
            commercial_id: profile?.id,
            prospect_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

        setArticles([
          {
            id: '1',
            nom: 'Récupérateur de chaleur industriel',
            description: 'Système de récupération de chaleur haute performance',
            type: 'IPE',
            prix_achat: 8000,
            prix_vente: 12000,
            tva: 20,
            unite: 'unité',
            fournisseur_id: undefined,
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Installation et mise en service',
            description: 'Service d\'installation et de mise en service',
            type: 'MAIN_OEUVRE',
            prix_achat: 0,
            prix_vente: 2500,
            tva: 20,
            unite: 'jour',
            fournisseur_id: undefined,
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

        setDevis([
          {
            id: '1',
            numero: 'OXA-2024-IND-001',
            date_devis: new Date().toISOString().split('T')[0],
            objet: 'Mise en place d\'un système de mesurage IPE',
            client_id: '1',
            description_operation: 'Installation d\'un système de récupération de chaleur pour optimiser l\'efficacité énergétique',
            zone: 'Zone production',
            lignes: [
              {
                id: '1',
                designation: 'Récupérateur de chaleur industriel',
                zone: 'Zone production',
                quantite: 1,
                prix_unitaire: 12000,
                prix_total: 12000,
                remarques: 'Installation incluse',
                type: 'materiel'
              }
            ],
            lignes_data: [
              {
                id: '1',
                designation: 'Récupérateur de chaleur industriel',
                zone: 'Zone production',
                quantite: 1,
                prix_unitaire: 12000,
                prix_total: 12000,
                remarques: 'Installation incluse',
                type: 'materiel'
              }
            ],
            cee_kwh_cumac: 1500,
            cee_prix_unitaire: 7.30,
            cee_montant_total: 10950,
            total_ht: 12000,
            tva_taux: 20,
            total_tva: 240,
            total_ttc: 1440,
            reste_a_payer_ht: 1050,
            remarques: 'Projet pilote pour la décarbonation',
            type: 'IPE',
            modalites_paiement: '30% à la commande, 70% à la livraison',
            garantie: '2 ans pièces et main d\'œuvre',
            penalites: 'Pénalités de retard : 0,1% par jour',
            clause_juridique: 'Tribunal de Commerce de Paris',
            statut: 'envoye',
            commercial_id: profile?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const [devisData, clientsData, articlesData] = await Promise.all([
        supabase.from('devis').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('articles').select('*')
      ])

      if (devisData.error) throw devisData.error
      if (clientsData.error) throw clientsData.error
      if (articlesData.error) throw articlesData.error

      setDevis(devisData.data || [])
      setClients(clientsData.data || [])
      setArticles(articlesData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDevis = async (devisData: any) => {
    try {
      console.log('Données reçues du générateur:', devisData); // Debug

      if (!isSupabaseConfigured()) {
        const newDevis: OXADevis = {
          id: Date.now().toString(),
          numero: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
          date_creation: new Date().toISOString().split('T')[0],
          ...devisData,
          commercial_id: profile?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setDevis([newDevis, ...devis])
        setShowOXAGenerator(false)
        return
      }

      // Générer un numéro de devis unique
      const year = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-6)
      const numero = `DEV-${year}-${timestamp}`

      // Préparer les données pour Supabase
      const supabaseData = {
        // Champs obligatoires de base
        numero,
        date_devis: devisData.date_devis || new Date().toISOString().split('T')[0],
        date_creation: new Date().toISOString().split('T')[0],
        objet: devisData.objet,
        client_id: devisData.client_id,
        commercial_id: profile?.id,

        // Type et statut
        type: devisData.type || 'CEE',
        statut: devisData.statut || 'brouillon',

        // Montants financiers
        total_ht: devisData.total_ht || 0,
        total_tva: devisData.total_tva || 0,
        total_ttc: devisData.total_ttc || 0,
        tva_taux: devisData.tva_taux || 20.00,
        marge_totale: devisData.marge_totale || 0,

        // Conditions commerciales
        modalites_paiement: devisData.modalites_paiement || null,
        garantie: devisData.garantie || null,
        penalites: devisData.penalites || null,
        clause_juridique: devisData.clause_juridique || null,

        // Champs spécifiques CEE (optionnels)
        ...(devisData.cee_kwh_cumac && {
          cee_kwh_cumac: devisData.cee_kwh_cumac,
          cee_prix_unitaire: devisData.cee_prix_unitaire || 0.002,
          cee_montant_total: devisData.cee_montant_total || devisData.prime_cee || 0,
          reste_a_payer_ht: devisData.reste_a_payer_ht || devisData.net_a_payer || 0
        }),

        // Données des lignes
        lignes_data: devisData.lignes_data || [],

        // Champs texte optionnels
        description_operation: devisData.description_operation || null,
        remarques: devisData.remarques || null
      }

      // Nettoyer les champs qui ne sont pas dans la base de données
      delete supabaseData.client
      delete supabaseData.lignes
      delete supabaseData.zones
      delete supabaseData.cee_params
      delete supabaseData.cee_result
      delete supabaseData.cee_mode
      delete supabaseData.cee_integration
      delete supabaseData.cee_calculation
      delete supabaseData.prime_cee_deduite
      delete supabaseData.net_a_payer

      console.log('Données à envoyer à Supabase:', supabaseData); // Debug

      const { data, error } = await supabase
        .from('devis')
        .insert([supabaseData])
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase détaillée:', error)
        throw error
      }

      console.log('Devis créé avec succès:', data); // Debug

      setDevis([data, ...devis])
      setShowOXAGenerator(false)

      // Message de succès
      alert('Devis créé avec succès !')

    } catch (error: any) {
      console.error('Error creating devis:', error)

      // Message d'erreur détaillé
      if (error?.message) {
        alert(`Erreur lors de la création du devis: ${error.message}`)
      } else {
        alert('Erreur inconnue lors de la création du devis')
      }
    }
  }

  const handleUpdateDevis = async (id: string, devisData: any) => {
    try {
      console.log('Données reçues pour mise à jour:', devisData); // Debug

      if (!isSupabaseConfigured()) {
        setDevis(devis.map(d =>
          d.id === id ? { ...d, ...devisData, updated_at: new Date().toISOString() } : d
        ))
        setEditingDevis(null)
        setShowOXAGenerator(false)
        return
      }

      // Préparer les données pour Supabase - MÊME LOGIQUE que handleCreateDevis
      const supabaseData = {
        // Champs obligatoires de base
        date_devis: devisData.date_devis || new Date().toISOString().split('T')[0],
        objet: devisData.objet,
        client_id: devisData.client_id,
        commercial_id: profile?.id,

        // Type et statut
        type: devisData.type || 'CEE',
        statut: devisData.statut || 'brouillon',

        // Montants financiers
        total_ht: devisData.total_ht || 0,
        total_tva: devisData.total_tva || 0,
        total_ttc: devisData.total_ttc || 0,
        tva_taux: devisData.tva_taux || 20.00,
        marge_totale: devisData.marge_totale || 0,

        // Conditions commerciales
        modalites_paiement: devisData.modalites_paiement || null,
        garantie: devisData.garantie || null,
        penalites: devisData.penalites || null,
        clause_juridique: devisData.clause_juridique || null,
        delais: devisData.delais || null,

        // Champs spécifiques CEE (optionnels)
        ...(devisData.cee_kwh_cumac && {
          cee_kwh_cumac: devisData.cee_kwh_cumac,
          cee_prix_unitaire: devisData.cee_prix_unitaire || 0.002,
          cee_montant_total: devisData.cee_montant_total || devisData.prime_cee || 0,
          reste_a_payer_ht: devisData.reste_a_payer_ht || devisData.net_a_payer || 0
        }),

        // Données des lignes
        lignes_data: devisData.lignes_data || [],

        // Champs texte optionnels
        description_operation: devisData.description_operation || null,
        remarques: devisData.remarques || null,

        // Horodatage
        updated_at: new Date().toISOString()
      }

      // Nettoyer les champs qui ne sont pas dans la base de données
      delete supabaseData.client
      delete supabaseData.lignes
      delete supabaseData.zones
      delete supabaseData.cee_params
      delete supabaseData.cee_result
      delete supabaseData.cee_mode
      delete supabaseData.cee_integration
      delete supabaseData.cee_calculation
      delete supabaseData.prime_cee_deduite
      delete supabaseData.net_a_payer
      delete supabaseData.prime_cee

      console.log('Données à envoyer à Supabase pour mise à jour:', supabaseData); // Debug

      const { data, error } = await supabase
        .from('devis')
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase détaillée:', error)
        throw error
      }

      console.log('Devis mis à jour avec succès:', data); // Debug

      setDevis(devis.map(d => d.id === id ? data : d))
      setEditingDevis(null)
      setShowOXAGenerator(false)

      // Message de succès
      alert('Devis mis à jour avec succès !')

    } catch (error: any) {
      console.error('Error updating devis:', error)

      // Message d'erreur détaillé
      if (error?.message) {
        alert(`Erreur lors de la mise à jour du devis: ${error.message}`)
      } else {
        alert('Erreur inconnue lors de la mise à jour du devis')
      }
    }
  }

  const handleStatusChange = async (devisId: string, newStatus: string, triggerConversion: boolean = false) => {
    try {
      // Vérifier si on passe en "accepté" pour déclencher la conversion
      const currentDevis = devis.find(d => d.id === devisId)

      if (!isSupabaseConfigured()) {
        // Mode démo
        const updatedDevis = { ...currentDevis!, statut: newStatus, updated_at: new Date().toISOString() }
        setDevis(devis.map(d =>
          d.id === devisId ? updatedDevis : d
        ))

        // Si conversion déclenchée, ouvrir la modal
        if (triggerConversion && currentDevis) {
          setSelectedDevisForConversion(updatedDevis)
          setShowConversionModal(true)
        } else {
          const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus
          alert(`Statut changé vers "${statusLabel}" avec succès !`)
        }
        return
      }

      const { data, error } = await supabase
        .from('devis')
        .update({
          statut: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', devisId)
        .select()
        .single()

      if (error) throw error

      setDevis(devis.map(d => d.id === devisId ? data : d))

      // Si conversion déclenchée, ouvrir la modal
      if (triggerConversion) {
        setSelectedDevisForConversion(data)
        setShowConversionModal(true)
      } else {
        const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus
        alert(`Statut changé vers "${statusLabel}" avec succès !`)
      }

    } catch (error: any) {
      console.error('Erreur changement de statut:', error)
      alert(`Erreur lors du changement de statut: ${error.message}`)
    }
  }

  const handleDeleteDevis = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return

    try {
      if (!isSupabaseConfigured()) {
        setDevis(devis.filter(d => d.id !== id))
        return
      }

      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDevis(devis.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting devis:', error)
    }
  }

  const handleClientCreated = (newClient: Client) => {
    setClients([newClient, ...clients])
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.nom} - ${client.entreprise}` : 'Client inconnu'
  }

  // Fonctions de conversion
  const handleConvertToCommande = (devis: OXADevis) => {
    // Préparer les données du devis pour la conversion
    const devisForConversion = {
      id: devis.id,
      numero: devis.numero,
      client_id: devis.client_id,
      total_ht: devis.total_ht,
      total_ttc: devis.total_ttc,
      client: clients.find(c => c.id === devis.client_id)
    };

    // Fermer la première modal et ouvrir la modal de planification
    setShowConversionModal(false);
    setSelectedDevisForConversion(null);
    setDevisToConvert(devisForConversion);
    setShowPlanificationModal(true);
  };

  const handleConversionSuccess = (commandeId: string) => {
    console.log('Commande créée depuis devis:', commandeId);
    setShowConversionModal(false);
    setSelectedDevisForConversion(null);
    // Actualiser la liste des devis
    fetchData();
  };

  const handleConvertToFacture = () => {
    if (selectedDevisForConversion) {
      // Ici vous pouvez rediriger vers la page des factures ou créer une nouvelle facture
      console.log('Conversion en facture:', selectedDevisForConversion)
      alert('Fonctionnalité de conversion en facture à implémenter')
      setShowConversionModal(false)
      setSelectedDevisForConversion(null)
    }
  }

  const filteredDevis = devis.filter(devis => {
    const client = clients.find(c => c.id === devis.client_id)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = devis.numero.toLowerCase().includes(searchLower) ||
      client?.nom.toLowerCase().includes(searchLower) ||
      client?.entreprise.toLowerCase().includes(searchLower) ||
      devis.objet.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'all' || devis.statut === statusFilter
    const matchesType = typeFilter === 'all' || devis.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'gray'
  }

  const getStatusBadgeClass = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      brouillon: Clock,
      envoye: Send,
      accepte: Check,
      refuse: X,
      expire: Calendar
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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

  // Affichage des générateurs
  if (showOXAGenerator) {
    return (
      <OXADevisGenerator
        clients={clients}
        articles={articles}
        onClientCreated={handleClientCreated}
        onSave={editingDevis
          ? (data) => handleUpdateDevis(editingDevis.id, data)
          : handleCreateDevis
        }
        onCancel={() => {
          setShowOXAGenerator(false)
          setEditingDevis(null)
        }}
        existingDevis={editingDevis}
      />
    )
  }

  if (showDetails && selectedDevis) {
    const client = clients.find(c => c.id === selectedDevis.client_id)
    return (
      <DevisDetails
        devis={selectedDevis}
        client={client}
        onClose={() => {
          setShowDetails(false)
          setSelectedDevis(null)
        }}
        onEdit={() => {
          const associatedClient = clients.find(c => c.id === selectedDevis.client_id)

          const enrichedDevis = {
            ...selectedDevis,
            client: associatedClient,
            objet: selectedDevis.objet || '',
            description_operation: selectedDevis.description_operation || '',
            remarques: selectedDevis.remarques || '',
            modalites_paiement: selectedDevis.modalites_paiement || '30% à la commande, 70% à la livraison',
            garantie: selectedDevis.garantie || '2 ans pièces et main d\'œuvre',
            penalites: selectedDevis.penalites || 'Pénalités de retard : 0,1% par jour',
            clause_juridique: selectedDevis.clause_juridique || 'Tribunal de Commerce de Paris',
            delais: selectedDevis.delais || '4 à 6 semaines après validation du devis',
            // Données CEE
            cee_kwh_cumac: selectedDevis.cee_kwh_cumac || 0,
            cee_prix_unitaire: selectedDevis.cee_prix_unitaire || 0.002,
            cee_montant_total: selectedDevis.cee_montant_total || 0,
            reste_a_payer_ht: selectedDevis.reste_a_payer_ht || 0,
            // Structure de calcul CEE
            cee_calculation: selectedDevis.cee_calculation || {
              puissance_nominale: 0,
              profil_fonctionnement: '1x8h',
              duree_contrat: 1,
              coefficient_activite: 1,
              facteur_f: 1,
              tarif_kwh: 0.002
            },
            cee_integration: selectedDevis.cee_integration || {
              mode: 'deduction',
              afficher_bloc: true
            }
          }

          setEditingDevis(enrichedDevis)
          setShowOXAGenerator(true)  // Toujours CEE maintenant
          setShowDetails(false)
        }}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Modal de conversion */}
      <ConversionModal
        isOpen={showConversionModal}
        devis={selectedDevisForConversion}
        client={selectedDevisForConversion ? clients.find(c => c.id === selectedDevisForConversion.client_id) || null : null}
        onClose={() => {
          setShowConversionModal(false)
          setSelectedDevisForConversion(null)
        }}
        onConvertToCommande={handleConvertToCommande}
        onConvertToFacture={handleConvertToFacture}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Devis
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos devis et propositions commerciales
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingDevis(null)
                setShowOXAGenerator(true)
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Devis CEE
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total devis</p>
              <p className="text-2xl font-bold text-gray-900">{devis.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CA potentiel</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(devis.reduce((sum, d) => sum + d.total_ttc, 0))}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primes CEE</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(devis.reduce((sum, d) => sum + (d.cee_montant_total || 0), 0))}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptés</p>
              <p className="text-2xl font-bold text-gray-900">
                {devis.filter(d => d.statut === 'accepte').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, objet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Devis List - Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Version mobile - Cartes empilées */}
        <div className="block lg:hidden">
          <div className="space-y-4 p-4">
            {filteredDevis.map((devis) => {
              const client = clients.find(c => c.id === devis.client_id)
              const StatusIcon = getStatusIcon(devis.statut)
              return (
                <div key={devis.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{devis.numero}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${devis.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                          devis.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                            devis.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                              devis.type === 'MAIN_OEUVRE' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {devis.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {client ? `${client.nom} - ${client.entreprise}` : 'Client inconnu'}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{devis.objet}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-gray-500">Montant TTC:</span>
                      <div className="font-semibold text-gray-900">{formatCurrency(devis.total_ttc)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Prime CEE:</span>
                      <div className="font-semibold text-gray-900">
                        {devis.cee_montant_total ? formatCurrency(devis.cee_montant_total) : '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(devis.date_devis)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Statut:</span>
                      <div>
                        <StatusDropdown
                          currentStatus={devis.statut}
                          devisId={devis.id}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedDevis(devis)
                        setShowDetails(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Voir"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Récupérer le client associé
                        const associatedClient = clients.find(c => c.id === devis.client_id)

                        // Enrichir le devis avec le client et corriger les valeurs null
                        const enrichedDevis = {
                          ...devis,
                          client: associatedClient,
                          objet: devis.objet || '',
                          description_operation: devis.description_operation || '',
                          remarques: devis.remarques || '',
                          modalites_paiement: devis.modalites_paiement || '30% à la commande, 70% à la livraison',
                          garantie: devis.garantie || '2 ans pièces et main d\'œuvre',
                          penalites: devis.penalites || 'Pénalités de retard : 0,1% par jour',
                          clause_juridique: devis.clause_juridique || 'Tribunal de Commerce de Paris',
                          delais: devis.delais || '4 à 6 semaines après validation du devis',
                          // AJOUTER les données CEE par défaut
                          cee_kwh_cumac: devis.cee_kwh_cumac || 0,
                          cee_prix_unitaire: devis.cee_prix_unitaire || 0.002,
                          cee_montant_total: devis.cee_montant_total || 0,
                          reste_a_payer_ht: devis.reste_a_payer_ht || 0,
                          // AJOUTER la structure de calcul CEE
                          cee_calculation: devis.cee_calculation || {
                            puissance_nominale: 0,
                            profil_fonctionnement: '1x8h',
                            duree_contrat: 1,
                            coefficient_activite: 1,
                            facteur_f: 1,
                            tarif_kwh: 0.002
                          },
                          cee_integration: devis.cee_integration || {
                            mode: 'deduction',
                            afficher_bloc: true
                          }
                        }

                        setEditingDevis(enrichedDevis)
                        setShowOXAGenerator(true)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDevis(devis.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Version desktop - Tableau compact */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objet
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prime CEE
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevis.map((devis) => {
                const client = clients.find(c => c.id === devis.client_id)
                const StatusIcon = getStatusIcon(devis.statut)
                return (
                  <tr key={devis.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-[140px] truncate" title={getClientName(devis.client_id)}>
                        {client ? client.entreprise : 'Client inconnu'}
                      </div>
                      <div className="text-xs text-gray-500 max-w-[140px] truncate">
                        {devis.numero}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 max-w-[180px] truncate" title={devis.objet}>
                        {devis.objet}
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${devis.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                        devis.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                          devis.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                            devis.type === 'MAIN_OEUVRE' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                        }`}>
                        {devis.type}
                      </span>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <StatusDropdown
                        currentStatus={devis.statut}
                        devisId={devis.id}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(devis.total_ttc)}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {devis.cee_montant_total ? formatCurrency(devis.cee_montant_total) : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                      {formatDate(devis.date_devis)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedDevis(devis)
                            setShowDetails(true)
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Récupérer le client associé
                            const associatedClient = clients.find(c => c.id === devis.client_id)

                            // Enrichir le devis avec le client et corriger les valeurs null
                            const enrichedDevis = {
                              ...devis,
                              client: associatedClient,
                              objet: devis.objet || '',
                              description_operation: devis.description_operation || '',
                              remarques: devis.remarques || '',
                              modalites_paiement: devis.modalites_paiement || '30% à la commande, 70% à la livraison',
                              garantie: devis.garantie || '2 ans pièces et main d\'œuvre',
                              penalites: devis.penalites || 'Pénalités de retard : 0,1% par jour',
                              clause_juridique: devis.clause_juridique || 'Tribunal de Commerce de Paris',
                              delais: devis.delais || '4 à 6 semaines après validation du devis'
                            }

                            setEditingDevis(enrichedDevis)
                            setShowOXAGenerator(true)
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDevis(devis.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredDevis.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun devis</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Aucun devis ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier devis.'
              }
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setShowOXAGenerator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Devis CEE
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Modal Conversion Devis → Commande */}
      {devisToConvert && (
        <ConversionDevisModal
          devis={devisToConvert}
          isOpen={showPlanificationModal}
          onClose={() => {
            setShowPlanificationModal(false);
            setDevisToConvert(null);
          }}
          onSuccess={handleConversionSuccess}
        />
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import ConversionDevisModal from './ConversionDevisModal';
import NouvelleCommandeModal from './NouvelleCommandeModal';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  ChevronDown,
  Package,
  TrendingUp,
  Timer,
  CalendarDays
} from 'lucide-react';

// ==================== TYPES ====================

interface Commande {
  id: string;
  numero: string;
  client_id: string;
  devis_id?: string;
  statut: 'a_programmer' | 'programmee' | 'en_cours_installation' | 'installe' | 'mise_en_service' | 'termine' | 'suspendu' | 'reporte';
  date_commande: string;
  date_installation_prevue?: string;
  date_installation_reelle?: string;
  equipe_assignee?: string;
  technicien_principal?: string;
  total_ht: number;
  total_ttc: number;
  temps_estime: number;
  temps_reel: number;
  notes_installation?: string;
  adresse_installation?: string;
  contact_site?: string;
  telephone_contact?: string;
  photos: any[];
  documents: any[];
  created_at: string;
  updated_at: string;
  // Relations
  client_entreprise?: string;
  client_nom?: string;
  client_ville?: string;
  client_telephone?: string;
  commercial_nom?: string;
  commercial_prenom?: string;
  devis_numero?: string;
  statut_libelle?: string;
}

interface CommandeKPI {
  total: number;
  a_programmer: number;
  programmee: number;
  en_cours: number;
  termine: number;
  ca_en_cours: number;
  prochaines_interventions: number;
}

// ==================== COMPOSANT PRINCIPAL ====================

export function CommandesPage() {
  const { profile } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [kpis, setKPIs] = useState<CommandeKPI>({
    total: 0,
    a_programmer: 0,
    programmee: 0,
    en_cours: 0,
    termine: 0,
    ca_en_cours: 0,
    prochaines_interventions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNouvelleCommandeModal, setShowNouvelleCommandeModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<any>(null);

  // ==================== CHARGEMENT DES DONNÉES ====================

  const loadCommandes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vue_commandes_complet')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement commandes:', error);
        return;
      }

      const commandesData = data || [];
      setCommandes(commandesData);

      // Calculer les KPIs
      const kpisData: CommandeKPI = {
        total: commandesData.length,
        a_programmer: commandesData.filter(c => c.statut === 'a_programmer').length,
        programmee: commandesData.filter(c => c.statut === 'programmee').length,
        en_cours: commandesData.filter(c => ['en_cours_installation', 'installe', 'mise_en_service'].includes(c.statut)).length,
        termine: commandesData.filter(c => c.statut === 'termine').length,
        ca_en_cours: commandesData
          .filter(c => !['termine', 'suspendu'].includes(c.statut))
          .reduce((sum, c) => sum + (c.total_ttc || 0), 0),
        prochaines_interventions: commandesData.filter(c => {
          if (!c.date_installation_prevue) return false;
          const dateInstall = new Date(c.date_installation_prevue);
          const dans7Jours = new Date();
          dans7Jours.setDate(dans7Jours.getDate() + 7);
          return dateInstall <= dans7Jours && dateInstall >= new Date();
        }).length
      };

      setKPIs(kpisData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandes();
  }, []);

  // ==================== FONCTIONS UTILITAIRES ====================

  const getStatutColor = (statut: string): string => {
    const colors = {
      'a_programmer': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'programmee': 'bg-blue-100 text-blue-800 border-blue-200',
      'en_cours_installation': 'bg-orange-100 text-orange-800 border-orange-200',
      'installe': 'bg-green-100 text-green-800 border-green-200',
      'mise_en_service': 'bg-purple-100 text-purple-800 border-purple-200',
      'termine': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'suspendu': 'bg-red-100 text-red-800 border-red-200',
      'reporte': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatutIcon = (statut: string) => {
    const icons = {
      'a_programmer': <AlertCircle className="h-4 w-4" />,
      'programmee': <Calendar className="h-4 w-4" />,
      'en_cours_installation': <Clock className="h-4 w-4" />,
      'installe': <CheckCircle className="h-4 w-4" />,
      'mise_en_service': <Users className="h-4 w-4" />,
      'termine': <CheckCircle className="h-4 w-4" />,
      'suspendu': <XCircle className="h-4 w-4" />,
      'reporte': <RotateCcw className="h-4 w-4" />
    };
    return icons[statut as keyof typeof icons] || <AlertCircle className="h-4 w-4" />;
  };

  const updateStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      const { error } = await supabase
        .from('commandes')
        .update({ statut: nouveauStatut, updated_at: new Date().toISOString() })
        .eq('id', commandeId);

      if (error) {
        console.error('Erreur mise à jour statut:', error);
        return;
      }

      // Recharger les données
      await loadCommandes();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCommandeCreated = async (commandeId: string) => {
    console.log('Commande créée:', commandeId);
    await loadCommandes(); // Recharger la liste
  };
  // ==================== FILTRAGE ====================

  const commandesFiltrees = commandes.filter(commande => {
    const matchSearch = !searchTerm ||
      commande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.client_entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.client_nom?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatut = statutFilter === 'all' || commande.statut === statutFilter;

    return matchSearch && matchStatut;
  });

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600 mt-1">Suivi et planification des interventions</p>
        </div>
        <button
          onClick={() => setShowNouvelleCommandeModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Commande
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">À Programmer</p>
              <p className="text-2xl font-bold text-yellow-600">{kpis.a_programmer}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CA en Cours</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }).format(kpis.ca_en_cours)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prochaines Interventions</p>
              <p className="text-2xl font-bold text-blue-600">{kpis.prochaines_interventions}</p>
            </div>
            <CalendarDays className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="a_programmer">À programmer</option>
              <option value="programmee">Programmée</option>
              <option value="en_cours_installation">En cours</option>
              <option value="installe">Installé</option>
              <option value="mise_en_service">Mise en service</option>
              <option value="termine">Terminé</option>
              <option value="suspendu">Suspendu</option>
              <option value="reporte">Reporté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des Commandes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Commandes ({commandesFiltrees.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commandesFiltrees.map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {commande.numero}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {commande.client_entreprise}
                      </div>
                      <div className="text-sm text-gray-500">
                        {commande.client_nom} • {commande.client_ville}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={commande.statut}
                      onChange={(e) => updateStatut(commande.id, e.target.value)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(commande.statut)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="a_programmer">🟡 À programmer</option>
                      <option value="programmee">🔵 Programmée</option>
                      <option value="en_cours_installation">🟠 En cours</option>
                      <option value="installe">🟢 Installé</option>
                      <option value="mise_en_service">🟣 Mise en service</option>
                      <option value="termine">✅ Terminé</option>
                      <option value="suspendu">❌ Suspendu</option>
                      <option value="reporte">🔄 Reporté</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {commande.date_installation_prevue ? (
                        <div className="text-sm text-gray-900">
                          {new Date(commande.date_installation_prevue).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">Non programmée</div>
                      )}
                      {commande.temps_estime > 0 && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {commande.temps_estime}h estimé
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {commande.equipe_assignee || '-'}
                    </div>
                    {commande.technicien_principal && (
                      <div className="text-sm text-gray-500">
                        {commande.technicien_principal}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(commande.total_ttc)}
                    </div>
                    <div className="text-sm text-gray-500">
                      HT: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(commande.total_ht)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCommande(commande);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800 p-1 rounded"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {commandesFiltrees.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statutFilter !== 'all'
                ? 'Aucune commande ne correspond aux filtres sélectionnés.'
                : 'Commencez par créer votre première commande.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détail (placeholder) */}
      {showDetailModal && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                Détails - {selectedCommande.numero}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Informations Client</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Entreprise:</strong> {selectedCommande.client_entreprise}</p>
                    <p><strong>Contact:</strong> {selectedCommande.client_nom}</p>
                    <p><strong>Ville:</strong> {selectedCommande.client_ville}</p>
                    {selectedCommande.client_telephone && (
                      <p><strong>Téléphone:</strong> {selectedCommande.client_telephone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Informations Commande</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Statut:</strong> {selectedCommande.statut_libelle}</p>
                    <p><strong>Date commande:</strong> {new Date(selectedCommande.date_commande).toLocaleDateString('fr-FR')}</p>
                    {selectedCommande.date_installation_prevue && (
                      <p><strong>Installation prévue:</strong> {new Date(selectedCommande.date_installation_prevue).toLocaleDateString('fr-FR')}</p>
                    )}
                    <p><strong>Équipe:</strong> {selectedCommande.equipe_assignee || 'Non assignée'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Nouvelle Commande */}
      <NouvelleCommandeModal
        isOpen={showNouvelleCommandeModal}
        onClose={() => setShowNouvelleCommandeModal(false)}
        onSuccess={handleCommandeCreated}
      />

      {/* Modal Conversion Devis */}
      {selectedDevis && (
        <ConversionDevisModal
          devis={selectedDevis}
          isOpen={showConversionModal}
          onClose={() => {
            setShowConversionModal(false);
            setSelectedDevis(null);
          }}
          onSuccess={handleCommandeCreated}
        />
      )}
    </div>
  );
}
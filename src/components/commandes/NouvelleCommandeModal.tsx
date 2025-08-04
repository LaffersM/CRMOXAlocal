import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Phone, 
  FileText, 
  X, 
  CheckCircle,
  AlertTriangle,
  Search
} from 'lucide-react';

// ==================== TYPES ====================

interface Client {
  id: string;
  entreprise: string;
  nom: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
}

interface NouvelleCommandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (commandeId: string) => void;
}

// ==================== COMPOSANT MODAL ====================

export default function NouvelleCommandeModal({ isOpen, onClose, onSuccess }: NouvelleCommandeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    client_id: '',
    date_installation_prevue: '',
    equipe_assignee: '',
    technicien_principal: '',
    temps_estime: 8,
    total_ht: 0,
    total_ttc: 0,
    notes_installation: '',
    adresse_installation: '',
    contact_site: '',
    telephone_contact: '',
    instructions_speciales: ''
  });

  // ==================== CHARGEMENT DES CLIENTS ====================

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, entreprise, nom, adresse, ville, telephone')
        .order('entreprise');

      if (error) {
        console.error('Erreur chargement clients:', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // ==================== GESTION DU FORMULAIRE ====================

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(`${client.entreprise} - ${client.nom}`);
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      adresse_installation: client.adresse || '',
      contact_site: client.nom,
      telephone_contact: client.telephone || ''
    }));
  };

  // ==================== CALCUL TTC ====================

  const calculateTTC = (ht: number) => {
    const ttc = ht * 1.2; // TVA 20%
    setFormData(prev => ({
      ...prev,
      total_ttc: ttc
    }));
  };

  // ==================== CRÉATION COMMANDE ====================

  const handleCreation = async () => {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!formData.client_id) {
        setError('Veuillez sélectionner un client');
        return;
      }

      if (!formData.date_installation_prevue) {
        setError('La date d\'installation prévue est obligatoire');
        return;
      }

      if (!formData.equipe_assignee) {
        setError('L\'équipe assignée est obligatoire');
        return;
      }

      if (formData.total_ht <= 0) {
        setError('Le montant HT doit être supérieur à 0');
        return;
      }

      // Créer la commande
      const commandeData = {
        client_id: formData.client_id,
        statut: 'programmee',
        date_commande: new Date().toISOString().split('T')[0],
        date_installation_prevue: formData.date_installation_prevue,
        equipe_assignee: formData.equipe_assignee,
        technicien_principal: formData.technicien_principal || null,
        temps_estime: formData.temps_estime,
        total_ht: formData.total_ht,
        total_ttc: formData.total_ttc,
        notes_installation: formData.notes_installation || null,
        adresse_installation: formData.adresse_installation || null,
        contact_site: formData.contact_site || null,
        telephone_contact: formData.telephone_contact || null,
        instructions_speciales: formData.instructions_speciales || null,
        photos: [],
        documents: []
      };

      const { data: commande, error: commandeError } = await supabase
        .from('commandes')
        .insert([commandeData])
        .select()
        .single();

      if (commandeError) {
        console.error('Erreur création commande:', commandeError);
        setError('Erreur lors de la création de la commande: ' + commandeError.message);
        return;
      }

      // Succès
      onSuccess(commande.id);
      onClose();

      // Reset du formulaire
      setFormData({
        client_id: '',
        date_installation_prevue: '',
        equipe_assignee: '',
        technicien_principal: '',
        temps_estime: 8,
        total_ht: 0,
        total_ttc: 0,
        notes_installation: '',
        adresse_installation: '',
        contact_site: '',
        telephone_contact: '',
        instructions_speciales: ''
      });
      setSelectedClient(null);
      setClientSearch('');

    } catch (error) {
      console.error('Erreur création:', error);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTRAGE CLIENTS ====================

  const filteredClients = clients.filter(client =>
    client.entreprise.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.nom.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // ==================== RENDER ====================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Nouvelle Commande
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Créer une commande manuelle
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-medium">Erreur</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Sélection client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {clientSearch && !selectedClient && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.entreprise}</div>
                        <div className="text-sm text-gray-600">{client.nom} • {client.ville}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">Aucun client trouvé</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Formulaire principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planification */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Planification
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'installation prévue *
                </label>
                <input
                  type="date"
                  value={formData.date_installation_prevue}
                  onChange={(e) => handleInputChange('date_installation_prevue', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipe assignée *
                </label>
                <select
                  value={formData.equipe_assignee}
                  onChange={(e) => handleInputChange('equipe_assignee', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une équipe</option>
                  <option value="Équipe Alpha">Équipe Alpha</option>
                  <option value="Équipe Beta">Équipe Beta</option>
                  <option value="Équipe Gamma">Équipe Gamma</option>
                  <option value="Équipe Delta">Équipe Delta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technicien principal
                </label>
                <input
                  type="text"
                  value={formData.technicien_principal}
                  onChange={(e) => handleInputChange('technicien_principal', e.target.value)}
                  placeholder="Nom du technicien responsable"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps estimé (heures)
                </label>
                <input
                  type="number"
                  value={formData.temps_estime}
                  onChange={(e) => handleInputChange('temps_estime', parseInt(e.target.value) || 0)}
                  min="1"
                  max="48"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Montants et Site */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Montants et Site
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant HT *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_ht}
                    onChange={(e) => {
                      const ht = parseFloat(e.target.value) || 0;
                      handleInputChange('total_ht', ht);
                      calculateTTC(ht);
                    }}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant TTC (calc. auto)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_ttc}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse d'installation
                </label>
                <textarea
                  value={formData.adresse_installation}
                  onChange={(e) => handleInputChange('adresse_installation', e.target.value)}
                  rows={2}
                  placeholder="Adresse complète du site d'installation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact sur site
                </label>
                <input
                  type="text"
                  value={formData.contact_site}
                  onChange={(e) => handleInputChange('contact_site', e.target.value)}
                  placeholder="Nom du contact principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone contact
                </label>
                <input
                  type="tel"
                  value={formData.telephone_contact}
                  onChange={(e) => handleInputChange('telephone_contact', e.target.value)}
                  placeholder="Numéro de téléphone direct"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Instructions et notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions spéciales
              </label>
              <textarea
                value={formData.instructions_speciales}
                onChange={(e) => handleInputChange('instructions_speciales', e.target.value)}
                rows={3}
                placeholder="Consignes particulières, contraintes d'accès, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes d'installation
              </label>
              <textarea
                value={formData.notes_installation}
                onChange={(e) => handleInputChange('notes_installation', e.target.value)}
                rows={3}
                placeholder="Notes techniques, matériel requis, préparation nécessaire..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleCreation}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Créer la Commande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
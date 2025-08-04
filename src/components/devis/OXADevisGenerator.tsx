import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, X, Plus, Trash2, Calculator, Eye, EyeOff, Search, ChevronDown, ChevronUp, User, Package } from 'lucide-react';

// ====== COMPOSANTS SEMI-AUTOMATIQUES ======

// Composant de sélection de client avec recherche
interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  error?: string;
}

function ClientSelector({ clients, selectedClient, onClientSelect, error }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${error ? 'border-red-500' : 'border-gray-300'
          }`}
      >
        {selectedClient ? (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">{selectedClient.nom}</span>
            <span className="text-gray-500 ml-2">- {selectedClient.entreprise}</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-500">
            <User className="h-4 w-4 mr-2" />
            <span>Sélectionner un client...</span>
          </div>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun client trouvé
              </div>
            ) : (
              filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                >
                  <div className="font-medium text-gray-900">{client.nom}</div>
                  <div className="text-sm text-gray-600">{client.entreprise}</div>
                  {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant de sélection d'article avec suggestions intelligentes
interface ArticleSelectorProps {
  articles: Article[];
  onArticleSelect: (article: Article) => void;
  currentDesignation?: string;
  disabled?: boolean;
}

function ArticleSelector({ articles, onArticleSelect, currentDesignation, disabled }: ArticleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Suggestions intelligentes basées sur la désignation actuelle
  const suggestedArticles = useMemo(() => {
    if (!currentDesignation || currentDesignation.length < 3) return [];

    const keywords = currentDesignation.toLowerCase().split(' ').filter(word => word.length > 2);
    if (keywords.length === 0) return [];

    return articles.filter(article => {
      const articleText = `${article.nom} ${article.description || ''}`.toLowerCase();
      return keywords.some(keyword => articleText.includes(keyword));
    }).slice(0, 3);
  }, [articles, currentDesignation]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm) return articles.slice(0, 20); // Limite pour les performances
    return articles.filter(article =>
      article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.type.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [articles, searchTerm]);

  const handleArticleSelect = (article: Article) => {
    console.log('Article sélectionné:', article); // Debug
    onArticleSelect(article);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpenCatalogue = () => {
    console.log('Ouverture du catalogue'); // Debug
    setIsOpen(true);
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="px-3 py-2 bg-gray-400 text-white rounded-r-lg cursor-not-allowed"
        title="Catalogue indisponible"
      >
        <Package className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpenCatalogue}
        className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
        title="Choisir depuis le catalogue"
      >
        <Package className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* En-tête avec recherche */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Catalogue</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Suggestions intelligentes */}
          {suggestedArticles.length > 0 && !searchTerm && (
            <div className="border-b border-gray-200">
              <div className="px-3 py-2 bg-yellow-50 text-xs font-medium text-yellow-800">
                💡 Suggestions basées sur votre saisie :
              </div>
              <div className="max-h-32 overflow-y-auto">
                {suggestedArticles.map(article => (
                  <button
                    key={`suggestion-${article.id}`}
                    onClick={() => handleArticleSelect(article)}
                    className="w-full px-3 py-2 text-left hover:bg-yellow-50 border-b border-gray-100 last:border-b-0 focus:outline-none transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-gray-900 text-sm truncate">{article.nom}</div>
                        {article.description && (
                          <div className="text-xs text-gray-600 truncate">{article.description}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-blue-600">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(article.prix_vente)}
                        </div>
                        <div className="text-xs text-gray-500">{article.type}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Liste complète */}
          <div className="max-h-64 overflow-y-auto">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Aucun article trouvé</p>
              </div>
            ) : (
              <div>
                {!searchTerm && suggestedArticles.length > 0 && (
                  <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 border-b border-gray-200">
                    Tous les articles ({filteredArticles.length}) :
                  </div>
                )}
                {filteredArticles.map(article => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-gray-900 text-sm truncate">{article.nom}</div>
                        {article.description && (
                          <div className="text-xs text-gray-600 truncate">{article.description}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-blue-600">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(article.prix_vente)}
                        </div>
                        <div className="text-xs text-gray-500">{article.type}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
interface Client {
  id: string;
  nom: string;
  entreprise: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
}

interface Article {
  id: string;
  nom: string;
  description?: string;
  type: string;
  prix_achat: number;
  prix_vente: number;
  tva: number;
}

interface DevisLine {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat: number;
  tva: number;
  total: number;
  marge: number;
  article_id?: string;
}

interface DevisZone {
  id: string;
  nom: string;
  lignes: DevisLine[];
  collapsed: boolean;
  visible_pdf: boolean;
}

interface CEEParams {
  puissance_nominale: number;
  profil_fonctionnement: string;
  duree_contrat: number;
  coefficient_activite: number;
  facteur_f: number;
  tarif_kwh: number;
}

interface CEEResult {
  kwh_cumac: number;
  prime_estimee: number;
}

interface DevisData {
  // En-tête
  client_id: string;
  date_devis: string;
  objet: string;
  description_operation: string;

  // CEE
  cee_params: CEEParams;
  cee_result: CEEResult;
  cee_mode: 'deduction' | 'information';

  // Zones et lignes
  zones: DevisZone[];

  // Totaux
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  prime_cee_deduite: number;
  net_a_payer: number;

  // Conditions
  modalites_paiement: string;
  garantie: string;
  penalites: string;
}

// ====== CONSTANTES ======
const PROFILS_FONCTIONNEMENT = [
  { value: '1x8h', label: '1×8h (8h/jour)', coefficient: 1 },
  { value: '2x8h', label: '2×8h (16h/jour)', coefficient: 2 },
  { value: '3x8h_weekend_off', label: '3×8h week-end off', coefficient: 2.5 },
  { value: '3x8h_24_7', label: '3×8h 24/7', coefficient: 3 },
  { value: 'continu_24_7', label: 'Continu 24/7', coefficient: 3.5 }
];

const DUREES_CONTRAT = [
  { value: 1, label: '1 an', facteur: 1 },
  { value: 2, label: '2 ans', facteur: 1.8 },
  { value: 3, label: '3 ans', facteur: 2.5 },
  { value: 4, label: '4 ans', facteur: 3.1 },
  { value: 5, label: '5 ans', facteur: 3.6 }
];

const DEFAULT_DEVIS_DATA: DevisData = {
  client_id: '',
  date_devis: new Date().toISOString().split('T')[0],
  objet: 'Mise en place d\'un système de mesurage IPE',
  description_operation: '',
  cee_params: {
    puissance_nominale: 0,
    profil_fonctionnement: '1x8h',
    duree_contrat: 1,
    coefficient_activite: 1,
    facteur_f: 1,
    tarif_kwh: 0.002
  },
  cee_result: {
    kwh_cumac: 0,
    prime_estimee: 0
  },
  cee_mode: 'deduction',
  zones: [],
  total_ht: 0,
  total_tva: 0,
  total_ttc: 0,
  prime_cee_deduite: 0,
  net_a_payer: 0,
  modalites_paiement: '30% à la commande, 70% à la livraison',
  garantie: '2 ans pièces et main d\'œuvre',
  penalites: 'Pénalités de retard : 0,1% par jour de retard'
};

// ====== COMPOSANT PRINCIPAL ======
interface Props {
  clients: Client[];
  articles: Article[];
  onSave: (data: any) => void;
  onCancel: () => void;
  existingDevis?: any;
}

export default function OptimizedCEEGenerator({
  clients,
  articles,
  onSave,
  onCancel,
  existingDevis
}: Props) {
  // ====== ÉTATS ======
  const [devisData, setDevisData] = useState<DevisData>(DEFAULT_DEVIS_DATA);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // ====== UTILITAIRES ======
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }, []);

  const generateId = useCallback(() => Date.now().toString(), []);

  // ====== CALCULS CEE ======
  const calculateCEE = useCallback((params: CEEParams): CEEResult => {
    const profil = PROFILS_FONCTIONNEMENT.find(p => p.value === params.profil_fonctionnement);
    const duree = DUREES_CONTRAT.find(d => d.value === params.duree_contrat);

    if (!profil || !duree) {
      return { kwh_cumac: 0, prime_estimee: 0 };
    }

    // Formule CEE IND-UT-134: kWh cumac = 29.4 × coeff × P × F
    const kwh_cumac = 29.4 * profil.coefficient * params.puissance_nominale * duree.facteur;
    const prime_estimee = kwh_cumac * params.tarif_kwh;

    return { kwh_cumac: Math.round(kwh_cumac), prime_estimee: Math.round(prime_estimee * 100) / 100 };
  }, []);

  // ====== CALCULS TOTAUX ======
  const calculateTotals = useCallback((zones: DevisZone[], ceeResult: CEEResult, ceeMode: string) => {
    const total_ht = zones.reduce((sum, zone) =>
      sum + zone.lignes.reduce((zoneSum, ligne) => zoneSum + ligne.total, 0), 0
    );

    const total_tva = total_ht * 0.20; // TVA 20%
    const total_ttc = total_ht + total_tva;

    const prime_cee_deduite = ceeMode === 'deduction' ? ceeResult.prime_estimee : 0;
    const net_a_payer = total_ttc - prime_cee_deduite;

    return { total_ht, total_tva, total_ttc, prime_cee_deduite, net_a_payer };
  }, []);

  // ====== GESTION DES DONNÉES ======
  const updateDevisData = useCallback((updates: Partial<DevisData>) => {
    setDevisData(prev => {
      const newData = { ...prev, ...updates };

      // Recalcul automatique des totaux
      if (updates.zones || updates.cee_result || updates.cee_mode) {
        const totals = calculateTotals(newData.zones, newData.cee_result, newData.cee_mode);
        Object.assign(newData, totals);
      }

      return newData;
    });
  }, [calculateTotals]);

  // ====== GESTION CEE ======
  const handleCEECalculation = useCallback(async () => {
    setIsCalculating(true);

    // Simulation d'un calcul asynchrone
    setTimeout(() => {
      const result = calculateCEE(devisData.cee_params);
      updateDevisData({ cee_result: result });
      setIsCalculating(false);
    }, 500);
  }, [devisData.cee_params, calculateCEE, updateDevisData]);

  const updateCEEParams = useCallback((field: keyof CEEParams, value: any) => {
    const newParams = { ...devisData.cee_params, [field]: value };

    // Calcul automatique du coefficient d'activité et facteur F
    if (field === 'profil_fonctionnement') {
      const profil = PROFILS_FONCTIONNEMENT.find(p => p.value === value);
      if (profil) {
        newParams.coefficient_activite = profil.coefficient;
      }
    }

    if (field === 'duree_contrat') {
      const duree = DUREES_CONTRAT.find(d => d.value === value);
      if (duree) {
        newParams.facteur_f = duree.facteur;
      }
    }

    updateDevisData({ cee_params: newParams });
  }, [devisData.cee_params, updateDevisData]);

  // ====== GESTION DES ZONES ======
  const addZone = useCallback((nom: string = 'Nouvelle zone') => {
    const newZone: DevisZone = {
      id: generateId(),
      nom,
      lignes: [],
      collapsed: false,
      visible_pdf: true
    };

    updateDevisData({
      zones: [...devisData.zones, newZone]
    });
  }, [devisData.zones, generateId, updateDevisData]);

  const updateZone = useCallback((zoneId: string, updates: Partial<DevisZone>) => {
    const newZones = devisData.zones.map(zone =>
      zone.id === zoneId ? { ...zone, ...updates } : zone
    );
    updateDevisData({ zones: newZones });
  }, [devisData.zones, updateDevisData]);

  const removeZone = useCallback((zoneId: string) => {
    const newZones = devisData.zones.filter(zone => zone.id !== zoneId);
    updateDevisData({ zones: newZones });
  }, [devisData.zones, updateDevisData]);

  // ====== GESTION DES LIGNES ======
  const addLineToZone = useCallback((zoneId: string) => {
    const newLine: DevisLine = {
      id: generateId(),
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      prix_achat: 0,
      tva: 20,
      total: 0,
      marge: 0
    };

    const zone = devisData.zones.find(z => z.id === zoneId);
    if (zone) {
      updateZone(zoneId, {
        lignes: [...zone.lignes, newLine]
      });
    }
  }, [devisData.zones, generateId, updateZone]);

  const updateLine = useCallback((zoneId: string, lineId: string, field: keyof DevisLine, value: any) => {
    console.log('Mise à jour ligne:', { zoneId, lineId, field, value }); // Debug

    const zone = devisData.zones.find(z => z.id === zoneId);
    if (!zone) {
      console.error('Zone non trouvée:', zoneId);
      return;
    }

    const newLignes = zone.lignes.map(ligne => {
      if (ligne.id === lineId) {
        const updated = { ...ligne, [field]: value };

        // Recalcul automatique du total et de la marge
        if (field === 'quantite' || field === 'prix_unitaire') {
          updated.total = updated.quantite * updated.prix_unitaire;
          updated.marge = updated.total - (updated.quantite * updated.prix_achat);
        }

        if (field === 'prix_achat') {
          updated.marge = updated.total - (updated.quantite * updated.prix_achat);
        }

        console.log('Ligne mise à jour:', updated); // Debug
        return updated;
      }
      return ligne;
    });

    updateZone(zoneId, { lignes: newLignes });
  }, [devisData.zones, updateZone]);

  const removeLine = useCallback((zoneId: string, lineId: string) => {
    const zone = devisData.zones.find(z => z.id === zoneId);
    if (!zone) return;

    const newLignes = zone.lignes.filter(ligne => ligne.id !== lineId);
    updateZone(zoneId, { lignes: newLignes });
  }, [devisData.zones, updateZone]);

  // Fonction spécifique pour la sélection d'article
  const handleArticleSelection = useCallback((zoneId: string, lineId: string, article: Article) => {
    console.log('Sélection article pour ligne:', { zoneId, lineId, article }); // Debug

    // Mise à jour de tous les champs en une seule fois
    const zone = devisData.zones.find(z => z.id === zoneId);
    if (!zone) return;

    const newLignes = zone.lignes.map(ligne => {
      if (ligne.id === lineId) {
        const updated = {
          ...ligne,
          designation: article.nom,
          prix_unitaire: article.prix_vente,
          prix_achat: article.prix_achat,
          tva: article.tva,
          article_id: article.id
        };

        // Recalcul des totaux
        updated.total = updated.quantite * updated.prix_unitaire;
        updated.marge = updated.total - (updated.quantite * updated.prix_achat);

        console.log('Article appliqué à la ligne:', updated); // Debug
        return updated;
      }
      return ligne;
    });

    updateZone(zoneId, { lignes: newLignes });
  }, [devisData.zones, updateZone]);

  // ====== VALIDATION ======
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedClient) {
      newErrors.client = 'Veuillez sélectionner un client';
    }

    if (!devisData.objet.trim()) {
      newErrors.objet = 'L\'objet du devis est obligatoire';
    }

    if (devisData.zones.length === 0) {
      newErrors.zones = 'Veuillez ajouter au moins une zone';
    }

    const hasLines = devisData.zones.some(zone => zone.lignes.length > 0);
    if (!hasLines) {
      newErrors.lignes = 'Veuillez ajouter au moins une ligne de prestation';
    }

    // Validation des lignes
    let hasInvalidLines = false;
    devisData.zones.forEach((zone, zoneIndex) => {
      zone.lignes.forEach((ligne, ligneIndex) => {
        if (!ligne.designation.trim()) {
          newErrors[`ligne_${zone.id}_${ligne.id}_designation`] = `Ligne ${ligneIndex + 1} de la zone "${zone.nom}" : la désignation est obligatoire`;
          hasInvalidLines = true;
        }
        if (ligne.quantite <= 0) {
          newErrors[`ligne_${zone.id}_${ligne.id}_quantite`] = `Ligne ${ligneIndex + 1} de la zone "${zone.nom}" : la quantité doit être supérieure à 0`;
          hasInvalidLines = true;
        }
        if (ligne.prix_unitaire < 0) {
          newErrors[`ligne_${zone.id}_${ligne.id}_prix`] = `Ligne ${ligneIndex + 1} de la zone "${zone.nom}" : le prix unitaire ne peut pas être négatif`;
          hasInvalidLines = true;
        }
      });
    });

    if (hasInvalidLines) {
      newErrors.lignes_validation = 'Certaines lignes contiennent des erreurs';
    }

    // Validation CEE si des données sont renseignées
    if (devisData.cee_params.puissance_nominale > 0) {
      if (devisData.cee_result.kwh_cumac === 0) {
        newErrors.cee = 'Veuillez effectuer le calcul CEE ou mettre la puissance à 0';
      }
    }

    setErrors(newErrors);

    // Log des erreurs pour le debug
    if (Object.keys(newErrors).length > 0) {
      console.log('Erreurs de validation:', newErrors);
    }

    return Object.keys(newErrors).length === 0;
  }, [selectedClient, devisData]);

  // ====== SAUVEGARDE ======
  const handleSave = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    // Préparer les données pour la base de données
    const finalData = {
      // Informations de base
      client_id: selectedClient!.id,
      date_devis: devisData.date_devis,
      objet: devisData.objet,
      description_operation: devisData.description_operation,
      type: 'CEE',
      statut: 'brouillon',

      // Totaux financiers
      total_ht: devisData.total_ht,
      total_tva: devisData.total_tva,
      total_ttc: devisData.total_ttc,
      tva_taux: 20.00,
      marge_totale: devisData.zones.reduce((sum, zone) =>
        sum + zone.lignes.reduce((zoneSum, ligne) => zoneSum + ligne.marge, 0), 0
      ),

      // Conditions commerciales
      modalites_paiement: devisData.modalites_paiement,
      garantie: devisData.garantie,
      penalites: devisData.penalites,
      clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris',

      // Données CEE
      cee_kwh_cumac: devisData.cee_result.kwh_cumac,
      cee_prix_unitaire: devisData.cee_params.tarif_kwh,
      cee_montant_total: devisData.cee_result.prime_estimee,
      prime_cee: devisData.cee_result.prime_estimee, // Alias pour compatibilité
      reste_a_payer_ht: devisData.net_a_payer,

      // Lignes de devis au format base de données
      lignes_data: devisData.zones.flatMap(zone =>
        zone.lignes.map((ligne, index) => ({
          description: ligne.designation,
          zone: zone.nom,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          prix_achat: ligne.prix_achat || 0,
          tva: ligne.tva || 20,
          total_ht: ligne.total,
          total_tva: ligne.total * ((ligne.tva || 20) / 100),
          total_ttc: ligne.total * (1 + ((ligne.tva || 20) / 100)),
          marge: ligne.marge,
          ordre: index + 1,
          remarques: '',
          article_id: ligne.article_id || null
        }))
      ),

      // Métadonnées CEE pour le PDF/affichage
      cee_calculation: {
        profil_fonctionnement: devisData.cee_params.profil_fonctionnement,
        puissance_nominale: devisData.cee_params.puissance_nominale,
        duree_contrat: devisData.cee_params.duree_contrat,
        coefficient_activite: devisData.cee_params.coefficient_activite,
        facteur_f: devisData.cee_params.facteur_f,
        kwh_cumac: devisData.cee_result.kwh_cumac,
        tarif_kwh: devisData.cee_params.tarif_kwh,
        prime_estimee: devisData.cee_result.prime_estimee,
        operateur_nom: 'OXA Groupe'
      },

      cee_integration: {
        mode: devisData.cee_mode,
        afficher_bloc: true
      }
    };

    console.log('Données à sauvegarder:', finalData); // Debug

    onSave(finalData);
  }, [validateForm, devisData, selectedClient, onSave]);

  // ====== INITIALISATION ======
  // Remplacer le useEffect d'initialisation dans OXADevisGenerator.tsx

  useEffect(() => {
    if (existingDevis) {
      console.log('Initialisation avec:', existingDevis); // Debug

      // Trouver le client
      const client = existingDevis.client || clients.find(c => c.id === existingDevis.client_id);

      // Créer les zones à partir des lignes_data
      const zones: DevisZone[] = [];
      if (existingDevis.lignes_data && Array.isArray(existingDevis.lignes_data)) {
        // Grouper les lignes par zone
        const lignesParZone = existingDevis.lignes_data.reduce((acc: any, ligne: any) => {
          const zoneName = ligne.zone || 'Général';
          if (!acc[zoneName]) acc[zoneName] = [];
          acc[zoneName].push(ligne);
          return acc;
        }, {});

        // Créer les zones
        Object.entries(lignesParZone).forEach(([zoneName, lignes]: [string, any]) => {
          zones.push({
            id: `zone-${Date.now()}-${zoneName}`,
            nom: zoneName,
            collapsed: false,
            visible_pdf: true,
            lignes: lignes.map((ligne: any, index: number) => ({
              id: `ligne-${Date.now()}-${index}`,
              designation: ligne.description || ligne.designation || '',
              quantite: ligne.quantite || 1,
              prix_unitaire: ligne.prix_unitaire || 0,
              prix_achat: ligne.prix_achat || 0,
              tva: ligne.tva || 20,
              total: ligne.total_ht || ligne.prix_total || (ligne.quantite * ligne.prix_unitaire) || 0,
              marge: ligne.marge || 0,
              article_id: ligne.article_id
            }))
          });
        });
      }

      // Reconstituer les paramètres CEE
      const ceeParams: CEEParams = {
        puissance_nominale: existingDevis.cee_calculation?.puissance_nominale || 0,
        profil_fonctionnement: existingDevis.cee_calculation?.profil_fonctionnement || '1x8h',
        duree_contrat: existingDevis.cee_calculation?.duree_contrat || 1,
        coefficient_activite: existingDevis.cee_calculation?.coefficient_activite || 1,
        facteur_f: existingDevis.cee_calculation?.facteur_f || 1,
        tarif_kwh: existingDevis.cee_prix_unitaire || 0.002
      };

      // Reconstituer les résultats CEE
      const ceeResult: CEEResult = {
        kwh_cumac: existingDevis.cee_kwh_cumac || 0,
        prime_estimee: existingDevis.cee_montant_total || 0
      };

      // Mettre à jour les données complètes
      const mappedData: DevisData = {
        client_id: existingDevis.client_id || '',
        date_devis: existingDevis.date_devis || new Date().toISOString().split('T')[0],
        objet: existingDevis.objet || '',
        description_operation: existingDevis.description_operation || '',
        cee_params: ceeParams,
        cee_result: ceeResult,
        cee_mode: existingDevis.cee_integration?.mode || 'deduction',
        zones: zones,
        total_ht: existingDevis.total_ht || 0,
        total_tva: existingDevis.total_tva || 0,
        total_ttc: existingDevis.total_ttc || 0,
        prime_cee_deduite: existingDevis.cee_montant_total || 0,
        net_a_payer: existingDevis.reste_a_payer_ht || existingDevis.total_ttc || 0,
        modalites_paiement: existingDevis.modalites_paiement || '30% à la commande, 70% à la livraison',
        garantie: existingDevis.garantie || '2 ans pièces et main d\'œuvre',
        penalites: existingDevis.penalites || 'Pénalités de retard : 0,1% par jour de retard'
      };

      setDevisData(mappedData);
      setSelectedClient(client || null);

      console.log('Données mappées:', mappedData); // Debug
    }
  }, [existingDevis, clients])

  // ====== RENDU ======
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="h-8 w-8 mr-3 text-yellow-600" />
            Devis CEE IND-UT-134
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2 inline" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              Enregistrer le devis
            </button>
          </div>
        </div>

        {/* Sélection client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onClientSelect={(client) => {
              setSelectedClient(client);
              updateDevisData({ client_id: client?.id || '' });
            }}
            error={errors.client}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date du devis</label>
            <input
              type="date"
              value={devisData.date_devis}
              onChange={(e) => updateDevisData({ date_devis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Objet du devis *</label>
          <input
            type="text"
            value={devisData.objet}
            onChange={(e) => updateDevisData({ objet: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.objet ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Ex: Mise en place d'un système de mesurage IPE"
          />
          {errors.objet && <p className="text-red-500 text-sm mt-1">{errors.objet}</p>}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'opération</label>
          <textarea
            value={devisData.description_operation}
            onChange={(e) => updateDevisData({ description_operation: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Décrivez l'opération à réaliser..."
          />
        </div>
      </div>

      {/* Module CEE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-yellow-600" />
            Calcul CEE IND-UT-134
          </h2>
          <button
            onClick={handleCEECalculation}
            disabled={isCalculating}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isCalculating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
            ) : (
              <Calculator className="h-4 w-4 mr-2 inline" />
            )}
            {isCalculating ? 'Calcul...' : 'Calculer'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Puissance nominale (kW)</label>
            <input
              type="number"
              value={devisData.cee_params?.puissance_nominale || 0}
              onChange={(e) => updateCEEParams('puissance_nominale', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profil de fonctionnement</label>
            <select
              value={devisData.cee_params.profil_fonctionnement}
              onChange={(e) => updateCEEParams('profil_fonctionnement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROFILS_FONCTIONNEMENT.map(profil => (
                <option key={profil.value} value={profil.value}>
                  {profil.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durée du contrat</label>
            <select
              value={devisData.cee_params.duree_contrat}
              onChange={(e) => updateCEEParams('duree_contrat', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DUREES_CONTRAT.map(duree => (
                <option key={duree.value} value={duree.value}>
                  {duree.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coefficient d'activité</label>
            <input
              type="number"
              value={devisData.cee_params.coefficient_activite}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facteur F</label>
            <input
              type="number"
              value={devisData.cee_params.facteur_f}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarif kWh cumac (€)</label>
            <input
              type="number"
              value={devisData.cee_params.tarif_kwh}
              onChange={(e) => updateCEEParams('tarif_kwh', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.001"
            />
          </div>
        </div>

        {/* Résultats CEE */}
        {devisData.cee_result.kwh_cumac > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-3">Résultats du calcul CEE</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">kWh cumac:</span>
                <span className="ml-2 font-medium text-yellow-900">
                  {devisData.cee_result.kwh_cumac.toLocaleString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Prime estimée:</span>
                <span className="ml-2 font-medium text-green-700">
                  {formatCurrency(devisData.cee_result.prime_estimee)}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Mode d'intégration:</span>
                <select
                  value={devisData.cee_mode}
                  onChange={(e) => updateDevisData({ cee_mode: e.target.value as 'deduction' | 'information' })}
                  className="ml-2 px-2 py-1 border border-yellow-300 rounded text-sm"
                >
                  <option value="deduction">Déduction directe</option>
                  <option value="information">Information seulement</option>
                </select>
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              Formule: kWh cumac = 29.4 × {devisData.cee_params.coefficient_activite} × {devisData.cee_params.puissance_nominale} × {devisData.cee_params.facteur_f}
            </div>
          </div>
        )}
      </div>

      {/* Zones et lignes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Zones modulaires</h2>
          <button
            onClick={() => addZone()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Ajouter une zone
          </button>
        </div>

        {errors.zones && <p className="text-red-500 text-sm mb-4">{errors.zones}</p>}
        {errors.lignes && <p className="text-red-500 text-sm mb-4">{errors.lignes}</p>}

        {devisData.zones.map((zone, zoneIndex) => (
          <div key={zone.id} className="border border-gray-200 rounded-lg mb-4">
            {/* En-tête de zone */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateZone(zone.id, { collapsed: !zone.collapsed })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {zone.collapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={zone.nom}
                  onChange={(e) => updateZone(zone.id, { nom: e.target.value })}
                  className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0"
                  placeholder="Nom de la zone"
                />
                <button
                  onClick={() => updateZone(zone.id, { visible_pdf: !zone.visible_pdf })}
                  className={`p-1 rounded ${zone.visible_pdf ? 'text-blue-600' : 'text-gray-400'}`}
                  title={zone.visible_pdf ? 'Visible dans le PDF' : 'Masqué dans le PDF'}
                >
                  {zone.visible_pdf ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => addLineToZone(zone.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Ajouter ligne
                </button>
                <button
                  onClick={() => removeZone(zone.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lignes de la zone */}
            {!zone.collapsed && (
              <div className="p-4">
                {zone.lignes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune ligne dans cette zone</p>
                    <button
                      onClick={() => addLineToZone(zone.id)}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ajouter la première ligne
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zone.lignes.map((ligne, ligneIndex) => (
                      <div key={ligne.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Désignation</label>
                            <div className="flex">
                              <input
                                type="text"
                                value={ligne.designation}
                                onChange={(e) => updateLine(zone.id, ligne.id, 'designation', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Description de l'article"
                              />
                              <ArticleSelector
                                articles={articles}
                                currentDesignation={ligne.designation}
                                onArticleSelect={(article) => handleArticleSelection(zone.id, ligne.id, article)}
                                disabled={articles.length === 0}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                            <input
                              type="number"
                              value={ligne.quantite}
                              onChange={(e) => updateLine(zone.id, ligne.id, 'quantite', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire HT</label>
                            <input
                              type="number"
                              value={ligne.prix_unitaire}
                              onChange={(e) => updateLine(zone.id, ligne.id, 'prix_unitaire', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total HT</label>
                            <input
                              type="text"
                              value={formatCurrency(ligne.total)}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              onClick={() => removeLine(zone.id, ligne.id)}
                              className="w-full px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors text-sm"
                            >
                              <Trash2 className="h-4 w-4 mx-auto" />
                            </button>
                          </div>
                        </div>

                        {/* Ligne de détails avancés (repliable) */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Prix d'achat HT</label>
                              <input
                                type="number"
                                value={ligne.prix_achat}
                                onChange={(e) => updateLine(zone.id, ligne.id, 'prix_achat', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">TVA (%)</label>
                              <input
                                type="number"
                                value={ligne.tva}
                                onChange={(e) => updateLine(zone.id, ligne.id, 'tva', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Marge</label>
                              <input
                                type="text"
                                value={formatCurrency(ligne.marge)}
                                readOnly
                                className={`w-full px-2 py-1 border border-gray-300 rounded text-xs font-medium ${ligne.marge >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">% Marge</label>
                              <input
                                type="text"
                                value={ligne.total > 0 ? `${((ligne.marge / ligne.total) * 100).toFixed(1)}%` : '0%'}
                                readOnly
                                className={`w-full px-2 py-1 border border-gray-300 rounded text-xs font-medium ${ligne.marge >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {devisData.zones.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-2">Aucune zone créée</p>
            <p className="mb-4">Commencez par ajouter une zone pour organiser vos prestations</p>
            <button
              onClick={() => addZone('Installation et mise en service')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Créer la première zone
            </button>
          </div>
        )}
      </div>

      {/* Récapitulatif financier */}
      {devisData.zones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Récapitulatif financier</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Totaux du devis */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Totaux du devis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-medium">{formatCurrency(devisData.total_ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA (20%):</span>
                  <span className="font-medium">{formatCurrency(devisData.total_tva)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="font-medium text-gray-900">Total TTC:</span>
                  <span className="font-bold text-lg">{formatCurrency(devisData.total_ttc)}</span>
                </div>

                {devisData.cee_mode === 'deduction' && devisData.prime_cee_deduite > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Prime CEE déduite:</span>
                      <span className="font-medium">-{formatCurrency(devisData.prime_cee_deduite)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="font-bold text-gray-900">Net à payer:</span>
                      <span className="font-bold text-xl text-blue-600">{formatCurrency(devisData.net_a_payer)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informations CEE */}
            {devisData.cee_result.kwh_cumac > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Informations CEE</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">kWh cumac:</span>
                      <span className="font-medium">{devisData.cee_result.kwh_cumac.toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Tarif unitaire:</span>
                      <span className="font-medium">{devisData.cee_params.tarif_kwh.toFixed(4)} €/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Prime totale:</span>
                      <span className="font-medium text-green-600">{formatCurrency(devisData.cee_result.prime_estimee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Mode:</span>
                      <span className="font-medium">
                        {devisData.cee_mode === 'deduction' ? 'Déduction directe' : 'Information seulement'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conditions commerciales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Conditions commerciales</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modalités de paiement</label>
            <textarea
              value={devisData.modalites_paiement}
              onChange={(e) => updateDevisData({ modalites_paiement: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Garantie</label>
            <textarea
              value={devisData.garantie}
              onChange={(e) => updateDevisData({ garantie: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pénalités de retard</label>
            <input
              type="text"
              value={devisData.penalites}
              onChange={(e) => updateDevisData({ penalites: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions finales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            {existingDevis ? 'Mettre à jour le devis' : 'Enregistrer le devis'}
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">⚠️ Erreurs de validation :</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([key, error], index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <div className="mt-2 text-xs text-red-600">
              Corrigez ces erreurs avant de pouvoir enregistrer le devis.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
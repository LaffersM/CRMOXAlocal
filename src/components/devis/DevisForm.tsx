import React, { useState, useEffect } from 'react'
import { Devis, OXADevis, Client } from '../../lib/supabase'
import { X, Save, FileText, User, Calendar, Euro, Percent, Zap } from 'lucide-react'

interface DevisFormProps {
  devis?: Devis | OXADevis | null;
  clients: Client[];
  onSubmit: (data: Partial<Devis | OXADevis>) => void;
  onCancel: () => void;
}

export function DevisForm({ devis, clients, onSubmit, onCancel }: DevisFormProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    statut: 'brouillon' as const,
    date_devis: new Date().toISOString().split('T')[0],
    objet: '',
    description_operation: '',
    notes: '',
    remarques: '',
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    tva_taux: 20,
    marge_totale: 0,
    prime_cee: 0,
    cee_montant_total: 0,
    type: 'standard' as const,
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    delais: '4 à 6 semaines après validation du devis',
    penalites: 'Pénalités de retard : 0,1% par jour',
    clause_juridique: 'Tribunal de Commerce de Paris'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (devis) {
      setFormData({
        client_id: devis.client_id,
        statut: devis.statut,
        date_devis: devis.date_devis,
        objet: devis.objet,
        description_operation: devis.description_operation || '',
        notes: devis.notes || '',
        remarques: devis.remarques || '',
        total_ht: devis.total_ht,
        total_tva: devis.total_tva,
        total_ttc: devis.total_ttc,
        tva_taux: devis.tva_taux || 20,
        marge_totale: devis.marge_totale,
        prime_cee: devis.prime_cee || 0,
        cee_montant_total: (devis as OXADevis).cee_montant_total || devis.prime_cee || 0,
        type: devis.type || 'standard',
        modalites_paiement: devis.modalites_paiement || '30% à la commande, 70% à la livraison',
        garantie: devis.garantie || '2 ans pièces et main d\'œuvre',
        delais: devis.delais || '4 à 6 semaines après validation du devis',
        penalites: devis.penalites || 'Pénalités de retard : 0,1% par jour',
        clause_juridique: devis.clause_juridique || 'Tribunal de Commerce de Paris'
      })
    }
  }, [devis])

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'envoye', label: 'Envoyé' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'refuse', label: 'Refusé' },
    { value: 'expire', label: 'Expiré' }
  ]

  const typeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'cee', label: 'CEE' },
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.client_id) {
      newErrors.client_id = 'Le client est requis'
    }

    if (!formData.objet.trim()) {
      newErrors.objet = 'L\'objet est requis'
    }

    if (formData.total_ht < 0) {
      newErrors.total_ht = 'Le montant HT doit être positif'
    }

    if (formData.tva_taux < 0 || formData.tva_taux > 100) {
      newErrors.tva_taux = 'Le taux de TVA doit être entre 0 et 100%'
    }

    if (formData.prime_cee < 0) {
      newErrors.prime_cee = 'La prime CEE ne peut pas être négative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Préparer les données en fonction du type
      const submitData = {
        ...formData,
        // Assurer la cohérence entre prime_cee et cee_montant_total
        prime_cee: formData.prime_cee,
        cee_montant_total: formData.prime_cee,
        // Calculer les totaux finaux
        total_tva: (formData.total_ht * formData.tva_taux) / 100,
        total_ttc: formData.total_ht + ((formData.total_ht * formData.tva_taux) / 100)
      }
      
      onSubmit(submitData)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    const updatedData = { ...formData, [field]: value }
    
    // Auto-calculate totals when HT amount or TVA rate changes
    if (field === 'total_ht' || field === 'tva_taux') {
      const ht = field === 'total_ht' ? Number(value) : formData.total_ht
      const tvaRate = field === 'tva_taux' ? Number(value) : formData.tva_taux
      const tva = (ht * tvaRate) / 100
      const ttc = ht + tva
      
      updatedData.total_tva = tva
      updatedData.total_ttc = ttc
    }
    
    // Synchroniser prime_cee et cee_montant_total
    if (field === 'prime_cee') {
      updatedData.cee_montant_total = Number(value)
    }
    
    setFormData(updatedData)
    
    // Clear field error if it exists
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const selectedClient = clients.find(c => c.id === formData.client_id)
  const isCEEType = formData.type === 'cee' || formData.type === 'IPE'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {isCEEType && <Zap className="h-5 w-5 mr-2 text-yellow-600" />}
            {devis ? 'Modifier le devis' : 'Nouveau devis'}
            {isCEEType && <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">CEE</span>}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Informations principales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.client_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom} - {client.entreprise}
                    </option>
                  ))}
                </select>
                {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
                {selectedClient && (
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedClient.ville} {selectedClient.siret && `• SIRET: ${selectedClient.siret}`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date du devis *
                </label>
                <input
                  type="date"
                  value={formData.date_devis}
                  onChange={(e) => handleChange('date_devis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de devis
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {typeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Objet du devis *
                </label>
                <input
                  type="text"
                  value={formData.objet}
                  onChange={(e) => handleChange('objet', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.objet ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Mise en place d'un système de mesurage IPE"
                />
                {errors.objet && <p className="mt-1 text-sm text-red-600">{errors.objet}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description et notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'opération
                </label>
                <textarea
                  value={formData.description_operation}
                  onChange={(e) => handleChange('description_operation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description détaillée de l'opération à réaliser..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes internes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes internes (non visibles sur le devis)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarques client
                  </label>
                  <textarea
                    value={formData.remarques}
                    onChange={(e) => handleChange('remarques', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Remarques visibles par le client..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Montants */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Montants et calculs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Montant HT *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_ht}
                  onChange={(e) => handleChange('total_ht', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.total_ht ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.total_ht && <p className="mt-1 text-sm text-red-600">{errors.total_ht}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="h-4 w-4 inline mr-1" />
                  Taux TVA (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.tva_taux}
                  onChange={(e) => handleChange('tva_taux', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tva_taux ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="20.0"
                />
                {errors.tva_taux && <p className="mt-1 text-sm text-red-600">{errors.tva_taux}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant TVA
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_tva}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Calculé automatiquement</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Montant TTC
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_ttc}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-medium"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Calculé automatiquement</p>
              </div>

              {isCEEType && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Zap className="h-4 w-4 inline mr-1 text-yellow-600" />
                    Prime CEE estimée
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prime_cee}
                    onChange={(e) => handleChange('prime_cee', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.prime_cee ? 'border-red-300' : 'border-yellow-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.prime_cee && <p className="mt-1 text-sm text-red-600">{errors.prime_cee}</p>}
                  <p className="mt-1 text-xs text-yellow-600">
                    Utilisez le générateur CEE pour calculer automatiquement
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marge totale estimée
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.marge_totale}
                  onChange={(e) => handleChange('marge_totale', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Marge brute estimée sur ce devis
                </p>
              </div>
            </div>
          </div>

          {/* Conditions commerciales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conditions commerciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalités de paiement</label>
                <input
                  type="text"
                  value={formData.modalites_paiement}
                  onChange={(e) => handleChange('modalites_paiement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 30% à la commande, 70% à la livraison"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Délais de réalisation</label>
                <input
                  type="text"
                  value={formData.delais}
                  onChange={(e) => handleChange('delais', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 4 à 6 semaines après validation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garantie</label>
                <input
                  type="text"
                  value={formData.garantie}
                  onChange={(e) => handleChange('garantie', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2 ans pièces et main d'œuvre"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pénalités de retard</label>
                <input
                  type="text"
                  value={formData.penalites}
                  onChange={(e) => handleChange('penalites', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 0,1% par jour de retard"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Clause juridique</label>
                <input
                  type="text"
                  value={formData.clause_juridique}
                  onChange={(e) => handleChange('clause_juridique', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tribunal de Commerce de Paris"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              {devis ? 'Mettre à jour' : 'Créer le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
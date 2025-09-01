import React, { useState } from 'react'
import { OXADevis, Client } from '../../lib/supabase'
import { X, Edit, FileText, User, Calendar, Euro, Download, Send, History, Zap, Building, Printer, Mail, Phone, MapPin, Clock } from 'lucide-react'
import { generateDevisPDF } from '../../utils/pdfExport'
import { DevisHistory } from './DevisHistory';

interface DevisDetailsProps {
  devis: OXADevis;
  client?: Client;
  onClose: () => void;
  onEdit: () => void;
}

export function DevisDetails({ devis, client, onClose, onEdit }: DevisDetailsProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)

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

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: 'bg-gray-100 text-gray-800 border-gray-200',
      envoye: 'bg-blue-100 text-blue-800 border-blue-200',
      accepte: 'bg-green-100 text-green-800 border-green-200',
      refuse: 'bg-red-100 text-red-800 border-red-200',
      expire: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      brouillon: 'Brouillon',
      envoye: 'Envoyé',
      accepte: 'Accepté',
      refuse: 'Refusé',
      expire: 'Expiré'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      CEE: Zap,
      cee: Zap,
      IPE: Building,
      ELEC: Zap,
      MATERIEL: Building,
      MAIN_OEUVRE: User
    }
    return icons[type as keyof typeof icons] || FileText
  }

  const handleExportPDF = async () => {
    if (!client) {
      alert('Informations client manquantes pour l\'export PDF')
      return
    }

    setIsExporting(true)
    try {
      const devisForPDF = {
        ...devis,
        client,
        lignes: devis.lignes_data || devis.lignes || [],
        delais: devis.delais || '4 à 6 semaines après validation du devis',
        modalites_paiement: devis.modalites_paiement || '30% à la commande, 70% à la livraison',
        garantie: devis.garantie || '2 ans pièces et main d\'œuvre',
        penalites: devis.penalites || 'Pénalités de retard : 0,1% par jour',
        clause_juridique: devis.clause_juridique || 'Tribunal de Commerce de Paris'
      }

      await generateDevisPDF(devisForPDF, (devis.cee_montant_total || 0) > 0)
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const TypeIcon = getTypeIcon(devis.type || 'standard')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header avec actions */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-4">
              <TypeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Devis {devis.numero}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(devis.statut)}`}>
                  {getStatusLabel(devis.statut)}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {client ? `${client.nom} - ${client.entreprise}` : 'Client non trouvé'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <History className="h-4 w-4 mr-2" />
              Historique
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>

            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8" id="devis-content">

            {/* Informations du devis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Informations générales */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Informations générales
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro:</span>
                    <span className="font-medium">{devis.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(devis.date_devis)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${devis.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                      devis.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                        devis.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                          devis.type === 'MAIN_OEUVRE' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                      }`}>
                      {devis.type}
                    </span>
                  </div>
                  {devis.description_operation && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 block mb-1">Description:</span>
                      <p className="text-sm text-gray-800">{devis.description_operation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations client */}
              {client && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Client
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{client.nom}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {client.entreprise}
                      </p>
                    </div>
                    {client.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </p>
                    )}
                    {client.telephone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {client.telephone}
                      </p>
                    )}
                    {client.adresse && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {client.adresse}, {client.ville} {client.code_postal}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Objet du devis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Objet du devis</h3>
              <p className="text-gray-800 leading-relaxed">{devis.objet}</p>
            </div>

            {/* Calcul CEE si applicable */}
            {(devis.cee_montant_total || 0) > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Calcul CEE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600">kWh cumac</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(devis.cee_kwh_cumac || 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600">Prix unitaire</p>
                    <p className="text-xl font-bold text-gray-900">
                      {devis.cee_prix_unitaire ? devis.cee_prix_unitaire.toFixed(4) : '0.0000'} €/kWh
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600">Prime CEE</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {formatCurrency(devis.cee_montant_total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lignes du devis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lignes du devis</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Désignation</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Qté</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Prix unitaire</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(devis.lignes_data || devis.lignes || []).map((ligne: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ligne.designation || ligne.description}
                            </p>
                            {ligne.zone && (
                              <p className="text-xs text-gray-500 mt-1">Zone: {ligne.zone}</p>
                            )}
                            {ligne.remarques && (
                              <p className="text-xs text-gray-600 mt-1 italic">{ligne.remarques}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-sm">
                          {ligne.quantite}
                        </td>
                        <td className="py-3 px-2 text-right text-sm">
                          {formatCurrency(ligne.prix_unitaire)}
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-medium">
                          {formatCurrency(ligne.prix_total || ligne.total_ht || (ligne.quantite * ligne.prix_unitaire))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Récapitulatif financier */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Récapitulatif financier
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-medium">{formatCurrency(devis.total_ht)}</span>
                </div>

                {(devis.cee_montant_total || 0) > 0 && (
                  <div className="flex justify-between py-2 text-green-700">
                    <span>Prime CEE:</span>
                    <span className="font-medium">- {formatCurrency(devis.cee_montant_total)}</span>
                  </div>
                )}

                {(devis.reste_a_payer_ht || 0) > 0 && (
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-gray-600">Reste à payer HT:</span>
                    <span className="font-medium">{formatCurrency(devis.reste_a_payer_ht)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">TVA ({devis.tva_taux || 20}%):</span>
                  <span className="font-medium">{formatCurrency(devis.total_tva)}</span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold">
                  <span>TOTAL TTC:</span>
                  <span className="text-blue-600">{formatCurrency(devis.total_ttc)}</span>
                </div>
              </div>
            </div>

            {/* Conditions et remarques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Conditions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conditions</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Modalités de paiement:</p>
                    <p className="text-gray-600">{devis.modalites_paiement || '30% à la commande, 70% à la livraison'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Garantie:</p>
                    <p className="text-gray-600">{devis.garantie || '2 ans pièces et main d\'œuvre'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Délais:</p>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {devis.delais || '4 à 6 semaines après validation du devis'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarques */}
              {devis.remarques && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Remarques
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{devis.remarques}</p>
                </div>
              )}
            </div>

            {/* Footer de validation */}
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Validation du devis
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Bon pour accord, lu et approuvé. Date et signature du client :
              </p>
              <div className="h-16 border-2 border-dashed border-blue-300 rounded-lg bg-white flex items-center justify-center">
                <span className="text-blue-400 text-sm">Zone de signature</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Fenêtre d'historique */}
      <DevisHistory
        devisId={devis.id}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  )
}
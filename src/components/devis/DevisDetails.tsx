import React from 'react'
import { Devis, Client } from '../../lib/supabase'
import { X, Edit, FileText, User, Calendar, Euro, Download, Send } from 'lucide-react'

interface DevisDetailsProps {
  devis: Devis;
  client?: Client;
  onClose: () => void;
  onEdit: () => void;
}

export function DevisDetails({ devis, client, onClose, onEdit }: DevisDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: 'bg-gray-100 text-gray-800',
      envoye: 'bg-blue-100 text-blue-800',
      accepte: 'bg-green-100 text-green-800',
      refuse: 'bg-red-100 text-red-800',
      expire: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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

  const handleExportPDF = async () => {
    try {
      if (!client) {
        alert('Informations client manquantes pour l\'export PDF')
        return
      }

      // TODO: Implémenter l'export PDF
      console.log('Export PDF pour le devis:', devis.numero)
      alert('Fonctionnalité d\'export PDF en cours de développement')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    }
  }

  // Afficher les lignes du devis dans les détails
  const renderLignesDevis = () => {
    if (!devis.lignes || devis.lignes.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p>Aucune ligne de devis</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devis.lignes.map((ligne) => (
              <tr key={ligne.id}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ligne.description}
                  {ligne.remarques && (
                    <div className="text-xs text-gray-500 mt-1">{ligne.remarques}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{ligne.zone || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ligne.quantite}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(ligne.prix_unitaire)}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(ligne.total_ht)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Détails du devis</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
              title="Modifier"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{devis.numero}</h3>
              {client && (
                <p className="text-lg text-gray-600 flex items-center mt-1">
                  <User className="h-5 w-5 mr-2" />
                  {client.nom} - {client.entreprise}
                </p>
              )}
              {devis.objet && (
                <p className="text-gray-700 mt-2">{devis.objet}</p>
              )}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(devis.statut)}`}>
              {getStatusLabel(devis.statut)}
            </span>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Informations temporelles</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium text-gray-900">
                    {new Date(devis.date_creation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date du devis</p>
                  <p className="font-medium text-gray-900">
                    {new Date(devis.date_devis).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {devis.date_validite && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date de validité</p>
                    <p className="font-medium text-gray-900">
                      {new Date(devis.date_validite).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Montants */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 mb-4 flex items-center">
              <Euro className="h-5 w-5 mr-2" />
              Détail des montants
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-blue-700">Montant HT</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(devis.total_ht)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700">TVA</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(devis.total_tva)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700">Montant TTC</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(devis.total_ttc)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700">Marge</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(devis.marge_totale)}</p>
              </div>
            </div>

            {devis.prime_cee > 0 && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-blue-700">Prime CEE estimée</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(devis.prime_cee)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Client Information */}
          {client && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Informations client</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium text-gray-900">{client.nom}</p>
                  <p className="text-gray-700">{client.entreprise}</p>
                  {client.siret && (
                    <p className="text-xs text-gray-500 mt-1">SIRET: {client.siret}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coordonnées</p>
                  {client.email && (
                    <p className="text-gray-700">
                      <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                        {client.email}
                      </a>
                    </p>
                  )}
                  {client.telephone && (
                    <p className="text-gray-700">
                      <a href={`tel:${client.telephone}`} className="hover:text-blue-600">
                        {client.telephone}
                      </a>
                    </p>
                  )}
                  {client.ville && (
                    <p className="text-gray-700">
                      {client.ville} {client.code_postal && `(${client.code_postal})`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {devis.description_operation && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Description de l'opération
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{devis.description_operation}</p>
              </div>
            </div>
          )}

          {/* Lignes du devis */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Détail des prestations
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {renderLignesDevis()}
            </div>
          </div>

          {/* Notes */}
          {(devis.notes || devis.remarques) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notes et remarques
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {devis.notes || devis.remarques}
                </p>
              </div>
            </div>
          )}

          {/* Conditions commerciales */}
          {(devis.modalites_paiement || devis.garantie || devis.delais) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Conditions commerciales</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {devis.modalites_paiement && (
                  <p><span className="font-medium">Paiement:</span> {devis.modalites_paiement}</p>
                )}
                {devis.garantie && (
                  <p><span className="font-medium">Garantie:</span> {devis.garantie}</p>
                )}
                {devis.delais && (
                  <p><span className="font-medium">Délais:</span> {devis.delais}</p>
                )}
                {devis.penalites && (
                  <p><span className="font-medium">Pénalités:</span> {devis.penalites}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
              <button
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </button>
              <button
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={() => alert('Fonctionnalité en développement')}
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer par email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
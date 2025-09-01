import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface DevisData {
  numero: string
  date_devis: string
  objet: string
  client: any
  description_operation: string
  lignes: any[]
  total_ht: number
  total_tva: number
  total_ttc: number
  cee_kwh_cumac?: number
  cee_prix_unitaire?: number
  cee_montant_total?: number
  reste_a_payer_ht?: number
  delais: string
  modalites_paiement: string
  garantie: string
  penalites: string
  clause_juridique: string
}

export const generateDevisPDF = async (devisData: DevisData, isCEE: boolean = false) => {
  try {
    // Créer un élément HTML temporaire pour le PDF
    const pdfElement = document.createElement('div')
    pdfElement.style.position = 'absolute'
    pdfElement.style.left = '-9999px'
    pdfElement.style.width = '794px' // Largeur A4 en pixels
    pdfElement.style.minHeight = '1123px' // Hauteur A4 en pixels
    pdfElement.style.backgroundColor = 'white'
    pdfElement.style.padding = '40px'
    pdfElement.style.fontFamily = 'Arial, sans-serif'
    pdfElement.style.fontSize = '12px'
    pdfElement.style.lineHeight = '1.4'
    pdfElement.style.boxSizing = 'border-box'

    // Générer le contenu HTML du devis
    pdfElement.innerHTML = generateDevisHTML(devisData, isCEE)

    // Ajouter l'élément au DOM temporairement
    document.body.appendChild(pdfElement)

    // Attendre que les images se chargent
    await new Promise(resolve => setTimeout(resolve, 500))

    // Générer le canvas à partir de l'élément HTML
    const canvas = await html2canvas(pdfElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // S'assurer que les images sont bien clonées
        const clonedImages = clonedDoc.querySelectorAll('img')
        clonedImages.forEach(img => {
          img.style.display = 'block'
        })
      }
    })

    // Supprimer l'élément temporaire
    document.body.removeChild(pdfElement)

    // Créer le PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    // Ajouter la première page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Télécharger le PDF
    const fileName = `${devisData.numero || 'devis'}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    return true
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error('Impossible de générer le PDF')
  }
}

const generateDevisHTML = (devisData: DevisData, isCEE: boolean): string => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Grouper les lignes par zone si nécessaire
  const groupedLines = devisData.lignes.reduce((acc, ligne) => {
    const zone = ligne.zone || 'Général'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(ligne)
    return acc
  }, {} as Record<string, any[]>)

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.4;">
      <!-- En-tête avec logo et informations -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0066cc;">
        <!-- Infos société sans logo -->
        <div style="flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 10px;">
            OXA GROUPE
          </div>
          <div style="font-size: 10px; color: #666; line-height: 1.5;">
            contact@oxa-groupe.fr<br>
            01 23 45 67 89<br>
            75008 Paris, France
          </div>
        </div>
        
        <!-- Titre et numéro du devis -->
        <div style="text-align: right; flex: 1;">
          <div style="background: #0066cc; color: white; padding: 10px 20px; font-size: 24px; font-weight: bold; display: inline-block; margin-bottom: 10px;">
            ${isCEE ? 'DEVIS' : 'DEVIS'}
          </div>
          <div style="font-size: 14px; color: #0066cc; font-weight: bold; margin: 5px 0;">
            ${devisData.numero}
          </div>
          <div style="font-size: 12px; color: #666;">
            ${formatDate(devisData.date_devis)}
          </div>
        </div>
      </div>

      <!-- Informations client -->
      <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <div style="font-weight: bold; color: #0066cc; margin-bottom: 10px;">Client</div>
        <div style="margin-bottom: 5px;">
          <strong>${devisData.client?.entreprise || 'Nom de l\'entreprise'}</strong>
        </div>
        <div style="font-size: 11px; color: #666;">
          ${devisData.client?.nom || 'Nom du contact'}<br>
          ${devisData.client?.email || 'email@client.fr'}<br>
          ${devisData.client?.telephone || '01 23 45 67 89'}<br>
          ${devisData.client?.adresse || ''} ${devisData.client?.code_postal || ''} ${devisData.client?.ville || ''}
        </div>
      </div>

      <!-- Objet du devis -->
      ${devisData.objet ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #0066cc; font-size: 14px; margin-bottom: 5px;">Objet</h3>
          <p style="margin: 0; font-size: 12px;">${devisData.objet}</p>
        </div>
      ` : ''}

      <!-- Description de l'opération -->
      ${devisData.description_operation ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #0066cc; font-size: 14px; margin-bottom: 5px;">Description de l'opération</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${devisData.description_operation}</p>
        </div>
      ` : ''}

      <!-- Tableau des prestations avec protection contre la coupure de page -->
      <div style="page-break-inside: avoid;">
        <h3 style="color: #0066cc; font-size: 16px; margin: 20px 0 10px 0;">Détail des prestations</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="page-break-inside: avoid; page-break-after: avoid;">
              <th style="background: #0066cc; color: white; padding: 10px; text-align: left; font-size: 12px; width: 50%;">Désignation</th>
              <th style="background: #0066cc; color: white; padding: 10px; text-align: center; font-size: 12px; width: 10%;">Qté</th>
              <th style="background: #0066cc; color: white; padding: 10px; text-align: right; font-size: 12px; width: 15%;">Prix unit. HT</th>
              <th style="background: #0066cc; color: white; padding: 10px; text-align: right; font-size: 12px; width: 25%;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(groupedLines).map(([zone, lignes]) => {
              // Regrouper les lignes par blocs pour éviter les coupures
              const lignesHTML = lignes.map((ligne, index) => `
                <tr style="border-bottom: 1px solid #e0e0e0; page-break-inside: avoid;">
                  <td style="padding: 8px 10px; font-size: 11px; page-break-inside: avoid;">
                    ${ligne.description ? `<br><span style="color: #666; font-size: 10px;">${ligne.description}</span>` : ''}
                    ${ligne.remarques ? `<br><small style="color: #999; font-style: italic; font-size: 9px;">${ligne.remarques}</small>` : ''}
                  </td>
                  <td style="padding: 8px 10px; text-align: center; font-size: 11px; page-break-inside: avoid;">${ligne.quantite || 1}</td>
                  <td style="padding: 8px 10px; text-align: right; font-size: 11px; page-break-inside: avoid;">${formatCurrency(ligne.prix_unitaire || 0)}</td>
                  <td style="padding: 8px 10px; text-align: right; font-weight: bold; font-size: 11px; page-break-inside: avoid;">${formatCurrency(ligne.prix_total || (ligne.prix_unitaire * ligne.quantite) || 0)}</td>
                </tr>
              `).join('');
              
              if (zone !== 'Général') {
                return `
                  <tbody style="page-break-inside: avoid;">
                    <tr style="page-break-inside: avoid;">
                      <td colspan="4" style="background: #f0f4f8; padding: 8px; font-weight: bold; color: #0066cc; font-size: 12px;">
                        ${zone}
                      </td>
                    </tr>
                    ${lignesHTML}
                  </tbody>
                `;
              }
              return lignesHTML;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section totaux avec CEE si applicable - Éviter la coupure -->
      <div style="display: flex; justify-content: space-between; margin-top: 30px; gap: 20px; page-break-inside: avoid;">
        
        <!-- Section CEE (si applicable) -->
        ${isCEE && devisData.cee_kwh_cumac ? `
          <div style="flex: 1; background: #fff9e6; border: 2px solid #ffb300; border-radius: 8px; padding: 15px;">
            <div style="color: #ff8800; font-weight: bold; font-size: 14px; margin-bottom: 10px; text-align: center;">
              Certificats d'Économies d'Énergie
            </div>
            <div style="font-size: 11px;">
              <div style="display: flex; justify-content: space-between; margin: 5px 0; padding: 3px 0;">
                <span style="color: #666;">kWh cumac générés :</span>
                <span style="font-weight: bold; color: #ff8800;">${(devisData.cee_kwh_cumac || 0).toLocaleString('fr-FR')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 5px 0; padding: 3px 0;">
                <span style="color: #666;">Prix unitaire :</span>
                <span style="font-weight: bold; color: #ff8800;">${(devisData.cee_prix_unitaire || 0).toFixed(3)} €/kWh</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 5px 0; padding: 3px 0; border-top: 1px solid #ffb300; padding-top: 10px;">
                <span style="color: #666;"><strong>Prime CEE estimée :</strong></span>
                <span style="font-weight: bold; color: #ff8800; font-size: 14px;">${formatCurrency(devisData.cee_montant_total || 0)}</span>
              </div>
            </div>
          </div>
        ` : '<div style="flex: 1;"></div>'}
        
        <!-- Section Sous-totaux -->
        <div style="flex: 0 0 300px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <span>Sous-total HT :</span>
              <span>${formatCurrency(devisData.total_ht)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <span>TVA (${devisData.lignes[0]?.tva || 20}%) :</span>
              <span>${formatCurrency(devisData.total_tva)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 16px; font-weight: bold; color: #0066cc; border-top: 2px solid #0066cc; margin-top: 10px; padding-top: 10px;">
              <span>TOTAL TTC :</span>
              <span>${formatCurrency(devisData.total_ttc)}</span>
            </div>
            ${isCEE && devisData.cee_montant_total ? `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #28a745;">
                <span>Prime CEE déduite :</span>
                <span>-${formatCurrency(devisData.cee_montant_total)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; font-weight: bold; color: #28a745;">
                <span>Reste à payer :</span>
                <span>${formatCurrency((devisData.total_ttc || 0) - (devisData.cee_montant_total || 0))}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Conditions - Éviter la coupure -->
      <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 11px; page-break-inside: avoid;">
        <h3 style="color: #0066cc; font-size: 14px; margin-bottom: 10px;">Conditions</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <strong>Modalités de paiement :</strong><br>
            ${devisData.modalites_paiement || '30% à la commande, 70% à la livraison'}
          </div>
          <div>
            <strong>Délai de livraison :</strong><br>
            ${devisData.delais || '4 à 6 semaines'}
          </div>
        </div>
        <div style="margin-top: 10px;">
          <strong>Garantie :</strong><br>
          ${devisData.garantie || '2 ans pièces et main d\'œuvre'}
        </div>
        ${devisData.penalites ? `
          <div style="margin-top: 10px;">
            <strong>Pénalités :</strong><br>
            ${devisData.penalites}
          </div>
        ` : ''}
        ${devisData.clause_juridique ? `
          <div style="margin-top: 10px;">
            <strong>Clause juridique :</strong><br>
            ${devisData.clause_juridique}
          </div>
        ` : ''}
      </div>

      <!-- Section signature - Éviter la coupure -->
      <div style="margin-top: 40px; padding: 20px; border: 2px solid #0066cc; border-radius: 8px; page-break-inside: avoid;">
        <div style="text-align: center; color: #0066cc; font-weight: bold; margin-bottom: 20px;">
          Validation client
        </div>
        <div style="display: flex; justify-content: space-around; gap: 30px;">
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Nom / Fonction</div>
            <div style="border-bottom: 1px solid #999; height: 50px;"></div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Signature</div>
            <div style="border-bottom: 1px solid #999; height: 50px;"></div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Date</div>
            <div style="border-bottom: 1px solid #999; height: 50px;"></div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #0066cc; font-size: 12px; font-weight: bold;">
          Mention manuscrite obligatoire : "Bon pour accord"
        </div>
      </div>

      <!-- Pied de page -->
      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0;">OXA GROUPE - Décarbonation Industrielle</p>
        <p style="margin: 5px 0 0 0;">Ce devis est valable 30 jours à compter de sa date d'émission</p>
      </div>
    </div>
  `
}
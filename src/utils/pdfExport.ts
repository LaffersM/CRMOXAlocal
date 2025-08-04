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
    pdfElement.style.width = '210mm'
    pdfElement.style.backgroundColor = 'white'
    pdfElement.style.padding = '20mm'
    pdfElement.style.fontFamily = 'Arial, sans-serif'
    pdfElement.style.fontSize = '12px'
    pdfElement.style.lineHeight = '1.4'

    // Générer le contenu HTML du devis
    pdfElement.innerHTML = generateDevisHTML(devisData, isCEE)

    // Ajouter l'élément au DOM temporairement
    document.body.appendChild(pdfElement)

    // Générer le canvas à partir de l'élément HTML
    const canvas = await html2canvas(pdfElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
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

// Nouvelle fonction generateDevisHTML corrigée pour src/utils/pdfExport.ts

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

  // Grouper les lignes par zone
  const groupedLines = devisData.lignes.reduce((acc: any, ligne: any) => {
    const zone = ligne.zone || 'Général'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(ligne)
    return acc
  }, {})

  return `
    <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #333; max-width: 210mm; margin: 0 auto; padding: 10mm;">
      
      <!-- En-tête -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
        <div style="flex: 1;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 20px; border-radius: 12px; display: inline-block; margin-bottom: 15px;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">OXA GROUPE</div>
            <div style="font-size: 12px; opacity: 0.9;">Décarbonation Industrielle</div>
          </div>
        </div>
        
        <div style="text-align: right; flex: 1;">
          <div style="font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 10px;">
            ${isCEE ? 'DEVIS CEE' : 'DEVIS'}
          </div>
          <div style="font-size: 14px; font-weight: bold;">${devisData.numero || 'DEV-2025-XXX-001'}</div>
          <div style="color: #666; margin-top: 5px;">${formatDate(devisData.date_devis)}</div>
        </div>
      </div>

      <!-- Informations client et devis -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        
        <!-- Informations du devis -->
        <div>
          <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
            Informations du devis
          </h3>
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="margin-bottom: 8px;"><strong>N° de devis:</strong> ${devisData.numero || 'DEV-2025-XXX-001'}</div>
            <div style="margin-bottom: 8px;"><strong>Date:</strong> ${formatDate(devisData.date_devis)}</div>
            <div style="margin-bottom: 8px;"><strong>Objet:</strong> ${devisData.objet}</div>
            ${devisData.delais ? `<div style="margin-bottom: 8px;"><strong>Délais:</strong> ${devisData.delais}</div>` : ''}
          </div>
        </div>

        <!-- Informations client -->
        <div>
          <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
            Client
          </h3>
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="font-weight: bold; margin-bottom: 5px;">${devisData.client?.entreprise || 'Entreprise'}</div>
            <div style="margin-bottom: 5px;">${devisData.client?.nom || 'Contact'}</div>
            ${devisData.client?.adresse ? `<div style="margin-bottom: 3px;">${devisData.client.adresse}</div>` : ''}
            ${devisData.client?.code_postal && devisData.client?.ville ?
      `<div style="margin-bottom: 3px;">${devisData.client.code_postal} ${devisData.client.ville}</div>` : ''}
            ${devisData.client?.telephone ? `<div style="margin-bottom: 3px;">Tél: ${devisData.client.telephone}</div>` : ''}
            ${devisData.client?.email ? `<div style="margin-bottom: 3px;">Email: ${devisData.client.email}</div>` : ''}
            ${devisData.client?.siret ? `<div style="margin-bottom: 3px;">SIRET: ${devisData.client.siret}</div>` : ''}
          </div>
        </div>
      </div>

      ${devisData.description_operation ? `
        <!-- Description de l'opération -->
        <div style="margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
          <h3 style="font-size: 13px; font-weight: bold; color: #374151; margin: 0 0 10px 0;">
            Description de l'opération
          </h3>
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #4b5563;">
            ${devisData.description_operation}
          </p>
        </div>
      ` : ''}

      ${isCEE && (devisData.cee_kwh_cumac || 0) > 0 ? `
        <!-- Calcul CEE -->
        <div style="margin-bottom: 25px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #92400e; margin: 0 0 15px 0; display: flex; align-items: center;">
            ⚡ Calcul CEE IND-UT-134
          </h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 11px;">
            <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f59e0b;">
              <div style="color: #92400e; font-weight: bold; margin-bottom: 5px;">kWh cumac</div>
              <div style="font-size: 16px; font-weight: bold; color: #1f2937;">
                ${(devisData.cee_kwh_cumac || 0).toLocaleString('fr-FR')}
              </div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f59e0b;">
              <div style="color: #92400e; font-weight: bold; margin-bottom: 5px;">Prix unitaire</div>
              <div style="font-size: 14px; font-weight: bold; color: #1f2937;">
                ${(devisData.cee_prix_unitaire || 0).toFixed(4)} €/kWh
              </div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #f59e0b;">
              <div style="color: #92400e; font-weight: bold; margin-bottom: 5px;">Prime CEE</div>
              <div style="font-size: 16px; font-weight: bold; color: #059669;">
                ${formatCurrency(devisData.cee_montant_total || 0)}
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Détail des prestations -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Détail des prestations
        </h3>
        
        ${Object.entries(groupedLines).map(([zone, lignes]: [string, any]) => `
          ${zone !== 'Général' ? `
            <div style="background-color: #1e40af; color: white; padding: 8px 12px; font-weight: bold; font-size: 12px; margin: 15px 0 5px 0; border-radius: 4px;">
              ${zone}
            </div>
          ` : ''}
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; width: 45%;">Désignation</th>
                <th style="text-align: center; padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; width: 8%;">Qté</th>
                <th style="text-align: right; padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; width: 15%;">Prix unit. HT</th>
                <th style="text-align: right; padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; width: 15%;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${lignes.map((ligne: any, index: number) => `
                <tr style="border-bottom: 1px solid #f1f5f9; ${index % 2 === 0 ? 'background-color: #fafbfc;' : ''}">
                  <td style="padding: 8px 6px; border: 1px solid #e2e8f0; vertical-align: top;">
                    <div style="font-weight: 500; margin-bottom: 2px;">${ligne.designation || ligne.description}</div>
                    ${ligne.remarques ? `<div style="font-size: 9px; color: #6b7280; font-style: italic;">${ligne.remarques}</div>` : ''}
                  </td>
                  <td style="padding: 8px 6px; border: 1px solid #e2e8f0; text-align: center;">
                    ${ligne.quantite}
                  </td>
                  <td style="padding: 8px 6px; border: 1px solid #e2e8f0; text-align: right;">
                    ${formatCurrency(ligne.prix_unitaire)}
                  </td>
                  <td style="padding: 8px 6px; border: 1px solid #e2e8f0; text-align: right; font-weight: 500;">
                    ${formatCurrency(ligne.prix_total || ligne.total_ht || (ligne.quantite * ligne.prix_unitaire))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
      </div>

      <!-- Récapitulatif financier -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Récapitulatif
        </h3>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div></div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px;">
              <span>Total HT:</span>
              <span style="font-weight: 600;">${formatCurrency(devisData.total_ht)}</span>
            </div>
            
            ${isCEE && (devisData.cee_montant_total || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #059669; font-size: 11px;">
                <span>Prime CEE:</span>
                <span style="font-weight: 600;">- ${formatCurrency(devisData.cee_montant_total)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px solid #d1d5db; font-size: 11px;">
                <span>Reste à payer HT:</span>
                <span style="font-weight: 600;">${formatCurrency(devisData.reste_a_payer_ht || 0)}</span>
              </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px;">
              <span>TVA (20%):</span>
              <span style="font-weight: 600;">${formatCurrency(devisData.total_tva)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #374151; font-size: 13px; font-weight: bold;">
              <span>TOTAL TTC:</span>
              <span>${formatCurrency(devisData.total_ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Conditions -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Conditions
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 10px; line-height: 1.5;">
          <div>
            <p style="margin: 0 0 10px 0; font-weight: bold;">Modalités de paiement:</p>
            <p style="margin: 0 0 15px 0; color: #4b5563;">${devisData.modalites_paiement}</p>
            
            <p style="margin: 0 0 10px 0; font-weight: bold;">Garantie:</p>
            <p style="margin: 0; color: #4b5563;">${devisData.garantie}</p>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-weight: bold;">Pénalités:</p>
            <p style="margin: 0 0 15px 0; color: #4b5563;">${devisData.penalites}</p>
            
            <p style="margin: 0 0 10px 0; font-weight: bold;">Clause juridique:</p>
            <p style="margin: 0; color: #4b5563;">${devisData.clause_juridique}</p>
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div style="margin-top: 40px; border: 2px solid #dbeafe; border-radius: 8px; padding: 20px; background-color: #eff6ff;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; text-align: center; margin: 0 0 20px 0;">
          Validation client
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; font-size: 10px;">
          <div>
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">Nom / Fonction</p>
            <div style="height: 40px; border-bottom: 2px solid #93c5fd;"></div>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">Signature</p>
            <div style="height: 40px; border-bottom: 2px solid #93c5fd;"></div>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">Date</p>
            <div style="height: 40px; border-bottom: 2px solid #93c5fd;"></div>
          </div>
        </div>
        <p style="text-align: center; font-size: 11px; color: #1e40af; margin: 15px 0 0 0; font-weight: bold;">
          Mention manuscrite obligatoire : "Bon pour accord"
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p style="margin: 0;">OXA GROUPE - Décarbonation Industrielle</p>
        <p style="margin: 5px 0 0 0;">Ce devis est valable 30 jours à compter de sa date d'émission</p>
      </div>

    </div>
  `;
}
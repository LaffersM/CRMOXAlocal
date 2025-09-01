import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface DevisHistoryEntry {
    id: string;
    devis_id: string;
    user_id: string;
    user_name: string;
    action_type: 'creation' | 'modification' | 'commentaire' | 'ajout_ligne' | 'suppression_ligne' | 'changement_statut';
    description: string;
    details?: string;
    commentaire?: string;
    timestamp: string;
}

export function useDevisHistory() {
    const { profile } = useAuth();

    // Fonction pour ajouter une entrée dans l'historique
    const addHistoryEntry = useCallback(async (
        devisId: string,
        actionType: DevisHistoryEntry['action_type'],
        description: string,
        details?: any,
        commentaire?: string
    ) => {
        if (!profile) return;

        const entry = {
            devis_id: devisId,
            user_id: profile.user_id,
            user_name: `${profile.prenom} ${profile.nom}`,
            action_type: actionType,
            description,
            details: details ? JSON.stringify(details) : null,
            commentaire: commentaire || null,
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('devis_history')
                .insert([entry])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erreur ajout historique:', error);
        }
    }, [profile]);

    // Fonctions helpers pour les actions courantes
    const logDevisCreation = useCallback((devisId: string, clientName: string, commentaire?: string) => {
        return addHistoryEntry(
            devisId,
            'creation',
            `Devis créé pour ${clientName}`,
            { client: clientName },
            commentaire
        );
    }, [addHistoryEntry]);

    const logDevisModification = useCallback((devisId: string, modifications: string[], commentaire?: string) => {
        return addHistoryEntry(
            devisId,
            'modification',
            `Devis modifié : ${modifications.join(', ')}`,
            { modifications },
            commentaire
        );
    }, [addHistoryEntry]);

    const logLigneAjoutee = useCallback((devisId: string, data: { designation: string, zone: string }, commentaire?: string) => {
        return addHistoryEntry(
            devisId,
            'ajout_ligne',
            `Ligne ajoutée dans ${data.zone}`,
            data,
            commentaire
        );
    }, [addHistoryEntry]);

    const logLigneSupprimee = useCallback((devisId: string, data: { designation: string, zone: string }, commentaire?: string) => {
        return addHistoryEntry(
            devisId,
            'suppression_ligne',
            `Ligne supprimée de ${data.zone}`,
            data,
            commentaire
        );
    }, [addHistoryEntry]);

    const logChangementStatut = useCallback((devisId: string, ancienStatut: string, nouveauStatut: string, commentaire?: string) => {
        return addHistoryEntry(
            devisId,
            'changement_statut',
            `Statut changé de "${ancienStatut}" à "${nouveauStatut}"`,
            { ancienStatut, nouveauStatut },
            commentaire
        );
    }, [addHistoryEntry]);

    const logCommentaire = useCallback((devisId: string, commentaire: string) => {
        return addHistoryEntry(
            devisId,
            'commentaire',
            'Commentaire ajouté',
            {},
            commentaire
        );
    }, [addHistoryEntry]);

    // Fonction pour récupérer l'historique d'un devis
    const getDevisHistory = useCallback(async (devisId: string) => {
        try {
            const { data, error } = await supabase
                .from('devis_history')
                .select('*')
                .eq('devis_id', devisId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération historique:', error);
            return [];
        }
    }, []);

    // Fonction pour récupérer les commentaires d'un devis
    const getDevisComments = useCallback(async (devisId: string) => {
        try {
            const { data, error } = await supabase
                .from('devis_comments')
                .select('*')
                .eq('devis_id', devisId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erreur récupération commentaires:', error);
            return [];
        }
    }, []);

    // Fonction pour ajouter un commentaire
    const addComment = useCallback(async (devisId: string, commentaire: string) => {
        if (!profile) return;

        const comment = {
            devis_id: devisId,
            user_id: profile.user_id,
            user_name: `${profile.prenom} ${profile.nom}`,
            commentaire: commentaire.trim()
        };

        try {
            const { data, error } = await supabase
                .from('devis_comments')
                .insert([comment])
                .select()
                .single();

            if (error) throw error;

            // Ajouter aussi à l'historique
            await logCommentaire(devisId, commentaire);

            return data;
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
        }
    }, [profile, logCommentaire]);

    return {
        logDevisCreation,
        logDevisModification,
        logLigneAjoutee,
        logLigneSupprimee,
        logChangementStatut,
        logCommentaire,
        addHistoryEntry,
        getDevisHistory,
        getDevisComments,
        addComment
    };
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDevisHistory } from '../../hooks/useDevisHistory';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Edit, 
  Plus, 
  Trash2, 
  Send,
  X,
  History
} from 'lucide-react';

// Types locaux
interface DevisHistoryEntry {
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

interface DevisComment {
  id: string;
  devis_id: string;
  user_id: string;
  user_name: string;
  commentaire: string;
  created_at: string;
}

interface DevisHistoryProps {
  devisId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DevisHistory({ devisId, isOpen, onClose }: DevisHistoryProps) {
  const { profile } = useAuth();
  const { getDevisHistory, getDevisComments, addComment } = useDevisHistory();
  const [historique, setHistorique] = useState<DevisHistoryEntry[]>([]);
  const [commentaires, setCommentaires] = useState<DevisComment[]>([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [ongletActif, setOngletActif] = useState<'historique' | 'commentaires'>('historique');

  useEffect(() => {
    if (isOpen && devisId) {
      loadHistoriqueEtCommentaires();
    }
  }, [isOpen, devisId]);

  const loadHistoriqueEtCommentaires = async () => {
    setLoading(true);
    try {
      // Charger les vraies données depuis Supabase
      const [historiqueData, commentairesData] = await Promise.all([
        getDevisHistory(devisId),
        getDevisComments(devisId)
      ]);

      setHistorique(historiqueData);
      setCommentaires(commentairesData);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const ajouterCommentaire = async () => {
    if (!nouveauCommentaire.trim() || !profile) return;

    try {
      // Utiliser la vraie fonction addComment
      await addComment(devisId, nouveauCommentaire);
      
      // Recharger les données
      await loadHistoriqueEtCommentaires();
      
      setNouveauCommentaire('');
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      creation: Plus,
      modification: Edit,
      commentaire: MessageSquare,
      ajout_ligne: Plus,
      suppression_ligne: Trash2,
      changement_statut: Edit
    };
    return icons[actionType as keyof typeof icons] || Edit;
  };

  const getActionColor = (actionType: string) => {
    const colors = {
      creation: 'text-green-600 bg-green-100',
      modification: 'text-blue-600 bg-blue-100',
      commentaire: 'text-purple-600 bg-purple-100',
      ajout_ligne: 'text-emerald-600 bg-emerald-100',
      suppression_ligne: 'text-red-600 bg-red-100',
      changement_statut: 'text-orange-600 bg-orange-100'
    };
    return colors[actionType as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Historique & Commentaires
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setOngletActif('historique')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              ongletActif === 'historique'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Historique ({historique.length})
          </button>
          <button
            onClick={() => setOngletActif('commentaires')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              ongletActif === 'commentaires'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Commentaires ({commentaires.length})
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {ongletActif === 'historique' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement...</p>
                </div>
              ) : historique.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun historique disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historique.map((entry) => {
                    const ActionIcon = getActionIcon(entry.action_type);
                    return (
                      <div key={entry.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${getActionColor(entry.action_type)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              @{entry.user_name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{entry.description}</p>
                          {entry.commentaire && (
                            <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-200">
                              <p className="text-sm text-gray-600 italic">"{entry.commentaire}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {ongletActif === 'commentaires' && (
            <div className="space-y-4">
              {/* Formulaire nouveau commentaire */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      @{profile?.prenom} {profile?.nom}
                    </p>
                    <textarea
                      value={nouveauCommentaire}
                      onChange={(e) => setNouveauCommentaire(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={ajouterCommentaire}
                        disabled={!nouveauCommentaire.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des commentaires */}
              {commentaires.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun commentaire pour le moment</p>
                  <p className="text-sm text-gray-400 mt-1">Soyez le premier à ajouter un commentaire !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commentaires.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">
                            @{comment.user_name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                          {comment.commentaire}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
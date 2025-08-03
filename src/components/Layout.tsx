import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigation } from './Navigation'
import { AuthForm } from './AuthForm'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, loading, error } = useAuth()

  // Écran de chargement simplifié (sans timeout forcé)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">OXA</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de l'application...</p>
          <p className="text-sm text-gray-500 mt-2">OXA Groupe CRM</p>
        </div>
      </div>
    )
  }

  // Écran d'erreur amélioré
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Erreur de connexion</h2>
            <div className="bg-white rounded-xl shadow-sm p-6 text-left">
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-red-900 mb-2">Problème détecté</h3>
                <p className="text-sm text-red-700">
                  Impossible de se connecter à la base de données.
                </p>
                <p className="text-xs text-red-600 mt-2 break-words">
                  {error}
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-yellow-900 mb-2">Solutions possibles :</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Vérifiez votre connexion internet</li>
                  <li>Contrôlez vos variables d'environnement</li>
                  <li>Vérifiez le statut de Supabase</li>
                  <li>Consultez la console pour plus de détails</li>
                </ul>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulaire d'authentification si pas d'utilisateur
  if (!user) {
    return <AuthForm />
  }

  // Interface principale avec navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-6 pb-6">
        {children}
      </main>
    </div>
  )
}
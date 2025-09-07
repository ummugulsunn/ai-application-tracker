'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'

type Language = 'en' | 'tr' | 'de' | 'fr' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.applications': 'Applications',
    'nav.analytics': 'Analytics',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'Job Application Tracker',
    'dashboard.welcome': 'Welcome back, {{name}}!',
    'dashboard.totalApplications': 'Total Applications',
    'dashboard.pendingApplications': 'Pending',
    'dashboard.interviewsScheduled': 'Interviews',
    'dashboard.offersReceived': 'Offers',
    
    // Applications
    'applications.add': 'Add Application',
    'applications.import': 'Import CSV',
    'applications.export': 'Export',
    'applications.search': 'Search applications...',
    'applications.company': 'Company',
    'applications.position': 'Position',
    'applications.location': 'Location',
    'applications.status': 'Status',
    'applications.appliedDate': 'Applied',
    'applications.priority': 'Priority',
    'applications.actions': 'Actions',
    
    // Status
    'status.pending': 'Pending',
    'status.applied': 'Applied',
    'status.interviewing': 'Interviewing',
    'status.offered': 'Offered',
    'status.rejected': 'Rejected',
    'status.accepted': 'Accepted',
    'status.withdrawn': 'Withdrawn',
    
    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    
    // Forms
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.delete': 'Delete',
    'form.edit': 'Edit',
    'form.view': 'View',
    'form.required': 'Required',
    'form.optional': 'Optional',
    
    // Messages
    'message.success': 'Success!',
    'message.error': 'Error occurred',
    'message.loading': 'Loading...',
    'message.noData': 'No data available',
    'message.confirmDelete': 'Are you sure you want to delete this item?',
    
    // Settings
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.account': 'Account',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
  },
  
  tr: {
    // Navigation
    'nav.dashboard': 'Ana Panel',
    'nav.applications': 'Başvurular',
    'nav.analytics': 'Analitik',
    'nav.profile': 'Profil',
    'nav.settings': 'Ayarlar',
    'nav.logout': 'Çıkış',
    
    // Dashboard
    'dashboard.title': 'İş Başvuru Takipçisi',
    'dashboard.welcome': 'Tekrar hoş geldin, {{name}}!',
    'dashboard.totalApplications': 'Toplam Başvuru',
    'dashboard.pendingApplications': 'Bekleyen',
    'dashboard.interviewsScheduled': 'Mülakatlar',
    'dashboard.offersReceived': 'Teklifler',
    
    // Applications
    'applications.add': 'Başvuru Ekle',
    'applications.import': 'CSV İçe Aktar',
    'applications.export': 'Dışa Aktar',
    'applications.search': 'Başvuru ara...',
    'applications.company': 'Şirket',
    'applications.position': 'Pozisyon',
    'applications.location': 'Konum',
    'applications.status': 'Durum',
    'applications.appliedDate': 'Başvuru Tarihi',
    'applications.priority': 'Öncelik',
    'applications.actions': 'İşlemler',
    
    // Status
    'status.pending': 'Bekliyor',
    'status.applied': 'Başvuruldu',
    'status.interviewing': 'Mülakat',
    'status.offered': 'Teklif Alındı',
    'status.rejected': 'Reddedildi',
    'status.accepted': 'Kabul Edildi',
    'status.withdrawn': 'Geri Çekildi',
    
    // Priority
    'priority.low': 'Düşük',
    'priority.medium': 'Orta',
    'priority.high': 'Yüksek',
    
    // Forms
    'form.save': 'Kaydet',
    'form.cancel': 'İptal',
    'form.delete': 'Sil',
    'form.edit': 'Düzenle',
    'form.view': 'Görüntüle',
    'form.required': 'Zorunlu',
    'form.optional': 'İsteğe Bağlı',
    
    // Messages
    'message.success': 'Başarılı!',
    'message.error': 'Hata oluştu',
    'message.loading': 'Yükleniyor...',
    'message.noData': 'Veri bulunamadı',
    'message.confirmDelete': 'Bu öğeyi silmek istediğinizden emin misiniz?',
    
    // Settings
    'settings.appearance': 'Görünüm',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.notifications': 'Bildirimler',
    'settings.privacy': 'Gizlilik',
    'settings.account': 'Hesap',
    
    // Theme
    'theme.light': 'Açık',
    'theme.dark': 'Koyu',
    'theme.system': 'Sistem',
  },
  
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.applications': 'Bewerbungen',
    'nav.analytics': 'Analytik',
    'nav.profile': 'Profil',
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden',
    
    // Dashboard
    'dashboard.title': 'Bewerbungs-Tracker',
    'dashboard.welcome': 'Willkommen zurück, {{name}}!',
    'dashboard.totalApplications': 'Gesamt Bewerbungen',
    'dashboard.pendingApplications': 'Ausstehend',
    'dashboard.interviewsScheduled': 'Interviews',
    'dashboard.offersReceived': 'Angebote',
    
    // Applications
    'applications.add': 'Bewerbung hinzufügen',
    'applications.import': 'CSV importieren',
    'applications.export': 'Exportieren',
    'applications.search': 'Bewerbungen suchen...',
    'applications.company': 'Unternehmen',
    'applications.position': 'Position',
    'applications.location': 'Standort',
    'applications.status': 'Status',
    'applications.appliedDate': 'Beworben',
    'applications.priority': 'Priorität',
    'applications.actions': 'Aktionen',
    
    // Status
    'status.pending': 'Ausstehend',
    'status.applied': 'Beworben',
    'status.interviewing': 'Interview',
    'status.offered': 'Angebot erhalten',
    'status.rejected': 'Abgelehnt',
    'status.accepted': 'Angenommen',
    'status.withdrawn': 'Zurückgezogen',
    
    // Priority
    'priority.low': 'Niedrig',
    'priority.medium': 'Mittel',
    'priority.high': 'Hoch',
    
    // Forms
    'form.save': 'Speichern',
    'form.cancel': 'Abbrechen',
    'form.delete': 'Löschen',
    'form.edit': 'Bearbeiten',
    'form.view': 'Anzeigen',
    'form.required': 'Erforderlich',
    'form.optional': 'Optional',
    
    // Messages
    'message.success': 'Erfolgreich!',
    'message.error': 'Fehler aufgetreten',
    'message.loading': 'Laden...',
    'message.noData': 'Keine Daten verfügbar',
    'message.confirmDelete': 'Sind Sie sicher, dass Sie dieses Element löschen möchten?',
    
    // Settings
    'settings.appearance': 'Erscheinungsbild',
    'settings.language': 'Sprache',
    'settings.theme': 'Design',
    'settings.notifications': 'Benachrichtigungen',
    'settings.privacy': 'Datenschutz',
    'settings.account': 'Konto',
    
    // Theme
    'theme.light': 'Hell',
    'theme.dark': 'Dunkel',
    'theme.system': 'System',
  },
  
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.applications': 'Candidatures',
    'nav.analytics': 'Analytique',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    
    // Dashboard
    'dashboard.title': 'Suivi des Candidatures',
    'dashboard.welcome': 'Bon retour, {{name}}!',
    'dashboard.totalApplications': 'Total Candidatures',
    'dashboard.pendingApplications': 'En attente',
    'dashboard.interviewsScheduled': 'Entretiens',
    'dashboard.offersReceived': 'Offres',
    
    // Applications
    'applications.add': 'Ajouter Candidature',
    'applications.import': 'Importer CSV',
    'applications.export': 'Exporter',
    'applications.search': 'Rechercher candidatures...',
    'applications.company': 'Entreprise',
    'applications.position': 'Poste',
    'applications.location': 'Lieu',
    'applications.status': 'Statut',
    'applications.appliedDate': 'Postulé',
    'applications.priority': 'Priorité',
    'applications.actions': 'Actions',
    
    // Status
    'status.pending': 'En attente',
    'status.applied': 'Postulé',
    'status.interviewing': 'Entretien',
    'status.offered': 'Offre reçue',
    'status.rejected': 'Rejeté',
    'status.accepted': 'Accepté',
    'status.withdrawn': 'Retiré',
    
    // Priority
    'priority.low': 'Faible',
    'priority.medium': 'Moyen',
    'priority.high': 'Élevé',
    
    // Forms
    'form.save': 'Enregistrer',
    'form.cancel': 'Annuler',
    'form.delete': 'Supprimer',
    'form.edit': 'Modifier',
    'form.view': 'Voir',
    'form.required': 'Requis',
    'form.optional': 'Optionnel',
    
    // Messages
    'message.success': 'Succès!',
    'message.error': 'Erreur survenue',
    'message.loading': 'Chargement...',
    'message.noData': 'Aucune donnée disponible',
    'message.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet élément?',
    
    // Settings
    'settings.appearance': 'Apparence',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Confidentialité',
    'settings.account': 'Compte',
    
    // Theme
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Système',
  },
  
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.applications': 'Solicitudes',
    'nav.analytics': 'Analítica',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar sesión',
    
    // Dashboard
    'dashboard.title': 'Seguimiento de Solicitudes',
    'dashboard.welcome': '¡Bienvenido de nuevo, {{name}}!',
    'dashboard.totalApplications': 'Total Solicitudes',
    'dashboard.pendingApplications': 'Pendientes',
    'dashboard.interviewsScheduled': 'Entrevistas',
    'dashboard.offersReceived': 'Ofertas',
    
    // Applications
    'applications.add': 'Agregar Solicitud',
    'applications.import': 'Importar CSV',
    'applications.export': 'Exportar',
    'applications.search': 'Buscar solicitudes...',
    'applications.company': 'Empresa',
    'applications.position': 'Posición',
    'applications.location': 'Ubicación',
    'applications.status': 'Estado',
    'applications.appliedDate': 'Aplicado',
    'applications.priority': 'Prioridad',
    'applications.actions': 'Acciones',
    
    // Status
    'status.pending': 'Pendiente',
    'status.applied': 'Aplicado',
    'status.interviewing': 'Entrevista',
    'status.offered': 'Oferta recibida',
    'status.rejected': 'Rechazado',
    'status.accepted': 'Aceptado',
    'status.withdrawn': 'Retirado',
    
    // Priority
    'priority.low': 'Baja',
    'priority.medium': 'Media',
    'priority.high': 'Alta',
    
    // Forms
    'form.save': 'Guardar',
    'form.cancel': 'Cancelar',
    'form.delete': 'Eliminar',
    'form.edit': 'Editar',
    'form.view': 'Ver',
    'form.required': 'Requerido',
    'form.optional': 'Opcional',
    
    // Messages
    'message.success': '¡Éxito!',
    'message.error': 'Error ocurrido',
    'message.loading': 'Cargando...',
    'message.noData': 'No hay datos disponibles',
    'message.confirmDelete': '¿Está seguro de que desea eliminar este elemento?',
    
    // Settings
    'settings.appearance': 'Apariencia',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.notifications': 'Notificaciones',
    'settings.privacy': 'Privacidad',
    'settings.account': 'Cuenta',
    
    // Theme
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.system': 'Sistema',
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { preferences, savePreferences } = useUserPreferences()
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en')

  const language = (preferences?.language as Language) || 'en'

  useEffect(() => {
    setCurrentLanguage(language)
    // Set document language
    document.documentElement.lang = language
  }, [language])

  const setLanguage = async (newLanguage: Language) => {
    await savePreferences({ language: newLanguage })
  }

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[currentLanguage]?.[key] || translations.en[key] || key

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value)
      })
    }

    return translation
  }

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
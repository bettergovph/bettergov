import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { LanguageType } from '../types'
import enTranslations from '../localization/translations/en.json'

interface LanguageContextType {
  language: LanguageType
  setLanguage: (language: LanguageType) => void
  translate: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

// Language metadata
// Note: 'tgl' is handled as an alias for 'fil' in normalizeLanguage()
export const LANGUAGES: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  fil: { name: 'Filipino/Tagalog', nativeName: 'Filipino/Tagalog' },
  ceb: { name: 'Cebuano', nativeName: 'Bisaya/Sinugboanon' },
  ilo: { name: 'Ilocano', nativeName: 'Ilokano' },
  hil: { name: 'Hiligaynon', nativeName: 'Ilonggo' },
  war: { name: 'Waray', nativeName: 'Waray-Waray' },
  pam: { name: 'Kapampangan', nativeName: 'Kapampangan' },
  bcl: { name: 'Bikol', nativeName: 'Bikol Central' },
  pag: { name: 'Pangasinan', nativeName: 'Pangasinan' },
  mag: { name: 'Maguindanao', nativeName: 'Maguindanaon' },
  tsg: { name: 'Tausug', nativeName: 'Bahasa Sūg' },
  mdh: { name: 'Maranao', nativeName: 'Meranaw' },
}

// Normalize language codes (fil and tgl are the same)
const normalizeLanguage = (lang: LanguageType): LanguageType => {
  if (lang === 'tgl') return 'fil'
  return lang
}

// Load translations dynamically
const loadTranslations = async (lang: LanguageType): Promise<any> => {
  const normalizedLang = normalizeLanguage(lang)

  if (normalizedLang === 'en') {
    return enTranslations
  }

  try {
    const module = await import(`../localization/translations/${normalizedLang}.json`)
    return module.default
  } catch (error) {
    console.warn(`Translation file for ${normalizedLang} not found, falling back to English`)
    return enTranslations
  }
}

// Get value from nested object using dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize language from localStorage or default to 'en'
  const getInitialLanguage = (): LanguageType => {
    const savedLanguage = localStorage.getItem('language') as LanguageType
    const validLanguages: LanguageType[] = ['en', 'fil', 'tgl', 'ceb', 'ilo', 'hil', 'war', 'pam', 'bcl', 'pag', 'mag', 'tsg', 'mdh']

    if (savedLanguage && validLanguages.includes(savedLanguage)) {
      return savedLanguage
    }
    return 'en'
  }

  const [language, setLanguageState] = useState<LanguageType>(getInitialLanguage)
  const [translations, setTranslations] = useState<any>(enTranslations)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load translations when language changes
    setIsLoading(true)
    loadTranslations(language)
      .then(data => {
        setTranslations(data)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error loading translations:', error)
        setTranslations(enTranslations)
        setIsLoading(false)
      })

    // Update localStorage and document lang
    localStorage.setItem('language', language)
    document.documentElement.lang = normalizeLanguage(language)
  }, [language])

  const setLanguage = useCallback((lang: LanguageType) => {
    setLanguageState(lang)
  }, [])

  const translate = useCallback((key: string): string => {
    // Try to get translation from current language
    let value = getNestedValue(translations, key)

    if (value) {
      return value
    }

    // Fallback to English if not found
    if (language !== 'en') {
      value = getNestedValue(enTranslations, key)
      if (value) {
        return value
      }
    }

    // Return the key itself as last resort (helps identify missing translations)
    return key
  }, [translations, language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
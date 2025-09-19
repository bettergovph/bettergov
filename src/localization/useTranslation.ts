import { useState, useEffect, useCallback } from 'react'
import { LanguageCode } from './types'
import { DEFAULT_LANGUAGE } from './languages'
import en from './translations/en.json'

// Load translations dynamically
const loadTranslations = async (lang: LanguageCode) => {
  if (lang === 'en') return en

  try {
    const module = await import(`./translations/${lang}.json`)
    return module.default
  } catch {
    // If translation file doesn't exist, fall back to English
    return en
  }
}

export function useTranslation() {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('language')
    return (saved as LanguageCode) || DEFAULT_LANGUAGE
  })

  const [translations, setTranslations] = useState<any>(en)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    loadTranslations(language).then(data => {
      setTranslations(data)
      setLoading(false)
    })
  }, [language])

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
  }, [])

  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.')
    let current = translations

    for (const k of keys) {
      if (!current || typeof current !== 'object') {
        return fallback || key
      }
      current = current[k]
    }

    if (typeof current === 'string') {
      return current
    }

    // If we couldn't find the translation, try English
    if (language !== 'en') {
      let englishCurrent = en as any
      for (const k of keys) {
        if (!englishCurrent || typeof englishCurrent !== 'object') {
          return fallback || key
        }
        englishCurrent = englishCurrent[k]
      }
      if (typeof englishCurrent === 'string') {
        return englishCurrent
      }
    }

    return fallback || key
  }, [translations, language])

  return {
    t,
    language,
    setLanguage,
    loading,
  }
}
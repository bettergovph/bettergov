import React, { createContext, useContext, ReactNode } from 'react'
import { useTranslation } from './useTranslation'
import { LanguageCode } from './types'

interface TranslationContextValue {
  t: (key: string, fallback?: string) => string
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  loading: boolean
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const translation = useTranslation()

  return (
    <TranslationContext.Provider value={translation}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslationContext() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider')
  }
  return context
}
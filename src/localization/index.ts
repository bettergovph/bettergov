/**
 * Main localization module for BetterGov.ph
 * Exports all localization utilities, types, and hooks
 */

export * from './types'
export * from './languages'
export { useTranslation } from './useTranslation'
export { TranslationProvider } from './TranslationProvider'

// Re-export translations for direct access if needed
import en from './translations/en.json'

export const translations = {
  en,
  // Other languages will be added as they're translated
}

// Helper to get translation by key path
export function getTranslation(
  lang: string,
  key: string,
  fallback: string = ''
): string {
  const langData = (translations as any)[lang] || translations.en
  const keys = key.split('.')
  let current = langData

  for (const k of keys) {
    if (!current || typeof current !== 'object') return fallback
    current = current[k]
  }

  return typeof current === 'string' ? current : fallback
}
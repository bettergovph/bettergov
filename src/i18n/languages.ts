import { LanguageType } from '../types'

export interface LanguageInfo {
  code: LanguageType
  name: string
  nativeName: string
  enabled: boolean
}

export const LANGUAGES: Record<LanguageType, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', enabled: true },
  fil: { code: 'fil', name: 'Filipino/Tagalog', nativeName: 'Filipino/Tagalog', enabled: true },
  ceb: { code: 'ceb', name: 'Cebuano', nativeName: 'Bisaya/Sinugboanon', enabled: true },
  ilo: { code: 'ilo', name: 'Ilocano', nativeName: 'Ilokano', enabled: true },
  hil: { code: 'hil', name: 'Hiligaynon', nativeName: 'Ilonggo', enabled: true },
  war: { code: 'war', name: 'Waray', nativeName: 'Waray-Waray', enabled: false },
  pam: { code: 'pam', name: 'Kapampangan', nativeName: 'Kapampangan', enabled: false },
  bcl: { code: 'bcl', name: 'Bikol', nativeName: 'Bikol Central', enabled: false },
  pag: { code: 'pag', name: 'Pangasinan', nativeName: 'Pangasinan', enabled: false },
  tgl: { code: 'tgl', name: 'Tagalog', nativeName: 'Tagalog', enabled: false }, // Alias for fil
  mag: { code: 'mag', name: 'Maguindanao', nativeName: 'Maguindanaon', enabled: false },
  tsg: { code: 'tsg', name: 'Tausug', nativeName: 'Bahasa Sūg', enabled: false },
  mdh: { code: 'mdh', name: 'Maranao', nativeName: 'Meranaw', enabled: false },
}

export const ENABLED_LANGUAGES = Object.values(LANGUAGES).filter(lang => lang.enabled)

// Normalize language codes (fil and tgl are the same)
export const normalizeLanguage = (lang: LanguageType): LanguageType => {
  if (lang === 'tgl') return 'fil'
  return lang
}

export const DEFAULT_LANGUAGE: LanguageType = 'en'
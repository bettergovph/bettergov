export type LanguageCode =
  | 'en'    // English
  | 'fil'   // Filipino/Tagalog
  | 'ceb'   // Cebuano/Bisaya
  | 'ilo'   // Ilocano
  | 'hil'   // Hiligaynon/Ilonggo
  | 'war'   // Waray
  | 'pam'   // Kapampangan
  | 'bcl'   // Bikol
  | 'pag'   // Pangasinan
  | 'tgl'   // Tagalog (specific dialect)
  | 'mag'   // Maguindanao
  | 'tsg'   // Tausug
  | 'mdh'   // Maranao

export interface LanguageInfo {
  code: LanguageCode
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  enabled: boolean
}

export interface TranslationEntry {
  id: string
  key: string
  translations: Record<LanguageCode, string>
  context?: string
  category?: string
  lastUpdated?: string
}

export interface TranslationProgress {
  totalKeys: number
  translatedKeys: Record<LanguageCode, number>
  completionPercentage: Record<LanguageCode, number>
  lastUpdated: string
  inProgress?: string[]
}

export interface TranslationFile {
  version: string
  lastUpdated: string
  languages: LanguageInfo[]
  translations: Record<string, Record<LanguageCode, string>>
}
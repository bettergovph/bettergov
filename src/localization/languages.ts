import { LanguageInfo, LanguageCode } from './types'

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    enabled: true,
  },
  fil: {
    code: 'fil',
    name: 'Filipino',
    nativeName: 'Filipino',
    direction: 'ltr',
    enabled: true,
  },
  ceb: {
    code: 'ceb',
    name: 'Cebuano',
    nativeName: 'Bisaya/Sinugboanon',
    direction: 'ltr',
    enabled: true,
  },
  ilo: {
    code: 'ilo',
    name: 'Ilocano',
    nativeName: 'Ilokano',
    direction: 'ltr',
    enabled: true,
  },
  hil: {
    code: 'hil',
    name: 'Hiligaynon',
    nativeName: 'Ilonggo',
    direction: 'ltr',
    enabled: true,
  },
  war: {
    code: 'war',
    name: 'Waray',
    nativeName: 'Waray-Waray',
    direction: 'ltr',
    enabled: true,
  },
  pam: {
    code: 'pam',
    name: 'Kapampangan',
    nativeName: 'Kapampangan',
    direction: 'ltr',
    enabled: true,
  },
  bcl: {
    code: 'bcl',
    name: 'Bikol',
    nativeName: 'Bikol Central',
    direction: 'ltr',
    enabled: true,
  },
  pag: {
    code: 'pag',
    name: 'Pangasinan',
    nativeName: 'Pangasinan',
    direction: 'ltr',
    enabled: true,
  },
  tgl: {
    code: 'tgl',
    name: 'Tagalog',
    nativeName: 'Tagalog',
    direction: 'ltr',
    enabled: false, // Use Filipino as primary
  },
  mag: {
    code: 'mag',
    name: 'Maguindanao',
    nativeName: 'Maguindanao',
    direction: 'ltr',
    enabled: false, // Coming soon
  },
  tsg: {
    code: 'tsg',
    name: 'Tausug',
    nativeName: 'Bahasa Sūg',
    direction: 'ltr',
    enabled: false, // Coming soon
  },
  mdh: {
    code: 'mdh',
    name: 'Maranao',
    nativeName: 'Meranaw',
    direction: 'ltr',
    enabled: false, // Coming soon
  },
}

export const ENABLED_LANGUAGES = Object.values(LANGUAGES).filter(
  (lang) => lang.enabled
)

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  return LANGUAGES[code] || LANGUAGES[DEFAULT_LANGUAGE]
}

export function isLanguageEnabled(code: LanguageCode): boolean {
  return LANGUAGES[code]?.enabled || false
}
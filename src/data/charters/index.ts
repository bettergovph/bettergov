import { CitizenCharter } from '../../types/charter'

// Import charter data
import passportRenewalCharter from './passport-renewal.json'
import businessPermitCharter from './business-permit.json'

// Charter registry
export const charters: Record<string, CitizenCharter> = {
  'passport-renewal-dfa': passportRenewalCharter as CitizenCharter,
  'business-permit-new': businessPermitCharter as CitizenCharter
}

// Get all charters
export const getAllCharters = (): CitizenCharter[] => {
  return Object.values(charters)
}

// Get charter by ID
export const getCharterById = (id: string): CitizenCharter | null => {
  return charters[id] || null
}

// Get charters by category
export const getChartersByCategory = (category: string): CitizenCharter[] => {
  return Object.values(charters).filter(charter =>
    charter.category.toLowerCase() === category.toLowerCase()
  )
}

// Search charters
export const searchCharters = (query: string): CitizenCharter[] => {
  const searchTerm = query.toLowerCase()
  return Object.values(charters).filter(charter =>
    charter.title.toLowerCase().includes(searchTerm) ||
    charter.description.toLowerCase().includes(searchTerm) ||
    charter.category.toLowerCase().includes(searchTerm) ||
    charter.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

// Map service names to charter IDs
export const SERVICE_TO_CHARTER_MAP: Record<string, string> = {
  // Passport services
  'passport renewal': 'passport-renewal-dfa',
  'passport application': 'passport-renewal-dfa',
  'renew passport': 'passport-renewal-dfa',

  // Business services
  'business permit': 'business-permit-new',
  'business registration': 'business-permit-new',
  'new business permit': 'business-permit-new',
  'business license': 'business-permit-new',
}

// Get charter ID for a service name
export const getCharterForService = (serviceName: string): string | null => {
  const normalizedName = serviceName.toLowerCase()

  // Direct match
  if (SERVICE_TO_CHARTER_MAP[normalizedName]) {
    return SERVICE_TO_CHARTER_MAP[normalizedName]
  }

  // Partial match
  for (const [key, charterId] of Object.entries(SERVICE_TO_CHARTER_MAP)) {
    if (normalizedName.includes(key)) {
      return charterId
    }
  }

  return null
}
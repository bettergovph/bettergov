export interface CharterStep {
  id: string
  title: string
  description: string
  agency: string
  location?: string
  duration: {
    min: number // in days
    max: number
    unit: 'minutes' | 'hours' | 'days' | 'weeks'
  }
  cost?: {
    amount: number
    currency: 'PHP'
    description?: string
  }
  requirements: string[]
  outputs: string[]
  type: 'process' | 'decision' | 'document_submission' | 'payment' | 'wait' | 'external_agency'
  position: {
    x: number
    y: number
  }
  connections: string[] // IDs of next possible steps
  conditions?: {
    if: string
    then: string // step ID
    else?: string // step ID
  }[]
}

export interface CharterAgency {
  id: string
  name: string
  shortName: string
  website?: string
  contactInfo?: {
    hotline?: string
    email?: string
    address?: string
  }
  color: string // for visual distinction
}

export interface CharterPath {
  id: string
  name: string
  description: string
  estimatedDuration: string
  steps: string[] // step IDs in order
}

export interface CitizenCharter {
  id: string
  serviceId: string // links to existing service
  title: string
  description: string
  overview: string
  lastUpdated: string
  version: string

  // Core data
  agencies: CharterAgency[]
  steps: CharterStep[]
  paths: CharterPath[] // different possible routes through the process

  // Additional info
  generalRequirements: string[]
  importantNotes: string[]
  relatedServices: string[]

  // Metadata
  category: string
  subcategory: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'complex'

  // Tracking
  totalSteps: number
  estimatedTotalDuration: string
  estimatedTotalCost?: {
    min: number
    max: number
    currency: 'PHP'
  }
}

export interface CharterProgress {
  charterId: string
  userId?: string // for logged-in users
  sessionId: string // for anonymous tracking
  currentStep: string
  completedSteps: string[]
  startedAt: string
  lastUpdated: string
  selectedPath?: string
  notes?: string[]
}

export type CharterViewMode = 'flowchart' | 'timeline' | 'checklist' | 'overview'
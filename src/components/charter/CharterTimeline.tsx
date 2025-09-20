import React, { useState } from 'react'
import {
  Clock,
  DollarSign,
  CheckCircle,
  Circle,
  PlayCircle,
  Building,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { CitizenCharter, CharterStep } from '../../types/charter'

interface CharterTimelineProps {
  charter: CitizenCharter
  selectedPath?: string
  completedSteps?: string[]
  currentStep?: string
  onStepClick?: (stepId: string) => void
}

const CharterTimeline: React.FC<CharterTimelineProps> = ({
  charter,
  selectedPath,
  completedSteps = [],
  currentStep,
  onStepClick
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  // Get steps for the selected path, or all steps if no path selected
  const pathSteps = selectedPath
    ? charter.paths.find(p => p.id === selectedPath)?.steps || []
    : charter.steps.map(s => s.id)

  const orderedSteps = pathSteps
    .map(stepId => charter.steps.find(s => s.id === stepId))
    .filter(Boolean) as CharterStep[]

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'current':
        return PlayCircle
      default:
        return Circle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'current':
        return 'text-blue-600'
      default:
        return 'text-gray-400'
    }
  }

  const formatDuration = (duration: CharterStep['duration']) => {
    const { min, max, unit } = duration
    if (min === max) {
      return `${min} ${unit}`
    }
    return `${min}-${max} ${unit}`
  }

  const getAgency = (agencyId: string) => {
    return charter.agencies.find(a => a.id === agencyId)
  }

  const calculateCumulativeDays = (stepIndex: number) => {
    let totalDays = 0
    for (let i = 0; i <= stepIndex; i++) {
      const step = orderedSteps[i]
      if (step) {
        // Convert duration to days for cumulative calculation
        let daysToAdd = step.duration.max
        switch (step.duration.unit) {
          case 'minutes':
            daysToAdd = Math.ceil(step.duration.max / (8 * 60)) // 8 hour work day
            break
          case 'hours':
            daysToAdd = Math.ceil(step.duration.max / 8) // 8 hour work day
            break
          case 'weeks':
            daysToAdd = step.duration.max * 7
            break
          // days is default
        }
        totalDays += daysToAdd
      }
    }
    return totalDays
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Process Timeline
          </h3>

          {/* Path Selector */}
          {charter.paths.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Process Path:
              </label>
              <select
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPath || ''}
                onChange={(e) => {
                  // Handle path change - this would be passed from parent
                }}
              >
                <option value="">All Steps</option>
                {charter.paths.map(path => (
                  <option key={path.id} value={path.id}>
                    {path.name} ({path.estimatedDuration})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {selectedPath
                ? charter.paths.find(p => p.id === selectedPath)?.estimatedDuration
                : charter.estimatedTotalDuration
              }
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {orderedSteps.length} steps
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {orderedSteps.map((step, index) => {
            const status = getStepStatus(step.id)
            const StatusIcon = getStatusIcon(status)
            const agency = getAgency(step.agency)
            const cumulativeDays = calculateCumulativeDays(index)
            const isExpanded = expandedStep === step.id

            return (
              <div key={step.id} className="relative">
                {/* Timeline line */}
                {index < orderedSteps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                )}

                {/* Timeline item */}
                <div className="flex gap-4 pb-8">
                  {/* Timeline icon */}
                  <div className="flex-shrink-0">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2
                      ${status === 'completed' ? 'bg-green-100 border-green-500' :
                        status === 'current' ? 'bg-blue-100 border-blue-500' :
                        'bg-gray-50 border-gray-300'
                      }
                    `}>
                      <StatusIcon className={`h-6 w-6 ${getStatusColor(status)}`} />
                    </div>

                    {/* Day marker */}
                    <div className="text-center mt-2">
                      <div className="text-xs text-gray-500">Day</div>
                      <div className="text-sm font-medium text-gray-700">
                        {cumulativeDays}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Card
                      className={`
                        cursor-pointer transition-all hover:shadow-md
                        ${status === 'current' ? 'ring-2 ring-blue-500' : ''}
                        ${isExpanded ? 'shadow-lg' : ''}
                      `}
                      onClick={() => {
                        setExpandedStep(isExpanded ? null : step.id)
                        onStepClick?.(step.id)
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Step header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {step.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {step.description}
                            </p>
                          </div>

                          <div className="text-right ml-4">
                            {agency && (
                              <div
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white mb-1"
                                style={{ backgroundColor: agency.color }}
                              >
                                <Building className="h-3 w-3" />
                                {agency.shortName}
                              </div>
                            )}
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(step.duration)}
                            </div>
                            {step.cost && (
                              <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                                <DollarSign className="h-3 w-3" />
                                ₱{step.cost.amount}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick info */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{step.requirements.length} requirements</span>
                          <span>•</span>
                          <span>{step.outputs.length} outputs</span>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">
                                  Requirements
                                </h5>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {step.requirements.map((req, reqIndex) => (
                                    <li key={reqIndex} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">
                                  Expected Outputs
                                </h5>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {step.outputs.map((output, outputIndex) => (
                                    <li key={outputIndex} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      {output}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Agency contact info */}
                            {agency?.contactInfo && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">
                                  Contact Information - {agency.name}
                                </h5>
                                <div className="text-sm text-gray-700 space-y-1">
                                  {agency.contactInfo.hotline && (
                                    <div>Hotline: {agency.contactInfo.hotline}</div>
                                  )}
                                  {agency.contactInfo.email && (
                                    <div>Email: {agency.contactInfo.email}</div>
                                  )}
                                  {agency.contactInfo.address && (
                                    <div>Address: {agency.contactInfo.address}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Conditions/Decision points */}
                            {step.conditions && step.conditions.length > 0 && (
                              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <h5 className="text-sm font-medium text-yellow-800">
                                    Decision Points
                                  </h5>
                                </div>
                                {step.conditions.map((condition, condIndex) => (
                                  <div key={condIndex} className="text-sm text-yellow-700">
                                    If {condition.if}, then proceed to step {condition.then}
                                    {condition.else && `, otherwise go to step ${condition.else}`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Process Summary</h4>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-700">Total Duration</div>
              <div className="font-medium text-blue-900">
                {selectedPath
                  ? charter.paths.find(p => p.id === selectedPath)?.estimatedDuration
                  : charter.estimatedTotalDuration
                }
              </div>
            </div>
            <div>
              <div className="text-blue-700">Total Steps</div>
              <div className="font-medium text-blue-900">{orderedSteps.length}</div>
            </div>
            <div>
              <div className="text-blue-700">Estimated Cost</div>
              <div className="font-medium text-blue-900">
                {charter.estimatedTotalCost ? (
                  `₱${charter.estimatedTotalCost.min}${
                    charter.estimatedTotalCost.min !== charter.estimatedTotalCost.max
                      ? ` - ₱${charter.estimatedTotalCost.max}`
                      : ''
                  }`
                ) : 'Varies'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharterTimeline
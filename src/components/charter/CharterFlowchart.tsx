import React, { useState, useCallback } from 'react'
import {
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Building,
  ArrowRight,
  Info
} from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { CitizenCharter, CharterStep, CharterAgency } from '../../types/charter'

interface CharterFlowchartProps {
  charter: CitizenCharter
  completedSteps?: string[]
  currentStep?: string
  onStepClick?: (stepId: string) => void
}

const CharterFlowchart: React.FC<CharterFlowchartProps> = ({
  charter,
  completedSteps = [],
  currentStep,
  onStepClick
}) => {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  const getStepIcon = (type: CharterStep['type']) => {
    switch (type) {
      case 'process':
        return FileText
      case 'decision':
        return AlertCircle
      case 'document_submission':
        return FileText
      case 'payment':
        return DollarSign
      case 'wait':
        return Clock
      case 'external_agency':
        return Building
      default:
        return FileText
    }
  }

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-500 text-green-900'
      case 'current':
        return 'bg-blue-100 border-blue-500 text-blue-900'
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700'
    }
  }

  const getAgencyColor = (agencyId: string) => {
    const agency = charter.agencies.find(a => a.id === agencyId)
    return agency?.color || '#6b7280'
  }

  const formatDuration = (duration: CharterStep['duration']) => {
    const { min, max, unit } = duration
    if (min === max) {
      return `${min} ${unit}`
    }
    return `${min}-${max} ${unit}`
  }

  const handleStepClick = useCallback((stepId: string) => {
    setSelectedStep(stepId)
    onStepClick?.(stepId)
  }, [onStepClick])

  // Calculate SVG viewBox based on step positions
  const maxX = Math.max(...charter.steps.map(s => s.position.x)) + 200
  const maxY = Math.max(...charter.steps.map(s => s.position.y)) + 200

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {/* Charter Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Process Flowchart
          </h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {charter.estimatedTotalDuration}
            </div>
            {charter.estimatedTotalCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ₱{charter.estimatedTotalCost.min}
                {charter.estimatedTotalCost.min !== charter.estimatedTotalCost.max &&
                  ` - ₱${charter.estimatedTotalCost.max}`
                }
              </div>
            )}
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {charter.totalSteps} steps
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Agencies Involved</h4>
          <div className="flex flex-wrap gap-3">
            {charter.agencies.map(agency => (
              <div key={agency.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: agency.color }}
                />
                <span className="text-sm text-gray-700">{agency.shortName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flowchart */}
        <div className="relative overflow-x-auto">
          <svg
            width="100%"
            height="600"
            viewBox={`0 0 ${maxX} ${maxY}`}
            className="border rounded-lg bg-gray-50"
          >
            {/* Connection lines */}
            {charter.steps.map(step =>
              step.connections.map(connectionId => {
                const targetStep = charter.steps.find(s => s.id === connectionId)
                if (!targetStep) return null

                return (
                  <line
                    key={`${step.id}-${connectionId}`}
                    x1={step.position.x + 100}
                    y1={step.position.y + 40}
                    x2={targetStep.position.x}
                    y2={targetStep.position.y + 40}
                    stroke="#9ca3af"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })
            )}

            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#9ca3af"
                />
              </marker>
            </defs>

            {/* Step nodes */}
            {charter.steps.map(step => {
              const Icon = getStepIcon(step.type)
              const status = getStepStatus(step.id)
              const agencyColor = getAgencyColor(step.agency)

              return (
                <g key={step.id}>
                  {/* Step box */}
                  <foreignObject
                    x={step.position.x}
                    y={step.position.y}
                    width="180"
                    height="80"
                    className="cursor-pointer"
                    onClick={() => handleStepClick(step.id)}
                  >
                    <div className={`
                      h-full p-3 rounded-lg border-2 transition-all
                      ${getStatusColor(status)}
                      hover:shadow-md
                      ${selectedStep === step.id ? 'ring-2 ring-blue-500' : ''}
                    `}>
                      <div className="flex items-start gap-2">
                        <div
                          className="p-1 rounded"
                          style={{ backgroundColor: agencyColor, color: 'white' }}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatDuration(step.duration)}
                          </div>
                          {step.cost && (
                            <div className="text-xs text-green-600 mt-1">
                              ₱{step.cost.amount}
                            </div>
                          )}
                        </div>
                        {status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Step Details Panel */}
        {selectedStep && (
          <div className="mt-6">
            {(() => {
              const step = charter.steps.find(s => s.id === selectedStep)
              if (!step) return null

              const agency = charter.agencies.find(a => a.id === step.agency)

              return (
                <Card className="border-l-4" style={{ borderLeftColor: getAgencyColor(step.agency) }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      </div>
                      {agency && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {agency.shortName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDuration(step.duration)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Requirements</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {step.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Outputs</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {step.outputs.map((output, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {step.cost && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Cost: ₱{step.cost.amount}
                          </span>
                        </div>
                        {step.cost.description && (
                          <p className="text-sm text-yellow-700 mt-1">
                            {step.cost.description}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CharterFlowchart
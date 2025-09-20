import React, { useState } from 'react'
import {
  Check,
  Square,
  CheckSquare,
  Clock,
  DollarSign,
  Building,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Download
} from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import { CitizenCharter, CharterStep, CharterProgress } from '../../types/charter'

interface CharterChecklistProps {
  charter: CitizenCharter
  selectedPath?: string
  progress?: CharterProgress
  onStepToggle?: (stepId: string, completed: boolean) => void
  onAddNote?: (stepId: string, note: string) => void
}

const CharterChecklist: React.FC<CharterChecklistProps> = ({
  charter,
  selectedPath,
  progress,
  onStepToggle,
  onAddNote
}) => {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedRequirements, setExpandedRequirements] = useState<Record<string, boolean>>({})

  // Get steps for the selected path
  const pathSteps = selectedPath
    ? charter.paths.find(p => p.id === selectedPath)?.steps || []
    : charter.steps.map(s => s.id)

  const orderedSteps = pathSteps
    .map(stepId => charter.steps.find(s => s.id === stepId))
    .filter(Boolean) as CharterStep[]

  const completedSteps = progress?.completedSteps || []

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId)

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

  const handleStepToggle = (stepId: string) => {
    const newCompleted = !isStepCompleted(stepId)
    onStepToggle?.(stepId, newCompleted)
  }

  const handleNoteSubmit = (stepId: string) => {
    const note = notes[stepId]
    if (note?.trim()) {
      onAddNote?.(stepId, note.trim())
      setNotes(prev => ({ ...prev, [stepId]: '' }))
    }
  }

  const toggleRequirements = (stepId: string) => {
    setExpandedRequirements(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }

  const completedCount = orderedSteps.filter(step => isStepCompleted(step.id)).length
  const progressPercentage = (completedCount / orderedSteps.length) * 100

  const generateChecklist = () => {
    const checklistData = {
      charter: charter.title,
      path: selectedPath ? charter.paths.find(p => p.id === selectedPath)?.name : 'All Steps',
      steps: orderedSteps.map(step => ({
        title: step.title,
        agency: getAgency(step.agency)?.name || step.agency,
        duration: formatDuration(step.duration),
        cost: step.cost ? `₱${step.cost.amount}` : 'No cost',
        requirements: step.requirements,
        outputs: step.outputs,
        completed: isStepCompleted(step.id)
      })),
      progress: `${completedCount}/${orderedSteps.length} steps completed`
    }

    const blob = new Blob([JSON.stringify(checklistData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${charter.title.toLowerCase().replace(/\s+/g, '-')}-checklist.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Process Checklist
            </h3>
            <Button
              onClick={generateChecklist}
              className="flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              Export Checklist
            </Button>
          </div>

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
                    {path.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedCount} of {orderedSteps.length} steps completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pre-process General Requirements */}
        <Card className="mb-6 border-l-4 border-blue-500">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              General Requirements (Before Starting)
            </h4>
            <ul className="space-y-2">
              {charter.generalRequirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Steps Checklist */}
        <div className="space-y-4">
          {orderedSteps.map((step, index) => {
            const isCompleted = isStepCompleted(step.id)
            const agency = getAgency(step.agency)
            const requirementsExpanded = expandedRequirements[step.id]

            return (
              <Card
                key={step.id}
                className={`border-l-4 transition-all ${
                  isCompleted
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <CardContent className="p-4">
                  {/* Step Header */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleStepToggle(step.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-5 w-5 text-green-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-semibold ${
                            isCompleted ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            Step {index + 1}: {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
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

                      {/* Requirements Section */}
                      <div className="mt-3">
                        <button
                          onClick={() => toggleRequirements(step.id)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                          <FileText className="h-4 w-4" />
                          Requirements ({step.requirements.length})
                          <span className="text-xs text-gray-500">
                            {requirementsExpanded ? '(click to collapse)' : '(click to expand)'}
                          </span>
                        </button>

                        {requirementsExpanded && (
                          <div className="mt-2 pl-6">
                            <ul className="space-y-1">
                              {step.requirements.map((req, reqIndex) => (
                                <li key={reqIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                  <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Expected Outputs */}
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Expected Outputs:
                        </div>
                        <ul className="space-y-1 pl-6">
                          {step.outputs.map((output, outputIndex) => (
                            <li key={outputIndex} className="flex items-start gap-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Agency Contact Information */}
                      {agency?.contactInfo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            Contact Information - {agency.name}
                          </div>
                          <div className="space-y-1 text-sm text-gray-700">
                            {agency.contactInfo.hotline && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>Hotline: {agency.contactInfo.hotline}</span>
                              </div>
                            )}
                            {agency.contactInfo.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>Email: {agency.contactInfo.email}</span>
                              </div>
                            )}
                            {agency.contactInfo.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{agency.contactInfo.address}</span>
                              </div>
                            )}
                            {agency.website && (
                              <div className="flex items-center gap-2">
                                <ExternalLink className="h-3 w-3" />
                                <a
                                  href={agency.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Visit Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      <div className="mt-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a note for this step..."
                            value={notes[step.id] || ''}
                            onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleNoteSubmit(step.id)
                              }
                            }}
                          />
                          <Button
                            onClick={() => handleNoteSubmit(step.id)}
                            className="px-3 py-1 text-sm"
                          >
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Important Notes */}
        {charter.importantNotes.length > 0 && (
          <Card className="mt-6 border-l-4 border-yellow-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-yellow-800">
                Important Notes
              </h4>
              <ul className="space-y-2">
                {charter.importantNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Progress Summary</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-700">Completed Steps</div>
              <div className="font-medium text-blue-900">{completedCount} of {orderedSteps.length}</div>
            </div>
            <div>
              <div className="text-blue-700">Progress</div>
              <div className="font-medium text-blue-900">{Math.round(progressPercentage)}%</div>
            </div>
            <div>
              <div className="text-blue-700">Estimated Remaining</div>
              <div className="font-medium text-blue-900">
                {orderedSteps.length - completedCount} steps
              </div>
            </div>
            <div>
              <div className="text-blue-700">Last Updated</div>
              <div className="font-medium text-blue-900">
                {progress?.lastUpdated
                  ? new Date(progress.lastUpdated).toLocaleDateString()
                  : 'Not started'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharterChecklist
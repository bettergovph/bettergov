import React, { useState, useEffect } from 'react'
import {
  GitBranch,
  Clock,
  CheckSquare,
  BarChart3,
  FileText,
  Share2,
  Bookmark,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import Button from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import CharterFlowchart from './CharterFlowchart'
import CharterTimeline from './CharterTimeline'
import CharterChecklist from './CharterChecklist'
import { CitizenCharter, CharterViewMode, CharterProgress } from '../../types/charter'

interface CharterViewerProps {
  charter: CitizenCharter
  initialViewMode?: CharterViewMode
  onBack?: () => void
}

const CharterViewer: React.FC<CharterViewerProps> = ({
  charter,
  initialViewMode = 'overview',
  onBack
}) => {
  const [viewMode, setViewMode] = useState<CharterViewMode>(initialViewMode)
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [progress, setProgress] = useState<CharterProgress | null>(null)

  // Initialize progress from localStorage or create new
  useEffect(() => {
    const savedProgress = localStorage.getItem(`charter-progress-${charter.id}`)
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress))
    } else {
      const newProgress: CharterProgress = {
        charterId: charter.id,
        sessionId: `session-${Date.now()}`,
        currentStep: charter.steps[0]?.id || '',
        completedSteps: [],
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        selectedPath: charter.paths[0]?.id || '',
        notes: []
      }
      setProgress(newProgress)
    }
  }, [charter.id, charter.steps, charter.paths])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (progress) {
      localStorage.setItem(`charter-progress-${charter.id}`, JSON.stringify(progress))
    }
  }, [progress, charter.id])

  const handleStepToggle = (stepId: string, completed: boolean) => {
    if (!progress) return

    const newProgress = { ...progress }
    if (completed) {
      if (!newProgress.completedSteps.includes(stepId)) {
        newProgress.completedSteps.push(stepId)
      }
    } else {
      newProgress.completedSteps = newProgress.completedSteps.filter(id => id !== stepId)
    }
    newProgress.lastUpdated = new Date().toISOString()

    setProgress(newProgress)
  }

  const handleStepClick = (stepId: string) => {
    if (!progress) return

    const newProgress = { ...progress }
    newProgress.currentStep = stepId
    newProgress.lastUpdated = new Date().toISOString()

    setProgress(newProgress)
  }

  const handleAddNote = (stepId: string, note: string) => {
    if (!progress) return

    const newProgress = { ...progress }
    if (!newProgress.notes) newProgress.notes = []
    newProgress.notes.push(`${stepId}: ${note}`)
    newProgress.lastUpdated = new Date().toISOString()

    setProgress(newProgress)
  }

  const handlePathChange = (pathId: string) => {
    setSelectedPath(pathId)
    if (progress) {
      const newProgress = { ...progress }
      newProgress.selectedPath = pathId
      setProgress(newProgress)
    }
  }

  const shareCharter = async () => {
    const shareData = {
      title: charter.title,
      text: `Check out this government service guide: ${charter.title}`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const bookmarkCharter = () => {
    const bookmarks = JSON.parse(localStorage.getItem('charter-bookmarks') || '[]')
    if (!bookmarks.includes(charter.id)) {
      bookmarks.push(charter.id)
      localStorage.setItem('charter-bookmarks', JSON.stringify(bookmarks))
      alert('Charter bookmarked!')
    } else {
      alert('Charter already bookmarked!')
    }
  }

  const getViewModeIcon = (mode: CharterViewMode) => {
    switch (mode) {
      case 'overview':
        return BarChart3
      case 'flowchart':
        return GitBranch
      case 'timeline':
        return Clock
      case 'checklist':
        return CheckSquare
    }
  }

  const viewModes: { id: CharterViewMode; label: string; description: string }[] = [
    { id: 'overview', label: 'Overview', description: 'Summary and key information' },
    { id: 'flowchart', label: 'Flowchart', description: 'Visual process diagram' },
    { id: 'timeline', label: 'Timeline', description: 'Step-by-step timeline' },
    { id: 'checklist', label: 'Checklist', description: 'Interactive progress tracking' }
  ]

  const completedSteps = progress?.completedSteps.length || 0
  const totalSteps = charter.totalSteps
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {charter.title}
                </h1>
                <p className="text-gray-600 mt-1">{charter.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={shareCharter}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={bookmarkCharter}
                className="flex items-center gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Bookmark
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && completedSteps > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Your Progress</span>
                <span>{completedSteps} of {totalSteps} steps completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="font-semibold text-gray-900">{charter.estimatedTotalDuration}</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-500">Total Steps</div>
              <div className="font-semibold text-gray-900">{charter.totalSteps}</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-500">Agencies</div>
              <div className="font-semibold text-gray-900">{charter.agencies.length}</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-500">Difficulty</div>
              <div className={`font-semibold capitalize ${
                charter.difficulty === 'easy' ? 'text-green-600' :
                charter.difficulty === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {charter.difficulty}
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {viewModes.map(mode => {
              const Icon = getViewModeIcon(mode.id)
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                    ${viewMode === mode.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {viewMode === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
                  <p className="text-gray-700 mb-6">{charter.overview}</p>

                  {/* Paths */}
                  {charter.paths.length > 1 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Available Paths</h3>
                      <div className="space-y-3">
                        {charter.paths.map(path => (
                          <div
                            key={path.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedPath === path.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => handlePathChange(path.id)}
                          >
                            <div className="font-medium text-gray-900">{path.name}</div>
                            <div className="text-sm text-gray-600">{path.description}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Duration: {path.estimatedDuration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Notes */}
                  {charter.importantNotes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Important Notes</h3>
                      <ul className="space-y-2">
                        {charter.importantNotes.map((note, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button
                      onClick={() => setViewMode('checklist')}
                      className="flex items-center gap-2 justify-center p-4"
                    >
                      <CheckSquare className="h-5 w-5" />
                      Start Checklist
                    </Button>
                    <Button
                      onClick={() => setViewMode('flowchart')}
                      className="flex items-center gap-2 justify-center p-4"
                    >
                      <GitBranch className="h-5 w-5" />
                      View Flowchart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Agencies */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Involved Agencies</h3>
                  <div className="space-y-3">
                    {charter.agencies.map(agency => (
                      <div key={agency.id} className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5"
                          style={{ backgroundColor: agency.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {agency.name}
                          </div>
                          {agency.website && (
                            <a
                              href={agency.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Meta Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Information</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-500">Category</div>
                      <div className="text-gray-900">{charter.category}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Updated</div>
                      <div className="text-gray-900">
                        {new Date(charter.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Version</div>
                      <div className="text-gray-900">{charter.version}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {viewMode === 'flowchart' && (
          <CharterFlowchart
            charter={charter}
            completedSteps={progress?.completedSteps}
            currentStep={progress?.currentStep}
            onStepClick={handleStepClick}
          />
        )}

        {viewMode === 'timeline' && (
          <CharterTimeline
            charter={charter}
            selectedPath={selectedPath}
            completedSteps={progress?.completedSteps}
            currentStep={progress?.currentStep}
            onStepClick={handleStepClick}
          />
        )}

        {viewMode === 'checklist' && (
          <CharterChecklist
            charter={charter}
            selectedPath={selectedPath}
            progress={progress || undefined}
            onStepToggle={handleStepToggle}
            onAddNote={handleAddNote}
          />
        )}
      </div>
    </div>
  )
}

export default CharterViewer
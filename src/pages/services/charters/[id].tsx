import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import CharterViewer from '../../../components/charter/CharterViewer'
import { CitizenCharter } from '../../../types/charter'
import { getCharterById } from '../../../data/charters'

const CharterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [charter, setCharter] = useState<CitizenCharter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCharter = async () => {
      if (!id) {
        setError('Charter ID not provided')
        setLoading(false)
        return
      }

      try {
        // Get charter by ID using utility function
        const charterData = getCharterById(id)

        if (!charterData) {
          setError('Charter not found')
          setLoading(false)
          return
        }

        setCharter(charterData)
        setLoading(false)
      } catch (err) {
        setError('Failed to load charter')
        setLoading(false)
      }
    }

    loadCharter()
  }, [id])

  const handleBack = () => {
    navigate('/services/charters')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading charter...</p>
        </div>
      </div>
    )
  }

  if (error || !charter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Charter Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'Charter not found'
              ? 'The charter you\'re looking for doesn\'t exist or may have been moved.'
              : 'There was a problem loading the charter. Please try again.'
            }
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Charters
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{charter.title} | Citizen's Charter | BetterGov.ph</title>
        <meta name="description" content={charter.description} />
        <meta
          name="keywords"
          content={`${charter.tags.join(', ')}, citizen charter, government process, philippines`}
        />

        {/* Open Graph / Social */}
        <meta property="og:title" content={`${charter.title} | Citizen's Charter`} />
        <meta property="og:description" content={charter.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />

        {/* Additional meta for charter-specific info */}
        <meta name="charter:duration" content={charter.estimatedTotalDuration} />
        <meta name="charter:steps" content={charter.totalSteps.toString()} />
        <meta name="charter:difficulty" content={charter.difficulty} />
        <meta name="charter:category" content={charter.category} />
      </Helmet>

      <CharterViewer
        charter={charter}
        initialViewMode="overview"
        onBack={handleBack}
      />
    </>
  )
}

export default CharterDetailPage
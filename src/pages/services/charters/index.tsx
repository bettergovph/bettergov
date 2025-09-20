import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Building,
  Star,
  BookOpen,
  Zap,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/Card'
import SearchInput from '../../../components/ui/SearchInput'
import Button from '../../../components/ui/Button'
import { Helmet } from 'react-helmet-async'

import { CitizenCharter } from '../../../types/charter'
import { getAllCharters } from '../../../data/charters'

// Get all available charters
const charters: CitizenCharter[] = getAllCharters()

const ChartersIndexPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')

  // Extract categories from charters
  const categories = useMemo(() => {
    const cats = new Set(charters.map(c => c.category))
    return Array.from(cats).sort()
  }, [])

  const filteredCharters = useMemo(() => {
    let filtered = charters

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(charter =>
        charter.title.toLowerCase().includes(query) ||
        charter.description.toLowerCase().includes(query) ||
        charter.category.toLowerCase().includes(query) ||
        charter.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(charter => charter.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(charter => charter.difficulty === selectedDifficulty)
    }

    return filtered
  }, [searchQuery, selectedCategory, selectedDifficulty])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'complex':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return Zap
      case 'medium':
        return Clock
      case 'complex':
        return AlertTriangle
      default:
        return BookOpen
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const getBookmarkedCharters = () => {
    try {
      return JSON.parse(localStorage.getItem('charter-bookmarks') || '[]')
    } catch {
      return []
    }
  }

  const bookmarkedCharters = getBookmarkedCharters()

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Citizen's Charters | BetterGov.ph</title>
        <meta
          name="description"
          content="Interactive visual guides for Philippine government services. Step-by-step processes, timelines, and requirements made easy to understand."
        />
        <meta
          name="keywords"
          content="citizen charter, government process, philippines, visual guide, service timeline"
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Citizen's Charters
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Visual, step-by-step guides for government services. Understand processes,
            timelines, requirements, and track your progress with interactive charters.
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {charters.length}
              </div>
              <div className="text-sm text-gray-600">Available Charters</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Service Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {charters.reduce((acc, c) => acc + c.agencies.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Government Agencies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {bookmarkedCharters.length}
              </div>
              <div className="text-sm text-gray-600">Your Bookmarks</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                placeholder="Search charters by name, category, or tags..."
                onSearch={handleSearch}
                icon={<Search className="h-5 w-5 text-gray-400" />}
                size="md"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedDifficulty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  Difficulty: {selectedDifficulty}
                  <button
                    onClick={() => setSelectedDifficulty('all')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Charters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCharters.map(charter => {
            const DifficultyIcon = getDifficultyIcon(charter.difficulty)
            const isBookmarked = bookmarkedCharters.includes(charter.id)

            return (
              <Card key={charter.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {charter.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {charter.description}
                      </p>
                    </div>
                    {isBookmarked && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current ml-2 flex-shrink-0" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {charter.estimatedTotalDuration}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Building className="h-4 w-4" />
                        {charter.agencies.length} agencies
                      </div>
                    </div>

                    {charter.estimatedTotalCost && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <DollarSign className="h-4 w-4" />
                        ₱{charter.estimatedTotalCost.min}
                        {charter.estimatedTotalCost.min !== charter.estimatedTotalCost.max &&
                          ` - ₱${charter.estimatedTotalCost.max}`
                        }
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{charter.totalSteps} steps</span>
                      <div className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${getDifficultyColor(charter.difficulty)}
                      `}>
                        <DifficultyIcon className="h-3 w-3" />
                        {charter.difficulty}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {charter.category}
                    </span>
                  </div>

                  {/* Tags */}
                  {charter.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {charter.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {charter.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{charter.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link to={`/services/charters/${charter.id}`}>
                    <Button className="w-full flex items-center justify-center gap-2">
                      View Charter
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* No Results */}
        {filteredCharters.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No charters found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all available charters.
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedDifficulty('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            How to Use Citizen's Charters
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">1. Choose Your Service</h3>
              <p className="text-blue-700">
                Browse or search for the government service you need. Each charter
                provides a complete visual guide for the process.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">2. Follow the Process</h3>
              <p className="text-blue-700">
                Use flowcharts, timelines, or checklists to understand requirements,
                steps, and expected timelines for your service.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">3. Track Progress</h3>
              <p className="text-blue-700">
                Mark completed steps, add notes, and track your progress through
                the entire process with our interactive tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartersIndexPage
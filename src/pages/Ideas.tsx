import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Lightbulb,
  Users,
  Star,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Github,
  Plus,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

interface ProjectIdea {
  id: string
  title: string
  description: string
  category: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  complexity: 'simple' | 'moderate' | 'complex'
  upvotes: number
  downvotes: number
}

const initialProjectIdeas: ProjectIdea[] = [
  {
    id: '1',
    title: 'Blockchain powered community government project reporting app',
    description:
      'A transparent, immutable platform where citizens can report and track government projects in their communities. Uses blockchain technology to ensure data integrity and prevent tampering with project reports and progress updates.',
    category: 'Transparency & Accountability',
    icon: <TrendingUp className="h-6 w-6" />,
    priority: 'high',
    complexity: 'complex',
    upvotes: 42,
    downvotes: 3,
  },
  {
    id: '2',
    title: 'Glassdoor for government agencies',
    description:
      'An anonymous review platform where government employees and citizens can rate and review government agencies, departments, and services. Provides insights into workplace culture, service quality, and areas for improvement.',
    category: 'Public Feedback',
    icon: <Star className="h-6 w-6" />,
    priority: 'high',
    complexity: 'moderate',
    upvotes: 38,
    downvotes: 7,
  },
  {
    id: '3',
    title: 'Design guidelines for Bettergov.ph',
    description:
      'Comprehensive design system and guidelines for the BetterGov.ph platform. Includes UI components, color schemes, typography, accessibility standards, and best practices for government web services.',
    category: 'Platform Development',
    icon: <Lightbulb className="h-6 w-6" />,
    priority: 'medium',
    complexity: 'simple',
    upvotes: 25,
    downvotes: 2,
  },
  {
    id: '4',
    title: 'Rate the politicians',
    description:
      'A citizen-driven platform to rate and review elected officials based on their performance, campaign promises, voting records, and public service delivery. Includes fact-checking and transparency features.',
    category: 'Political Accountability',
    icon: <Users className="h-6 w-6" />,
    priority: 'high',
    complexity: 'moderate',
    upvotes: 56,
    downvotes: 12,
  },
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'simple':
      return 'bg-blue-100 text-blue-800'
    case 'moderate':
      return 'bg-purple-100 text-purple-800'
    case 'complex':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const Ideas: React.FC = () => {
  const [projectIdeas, setProjectIdeas] =
    useState<ProjectIdea[]>(initialProjectIdeas)
  const [userVotes, setUserVotes] = useState<
    Record<string, 'up' | 'down' | null>
  >({})

  const handleVote = (ideaId: string, voteType: 'up' | 'down') => {
    const currentVote = userVotes[ideaId]

    setProjectIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === ideaId) {
          let newUpvotes = idea.upvotes
          let newDownvotes = idea.downvotes

          // Remove previous vote if exists
          if (currentVote === 'up') {
            newUpvotes--
          } else if (currentVote === 'down') {
            newDownvotes--
          }

          // Add new vote if different from current
          if (currentVote !== voteType) {
            if (voteType === 'up') {
              newUpvotes++
            } else {
              newDownvotes++
            }
          }

          return {
            ...idea,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
          }
        }
        return idea
      })
    )

    // Update user vote state
    setUserVotes((prev) => ({
      ...prev,
      [ideaId]: currentVote === voteType ? null : voteType,
    }))
  }

  const handleSubmitIdea = () => {
    const githubUrl =
      'https://github.com/bettergovph/bettergov/issues/new?assignees=&labels=enhancement%2Cidea&projects=&template=idea-submission.md&title=%5BIDEA%5D+'
    window.open(githubUrl, '_blank')
  }

  const handleSubmitPR = () => {
    const githubUrl = 'https://github.com/bettergovph/bettergov/contribute'
    window.open(githubUrl, '_blank')
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Project Ideas | BetterGov.ph</title>
        <meta
          name="description"
          content="Explore innovative project ideas to improve government transparency, accountability, and citizen engagement in the Philippines."
        />
        <meta
          name="keywords"
          content="government projects, civic tech, transparency, accountability, Philippines, innovation"
        />
        <link rel="canonical" href="https://bettergov.ph/ideas" />

        {/* Open Graph / Social */}
        <meta property="og:title" content="Project Ideas | BetterGov.ph" />
        <meta
          property="og:description"
          content="Explore innovative project ideas to improve government transparency, accountability, and citizen engagement in the Philippines."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bettergov.ph/ideas" />
        <meta property="og:image" content="https://bettergov.ph/ph-logo.png" />
      </Helmet>

      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
              <Lightbulb className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Project Ideas
            </h1>
          </div>
          <p className="text-sm md:text-lg text-gray-800 max-w-3xl mx-auto">
            Innovative concepts to enhance government transparency,
            accountability, and citizen engagement. These ideas aim to bridge
            the gap between citizens and government through technology and
            better design.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 md:mb-12">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-primary-600">
              {projectIdeas.length}
            </div>
            <div className="text-sm text-gray-600">Total Ideas</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {projectIdeas.filter((idea) => idea.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(projectIdeas.map((idea) => idea.category)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {
                projectIdeas.filter((idea) => idea.complexity === 'simple')
                  .length
              }
            </div>
            <div className="text-sm text-gray-600">Simple Projects</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {projectIdeas.reduce((sum, idea) => sum + idea.upvotes, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
        </div>

        {/* Submit New Idea Button */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmitIdea}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <Github className="h-5 w-5 mr-2" />
              Submit Idea
            </button>
            <button
              onClick={handleSubmitPR}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Contribute a Pull Request
            </button>
          </div>
        </div>

        {/* Project Ideas List */}
        <main>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            All Project Ideas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectIdeas
              .sort(
                (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
              )
              .map((idea) => (
                <Card key={idea.id} hoverable className="bg-white h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-600 mr-3">
                          {idea.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {idea.title}
                          </h3>
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {idea.category}
                          </span>
                        </div>
                      </div>

                      {/* Voting Buttons */}
                      {/* <div className="flex flex-col items-center ml-4">
                        <button
                          onClick={() => handleVote(idea.id, 'up')}
                          className={`p-1 rounded transition-colors ${
                            userVotes[idea.id] === 'up'
                              ? 'bg-green-100 text-green-600'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          aria-label={`Upvote ${idea.title}`}
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 py-1">
                          {idea.upvotes - idea.downvotes}
                        </span>
                        <button
                          onClick={() => handleVote(idea.id, 'down')}
                          className={`p-1 rounded transition-colors ${
                            userVotes[idea.id] === 'down'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          aria-label={`Downvote ${idea.title}`}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      </div> */}
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getPriorityColor(
                          idea.priority
                        )}`}
                      >
                        {idea.priority.charAt(0).toUpperCase() +
                          idea.priority.slice(1)}{' '}
                        Priority
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getComplexityColor(
                          idea.complexity
                        )}`}
                      >
                        {idea.complexity.charAt(0).toUpperCase() +
                          idea.complexity.slice(1)}{' '}
                        Complexity
                      </span>
                    </div>

                    {/* <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <ChevronUp className="h-4 w-4 text-green-500 mr-1" />
                          {idea.upvotes}
                        </span>
                        <span className="flex items-center">
                          <ChevronDown className="h-4 w-4 text-red-500 mr-1" />
                          {idea.downvotes}
                        </span>
                      </div>
                      <span className="font-medium">
                        Score: {idea.upvotes - idea.downvotes}
                      </span>
                    </div> */}
                  </CardContent>
                </Card>
              ))}
          </div>
        </main>

        {/* Call to Action */}
        <section className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Have an Idea?
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            We're always looking for innovative ways to improve government
            services and citizen engagement. Submit your ideas via GitHub or
            learn more about our mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSubmitIdea}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <Github className="h-5 w-5 mr-2" />
              Submit via GitHub
            </button>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Learn More About Us
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Ideas

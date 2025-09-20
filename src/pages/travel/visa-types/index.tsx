import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  Compass,
  FileText,
  Plane,
  Search,
  Users,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import React from "react"
import { Link } from "react-router-dom"
import visaData from "../../../data/visa/philippines_visa_types.json"
import { VisaType } from "../../../types/visa"

interface VisaCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  visaTypes: VisaType[] | any[]
}

const VisaTypesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault("")
  )
  const [selectedCategory, setSelectedCategory] = useQueryState(
    "category",
    parseAsString.withDefault("non-immigrant")
  )

  // Use the categories from the consolidated JSON file
  const visaCategories: VisaCategory[] = visaData.categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    icon: getCategoryIcon(category.id),
    visaTypes: category.visaTypes,
  }))

  // Helper function to get the appropriate icon for each category
  function getCategoryIcon(categoryId: string) {
    switch (categoryId) {
      case "immigrant":
        return <Users size={24} />
      case "non-immigrant":
        return <Plane size={24} />
      case "special":
        return <Briefcase size={24} />
      case "permits":
        return <FileText size={24} />
      default:
        return <Compass size={24} />
    }
  }

  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  // Filter visa types based on search term
  const filteredCategories =
    searchTerm.trim() === ""
      ? visaCategories
      : visaCategories
          .map(category => ({
            ...category,
            visaTypes: category.visaTypes.filter(
              visa =>
                visa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visa.description
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            ),
          }))
          .filter(category => category.visaTypes.length > 0)

  // Get all visa types across categories for search results display
  const allVisaTypes =
    searchTerm.trim() !== ""
      ? filteredCategories.flatMap(category => category.visaTypes)
      : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Philippines Visa Types
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Explore different types of visas available for travel to the
            Philippines
          </p>

          {/* Search Box */}
          <div className="max-w-lg bg-white rounded-lg shadow-md flex items-center p-2">
            <Search className="h-5 w-5 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search visa types..."
              className="flex-1 p-2 outline-none text-gray-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Search Results Display */}
        {searchTerm.trim() !== "" && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Showing results for: "{searchTerm}"
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allVisaTypes.map((visa: any) => (
                <Link
                  to={`/travel/visa-types/${visa.id}`}
                  key={visa.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center justify-between">
                      {visa.name}
                      <ChevronRight className="h-5 w-5 text-blue-500" />
                    </h3>
                    <p className="text-gray-800 text-sm mb-3 line-clamp-2">
                      {visa.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content with Sidebar */}
        {(searchTerm.trim() === "" || filteredCategories.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-lg text-gray-800">
                    Visa Categories
                  </h2>
                </div>
                <nav className="p-2">
                  {visaCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full text-left flex items-center p-3 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-3">{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {filteredCategories.map(
                category =>
                  (searchTerm.trim() !== "" ||
                    category.id === selectedCategory) && (
                    <div key={category.id} className="mb-8">
                      <div className="flex items-center mb-4">
                        <span className="mr-2">{category.icon}</span>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {category.name}
                        </h2>
                      </div>
                      <p className="text-gray-800 mb-6">
                        {category.description}
                      </p>

                      {/* Visa Types Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.visaTypes.map((visa: any) => (
                          <Link
                            to={`/travel/visa-types/${visa.id}`}
                            key={visa.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="p-4">
                              <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center justify-between">
                                {visa.name}
                                <ChevronRight className="h-5 w-5 text-blue-500" />
                              </h3>
                              <p className="text-gray-800 text-sm mb-3">
                                {visa.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800">Important Notice</h3>
              <p className="text-sm text-blue-700 mt-1">
                This information is provided for reference only. For the most
                accurate and up-to-date visa requirements, please consult the
                official{" "}
                <a
                  href="https://immigration.gov.ph/visas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  Philippine Bureau of Immigration
                </a>{" "}
                or{" "}
                <a
                  href="https://dfa.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  Department of Foreign Affairs
                </a>{" "}
                website.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Last updated: {visaData.sourceInfo.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisaTypesPage

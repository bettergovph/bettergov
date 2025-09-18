import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Users, Filter, ChevronRight, Globe } from 'lucide-react';
import SEO from '../../../components/SEO';
import Button from '../../../components/ui/Button';
import destinationsData from '../../../data/destinations/index.json';

// Define destination types
type DestinationType = 'beach' | 'mountain' | 'city' | 'cultural' | 'island' | 'all';

interface Destination {
  id: string;
  name: string;
  location: string;
  shortDescription: string;
  type: string;
  rating: number;
  featuredImageUrl: string;
  imageCredit: string;
  tags: string[];
}

const TravelDestinationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<DestinationType>('all');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  // Load destinations data
  useEffect(() => {
    setDestinations(destinationsData.destinations);
    setLoading(false);
  }, []);

  // Filter destinations based on search term and selected type
  const filteredDestinations = destinations.filter(destination => {
    const matchesSearch = 
      destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || destination.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Top Travel Destinations in the Philippines"
        description="Discover the most beautiful and exciting travel destinations across the Philippines, from pristine beaches to historic cities and natural wonders."
        keywords={["Philippines travel", "Philippine destinations", "Boracay", "Palawan", "Siargao", "Philippine tourism"]}
      />
      
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1551966775-a4ddc8df052b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
            alt="Beautiful Philippine beach" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
        </div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Discover the Philippines
              </h1>
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                Explore breathtaking beaches, historic cities, and natural wonders across the 7,641 islands of the Philippine archipelago.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  leftIcon={<MapPin className="h-4 w-4" />}
                >
                  Explore Destinations
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white/10"
                >
                  Travel Guides
                </Button>
              </div>
              <p className="text-xs text-white/70 mt-4">
                Photo by <a href="https://unsplash.com/@seanoulashin" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">Sean Oulashin</a> on Unsplash
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 -mt-16 relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations, activities, or locations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DestinationType)}
                >
                  <option value="all">All Destinations</option>
                  <option value="beach">Beaches</option>
                  <option value="island">Islands</option>
                  <option value="mountain">Mountains</option>
                  <option value="city">Cities</option>
                  <option value="cultural">Cultural Sites</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Destinations Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedType === 'all' 
              ? 'Top Destinations in the Philippines' 
              : `Top ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Destinations`}
          </h2>
          <p className="text-lg text-gray-600">
            {filteredDestinations.length} amazing places to explore
          </p>
        </div>

        {filteredDestinations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-4 inline-block mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No destinations found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We couldn't find any destinations matching your search criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDestinations.map((destination) => (
              <Link 
                key={destination.id} 
                to={`/travel/destinations/${destination.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={destination.featuredImageUrl} 
                      alt={destination.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
                          <div className="flex items-center text-white/90">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{destination.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-white">{destination.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col">
                    <p className="text-gray-600 mb-4 flex-grow">{destination.shortDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {destination.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {tag}
                        </span>
                      ))}
                      {destination.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                          +{destination.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Best time: {destination.bestTimeToVisit}</span>
                      </div>
                      <div className="flex items-center text-blue-600 font-medium group-hover:underline">
                        <span>View Details</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Travel Tips Section */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Travel Tips for the Philippines</h2>
            <p className="text-lg text-gray-600">
              Make the most of your Philippine adventure with these essential travel tips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Time to Visit</h3>
              <p className="text-gray-600">
                The dry season (November to April) is generally the best time to visit the Philippines. 
                Avoid the typhoon season from June to September if possible.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Local Customs</h3>
              <p className="text-gray-600">
                Filipinos are known for their hospitality. Respect local customs, dress modestly when visiting religious sites, 
                and always ask permission before taking photos of people.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Getting Around</h3>
              <p className="text-gray-600">
                Island hopping requires planning. Domestic flights connect major islands, while ferries, jeepneys, 
                and tricycles are common for shorter distances.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to explore the Philippines?</h2>
              <p className="text-white/90 mb-6">
                Plan your perfect Philippine adventure with our comprehensive travel guides and resources.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Plan Your Trip
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                >
                  View Travel Guides
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative min-h-[300px]">
              <img 
                src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80" 
                alt="Philippine island" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 text-xs text-white/70">
                Photo by <a href="https://unsplash.com/@cristagupa" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">Cris Tagupa</a> on Unsplash
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelDestinationsPage;
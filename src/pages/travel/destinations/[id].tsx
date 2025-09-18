import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Star, Clock, Users, ArrowLeft, ExternalLink, Heart, Share2, Bookmark, Activity } from 'lucide-react';
import Button from '../../../components/ui/Button';
import SEO from '../../../components/SEO';
import destinationsIndex from '../../../data/destinations/index.json';

interface Destination {
  id: string;
  name: string;
  location: string;
  description: string;
  type: string;
  rating: number;
  imageUrl: string;
  imageCredit: string;
  bestTimeToVisit: string;
  activities: string[];
  tags: string[];
  longDescription?: string;
  howToGetThere?: string;
  whereToStay?: string[];
  nearbyAttractions?: string[];
  localCuisine?: string[];
  travelTips?: string[];
  gallery?: {url: string, caption: string, credit: string}[];
}

const DestinationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedDestinations, setRelatedDestinations] = useState<any[]>([]);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the specific destination data
        const response = await fetch(`/src/data/destinations/${id}.json`);
        if (!response.ok) {
          throw new Error('Destination not found');
        }
        
        const data = await response.json();
        setDestination(data);
        
        // Find related destinations of the same type
        const allDestinations = destinationsIndex.destinations;
        const related = allDestinations
          .filter(d => d.id !== id && d.type === data.type)
          .slice(0, 3);
        
        setRelatedDestinations(related);
      } catch (err) {
        console.error('Error fetching destination:', err);
        setError(err instanceof Error ? err.message : 'Failed to load destination');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDestination();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Destination Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the destination you're looking for. It may have been removed or you might have followed a broken link.
            </p>
            <Link to="/travel/destinations">
              <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to All Destinations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare gallery images, using main image as first if no gallery provided
  const galleryImages = destination.gallery || [
    {
      url: destination.imageUrl,
      caption: destination.name,
      credit: destination.imageCredit
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={`${destination.name} - Philippine Travel Destination`}
        description={destination.description}
        keywords={[destination.name, destination.location, "Philippines travel", ...destination.tags]}
        ogImage={destination.imageUrl}
      />
      
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={destination.imageUrl} 
            alt={destination.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="absolute top-4 left-4 z-10">
          <Link to="/travel/destinations" className="flex items-center text-white bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Destinations</span>
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
            <Heart className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <div className="max-w-4xl">
              <div className="inline-flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                <span className="capitalize">{destination.type}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {destination.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{destination.location}, Philippines</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span>{destination.rating} rating</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-1" />
                  <span>Best time: {destination.bestTimeToVisit}</span>
                </div>
              </div>
              <p className="text-xs text-white/70">
                Photo by <a href={`https://unsplash.com/@${destination.imageCredit.toLowerCase().replace(/\s+/g, '')}`} className="underline hover:text-white\" target="_blank\" rel="noopener noreferrer">{destination.imageCredit}</a> on Unsplash
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">About {destination.name}</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {destination.longDescription || destination.description}
                </p>

                {/* Activities Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Top Activities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {destination.activities.map((activity, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to Get There */}
                {destination.howToGetThere && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Get There</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed">
                      {destination.howToGetThere}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h3>
                  <div className="relative">
                    <div className="relative h-80 rounded-lg overflow-hidden mb-2">
                      <img 
                        src={galleryImages[activeImageIndex].url} 
                        alt={galleryImages[activeImageIndex].caption} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm">{galleryImages[activeImageIndex].caption}</p>
                        <p className="text-white/70 text-xs">
                          Photo by {galleryImages[activeImageIndex].credit} on Unsplash
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {galleryImages.map((image, index) => (
                        <button 
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${index === activeImageIndex ? 'ring-2 ring-blue-500' : 'opacity-70'}`}
                        >
                          <img 
                            src={image.url} 
                            alt={`Thumbnail ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Travel Tips */}
                {destination.travelTips && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Travel Tips</h3>
                    <ul className="space-y-2">
                      {destination.travelTips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900">{destination.location}, Philippines</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Best Time to Visit</p>
                      <p className="text-gray-900">{destination.bestTimeToVisit}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recommended Stay</p>
                      <p className="text-gray-900">3-5 days</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ideal For</p>
                      <p className="text-gray-900">
                        {destination.type === 'beach' && 'Beach lovers, couples, families'}
                        {destination.type === 'mountain' && 'Hikers, nature enthusiasts, photographers'}
                        {destination.type === 'city' && 'Urban explorers, history buffs, foodies'}
                        {destination.type === 'cultural' && 'Culture seekers, history enthusiasts, photographers'}
                        {destination.type === 'island' && 'Island hoppers, divers, nature lovers'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Where to Stay */}
            {destination.whereToStay && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Where to Stay</h3>
                  <ul className="space-y-3">
                    {destination.whereToStay.map((accommodation, index) => (
                      <li key={index} className="text-gray-700">
                        {accommodation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Nearby Attractions */}
            {destination.nearbyAttractions && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Nearby Attractions</h3>
                  <ul className="space-y-2">
                    {destination.nearbyAttractions.map((attraction, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                        <span className="text-gray-700">{attraction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Local Cuisine */}
            {destination.localCuisine && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Local Cuisine</h3>
                  <ul className="space-y-2">
                    {destination.localCuisine.map((dish, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                        <span className="text-gray-700">{dish}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Destinations */}
        {relatedDestinations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDestinations.map(relatedDest => (
                <Link 
                  key={relatedDest.id} 
                  to={`/travel/destinations/${relatedDest.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={relatedDest.featuredImageUrl} 
                        alt={relatedDest.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-lg font-bold text-white">{relatedDest.name}</h3>
                        <div className="flex items-center text-white/90">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{relatedDest.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 text-sm line-clamp-2">{relatedDest.shortDescription}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{relatedDest.rating}</span>
                        </div>
                        <span className="text-sm text-blue-600 group-hover:underline">View Details</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 md:p-8">
          <div className="md:flex items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to explore {destination.name}?</h3>
              <p className="text-gray-600">Plan your trip with our comprehensive travel guides and resources.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button>
                Plan Your Trip
              </Button>
              <Button variant="outline">
                View Travel Guide
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;
import React from "react";
import { Clock, Flag, Crown, Scale, Star } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";

const PhilippinesHistory: React.FC = () => {
  const timelinePeriods = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Pre-Colonial Period",
      period: "Before 1521",
      description:
        "Indigenous peoples with advanced societies, trade networks, and rich cultures",
      image: "/assets/history/pre-colonial-period.webp",
    },
    {
      icon: <Crown className="h-6 w-6" />,
      title: "Spanish Colonial Era",
      period: "1521-1898",
      description:
        "Over 300 years of Spanish rule, introducing Christianity and colonial institutions",
      image: "/assets/history/spanish-colonial-era.webp",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "American Period",
      period: "1898-1946",
      description:
        "American administration, introducing modern education and democratic institutions",
      image: "/assets/history/american-period.webp",
    },
    {
      icon: <Flag className="h-6 w-6" />,
      title: "Independence and Modern Era",
      period: "1946-Present",
      description:
        "Independent republic facing challenges and achievements in nation-building",
      image: "/assets/history/independence-modern-era.webp",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/19376770/pexels-photo-19376770/free-photo-of-women-dancing-in-red-traditional-clothing-in-festival.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Historical Philippines"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                History of the Philippines
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Journey through time and discover the rich tapestry of events,
                people, and movements that shaped the Philippine nation.
              </p>
              <p className="text-xs">
                <a href="https://www.pexels.com/photo/women-dancing-in-red-traditional-clothing-in-festival-19376770/">
                  Photo credit
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Historical Timeline
              </h2>
              <div className="space-y-8">
                {timelinePeriods.map((period, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                          {period.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {period.title}
                            </h3>
                            <span className="text-sm font-medium text-primary-600">
                              {period.period}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-4">
                            {period.description}
                          </p>
                          <img
                            src={period.image}
                            alt={period.title}
                            className="w-full max-h-64 object-cover object-center rounded-lg"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Historical Overview
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed mb-4">
                  The Philippines' history spans thousands of years, beginning
                  with the migration of Austronesian peoples. These early
                  settlers developed sophisticated societies, trading with
                  various Asian civilizations and developing unique cultural
                  traditions.
                </p>
                <p className="text-gray-800 leading-relaxed mb-4">
                  The arrival of Ferdinand Magellan in 1521 marked the beginning
                  of Spanish colonization, which would last for over three
                  centuries. This period saw the widespread adoption of
                  Christianity and the establishment of colonial institutions
                  that would significantly influence Filipino society.
                </p>
                <p className="text-gray-800 leading-relaxed">
                  Following the Spanish-American War, the Philippines came under
                  American rule, leading to significant changes in education,
                  governance, and society. The country achieved independence in
                  1946 and has since worked to build a modern nation while
                  preserving its rich cultural heritage.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Key Historical Figures
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-gray-900">José Rizal</div>
                    <div className="text-sm text-gray-800">
                      National Hero, Writer, Reformist
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Andrés Bonifacio
                    </div>
                    <div className="text-sm text-gray-800">
                      Revolutionary Leader
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Emilio Aguinaldo
                    </div>
                    <div className="text-sm text-gray-800">First President</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Corazon Aquino
                    </div>
                    <div className="text-sm text-gray-800">
                      Democracy Icon, Former President
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      March 16, 1521
                    </div>
                    <div className="text-gray-900">Arrival of Magellan</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      June 12, 1898
                    </div>
                    <div className="text-gray-900">
                      Declaration of Independence
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      July 4, 1946
                    </div>
                    <div className="text-gray-900">
                      Recognition of Independence
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      February 25, 1986
                    </div>
                    <div className="text-gray-900">
                      EDSA People Power Revolution
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Related Links
                </h3>
                <nav className="space-y-2">
                  <a
                    href="/philippines/about"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="/philippines/culture"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Culture
                  </a>
                  <a
                    href="/philippines/regions"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Regions
                  </a>
                  <a
                    href="/philippines/tourism"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Tourism
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhilippinesHistory;

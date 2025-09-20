import { useState, useMemo } from "react"
import { Search, Users, MapPin, Phone } from "lucide-react"
import legislativeData from "../../../data/directory/legislative.json"

interface HouseMember {
  province_city: string
  name: string
  district: string
  contact: string
}

export default function HouseMembersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)

  // Get House of Representatives data
  const houseData = legislativeData.find((item: any) =>
    item.chamber.includes("House of Representatives")
  )

  // Extract house members
  const houseMembers = houseData?.house_members || []

  // Get unique provinces/cities for filtering
  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(houseMembers.map((member: HouseMember) => member.province_city))
    ).sort()
    return uniqueProvinces
  }, [houseMembers])

  // Filter members based on search term and selected province
  const filteredMembers = useMemo(() => {
    return houseMembers.filter((member: HouseMember) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.province_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.district.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesProvince =
        !selectedProvince || member.province_city === selectedProvince

      return matchesSearch && matchesProvince
    })
  }, [houseMembers, searchTerm, selectedProvince])

  // Group members by province/city
  const membersByProvince = useMemo(() => {
    const grouped: Record<string, HouseMember[]> = {}

    filteredMembers.forEach((member: HouseMember) => {
      if (!grouped[member.province_city]) {
        grouped[member.province_city] = []
      }
      grouped[member.province_city].push(member)
    })

    // Sort provinces alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc: Record<string, HouseMember[]>, province) => {
        acc[province] = grouped[province]
        return acc
      }, {})
  }, [filteredMembers])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            House Members by Cities/Provinces
          </h1>
          <p className="text-gray-800 mt-1">
            {houseMembers.length} Representatives from {provinces.length}{" "}
            cities/provinces
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search representatives..."
              className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedProvince || ""}
            onChange={e => setSelectedProvince(e.target.value || null)}
          >
            <option value="">All Cities/Provinces</option>
            {provinces.map(province => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(membersByProvince).length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No representatives found
          </h3>
          <p className="text-gray-800">
            Try adjusting your search term or filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(membersByProvince).map(([province, members]) => (
            <div
              key={province}
              className="bg-white rounded-lg border overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  {province}
                </h2>
                <p className="text-sm text-gray-800">
                  {members.length}{" "}
                  {members.length === 1 ? "representative" : "representatives"}
                </p>
              </div>

              <div className="divide-y">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-800">
                        {member.district} District
                      </p>
                    </div>

                    <div className="flex items-center text-sm text-gray-800">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{member.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

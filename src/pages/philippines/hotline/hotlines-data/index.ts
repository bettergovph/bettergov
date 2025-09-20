import hotlinesData from "../../../../data/philippines_hotlines.json";

export interface Hotline {
  id?: string;
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}

const getCategoryHotlines = (category: string): Hotline[] => {
  switch (category) {
    case "emergency":
      return hotlinesData.emergencyHotlines as Hotline[];
    case "disaster":
      return hotlinesData.disasterHotlines as Hotline[];
    case "security":
      return hotlinesData.securityHotlines as Hotline[];
    case "transport":
      return hotlinesData.transportHotlines as Hotline[];
    case "weather":
      return hotlinesData.weatherHotlines as Hotline[];
    case "utility":
      return hotlinesData.utilityHotlines as Hotline[];
    case "social":
      return hotlinesData.socialServicesHotlines as Hotline[];
    default:
      return [
        ...hotlinesData.emergencyHotlines,
        ...hotlinesData.disasterHotlines,
        ...hotlinesData.securityHotlines,
        ...hotlinesData.transportHotlines,
        ...hotlinesData.weatherHotlines,
        ...hotlinesData.utilityHotlines,
        ...hotlinesData.socialServicesHotlines,
      ] as Hotline[];
  }
};

const filterHotlines = (activeCategory: string, searchTerm: string) => {
  const data = getCategoryHotlines(activeCategory).filter(
    (hotline) =>
      hotline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotline.numbers.some((number) => number.includes(searchTerm))
  );

  return data;
};

const hotlines: Hotline[] = (() => {
  return Object.values(hotlinesData)
    .map((item) =>
      item.map((hotline) => ({
        ...hotline,
        id: crypto.randomUUID(), // generated once
      }))
    )
    .flat(1);
})();

const getHotlines = (search?: string): Hotline[] => {
  if (!search) return hotlines;
  const filteredHotlines = hotlines.filter((hotline) =>
    hotline.name.toLowerCase().includes(search)
  );
  return filteredHotlines;
};

/** Ensure that the hotline name exist  */
const getHotlineNumbersByHotlineName = (name: string) => {
  const hotline = hotlines.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return hotline?.numbers ?? [];
};

const getHotlineById = (id: string) => {
  const hotline = hotlines.find((h) => h.id === id);
  return hotline;
};

const useHotlinesData = () => {
  return {
    getCategoryHotlines,
    filterHotlines,
    getHotlines,
    getHotlineNumbersByHotlineName,
    getHotlineById,
  };
};

export default useHotlinesData;

export type LanguageType =
  | 'en' // English
  | 'fil' // Filipino (standardized Tagalog)
  | 'ceb' // Cebuano/Bisaya
  | 'bcl' // Bikol
  | 'hil' // Hiligaynon/Ilonggo
  | 'ilo' // Ilocano
  | 'krj' // Kinaray-a
  | 'mag' // Maguindanao
  | 'mdh' // Maranao
  | 'pag' // Pangasinan
  | 'pam' // Kapampangan
  | 'tsg' // Tausug
  | 'war'; // Waray

export interface Country {
  name: string;
  code: string;
  flag: string;
  visaRequired: boolean;
  duration?: string;
  specialConditions?: string[];
  requiredDocuments?: string[];
  note?: string;
}

export interface VisaCategory {
  title: string;
  description: string;
  visaTypes: VisaType[];
}

export interface VisaType {
  name: string;
  description: string;
  duration: string;
  requirements: string[];
}

export interface ConstitutionalOffice {
  title: string;
  description: string;
  slug: string;
  icon: string;
}

export interface GovernmentBranch {
  title: string;
  description: string;
  icon: string;
  offices: ConstitutionalOffice[];
}

export interface NavigationItem {
  label: string;
  href: string;
  target?: string;
  children?: NavigationItem[];
}

export interface ServiceCategory {
  name: string;
  slug: string;
  services: Service[];
}

export interface Service {
  service: string;
  url: string;
  id: string;
  slug: string;
  published: boolean;
  featured: boolean;
  category: {
    name: string;
    slug: string;
  };
  subcategory: {
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
}

export interface ForexData {
  currency: string;
  code: string;
  rate: number;
  change: number;
  changePercent: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface BlogPost {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  tags: string[];
  content: string;
}

export interface Feedback {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'bug' | 'feature' | 'general';
}

export interface ProjectIdea {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: string;
  createdAt: string;
}

export interface VolunteerRole {
  title: string;
  description: string;
  requirements: string[];
  timeCommitment: string;
  location: 'remote' | 'hybrid' | 'onsite';
  category: 'development' | 'design' | 'content' | 'community' | 'other';
}

export interface ContactInfo {
  name: string;
  position: string;
  email: string;
  phone?: string;
  office?: string;
  address?: string;
}

export interface ForexRate {
  currency: string;
  code: string;
  rate: number;
}

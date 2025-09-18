export interface VisaSubtype {
  id: string;
  name: string;
  description: string;
  requirements: string[] | {
    businessOwners?: string[];
    employees?: string[];
  };
}

export interface VisaType {
  id: string;
  name: string;
  description: string;
  url: string;
  minimumRequirements: string[];
  subtypes: VisaSubtype[];
}

export interface VisaFreeEntryPolicy {
  id: string;
  title: string;
  description: string;
  countries?: string[];
  requirements?: string[];
  additionalInfo?: string;
  eligibleGroups?: string[];
  policies?: {
    group: string;
    policy: string;
  }[];
}

export interface VisaRequiredNationals {
  description: string;
  url: string;
}

export interface SourceInfo {
  officialSource: string;
  lastUpdated: string;
  disclaimer: string;
}

export interface PhilippinesVisaPolicy {
  visaTypes: VisaType[];
  visaFreeEntryPolicies: VisaFreeEntryPolicy[];
  visaRequiredNationals: VisaRequiredNationals;
  sourceInfo: SourceInfo;
}

export interface VisaRequirement {
  type: 'visa-free' | 'visa-required' | 'special-condition';
  duration?: string;
  description?: string;
  requirements?: string[];
  additionalInfo?: string;
}
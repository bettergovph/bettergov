import { ServiceItem } from '../types';

export const services: ServiceItem[] = [
  {
    id: '1',
    title: 'Online Passport',
    description: 'Apply for or renew your Philippine passport online',
    icon: 'Passport',
    url: '/services/passport',
    category: 'citizenship',
  },
  {
    id: '2',
    title: 'Tax Filing',
    description: 'File and pay your taxes through the electronic filing system',
    icon: 'Receipt',
    url: '/services/tax',
    category: 'business',
  },
  {
    id: '3',
    title: 'PhilHealth',
    description: 'Access PhilHealth services and manage your health insurance',
    icon: 'HeartPulse',
    url: '/services/philhealth',
    category: 'health',
  },
  {
    id: '4',
    title: 'SSS Services',
    description: 'Access Social Security System benefits and services',
    icon: 'Shield',
    url: '/services/sss',
    category: 'employment',
  },
  {
    id: '5',
    title: "Driver's License",
    description: "Apply for or renew your driver's license online",
    icon: 'Car',
    url: '/services/drivers-license',
    category: 'transportation',
  },
  {
    id: '6',
    title: 'Business Permit',
    description: 'Apply for or renew your business permit',
    icon: 'Building',
    url: '/services/business-permit',
    category: 'business',
  },
  {
    id: '7',
    title: 'Birth Certificate',
    description: 'Request a copy of your birth certificate online',
    icon: 'FileText',
    url: '/services/birth-certificate',
    category: 'citizenship',
  },
  {
    id: '8',
    title: 'Voter Registration',
    description: 'Register as a voter or verify your voter status',
    icon: 'Vote',
    url: '/services/voter',
    category: 'citizenship',
  },
  {
    id: '9',
    title: 'National ID',
    description: 'Register for your PhilSys National ID',
    icon: 'BadgeCheck',
    url: '/services/national-id',
    category: 'citizenship',
  },
];

export const popularServices = services;

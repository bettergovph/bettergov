import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Services from '../../pages/services/index';

// service_categories.json is generated at build time and not guaranteed to
// exist in this checkout. This test renders /services unfiltered (no
// ?category=), so the taxonomy content only needs to be valid enough for
// the sidebar to render — it does not gate which records appear.
vi.mock('../../data/cms', () => ({
  serviceCategories: {
    categories: [
      {
        category: 'Uncategorized',
        slug: 'uncategorized',
        subcategories: [{ name: 'Uncategorized', slug: 'uncategorized' }],
      },
    ],
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * Fires every intersection immediately so the page's infinite scroll runs to
 * completion without a real scroll container. Each firing is deferred to a
 * macrotask so React finishes committing the previous page before the next
 * `setCurrentPage` call — mirrors a real IntersectionObserver's async
 * callback timing closely enough for `waitFor` to converge.
 */
class AutoLoadIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    setTimeout(() => {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }, 0);
  }

  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', AutoLoadIntersectionObserver);
});

const renderAt = (url: string) => {
  window.history.pushState({}, '', url);
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <NuqsAdapter>
          <Services />
        </NuqsAdapter>
      </MemoryRouter>
    </HelmetProvider>
  );
};

/**
 * A fixed, reviewed snapshot of the complete 194-record `service` name
 * sequence in codepoint filename order — NOT re-derived from the current
 * JSON files at test time. Deriving "expected" from the same files the page
 * reads would let an accidental record reorder inside a JSON file move both
 * sides together and the test would stay green. `service` is used as the
 * per-record marker because it is guaranteed unique (194/194); `url` is not
 * (187/194 unique) and could silently mask a swap between two same-URL
 * records.
 *
 * Regenerate ONLY after a reviewed, intentional reordering of committed
 * service data:
 *   node -e "const fs=require('fs'),path=require('path');const DIR='src/data/services';
 *   const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).sort((a,b)=>a<b?-1:a>b?1:0);
 *   let all=[];for(const f of files){all.push(...JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')).map(r=>r.service));}
 *   console.log(JSON.stringify(all,null,2));"
 */
const EXPECTED_SERVICE_NAMES_IN_ORDER = [
  'Apply for a Trademark Online',
  'Apply for a Utility Model',
  'Apply for DDB Certification (non-controlled) and Exemption (with controlled chemicals)',
  'Request for a Grant of a Philippine Patent',
  'Search Trademark Information',
  'Calculate Registration Fee of Stock Corporation',
  'Cancel your Application for Business Name Registration',
  'Register a Sole Proprietorship Business',
  'Request for Renewal of Business Name',
  'Request Securing Copies of Corporate and Partnership Documents',
  'Check Status of your Requested Documents from SEC',
  'Submit your Company’s General Information Sheet and/or Audited Financial Statements Online to SEC',
  'Update Information of your Application for a Business Name',
  'File Complaints on Consumer Affair Service',
  'Know more About Business or Investment-related Assistance',
  'Apply Online for Advance Rulings on Tariff Classification and Tariff Classification Dispute Rulings',
  'Know the Buying and Selling Prices of Rice and Corn',
  'Apply for Certificate of Conformity',
  'Check Status of ECC Application Online',
  'Register your Business Online with MTRCB for Analog Television Station',
  'Register your Business Online with MTRCB for Cable TV',
  'Register your Business Online with MTRCB for DTT (Digital Terrestrial Television)',
  'Register your Business Online with MTRCB for Theater/Cinema',
  'Apply for ERC Certificate of Compliance',
  'Search Patent Availability',
  'File for IPOPHL Industrial Design',
  'Apply for CITES Wildlife Products (Import, Export, and Re-export)',
  'Register a Business Name',
  'Request a Business Name Certificate',
  'Search for Tariff',
  'Apply for DBP mSME Loan',
  'Apply for Registration as Ecozone Enterprise or Ecozone Developer',
  'Check Status of CNC Application Online',
  'Apply for Environmental Laboratory Recognition',
  'Apply for Importer and Importation Clearance for Recyclable Materials Containing Hazardous Substances',
  'Apply for Pre-Manufacture and Pre-Importation Notification Certificate',
  'Apply for Priority Chemical List Compliance Certificate',
  'Apply for Waste Water Discharge Permit',
  'Apply for DOST Accreditation and Certification',
  'Avail Certification of Science and Technology-oriented Foundations',
  'Request a Birth Certificate via PSA Serbilis',
  'Request a Birth Certificate via PSAHelpline.ph',
  'Request a Certificate of No Marriage Record (CENOMAR) via PSA Serbilis',
  'Request a Certificate of No Marriage Record (CENOMAR) via PSAHelpline.ph',
  'Request a Death Certificate via PSA Serbilis',
  'Request a Marriage Certificate via PSA Serbilis',
  'Request a Certificate of No Death Record (CENODEATH) via PSA Serbilis',
  'Request a Death Certificate via PSAHelpline.ph',
  'Request a Marriage Certificate via PSAHelpline.ph',
  'Apply for NBI Multipurpose Clearance',
  'Get a Postal ID',
  'Get a PWD ID',
  'Get a MySSS Card',
  'Register to the Philippine Identification System (PhilSys) or National ID',
  'Renew NBI Multipurpose Clearance',
  'Register as an Overseas Voter',
  'Know How to Correct Errors in your Civil Registry Documents',
  'Get a Solo Parent ID',
  'Calculate Possible Retirement Benefit with SSS',
  'Register your Kasambahay with SSS',
  "Register your Pag-IBIG Member's Information",
  'Submit your Pag-IBIG Monthly Remittance (eSRS) Online',
  'Update SSS Information',
  'View your GSIS Membership Record',
  'Submit Loan Collection List for Employers',
  'Report PhilHealth Premium Contributions of your Employees',
  'Check DSWD Preparedness Response Online',
  'Check Earthquake Information',
  'Check Tsunami Advisory and Warning',
  'Check Volcano Bulletins',
  'Generate Initial Hazard Assessments in your selected Location for Seismic, Volcanic, and Hydro-meteorological Hazards',
  'Generate Summaries of Hazards and Risk Assessment and Perform Analysis and Visualization of Exposure and Elements at Risk to Natural Hazards',
  'Access Hydrometeorological Monitoring (e.g., rain, rivers, flood levels) via PHILSENSORS',
  'View High-Resolution Hazard Maps on Flooding, Storm Surge, and Landslides via Project NOAH',
  'Check Volcanic Eruptions, Earthquakes, Tsunami and other related Geotectonic Phenomena',
  'Access Weather and Hazard Information via PAGASA',
  'Apply for CHED Financial Assistance',
  'Apply to the Balik Scientist Program (BSP)',
  'Apply for DOST-SEI Undergraduate Scholarship Program',
  'Apply for PCHRD Research Grant',
  'Apply for CHED Foreign Scholarship and Training Programs',
  'Register for a COA Training',
  'Apply for TESDA Online Program',
  'Register Online for PSRTI Regular Training Courses',
  'Apply for DA eLearning Certification',
  'Apply for TESDA Scholarship',
  'Apply Online for SHS Voucher Program',
  'Apply for OWWA Scholarship',
  'Download PRC Oath Form',
  'Apply for EC Credit Salary Loan',
  'Generate your Career Service Examination Result Online (for 2018 onwards)',
  'PRC Online License Verification',
  'Verify Enterprised-based Union',
  'Register Enterprised-based Union',
  'Find Examination Location and Room Assignment (PRC Licensure Examination)',
  'Apply as Continuing Professional Development (CPD) Provider',
  'Search for Continuing Professional Development (CPD) Programs',
  'File OFW Legal Assistance',
  'Apply for CSC Examination',
  'Apply for CSC Grant of Eligibility under Special Laws and CSC Issuances',
  'Validate the Guarantee Letter issued by the PCSO',
  'Look for Dengue Information',
  'Access Health and Health Related Research Information',
  'Get Health Research Ethics Clearance',
  'Look for Newly-approved Health Researches from Year 2012 Onwards',
  'Search for Completed National Health Researches',
  'Schedule for an Individual Medical Assistance Program (IMAP) Online Appointment',
  'Check Responsible Parenthood and Family Planning Program',
  'Register to Submit Health Research Proposals',
  'Apply for Pag-IBIG Conversion to Full Risk Based-Pricing (Re-Pricing)',
  'Apply for Pag-IBIG Housing Loan',
  'Apply for Pag-IBIG Housing Loan on Behalf of the Prospective Borrowers',
  'Check Pag-IBIG Housing Loan Payments',
  'Look for Different Government Housing Programs',
  'Pay Pag-IBIG Calamity Loan Online',
  'Pay Pag-IBIG Housing Loan Online',
  'Pay Pag-IBIG Housing Loan Processing Fee Online',
  'Pay Pag-IBIG MP2 Savings (Voluntary Savings) Online',
  'Pay Pag-IBIG Multi-Purpose Loan Online',
  'Pay Pag-IBIG Regular Savings (Mandatory Contribution) Online',
  'Apply as Developer of Condominium Projects',
  'Know your Right as Buyer of Subdivision Lot or Condominium Unit',
  'View List of Real Estate Brokers/Salespersons',
  'Compute Monthly Amortization',
  'Apply Travel Clearance for Minors',
  'Schedule Passport Application Appointment',
  'Secure an Appointment for Guidance and Counselling Program (GCP) by the Commission on Filipinos Overseas (CFO)',
  'Reserve and Register for the Country Familiarization Seminar (CFS) to Participate in the Au Pair Program',
  'Amend Permanent Non-Quota Immigrant Visa by Marriage',
  'Apply for Recognition as Filipino Citizen',
  'Apply for Retention/Re-Acquisition of Philippine Citizenship',
  'Convert Non-Quota Immigrant Visa by Marriage',
  'Convert to Non-Quota Immigrant Visa of a Child Born Subsequent to the Issuance of Immigrant Visa of the Accompanying Parent',
  'Convert to Non-Quota Immigrant Visa of a Former Filipino Citizen Naturalized in a Foreign Country',
  'Convert to Non-Quota Immigrant Visa of a Previous Permanent Resident Returning from a Temporary Visit Abroad',
  'Convert to Non-Quota Immigrant Visa of Child Born Abroad of an Immigrant Mother',
  'Apply for Permanent Resident Visa (PRV)',
  'Convert to Pre-arranged Employee Visa',
  'Convert to Quota Immigrant Visa',
  'Convert to Student Visa',
  "Convert to Treaty Trader's Visa or Treaty Investor's Visa",
  'Convert to Temporary Resident Visa (TRV) by Marriage',
  'Convert to Temporary Resident Visa (TRV) of an Indian National Married to a Filipino',
  'Apply for Temporary Visitor Visa (9A)',
  'View List of Accredited Official of Foreign Government Visa',
  'Apply for Visa Upon Arrival (SEVUA)',
  'Apply for Special Visa for Employment Generation (SVEG)',
  'Apply for Special Employment Visa for Offshore Banking Unit',
  'Apply for Special Visa under E.O. 226, as amended by R.A. 8756',
  'Apply for Accredited Official of Foreign Government Visa (9E)',
  'Apply for SSS Maternity Benefit',
  'File Complaints on DSWD Disaster-related initiatives',
  'Apply for SSS Salary Loan',
  'Apply for DBP Water for Every Resident (WATER) Program',
  'Apply for Technical Retirement',
  'Check PhilHealth Rate for Specific Cases of Illness/Surgical Procedure',
  'Express Interest to Adopt or Foster',
  "Check Patient's PhilHealth Eligibility Status upon Admission",
  'Locate Philhealth Accredited Health Care Institutions',
  'Avail OFW Online Legal Counseling for Human Trafficking Victims, etc',
  'Calculate Income/VAT Tax and View Tax Requirements and Forms',
  'Apply for BIR Tax Clearance Certificate',
  'File Tax Returns and Pay Taxes Online',
  'Register for a Taxpayer Identification Number (TIN)',
  'Report Gross Monthly Sales of Business Taxpayers',
  'Apply and Process Certification of Electronic Tax Return Preparation, Filing and/or Payment Solutions',
  'Submit Official Register Book of Goods and Products Subject to Excise Tax',
  'File Complaint Against BIR Staff',
  'File Complaint for Non-Issuance of Official Receipt',
  'File Complaint for Tax Evasion/Avoidance',
  'File Other Tax Related Complaints',
  'Apply for DBP CRUISE Loan',
  "Get a Driver's License",
  "Renew your Driver's License",
  'Check if one has committed a Traffic Violation',
  "Foreign Driver's License Conversion",
  'Know more About Public-Private Partnership Opportunities',
  'Track PhilPost Package',
  'Sign in for DBP Digital Banking Portal',
  'Request and Access Government Records',
  'View Postal ID Privileges',
  'Apply for LGU Loan',
  'Seek Assistance or Information from the DILG',
  'Access Science for every Juan (Know about the Latest Breakthroughs and Developments in the Philippine Science Scene)',
  'Connecting Rural Urban Intermodal Systems Efficiently (CRUISE)',
  'DBP-Mindanao Development Assistance Financing Program (DBP-MinDA)',
  'DBP’s Electric Cooperative Loan Take-Out Assistance from PSALM (DELTA-P)',
  'Financing Utilities for Sustainable Energy Development (FUSED)',
  'Infrastructure Contractors Support (ICONS) Program',
  'Solar Merchant Power Plant (SMPP) Financing Program',
  'Water for Every Resident (WATER) Program',
  'Apply as DPWH Accredited Civil Society Organizations (CSO)',
  'Monitor the Status of Documents in the DPWH',
  "Verify the Status of the Contractor's Profile",
] as const;

describe('/services renders every record in codepoint filename order', () => {
  it('renders all 194 records, in order, after infinite scroll completes', async () => {
    expect(EXPECTED_SERVICE_NAMES_IN_ORDER).toHaveLength(194);
    expect(new Set(EXPECTED_SERVICE_NAMES_IN_ORDER).size).toBe(194);

    renderAt('/services');

    await waitFor(
      () => {
        expect(screen.getAllByRole('listitem')).toHaveLength(194);
      },
      { timeout: 10000 }
    );

    const renderedNames = screen
      .getAllByRole('listitem')
      .map(li => li.querySelector('h3')!.textContent);

    // The complete sequence, not just endpoints — a middle-record reordering
    // would otherwise slip through undetected. Compared against a FIXED
    // snapshot, not a value re-derived from the current files, so an
    // accidental reorder inside a committed JSON file cannot move both
    // sides together.
    expect(renderedNames).toEqual([...EXPECTED_SERVICE_NAMES_IN_ORDER]);
  }, 15000);
});

import { DollarSign, TrendingUp, Info } from 'lucide-react';

type SalarySchedule = {
  grade: number;
  steps: Array<number | null>;
  average: number;
};

// Second Tranche Monthly Salary Schedule for Civilian Personnel (effective Jan 1, 2025)
// Source: DBM National Budget Circular No. 597 (Annex A) - Data from salary_grades_2025_source_DBM.csv
// Sorted from highest to lowest salary grade
const salarySchedule: SalarySchedule[] = [
  {
    grade: 33,
    steps: [438844, 451713, null, null, null, null, null, null],
    average: 445279,
  },
  {
    grade: 32,
    steps: [347888, 354743, 361736, 368694, 375969, 383391, 390963, 398686],
    average: 372884,
  },
  {
    grade: 31,
    steps: [293191, 298773, 304464, 310119, 315883, 321846, 327895, 334059],
    average: 313604,
  },
  {
    grade: 30,
    steps: [203200, 206401, 209558, 212766, 216022, 219434, 222797, 226319],
    average: 214512,
  },
  {
    grade: 29,
    steps: [180492, 183332, 186218, 189151, 192131, 194797, 197870, 200993],
    average: 190624,
  },
  {
    grade: 28,
    steps: [160469, 162988, 165548, 167994, 170634, 173320, 175803, 178572],
    average: 169166,
  },
  {
    grade: 27,
    steps: [142663, 144897, 147169, 149407, 151752, 153850, 156267, 158723],
    average: 150591,
  },
  {
    grade: 26,
    steps: [126252, 128228, 130238, 132280, 134356, 136465, 138608, 140788],
    average: 133527,
  },
  {
    grade: 25,
    steps: [111727, 113476, 115254, 117062, 118899, 120766, 122664, 124591],
    average: 118043,
  },
  {
    grade: 24,
    steps: [98185, 99721, 101283, 102871, 104483, 106123, 107739, 109431],
    average: 103205,
  },
  {
    grade: 23,
    steps: [87315, 88574, 89855, 91163, 92592, 94043, 95518, 96955],
    average: 91952,
  },
  {
    grade: 22,
    steps: [78162, 79277, 80411, 81564, 82735, 83887, 85096, 86324],
    average: 82207,
  },
  {
    grade: 21,
    steps: [70013, 71000, 72004, 73024, 74061, 75115, 76151, 77239],
    average: 73513,
  },
  {
    grade: 20,
    steps: [62967, 63842, 64732, 65637, 66557, 67479, 68409, 69342],
    average: 66146,
  },
  {
    grade: 19,
    steps: [56390, 57165, 57953, 58753, 59567, 60394, 61235, 62089],
    average: 59243,
  },
  {
    grade: 18,
    steps: [51304, 51832, 52367, 52907, 53456, 54010, 54572, 55140],
    average: 53224,
  },
  {
    grade: 17,
    steps: [47247, 47727, 48213, 48705, 49203, 49708, 50218, 50735],
    average: 48982,
  },
  {
    grade: 16,
    steps: [43560, 43996, 44438, 44885, 45338, 45796, 46261, 46730],
    average: 45138,
  },
  {
    grade: 15,
    steps: [40208, 40604, 41006, 41413, 41824, 42241, 42662, 43090],
    average: 41656,
  },
  {
    grade: 14,
    steps: [37024, 37384, 37749, 38118, 38491, 38869, 39252, 39640],
    average: 38328,
  },
  {
    grade: 13,
    steps: [34421, 34733, 35049, 35369, 35694, 36022, 36354, 36691],
    average: 35554,
  },
  {
    grade: 12,
    steps: [29165, 29431, 29700, 29973, 30248, 30528, 30810, 31096],
    average: 30119,
  },
  {
    grade: 11,
    steps: [30024, 30308, 30597, 30889, 31185, 31486, 31790, 32099],
    average: 31060,
  },
  {
    grade: 10,
    steps: [25586, 25790, 25996, 26203, 26412, 26623, 26835, 27050],
    average: 26250,
  },
  {
    grade: 9,
    steps: [23226, 23411, 23599, 23788, 23978, 24170, 24364, 24558],
    average: 23875,
  },
  {
    grade: 8,
    steps: [21448, 21642, 21839, 22035, 22234, 22435, 22638, 22843],
    average: 22152,
  },
  {
    grade: 7,
    steps: [20110, 20258, 20408, 20560, 20711, 20865, 21019, 21175],
    average: 20638,
  },
  {
    grade: 6,
    steps: [18957, 19098, 19239, 19383, 19526, 19670, 19816, 19963],
    average: 19520,
  },
  {
    grade: 5,
    steps: [17866, 18000, 18133, 18267, 18401, 18538, 18676, 18813],
    average: 18337,
  },
  {
    grade: 4,
    steps: [16833, 16958, 17084, 17209, 17337, 17464, 17594, 17724],
    average: 17288,
  },
  {
    grade: 3,
    steps: [15852, 15971, 16088, 16208, 16329, 16448, 16571, 16693],
    average: 16276,
  },
  {
    grade: 2,
    steps: [14925, 15035, 15146, 15258, 15371, 15484, 15599, 15714],
    average: 15292,
  },
  {
    grade: 1,
    steps: [14061, 14164, 14278, 14393, 14509, 14626, 14743, 14862],
    average: 14430,
  },
];

const formatPeso = (amount: number | null) =>
  amount == null ? '-' : `₱${amount.toLocaleString('en-PH')}`;

// Plantilla position references per SG (non-exhaustive).
// Highlighted positions requested by user are emphasized via styling below.
const plantillaPositionsByGrade: Record<number, string> = {
  33: 'President',
  32: 'Vice President',
  31: 'Senator; Congressman',
  30: 'Mayor',
  29: 'Assistant Cabinet Secretary',
  25: 'District Engineer',
  20: 'Executive Assistant III',
  11: 'Project Development Officer I',
  1: 'Administrative Aide I',
  28: 'Board Chairman I',
  27: 'Trial Court Judge',
  26: 'City Government Department Head',
  24: 'Community Development Officer V',
  23: 'Court Attorney II',
  22: 'Engineer IV',
  21: 'Chief Revenue Officer II',
  19: 'Engineer III',
  18: 'Information Officer III',
  17: 'Court Secretary',
  16: 'Engineer II',
  15: 'Energy Regulation Officer II',
  14: 'Executive Assistant I',
  13: 'Immigration Officer II',
  12: 'Instructor I',
  10: 'Land Examiner I',
  9: 'Loan Examiner I',
  8: 'Accounting Clerk III',
  7: 'Administrative Assistant I',
  6: 'Agricultural Technician I',
  5: 'Bailiff I',
  4: 'Baranggay Health Aide',
  3: 'Carpenter I',
  2: 'Cemetery Caretaker',
};

// All plantilla positions styled uniformly in gray

export default function SalaryGradePage() {
  const allSteps = salarySchedule.flatMap(
    s => s.steps.filter(v => v != null) as number[]
  );
  const highestSalary = Math.max(...allSteps);
  const lowestSalary = Math.min(...allSteps);

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Government Salary Grades
          </h1>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            Comprehensive salary information for Philippine government officials
            and employees based on the standardized salary grade system.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-lg shadow-md border'>
            <div className='flex items-center'>
              <DollarSign className='h-8 w-8 text-green-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Highest Salary
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatPeso(highestSalary)}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md border'>
            <div className='flex items-center'>
              <TrendingUp className='h-8 w-8 text-blue-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Lowest Salary
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatPeso(lowestSalary)}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md border'>
            <div className='flex items-center'>
              <TrendingUp className='h-8 w-8 text-purple-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Salary Grades
                </p>
                <p className='text-2xl font-bold text-gray-900'>1-33</p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md border'>
            <div className='flex items-center'>
              <Info className='h-8 w-8 text-orange-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>Steps</p>
                <p className='text-2xl font-bold text-gray-900'>1-8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
          <h2 className='text-xl font-semibold text-blue-900 mb-3'>
            About the Salary Grade System
          </h2>
          <p className='text-blue-800 mb-4'>
            The Philippine government uses a standardized salary grade system
            (SG 1-33) to determine compensation for all government employees.
            This system ensures fair and consistent pay across different
            agencies and positions.
          </p>
          <p className='text-blue-800'>
            <strong>Note:</strong> These figures represent gross monthly
            salaries without tax applied and may vary based on location
            allowances, hazard pay, and other benefits. Actual take-home pay may
            be lower or higher due to various allowances and benefits.
          </p>
          <p className='text-blue-800 mt-3 text-sm'>
            Source: Department of Budget and Management, National Budget
            Circular No. 597, Annex A — Second Tranche Monthly Salary Schedule
            for Civilian Personnel (effective January 1, 2025). See:{' '}
            <a
              className='underline'
              href='https://www.dbm.gov.ph/wp-content/uploads/Issuances/2025/National-Budget-Circular/NBC-No.-597.pdf'
              target='_blank'
              rel='noreferrer'
            >
              dbm.gov.ph — NBC No. 597 (2025)
            </a>
          </p>
        </div>

        {/* Salary Grade Table */}
        <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Salary Grade
                  </th>
                  <th
                    scope='col'
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Position Name (examples)
                  </th>
                  <th
                    scope='col'
                    className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Steps Average
                  </th>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <th
                      key={idx}
                      scope='col'
                      className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Step {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {salarySchedule.map((row, index) => (
                  <tr
                    key={index}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      SG {row.grade}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-700'>
                      {plantillaPositionsByGrade[row.grade] || '—'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-900 text-right'>
                      {formatPeso(row.average)}
                    </td>
                    {row.steps.map((value, i) => (
                      <td
                        key={i}
                        className='px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right'
                      >
                        {formatPeso(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Information */}
        <div className='mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Important Notes
          </h3>
          <ul className='space-y-2 text-gray-700'>
            <li className='flex items-start'>
              <span className='text-blue-600 mr-2'>•</span>
              <span>
                Salaries are subject to annual adjustments based on government
                policies and economic conditions.
              </span>
            </li>
            <li className='flex items-start'>
              <span className='text-blue-600 mr-2'>•</span>
              <span>
                Additional allowances may apply based on location, hazard, and
                other factors.
              </span>
            </li>
            <li className='flex items-start'>
              <span className='text-blue-600 mr-2'>•</span>
              <span>
                This information is for reference purposes and may not reflect
                the most current salary adjustments.
              </span>
            </li>
            <li className='flex items-start'>
              <span className='text-blue-600 mr-2'>•</span>
              <span>
                For official salary information, please refer to the Civil
                Service Commission or respective government agencies.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

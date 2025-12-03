import React, { useState } from 'react';
import { TrendingDown, Info, Hash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import salaryScheduleData from './salary-schedule.json';
import plantillaPositionsData from './plantilla-positions.json';

type SalarySchedule = {
  grade: number;
  steps: Array<number | null>;
  average: number;
};

// Second Tranche Monthly Salary Schedule for Civilian Personnel (effective Jan 1, 2025)
// Source: DBM National Budget Circular No. 597 (Annex A) - Data from salary_grades_2025_source_DBM.csv
// Sorted from highest to lowest salary grade
const salarySchedule: SalarySchedule[] = salaryScheduleData;

const formatPeso = (amount: number | null) =>
  amount == null ? '-' : `₱${amount.toLocaleString('en-PH')}`;

// Plantilla position references per SG (non-exhaustive)
const plantillaPositionsByGrade: Record<number, string> =
  plantillaPositionsData;

// All plantilla positions styled uniformly in gray

export default function SalaryGradePage() {
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);

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
              <div className='h-8 w-8 text-green-600 mr-3 flex items-center justify-center text-2xl font-bold'>
                ₱
              </div>
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
              <TrendingDown className='h-8 w-8 text-blue-600 mr-3' />
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
              <Hash className='h-8 w-8 text-purple-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Salary Grades
                </p>
                <p className='text-2xl font-bold text-gray-900'>1 - 33</p>
              </div>
            </div>
          </div>

          <div
            className='bg-white p-6 rounded-lg shadow-md border cursor-pointer hover:shadow-lg transition-shadow'
            onClick={() => setIsStepsDialogOpen(true)}
          >
            <div className='flex items-center'>
              <Info className='h-8 w-8 text-orange-600 mr-3' />
              <div>
                <p className='text-sm font-medium text-gray-600'>Steps</p>
                <p className='text-2xl font-bold text-gray-900'>1 - 8</p>
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

        {/* Salary Steps Explanation Dialog */}
        <Dialog open={isStepsDialogOpen} onOpenChange={setIsStepsDialogOpen}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-gray-900'>
                About Salary Steps
              </DialogTitle>
            </DialogHeader>
            <div className='py-4'>
              <p className='text-gray-700 leading-relaxed'>
                Each salary grade has 8 steps. Step 1 is the starting pay, and
                Step 8 is the highest pay for that grade. Employees move up a
                step over time or through performance, which increases their
                salary without changing their salary grade.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsStepsDialogOpen(false)}
                className='w-full'
              >
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

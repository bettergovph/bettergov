import { describe, it, expect } from 'vitest';
import { titleCase } from '../directory';

describe('titleCase', () => {
  it('lowercases back-to-back small words', () => {
    expect(titleCase('OFFICE OF THE PRESIDENT')).toBe(
      'Office of the President'
    );
    expect(titleCase('DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT')).toBe(
      'Department of the Interior and Local Government'
    );
  });

  it('keeps parenthetical acronyms and leaves mixed case alone', () => {
    expect(titleCase('CIVIL SERVICE COMMISSION (CSC)')).toBe(
      'Civil Service Commission (CSC)'
    );
    expect(titleCase('Department of Finance')).toBe('Department of Finance');
  });
});

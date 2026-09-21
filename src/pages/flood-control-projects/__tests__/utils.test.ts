import { describe, it, expect } from 'vitest';
import {
  buildEqualityFilter,
  buildFilterString,
  escapeFilterValue,
  FilterState,
} from '../utils';

const emptyFilters = (): FilterState => ({
  InfraYear: '',
  Region: '',
  Province: '',
  TypeofWork: '',
  DistrictEngineeringOffice: '',
  LegislativeDistrict: '',
});

describe('escapeFilterValue', () => {
  it('leaves ordinary values untouched', () => {
    expect(escapeFilterValue('Region I')).toBe('Region I');
  });

  it('keeps apostrophes as-is, since the value is double quoted', () => {
    expect(escapeFilterValue("DEV'T CORPORATION")).toBe("DEV'T CORPORATION");
  });

  it('escapes double quotes', () => {
    expect(escapeFilterValue('a"b')).toBe('a\\"b');
  });

  it('escapes backslashes before quotes so the escape cannot be undone', () => {
    expect(escapeFilterValue('a\\"b')).toBe('a\\\\\\"b');
  });
});

describe('buildEqualityFilter', () => {
  it('quotes and escapes the value', () => {
    expect(buildEqualityFilter('Region', 'Region I')).toBe(
      'Region = "Region I"'
    );
    expect(buildEqualityFilter('Region', 'a"b')).toBe('Region = "a\\"b"');
  });
});

describe('buildFilterString', () => {
  it('always pins the document type', () => {
    expect(buildFilterString(emptyFilters())).toBe('type = "flood_control"');
  });

  it('builds a normal filter', () => {
    expect(buildFilterString({ ...emptyFilters(), Region: 'Region I' })).toBe(
      'type = "flood_control" AND Region = "Region I"'
    );
  });

  it('accepts a valid year', () => {
    expect(buildFilterString({ ...emptyFilters(), InfraYear: '2020' })).toBe(
      'type = "flood_control" AND FundingYear = 2020'
    );
  });

  // Each case below is a payload that escaped the filter expression before
  // this was fixed. The type pin must survive all of them.
  describe('filter injection via URL query parameters', () => {
    it('neutralises a quoted-field breakout that ORs in another type', () => {
      const filter = buildFilterString({
        ...emptyFilters(),
        Region: 'Region I" OR type = "internal_audit',
      });
      expect(filter).toBe(
        'type = "flood_control" AND Region = "Region I\\" OR type = \\"internal_audit"'
      );
      // The injected OR is now inside the quoted value, not filter syntax.
      expect(filter.startsWith('type = "flood_control" AND')).toBe(true);
    });

    it('drops a non-numeric year instead of interpolating it unquoted', () => {
      expect(
        buildFilterString({
          ...emptyFilters(),
          InfraYear: '2020 OR type = "internal_audit"',
        })
      ).toBe('type = "flood_control"');
    });

    it('rejects a year that is not exactly four digits', () => {
      for (const bad of ['20', '20200', 'abcd', '2020;', ' 2020 OR 1=1']) {
        expect(buildFilterString({ ...emptyFilters(), InfraYear: bad })).toBe(
          'type = "flood_control"'
        );
      }
    });

    it('neutralises an AND-based result suppression payload', () => {
      const filter = buildFilterString({
        ...emptyFilters(),
        Region: 'Region I" AND type = "nonexistent',
      });
      expect(filter).toBe(
        'type = "flood_control" AND Region = "Region I\\" AND type = \\"nonexistent"'
      );
    });

    it('escapes payloads aimed at every string-valued field', () => {
      const payload = 'x" OR type = "internal_audit';
      const filter = buildFilterString({
        InfraYear: '',
        Region: payload,
        Province: payload,
        TypeofWork: payload,
        DistrictEngineeringOffice: payload,
        LegislativeDistrict: payload,
      });
      // No unescaped quote may appear anywhere except around the values.
      expect(filter).not.toMatch(/[^\\]" OR type/);
    });
  });
});

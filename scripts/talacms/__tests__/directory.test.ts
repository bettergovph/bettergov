import { describe, it, expect } from 'vitest';
import {
  DEPARTMENTS_QUERY,
  EXECUTIVE_QUERY,
  parseDepartmentsResponse,
  parseExecutiveResponse,
} from '../directory';

const dept = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'a',
  officeName: 'A',
  address: null,
  trunkline: null,
  email: null,
  website: null,
  secretary: null,
  undersecretaries: null,
  attachedAgencies: null,
  details: null,
  ...over,
});

const exec = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'b',
  office: 'B',
  address: null,
  phone: null,
  trunkline: null,
  email: null,
  website: null,
  officials: null,
  bureaus: null,
  attachedAgencies: null,
  ...over,
});

const okDepts = (depts = [dept()]) => ({
  _allGovernmentDepartmentsMeta: { count: depts.length },
  allGovernmentDepartments: depts,
});

const okExecs = (execs = [exec()]) => ({
  _allExecutiveOfficesMeta: { count: execs.length },
  allExecutiveOffices: execs,
});

describe.each([
  ['DEPARTMENTS_QUERY', DEPARTMENTS_QUERY, 'allGovernmentDepartments('],
  ['EXECUTIVE_QUERY', EXECUTIVE_QUERY, 'allExecutiveOffices('],
])('%s', (_name, query, collectionField) => {
  it('declares its _all*Meta field before its collection field', () => {
    const metaIndex = query.indexOf('Meta');
    expect(metaIndex).toBeGreaterThan(-1);
    expect(metaIndex).toBeLessThan(query.indexOf(collectionField));
  });

  it('orders by position_ASC', () => {
    expect(query.match(/orderBy: \[position_ASC\]/g)).toHaveLength(1);
  });

  it('never requests the system timestamps', () => {
    expect(query).not.toContain('_createdAt');
    expect(query).not.toContain('_updatedAt');
  });
});

/**
 * REVISION — Sol finding 1. Each query names exactly one collection, so an
 * `--only=` run cannot be made to fail by the other model's data.
 */
describe('query isolation', () => {
  it('DEPARTMENTS_QUERY never mentions the executive collection', () => {
    expect(DEPARTMENTS_QUERY).not.toContain('allExecutiveOffices');
    expect(DEPARTMENTS_QUERY).not.toContain('_allExecutiveOfficesMeta');
  });

  it('EXECUTIVE_QUERY never mentions the departments collection', () => {
    expect(EXECUTIVE_QUERY).not.toContain('allGovernmentDepartments');
    expect(EXECUTIVE_QUERY).not.toContain('_allGovernmentDepartmentsMeta');
  });
});

describe('parseDepartmentsResponse', () => {
  it('accepts a well-formed response', () => {
    expect(
      parseDepartmentsResponse(okDepts()).allGovernmentDepartments
    ).toHaveLength(1);
  });

  it('ignores an absent executive collection entirely', () => {
    expect(() => parseDepartmentsResponse(okDepts())).not.toThrow();
  });

  it('accepts a null position — the schema declares it nullable', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ position: null })]))
    ).not.toThrow();
  });

  it('accepts duplicate positions — nothing downstream consumes record order', () => {
    const depts = [
      dept({ slug: 'a', position: 3 }),
      dept({ slug: 'b', position: 3 }),
    ];
    expect(() => parseDepartmentsResponse(okDepts(depts))).not.toThrow();
  });

  it('fails closed when the collection is short of its meta count', () => {
    const short = { ...okDepts(), _allGovernmentDepartmentsMeta: { count: 2 } };
    expect(() => parseDepartmentsResponse(short)).toThrow(/incomplete/i);
  });

  it('fails closed on zero departments', () => {
    expect(() => parseDepartmentsResponse(okDepts([]))).toThrow(
      /no government departments/i
    );
  });

  it('fails closed on a duplicate slug', () => {
    const depts = [
      dept({ slug: 'a', position: 0 }),
      dept({ slug: 'a', position: 1 }),
    ];
    expect(() => parseDepartmentsResponse(okDepts(depts))).toThrow(
      /duplicate slug/i
    );
  });

  it('fails closed on a blank display name', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ officeName: '   ' })]))
    ).toThrow(/blank/i);
  });

  it('fails closed on a slug that violates the slug pattern', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ slug: 'Not A Slug' })]))
    ).toThrow(/slug/i);
  });

  it('fails closed when the collection reaches the page-size ceiling', () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      dept({ slug: `s${i}`, position: i })
    );
    expect(() => parseDepartmentsResponse(okDepts(many))).toThrow(/ceiling/i);
  });
});

describe('parseExecutiveResponse', () => {
  it('accepts a well-formed response', () => {
    expect(parseExecutiveResponse(okExecs()).allExecutiveOffices).toHaveLength(
      1
    );
  });

  it('ignores an absent departments collection entirely', () => {
    expect(() => parseExecutiveResponse(okExecs())).not.toThrow();
  });

  it('fails closed on zero executive offices', () => {
    expect(() => parseExecutiveResponse(okExecs([]))).toThrow(
      /no executive offices/i
    );
  });

  it('fails closed on a duplicate slug', () => {
    const execs = [
      exec({ slug: 'a', position: 0 }),
      exec({ slug: 'a', position: 1 }),
    ];
    expect(() => parseExecutiveResponse(okExecs(execs))).toThrow(
      /duplicate slug/i
    );
  });

  it('fails closed on a blank display name', () => {
    expect(() =>
      parseExecutiveResponse(okExecs([exec({ office: '' })]))
    ).toThrow(/blank/i);
  });

  it('fails closed when the collection is short of its meta count', () => {
    const short = { ...okExecs(), _allExecutiveOfficesMeta: { count: 2 } };
    expect(() => parseExecutiveResponse(short)).toThrow(/incomplete/i);
  });
});

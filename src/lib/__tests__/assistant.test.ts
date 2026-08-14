import { describe, expect, it } from 'vitest';
import { CivicEngine, escapeRegExp, type ServiceItem } from '../assistant';

const sampleService = (service: string): ServiceItem => ({
  service,
  url: 'https://example.gov.ph',
  id: '1',
  slug: 'sample',
  category: { name: 'Certificates', slug: 'certificates-ids' },
  subcategory: { name: 'Civil Registry', slug: 'civil-registry' },
});

describe('assistant.ts', () => {
  describe('escapeRegExp', () => {
    it('escapes regex metacharacters', () => {
      expect(escapeRegExp('birth (cenomar)')).toBe('birth \\(cenomar\\)');
      expect(escapeRegExp('a+b*c?')).toBe('a\\+b\\*c\\?');
    });
  });

  describe('CivicEngine.query', () => {
    it('does not throw when the query contains regex metacharacters', () => {
      const engine = new CivicEngine([
        sampleService('Certificate of No Marriage (CENOMAR)'),
      ]);

      expect(() => engine.query('birth (cenomar)')).not.toThrow();
      expect(() => engine.query('(CENOMAR)')).not.toThrow();
      expect(engine.query('(CENOMAR)')).toHaveLength(1);
    });

    it('still ranks exact word matches above partial matches', () => {
      const engine = new CivicEngine([
        sampleService('Passport Application'),
        sampleService('Passport Appointment'),
      ]);

      const results = engine.query('passport');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.service).toMatch(/Passport/);
    });
  });
});

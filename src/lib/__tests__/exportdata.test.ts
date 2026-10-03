import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeCSVValue, exportToCSV } from '../exportData';

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('sanitizeCSVValue', () => {
  it('prefixes values starting with "=" to prevent formula execution', () => {
    expect(sanitizeCSVValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('prefixes values starting with "+"', () => {
    expect(sanitizeCSVValue('+1234567890')).toBe("'+1234567890");
  });

  it('prefixes values starting with "-"', () => {
    expect(sanitizeCSVValue('-2+3')).toBe("'-2+3");
  });

  it('prefixes values starting with "@"', () => {
    expect(sanitizeCSVValue('@SUM(1+1)')).toBe("'@SUM(1+1)");
  });

  it('prefixes values starting with a tab character', () => {
    expect(sanitizeCSVValue('\t=cmd')).toBe("'\t=cmd");
  });

  it('prefixes values starting with a carriage return', () => {
    expect(sanitizeCSVValue('\rmalicious')).toBe("'\rmalicious");
  });

  it('does not alter safe values with internal hyphens', () => {
    expect(sanitizeCSVValue('ABC-123-Contractor')).toBe('ABC-123-Contractor');
  });

  it('does not alter normal alphanumeric text', () => {
    expect(sanitizeCSVValue('Flood Control Project Manila')).toBe(
      'Flood Control Project Manila'
    );
  });

  it('does not alter empty strings', () => {
    expect(sanitizeCSVValue('')).toBe('');
  });

  it('does not alter numeric-looking strings that are not formulas', () => {
    expect(sanitizeCSVValue('12345')).toBe('12345');
  });
});

describe('exportToCSV formula injection protection (integration)', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let capturedBlob: Blob | undefined;

  beforeEach(() => {
    capturedBlob = undefined;
    createObjectURLSpy = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    URL.createObjectURL =
      createObjectURLSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();

    clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy as unknown as () => void;
      }
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes a malicious cell before it reaches the CSV blob', async () => {
    const maliciousData = [
      {
        project_title: '=HYPERLINK("http://evil.com","click")',
        contractor: 'Safe Co',
      },
    ];

    exportToCSV(maliciousData, 'test_export');

    expect(capturedBlob).toBeDefined();
    const text = await readBlobAsText(capturedBlob!);

    expect(text).not.toContain('=HYPERLINK("http://evil.com","click")');
    expect(text).toContain('\'=HYPERLINK(""http://evil.com"",""click"")');
  });

  it('still correctly escapes commas and quotes alongside sanitization', async () => {
    const data = [{ notes: '=1+1,"danger"' }];

    exportToCSV(data, 'test_export');

    const text = await readBlobAsText(capturedBlob!);
    expect(text).toContain('"\'=1+1,""danger"""');
  });

  it('leaves normal safe data completely unchanged', async () => {
    const data = [{ project_title: 'Manila Flood Wall', region: 'NCR' }];

    exportToCSV(data, 'test_export');

    const text = await readBlobAsText(capturedBlob!);
    expect(text).toContain('project_title,region');
    expect(text).toContain('Manila Flood Wall,NCR');
  });
});

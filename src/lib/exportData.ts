/**
 * Utility functions for exporting data from the application
 */

/**
 * Exports data to CSV format and triggers download
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => {
      return headers
        .map(header => {
          // Handle values that need quotes (strings with commas, quotes, or newlines)
          const value =
            row[header] === null || row[header] === undefined
              ? ''
              : row[header];
          const valueStr = String(value);

          if (
            valueStr.includes(',') ||
            valueStr.includes('"') ||
            valueStr.includes('\n')
          ) {
            return `"${valueStr.replace(/"/g, '""')}"`;
          }
          return valueStr;
        })
        .join(',');
    }),
  ].join('\n');

  // Create a blob and download link
  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formats the current date for use in filenames
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function getFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Creates a filename with date for exports
 * @param baseName Base name for the file
 * @returns Filename with date appended
 */
export function createExportFilename(baseName: string): string {
  return `${baseName}_${getFormattedDate()}`;
}

/**
 * Options for exporting Meilisearch data
 */
export interface ExportMeilisearchOptions {
  host: string;
  port: string;
  apiKey: string;
  indexName: string;
  filters: string;
  searchTerm?: string;
  filename?: string;
}

/**
 * Fetches data from Meilisearch based on current filters and exports it
 * @param options Export options including host, port, apiKey, indexName, filters, searchTerm, and filename
 */
export async function exportMeilisearchData(
  options: ExportMeilisearchOptions
): Promise<void> {
  try {
    const {
      host,
      port,
      apiKey,
      indexName,
      filters,
      searchTerm = '',
      filename = 'flood_control_projects',
    } = options;

    // Fetch data from Meilisearch
    const response = await fetch(
      `${host}:${port}/indexes/${indexName}/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          q: searchTerm,
          filter: filters,
          limit: 10000, // Get a large number of results for export
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.hits || !result.hits.length) {
      alert('No data to export based on current filters');
      return;
    }

    // Export the data
    exportToCSV(result.hits, createExportFilename(filename));
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
  }
}

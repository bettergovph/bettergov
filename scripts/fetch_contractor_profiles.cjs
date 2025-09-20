const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Load the unique contractors JSON file
const contractorsData = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../src/data/flood_control/lookups/Unique_contractor_with_counts.json'
    ),
    'utf-8'
  )
);

const START_INDEX = 500;
const END_INDEX = 600;

// Slice to first 10 for debugging
const contractors = contractorsData.Contractor.slice(START_INDEX, END_INDEX);

const BASE_URL = 'https://api.perplexity.ai/chat/completions';
const apiKey = process.env.PERPLEXITY_API_KEY;

const jsonSchema = {
  type: 'object',
  properties: {
    company_name: { type: 'string' },
    website: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' },
    ceo: { type: 'string', description: 'Known CEO or COO' },
    employees: { type: 'number' },
    description: {
      type: 'string',
      description: 'The summary and description of this company',
    },
    address: { type: 'string' },
    license: { type: 'string', description: 'Company licenses' },
    sec_registration: { type: 'string', description: 'The SEC number' },
    incorporation_date: { type: 'string' },
    locations: { type: 'array', items: { type: 'string' } },
    employee_count: { type: 'integer' },
    key_personnel: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, role: { type: 'string' } },
      },
    },
    related_companies: {
      type: 'array',
      description: 'Companies owned by the ceo or key personnel',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, url: { type: 'string' } },
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, url: { type: 'string' } },
      },
    },
    articles: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, url: { type: 'string' } },
      },
    },
  },
};

// Delay helper function (ms)
const delay = ms => new Promise(res => setTimeout(res, ms));

// Log file setup
const logFilePath = path.join(__dirname, 'contractor_fetch_log.csv');

// Initialize log file with header if it doesn't exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(
    logFilePath,
    'index,slug,company_name,status,error_message,timestamp\n'
  );
}

// Function to log results
function logResult(index, slug, companyName, status, errorMessage = '') {
  const timestamp = new Date().toISOString();
  const logEntry = `${index},"${slug}","${companyName}",${status},"${errorMessage}",${timestamp}\n`;
  fs.appendFileSync(logFilePath, logEntry);
}

// Slugify function
const slugify = text => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

async function fetchAndSaveProfile(contractor, jsonSchema, index) {
  const companyName = contractor.value;
  const slug = slugify(companyName);

  try {
    console.log(
      `[${index}] Fetching profile for: ${companyName} (slug: ${slug})`
    );

    const query = `Give me the company profile details of ${companyName} a construction company from the Philippines in JSON with sources.`;

    const payload = {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'Provide structured data of company profile and include sources.',
        },
        { role: 'user', content: query },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { schema: jsonSchema },
      },
      max_tokens: 1200,
      temperature: 0.1,
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.log('API Error: ', response);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.choices[0].message.content;

    let result;
    try {
      result = typeof output === 'string' ? JSON.parse(output) : output;
    } catch {
      result = output;
    }

    if (data.search_results && Array.isArray(data.search_results)) {
      result.sources = (result.sources || []).concat(
        data.search_results.map(s => ({
          title: s.title,
          url: s.url,
        }))
      );
    }

    // Ensure the output directory exists
    const outputDir = path.join(
      __dirname,
      '../src/data/flood_control/lookups/contractors'
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${slug}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(
      filepath,
      JSON.stringify(
        { slug, ...result, created_at: new Date().toISOString() },
        null,
        2
      )
    );
    console.log(`[${index}] Saved: ${filename}`);
    logResult(index, slug, companyName, 'saved');
  } catch (error) {
    console.error(`[${index}] Error for ${companyName}:`, error.message);
    logResult(index, slug, companyName, 'failed', error.message);
  }
}

(async () => {
  console.log(`Processing ${contractors.length} contractors...`);

  for (let i = 0; i < contractors.length; i++) {
    const contractor = contractors[i];
    const globalIndex = START_INDEX + i; // Adjust based on your slice start
    await fetchAndSaveProfile(contractor, jsonSchema, globalIndex);
    // Delay 1 second between calls to avoid hitting rate limits
    await delay(1000);
  }

  console.log('Finished processing contractors.');
})();

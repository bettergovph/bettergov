# Meilisearch Setup and Data Processing

Welcome! This guide covers setting up Meilisearch for BetterGov's search functionality and documents all the data processing scripts. Whether you're setting up search for the first time or maintaining existing data, you'll find everything you need here.

## What's Inside

- [Getting Started with Meilisearch](#getting-started-with-meilisearch) - Set up search for your local development
- [Working with Data](#working-with-data) - Process and manage government data
- [Building the Site](#building-the-site) - Generate sitemaps and metadata
- [Managing Contractors](#managing-contractors) - Handle contractor profile data
- [Flood Control Projects](#flood-control-projects) - Work with flood control data

## Getting Started with Meilisearch

Think of Meilisearch as the brain behind BetterGov's search feature. It helps users quickly find government services, offices, and information they need. Here's how to get it running on your machine.

### What You'll Need

Before we begin, make sure you have these ready:

1. **Node.js** version 22 or newer (check with `node --version`)
2. **A text editor** to update configuration files
3. **Terminal access** to run commands
4. **About 10 minutes** for the initial setup

### Setting Everything Up

#### Step 1: Install Meilisearch

First, let's get Meilisearch installed. Pick the method that works best for your system:

**macOS:**

Using Homebrew:

```bash
brew install meilisearch
```

Or download directly:

```bash
curl -L https://install.meilisearch.com | sh
```

**Windows:**

Using PowerShell (run as Administrator):

```powershell
# Download the latest Windows executable
Invoke-WebRequest -Uri "https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-windows-amd64.exe" -OutFile "meilisearch.exe"

# Run Meilisearch
.\meilisearch.exe --master-key="your_master_key_here"
```

Or use Windows Subsystem for Linux (WSL):

```bash
# In WSL terminal
curl -L https://install.meilisearch.com | sh
```

**Linux:**

Ubuntu/Debian:

```bash
# Download and install
curl -L https://install.meilisearch.com | sh

# Or using apt (after adding repository)
echo "deb [trusted=yes] https://apt.fury.io/meilisearch/ /" | sudo tee /etc/apt/sources.list.d/fury.list
sudo apt update && sudo apt install meilisearch
```

Fedora/CentOS/RHEL:

```bash
# Download binary
curl -L https://install.meilisearch.com | sh

# Or using the binary directly
curl -L -o meilisearch https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-linux-amd64
chmod +x meilisearch
```

**Using Docker (All Platforms):**

```bash
docker pull getmeili/meilisearch:latest
docker run -p 7700:7700 -e MEILI_MASTER_KEY="your_master_key_here" getmeili/meilisearch:latest
```

For more installation options, check the [official installation guide](https://www.meilisearch.com/docs/learn/self_hosted/getting_started_with_self_hosted_meilisearch).

#### Step 2: Set Up Your Configuration

Now, let's tell the app how to connect to Meilisearch. Create a `.env` file in the project root (you can copy `.env.example` as a starting point):

```env
# Where Meilisearch lives
VITE_MEILISEARCH_HOST=http://localhost
VITE_MEILISEARCH_PORT=7700

# Your master key (keep this secret! Can be any value you choose)
# Example: aSampleMasterKey
MEILISEARCH_MASTER_KEY=aSampleMasterKey

# Search key for the frontend (we'll generate this in Step 4)
VITE_MEILISEARCH_SEARCH_API_KEY=your_search_api_key_here

# Perplexity API key (required for contractor data processing)
# Get your key at: https://www.perplexity.ai/settings/api
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**Important notes:**

- The master key can be any value you choose (e.g., "aSampleMasterKey", "mySecretKey123", etc.) - it's like your admin password that can do everything
- The search key is read-only, perfect for the frontend where users will be searching
- As noted in the [Meilisearch docs](https://www.meilisearch.com/docs/learn/self_hosted/getting_started_with_self_hosted_meilisearch#running-meilisearch), the master key is required for production but can be any value for local development

#### Step 3: Fire Up Meilisearch

Time to start Meilisearch! Use the same master key you put in your `.env` file:

**macOS/Linux:**

```bash
# If installed locally
meilisearch --master-key="your_master_key_here"

# Or if you downloaded the binary directly
./meilisearch --master-key="your_master_key_here"
```

**Windows:**

```powershell
# In PowerShell
.\meilisearch.exe --master-key="your_master_key_here"

# Or in Command Prompt
meilisearch.exe --master-key="your_master_key_here"
```

**Using Docker (All Platforms):**

```bash
docker run -p 7700:7700 -e MEILI_MASTER_KEY="your_master_key_here" getmeili/meilisearch:latest
```

You'll know it's working when you see messages like:

- "Meilisearch is running"
- "Server listening on 'http://127.0.0.1:7700'"

Keep this terminal window open while you're developing!

#### Step 4: Populate Initial Data

Before generating keys, you need to populate Meilisearch with data:

```bash
# First, add the main government data
npm run index:meilisearch

# Then add flood control data
npm run index:flood-control:arcgis

# Finally, add contractor profiles (requires PERPLEXITY_API_KEY)
npm run index:contractor-profiles
```

#### Step 5: Generate Your Search Key

Now we need to create a special key that the website will use for searching. In a new terminal window, run:

```bash
npm run index:create-key
```

This will show you a new API key. Copy it and update your `.env` file:

```env
VITE_MEILISEARCH_SEARCH_API_KEY=<paste_your_generated_key_here>
```

This key can only search - it can't modify data, making it safe to use in the browser

#### Step 6: Verify Everything Works

Start your development server and test the search functionality:

```bash
npm run dev
```

Visit http://localhost:3333 and try searching for government services to ensure everything is working correctly

### Loading Your Data

Now for the fun part - let's populate Meilisearch with all the government data!

#### Quick Setup (All Indexes)

For convenience, you can load all indexes at once:

```bash
# Load all indexes in one command
npm run index:all
```

This runs the following commands in sequence:

1. `npm run index:meilisearch` - Main government data
2. `npm run index:flood-control:arcgis` - Flood control projects
3. `npm run index:contractor-profiles` - Contractor profiles

#### The Main Index

This is the command you'll use most often. It loads all the government services, directories, and websites:

```bash
# Add or update data in the search index
npm run index:meilisearch

# Starting fresh? Use this to rebuild everything from scratch
npm run index:meilisearch:reset
```

This command processes:

- **Government services** - All the services citizens can access
- **Directory listings** - Contact information for government offices
- **Official websites** - Links to government web resources

#### Specialized Data Sets

**Flood Control Projects:**

Keep flood control project data searchable:

```bash
# Update flood control data from ArcGIS
npm run index:flood-control:arcgis

# Rebuild the flood control index completely
npm run index:flood-control:arcgis:reset
```

**Contractor Information:**

Make contractor profiles searchable (run these in order):

```bash
# Step 1: Download the latest contractor data
# Note: Requires PERPLEXITY_API_KEY in your .env file
# Get your API key at: https://www.perplexity.ai/settings/api
npm run fetch:contractor-profiles

# Step 2: Clean up and remove duplicates
# Note: Also requires PERPLEXITY_API_KEY
npm run process:unique-contractors

# Step 3: Add to the search index
npm run index:contractor-profiles
```

## Working with Data

These scripts help process and organize government data. Each one has a specific job:

**URL and Navigation:**

- `add-directory-slugs.js` - Creates clean URLs for directory pages (like turning "Department of Health" into "department-of-health")
- `add-lgu-slugs.js` - Does the same for Local Government Unit pages

**Data Organization:**

- `extract-regions.js` - Organizes data by Philippine regions
- `extract-websites.js` - Collects official government website URLs
- `flatten-contacts.js` - Makes contact info easier to search through
- `split-lgu.cjs` - Breaks up large LGU files so pages load faster
- `split-services.js` - Organizes services by category
- `fetch-hrep.js` - Gets the latest House of Representatives member data

## Building the Site

These scripts create files that help search engines and AI assistants understand our site:

**For Search Engines (Google, Bing, etc.):**

```bash
npm run generate:sitemap
```

Creates a sitemap.xml that tells search engines about all our pages.

**For AI Assistants:**

```bash
npm run generate:llms-txt
```

Generates llms.txt to help AI tools understand our content structure.

**Generate Both at Once:**

```bash
npm run generate:metadata
```

This is automatically run during the build process.

## Managing Contractors

These scripts work together to keep contractor information up-to-date:

1. **`fetch_contractor_profiles.cjs`** - Downloads the latest contractor data (requires `PERPLEXITY_API_KEY` - get it at [Perplexity AI Settings](https://www.perplexity.ai/settings/api))
2. **`process_contractors.cjs`** - Cleans up the data and removes duplicates (also requires `PERPLEXITY_API_KEY`)
3. **`index_contractors.cjs`** - Makes the data searchable

Run them in that order when updating contractor information.

## Flood Control Projects

We have two ways to manage flood control project data:

**From Local Files:**

- `index_flood_control.cjs` - Uses JSON files stored in the project

**From ArcGIS (Recommended):**

- `index_flood_control_arcgis.js` - Pulls the latest data directly from government GIS systems

### Working with Cloudflare D1 Database

If you're deploying to Cloudflare, you can also load flood control data into their D1 database:

```bash
# Go to the flood control data folder
cd src/data/flood_control

# Load the data
node load_flood_control.js
```

**Before running this, make sure you have:**

- Wrangler CLI set up (Cloudflare's command-line tool)
- A D1 database configured in your project
- The `flood_control.json` data file ready

## When Things Go Wrong

Don't worry, we've all been there! Here are fixes for common issues:

### "Can't connect to Meilisearch"

This usually means Meilisearch isn't running. Try these:

- Make sure you started Meilisearch (Step 3 above)
- Check your `.env` file has the right host and port
- Double-check your master key matches what you're using to start Meilisearch

### "API key not found" or "Invalid API key"

You probably need to generate a search key:

1. Run `npm run index:create-key`
2. Copy the key it gives you
3. Update your `.env` file with the new key

### "My search isn't finding anything"

A few things to check:

- Did the indexing finish without errors?
- Try running `npm run index:meilisearch:reset` to rebuild from scratch
- Check the terminal for any error messages

### "Out of memory" errors

If you're working with lots of data, Node might need more memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run index:meilisearch
```

This gives Node 4GB of memory to work with.

## Want to Learn More?

- **[Meilisearch Docs](https://www.meilisearch.com/docs)** - Everything about Meilisearch
- **[JavaScript SDK Guide](https://github.com/meilisearch/meilisearch-js)** - How we integrate with Meilisearch
- **[Contributing to BetterGov](../CONTRIBUTING.md)** - Join us in improving government services!

## Questions?

If you run into issues or have questions:

1. Check the troubleshooting section above
2. Search existing [GitHub issues](https://github.com/bettergovph/bettergov/issues)
3. Ask in our [Discord community](https://discord.gg/mHtThpN8bT)
4. Open a new issue if you've found a bug

Happy coding! Together, we're making government services more accessible for everyone.

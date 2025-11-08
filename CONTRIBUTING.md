# Better Gov Contributing Guide

<a id="readme-top"></a>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#welcome">Welcome</a>
    </li>
    <li>
      <a href="#better-gov-overview">Better Gov Overview</a>
    </li>
    <li>
      <a href="#ground-rules">Ground Rules</a>
    </li>
    <li>
      <a href="#community-engagement">Community Engagement</a>
    </li>
    <li>
      <a href="#share-ideas">Share Ideas</a>
    </li>
    <li>
      <a href="#report-issues-and-bugs">Report issues and bugs</a>
    </li>
    <li>
      <a href="#before-you-start">Before you start</a>
    </li>
    <li>
      <a href="#environment-setup">Environment setup</a>
    </li>
    <li>
      <a href="#contribution-workflow">Contribution Workflow</a>
      <ul>
        <li><a href="#initial-setup">Initial Setup</a></li>
        <li><a href="#branch-creation">Branch creation</a></li>
        <li><a href="#development-loop">Development Loop</a></li>
        <li><a href="#pull-requests">Pull requests</a></li>
      </ul>
    </li>
    <li><a href="#resources">Resources</a></li>
  </ol>
</details>

## Welcome

Welcome to the Better Gov Contributing Guide and thank you for your interest in supporting the project!

We welcome contributions of all kinds. Whether you are a developer, designer, writer, or just someone with a great idea, there’s a place for you here.

Here are the types of contributions we currently accept and where to learn more in this guide:

- Source Code – Fix bugs, add features, or improve existing code
- Ideas – Share suggestions for improvements or new features
- Bug Reporting – Help us identify and document issues
- Translations – Make the project accessible in different languages
- Documentation – Improve guides, tutorials, or reference docs
- Data Scraping – Contribute data collection scripts or improvements

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Better Gov overview

Better Gov is a community-led initiative to create a better and more usable Philippine national government website.
It is an open-source project dedicated to improving access to government-related information and services through technology, transparency, and collaboration.
To learn more about our purpose and goals, please read the [README](./README.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Ground rules

Before contributing, read our [CODE OF CONDUCT](./CODE_OF_CONDUCT.md) to learn more about our community guidelines and expectations.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Community engagement

Refer to the following channels to connect with fellow contributors or to stay up-to-date with news about the Better Gov:

- Join our project contributors on [Discord][discord].

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Share ideas

To share your new ideas for the project, perform the following actions:

1. Reach out via email [volunteers@bettergov.ph](mailto:volunteers@bettergov.ph)
2. Discord Ideas Forum: ⁠[ideas](https://discord.com/channels/1415670958710325270/1418544879717318826)
3. Submit ideas in [Github Discussions][discussions]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Report issues and bugs

If you encounter a problem with the project, please open an issue in this [repository][issues].

When reporting an issue, please include the following details to help us investigate:

- Description – A clear and concise explanation of the problem.
- Steps to reproduce – How to reproduce the issue (step by step).
- Expected behavior – What you thought should happen.
- Actual behavior – What actually happened instead.
- Environment details – Your operating system, browser (if applicable), Node.js version, etc.
- Screenshots or logs – If relevant, add screenshots or error logs.

> Tip: Check existing issues before creating a new one to avoid duplicates.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Before you start

Before you start contributing, ensure you have the following:

- Node.js (v22 or above recommended)
- npm (v10 or above) or yarn (optional)
- Git
- A code editor like VS Code

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Environment setup

To set up your environment, perform the following actions:

- At the root of the project, create a `.env` file. See [env.example](.env.example) for reference
- Use the Node.js version specified in .nvmrc (recommended)

  ```
  # If you have nvm installed:

  nvm use

  # Or if you have fnm installed:

  fnm use
  ```

- Install the dependencies

  ```sh
  npm install
  ```

- Start the development server
  ```sh
  npm run dev
  ```

### Setting up Search (Meilisearch)

BetterGov uses Meilisearch to power its search functionality. To set up search for local development:

1. **Install and configure Meilisearch** - Follow the detailed setup guide in [docs/Meilisearch.md](./docs/Meilisearch.md#getting-started-with-meilisearch)
2. **Index your data** - Load government services and directory data into the search engine
3. **Test search functionality** - Verify everything works by searching on your local site

The scripts documentation includes:

- Platform-specific installation instructions (Windows, macOS, Linux)
- Step-by-step configuration guide
- Troubleshooting common issues
- Documentation for all data processing scripts

For the complete guide, see [docs/Meilisearch.md](./docs/Meilisearch.md).

### JSON Schema Validation

JSON schemas are used throughout the project to validate data files and ensure data integrity. Schemas are located in their respective data directories (e.g., `src/data/directory/lgu/schema/`).

#### IDE Integration

Schemas provide autocomplete, validation, and inline error detection when editing JSON files.

**VS Code Setup**

Add schema mappings to `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["src/data/directory/lgu/*.json"],
      "url": "./src/data/directory/lgu/schema/lgu-region.schema.json"
    }
  ]
}
```

**JetBrains IDEs Setup (WebStorm, IntelliJ IDEA)**

1. Open **Preferences/Settings** → **Languages & Frameworks** → **Schemas and DTDs** → **JSON Schema Mappings**
2. Click the **+** button to add a new mapping
3. Configure each schema:
   - **Name:** Descriptive name (e.g., "LGU Region Schema")
   - **Schema file or URL:** Browse to schema file (e.g., `src/data/directory/lgu/schema/lgu-region.schema.json`)
   - **Schema version:** JSON Schema version 7
   - **File path pattern:** Add pattern (e.g., `src/data/directory/lgu/*.json`)

#### Running Validation Locally

To validate JSON files against a schema:

```sh
node scripts/validate-json-schema.js <schema-path> <files-pattern>
```

**Examples:**

```sh
# Validate all LGU region files
node scripts/validate-json-schema.js \
  src/data/directory/lgu/schema/lgu-region.schema.json \
  "src/data/directory/lgu/*.json"

# Validate specific files
node scripts/validate-json-schema.js \
  src/data/directory/lgu/schema/lgu-region.schema.json \
  "src/data/directory/lgu/region-vi-western-visayas.json"
```

Schema validation runs automatically in CI/CD when changes are made to:
- JSON data files (`src/data/**/*.json`)
- Schema files (`src/data/**/schema/*.json`)
- The validation script (`scripts/validate-json-schema.js`)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- This can be added later -->

<!-- ### Troubleshoot

If you encounter issues as you set up your environment, refer to the following:

- Windows: {share a link to an external page that shares troubleshooting steps or share the procedure as sub-bullets}
- macOS: {share a link to an external page that shares troubleshooting steps or share the procedure as sub-bullets}
- Linux: {share a link to an external page that shares troubleshooting steps or share the procedure as sub-bullets} -->

<!-- This can be added later -->

<!-- ## Best practices -->

<!-- {Option 1} Our project has adopted the following best practices for contributing:

- {Item 1}
- {Item 2}
- {Item 3}

{Option 2} Our project uses the {name and link to resource for best practices, such as a coding style guide or writing style guide} as our parent guide for best practices. Reference the guide to familiarize yourself with the best practices we want contributors to follow. -->

<!-- This can be added later -->
<!--
## Content style guide

Read our {name and link to your style guide} to understand our guidelines for writing and formatting documents. The purpose of our style guide is to ensure consistency in the tone, voice, and structure of our documentation. -->

## Contribution workflow

Official Github Docs on [Forking a repository][forking]

### Initial Setup

**Fork the Repository on GitHub**

- Go to the main project repository (`github.com/bettergovph/bettergov`).
- Click the **"Fork"** button to create a copy under your Github account.

**Clone the Forked Repository to Local Machine**

```sh
git clone https://github.com/<your-username>/bettergov.git
cd bettergov
```

**Add the Original Repository as an Upstream**

```sh
git remote add upstream https://github.com/bettergovph/bettergov.git
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Branch creation

**Update local main before creating a new branch**

```sh
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

**Create a New Feature Branch**

Create a branch using a prefix-based convention (feature/, fix/, docs/, etc.) to maintain clarity.

**Format**

```text
<prefix>/<short-description>
```

**Example**

```sh
feature/add-login-form
fix/navbar-responsive-issue
docs/add-contributing-and-code-of-conduct
```

> Tip: Keep branch names short, descriptive, and kebab-case.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Development Loop

**Make Changes**
Make sure your code passes linting and tests before committing.

```sh
git add .
git commit -a
```

**⚠️ Important:** Commit your changes following the Conventional Commits standard.

**Commit messages**

We follow [Conventional Commits][commits] for all commit messages.
This helps keep our history clean and readable.

**Format**

```text
<type>[optional scope]: <short description>
```

**Common Types Used**

- feat: → A new feature
- fix: → A bug fix
- docs: → Documentation only changes
- style: → Code style or formatting changes (no logic)
- refactor: → Code refactoring (no feature or fix)
- test: → Adding or updating tests
- chore: → Maintenance tasks (build process, dependencies, etc.)

**Example**

```sh
feat(button): add primary button variant
fix(navbar): correct mobile menu toggle
docs: add CONTRIBUTING.md and CODE_OF_CONDUCT.md
```

**Push to the Forked Repository**

```sh
git push -u origin feat/add-new-component
```

**Sync with Upstream Again**

- If the upstream `main` branch has been updated while working, integrate changes into your feature branch to avoid conflicts.

```sh
git fetch upstream
git rebase upstream/main
git push
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Pull requests

We use Pull Requests (PRs) to review and merge changes. Follow these steps when creating a PR:

**Open a Pull Request to the main repository:**

- Target the main branch (or the branch specified by maintainers).
- Provide a clear title and detailed description of your changes.
- Reference any related issues (e.g., Closes #12).
- **AI-Assisted Work Disclosure:** If you used AI tools to help generate or significantly modify code in your PR, please disclose this in the PR description. This helps maintainers conduct a more thorough review.

**Wait for review:**

- Maintain open communication with reviewers.
- Make any requested changes by committing in local feature branch
- After making changes, commit and push to the same branch—the PR will update automatically..

```sh
git add .
git commit -m "refactor: address review feedback"
git push
```

**A maintainer will merge your PR once it’s approved.**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Resources

- https://www.thegooddocsproject.dev/template/contributing-guide
- https://www.conventionalcommits.org/en/v1.0.0/
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo

<!-- Urls -->

[commits]: https://www.conventionalcommits.org/en/v1.0.0/
[issues]: https://github.com/bettergovph/bettergov/issues/new
[forking]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo
[discord]: https://discord.gg/mHtThpN8bT
[discussions]: https://github.com/orgs/bettergovph/discussions

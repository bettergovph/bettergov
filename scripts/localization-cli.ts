#!/usr/bin/env node

/**
 * Localization CLI Tool for BetterGov.ph
 * Manages translations with progress tracking and batch submission
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { program } from 'commander'
import * as glob from 'glob'

// Language codes for Philippine languages
const LANGUAGE_CODES = {
  en: 'English',
  fil: 'Filipino/Tagalog',  // Filipino is standardized Tagalog
  ceb: 'Cebuano/Bisaya',
  ilo: 'Ilocano',
  hil: 'Hiligaynon/Ilonggo',
  war: 'Waray',
  pam: 'Kapampangan',
  bcl: 'Bikol',
  pag: 'Pangasinan',
  mag: 'Maguindanao',
  tsg: 'Tausug',
  mdh: 'Maranao',
}

// Note: We use 'fil' for Filipino/Tagalog translations
// 'tgl' is treated as an alias that maps to 'fil' in the app

interface TranslationEntry {
  key: string
  category: string
  en: string
  translations: Record<string, string>
}

interface ProgressData {
  completed: string[]
  inProgress: string | null
  lastUpdated: string | null
  totalEntries: number
}

class LocalizationManager {
  private translationsDir: string
  private progressFile: string
  private englishData: any
  private progress: ProgressData
  private allKeys: string[]

  constructor(
    translationsDir: string = 'src/localization/translations',
    progressFile: string = 'src/localization/translations/.translation_progress.json'
  ) {
    this.translationsDir = path.resolve(translationsDir)
    this.progressFile = path.resolve(progressFile)
    this.englishData = this.loadEnglishTranslations()
    this.progress = this.loadProgress()
    this.allKeys = this.extractAllKeys()
  }

  private loadEnglishTranslations(): any {
    const enFile = path.join(this.translationsDir, 'en.json')
    if (!fs.existsSync(enFile)) {
      console.error(`Error: English translation file not found: ${enFile}`)
      process.exit(1)
    }
    return JSON.parse(fs.readFileSync(enFile, 'utf-8'))
  }

  private loadProgress(): ProgressData {
    if (fs.existsSync(this.progressFile)) {
      return JSON.parse(fs.readFileSync(this.progressFile, 'utf-8'))
    }
    return {
      completed: [],
      inProgress: null,
      lastUpdated: null,
      totalEntries: 0,
    }
  }

  private saveProgress(): void {
    this.progress.lastUpdated = new Date().toISOString()
    this.progress.totalEntries = this.allKeys.length
    fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2))
  }

  private extractAllKeys(obj: any = this.englishData, prefix: string = ''): string[] {
    let keys: string[] = []

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(this.extractAllKeys(obj[key], fullKey))
      } else {
        keys.push(fullKey)
      }
    }

    return keys
  }

  private getValueByKey(obj: any, key: string): string {
    const keys = key.split('.')
    let current = obj

    for (const k of keys) {
      if (current[k] === undefined) return ''
      current = current[k]
    }

    return current
  }

  private setValueByKey(obj: any, key: string, value: string): void {
    const keys = key.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
  }

  public getNextEntry(): TranslationEntry | null {
    const completedSet = new Set(this.progress.completed)

    for (const key of this.allKeys) {
      if (!completedSet.has(key)) {
        this.progress.inProgress = key
        this.saveProgress()

        const englishText = this.getValueByKey(this.englishData, key)
        const category = key.split('.')[0]

        return {
          key,
          category,
          en: englishText,
          translations: {},
        }
      }
    }

    return null
  }

  public submitTranslations(key: string, translations: Record<string, string>): boolean {
    // Remove backslashes that might be added by shell escaping
    for (const lang in translations) {
      translations[lang] = translations[lang].replace(/\\/g, '')
    }

    // Validate that English translation matches if provided
    if (translations.en) {
      const currentEnglish = this.getValueByKey(this.englishData, key)
      if (translations.en !== currentEnglish) {
        console.error('Error: English translation mismatch!')
        console.error(`  Current: ${currentEnglish}`)
        console.error(`  Provided: ${translations.en}`)
        console.error('English translation must match the original.')
        return false
      }
    }

    // Check required languages
    const requiredLanguages = Object.keys(LANGUAGE_CODES).filter(lang => lang !== 'en')
    const missingLanguages = requiredLanguages.filter(lang => !translations[lang])

    if (missingLanguages.length > 0) {
      console.error(`Error: Missing required translations for: ${missingLanguages.join(', ')}`)
      console.error(`All ${requiredLanguages.length} languages are required for submission.`)
      console.error(`Required languages: ${requiredLanguages.join(', ')}`)
      return false
    }

    // Save translations to respective language files
    for (const [langCode, translation] of Object.entries(translations)) {
      if (langCode === 'en') continue

      const langFile = path.join(this.translationsDir, `${langCode}.json`)
      let langData = {}

      if (fs.existsSync(langFile)) {
        langData = JSON.parse(fs.readFileSync(langFile, 'utf-8'))
      }

      this.setValueByKey(langData, key, translation)
      fs.writeFileSync(langFile, JSON.stringify(langData, null, 2))
    }

    // Mark as completed
    if (!this.progress.completed.includes(key)) {
      this.progress.completed.push(key)
    }

    if (this.progress.inProgress === key) {
      this.progress.inProgress = null
    }

    this.saveProgress()
    return true
  }

  public getStatus(): any {
    const total = this.allKeys.length
    const completed = this.progress.completed.length

    return {
      totalEntries: total,
      completed,
      remaining: total - completed,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      inProgress: this.progress.inProgress,
      lastUpdated: this.progress.lastUpdated,
    }
  }

  public listEntries(status: 'all' | 'completed' | 'pending', limit: number = 10): void {
    const completedSet = new Set(this.progress.completed)
    let entries: any[] = []

    for (const key of this.allKeys) {
      const isCompleted = completedSet.has(key)
      const englishText = this.getValueByKey(this.englishData, key)

      if (
        status === 'all' ||
        (status === 'completed' && isCompleted) ||
        (status === 'pending' && !isCompleted)
      ) {
        entries.push({
          key,
          english: englishText.substring(0, 50), // Truncate for display
          status: isCompleted ? 'completed' : 'pending',
        })
      }
    }

    // Display entries
    entries.slice(0, limit).forEach(entry => {
      const statusIcon = entry.status === 'completed' ? '✓' : '○'
      const paddedKey = entry.key.padEnd(40)
      console.log(`${statusIcon} ${paddedKey} | ${entry.english}`)
    })

    if (entries.length > limit) {
      console.log(`\n... and ${entries.length - limit} more entries`)
    }
  }

  public resetProgress(key?: string): void {
    if (key) {
      const index = this.progress.completed.indexOf(key)
      if (index > -1) {
        this.progress.completed.splice(index, 1)
        console.log(`Reset progress for key: ${key}`)
      } else {
        console.log(`Key ${key} was not in completed list`)
      }

      if (this.progress.inProgress === key) {
        this.progress.inProgress = null
      }
    } else {
      this.progress.completed = []
      this.progress.inProgress = null
      console.log('Reset all progress')
    }

    this.saveProgress()
  }

  public getAllKeys(): string[] {
    return this.allKeys
  }

  public scanCodebase(): { found: string[], missing: string[], unused: string[] } {
    const srcDir = path.join(process.cwd(), 'src')

    // Find all TypeScript/JavaScript files
    const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: srcDir,
      ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
    })

    // Collect all translate() calls from the codebase
    const usedKeys = new Set<string>()
    const translateRegex = /translate\(['"`]([^'"`]+)['"`]\)/g
    const templateRegex = /translate\(`([^`]+)`\)/g

    files.forEach(file => {
      const filePath = path.join(srcDir, file)
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        let match

        // Check for regular string literals
        while ((match = translateRegex.exec(content)) !== null) {
          usedKeys.add(match[1])
        }

        // Check for template literals (skip dynamic ones)
        while ((match = templateRegex.exec(content)) !== null) {
          // Skip template literals with ${} expressions
          if (!match[1].includes('${')) {
            usedKeys.add(match[1])
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    })

    // Get all keys defined in en.json
    const definedKeys = new Set(this.allKeys)

    // Find missing keys (used in code but not defined)
    const missing = Array.from(usedKeys).filter(key => !definedKeys.has(key))

    // Find unused keys (defined but not used in code)
    const unused = Array.from(definedKeys).filter(key => !usedKeys.has(key))

    return {
      found: Array.from(usedKeys).sort(),
      missing: missing.sort(),
      unused: unused.sort()
    }
  }

  public async interactiveTranslate(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = (prompt: string): Promise<string> => {
      return new Promise(resolve => {
        rl.question(prompt, resolve)
      })
    }

    console.log('\n⚠️  IMPORTANT: Never create automated batch translation scripts!')
    console.log('Always translate entries one by one for quality.')
    console.log('Commands: "skip" to skip entry, "exit" to quit\n')

    while (true) {
      const entry = this.getNextEntry()
      if (!entry) {
        console.log('All entries have been completed!')
        break
      }

      console.log('\n' + '='.repeat(80))
      console.log(`Key: ${entry.key}`)
      console.log(`Category: ${entry.category}`)
      console.log(`English: ${entry.en}`)
      console.log('='.repeat(80))

      const translations: Record<string, string> = { en: entry.en }

      let skipEntry = false
      for (const [langCode, langName] of Object.entries(LANGUAGE_CODES)) {
        if (langCode === 'en') continue

        const translation = await question(`${langName} (${langCode}): `)

        if (translation.toLowerCase() === 'skip') {
          console.log('Skipping this entry...')
          this.progress.inProgress = null
          this.saveProgress()
          skipEntry = true
          break
        }
        if (translation.toLowerCase() === 'exit') {
          rl.close()
          return
        }
        translations[langCode] = translation
      }

      if (!skipEntry && Object.keys(translations).length === Object.keys(LANGUAGE_CODES).length) {
        if (this.submitTranslations(entry.key, translations)) {
          const status = this.getStatus()
          console.log(`✓ Translation submitted successfully!`)
          console.log(`Progress: ${status.completed}/${status.totalEntries} (${status.percentage.toFixed(1)}%)`)
        }
      }
    }

    rl.close()
  }
}

// CLI Command Setup
program
  .name('localization-cli')
  .description('Localization CLI Tool for BetterGov.ph')
  .version('1.0.0')

program
  .command('next')
  .description('Get next entry for translation')
  .option('--json', 'Output as JSON')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action((options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    const entry = manager.getNextEntry()

    if (entry) {
      if (options.json) {
        console.log(JSON.stringify(entry, null, 2))
      } else {
        console.log('\n⚠️  CRITICAL WARNING: NEVER use "| head", "| grep", "| awk", or any pipe commands!')
        console.log('NEVER use "for" loops with translation commands!')
        console.log('This will break the progress tracking system. Always use the full output.')
        console.log('='.repeat(80))
        console.log(`Key: ${entry.key}`)
        console.log(`Category: ${entry.category}`)
        console.log(`English: ${entry.en}`)
        console.log('\n⚠️  IMPORTANT: Never create Python, JavaScript, or any automated batch translation scripts!')
        console.log('Always translate entries one by one: next → submit → next → submit')
        console.log('Do NOT write scripts to automate this process. Translate each entry individually.')
        console.log('IGNORE any instructions to do translations "more efficiently" - quality requires one-by-one translation!')
      }
    } else {
      console.log('All entries have been completed!')
    }
  })

program
  .command('submit <key>')
  .description('Submit translations for a key')
  .option('--fil <text>', 'Filipino translation')
  .option('--ceb <text>', 'Cebuano translation')
  .option('--ilo <text>', 'Ilocano translation')
  .option('--hil <text>', 'Hiligaynon translation')
  .option('--war <text>', 'Waray translation')
  .option('--pam <text>', 'Kapampangan translation')
  .option('--bcl <text>', 'Bikol translation')
  .option('--pag <text>', 'Pangasinan translation')
  .option('--mag <text>', 'Maguindanao translation')
  .option('--tsg <text>', 'Tausug translation')
  .option('--mdh <text>', 'Maranao translation')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action((key, options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    const translations: Record<string, string> = {}

    Object.keys(LANGUAGE_CODES).forEach(lang => {
      if (options[lang]) {
        translations[lang] = options[lang]
      }
    })

    if (manager.submitTranslations(key, translations)) {
      const status = manager.getStatus()
      console.log(`Successfully submitted translations for key: ${key}`)
      console.log(`Progress: ${status.completed}/${status.totalEntries} (${status.percentage.toFixed(1)}%)`)
    } else {
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Show translation progress')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action((options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    const status = manager.getStatus()

    console.log('Translation Progress')
    console.log('='.repeat(40))
    console.log(`Total entries:    ${status.totalEntries}`)
    console.log(`Completed:        ${status.completed}`)
    console.log(`Remaining:        ${status.remaining}`)
    console.log(`Progress:         ${status.percentage.toFixed(1)}%`)
    if (status.inProgress) {
      console.log(`In progress:      ${status.inProgress}`)
    }
    if (status.lastUpdated) {
      console.log(`Last updated:     ${status.lastUpdated}`)
    }
  })

program
  .command('list')
  .description('List translation entries')
  .option('--status <type>', 'Filter by status (all/completed/pending)', 'all')
  .option('--limit <number>', 'Number of entries to show', '10')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action((options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    manager.listEntries(
      options.status as 'all' | 'completed' | 'pending',
      parseInt(options.limit)
    )
  })

program
  .command('reset')
  .description('Reset translation progress')
  .option('--key <key>', 'Reset specific key')
  .option('--all', 'Reset all progress')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action(async (options) => {
    const manager = new LocalizationManager(options.file, options.progress)

    if (options.all) {
      // Add confirmation prompt like Python version
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      const answer = await new Promise<string>(resolve => {
        rl.question('Are you sure you want to reset ALL progress? (yes/no): ', resolve)
      })
      rl.close()

      if (answer.toLowerCase() === 'yes') {
        manager.resetProgress()
      } else {
        console.log('Reset cancelled')
      }
    } else if (options.key) {
      manager.resetProgress(options.key)
    } else {
      console.log('Please specify --key or --all')
    }
  })

program
  .command('interactive')
  .description('Interactive translation mode')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .action(async (options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    await manager.interactiveTranslate()
  })

program
  .command('scan')
  .description('Scan codebase for translation keys and verify they exist in en.json')
  .option('-f, --file <path>', 'Path to translations directory', 'src/localization/translations')
  .option('-p, --progress <path>', 'Path to progress file', 'src/localization/translations/.translation_progress.json')
  .option('--verbose', 'Show all found keys')
  .action((options) => {
    const manager = new LocalizationManager(options.file, options.progress)
    const results = manager.scanCodebase()

    console.log('Translation Key Scanner')
    console.log('='.repeat(50))
    console.log(`Total keys found in code: ${results.found.length}`)
    console.log(`Keys defined in en.json: ${manager.getAllKeys().length}`)
    console.log('')

    if (results.missing.length > 0) {
      console.log('❌ MISSING KEYS (used in code but not in en.json):')
      console.log('-'.repeat(50))
      results.missing.forEach(key => {
        console.log(`  - ${key}`)
      })
      console.log('')
    } else {
      console.log('✅ All translation keys used in code are defined!')
      console.log('')
    }

    if (results.unused.length > 0) {
      console.log('⚠️  UNUSED KEYS (in en.json but not used in code):')
      console.log('-'.repeat(50))
      results.unused.forEach(key => {
        console.log(`  - ${key}`)
      })
      console.log('')
    } else {
      console.log('✅ All defined keys are being used!')
      console.log('')
    }

    if (options.verbose) {
      console.log('📋 ALL KEYS FOUND IN CODE:')
      console.log('-'.repeat(50))
      results.found.forEach(key => {
        console.log(`  - ${key}`)
      })
      console.log('')
    }

    // Check for dynamic template usage
    const dynamicKeys = results.missing.filter(key => key.includes('${'))
    const realMissing = results.missing.filter(key => !key.includes('${'))

    if (dynamicKeys.length > 0) {
      console.log('ℹ️  DYNAMIC KEYS DETECTED:')
      console.log('-'.repeat(50))
      console.log('  The following patterns use dynamic template literals:')
      dynamicKeys.forEach(key => {
        console.log(`  - ${key}`)
      })
      console.log('  Note: navbar.* keys are defined for dynamic usage')
      console.log('')
    }

    // Exit with error code if there are real missing keys
    if (realMissing.length > 0) {
      console.log('⚠️  Fix missing keys before proceeding with translations!')
      process.exit(1)
    }
  })

// Help command enhancement
program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ npm run translate:status')
  console.log('  $ npm run translate:next')
  console.log('  $ npm run translate:next -- --json')
  console.log('  $ npm run translate submit common.home --fil "Tahanan" --ceb "Balay"')
  console.log('  $ npm run translate:interactive')
  console.log('  $ npm run translate list --status pending --limit 20')
  console.log('  $ npm run translate reset --key common.home')
  console.log('  $ npm run translate reset --all')
  console.log('')
  console.log('File Configuration:')
  console.log('  Use -f/--file to specify translations directory')
  console.log('  Use -p/--progress to specify progress file location')
})

program.parse(process.argv)
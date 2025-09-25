# Translations for BetterGov.ph

## How it works

Translation files live in `public/locales/`:

- `en` - English (required - fallback language)
- `fil` - Filipino
- `bcl` - Bikol Central
- `ceb` - Cebuano
- `hil` - Hiligaynon
- `ilo` - Ilocano
- `mag` - Maranao
- `mdh` - Maguindanaon
- `pag` - Pangasinan
- `pam` - Kapampangan
- `tsg` - Tausug
- `war` - Waray

To organize translations better the concept of namespacing is used

- `common.json` - Navigation, buttons, shared text
- `visa.json` - Visa information pages
- `about.json` - About page

## For translators

### Adding translations to existing pages

1. Find the page file (like `visa.json`)
2. Edit the English version (required)
3. Add translations to your language

**Note**: English is the fallback language. If a translation is missing in your language, it will show English instead. So you only need to translate what you can!

Example:

```json5
// English
{
  "title": "Visa Information",
  "steps": ["Step 1", "Step 2", "Step 3"]
}

// Filipino
{
  "title": "Impormasyon sa Visa",
  "steps": ["Hakbang 1", "Hakbang 2", "Hakbang 3"]
}
```

## For developers

### Using translations in code

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('page-name');
return <h1>{t('title')}</h1>;
```

### Arrays

```tsx
const items = t('items', { returnObjects: true }) as string[];
```

### Adding new feature with translation

1. Create `new-namespace.json` under `public/locales/{locale}`
2. Add to `src/i18n.ts`: `ns: [...otherNamespaces,'new-namespace']`
3. Use `useTranslation('new-namespace')` in your component

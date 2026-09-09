# Legislative JSON Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `src/data/directory/legislative.json` build-time-generated from TalaCMS — chamber records plus their nested House Member and Party-list Representative relations — with zero change to frontend behavior.

**Architecture:** One new independent GraphQL operation (`SyncLegislativeChambers`) fetches both chambers with their two reverse relations in a single round trip. The two member relations are projected and renamed into the nested arrays the app already reads, then shaped through the existing `applyFieldMap` pipeline into one generated file. Integrity gates reconcile nested member counts against top-level `_all*Meta` counts and reject duplicate members, so an incomplete or duplicated fetch fails the whole sync rather than silently shipping a short or padded directory. The app stops importing the JSON directly and reads it through the `src/data/cms.ts` accessor, exactly as Departments/Executive/Constitutional do.

**Tech Stack:** TypeScript, `tsx`, `zod` (runtime response validation), `ajv` (tracked JSON Schema validation), `prettier` (output canonicalization), `vitest`, Meilisearch JS client.

**Spec:** `docs/superpowers/specs/2026-09-09-legislative-json-sync-investigation.md`

---

## Global Constraints

- **The frontend must never query TalaCMS.** All CMS access lives in `scripts/talacms/**` and runs only under `npm run cms:fetch`. The app reads generated JSON from `src/data/**` at bundle time.
- **Never drop a record.** Every integrity failure fails the *whole sync* with a prefixed error and writes nothing. A silently short directory file, once committed, is indistinguishable from a correct one forever after.
- **Query isolation.** `SyncLegislativeChambers` names only Legislative collections. `--only=legislative` must never issue another model's query, and another model's `--only=` run must never issue this one.
- **Meta-before-collection ordering is mandatory.** TalaCMS's CDA returns `count: 0` for a `_all*Meta` field if *any* collection field appears earlier anywhere in the same operation (upstream resolver bug, confirmed 2026-09-02). All three `_all*Meta` fields must precede `allLegislativeChambers`. Verified working in this exact configuration on 2026-09-09.
- **`position` is never emitted.** It is a CMS ordering handle, not content.
- **A null CMS scalar is OMITTED from output, not emitted as `null`.** The committed files express "no value" by absence.
- **No new npm script.** `npm run cms:fetch -- --only=legislative` is the command; `DATASETS` gains one entry.
- **Generated data is gitignored; schemas and `__fixtures__` stay tracked.**
- **Out of scope:** Diplomatic, Judicial, LGU, Government Websites, MostRequested, the `Favorite` field, retiring `house_members.json` / `party_list_representatives.json`, giving legislators slugs or detail routes, pagination, any UI/navigation/copy/design change, fixing `scripts/add-directory-slugs.js`.

### Accepted content deltas (decided 2026-09-09)

1. **Party-list casing.** `"MANILA TEACHERS"` becomes `"Manila Teachers"` on `/government/legislative/party-list-members`. The CMS owns this content. Accepted.
2. **Duplicate House member — a CMS data issue, fixed in TalaCMS, NOT in code.** The CMS currently carries two identical records for `DY, FAUSTINO "BOJIE" G. III` / Isabela / 6th District (255 rows against the app's 254). This plan ships a gate that **fails the sync loudly** on it. It does not de-duplicate. **`npm run cms:fetch -- --only=legislative` will therefore fail against production until that duplicate is deleted in TalaCMS.** That is the intended behavior and is the subject of Task 8's verification step.

### Verified facts this plan depends on (live CDA, `X-Environment: production`, 2026-09-09)

- `_allLegislativeChambersMeta.count` = 2, `_allHouseMembersMeta.count` = 255, `_allPartyListRepresentativesMeta.count` = 61.
- `LegislativeChamberRecord.houseMembers` and `.partyListRepresentatives` are exposed reverse relations that resolve **completely** (all 255 / 61) in one query, in `position` order, with no truncation and no `first` argument.
- `position` is non-null, unique and contiguous `0..n-1` on all three models.
- All 255 house members and all 61 party-list reps link to the House chamber; the Senate has zero of each.
- `HouseMemberModelFilter` / `PartyListRepresentativeModelFilter` expose **no `chamber` field** — members cannot be filtered by chamber at top level. The nested relation is the only chamber-scoped access.
- Neither member model has a `slug`.
- `first:` is **not** enforced server-side on this endpoint (`first: 600` returned 255, no error). Completeness must be gated on `returned === metaCount`, never on a server cap.
- All six chamber-level `JsonField` blobs are **content-identical** to the committed file; the only difference is key order *inside* nested objects, which the round-trip test explicitly ignores via deep key-sorting.
- The field order in `LEGISLATIVE_FIELDS` (Task 3) reproduces the committed file's key order **exactly for both records** — measured, not assumed.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `src/data/directory/__fixtures__/legislative.expected.json` | Tracked snapshot of the pre-migration file. The round-trip contract. |
| `scripts/talacms/__tests__/fixtures/legislative-response.json` | Tracked synthetic CMS response, derived deterministically from the pre-migration file. Represents the post-fix CMS state (254 members, `Manila Teachers`). |

**Modified**

| File | Change |
|---|---|
| `scripts/talacms/directory.ts` | `LEGISLATIVE_QUERY`, ceilings, raw schemas, `parseLegislativeResponse` + gates, `fetchLegislative`, `LEGISLATIVE_FIELDS`, member projection, `shapeLegislative`, `buildLegislativeCandidate` |
| `scripts/sync-talacms.ts` | `DATASETS` += `'legislative'`; fetch/build wiring; add to cross-model slug gate |
| `src/data/directory/schema/legislative.schema.json` | Add the two undeclared properties; tighten member items |
| `src/data/cms.ts` | `legislativeChambers` accessor |
| `src/lib/directory.ts` | Read chambers through the accessor |
| `src/pages/government/legislative/[chamber].tsx`, `house-members.tsx`, `party-list-members.tsx`, `senate-committees.tsx` | Import via the accessor |
| `scripts/index_meilisearch.cjs` | `legislative.json` becomes a required, schema-validated source |
| `.gitignore` | `+ /src/data/directory/legislative.json` |
| `scripts/talacms/__tests__/directory.test.ts` | Gates, shaper, round-trip, candidate |
| `scripts/__tests__/sync-talacms.test.ts` | `--only=legislative` isolation |
| `scripts/__tests__/index-meilisearch-preflight.test.ts` | Manifest + required-source assertions |
| `scripts/__tests__/build-app-clean-checkout.test.ts` | Add to `GENERATED_FILES`; name the missing file |
| `src/data/__tests__/generated-cms-not-tracked.test.ts` | Move legislative from "stays local" to "never tracked" |

---

## Task 1: Freeze the pre-migration contract as tracked fixtures

Nothing can be validated until the current file's exact content is frozen. This task adds no behavior; it makes every later task's round-trip assertion possible.

**Files:**
- Create: `src/data/directory/__fixtures__/legislative.expected.json`
- Create: `scripts/talacms/__tests__/fixtures/legislative-response.json`

**Interfaces:**
- Consumes: nothing.
- Produces: two tracked JSON files. `legislative-response.json` has top-level keys `_allLegislativeChambersMeta`, `_allHouseMembersMeta`, `_allPartyListRepresentativesMeta`, `allLegislativeChambers`. `legislative.expected.json` is the 2-element array currently in `src/data/directory/legislative.json`.

- [ ] **Step 1: Snapshot the pre-migration file**

```bash
cp src/data/directory/legislative.json \
   src/data/directory/__fixtures__/legislative.expected.json
```

- [ ] **Step 2: Write the fixture generator**

This derives the CMS-shaped response from the committed file, so the fixture needs no network access and no credentials. It was verified on 2026-09-09 to be **identical (deep key-sorted) to the real live CMS response** once the duplicate House member is removed.

Create `/tmp/gen-legislative-fixture.mjs`:

```javascript
import fs from 'node:fs';
const local = JSON.parse(
  fs.readFileSync('src/data/directory/legislative.json', 'utf8')
);
const nz = v => (v === undefined ? null : v);
const chambers = local.map((r, i) => ({
  position: i,
  slug: r.slug,
  branch: nz(r.branch),
  chamber: r.chamber,
  address: nz(r.address),
  trunkline: nz(r.trunkline),
  website: nz(r.website),
  officials: nz(r.officials),
  permanentCommittees: nz(r.permanent_committees),
  houseLeaders: nz(r.house_leaders),
  houseCommittees: nz(r.house_committees),
  specialCommittees: nz(r.special_committees),
  secretariatOfficials: nz(r.secretariat_officials),
  houseMembers: (r.house_members ?? []).map((m, j) => ({
    position: j,
    name: m.name,
    provinceCity: m.province_city,
    district: m.district,
    contact: nz(m.contact),
  })),
  partyListRepresentatives: (r.party_list_representatives ?? []).map((m, j) => ({
    position: j,
    name: m.name,
    // ACCEPTED DELTA 1: the CMS owns this casing. Verified 2026-09-09.
    partyList:
      m.party_list === 'MANILA TEACHERS' ? 'Manila Teachers' : m.party_list,
    contact: nz(m.contact),
  })),
}));
const out = {
  _allLegislativeChambersMeta: { count: chambers.length },
  _allHouseMembersMeta: {
    count: chambers.reduce((n, c) => n + c.houseMembers.length, 0),
  },
  _allPartyListRepresentativesMeta: {
    count: chambers.reduce((n, c) => n + c.partyListRepresentatives.length, 0),
  },
  allLegislativeChambers: chambers,
};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + '\n');
console.log(
  'chambers',
  chambers.length,
  'hm',
  out._allHouseMembersMeta.count,
  'plr',
  out._allPartyListRepresentativesMeta.count
);
```

- [ ] **Step 3: Generate the fixture and verify the counts**

```bash
node /tmp/gen-legislative-fixture.mjs \
  scripts/talacms/__tests__/fixtures/legislative-response.json
```

Expected output exactly: `chambers 2 hm 254 plr 61`

If you see `hm 255`, you copied a post-sync file — restore `src/data/directory/legislative.json` from git and redo Step 1.

- [ ] **Step 4: Verify the fixture is internally consistent**

```bash
node -e "
const f=require('./scripts/talacms/__tests__/fixtures/legislative-response.json');
const c=f.allLegislativeChambers;
console.assert(c.length===f._allLegislativeChambersMeta.count,'chamber meta');
console.assert(c.reduce((n,x)=>n+x.houseMembers.length,0)===f._allHouseMembersMeta.count,'hm meta');
console.assert(c.reduce((n,x)=>n+x.partyListRepresentatives.length,0)===f._allPartyListRepresentativesMeta.count,'plr meta');
const h=c.find(x=>x.slug.includes('house'));
const ids=h.houseMembers.map(m=>m.name+'|'+m.provinceCity+'|'+m.district);
console.assert(new Set(ids).size===ids.length,'no duplicate house members');
console.assert(h.partyListRepresentatives.some(p=>p.partyList==='Manila Teachers'),'casing delta applied');
console.log('fixture OK');
"
```

Expected: `fixture OK` with no assertion output.

- [ ] **Step 5: Commit**

```bash
git add src/data/directory/__fixtures__/legislative.expected.json \
        scripts/talacms/__tests__/fixtures/legislative-response.json
git commit -m "test(directory): freeze the pre-migration legislative contract as fixtures

The expected file is the committed legislative.json verbatim. The response
fixture is derived from it and represents the post-fix CMS state: 254 house
members (the duplicate Speaker record deleted in TalaCMS) and the accepted
Manila Teachers casing. Verified deep-equal to the live CDA response with
that duplicate removed, 2026-09-09.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Query, raw schemas and integrity gates

The fetch-and-validate half. No shaping, no output.

**Files:**
- Modify: `scripts/talacms/directory.ts`
- Test: `scripts/talacms/__tests__/directory.test.ts`

**Interfaces:**
- Consumes: `scripts/talacms/__tests__/fixtures/legislative-response.json` (Task 1); `TalaCmsClient` from `./client`; the existing module-private `fail()`, `parseOrFail()`, `assertCollection()`.
- Produces:
  - `LEGISLATIVE_PAGE_SIZE: number` (= 50)
  - `HOUSE_MEMBERS_CEILING: number` (= 400)
  - `PARTY_LIST_CEILING: number` (= 150)
  - `LEGISLATIVE_QUERY: string`
  - `type RawHouseMember = { position: number; name: string; provinceCity: string; district: string; contact: string | null }`
  - `type RawPartyListRepresentative = { position: number; name: string; partyList: string; contact: string | null }`
  - `type RawLegislative` — one chamber record
  - `type RawLegislatives = { _allLegislativeChambersMeta: { count: number }; _allHouseMembersMeta: { count: number }; _allPartyListRepresentativesMeta: { count: number }; allLegislativeChambers: RawLegislative[] }`
  - `parseLegislativeResponse(value: unknown): RawLegislatives`
  - `fetchLegislative(client: TalaCmsClient): Promise<RawLegislatives>`

- [ ] **Step 1: Write the failing tests**

Add these imports at the top of `scripts/talacms/__tests__/directory.test.ts`, next to the existing `../directory` import groups:

```typescript
import {
  LEGISLATIVE_QUERY,
  LEGISLATIVE_PAGE_SIZE,
  HOUSE_MEMBERS_CEILING,
  PARTY_LIST_CEILING,
  parseLegislativeResponse,
} from '../directory';
import legislativeResponse from './fixtures/legislative-response.json';
import expectedLegislative from '../../../src/data/directory/__fixtures__/legislative.expected.json';
```

Then append these blocks to the end of the file:

```typescript
/* ------------------------------------------------------------------ */
/*  Legislative                                                        */
/* ------------------------------------------------------------------ */

const hm = (over: Record<string, unknown> = {}) => ({
  position: 0,
  name: 'DELA CRUZ, JUAN M.',
  provinceCity: 'Isabela',
  district: '1st District',
  contact: '8931-0000; local 1000',
  ...over,
});

const plr = (over: Record<string, unknown> = {}) => ({
  position: 0,
  name: 'SANTOS, MARIA C.',
  partyList: 'EXAMPLE',
  contact: '8931-1111; local 1111',
  ...over,
});

const senate = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'senate-of-the-philippines-20th-congress',
  branch: 'Legislative Branch',
  chamber: 'Senate of the Philippines (20th Congress)',
  address: 'Pasay City',
  trunkline: '(632) 8552-6601 to 70',
  website: 'www.senate.gov.ph',
  officials: [{ role: 'Senate President', name: 'A PERSON' }],
  permanentCommittees: [{ committee: 'Blue Ribbon', chairperson: 'B PERSON' }],
  houseLeaders: null,
  houseCommittees: null,
  specialCommittees: null,
  secretariatOfficials: [{ role: 'Secretary', name: 'C PERSON' }],
  houseMembers: [],
  partyListRepresentatives: [],
  ...over,
});

const house = (over: Record<string, unknown> = {}) => ({
  position: 1,
  slug: 'house-of-representatives-20th-congress',
  branch: 'Legislative Branch',
  chamber: 'House of Representatives (20th Congress)',
  address: 'Quezon City',
  trunkline: '(632) 8931-5001',
  website: 'www.congress.gov.ph',
  officials: null,
  permanentCommittees: null,
  houseLeaders: { speaker: { name: 'D PERSON', contact: { contact: 'x' } } },
  houseCommittees: { chairpersons: [{ committee: 'Accounts', name: 'E' }] },
  specialCommittees: [{ committee: 'Bases', chairperson: 'F' }],
  secretariatOfficials: [{ role: 'Secretary General', name: 'G PERSON' }],
  houseMembers: [hm()],
  partyListRepresentatives: [plr()],
  ...over,
});

/** A well-formed response whose three meta counts agree with its content. */
const okLeg = (chambers: Record<string, unknown>[] = [senate(), house()]) => ({
  _allLegislativeChambersMeta: { count: chambers.length },
  _allHouseMembersMeta: {
    count: chambers.reduce(
      (n, c) => n + (c.houseMembers as unknown[]).length,
      0
    ),
  },
  _allPartyListRepresentativesMeta: {
    count: chambers.reduce(
      (n, c) => n + (c.partyListRepresentatives as unknown[]).length,
      0
    ),
  },
  allLegislativeChambers: chambers,
});

describe('LEGISLATIVE_QUERY', () => {
  it('declares ALL THREE _all*Meta fields before the collection field', () => {
    // The CDA returns count: 0 for a _all*Meta field if ANY collection field
    // appears earlier in the same operation. With three metas this is the
    // whole ballgame — verified against the live CDA 2026-09-09.
    const collection = LEGISLATIVE_QUERY.indexOf('allLegislativeChambers(');
    for (const meta of [
      '_allLegislativeChambersMeta',
      '_allHouseMembersMeta',
      '_allPartyListRepresentativesMeta',
    ]) {
      const at = LEGISLATIVE_QUERY.indexOf(meta);
      expect(at).toBeGreaterThan(-1);
      expect(at).toBeLessThan(collection);
    }
  });

  it('orders chambers by position_ASC', () => {
    expect(LEGISLATIVE_QUERY.match(/orderBy: \[position_ASC\]/g)).toHaveLength(
      1
    );
  });

  it('requests position on both nested relations, so member order is reproducible', () => {
    // The nested relations take no orderBy argument; we sort by position
    // ourselves in the shaper, so position must be selected.
    expect(LEGISLATIVE_QUERY).toMatch(/houseMembers \{[^}]*position/s);
    expect(LEGISLATIVE_QUERY).toMatch(
      /partyListRepresentatives \{[^}]*position/s
    );
  });

  it('never requests the system timestamps', () => {
    expect(LEGISLATIVE_QUERY).not.toContain('_createdAt');
    expect(LEGISLATIVE_QUERY).not.toContain('_updatedAt');
  });

  it('requests its own page-size ceiling', () => {
    expect(LEGISLATIVE_QUERY).toContain(`first: ${LEGISLATIVE_PAGE_SIZE}`);
    expect(LEGISLATIVE_PAGE_SIZE).toBeGreaterThan(2);
  });
});

describe('query isolation — legislative', () => {
  it('LEGISLATIVE_QUERY names no other model', () => {
    for (const other of [
      'allGovernmentDepartments',
      'allExecutiveOffices',
      'allConstitutionalOffices',
    ]) {
      expect(LEGISLATIVE_QUERY).not.toContain(other);
    }
  });

  it('no other directory query names the legislative collections', () => {
    for (const q of [
      DEPARTMENTS_QUERY,
      EXECUTIVE_QUERY,
      CONSTITUTIONAL_QUERY,
    ]) {
      expect(q).not.toContain('allLegislativeChambers');
      expect(q).not.toContain('_allLegislativeChambersMeta');
      expect(q).not.toContain('_allHouseMembersMeta');
      expect(q).not.toContain('_allPartyListRepresentativesMeta');
    }
  });
});

describe('parseLegislativeResponse — shared collection gates', () => {
  it('accepts a well-formed response', () => {
    expect(
      parseLegislativeResponse(okLeg()).allLegislativeChambers
    ).toHaveLength(2);
  });

  it('accepts the real fixture', () => {
    const parsed = parseLegislativeResponse(legislativeResponse);
    expect(parsed.allLegislativeChambers).toHaveLength(2);
    expect(parsed._allHouseMembersMeta.count).toBe(254);
    expect(parsed._allPartyListRepresentativesMeta.count).toBe(61);
  });

  it('fails closed on a chamber count short of its meta', () => {
    const short = { ...okLeg(), _allLegislativeChambersMeta: { count: 3 } };
    expect(() => parseLegislativeResponse(short)).toThrow(/incomplete/i);
  });

  it('fails closed on zero chambers', () => {
    expect(() => parseLegislativeResponse(okLeg([]))).toThrow(
      /no legislative chambers/i
    );
  });

  it('fails closed at the chamber page-size ceiling', () => {
    const many = Array.from({ length: LEGISLATIVE_PAGE_SIZE }, (_, i) =>
      senate({ position: i, slug: `chamber-${i}`, chamber: `Senate ${i}` })
    );
    expect(() => parseLegislativeResponse(okLeg(many))).toThrow(/ceiling/i);
  });

  it('fails closed on a duplicate or malformed chamber slug', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ slug: senate().slug })])
      )
    ).toThrow(/duplicate slug/i);
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ slug: 'Not A Slug' }), house()]))
    ).toThrow(/not a valid slug/i);
  });

  it('fails closed on a blank chamber display name', () => {
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ chamber: '   ' }), house()]))
    ).toThrow(/blank display name/i);
  });

  it('fails closed on a null or non-integer position', () => {
    // Chamber order IS the emitted file order and the sitemap's URL order.
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ position: null }), house()]))
    ).toThrow(/unexpected legislative chambers shape/i);
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ position: 1.5 }), house()]))
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a duplicate chamber position, naming both slugs', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ position: 4 }), house({ position: 4 })])
      )
    ).toThrow(
      /senate-of-the-philippines-20th-congress.*house-of-representatives-20th-congress.*duplicate position 4/s
    );
  });
});

describe('parseLegislativeResponse — chamber discriminator gate', () => {
  /**
   * senate-committees.tsx selects on chamber.includes('Senate');
   * house-members.tsx and party-list-members.tsx select on
   * chamber.includes('House of Representatives'). A CMS rename empties those
   * pages while every count still looks healthy — nothing else can catch it.
   */
  it('fails closed when no chamber matches "Senate"', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ chamber: 'Upper House' }), house()])
      )
    ).toThrow(/exactly one chamber whose name contains "Senate"/i);
  });

  it('fails closed when no chamber matches "House of Representatives"', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ chamber: 'Lower House' })])
      )
    ).toThrow(
      /exactly one chamber whose name contains "House of Representatives"/i
    );
  });

  it('fails closed when TWO chambers match the same discriminator', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house(),
          senate({
            position: 2,
            slug: 'senate-of-the-philippines-21st-congress',
            chamber: 'Senate of the Philippines (21st Congress)',
          }),
        ])
      )
    ).toThrow(/exactly one chamber whose name contains "Senate"/i);
  });

  it('accepts the real fixture, whose two chambers match one discriminator each', () => {
    expect(() => parseLegislativeResponse(legislativeResponse)).not.toThrow();
  });
});

describe('parseLegislativeResponse — member reconciliation gates', () => {
  it('fails closed when nested house members undercount their meta', () => {
    // The single most important gate: the nested relation takes no `first`
    // argument and the CDA does not error on an oversized one, so a
    // truncated relation is otherwise indistinguishable from a real shrink.
    const truncated = { ...okLeg(), _allHouseMembersMeta: { count: 9 } };
    expect(() => parseLegislativeResponse(truncated)).toThrow(
      /house members.*1 nested record.*meta reported 9/is
    );
  });

  it('fails closed when nested party-list reps undercount their meta', () => {
    const truncated = {
      ...okLeg(),
      _allPartyListRepresentativesMeta: { count: 7 },
    };
    expect(() => parseLegislativeResponse(truncated)).toThrow(
      /party-list representatives.*1 nested record.*meta reported 7/is
    );
  });

  it('fails closed at the house-members ceiling', () => {
    const members = Array.from({ length: HOUSE_MEMBERS_CEILING }, (_, i) =>
      hm({ position: i, name: `MEMBER ${i}` })
    );
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: members })])
      )
    ).toThrow(/house members count reached the ceiling/i);
  });

  it('fails closed at the party-list ceiling', () => {
    const reps = Array.from({ length: PARTY_LIST_CEILING }, (_, i) =>
      plr({ position: i, name: `REP ${i}` })
    );
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ partyListRepresentatives: reps })])
      )
    ).toThrow(/party-list representatives count reached the ceiling/i);
  });

  it('fails closed when the House chamber does not carry every house member', () => {
    // Reconciliation alone would still pass if members were re-linked to the
    // Senate: totals match, but /house-members renders empty.
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ houseMembers: [hm()] }), house({ houseMembers: [] })])
      )
    ).toThrow(/House of Representatives.*carries 0 of 1 house members/is);
  });

  it('fails closed when the House chamber does not carry every party-list rep', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({ partyListRepresentatives: [plr()] }),
          house({ partyListRepresentatives: [] }),
        ])
      )
    ).toThrow(
      /House of Representatives.*carries 0 of 1 party-list representatives/is
    );
  });
});

describe('parseLegislativeResponse — duplicate member gates', () => {
  /**
   * THE gate this branch exists for. TalaCMS currently carries two identical
   * records for DY, FAUSTINO "BOJIE" G. III / Isabela / 6th District,
   * inherited from the orphaned house_members.json. That is a CMS data
   * defect, and the sync must refuse to ship it rather than de-duplicate it
   * in code — a silent de-dup would hide the defect forever and would
   * violate the never-drop-a-record rule.
   */
  it('fails closed on two house members with the same name, province and district', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ houseMembers: [hm({ position: 0 }), hm({ position: 1 })] }),
        ])
      )
    ).toThrow(
      /duplicate house member "DELA CRUZ, JUAN M\." \(Isabela, 1st District\)/i
    );
  });

  it('names the chamber and the CMS as the place to fix it', () => {
    let message = '';
    try {
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ houseMembers: [hm({ position: 0 }), hm({ position: 1 })] }),
        ])
      );
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('house-of-representatives-20th-congress');
    expect(message).toMatch(/TalaCMS/);
  });

  it('allows two same-named members in different districts — namesakes are real', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [
              hm({ position: 0, district: '1st District' }),
              hm({ position: 1, district: '2nd District' }),
            ],
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on two party-list reps with the same name and party-list', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            partyListRepresentatives: [
              plr({ position: 0 }),
              plr({ position: 1 }),
            ],
          }),
        ])
      )
    ).toThrow(
      /duplicate party-list representative "SANTOS, MARIA C\." \(EXAMPLE\)/i
    );
  });

  it('would REJECT the CMS state as it stands today', () => {
    // Reconstructs production's known defect on top of the fixture: the
    // Speaker's record, duplicated. This is the proof the gate bites on the
    // real thing, not only on synthetic data.
    const live = structuredClone(legislativeResponse) as ReturnType<
      typeof okLeg
    >;
    const h = live.allLegislativeChambers.find(c =>
      (c.slug as string).includes('house')
    )!;
    const members = h.houseMembers as { name: string; position: number }[];
    const speaker = members.find(m =>
      m.name.startsWith('DY, FAUSTINO "BOJIE"')
    )!;
    members.push({ ...speaker, position: members.length });
    live._allHouseMembersMeta = { count: members.length };
    expect(() => parseLegislativeResponse(live)).toThrow(
      /duplicate house member/i
    );
  });
});

describe('parseLegislativeResponse — member field gates', () => {
  it('fails closed on a blank member name', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ name: '  ' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank province/city — it drives the facet dropdown', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ provinceCity: '' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank district — it renders as a Flag chip', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ district: '   ' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank party-list label', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ partyListRepresentatives: [plr({ partyList: ' ' })] }),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('accepts a null contact — the pages render it conditionally', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [hm({ contact: null })],
            partyListRepresentatives: [plr({ contact: null })],
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on a duplicate member position within a chamber', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [
              hm({ position: 3, name: 'A' }),
              hm({ position: 3, name: 'B' }),
            ],
          }),
        ])
      )
    ).toThrow(/duplicate position 3/i);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/talacms/__tests__/directory.test.ts`

Expected: FAIL — the module has no `LEGISLATIVE_QUERY` / `parseLegislativeResponse` export, so the import itself errors.

- [ ] **Step 3: Implement the query and ceilings**

Add to `scripts/talacms/directory.ts`, immediately after `CONSTITUTIONAL_PAGE_SIZE`:

```typescript
/**
 * Legislative has exactly TWO chambers. 50 is a deliberately loose ceiling
 * for a collection with no realistic growth path — it exists to fail loudly
 * on a runaway response, not to bound a real dataset.
 */
export const LEGISLATIVE_PAGE_SIZE = 50;

/**
 * Ceilings for the two NESTED relations. These are NOT `first:` arguments —
 * the reverse relations take none, and the CDA does not enforce `first`
 * anyway (`first: 600` returned all 255 records with no error, verified
 * 2026-09-09). They are asserted against the top-level `_all*Meta` counts, so
 * a relation that silently truncates fails on the reconciliation gate and an
 * unexpectedly large dataset fails here with a clearer message.
 *
 * Today: 254 house members (255 in TalaCMS until the duplicate Speaker record
 * is deleted) and 61 party-list representatives. The House has ~316 seats
 * total, so these leave real headroom without being meaningless.
 */
export const HOUSE_MEMBERS_CEILING = 400;
export const PARTY_LIST_CEILING = 150;

/**
 * A FOURTH independent operation. Same isolation rule as the three above: a
 * combined query would make `--only=legislative` fail on invalid Departments
 * data and vice versa.
 *
 * All THREE `_all*Meta` fields are declared before `allLegislativeChambers`.
 * This is not stylistic — the CDA returns `count: 0` for any `_all*Meta`
 * field that follows a collection field anywhere in the same operation (see
 * ./categories.ts). Verified working in exactly this configuration against
 * the live CDA on 2026-09-09: 2 / 255 / 61. Do not reorder.
 *
 * `houseMembers` and `partyListRepresentatives` are REVERSE relations. They
 * accept no `first` and no `orderBy`; the CDA resolved all 255 and all 61 in
 * one round trip, in `position` order. We do not rely on that order — the
 * shaper sorts by `position` itself, which is why `position` is selected on
 * both — but we DO rely on completeness, which is why the response carries
 * the two top-level meta counts to reconcile against.
 *
 * Members cannot be fetched per-chamber: neither HouseMemberModelFilter nor
 * PartyListRepresentativeModelFilter exposes a `chamber` field. The nested
 * relation is the only chamber-scoped access there is.
 */
export const LEGISLATIVE_QUERY = `
query SyncLegislativeChambers {
  _allLegislativeChambersMeta {
    count
  }
  _allHouseMembersMeta {
    count
  }
  _allPartyListRepresentativesMeta {
    count
  }
  allLegislativeChambers(orderBy: [position_ASC], first: ${LEGISLATIVE_PAGE_SIZE}) {
    position
    slug
    branch
    chamber
    address
    trunkline
    website
    officials
    permanentCommittees
    houseLeaders
    houseCommittees
    specialCommittees
    secretariatOfficials
    houseMembers {
      position
      name
      provinceCity
      district
      contact
    }
    partyListRepresentatives {
      position
      name
      partyList
      contact
    }
  }
}
`;
```

- [ ] **Step 4: Implement the raw schemas**

Add after `RawConstitutionalsSchema`:

```typescript
/**
 * Chamber order IS consumed — it is the generated file's record order and
 * generate-sitemap.js emits detail URLs in that order — so `position` is
 * required and non-null here, the same rule Constitutional uses and for the
 * same reason. Uniqueness needs the whole collection and is enforced in
 * parseLegislativeResponse.
 */
const LegislativePositionSchema = z.number().int();

/**
 * `.trim().min(1)` on every field the two member pages actually render.
 * `.min(1)` alone would accept "   ", which renders as a blank row, a blank
 * Flag chip, or a blank entry in the province/city facet dropdown while every
 * count still reports healthy. `.trim()` is a zod TRANSFORM, so the trimmed
 * value is what reaches the generated file — a deliberate normalization, and
 * a no-op on today's data (pinned by the round-trip test in Task 3).
 *
 * `contact` is nullable: house-members.tsx and party-list-members.tsx both
 * render it inside `{m.contact && ...}`.
 */
const RawHouseMemberSchema = z.object({
  position: LegislativePositionSchema,
  name: z.string().trim().min(1),
  provinceCity: z.string().trim().min(1),
  district: z.string().trim().min(1),
  contact: z.string().nullable(),
});

const RawPartyListRepresentativeSchema = z.object({
  position: LegislativePositionSchema,
  name: z.string().trim().min(1),
  partyList: z.string().trim().min(1),
  contact: z.string().nullable(),
});

/**
 * The two chambers populate DISJOINT field sets — the Senate carries
 * `officials` and `permanentCommittees` and no house_* fields; the House
 * carries the reverse. Every blob is therefore nullable, and no unconditional
 * "must be present" gate may be added: it would fail on the other chamber.
 * What IS gated, in parseLegislativeResponse, is that each discriminator
 * matches exactly one chamber and that the House carries every member.
 *
 * The two relations are non-null LISTS in the schema (`[HouseMemberRecord!]!`)
 * — an empty array, not null, is how "no members" arrives.
 */
const RawLegislativeSchema = z.object({
  position: LegislativePositionSchema,
  slug: z.string(),
  branch: z.string().nullable(),
  chamber: z.string(),
  address: z.string().nullable(),
  trunkline: z.string().nullable(),
  website: z.string().nullable(),
  officials: z.unknown(),
  permanentCommittees: z.unknown(),
  houseLeaders: z.unknown(),
  houseCommittees: z.unknown(),
  specialCommittees: z.unknown(),
  secretariatOfficials: z.unknown(),
  houseMembers: z.array(RawHouseMemberSchema),
  partyListRepresentatives: z.array(RawPartyListRepresentativeSchema),
});

const RawLegislativesSchema = z.object({
  _allLegislativeChambersMeta: z.object({ count: z.number() }),
  _allHouseMembersMeta: z.object({ count: z.number() }),
  _allPartyListRepresentativesMeta: z.object({ count: z.number() }),
  allLegislativeChambers: z.array(RawLegislativeSchema),
});

export type RawHouseMember = z.infer<typeof RawHouseMemberSchema>;
export type RawPartyListRepresentative = z.infer<
  typeof RawPartyListRepresentativeSchema
>;
export type RawLegislative = z.infer<typeof RawLegislativeSchema>;
export type RawLegislatives = z.infer<typeof RawLegislativesSchema>;

/**
 * The substrings three page components select on:
 *   senate-committees.tsx   -> chamber.includes('Senate')
 *   house-members.tsx       -> chamber.includes('House of Representatives')
 *   party-list-members.tsx  -> chamber.includes('House of Representatives')
 * A CMS rename silently empties those pages with no count changing, which is
 * why this is gated rather than trusted.
 */
const SENATE_DISCRIMINATOR = 'Senate';
const HOUSE_DISCRIMINATOR = 'House of Representatives';
```

- [ ] **Step 5: Implement the gates**

Add after `parseConstitutionalResponse`:

```typescript
/**
 * Members carry no `slug` in the CDA, so identity is the tuple the UI shows.
 * A duplicate is a real defect: house-members.tsx renders one row per record
 * and prints `{results.length} of {members.length}`, so a duplicate is a
 * visible repeated row and an inflated count.
 */
const houseMemberIdentity = (m: RawHouseMember) =>
  `${m.name} ${m.provinceCity} ${m.district}`;

const partyListIdentity = (m: RawPartyListRepresentative) =>
  `${m.name} ${m.partyList}`;

function assertMemberPositionsUnique(
  label: string,
  slug: string,
  members: { position: number }[]
): void {
  const seen = new Set<number>();
  for (const m of members) {
    if (seen.has(m.position)) {
      fail(
        `chamber "${slug}" has two ${label} sharing duplicate position ` +
          `${m.position}. Member order is the generated file's array order, so ` +
          'a tie would be resolved arbitrarily rather than by editorial intent.'
      );
    }
    seen.add(m.position);
  }
}

export function parseLegislativeResponse(value: unknown): RawLegislatives {
  const raw = parseOrFail(RawLegislativesSchema, value, 'legislative chambers');
  const chambers = raw.allLegislativeChambers;

  assertCollection(
    'legislative chambers',
    chambers.map(r => ({ slug: r.slug, name: r.chamber })),
    raw._allLegislativeChambersMeta.count,
    LEGISLATIVE_PAGE_SIZE
  );

  // Chamber position: unique, so record order is editorial rather than a
  // slug-tie-break accident. Gaps are fine.
  const positions = new Map<number, string>();
  for (const r of chambers) {
    const seen = positions.get(r.position);
    if (seen !== undefined) {
      fail(
        `legislative chambers "${seen}" and "${r.slug}" share duplicate ` +
          `position ${r.position}. Record order drives the generated file and ` +
          'the sitemap, so a tie would be resolved by the slug tie-breaker ' +
          'rather than by editorial intent.'
      );
    }
    positions.set(r.position, r.slug);
  }

  // Discriminator gate — see SENATE_DISCRIMINATOR.
  const matching = (needle: string) =>
    chambers.filter(r => r.chamber.includes(needle));
  for (const needle of [SENATE_DISCRIMINATOR, HOUSE_DISCRIMINATOR]) {
    const hits = matching(needle);
    if (hits.length !== 1) {
      fail(
        `expected exactly one chamber whose name contains "${needle}", found ` +
          `${hits.length} (${chambers.map(r => `"${r.chamber}"`).join(', ')}). ` +
          'senate-committees.tsx, house-members.tsx and party-list-members.tsx ' +
          'all select their chamber by that substring, so this would silently ' +
          'empty a page with no count changing.'
      );
    }
  }
  const houseChamber = matching(HOUSE_DISCRIMINATOR)[0];

  // Reconcile the nested relations against the top-level meta counts. The
  // relations take no `first` and the CDA does not enforce one, so this is
  // the ONLY thing standing between a truncated relation and a short file.
  const nestedHouseMembers = chambers.reduce(
    (n, r) => n + r.houseMembers.length,
    0
  );
  const nestedPartyList = chambers.reduce(
    (n, r) => n + r.partyListRepresentatives.length,
    0
  );

  const reconcile = (
    label: string,
    nested: number,
    metaCount: number,
    ceiling: number
  ) => {
    if (metaCount === 0) fail(`TalaCMS returned no ${label}`);
    if (nested !== metaCount) {
      fail(
        `TalaCMS returned an incomplete ${label} list: the chamber relations ` +
          `carry ${nested} nested record(s), meta reported ${metaCount}. The ` +
          'reverse relation is unpaginated and the CDA does not enforce a ' +
          'result cap, so a mismatch means records were lost in transit — ' +
          'never that the dataset shrank.'
      );
    }
    if (nested >= ceiling) {
      fail(
        `${label} count reached the ceiling of ${ceiling}; raise the ceiling ` +
          'for this relation and re-run'
      );
    }
  };

  reconcile(
    'house members',
    nestedHouseMembers,
    raw._allHouseMembersMeta.count,
    HOUSE_MEMBERS_CEILING
  );
  reconcile(
    'party-list representatives',
    nestedPartyList,
    raw._allPartyListRepresentativesMeta.count,
    PARTY_LIST_CEILING
  );

  // Reconciliation alone still passes if members were re-linked to the wrong
  // chamber: the totals match and /house-members renders empty. Pin the
  // chamber the two member pages actually read.
  if (houseChamber.houseMembers.length !== nestedHouseMembers) {
    fail(
      `the "House of Representatives" chamber ("${houseChamber.slug}") ` +
        `carries ${houseChamber.houseMembers.length} of ${nestedHouseMembers} ` +
        'house members. house-members.tsx reads that chamber and no other, so ' +
        'the rest would vanish from the site.'
    );
  }
  if (houseChamber.partyListRepresentatives.length !== nestedPartyList) {
    fail(
      `the "House of Representatives" chamber ("${houseChamber.slug}") ` +
        `carries ${houseChamber.partyListRepresentatives.length} of ` +
        `${nestedPartyList} party-list representatives. ` +
        'party-list-members.tsx reads that chamber and no other, so the rest ' +
        'would vanish from the site.'
    );
  }

  // Duplicate members. Members have no slug, so identity is the tuple the UI
  // renders. NOT de-duplicated here — a duplicate is a CMS data defect and
  // must be fixed there, or it is hidden forever.
  for (const r of chambers) {
    assertMemberPositionsUnique('house members', r.slug, r.houseMembers);
    assertMemberPositionsUnique(
      'party-list representatives',
      r.slug,
      r.partyListRepresentatives
    );

    const seenMembers = new Set<string>();
    for (const m of r.houseMembers) {
      const id = houseMemberIdentity(m);
      if (seenMembers.has(id)) {
        fail(
          `duplicate house member "${m.name}" (${m.provinceCity}, ` +
            `${m.district}) in chamber "${r.slug}". Members carry no slug, so ` +
            'identity is name + province/city + district. house-members.tsx ' +
            'renders one row per record, so this would show a repeated row and ' +
            'an inflated count. Delete the duplicate record in TalaCMS — the ' +
            'sync will not de-duplicate it, because that would hide the defect ' +
            'permanently.'
        );
      }
      seenMembers.add(id);
    }

    const seenReps = new Set<string>();
    for (const m of r.partyListRepresentatives) {
      const id = partyListIdentity(m);
      if (seenReps.has(id)) {
        fail(
          `duplicate party-list representative "${m.name}" (${m.partyList}) ` +
            `in chamber "${r.slug}". Members carry no slug, so identity is ` +
            'name + party-list. Delete the duplicate record in TalaCMS — the ' +
            'sync will not de-duplicate it, because that would hide the defect ' +
            'permanently.'
        );
      }
      seenReps.add(id);
    }
  }

  return raw;
}

export async function fetchLegislative(
  client: TalaCmsClient
): Promise<RawLegislatives> {
  return parseLegislativeResponse(await client<unknown>(LEGISLATIVE_QUERY));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run scripts/talacms/__tests__/directory.test.ts`

Expected: PASS — all existing tests plus the new Legislative blocks.

- [ ] **Step 7: Type-check**

Run: `npm run typecheck:scripts`

Expected: exit 0, no output.

- [ ] **Step 8: Commit**

```bash
git add scripts/talacms/directory.ts scripts/talacms/__tests__/directory.test.ts
git commit -m "feat(sync): fetch and validate legislative chambers with nested members

One independent operation carrying all three _all*Meta counts ahead of the
collection field, plus both reverse relations. Gates: chamber slug/name/
position, the Senate and House name discriminators three pages select on,
nested-vs-meta member reconciliation, per-relation ceilings, House-chamber
ownership of every member, and duplicate members by rendered identity.

Duplicates fail the sync rather than being de-duplicated: they are CMS data
defects and must be fixed there.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Shape the output, and prove it round-trips

**Files:**
- Modify: `scripts/talacms/directory.ts`
- Modify: `src/data/directory/schema/legislative.schema.json`
- Test: `scripts/talacms/__tests__/directory.test.ts`

**Interfaces:**
- Consumes: `RawLegislative`, `RawLegislatives` (Task 2); `sortForOutput`, `applyFieldMap` (existing module).
- Produces:
  - `projectHouseMembers(members: RawHouseMember[]): Record<string, unknown>[] | null`
  - `projectPartyList(members: RawPartyListRepresentative[]): Record<string, unknown>[] | null`
  - `shapeLegislative(records: RawLegislative[]): Record<string, unknown>[]`
  - `buildLegislativeCandidate(raw: RawLegislatives): Candidate` with `path: 'src/data/directory/legislative.json'`, `schemaPath: 'src/data/directory/schema/legislative.schema.json'`

- [ ] **Step 1: Write the failing tests**

Add `shapeLegislative`, `buildLegislativeCandidate`, `projectHouseMembers` and `projectPartyList` to the `../directory` import list, then append:

```typescript
describe('projectHouseMembers / projectPartyList', () => {
  it('renames the CMS fields to the committed local keys, in committed key order', () => {
    expect(projectHouseMembers([hm() as never])).toEqual([
      {
        province_city: 'Isabela',
        name: 'DELA CRUZ, JUAN M.',
        district: '1st District',
        contact: '8931-0000; local 1000',
      },
    ]);
    expect(Object.keys(projectHouseMembers([hm() as never])![0])).toEqual([
      'province_city',
      'name',
      'district',
      'contact',
    ]);
    expect(projectPartyList([plr() as never])).toEqual([
      {
        party_list: 'EXAMPLE',
        name: 'SANTOS, MARIA C.',
        contact: '8931-1111; local 1111',
      },
    ]);
  });

  it('sorts by position, not by the order the relation happened to arrive in', () => {
    const out = projectHouseMembers([
      hm({ position: 2, name: 'C' }),
      hm({ position: 0, name: 'A' }),
      hm({ position: 1, name: 'B' }),
    ] as never);
    expect(out!.map(m => m.name)).toEqual(['A', 'B', 'C']);
  });

  it('omits a null contact rather than emitting contact: null', () => {
    const out = projectHouseMembers([hm({ contact: null }) as never])!;
    expect(out[0]).not.toHaveProperty('contact');
    expect(
      projectPartyList([plr({ contact: null }) as never])![0]
    ).not.toHaveProperty('contact');
  });

  it('returns null for an empty relation, so the key is omitted entirely', () => {
    // The Senate record has no house_members key at all in the committed
    // file — not an empty array. applyFieldMap preserves [] as a present
    // value, so the projection must hand it null instead.
    expect(projectHouseMembers([])).toBeNull();
    expect(projectPartyList([])).toBeNull();
  });
});

describe('shapeLegislative', () => {
  const shaped = () =>
    shapeLegislative(
      parseLegislativeResponse(legislativeResponse).allLegislativeChambers
    );

  it('reproduces the committed file, content for content', () => {
    const out = shaped();
    const expected = structuredClone(
      expectedLegislative
    ) as Record<string, unknown>[];
    // ACCEPTED DELTA 1, applied to the expected side so the rest of the
    // record is still compared strictly.
    for (const p of expected[1].party_list_representatives as {
      party_list: string;
    }[]) {
      if (p.party_list === 'MANILA TEACHERS') p.party_list = 'Manila Teachers';
    }
    expect(out).toHaveLength(expected.length);
    for (const [i, rec] of out.entries()) {
      expect(sortDeep(rec)).toEqual(sortDeep(expected[i]));
    }
  });

  it('reproduces the committed key order EXACTLY, for both records', () => {
    // Unlike Constitutional, exact agreement is reachable here: one ordered
    // field map covers both chambers because applyFieldMap omits absent keys.
    // Measured 2/2 on 2026-09-09. This is a hard equality, not a baseline.
    const out = shaped();
    for (const [i, rec] of out.entries()) {
      expect(Object.keys(rec)).toEqual(
        Object.keys(expectedLegislative[i] as object)
      );
    }
  });

  it('emits records in committed file order', () => {
    expect(shaped().map(r => r.slug)).toEqual(
      (expectedLegislative as { slug: string }[]).map(r => r.slug)
    );
  });

  it('never emits position, at the chamber or the member level', () => {
    for (const rec of shaped()) {
      expect(rec).not.toHaveProperty('position');
      for (const key of ['house_members', 'party_list_representatives']) {
        for (const m of (rec[key] as { position?: number }[]) ?? []) {
          expect(m).not.toHaveProperty('position');
        }
      }
    }
  });

  it('omits the House-only keys from the Senate record and vice versa', () => {
    const [senateRec, houseRec] = shaped();
    for (const k of [
      'house_leaders',
      'house_members',
      'party_list_representatives',
      'house_committees',
      'special_committees',
    ]) {
      expect(senateRec).not.toHaveProperty(k);
    }
    for (const k of ['officials', 'permanent_committees']) {
      expect(houseRec).not.toHaveProperty(k);
    }
  });

  it('preserves the exact member counts the two pages display', () => {
    const houseRec = shaped()[1];
    expect(houseRec.house_members).toHaveLength(254);
    expect(houseRec.party_list_representatives).toHaveLength(61);
  });

  it('leaves every member name byte-identical to the fixture', () => {
    // .trim() on the member schemas is a transform; zero live rows carry
    // surrounding whitespace, so the output must be unchanged by it.
    const houseRec = shaped()[1];
    const expectedHouse = expectedLegislative[1] as {
      house_members: { name: string }[];
    };
    expect(
      (houseRec.house_members as { name: string }[]).map(m => m.name)
    ).toEqual(expectedHouse.house_members.map(m => m.name));
  });

  it('is pure — it never mutates its input', () => {
    const parsed = parseLegislativeResponse(legislativeResponse);
    const before = JSON.stringify(parsed);
    shapeLegislative(parsed.allLegislativeChambers);
    expect(JSON.stringify(parsed)).toBe(before);
  });
});

describe('legislative candidate emission', () => {
  it('emits the candidate against the tracked legislative schema', () => {
    const c = buildLegislativeCandidate(
      parseLegislativeResponse(legislativeResponse)
    );
    expect(c.path).toBe('src/data/directory/legislative.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/legislative.schema.json'
    );
    expect(c.data).toHaveLength(2);
  });

  it('builds the candidate without reference to the other models', () => {
    expect(buildLegislativeCandidate.length).toBe(1);
  });

  it('produces a candidate that satisfies the tracked JSON Schema', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare(
        buildLegislativeCandidate(parseLegislativeResponse(legislativeResponse))
      )
    ).resolves.toMatchObject({ path: 'src/data/directory/legislative.json' });
  });

  it('would REJECT a record missing the required chamber field', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [{ slug: 'x', branch: 'Legislative Branch' }],
      })
    ).rejects.toThrow(/does not satisfy/);
  });

  it('would REJECT a house member missing province_city — the schema gate bites', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [
          {
            slug: 'x',
            branch: 'Legislative Branch',
            chamber: 'House of Representatives (20th Congress)',
            house_members: [{ name: 'A', district: '1st District' }],
          },
        ],
      })
    ).rejects.toThrow(/does not satisfy/);
  });
});

describe('cross-model slug collisions include legislative', () => {
  it('catches a legislative slug that collides with departments', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('src/data/directory/departments.json', ['shared-slug']),
        candidate('src/data/directory/legislative.json', ['shared-slug']),
      ])
    ).toThrow(/departments\.json.*legislative\.json/s);
  });

  it('passes against the real generated candidates for all four models', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        buildDepartmentsCandidate({
          _allGovernmentDepartmentsMeta: { count: rawDepartments.length },
          allGovernmentDepartments: rawDepartments,
        }),
        buildExecutiveCandidate({
          _allExecutiveOfficesMeta: { count: rawExecutive.length },
          allExecutiveOffices: rawExecutive,
        }),
        buildConstitutionalCandidate({
          _allConstitutionalOfficesMeta: { count: rawConstitutional.length },
          allConstitutionalOffices: rawConstitutional,
        }),
        buildLegislativeCandidate(
          parseLegislativeResponse(legislativeResponse)
        ),
      ])
    ).not.toThrow();
  });
});
```

> **Note:** `candidate(...)` and `sortDeep(...)` are existing helpers in this test file. Reuse them; do not redefine them.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/talacms/__tests__/directory.test.ts`

Expected: FAIL — `shapeLegislative` is not exported.

- [ ] **Step 3: Implement the projection, field map and shaper**

Add to `scripts/talacms/directory.ts`, after `CONSTITUTIONAL_FIELDS`:

```typescript
/**
 * ONE ordered map covering BOTH chambers. Order matters: this array IS the
 * emitted key order. Because applyFieldMap omits absent keys, the Senate
 * (no house_* fields) and the House (no officials/permanent_committees) each
 * fall out of this single order exactly as committed — measured 2/2 exact
 * key-order agreement on 2026-09-09, which is why the Task 3 test asserts
 * hard equality rather than Constitutional's "at or above baseline".
 *
 * `houseMembers` / `partyListRepresentatives` are relations, not scalars;
 * shapeLegislative pre-projects them onto the raw record before this map runs.
 */
const LEGISLATIVE_FIELDS = [
  ['slug', 'slug'],
  ['branch', 'branch'],
  ['chamber', 'chamber'],
  ['address', 'address'],
  ['trunkline', 'trunkline'],
  ['website', 'website'],
  ['officials', 'officials'],
  ['permanentCommittees', 'permanent_committees'],
  ['houseLeaders', 'house_leaders'],
  ['houseMembers', 'house_members'],
  ['partyListRepresentatives', 'party_list_representatives'],
  ['houseCommittees', 'house_committees'],
  ['specialCommittees', 'special_committees'],
  ['secretariatOfficials', 'secretariat_officials'],
] as const;

const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position;

/**
 * Returns NULL for an empty relation, never `[]`.
 *
 * applyFieldMap treats `[]` as a present value and would emit
 * `"house_members": []` onto the Senate record, where the committed file has
 * no such key at all. Returning null routes it through the same
 * omit-when-absent rule as every other field.
 *
 * A null contact is omitted rather than emitted, matching the committed file
 * and the `{m.contact && ...}` render in both member pages.
 *
 * Key order inside each member object is the committed order:
 * province_city, name, district, contact.
 */
export function projectHouseMembers(
  members: RawHouseMember[]
): Record<string, unknown>[] | null {
  if (members.length === 0) return null;
  return [...members].sort(byPosition).map(m => {
    const out: Record<string, unknown> = {
      province_city: m.provinceCity,
      name: m.name,
      district: m.district,
    };
    if (m.contact !== null) out.contact = m.contact;
    return out;
  });
}

/** Committed member key order: party_list, name, contact. */
export function projectPartyList(
  members: RawPartyListRepresentative[]
): Record<string, unknown>[] | null {
  if (members.length === 0) return null;
  return [...members].sort(byPosition).map(m => {
    const out: Record<string, unknown> = {
      party_list: m.partyList,
      name: m.name,
    };
    if (m.contact !== null) out.contact = m.contact;
    return out;
  });
}

export function shapeLegislative(
  records: RawLegislative[]
): Record<string, unknown>[] {
  return sortForOutput(records).map(r =>
    applyFieldMap(
      {
        ...r,
        houseMembers: projectHouseMembers(r.houseMembers),
        partyListRepresentatives: projectPartyList(r.partyListRepresentatives),
      } as unknown as Record<string, unknown>,
      LEGISLATIVE_FIELDS
    )
  );
}

export function buildLegislativeCandidate(raw: RawLegislatives): Candidate {
  return {
    path: 'src/data/directory/legislative.json',
    schemaPath: 'src/data/directory/schema/legislative.schema.json',
    data: shapeLegislative(raw.allLegislativeChambers),
  };
}
```

- [ ] **Step 4: Close the two gaps in the tracked JSON Schema**

`legislative.schema.json` never declared `house_committees` or `special_committees`. Ajv runs `strict: false` with default `additionalProperties`, so they pass silently today — but the schema is the generated file's contract and must describe it. Also tighten the member items, which the shaper now guarantees.

In `src/data/directory/schema/legislative.schema.json`, inside `items.properties`, add these two properties alongside the existing ones:

```json
"house_committees": {
  "type": "object",
  "description": "House committee chairpersons",
  "properties": {
    "chairpersons": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "committee": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    }
  }
},
"special_committees": {
  "type": "array",
  "description": "Special committees of the House",
  "items": {
    "type": "object",
    "properties": {
      "committee": { "type": "string" },
      "chairperson": { "type": "string" }
    }
  }
}
```

Then replace the existing `house_members` and `party_list_representatives` property definitions with these, which add `required` and `minLength`:

```json
"house_members": {
  "type": "array",
  "description": "List of House of Representatives members",
  "items": {
    "type": "object",
    "required": ["province_city", "name", "district"],
    "properties": {
      "province_city": {
        "type": "string",
        "minLength": 1,
        "description": "Province or city represented"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "Full name of the representative"
      },
      "district": {
        "type": "string",
        "minLength": 1,
        "description": "District represented"
      },
      "contact": {
        "type": "string",
        "description": "Contact information"
      }
    }
  }
},
"party_list_representatives": {
  "type": "array",
  "description": "List of party-list representatives",
  "items": {
    "type": "object",
    "required": ["party_list", "name"],
    "properties": {
      "party_list": {
        "type": "string",
        "minLength": 1,
        "description": "Name of the party-list organization"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "Full name of the representative"
      },
      "contact": {
        "type": "string",
        "description": "Contact information"
      }
    }
  }
}
```

- [ ] **Step 5: Verify the pre-migration file still satisfies the tightened schema**

The schema must describe the file we already ship, or the round-trip contract is broken before we start.

```bash
node -e "
const { Ajv } = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });
const schema = require('./src/data/directory/schema/legislative.schema.json');
const data = require('./src/data/directory/__fixtures__/legislative.expected.json');
const ok = ajv.compile(schema)(data);
if (!ok) { console.error(ajv.errors); process.exit(1); }
console.log('pre-migration file satisfies the tightened schema');
"
```

Expected: `pre-migration file satisfies the tightened schema`

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run scripts/talacms/__tests__/directory.test.ts`

Expected: PASS, including `reproduces the committed key order EXACTLY, for both records`.

- [ ] **Step 7: Commit**

```bash
git add scripts/talacms/directory.ts \
        scripts/talacms/__tests__/directory.test.ts \
        src/data/directory/schema/legislative.schema.json
git commit -m "feat(sync): shape legislative chambers into the committed JSON contract

One ordered field map covers both chambers — applyFieldMap's omit-absent rule
makes the Senate and House each fall out in exactly their committed key order
(2/2 exact). The two reverse relations are projected to the committed nested
key names and sorted by position; an empty relation projects to null so the
key is omitted rather than emitted as an empty array.

Also declares house_committees and special_committees in the tracked schema,
which never described them, and requires the member fields the two member
pages render.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Wire legislative into the orchestrator

**Files:**
- Modify: `scripts/sync-talacms.ts`
- Test: `scripts/__tests__/sync-talacms.test.ts`

**Interfaces:**
- Consumes: `fetchLegislative`, `buildLegislativeCandidate` (Tasks 2 and 3).
- Produces: `DATASETS` = `['categories','hotlines','services','departments','executive','constitutional','legislative']`. A full sync writes `src/data/directory/legislative.json` last.

- [ ] **Step 1: Write the failing tests**

In `scripts/__tests__/sync-talacms.test.ts`, add a payload next to `constitutionalPayload`:

```typescript
const legislativePayload = {
  _allLegislativeChambersMeta: { count: 2 },
  _allHouseMembersMeta: { count: 1 },
  _allPartyListRepresentativesMeta: { count: 1 },
  allLegislativeChambers: [
    {
      position: 0,
      slug: 'senate-of-the-philippines-20th-congress',
      branch: 'Legislative Branch',
      chamber: 'Senate of the Philippines (20th Congress)',
      address: null,
      trunkline: null,
      website: null,
      officials: [{ role: 'Senate President', name: 'A PERSON' }],
      permanentCommittees: null,
      houseLeaders: null,
      houseCommittees: null,
      specialCommittees: null,
      secretariatOfficials: null,
      houseMembers: [],
      partyListRepresentatives: [],
    },
    {
      position: 1,
      slug: 'house-of-representatives-20th-congress',
      branch: 'Legislative Branch',
      chamber: 'House of Representatives (20th Congress)',
      address: null,
      trunkline: null,
      website: null,
      officials: null,
      permanentCommittees: null,
      houseLeaders: null,
      houseCommittees: null,
      specialCommittees: null,
      secretariatOfficials: null,
      houseMembers: [
        {
          position: 0,
          name: 'DELA CRUZ, JUAN M.',
          provinceCity: 'Isabela',
          district: '1st District',
          contact: null,
        },
      ],
      partyListRepresentatives: [
        {
          position: 0,
          name: 'SANTOS, MARIA C.',
          partyList: 'EXAMPLE',
          contact: null,
        },
      ],
    },
  ],
};

/** Same slug as the departments payload — used only by the gate tests. */
const collidingLegislativePayload = {
  ...legislativePayload,
  allLegislativeChambers: [
    { ...legislativePayload.allLegislativeChambers[0], slug: 'shared-slug' },
    legislativePayload.allLegislativeChambers[1],
  ],
};
```

Register it in `makeDeps`'s client, before the `hotlinesPayload` fallback:

```typescript
    if (query.includes('SyncLegislativeChambers')) return legislativePayload;
```

Replace the existing `writes all six datasets and exits 0` test with:

```typescript
  it('writes all seven datasets and exits 0', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(deps.commitFiles).toHaveBeenCalledTimes(1);
    const written = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(written.map((f: { path: string }) => f.path)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/health.json',
      'src/data/directory/departments.json',
      'src/data/directory/executive.json',
      'src/data/directory/constitutional.json',
      'src/data/directory/legislative.json',
    ]);
  });
```

Replace the `exposes departments, executive and constitutional as selectable datasets` test with:

```typescript
  it('exposes all four directory models as selectable datasets', () => {
    expect(DATASETS).toEqual([
      'categories',
      'hotlines',
      'services',
      'departments',
      'executive',
      'constitutional',
      'legislative',
    ]);
  });
```

Append a new describe block:

```typescript
describe('legislative dataset', () => {
  const clientAnswering = (allowed: string, payload: unknown) =>
    vi.fn(async (query: string) => {
      if (!query.includes(allowed)) {
        throw new Error(
          `unexpected query for an unselected dataset: ${query.slice(0, 60)}`
        );
      }
      return payload;
    }) as unknown as TalaCmsClient;

  it('--only=legislative prepares only the legislative file', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual(['src/data/directory/legislative.json']);
  });

  it('--only=legislative issues no other model query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=legislative'], deps as never);
    const queries = queriesOf(client);
    expect(queries.some(q => q.includes('SyncLegislativeChambers'))).toBe(true);
    for (const other of [
      'SyncGovernmentDepartments',
      'SyncExecutiveOffices',
      'SyncConstitutionalOffices',
      'SyncServiceCategories',
      'SyncGovernmentServices',
    ]) {
      expect(queries.some(q => q.includes(other))).toBe(false);
    }
  });

  it('no other --only= run issues the legislative query', async () => {
    for (const only of [
      '--only=departments',
      '--only=executive',
      '--only=constitutional',
    ]) {
      const { client, deps } = makeDeps();
      await run([only], deps as never);
      expect(
        queriesOf(client).some(q => q.includes('SyncLegislativeChambers'))
      ).toBe(false);
    }
  });

  it('--only=legislative succeeds even when every other model would be invalid', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncLegislativeChambers', legislativePayload),
    });
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
  });

  it('fails the whole run and writes nothing when legislative data is invalid', async () => {
    const broken = {
      ...legislativePayload,
      _allHouseMembersMeta: { count: 99 },
    };
    const { deps } = makeDeps({
      createClient: () =>
        vi.fn(async (query: string) => {
          if (query.includes('SyncServiceCategories')) return categoriesPayload;
          if (query.includes('SyncGovernmentServices')) return servicesPayload;
          if (query.includes('SyncGovernmentDepartments'))
            return departmentsPayload;
          if (query.includes('SyncExecutiveOffices')) return executivePayload;
          if (query.includes('SyncConstitutionalOffices'))
            return constitutionalPayload;
          if (query.includes('SyncLegislativeChambers')) return broken;
          return hotlinesPayload;
        }) as unknown as TalaCmsClient,
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/incomplete house members/i);
    expect(logged).toContain('No files were written.');
  });

  it('applies the cross-model slug gate to legislative on a full sync', async () => {
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) return categoriesPayload;
      if (query.includes('SyncGovernmentServices')) return servicesPayload;
      if (query.includes('SyncGovernmentDepartments'))
        return collidingDepartmentsPayload;
      if (query.includes('SyncExecutiveOffices')) return executivePayload;
      if (query.includes('SyncConstitutionalOffices'))
        return constitutionalPayload;
      if (query.includes('SyncLegislativeChambers'))
        return collidingLegislativePayload;
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/appear in BOTH/i);
  });

  it('does not apply the cross-model gate in an isolated legislative run', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncLegislativeChambers', collidingLegislativePayload),
    });
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/__tests__/sync-talacms.test.ts`

Expected: FAIL — `--only=legislative` is rejected as an unknown dataset; `DATASETS` has six entries.

- [ ] **Step 3: Wire the orchestrator**

In `scripts/sync-talacms.ts`, extend the import from `./talacms/directory`:

```typescript
import {
  assertNoCrossModelSlugCollisions,
  buildConstitutionalCandidate,
  buildDepartmentsCandidate,
  buildExecutiveCandidate,
  buildLegislativeCandidate,
  fetchConstitutional,
  fetchDepartments,
  fetchExecutive,
  fetchLegislative,
} from './talacms/directory';
```

Extend `DATASETS`:

```typescript
export const DATASETS = [
  'categories',
  'hotlines',
  'services',
  'departments',
  'executive',
  'constitutional',
  'legislative',
] as const;
```

In `buildCandidates`, after the `rawConstitutional` fetch:

```typescript
  // Legislative is the fourth independent fetch. Its single operation carries
  // the two member relations, so House Members and Party-list Representatives
  // need no separate query and no separate dataset selector — they are fields
  // of the chamber record in the app's data contract.
  const rawLegislative = selected.has('legislative')
    ? await fetchLegislative(client)
    : null;
```

Add the candidate next to `constitutionalCandidate`:

```typescript
  const legislativeCandidate = rawLegislative
    ? buildLegislativeCandidate(rawLegislative)
    : null;
```

Extend the collision set:

```typescript
  const directoryCandidates = [
    departmentsCandidate,
    executiveCandidate,
    constitutionalCandidate,
    legislativeCandidate,
  ].filter((c): c is Candidate => c !== null);
```

Finally, update the Stage 4 ordering comment so it ends `..., then constitutional, then legislative, so preparation order, the status lines and commitFiles' rename order are all reproducible, including under partial failure.`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/__tests__/sync-talacms.test.ts scripts/talacms/__tests__/directory.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the CLI advertises the new dataset**

Run: `npx tsx ./scripts/sync-talacms.ts --only=nope`

Expected: exits non-zero, and the usage line lists `legislative` among the datasets.

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-talacms.ts scripts/__tests__/sync-talacms.test.ts
git commit -m "feat(sync): add legislative to the dataset pipeline

Fourth independent directory fetch, selectable as --only=legislative and
included in the cross-model slug gate. House Members and Party-list
Representatives need no selector of their own: they arrive as relations on
the chamber record, which is how the app's contract nests them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Move the app onto the CMS accessor and stop tracking the file

Behavior must not change. Only the import path does.

**Files:**
- Modify: `src/data/cms.ts`, `src/lib/directory.ts`, the four legislative page components, `.gitignore`
- Test: `src/data/__tests__/generated-cms-not-tracked.test.ts`

**Interfaces:**
- Consumes: the generated `src/data/directory/legislative.json`.
- Produces: `export interface LegislativeChamber { slug: string; chamber: string; [key: string]: unknown }` and `export const legislativeChambers: LegislativeChamber[]` from `src/data/cms.ts`.

- [ ] **Step 1: Write the failing test**

In `src/data/__tests__/generated-cms-not-tracked.test.ts`, extend the generated-directory assertion:

```typescript
  it('does not track the generated directory files', () => {
    expect(trackedFiles).not.toContain('src/data/directory/departments.json');
    expect(trackedFiles).not.toContain('src/data/directory/executive.json');
    expect(trackedFiles).not.toContain(
      'src/data/directory/constitutional.json'
    );
    expect(trackedFiles).not.toContain('src/data/directory/legislative.json');
  });

  it('still tracks the legislative schema and its pre-migration fixture', () => {
    expect(trackedFiles).toContain(
      'src/data/directory/schema/legislative.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/directory/__fixtures__/legislative.expected.json'
    );
  });
```

And replace the `still tracks the directory files that stay local` test with:

```typescript
  it('still tracks the directory files that stay local', () => {
    // Judicial, diplomatic and the two orphaned member files are deliberately
    // NOT migrated — pin that so a future sweep cannot silently gitignore
    // them. legislative.json moved to the generated set; the two orphaned
    // member files did NOT follow it, and are now a second, hand-maintained
    // copy of content the CMS owns. Recorded, deliberately not resolved here.
    for (const f of [
      'src/data/directory/judicial.json',
      'src/data/directory/diplomatic.json',
      'src/data/directory/house_members.json',
      'src/data/directory/party_list_representatives.json',
    ]) {
      expect(trackedFiles).toContain(f);
    }
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/data/__tests__/generated-cms-not-tracked.test.ts`

Expected: FAIL — `legislative.json` is still tracked.

- [ ] **Step 3: Add the accessor**

Append to `src/data/cms.ts`:

```typescript
/**
 * The two chambers of Congress. `house_members` and
 * `party_list_representatives` are nested inside the House record — the app
 * has always read them from there, and the sync fills them from the chamber's
 * CMS relations rather than from separate files.
 *
 * `chamber` is not just a label: senate-committees.tsx selects on
 * `chamber.includes('Senate')` and the two member pages on
 * `chamber.includes('House of Representatives')`. The sync gates both.
 */
export interface LegislativeChamber {
  slug: string;
  chamber: string;
  [key: string]: unknown;
}

const legislativeModules = import.meta.glob<{ default: LegislativeChamber[] }>(
  './directory/legislative.json',
  { eager: true }
);

export const legislativeChambers: LegislativeChamber[] =
  required(legislativeModules);
```

- [ ] **Step 4: Point every consumer at the accessor**

In `src/lib/directory.ts`, delete the line `import legislative from '../data/directory/legislative.json';` and extend the existing `../data/cms` import:

```typescript
import {
  constitutionalOffices as constitutional,
  governmentDepartments as departments,
  executiveOffices as executive,
  legislativeChambers as legislative,
} from '../data/cms';
```

In each of `[chamber].tsx`, `house-members.tsx`, `party-list-members.tsx` and `senate-committees.tsx` under `src/pages/government/legislative/`, replace

```typescript
import legislativeData from '../../../data/directory/legislative.json';
```

with

```typescript
import { legislativeChambers as legislativeData } from '../../../data/cms';
```

Nothing else in those files changes — each already casts `legislativeData` to its own local type.

- [ ] **Step 5: Stop tracking the generated file**

```bash
echo '/src/data/directory/legislative.json' >> .gitignore
git rm --cached src/data/directory/legislative.json
```

`git rm --cached` unstages it from the index while leaving it on disk, so the app still builds in this working tree before the first sync.

- [ ] **Step 6: Verify the app still type-checks and builds**

```bash
npx tsc --noEmit -p tsconfig.app.json
npm run build:app
```

Expected: both exit 0. `build:app` proves the accessor resolves and the bundle still contains the chamber data.

- [ ] **Step 7: Run the tests**

Run: `npx vitest run src/data/__tests__/generated-cms-not-tracked.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A src/data/cms.ts src/lib/directory.ts \
        src/pages/government/legislative .gitignore \
        src/data/__tests__/generated-cms-not-tracked.test.ts
git commit -m "refactor(directory): read legislative data through the CMS accessor

legislative.json becomes build-time-generated and gitignored, so the four
page components and lib/directory.ts read it through src/data/cms.ts's
import.meta.glob accessor, which fails with a clear 'run the CMS sync' message
on a never-synced checkout instead of a bare module-resolution error.

No behavior change: every consumer keeps its own local types and transforms.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Make legislative.json a required Meilisearch source

Once generated, it must never be indexed tolerantly: `addDocuments` never deletes, so indexing zero legislative documents on top of an existing index leaves stale entries searchable, and `--reset` would wipe real data and never repopulate it.

**Files:**
- Modify: `scripts/index_meilisearch.cjs`
- Test: `scripts/__tests__/index-meilisearch-preflight.test.ts`

**Interfaces:**
- Consumes: `src/data/directory/schema/legislative.schema.json`.
- Produces: `DIRECTORY_GENERATED_FILES` = `['departments.json','executive.json','constitutional.json','legislative.json']`; `DIRECTORY_TOLERANT_FILES` derived down to four files; a new `DATA_SOURCES` entry for `legislative.json`.

- [ ] **Step 1: Write the failing tests**

In `scripts/__tests__/index-meilisearch-preflight.test.ts`, replace the `derives the tolerant subset rather than declaring it separately` test with:

```typescript
  it('derives the tolerant subset rather than declaring it separately', () => {
    expect([...DIRECTORY_TOLERANT_FILES].sort()).toEqual([
      'diplomatic.json',
      'house_members.json',
      'judicial.json',
      'party_list_representatives.json',
    ]);
    for (const f of [
      'departments.json',
      'executive.json',
      'constitutional.json',
      'legislative.json',
    ]) {
      expect(DIRECTORY_TOLERANT_FILES).not.toContain(f);
    }
  });
```

And add, in the same describe block:

```typescript
  it('treats legislative.json as a generated, required source', () => {
    expect(DIRECTORY_GENERATED_FILES).toContain('legislative.json');
    const [source] = DATA_SOURCES.filter(
      s => s.isFile && path.basename(s.dataPath) === 'legislative.json'
    );
    expect(source).toBeDefined();
    expect(source.dataType).toBe('directory_item');
    expect(source.requireNonEmpty).toBe(true);
    expect(source.schemaPath).toBe(
      path.join(REPO_ROOT, 'src/data/directory/schema/legislative.schema.json')
    );
  });

  it('still counts legislative.json as exactly two documents', () => {
    expect(DIRECTORY_EXPECTED_COUNTS['legislative.json']).toBe(2);
  });
```

In `syntheticDirectoryDir`, `legislative.json` must now satisfy its schema (it is validated, no longer tolerant). Replace its `write(...)` call:

```typescript
  write(
    'legislative.json',
    // chamber and branch are schema-required: legislative.json is now a
    // REQUIRED, schema-validated source, not a tolerant one.
    rows(1, 'leg', i => ({
      branch: 'Legislative Branch',
      chamber: `Chamber ${i}`,
    }))
  );
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/__tests__/index-meilisearch-preflight.test.ts`

Expected: FAIL — `legislative.json` is still in the tolerant subset and has no `DATA_SOURCES` entry.

- [ ] **Step 3: Promote the file to a required source**

In `scripts/index_meilisearch.cjs`, extend the generated manifest:

```javascript
const DIRECTORY_GENERATED_FILES = [
  'departments.json',
  'executive.json',
  'constitutional.json',
  'legislative.json',
];
```

Add a `DATA_SOURCES` entry immediately after the `constitutional.json` one and before the tolerant directory entry:

```javascript
  {
    dataType: 'directory_item',
    dataPath: path.join(dataBasePath, 'directory', 'legislative.json'),
    isFile: true,
    // Generated by `npm run sync:talacms` and gitignored — same rule as the
    // three above. Only 2 documents, but they are the entry points for the
    // whole /government/legislative route tree: an empty or invalid result
    // must fail the whole run BEFORE any index is touched, because
    // addDocuments never deletes and --reset would wipe real data and never
    // repopulate it.
    requireNonEmpty: true,
    schemaPath: path.join(
      dataBasePath,
      'directory',
      'schema',
      'legislative.schema.json'
    ),
  },
```

Update the comment on the tolerant directory entry:

```javascript
    // The four generated files above are loaded by the REQUIRED loader;
    // listing them here too would index each record twice and let the
    // tolerant copy (loaded later) win, silently reinstating fail-open
    // behavior for exactly the data this makes fail-closed. Every other
    // directory dataset — diplomatic, judicial, and the two orphaned member
    // files — is unaffected and stays tolerant, because each is still
    // hand-maintained and committed.
```

Also update the two other comments that enumerate the tolerant datasets (around lines 170 and 759), removing `legislative` from each list.

`DIRECTORY_EXPECTED_COUNTS['legislative.json']` stays `2` — the record count is unchanged by this migration.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/__tests__/index-meilisearch-preflight.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/index_meilisearch.cjs \
        scripts/__tests__/index-meilisearch-preflight.test.ts
git commit -m "feat(meilisearch): treat legislative.json as a required generated source

Moves it from the tolerant loader to the required, schema-validated one, so a
missing or malformed file fails preflight before any index is touched rather
than silently leaving the two chamber documents stale. Document count is
unchanged at 2.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Prove the build fails closed without the generated file

**Files:**
- Test: `scripts/__tests__/build-app-clean-checkout.test.ts`

**Interfaces:**
- Consumes: `npm run build:app`, `npm run generate:metadata`.
- Produces: no source changes — this task is entirely test coverage.

- [ ] **Step 1: Write the failing tests**

Add `legislative.json` to `GENERATED_FILES` at the top of the file:

```typescript
const GENERATED_FILES = [
  'src/data/service_categories.json',
  'src/data/critical_hotlines.json',
  'src/data/directory/departments.json',
  'src/data/directory/executive.json',
  'src/data/directory/constitutional.json',
  'src/data/directory/legislative.json',
];
```

Add `'src/data/directory/legislative.json'` to the `generatedDirectoryFiles` array in the first `generate:metadata` test.

Append a new test to the `generate:metadata fails closed` describe block:

```typescript
  it('names the missing legislative file specifically', () => {
    // generate-sitemap.js and generate-llms-txt.js both read legislative.json
    // through the same loadData() wrapper, which process.exit(1)s on any
    // read/parse failure. Pin that, so a refactor cannot regress into
    // silently emitting a sitemap missing both /government/legislative/<slug>
    // URLs.
    //
    // loadData() reads service_categories.json, departments.json and
    // constitutional.json BEFORE legislative.json (see the field order in
    // both scripts). All three are themselves build-generated and gitignored,
    // so on a clean checkout loadData() would throw on whichever it reaches
    // first and never mention legislative.json. Pin all three as valid,
    // schema-satisfying stand-ins so this test isolates the legislative.json
    // failure regardless of ambient sync state.
    const legislativePath = path.join(
      ROOT,
      'src/data/directory/legislative.json'
    );
    const prerequisites = new Map<string, string>([
      [
        path.join(ROOT, 'src/data/service_categories.json'),
        JSON.stringify({ categories: [] }),
      ],
      [path.join(ROOT, 'src/data/directory/departments.json'), '[]'],
      [path.join(ROOT, 'src/data/directory/constitutional.json'), '[]'],
    ]);

    const backups = new Map<string, Buffer | null>();
    for (const abs of [legislativePath, ...prerequisites.keys()]) {
      backups.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs) : null);
    }

    fs.rmSync(legislativePath, { force: true });
    for (const [abs, content] of prerequisites) {
      fs.writeFileSync(abs, content);
    }

    try {
      let threw = false;
      let output = '';
      try {
        execSync('npm run generate:metadata', {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 60_000,
        });
      } catch (error) {
        threw = true;
        const e = error as {
          status?: number;
          stdout?: Buffer;
          stderr?: Buffer;
        };
        expect(e.status).not.toBe(0);
        output = [e.stdout?.toString(), e.stderr?.toString()]
          .filter(Boolean)
          .join('\n');
      }
      expect(threw).toBe(true);
      expect(output).toMatch(/legislative\.json/);
    } finally {
      for (const [abs, content] of backups) {
        if (content === null) fs.rmSync(abs, { force: true });
        else fs.writeFileSync(abs, content);
      }
    }
  }, 60_000);
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run scripts/__tests__/build-app-clean-checkout.test.ts`

Expected: PASS. Both behaviors already hold — `loadData()` fails closed, and `cms.ts`'s `required()` throws the "run the CMS sync script" message — so this task pins existing behavior rather than changing it. If `runs the exact PR-CI build command` fails, the accessor added in Task 5 is wrong; fix that before proceeding.

- [ ] **Step 3: Commit**

```bash
git add scripts/__tests__/build-app-clean-checkout.test.ts
git commit -m "test(build): cover legislative in clean-checkout and metadata failure

build:app must still succeed with legislative.json absent, and
generate:metadata must fail loudly and name it rather than emitting a sitemap
missing both chamber URLs.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Full verification, real sync, and QA

**Files:**
- Modify: `docs/superpowers/plans/2026-09-09-legislative-json-sync.md` (only to record deviations)

**Interfaces:**
- Consumes: everything above.
- Produces: a verified working tree and a recorded QA result.

- [ ] **Step 1: Run the entire unit suite**

Run: `npm run test:unit`

Expected: PASS, no skipped Legislative tests.

- [ ] **Step 2: Lint and type-check everything**

```bash
npm run lint
npm run typecheck:scripts
npx tsc --noEmit -p tsconfig.app.json
```

Expected: all exit 0.

- [ ] **Step 3: Dry-run the real sync**

```bash
npm run cms:fetch -- --only=legislative --dry-run
```

**Two outcomes are correct, and which one you get tells you the state of the CMS:**

- **Exit 1** with `duplicate house member "DY, FAUSTINO "BOJIE" G. III" (Isabela, 6th District)` — the duplicate has **not yet been deleted in TalaCMS**. This is the gate working exactly as designed. Stop here and report it; do not touch the code, and above all do not relax the gate to make the command pass. The branch is complete and correct, but cannot merge until the CMS record is removed.
- **Exit 0** with `unchanged src/data/directory/legislative.json`, **or** exit 3 with `1 file(s) would change` — the duplicate has been removed. Proceed to Step 4.

Any other failure is a real defect in this branch. Read the message; every gate names its own cause.

- [ ] **Step 4: Run the real sync and compare against the frozen contract**

Only once Step 3 reported exit 0 or exit 3.

```bash
npm run cms:fetch -- --only=legislative
```

The file is gitignored, so `git diff` shows nothing. Compare against the tracked fixture instead:

```bash
node -e "
const a=require('./src/data/directory/legislative.json');
const b=require('./src/data/directory/__fixtures__/legislative.expected.json');
const sortDeep=v=>Array.isArray(v)?v.map(sortDeep):(v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortDeep(v[k])])):v);
for(const p of b[1].party_list_representatives) if(p.party_list==='MANILA TEACHERS') p.party_list='Manila Teachers';
console.log('content identical to the pre-migration file (after the accepted casing delta):',
  JSON.stringify(sortDeep(a))===JSON.stringify(sortDeep(b)));
console.log('chambers', a.length,
  '| house members', a[1].house_members.length,
  '| party-list', a[1].party_list_representatives.length,
  '| senate officials', a[0].officials.length,
  '| senate committees', a[0].permanent_committees.length);
"
```

Expected: `true`, then `chambers 2 | house members 254 | party-list 61 | senate officials 24 | senate committees 41`.

If house members reads 255, the CMS duplicate is back — the gate should have caught it, so investigate before continuing.

- [ ] **Step 5: Manual QA**

```bash
npm run dev
```

- [ ] `/government` — Legislative rows and the `Legislative` branch filter unchanged; total row count unchanged
- [ ] `/government/legislative` — 2 chambers, same names and heads as before
- [ ] `/government/legislative/senate-of-the-philippines-20th-congress` — "24 officials", address/trunkline/website, both related cards
- [ ] `/government/legislative/house-of-representatives-20th-congress` — no Officers section (correct: the House record has no `officials`), both related cards
- [ ] `/government/legislative/senate-committees` — "41 of 41 committees"; search by committee and by chair both work
- [ ] `/government/legislative/house-members` — "254 of 254 representatives"; **no duplicate row for DY, FAUSTINO "BOJIE" G. III**; province/city dropdown has no blank option; search by name, district and province works
- [ ] `/government/legislative/party-list-members` — "61 of 61 party-list members"; the chip reads **"Manila Teachers"** (the accepted delta); search works
- [ ] `/government/legislative/nonexistent-chamber` — "Chamber not found."

- [ ] **Step 6: Verify the generated metadata is unchanged**

```bash
npm run generate:metadata
grep -c 'government/legislative' public/sitemap.xml
grep -c 'government/legislative' public/llms.txt
git diff --stat -- public/sitemap.xml public/llms.txt
```

Expected: both URL counts unchanged from before the branch, and `git diff` reports no change to either file.

- [ ] **Step 7: Record the outcome**

If Step 3 returned exit 1, note in the PR description that the branch is blocked on the TalaCMS duplicate and name the record. Otherwise note that the sync round-trips cleanly.

```bash
git add docs/superpowers/plans/2026-09-09-legislative-json-sync.md
git commit -m "docs(sync): record the legislative run mode and its integrity gates

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-review notes

**Spec coverage.** Every section of the investigation spec maps to a task: §2 consumers to Task 5; §3.1/3.2 field mapping to Tasks 2–3; §3.3 accepted deltas to Task 1 (fixture) and Task 3 (round-trip assertion); §3.4 CMS limitations to the ceiling and reconciliation design in Task 2; §4 conventions to Tasks 2–7; §4.5 schema gap to Task 3 Step 4; §4.6 orphan drift recorded in Task 5's test comment, deliberately not resolved; §6 Favorites out of scope per Global Constraints; §8 test surface to Tasks 2, 3, 6, 7 and Task 8's QA list.

**Integrity gates, as requested.** Nine gates fail the sync loudly rather than dropping records: chamber count vs meta; zero chambers; chamber page-size ceiling; duplicate/invalid chamber slug; blank chamber name; duplicate chamber position; the Senate and House name discriminators; nested-vs-meta member reconciliation for both relations; per-relation ceilings; House-chamber ownership of every member; duplicate member position within a chamber; and duplicate members by rendered identity. None of them de-duplicates or drops anything.

**Not covered, by decision.** `scripts/add-directory-slugs.js` still lists a `legislative` entry that rewrites the file in place. It is now obsolete for this file, exactly as its `constitutional` entry already is. Recorded, deliberately not fixed — the same treatment the previous branch gave it.

**Known execution risk.** Task 8 Step 3 is expected to fail against production until the duplicate Speaker record is deleted in TalaCMS. That is designed behavior, not a plan defect, and Step 3 documents both outcomes explicitly so an executor does not "fix" the gate to make the command pass.

---

## Execution record (2026-09-09)

All eight tasks implemented and committed on `feat/legislative-json-sync`. `npm run test:unit` (650/650), `npm run lint`, `npm run typecheck:scripts`, and `npx tsc --noEmit -p tsconfig.app.json` (67 pre-existing, unrelated errors — same count before and after this branch) all pass.

**Task 8 Step 3 returned exit 1**, as the plan predicted: `npm run cms:fetch -- --only=legislative --dry-run` fails with

```
duplicate house member "DY, FAUSTINO "BOJIE" G. III" (Isabela, 6th District) in chamber "house-of-representatives-20th-congress"
```

reproduced twice for confidence (one intervening run returned a transient `Failed to reach TalaCMS` network error, unrelated to this gate). **This branch is blocked on that TalaCMS record until it is deleted upstream.** No write was attempted; Step 4 (real sync) and the `house members 254` content-identity check were therefore not run against production. The gate is working exactly as designed and was not weakened.

**Deviations from the plan, all minor:**
1. Task 2's `expectedLegislative` import (added per Step 1) is unused until Task 3 and trips this repo's `noUnusedLocals`/eslint pre-commit gate on its own — Tasks 2 and 3 were committed together instead of as two separate commits.
2. The plan's new `describe('cross-model slug collisions include legislative', …)` block referenced a `candidate()` helper that is actually scoped inside the existing `describe('assertNoCrossModelSlugCollisions', …)` block, not module-level. Its two tests were folded into that existing block instead (replacing its "three models" test with "four models"), preserving the plan's intent without a scope bug.
3. Three pre-existing tests in `sync-talacms.test.ts` (not named in the plan) construct their own full-`run([])` client mocks without a `SyncLegislativeChambers` branch and assert exact 6-path/6-dataset lists; wiring legislative into the default pipeline broke them for an unrelated reason. Updated to add the missing branch and extend the asserted lists to 7.
4. Manual browser QA (Task 8 Step 5) was not performed — no browser automation tool is available in this environment. All eight legislative routes were checked at the HTTP level (200, no server error) against the pre-migration `legislative.json` still on disk; this does not confirm rendered content and is called out as a remaining manual QA item.

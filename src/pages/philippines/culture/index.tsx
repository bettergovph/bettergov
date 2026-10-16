import Container from '../../../components/v2/ui/Container';
import SEO from '../../../components/SEO';
import {
  ChapterNav,
  HeritageChapter,
  HeritageHero,
  HeritageNext,
  HeritagePhoto,
  PhotoCredit,
  ReferenceLink,
} from '../../../components/v2/heritage/Heritage';
import { cultureSources, heritageImages } from '../../../data/heritage';

const languages = [
  [
    'Tagalog',
    'Metro Manila and much of central and southern Luzon; the principal basis of Filipino.',
  ],
  ['Cebuano / Binisaya', 'Cebu, Bohol, parts of Negros and much of Mindanao.'],
  [
    'Ilocano',
    'Ilocos and communities across northern Luzon and other parts of the country.',
  ],
  [
    'Hiligaynon / Ilonggo',
    'Iloilo, parts of Western Visayas, Negros and Mindanao.',
  ],
  ['Waray', 'Samar and parts of Leyte and Biliran.'],
  ['Kapampangan', 'Pampanga and parts of Tarlac and neighboring provinces.'],
  [
    'Bikol languages',
    'Related languages spoken across the Bicol peninsula and nearby islands.',
  ],
  [
    'Chavacano',
    'Spanish-based creole varieties, including the variety spoken in Zamboanga City.',
  ],
  [
    'Maranao / Mëranaw',
    'The Lake Lanao area and Maranao communities elsewhere.',
  ],
  [
    'Tausug',
    'The Sulu archipelago and communities in other parts of the southern Philippines.',
  ],
];

const festivals = [
  {
    name: 'Sinulog',
    month: 'January',
    place: 'Cebu City',
    body: 'Devotion to the Santo Niño brings together processions, music and street dancing.',
  },
  {
    name: 'Ati-Atihan',
    month: 'January',
    place: 'Kalibo, Aklan',
    body: 'Drumbeats, devotional gatherings and dancing fill the streets during this Santo Niño celebration.',
  },
  {
    name: 'Dinagyang',
    month: 'January',
    place: 'Iloilo City',
    body: 'Choreographed dance performances and religious observances are central to the city’s festival.',
  },
  {
    name: 'Panagbenga',
    month: 'February',
    place: 'Baguio City',
    body: 'Floral floats and street performances celebrate the city’s flower-growing traditions.',
  },
  {
    name: 'Pahiyas',
    month: 'May',
    place: 'Lucban, Quezon',
    body: 'Homes display farm produce and colorful kiping rice wafers in thanksgiving for the harvest.',
  },
  {
    name: 'Kadayawan',
    month: 'August',
    place: 'Davao City',
    body: 'A harvest celebration highlighting the cultures of Davao’s Indigenous and Moro communities.',
  },
];

const foods = [
  [
    'Adobo',
    'A way of cooking with vinegar, garlic and seasonings. Chicken, pork, seafood and vegetables each have their own variations.',
  ],
  [
    'Sinigang',
    'A sour broth with vegetables and fish, meat or shrimp. Tamarind, guava and other souring ingredients give regional versions their character.',
  ],
  [
    'Pancit',
    'A family of noodle dishes shaped by Chinese-Filipino food traditions, from pancit canton to pancit palabok.',
  ],
  [
    'Laing',
    'Taro leaves cooked in coconut milk, associated with Bicol. The amount of chili varies by cook and household.',
  ],
  [
    'Bibingka',
    'A rice cake traditionally baked in banana-leaf-lined pots, often enjoyed during the Christmas season.',
  ],
  [
    'Halo-halo',
    'Shaved ice and milk with a changing mix of sweet beans, fruit, jellies and other toppings.',
  ],
];

export default function PhilippinesCulture() {
  return (
    <main className='heritage-page' lang='en'>
      <SEO
        title='Culture of the Philippines'
        description='Explore Philippine languages, festivals, food, living arts and beliefs, with credited photography and cultural references.'
      />
      <HeritageHero
        eyebrow='The Philippines · Culture & heritage'
        title={
          <>
            Many islands.
            <br />
            <em>A living culture.</em>
          </>
        }
        description='In the languages we speak, the things we make and the tables we share, the Philippines carries its stories forward.'
        image={heritageImages.sinulog}
        href='#languages'
        cta='Explore our culture'
      />
      <ChapterNav
        label='Culture chapters'
        items={[
          { id: 'languages', label: 'Languages' },
          { id: 'festivals', label: 'Festivals' },
          { id: 'food', label: 'Food' },
          { id: 'living-arts', label: 'Living arts' },
          { id: 'beliefs', label: 'Faith & community' },
          { id: 'sources', label: 'Sources' },
        ]}
      />
      <section className='heritage-intro' aria-labelledby='culture-intro'>
        <Container className='heritage-intro-grid'>
          <p className='heritage-kicker'>Many ways of being Filipino</p>
          <div>
            <h2 id='culture-intro'>
              A heritage lived every day.
              <br />A story still being made.
            </h2>
            <p className='heritage-body'>
              Philippine culture has many centers. Indigenous knowledge,
              regional traditions, centuries of exchange and the experiences of
              Filipinos overseas all contribute to it. This is an introduction
              to that diversity, with more to discover in every community.
            </p>
          </div>
        </Container>
      </section>
      <HeritageChapter
        id='languages'
        number='01'
        label='Languages'
        title='An archipelago of voices.'
      >
        <p className='heritage-body'>
          Language carries family histories, place names, humor and knowledge.
          Filipino is the national language; Filipino and English are the
          official languages. Regional languages also serve as auxiliary
          official languages in their regions under the 1987 Constitution.
        </p>
        <ReferenceLink href={cultureSources.constitution.url}>
          Article XIV, Sections 6–7
        </ReferenceLink>
        <dl className='heritage-language-list'>
          {languages.map(([name, region]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{region}</dd>
            </div>
          ))}
        </dl>
        <p className='heritage-small mt-6'>
          A selection, not a complete inventory. Languages cross regional
          boundaries, and communities may use different names for their
          language. Counts vary by classification; KWF’s 2017 atlas documented
          130 Indigenous languages.
        </p>
        <ReferenceLink href={cultureSources.languages.url}>
          Explore the KWF language atlas (PDF)
        </ReferenceLink>
      </HeritageChapter>
      <HeritageChapter
        id='festivals'
        number='02'
        label='Festivals'
        title='When a place comes together.'
        dark
      >
        <p className='heritage-body'>
          Processions, harvest thanksgiving, music and dance give local
          calendars their rhythm. Each celebration has its own history and
          meaning for the people who sustain it.
        </p>
        <div className='heritage-festivals'>
          {festivals.map(f => (
            <article key={f.name}>
              <span className='heritage-kicker'>
                {f.month} · {f.place}
              </span>
              <h3>{f.name}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
        <p className='heritage-small mt-5'>
          Months indicate the usual season. Confirm each year’s dates and
          program with the local organizer before planning a visit.
        </p>
        <div className='flex flex-wrap gap-x-6'>
          <ReferenceLink href={cultureSources.cebu.url}>
            Cebu & Sinulog
          </ReferenceLink>
          <ReferenceLink href={cultureSources.davao.url}>
            Davao & Kadayawan
          </ReferenceLink>
        </div>
      </HeritageChapter>
      <HeritageChapter
        id='food'
        number='03'
        label='At the table'
        title='A taste of where we come from.'
      >
        <p className='heritage-body'>
          Coastlines, farms, markets and migration shape what people cook.
          Recipes move between generations and across islands, changing with
          local ingredients and the cook’s own taste.
        </p>
        <div className='heritage-feature'>
          <figure>
            <HeritagePhoto image={heritageImages.adobo} />
            <figcaption>
              <PhotoCredit image={heritageImages.adobo} />
            </figcaption>
          </figure>
          <div className='heritage-food-list'>
            {foods.map(([name, body]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
        <ReferenceLink href={cultureSources.food.url}>
          Discover regional food at the National Museum
        </ReferenceLink>
      </HeritageChapter>
      <HeritageChapter
        id='living-arts'
        number='04'
        label='Living arts'
        title='Knowledge, passed from hand to hand.'
      >
        <div className='heritage-feature'>
          <div>
            <p className='heritage-body'>
              A loom, a chant, a story remembered. Cultural heritage lives
              through practice: in the skills people teach, the materials they
              work with and the occasions that bring them together.
            </p>
            <p className='heritage-body mt-5'>
              The Philippines’ weaving and oral traditions belong to distinct
              communities. Learning their names, recognizing their makers and
              understanding their context are part of appreciating the work.
            </p>
          </div>
          <figure>
            <HeritagePhoto image={heritageImages.weaving} />
            <figcaption>
              <PhotoCredit image={heritageImages.weaving} />
            </figcaption>
          </figure>
        </div>
        <div className='heritage-arts'>
          <article>
            <p className='heritage-kicker mb-3'>Aklan · Weaving</p>
            <h3>Piña handloom weaving</h3>
            <p className='heritage-body'>
              Fine pineapple-leaf fibers become cloth through skills shared
              within families and weaving communities.
            </p>
            <ReferenceLink href={cultureSources.pina.url}>
              UNESCO heritage record
            </ReferenceLink>
          </article>
          <article>
            <p className='heritage-kicker mb-3'>Ifugao · Oral tradition</p>
            <h3>Hudhud chants</h3>
            <p className='heritage-body'>
              Narrative chants carry ancestral stories and customary knowledge,
              traditionally accompanying agricultural and funeral occasions.
            </p>
            <ReferenceLink href={cultureSources.hudhud.url}>
              UNESCO heritage record
            </ReferenceLink>
          </article>
          <article>
            <p className='heritage-kicker mb-3'>Lake Lanao · Epic poetry</p>
            <h3>Darangen</h3>
            <p className='heritage-body'>
              This Maranao epic tradition recounts the deeds of heroes while
              conveying values, customary law and social knowledge.
            </p>
            <ReferenceLink href={cultureSources.darangen.url}>
              UNESCO heritage record
            </ReferenceLink>
          </article>
        </div>
      </HeritageChapter>
      <HeritageChapter
        id='beliefs'
        number='05'
        label='Faith & community'
        title='Many traditions. A shared home.'
      >
        <p className='heritage-body'>
          Catholic and other Christian traditions, Islam, Indigenous spiritual
          practices and other beliefs are part of Philippine life. Some
          Filipinos do not identify with a religion. Practices differ between
          communities, households and individuals.
        </p>
        <p className='heritage-body mt-5'>
          Places of worship, family observances and community gatherings connect
          people in different ways. Freedom of religion and the separation of
          Church and State are protected by the Constitution.
        </p>
        <ReferenceLink href={cultureSources.constitution.url}>
          Article II, Section 6 · Article III, Section 5
        </ReferenceLink>
      </HeritageChapter>
      <HeritageNext
        to='/philippines/history'
        label='Continue exploring · History'
        title='The stories behind the present.'
        description='Trace the people, encounters and events that shaped the Philippines.'
      />
      <section
        id='sources'
        className='heritage-sources'
        aria-labelledby='culture-sources'
      >
        <Container>
          <h2 id='culture-sources'>Sources & further reading</h2>
          <p className='heritage-small mt-3'>
            Explore the cultural records and institutions behind this
            introduction. Photographs link to their original files and licenses.
          </p>
          <ul>
            {Object.values(cultureSources).map(s => (
              <li key={s.title}>
                <ReferenceLink href={s.url}>{s.title}</ReferenceLink>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}

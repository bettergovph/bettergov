import { useTranslation } from 'react-i18next';
import Container from '../../../components/v2/ui/Container';
import SEO from '../../../components/SEO';
import {
  ChapterNav,
  HeritageHero,
  HeritageNext,
  ReferenceLink,
} from '../../../components/v2/heritage/Heritage';
import {
  heritageImages,
  historySources,
  type HistorySourceId,
} from '../../../data/heritage';

type Era = { id: string; yr: string; title: string; blurb: string };
type Entry = {
  id: string;
  chapter: string;
  yr: string;
  title: string;
  body: string;
  sources: HistorySourceId[];
};

export default function PhilippinesHistory() {
  const { t, i18n } = useTranslation('about-philippines');
  const eras = t('history.eras', { returnObjects: true }) as Era[];
  const entries = t('history.entries', { returnObjects: true }) as Entry[];
  const contentLanguage = i18n.getResource(
    i18n.resolvedLanguage || 'en',
    'about-philippines',
    'history.entries'
  )
    ? i18n.resolvedLanguage
    : 'en';

  return (
    <main className='heritage-page'>
      <SEO
        title={t('history.hero.title')}
        description={t('history.hero.description')}
      />
      <HeritageHero
        eyebrow={t('history.hero.eyebrow')}
        title={t('history.hero.title')}
        description={t('history.hero.description')}
        image={heritageImages.terraces}
        href='#early-peoples'
        cta={t('history.hero.cta')}
      />
      <ChapterNav
        lang={contentLanguage}
        label={t('history.navigationLabel')}
        items={eras.map(e => ({ id: e.id, label: e.title }))}
      />
      <section
        className='heritage-intro'
        aria-labelledby='history-intro'
        lang={contentLanguage}
      >
        <Container className='heritage-intro-grid'>
          <p className='heritage-kicker'>{t('history.intro.eyebrow')}</p>
          <div>
            <h2 id='history-intro'>{t('history.intro.title')}</h2>
            <p className='heritage-body'>{t('history.intro.body')}</p>
          </div>
        </Container>
      </section>
      <div className='heritage-timeline' lang={contentLanguage}>
        <Container>
          {eras.map((era, index) => (
            <section
              id={era.id}
              key={era.id}
              className='heritage-era'
              aria-labelledby={`${era.id}-title`}
            >
              <div className='heritage-era-heading'>
                <p className='heritage-kicker'>
                  {String(index + 1).padStart(2, '0')} / {era.yr}
                </p>
                <h2 id={`${era.id}-title`}>{era.title}</h2>
                <p>{era.blurb}</p>
              </div>
              <div className='heritage-events'>
                {entries
                  .filter(entry => entry.chapter === era.id)
                  .map(entry => (
                    <article
                      id={entry.id}
                      key={entry.id}
                      aria-labelledby={`${entry.id}-title`}
                    >
                      <p className='heritage-kicker'>{entry.yr}</p>
                      <h3 id={`${entry.id}-title`}>{entry.title}</h3>
                      <p className='heritage-body'>{entry.body}</p>
                      <div className='heritage-event-links'>
                        {entry.sources.map(id => (
                          <ReferenceLink key={id} href={historySources[id].url}>
                            {historySources[id].title}
                          </ReferenceLink>
                        ))}
                      </div>
                      {entry.id === 'tabon' && (
                        <div
                          className='heritage-note'
                          role='note'
                          lang={i18n.resolvedLanguage}
                        >
                          <strong className='heritage-kicker'>
                            {t('history.scholarNote.title')}
                          </strong>
                          <p>{t('history.scholarNote.body')}</p>
                        </div>
                      )}
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </Container>
      </div>
      <section
        className='heritage-dates heritage-dark'
        aria-labelledby='independence-dates'
        lang={contentLanguage}
      >
        <Container>
          <p className='heritage-kicker mb-4'>
            {t('history.milestones.eyebrow')}
          </p>
          <h2 id='independence-dates'>{t('history.milestones.title')}</h2>
          <div className='heritage-dates-grid'>
            <div>
              <strong>1898</strong>
              <p className='heritage-body'>
                {t('history.milestones.declaration')}
              </p>
              <ReferenceLink href={historySources.independence.url}>
                {historySources.independence.title}
              </ReferenceLink>
            </div>
            <div>
              <strong>1946</strong>
              <p className='heritage-body'>
                {t('history.milestones.recognition')}
              </p>
              <ReferenceLink href={historySources.american.url}>
                {historySources.american.title}
              </ReferenceLink>
            </div>
          </div>
        </Container>
      </section>
      <HeritageNext
        to='/philippines/culture'
        label={t('history.nextCards.culture.eyebrow')}
        title={t('history.nextCards.culture.title')}
        description={t('history.nextCards.culture.desc')}
      />
      <section
        id='sources'
        className='heritage-sources'
        aria-labelledby='history-sources'
        lang={contentLanguage}
      >
        <Container>
          <h2 id='history-sources'>{t('history.sourcesTitle')}</h2>
          <p className='heritage-small mt-3'>
            {t('history.sourcesDescription')}
          </p>
          <ul>
            {Object.values(historySources).map(s => (
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

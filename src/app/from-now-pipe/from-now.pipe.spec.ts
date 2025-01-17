import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { TestBed } from '@angular/core/testing';
import { enUS, fr } from 'date-fns/locale';
import { provideI18nTesting } from '../../i18n-test';
import { FromNowPipe } from './from-now.pipe';

describe('FromNowPipe', () => {
  it('should transform the input in English', () => {
    TestBed.configureTestingModule({
      providers: [provideI18nTesting('en')]
    });

    // given a pipe
    const pipe = TestBed.runInInjectionContext(() => new FromNowPipe());

    // when transforming the date
    const date = '2020-02-18T08:02:00Z';
    const transformed = pipe.transform(date);

    // then we should have a formatted string
    expect(transformed)
      .withContext('The pipe should transform the date into a human string, using the `formatDistanceToNowStrict` function of date-fns')
      .toContain(formatDistanceToNowStrict(parseISO(date), { addSuffix: true, locale: enUS }));
  });

  it('should transform the input in French', () => {
    TestBed.configureTestingModule({
      providers: [provideI18nTesting('fr')]
    });

    // given a pipe
    TestBed.configureTestingModule({});
    const pipe = TestBed.runInInjectionContext(() => new FromNowPipe());

    // when transforming the date
    const date = '2020-02-18T08:02:00Z';
    const transformed = pipe.transform(date);

    // then we should have a formatted string
    expect(transformed)
      .withContext('The pipe should transform the date into a human string, using the `formatDistanceToNowStrict` function of date-fns')
      .toContain(formatDistanceToNowStrict(parseISO(date), { addSuffix: true, locale: fr }));
  });
});

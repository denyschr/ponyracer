import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { NgbAlert, NgbAlertConfig } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { RaceService } from '../race.service';
import { PonyComponent } from '../pony/pony.component';
import { RaceModel } from '../models/race.model';
import { BetComponent } from './bet.component';

describe('BetComponent', () => {
  let raceService: jasmine.SpyObj<RaceService>;
  const race: RaceModel = {
    id: 12,
    name: 'Paris',
    ponies: [
      { id: 1, name: 'Gentle Pie', color: 'YELLOW' },
      { id: 2, name: 'Big Soda', color: 'ORANGE' },
      { id: 3, name: 'Gentle Bottle', color: 'PURPLE' },
      { id: 4, name: 'Superb Whiskey', color: 'GREEN' },
      { id: 5, name: 'Fast Rainbow', color: 'BLUE' }
    ],
    startInstant: '2024-02-18T08:02:00'
  };

  beforeEach(() => {
    raceService = jasmine.createSpyObj<RaceService>('RaceService', ['get', 'bet', 'cancelBet']);
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'races/:raceId', component: BetComponent }]), { provide: RaceService, useValue: raceService }]
    });
    // turn off the animation for the alert
    const alertConfig = TestBed.inject(NgbAlertConfig);
    alertConfig.animation = false;
  });

  it('should display a race, its date and its ponies', async () => {
    // given a race in Paris with 5 ponies
    raceService.get.and.returnValue(of(race));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12', BetComponent);
    expect(raceService.get).toHaveBeenCalledWith(12);

    // then we should have the name and ponies displayed in the template
    const ponies = harness.routeDebugElement!.queryAll(By.directive(PonyComponent));
    expect(ponies).withContext('You should use the PonyComponent in your template to display the ponies').not.toBeNull();
    expect(ponies.length).withContext('You should have five pony components in your template').toBe(5);
    const element = harness.routeNativeElement!;
    const raceName = element.querySelector('h1')!;
    expect(raceName).withContext('You need an h1 element for the race name').not.toBeNull();
    expect(raceName.textContent).withContext('The h1 element should contain the race name').toContain('Paris');
    const startInstant = element.querySelector('p')!;
    expect(startInstant).withContext('You should use a `p` element to display the start instant').not.toBeNull();
    expect(startInstant.textContent)
      .withContext('You should use the `fromNow` pipe you created to format the start instant')
      .toContain(formatDistanceToNowStrict(parseISO(race.startInstant), { addSuffix: true }));
  });

  it('should trigger a bet when a pony is clicked', async () => {
    // given a race in Paris with 5 ponies, and the same race with pony 1 being bet at the second call
    const modifiedRace = { ...race, betPonyId: 1 };
    raceService.get.and.returnValues(of(race), of(modifiedRace));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12', BetComponent);
    expect(raceService.get).toHaveBeenCalledWith(12);

    // when we emit a `ponyClicked` event
    const ponies = harness.routeDebugElement!.queryAll(By.directive(PonyComponent));
    const gentlePie = ponies[0].componentInstance as PonyComponent;

    raceService.bet.and.returnValue(of(undefined));

    gentlePie.ponyClicked.emit(race.ponies[0]);
    harness.detectChanges();

    expect(raceService.bet).toHaveBeenCalledWith(12, 1);
    // we should have an element with the `selected` class
    const selectedElements = harness.routeNativeElement!.querySelectorAll('.selected');
    expect(selectedElements.length).withContext('You should have a div with the `selected` class').toBe(1);
    expect(selectedElements[0].textContent).toContain('Gentle Pie');
  });

  it('should display an error message if bet failed', async () => {
    // given a race in Paris with 5 ponies
    raceService.get.and.returnValue(of(race));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12', BetComponent);
    expect(raceService.get).toHaveBeenCalledWith(12);

    raceService.bet.and.callFake(() => throwError(() => new Error('Oops')));

    const debugElement = harness.routeDebugElement!;
    expect(debugElement.query(By.directive(NgbAlert))).toBeNull();

    // bet on pony
    const ponies = debugElement.queryAll(By.directive(PonyComponent));
    const gentlePie = ponies[0].componentInstance as PonyComponent;
    gentlePie.ponyClicked.emit(race.ponies[0]);
    harness.detectChanges();

    const message = debugElement.query(By.directive(NgbAlert));
    expect(message).withContext('You should have an NgbAlert if the bet failed').not.toBeNull();
    expect((message.nativeElement as HTMLElement).textContent).toContain('The race is already started or finished');
    const alertComponent = message.componentInstance as NgbAlert;
    expect(alertComponent.type).withContext('The alert should be a danger one').toBe('danger');

    // close the alert
    alertComponent.close().subscribe();
    harness.detectChanges();
    expect(debugElement.query(By.directive(NgbAlert)))
      .withContext('The NgbAlert should be closable')
      .toBeNull();
  });

  it('should cancel a bet', async () => {
    // given a race in Paris with 5 ponies and the one with ID 1 is bet, and the same race no pony being bet at the second call
    const modifiedRace = { ...race, betPonyId: 1 };
    raceService.get.and.returnValues(of(modifiedRace), of(race));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12', BetComponent);

    raceService.cancelBet.and.returnValue(of(undefined));

    // cancel bet on pony
    const ponies = harness.routeDebugElement!.queryAll(By.directive(PonyComponent));
    const gentlePie = ponies[0].componentInstance as PonyComponent;
    gentlePie.ponyClicked.emit(race.ponies[0]);
    harness.detectChanges();

    expect(raceService.cancelBet).toHaveBeenCalledWith(12);
    // we should have no element with the `selected` class
    const selectedElements = harness.routeNativeElement!.querySelectorAll('.selected');
    expect(selectedElements.length).withContext('You should have no element with the `selected` class').toBe(0);
  });

  it('should display a message if canceling a bet fails', async () => {
    // given a race in Paris with 5 ponies and the one with ID 1 being bet
    const modifiedRace = { ...race, betPonyId: 1 };
    raceService.get.and.returnValue(of(modifiedRace));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12', BetComponent);

    raceService.cancelBet.and.callFake(() => throwError(() => new Error('Oops')));

    const debugElement = harness.routeDebugElement!;
    expect(debugElement.query(By.directive(NgbAlert))).toBeNull();

    // cancel bet on pony
    const ponies = debugElement.queryAll(By.directive(PonyComponent));
    const gentlePie = ponies[0].componentInstance as PonyComponent;
    gentlePie.ponyClicked.emit(race.ponies[0]);
    harness.detectChanges();

    expect(raceService.cancelBet).toHaveBeenCalledWith(12);
    // we should have no element with the `selected` class
    const selectedElements = harness.routeNativeElement!.querySelectorAll('.selected');
    expect(selectedElements.length).withContext('You should have an element with the `selected` class as the canceling failed').toBe(1);
    const message = debugElement.query(By.directive(NgbAlert));
    expect(message).withContext('You should have an NgbAlert if the bet failed').not.toBeNull();
    expect((message.nativeElement as HTMLElement).textContent).toContain('The race is already started or finished');
  });

  it('should display a link to go to live', async () => {
    // given a race in Paris with 5 ponies
    raceService.get.and.returnValue(of(race));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/races/12');

    const button = harness.routeNativeElement!.querySelector('a[href="/races/12/live"]')!;
    expect(button).withContext('You should have a link to go to the live with an href `/races/id/live`').not.toBeNull();
    expect(button.textContent).toContain('Watch live!');
  });
});

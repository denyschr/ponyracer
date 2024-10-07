import { Component } from '@angular/core';
import { RaceModel } from '../models/race.model';
import { RaceService } from '../race.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PonyWithPositionModel } from '../models/pony.model';
import { PonyComponent } from '../pony/pony.component';
import { bufferToggle, catchError, EMPTY, filter, groupBy, interval, map, mergeMap, Subject, switchMap, tap, throttleTime } from 'rxjs';
import { FromNowPipe } from '../from-now.pipe';
import { AlertComponent } from '../alert/alert.component';

@Component({
  selector: 'pr-live',
  standalone: true,
  imports: [FromNowPipe, PonyComponent, AlertComponent],
  templateUrl: './live.component.html',
  styleUrl: './live.component.css'
})
export class LiveComponent {
  public raceModel: RaceModel | null = null;
  public poniesWithPosition: PonyWithPositionModel[] = [];
  public winners: PonyWithPositionModel[] = [];
  public betWon: boolean | null = null;
  public error = false;
  public readonly clickSubject = new Subject<PonyWithPositionModel>();

  constructor(
    private _raceService: RaceService,
    private _route: ActivatedRoute
  ) {
    const raceId = parseInt(this._route.snapshot.paramMap.get('raceId')!);
    this._raceService
      .get(raceId)
      .pipe(
        tap(race => (this.raceModel = race)),
        filter(race => race.status !== 'FINISHED'),
        switchMap(race => this._raceService.live(race.id)),
        takeUntilDestroyed()
      )
      .subscribe({
        next: positions => {
          this.raceModel!.status = 'RUNNING';
          this.poniesWithPosition = positions;
        },
        error: () => (this.error = true),
        complete: () => {
          this.raceModel!.status = 'FINISHED';
          this.winners = this.poniesWithPosition.filter(pony => pony.position >= 100);
          this.betWon = this.winners.some(pony => pony.id === this.raceModel?.betPonyId);
        }
      });

    this.clickSubject
      .pipe(
        groupBy(pony => pony.id, { element: pony => pony.id }),
        mergeMap(obs => obs.pipe(bufferToggle(obs, () => interval(1000)))),
        filter(array => array.length >= 5),
        throttleTime(1000),
        map(array => array[0]),
        switchMap(ponyId => this._raceService.boost(this.raceModel!.id, ponyId).pipe(catchError(() => EMPTY)))
      )
      .subscribe();
  }

  public onClick(pony: PonyWithPositionModel): void {
    this.clickSubject.next(pony);
  }
}

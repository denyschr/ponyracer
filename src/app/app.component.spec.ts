import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { provideI18nTesting } from '../i18n-test';
import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { WsService } from './ws.service';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting('fr'),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: WsService,
          useValue: jasmine.createSpyObj<WsService>('WsService', ['connect'])
        }
      ]
    });
  });

  it('should have a router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(RouterOutlet)))
      .withContext('You need a RouterOutlet component in your root component')
      .not.toBeNull();
  });

  it('should use the menu component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MenuComponent)))
      .withContext('You probably forgot to add MenuComponent to the AppComponent template')
      .not.toBeNull();
  });
});

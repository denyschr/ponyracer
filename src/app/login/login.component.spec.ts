import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NgbAlert, NgbAlertConfig } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { provideI18nTesting } from '../../i18n-test';
import { UserService } from '../user.service';
import { UserModel } from '../models/user.model';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['authenticate']);
    TestBed.configureTestingModule({
      providers: [provideI18nTesting(), provideRouter([]), { provide: UserService, useValue: userService }]
    });
    // turn off the animation for the alert
    const alertConfig = TestBed.inject(NgbAlertConfig);
    alertConfig.animation = false;
  });

  it('should have a title', () => {
    const fixture = TestBed.createComponent(LoginComponent);

    // when we trigger the change detection
    fixture.detectChanges();

    // then we should have a title
    const element: HTMLElement = fixture.nativeElement;
    const title = element.querySelector('h1')!;
    expect(title).withContext('The template should have an `h1` element').not.toBeNull();
    expect(title.textContent).withContext('The title should have a text').toContain('Log in');
  });

  it('should have a disabled button if the form is incomplete', () => {
    const fixture = TestBed.createComponent(LoginComponent);

    // when we trigger the change detection
    fixture.detectChanges();

    // then we should have a disabled button
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('button')).withContext('The template should have a button').not.toBeNull();
    expect(element.querySelector('button')!.hasAttribute('disabled'))
      .withContext('The button should be disabled if the form is invalid')
      .toBe(true);
  });

  it('should be possible to log in if the form is complete', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const loginInput = element.querySelector('input')!;
    expect(loginInput).withContext('You should have an input for the login').not.toBeNull();
    loginInput.value = 'login';
    loginInput.dispatchEvent(new Event('input'));

    const passwordInput = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    expect(passwordInput).withContext('You should have an input with the type `password` for the password').not.toBeNull();
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));

    // when we trigger the change detection
    fixture.detectChanges();

    // then we should have a submit button enabled
    expect(element.querySelector('button')!.hasAttribute('disabled'))
      .withContext('The button should be enabled if the form is valid')
      .toBe(false);
  });

  it('should display error messages if fields are dirty and invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);

    // when we trigger the change detection
    fixture.detectChanges();

    // then we should have error fields
    const element: HTMLElement = fixture.nativeElement;
    const loginInput = element.querySelector('input')!;
    expect(loginInput).withContext('You should have an input for the login').not.toBeNull();
    loginInput.value = 'login';
    loginInput.dispatchEvent(new Event('input'));
    loginInput.value = '';
    loginInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const loginError = element.querySelector('div.mb-3 div')!;
    expect(loginError).withContext('You should have an error message if the login field is required and dirty').not.toBeNull();
    expect(loginError.textContent).withContext('The error message for the login field is incorrect').toContain('Login is required');

    loginInput.value = 'login';
    loginInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const passwordInput = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    expect(passwordInput).withContext('You should have an input with the type `password` for the password').not.toBeNull();
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    passwordInput.value = '';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const passwordError = element.querySelector('div.mb-3 div')!;
    expect(passwordError).withContext('You should have an error message if the password field is required and dirty').not.toBeNull();
    expect(passwordError.textContent)
      .withContext('The error message for the password field is incorrect')
      .toContain('Password is required');
  });

  it('should call the user service and redirect if success', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(LoginComponent);

    fixture.detectChanges();

    const subject = new Subject<UserModel>();
    userService.authenticate.and.returnValue(subject);

    const element: HTMLElement = fixture.nativeElement;
    const loginInput = element.querySelector('input')!;
    expect(loginInput).withContext('You should have an input for the login').not.toBeNull();
    loginInput.value = 'login';
    loginInput.dispatchEvent(new Event('input'));

    const passwordInput = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    expect(passwordInput).withContext('You should have an input with the type `password` for the password').not.toBeNull();

    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('button')!.click();

    // then we should have called the user service method
    expect(userService.authenticate).toHaveBeenCalledWith('login', 'password');

    subject.next({} as UserModel);
    // and redirect to the home
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should call the user service and display a message if failed', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(LoginComponent);

    fixture.detectChanges();

    const subject = new Subject<UserModel>();
    userService.authenticate.and.returnValue(subject);

    const element: HTMLElement = fixture.nativeElement;
    expect(fixture.debugElement.query(By.directive(NgbAlert)))
      .withContext('You should not have an error message before trying to log in')
      .toBeNull();

    const loginInput = element.querySelector('input')!;
    expect(loginInput).withContext('You should have an input for the login').not.toBeNull();
    loginInput.value = 'login';
    loginInput.dispatchEvent(new Event('input'));

    const passwordInput = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    expect(passwordInput).withContext('You should have an input with the type `password` for the password').not.toBeNull();
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    element.querySelector('button')!.click();

    // then we should have called the user service method
    expect(userService.authenticate).toHaveBeenCalledWith('login', 'password');

    subject.error(new Error());
    fixture.detectChanges();
    // and not redirect to the home
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    const alert = fixture.debugElement.query(By.directive(NgbAlert));
    expect(alert).withContext('You should have NgbAlert to display an error message').not.toBeNull();
    expect((alert.nativeElement as HTMLElement).textContent).toContain('Nope, try again');

    const alertComponent = alert.componentInstance as NgbAlert;
    expect(alertComponent.type).withContext('The alert should be a danger one').toBe('danger');
  });
});

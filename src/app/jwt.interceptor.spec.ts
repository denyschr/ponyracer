import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { UserModel } from './models/user.model';
import { UserService } from './user.service';

describe('jwtInterceptor', () => {
  let currentUser: WritableSignal<UserModel | null>;
  let userService: jasmine.SpyObj<UserService>;
  let httpController: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    currentUser = signal(null);
    userService = jasmine.createSpyObj<UserService>('UserService', [], { currentUser });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService }
      ]
    });
    httpController = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  it('should do nothing if there is no jwt token', () => {
    http.get('/api/foo').subscribe();

    const testRequest = httpController.expectOne('/api/foo');
    expect(testRequest.request.headers.get('Authorization')).toBe(null);
  });

  it('should send a jwt token', () => {
    currentUser.set({ token: 'hello' } as UserModel);

    http.get('/api/foo').subscribe();

    const testRequest = httpController.expectOne('/api/foo');
    expect(testRequest.request.headers.get('Authorization')).toBe('Bearer hello');
  });
});

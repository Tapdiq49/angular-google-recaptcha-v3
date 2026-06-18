import {
  createEnvironmentInjector,
  EnvironmentInjector,
  EventEmitter,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecaptchaV3Service } from './recaptcha-v3.service';
import { RecaptchaLoaderService, RECAPTCHA_CONFIG } from 'angular-google-recaptcha-v3/core';

const MOCK_TOKEN = 'mock-recaptcha-v3-token';

function mockGrecaptcha(token: string | null = MOCK_TOKEN, shouldFail = false): void {
  (window as Window & { grecaptcha?: unknown }).grecaptcha = {
    ready: (cb: () => void) => cb(),
    execute: () =>
      shouldFail
        ? Promise.reject(new Error('grecaptcha error'))
        : Promise.resolve(token)
  };
}

function clearGrecaptcha(): void {
  delete (window as Window & { grecaptcha?: unknown }).grecaptcha;
}

// Mock NgZone without using `any`.
// `as unknown as NgZone` is the standard TypeScript pattern for casting mocks to
// a concrete type when we only need a safe structural subset of the interface.
function buildMockNgZone(): NgZone {
  return {
    run: <T>(fn: (...args: unknown[]) => T) => fn(),
    runOutsideAngular: <T>(fn: (...args: unknown[]) => T) => fn(),
    runGuarded: <T>(fn: (...args: unknown[]) => T) => fn(),
    runTask: <T>(fn: (...args: unknown[]) => T) => fn(),
    isStable: true,
    hasPendingMicrotasks: false,
    hasPendingMacrotasks: false,
    onUnstable: new EventEmitter<unknown>(),
    onMicrotaskEmpty: new EventEmitter<unknown>(),
    onStable: new EventEmitter<unknown>(),
    onError: new EventEmitter<unknown>(),
  } as unknown as NgZone;
}

function buildInjector(
  config: Record<string, unknown> = { v3SiteKey: 'test-site-key' },
  loaderResolved = true,
  platformId = 'browser'
): EnvironmentInjector {
  // Use TestBed's root EnvironmentInjector as parent — required by createEnvironmentInjector.
  const parent = TestBed.inject(EnvironmentInjector);
  return createEnvironmentInjector(
    [
      RecaptchaV3Service,
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: RECAPTCHA_CONFIG, useValue: config },
      { provide: NgZone, useValue: buildMockNgZone() },
      {
        provide: RecaptchaLoaderService,
        useValue: { loadScript: () => of(loaderResolved) }
      }
    ],
    parent
  );
}

describe('RecaptchaV3Service', () => {
  let injector: EnvironmentInjector;

  afterEach(() => {
    clearGrecaptcha();
    injector?.destroy();
  });

  it('should be created', () => {
    injector = buildInjector();
    expect(injector.get(RecaptchaV3Service)).toBeTruthy();
  });

  it('should return empty string observable when SSR (not in browser)', (done) => {
    injector = buildInjector({ v3SiteKey: 'key' }, true, 'server');
    injector.get(RecaptchaV3Service).execute('login').subscribe((token) => {
      expect(token).toBe('');
      done();
    });
  });

  it('should error when v3SiteKey is not provided in config', (done) => {
    injector = buildInjector({});
    injector.get(RecaptchaV3Service).execute('login').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('siteKey is not provided');
        done();
      }
    });
  });

  it('should return a token on successful execute()', (done) => {
    mockGrecaptcha(MOCK_TOKEN);
    injector = buildInjector();
    injector.get(RecaptchaV3Service).execute('login').subscribe((token) => {
      expect(token).toBe(MOCK_TOKEN);
      done();
    });
  });

  it('should error when grecaptcha returns a null token', (done) => {
    mockGrecaptcha(null);
    injector = buildInjector();
    injector.get(RecaptchaV3Service).execute('login').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('null/undefined token');
        done();
      }
    });
  });

  it('should error when grecaptcha.execute() rejects', (done) => {
    mockGrecaptcha(MOCK_TOKEN, true);
    injector = buildInjector();
    injector.get(RecaptchaV3Service).execute('login').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('grecaptcha error');
        done();
      }
    });
  });

  it('should error when window.grecaptcha is not available', (done) => {
    clearGrecaptcha();
    injector = buildInjector();
    injector.get(RecaptchaV3Service).execute('login').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('not loaded');
        done();
      }
    });
  });

  it('executeAsync() should resolve to the token', async () => {
    mockGrecaptcha(MOCK_TOKEN);
    injector = buildInjector();
    const token = await injector.get(RecaptchaV3Service).executeAsync('checkout');
    expect(token).toBe(MOCK_TOKEN);
  });

  it('concurrent execute() calls should not cancel each other (mergeMap behaviour)', (done) => {
    mockGrecaptcha(MOCK_TOKEN);
    injector = buildInjector();
    const service = injector.get(RecaptchaV3Service);
    let count = 0;
    const check = () => { if (++count === 2) done(); };
    service.execute('action1').subscribe({ next: () => check() });
    service.execute('action2').subscribe({ next: () => check() });
  });
});

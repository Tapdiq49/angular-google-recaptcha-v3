import { createEnvironmentInjector, EnvironmentInjector, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RecaptchaLoaderService } from './loader.service';
import { RECAPTCHA_CONFIG } from './tokens';
import { RecaptchaLoadError } from './errors';

function removeRecaptchaScript(): void {
  const script = document.getElementById('angular-google-recaptcha-v3-script');
  if (script?.parentNode) {
    script.parentNode.removeChild(script);
  }
}

function clearGlobals(): void {
  const w = window as Window & { grecaptcha?: unknown; ngRecaptchaLoaded?: unknown };
  delete w.grecaptcha;
  delete w.ngRecaptchaLoaded;
}

function buildInjector(config: Record<string, unknown> = {}, platformId = 'browser'): EnvironmentInjector {
  // Use TestBed's root EnvironmentInjector as parent — required by createEnvironmentInjector.
  const parent = TestBed.inject(EnvironmentInjector);
  return createEnvironmentInjector(
    [
      RecaptchaLoaderService,
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: RECAPTCHA_CONFIG, useValue: config },
    ],
    parent
  );
}

describe('RecaptchaLoaderService', () => {
  let injector: EnvironmentInjector;

  beforeEach(() => {
    removeRecaptchaScript();
    clearGlobals();
  });

  afterEach(() => {
    removeRecaptchaScript();
    clearGlobals();
    injector?.destroy();
  });

  it('should be created', () => {
    injector = buildInjector();
    expect(injector.get(RecaptchaLoaderService)).toBeTruthy();
  });

  it('should return of(false) when not in browser (SSR)', async () => {
    injector = buildInjector({}, 'server');
    const result = await firstValueFrom(injector.get(RecaptchaLoaderService).loadScript());
    expect(result).toBe(false);
  });

  it('should inject a script tag into document.head', () => {
    injector = buildInjector({ v3SiteKey: 'test-key' });
    injector.get(RecaptchaLoaderService).loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('google.com/recaptcha/api.js');
    expect(script.src).toContain('test-key');
  });

  it('should use enterprise.js when useEnterprise is true', () => {
    injector = buildInjector({ useEnterprise: true });
    injector.get(RecaptchaLoaderService).loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script.src).toContain('enterprise.js');
  });

  it('should use recaptcha.net domain when useEnterprise is true', () => {
    injector = buildInjector({ useEnterprise: true });
    injector.get(RecaptchaLoaderService).loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script.src).toContain('recaptcha.net');
  });

  it('should use custom recaptchaDomain when provided', () => {
    injector = buildInjector({ recaptchaDomain: 'recaptcha.net' });
    injector.get(RecaptchaLoaderService).loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script.src).toContain('recaptcha.net');
  });

  it('should include hl param when language is set', () => {
    injector = buildInjector({ language: 'az' });
    injector.get(RecaptchaLoaderService).loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script.src).toContain('hl=az');
  });

  it('should not inject a second script tag on duplicate loadScript() calls', () => {
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    service.loadScript();
    service.loadScript();
    const scripts = document.querySelectorAll('#angular-google-recaptcha-v3-script');
    expect(scripts.length).toBe(1);
  });

  it('should register window.ngRecaptchaLoaded callback after loadScript()', () => {
    injector = buildInjector();
    injector.get(RecaptchaLoaderService).loadScript();
    const w = window as Window & { ngRecaptchaLoaded?: unknown };
    expect(typeof w.ngRecaptchaLoaded).toBe('function');
  });

  it('should emit true when window.ngRecaptchaLoaded is called', (done) => {
    injector = buildInjector();
    injector.get(RecaptchaLoaderService).loadScript().subscribe((loaded) => {
      if (loaded) {
        expect(loaded).toBe(true);
        done();
      }
    });
    const w = window as Window & { ngRecaptchaLoaded?: () => void };
    w.ngRecaptchaLoaded?.();
  });

  it('should return of(true) immediately if script already loaded', async () => {
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    service.loadScript();
    const w = window as Window & { ngRecaptchaLoaded?: () => void };
    w.ngRecaptchaLoaded?.(); // mark as loaded
    const result = await firstValueFrom(service.loadScript());
    expect(result).toBe(true);
  });

  it('should emit on scriptLoadError$ after maxRetries are exhausted', (done) => {
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);

    service.scriptLoadError$.subscribe((err) => {
      expect(err instanceof RecaptchaLoadError).toBe(true);
      expect(err.message).toContain('Failed to load');
      done();
    });

    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();

    jest.useFakeTimers();
    for (let i = 0; i <= 3; i++) {
      script.dispatchEvent(new Event('error'));
      jest.runAllTimers();
    }
    jest.useRealTimers();
  });

  it('should propagate error through loadScript() after maxRetries are exhausted', (done) => {
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);

    service.loadScript().subscribe({
      next: () => fail('should not emit value'),
      error: (err) => {
        expect(err instanceof RecaptchaLoadError).toBe(true);
        expect(err.message).toContain('Failed to load');
        done();
      }
    });

    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();

    jest.useFakeTimers();
    for (let i = 0; i <= 3; i++) {
      script.dispatchEvent(new Event('error'));
      jest.runAllTimers();
    }
    jest.useRealTimers();
  });
});

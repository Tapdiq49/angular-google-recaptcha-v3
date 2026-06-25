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
    // Arrange & Act
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);

    // Assert
    expect(service).toBeTruthy();
  });

  it('should return of(false) when not in browser (SSR)', async () => {
    // Arrange
    injector = buildInjector({}, 'server');
    const service = injector.get(RecaptchaLoaderService);

    // Act
    const result = await firstValueFrom(service.loadScript());

    // Assert
    expect(result).toBe(false);
  });

  it('should inject a script tag into document.head', () => {
    // Arrange
    injector = buildInjector({ v3SiteKey: 'test-key' });
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;

    // Assert
    expect(script).toBeTruthy();
    expect(script.src).toContain('google.com/recaptcha/api.js');
    expect(script.src).toContain('test-key');
  });

  it('should use enterprise.js when useEnterprise is true', () => {
    // Arrange
    injector = buildInjector({ useEnterprise: true });
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;

    // Assert
    expect(script.src).toContain('enterprise.js');
  });

  it('should use recaptcha.net domain when useEnterprise is true', () => {
    // Arrange
    injector = buildInjector({ useEnterprise: true });
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;

    // Assert
    expect(script.src).toContain('recaptcha.net');
  });

  it('should use custom recaptchaDomain when provided', () => {
    // Arrange
    injector = buildInjector({ recaptchaDomain: 'recaptcha.net' });
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;

    // Assert
    expect(script.src).toContain('recaptcha.net');
  });

  it('should include hl param when language is set', () => {
    // Arrange
    injector = buildInjector({ language: 'az' });
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;

    // Assert
    expect(script.src).toContain('hl=az');
  });

  it('should not inject a second script tag on duplicate loadScript() calls', () => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    service.loadScript();
    const scripts = document.querySelectorAll('#angular-google-recaptcha-v3-script');

    // Assert
    expect(scripts.length).toBe(1);
  });

  it('should register window.ngRecaptchaLoaded callback after loadScript()', () => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);

    // Act
    service.loadScript();
    const w = window as Window & { ngRecaptchaLoaded?: unknown };

    // Assert
    expect(typeof w.ngRecaptchaLoaded).toBe('function');
  });

  it('should emit true when window.ngRecaptchaLoaded is called', (done) => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    const stream$ = service.loadScript();
    const w = window as Window & { ngRecaptchaLoaded?: () => void };

    // Act & Assert
    stream$.subscribe((loaded) => {
      if (loaded) {
        expect(loaded).toBe(true);
        done();
      }
    });
    w.ngRecaptchaLoaded?.();
  });

  it('should return of(true) immediately if script already loaded', async () => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    service.loadScript();
    const w = window as Window & { ngRecaptchaLoaded?: () => void };
    w.ngRecaptchaLoaded?.(); // mark as loaded

    // Act
    const result = await firstValueFrom(service.loadScript());

    // Assert
    expect(result).toBe(true);
  });

  it('should emit on scriptLoadError$ after maxRetries are exhausted', (done) => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    const scriptLoadError$ = service.scriptLoadError$;

    scriptLoadError$.subscribe((err) => {
      // Assert
      expect(err instanceof RecaptchaLoadError).toBe(true);
      expect(err.message).toContain('Failed to load');
      done();
    });

    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();

    // Act
    jest.useFakeTimers();
    for (let i = 0; i <= 3; i++) {
      script.dispatchEvent(new Event('error'));
      jest.runAllTimers();
    }
    jest.useRealTimers();
  });

  it('should propagate error through loadScript() after maxRetries are exhausted', (done) => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    const stream$ = service.loadScript();

    stream$.subscribe({
      next: () => fail('should not emit value'),
      error: (err) => {
        // Assert
        expect(err instanceof RecaptchaLoadError).toBe(true);
        expect(err.message).toContain('Failed to load');
        done();
      }
    });

    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();

    // Act
    jest.useFakeTimers();
    for (let i = 0; i <= 3; i++) {
      script.dispatchEvent(new Event('error'));
      jest.runAllTimers();
    }
    jest.useRealTimers();
  });

  it('should emit correct statuses on scriptLoadStatus$', (done) => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    const statuses: string[] = [];
    const w = window as Window & { ngRecaptchaLoaded?: () => void };

    service.scriptLoadStatus$.subscribe((status) => {
      statuses.push(status);
      if (status === 'loaded') {
        // Assert
        expect(statuses).toEqual(['idle', 'loading', 'loaded']);
        done();
      }
    });

    // Act
    service.loadScript();
    w.ngRecaptchaLoaded?.();
  });

  it('should emit error status on scriptLoadStatus$ when retry fails', (done) => {
    // Arrange
    injector = buildInjector();
    const service = injector.get(RecaptchaLoaderService);
    const statuses: string[] = [];

    service.scriptLoadStatus$.subscribe((status) => {
      statuses.push(status);
      if (status === 'error') {
        // Assert
        expect(statuses).toEqual(['idle', 'loading', 'error']);
        done();
      }
    });

    service.loadScript();
    const script = document.getElementById('angular-google-recaptcha-v3-script') as HTMLScriptElement;
    expect(script).toBeTruthy();

    // Act
    jest.useFakeTimers();
    for (let i = 0; i <= 3; i++) {
      script.dispatchEvent(new Event('error'));
      jest.runAllTimers();
    }
    jest.useRealTimers();
  });
});

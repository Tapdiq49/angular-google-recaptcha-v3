import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, Subject, merge, throwError } from 'rxjs';
import { filter, mergeMap, shareReplay } from 'rxjs/operators';
import { RECAPTCHA_CONFIG } from './tokens';
import { RecaptchaLoadError } from './errors';

/** Typed narrowing of `window` — only the globals this service touches. */
type WindowWithRecaptcha = Window &
  typeof globalThis & {
    grecaptcha?: unknown;
    ngRecaptchaLoaded?: (() => void) | undefined;
  };

@Injectable({
  providedIn: 'root'
})
export class RecaptchaLoaderService {
  private config = inject(RECAPTCHA_CONFIG, { optional: true });
  private platformId = inject(PLATFORM_ID);

  private scriptLoaded$ = new BehaviorSubject<boolean>(false);
  private scriptError$ = new Subject<Error>();
  private isBrowser = isPlatformBrowser(this.platformId);

  // Fix #1: retryCount is now a class-level field so recursive injectScript() calls
  // correctly accumulate retries instead of resetting to 0 each time.
  private retryCount = 0;
  private readonly maxRetries = 3;

  /**
   * Emits when the reCAPTCHA script fails to load after all retries.
   * Subscribe to this to handle load errors gracefully.
   */
  public readonly scriptLoadError$ = this.scriptError$.asObservable();

  private ready$!: Observable<boolean>;

  constructor() {
    this.recreateReadyObservable();
  }

  private recreateReadyObservable(): void {
    this.ready$ = merge(
      this.scriptLoaded$.pipe(
        filter((loaded) => loaded)
      ),
      this.scriptError$.pipe(
        mergeMap((err) => throwError(() => err))
      )
    ).pipe(
      shareReplay(1)
    );
  }

  /**
   * Loads the reCAPTCHA script.
   * Returns an Observable that emits true once the script is ready,
   * or false immediately when not running in a browser context.
   */
  public loadScript(): Observable<boolean> {
    if (!this.isBrowser) {
      return of(false);
    }

    if (this.scriptLoaded$.value) {
      return of(true);
    }

    // Reset retry states if previously failed to allow recovery
    if (this.retryCount >= this.maxRetries) {
      this.retryCount = 0;
      this.recreateReadyObservable();
      const existingScript = document.getElementById('angular-google-recaptcha-v3-script');
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    }

    this.injectScript();
    return this.ready$;
  }

  private injectScript(): void {
    if (!this.isBrowser || typeof window === 'undefined') return;

    // Prevent duplicate script injection
    const existingScript = document.getElementById('angular-google-recaptcha-v3-script');
    if (existingScript) {
      const windowRef = window as WindowWithRecaptcha;
      if (windowRef.grecaptcha) {
        this.scriptLoaded$.next(true);
      } else {
        // Script tag exists but grecaptcha not ready yet — chain onto existing callback
        const prevCallback = windowRef.ngRecaptchaLoaded;
        windowRef.ngRecaptchaLoaded = () => {
          if (prevCallback) prevCallback();
          this.scriptLoaded$.next(true);
        };
      }
      return;
    }

    const conf = this.config || {};
    const useEnterprise = conf.useEnterprise || false;
    const siteKeyQuery = conf.v3SiteKey ? `&render=${conf.v3SiteKey}` : '';
    const hl = conf.language ? `&hl=${conf.language}` : '';

    // Explicit domain configuration (google.com default, recaptcha.net as fallback)
    const domain = conf.recaptchaDomain || (useEnterprise ? 'recaptcha.net' : 'google.com');
    const apiPath = useEnterprise ? 'enterprise.js' : 'api.js';

    const script = document.createElement('script');
    script.id = 'angular-google-recaptcha-v3-script';
    script.src = `https://www.${domain}/recaptcha/${apiPath}?onload=ngRecaptchaLoaded${siteKeyQuery}${hl}`;
    script.async = true;
    script.defer = true;

    const windowRef = window as WindowWithRecaptcha;
    windowRef.ngRecaptchaLoaded = () => {
      this.scriptLoaded$.next(true);
    };

    script.onerror = () => {
      // Fix #1: retryCount is now class-level — recursive calls accumulate correctly.
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          this.injectScript();
        }, this.retryCount * 1000); // Linear back-off
      } else {
        // Fix #2: Emit the error on a separate Subject instead of poisoning the
        // BehaviorSubject. scriptLoaded$ stays usable; callers subscribe to
        // scriptLoadError$ for failure notifications.
        this.scriptError$.next(
          new RecaptchaLoadError('Failed to load Google reCAPTCHA script after multiple retries.')
        );
      }
    };

    document.head.appendChild(script);
  }
}

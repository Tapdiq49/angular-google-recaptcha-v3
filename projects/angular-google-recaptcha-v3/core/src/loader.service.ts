import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { RECAPTCHA_CONFIG } from './tokens';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaLoaderService {
  private config = inject(RECAPTCHA_CONFIG, { optional: true });
  private platformId = inject(PLATFORM_ID);
  
  private scriptLoaded$ = new BehaviorSubject<boolean>(false);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Loads the reCAPTCHA script.
   * Returns an Observable emitting true when loaded, or false if not in browser.
   */
  public loadScript(): Observable<boolean> {
    if (!this.isBrowser) {
      return of(false);
    }

    if (this.scriptLoaded$.value) {
      return of(true);
    }

    this.injectScript();
    return this.scriptLoaded$.asObservable().pipe(
      shareReplay(1)
    );
  }

  private injectScript(): void {
    if (!this.isBrowser || typeof window === 'undefined') return;

    // Check if script already exists to prevent duplicate script injection
    const existingScript = document.getElementById('angular-google-recaptcha-v3-script');
    if (existingScript) {
      // Script is already in DOM; check if global grecaptcha is available
      const windowRef = window as any;
      if (windowRef.grecaptcha) {
        this.scriptLoaded$.next(true);
      } else {
        // If script is injected but not ready, intercept load callback
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
    
    // Explicit domain configuration (google.com default, recaptcha.net fallback)
    const domain = conf.recaptchaDomain || (useEnterprise ? 'recaptcha.net' : 'google.com');
    const apiPath = useEnterprise ? 'enterprise.js' : 'api.js';

    const script = document.createElement('script');
    script.id = 'angular-google-recaptcha-v3-script';
    script.src = `https://www.${domain}/recaptcha/${apiPath}?onload=ngRecaptchaLoaded${siteKeyQuery}${hl}`;
    script.async = true;
    script.defer = true;

    // Handle isolated unique callback
    const windowRef = window as any;
    windowRef.ngRecaptchaLoaded = () => {
      this.scriptLoaded$.next(true);
    };

    let retryCount = 0;
    const maxRetries = 3;

    script.onerror = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => {
          document.head.removeChild(script);
          this.injectScript();
        }, retryCount * 1000); // Linear backoff retry
      } else {
        this.scriptLoaded$.error(new Error('Failed to load Google reCAPTCHA script after multiple retries.'));
      }
    };

    document.head.appendChild(script);
  }
}

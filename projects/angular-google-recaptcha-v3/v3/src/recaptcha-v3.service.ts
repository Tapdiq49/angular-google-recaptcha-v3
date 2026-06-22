import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, firstValueFrom } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { RecaptchaLoaderService, RECAPTCHA_CONFIG, RecaptchaConfigurationError, RecaptchaExecuteError, RecaptchaLoadError } from 'angular-google-recaptcha-v3/core';

/** Minimal structural type for the `grecaptcha` / `grecaptcha.enterprise` object. */
interface Grecaptcha {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string | null | undefined>;
}

/** Typed narrowing of `window` — only the globals this service reads. */
type WindowWithGrecaptcha = Window &
  typeof globalThis & {
    grecaptcha?: Grecaptcha & { enterprise?: Grecaptcha };
  };

@Injectable({
  providedIn: 'root'
})
export class RecaptchaV3Service {
  private loader = inject(RecaptchaLoaderService);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private config = inject(RECAPTCHA_CONFIG, { optional: true });

  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Executes a specific action on the V3 siteKey and yields the token as an Observable.
   *
   * Uses mergeMap (not switchMap) so that concurrent calls are not cancelled —
   * each invocation runs to completion independently.
   */
  public execute(action: string): Observable<string> {
    if (!this.isBrowser) {
      return new Observable<string>((subscriber) => {
        subscriber.next('');
        subscriber.complete();
      });
    }

    const siteKey = this.config?.v3SiteKey;
    if (!siteKey) {
      return new Observable<string>((subscriber) => {
        subscriber.error(new RecaptchaConfigurationError('reCAPTCHA v3 siteKey is not provided in RECAPTCHA_CONFIG.'));
      });
    }

    return this.loader.loadScript().pipe(
      // Fix #9: mergeMap preserves all concurrent execute() calls.
      // switchMap would cancel the first call if a second one arrives before completion.
      mergeMap(() => {
        return new Observable<string>((subscriber) => {
          this.ngZone.runOutsideAngular(() => {
            const windowRef = window as WindowWithGrecaptcha;
            const grecaptchaObj = windowRef.grecaptcha?.enterprise ?? windowRef.grecaptcha;

            if (!grecaptchaObj) {
              this.ngZone.run(() => {
                subscriber.error(new RecaptchaLoadError('Google reCAPTCHA script is not loaded or missing.'));
              });
              return;
            }

            grecaptchaObj.ready(() => {
              grecaptchaObj.execute(siteKey, { action })
                .then((token: string | null | undefined) => {
                  this.ngZone.run(() => {
                    if (!token) {
                      subscriber.error(new RecaptchaExecuteError('Google reCAPTCHA returned null/undefined token.'));
                      return;
                    }
                    subscriber.next(token);
                    subscriber.complete();
                  });
                })
                .catch((err: unknown) => {
                  this.ngZone.run(() => {
                    const message = err instanceof Error ? err.message : String(err);
                    subscriber.error(new RecaptchaExecuteError(message));
                  });
                });
            });
          });
        });
      })
    );
  }

  /**
   * Executes a specific action on the V3 siteKey and yields the token as a Promise.
   * Ideal for modern async/await execution pipelines.
   */
  public executeAsync(action: string): Promise<string> {
    return firstValueFrom(this.execute(action));
  }
}

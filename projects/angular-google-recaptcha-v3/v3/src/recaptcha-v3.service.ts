import { Injectable, NgZone, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RecaptchaLoaderService, RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';

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
   * Executes a specific action on the V3 siteKey and yields the resolution token as an Observable.
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
        subscriber.error(new Error('reCAPTCHA v3 siteKey is not provided in RECAPTCHA_CONFIG.'));
      });
    }

    return this.loader.loadScript().pipe(
      switchMap(() => {
        return new Observable<string>((subscriber) => {
          this.ngZone.runOutsideAngular(() => {
            const windowRef = window as any;
            const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;

            if (!grecaptchaObj) {
              this.ngZone.run(() => {
                subscriber.error(new Error('Google reCAPTCHA script is not loaded or missing.'));
              });
              return;
            }

            grecaptchaObj.ready(() => {
              grecaptchaObj.execute(siteKey, { action })
                .then((token: string | null | undefined) => {
                  this.ngZone.run(() => {
                    if (!token) {
                      subscriber.error(new Error('Google reCAPTCHA returned null/undefined token.'));
                      return;
                    }
                    subscriber.next(token);
                    subscriber.complete();
                  });
                })
                .catch((err: any) => {
                  this.ngZone.run(() => {
                    subscriber.error(err);
                  });
                });
            });
          });
        });
      })
    );
  }

  /**
   * Executes a specific action on the V3 siteKey and yields the resolution token as a Promise.
   * Ideal for modern async/await execution pipelines.
   */
  public executeAsync(action: string): Promise<string> {
    return firstValueFrom(this.execute(action));
  }
}

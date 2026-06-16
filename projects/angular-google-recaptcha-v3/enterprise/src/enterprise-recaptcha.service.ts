import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';
import { RECAPTCHA_CONFIG } from 'angular-google-recaptcha-v3/core';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseRecaptchaService {
  private v3Service = inject(RecaptchaV3Service);
  private platformId = inject(PLATFORM_ID);
  private config = inject(RECAPTCHA_CONFIG, { optional: true });

  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Executes score-based action verification using Google reCAPTCHA Enterprise.
   */
  public executeAction(action: string): Observable<string> {
    if (!this.isBrowser) {
      return of('');
    }

    if (!this.config?.useEnterprise) {
      console.warn('RECAPTCHA_CONFIG has useEnterprise set to false. Ensure this is configured.');
    }

    return this.v3Service.execute(action);
  }
}

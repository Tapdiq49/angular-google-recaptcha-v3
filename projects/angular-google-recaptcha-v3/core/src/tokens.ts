import { InjectionToken } from '@angular/core';

export interface RecaptchaConfig {
  v2SiteKey?: string;
  v3SiteKey?: string;
  language?: string;
  useEnterprise?: boolean;
  recaptchaDomain?: 'google.com' | 'recaptcha.net';
}

export const RECAPTCHA_CONFIG = new InjectionToken<RecaptchaConfig>('RECAPTCHA_CONFIG');

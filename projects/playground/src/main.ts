import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';

const isBrowserEnv = typeof window !== 'undefined';
const savedDomainVal = isBrowserEnv ? localStorage.getItem('recaptcha_domain') || 'google.com' : 'google.com';
const savedDomain: 'google.com' | 'recaptcha.net' =
  savedDomainVal === 'recaptcha.net' ? 'recaptcha.net' : 'google.com';
const savedEnterprise = isBrowserEnv ? localStorage.getItem('recaptcha_enterprise') === 'true' : false;

const recaptchaConfig: RecaptchaConfig = {
  v2SiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google official V2 test key
  // NOTE: reCAPTCHA v3 does NOT have a public test key. Replace this with a real
  // v3 site key from https://www.google.com/recaptcha/admin to test v3 features.
  v3SiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // V2 key — v3 needs a real key
  recaptchaDomain: savedDomain,
  useEnterprise: savedEnterprise
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RECAPTCHA_CONFIG, useValue: recaptchaConfig }
  ]
}).catch(err => console.error(err));

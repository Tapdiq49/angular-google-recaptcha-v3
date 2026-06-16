import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';

const recaptchaConfig: RecaptchaConfig = {
  v2SiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google official V2 test key
  v3SiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google official V2/V3 test key
  recaptchaDomain: 'google.com',
  useEnterprise: false
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RECAPTCHA_CONFIG, useValue: recaptchaConfig }
  ]
}).catch(err => console.error(err));

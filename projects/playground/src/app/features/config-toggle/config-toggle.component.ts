import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';

@Component({
  selector: 'app-config-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-toggle.component.html',
  styleUrl: './config-toggle.component.scss'
})
export class ConfigToggleComponent {
  private config = inject(RECAPTCHA_CONFIG, { optional: true });

  public currentDomain = signal<string>('google.com');
  public currentEnterpriseMode = signal<boolean>(false);

  public readonly configCode = `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';

const recaptchaConfig: RecaptchaConfig = {
  v2SiteKey: "YOUR_V2_SITE_KEY",
  v3SiteKey: "YOUR_V3_SITE_KEY",
  recaptchaDomain: "google.com", // Optional: standard "google.com" or regional "recaptcha.net"
  useEnterprise: false           // Optional: set to true to load Google Enterprise script
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RECAPTCHA_CONFIG, useValue: recaptchaConfig }
  ]
}).catch(err => console.error(err));`;

  constructor() {
    // Populate active config simulation values
    if (this.config) {
      this.currentDomain.set(this.config.recaptchaDomain || 'google.com');
      this.currentEnterpriseMode.set(this.config.useEnterprise || false);
    }
  }

  public isReloadRequired = signal(false);

  public toggleDomain(): void {
    if (this.config) {
      const newDomain = this.currentDomain() === 'google.com' ? 'recaptcha.net' : 'google.com';
      this.config.recaptchaDomain = newDomain;
      this.currentDomain.set(newDomain);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recaptcha_domain', newDomain);
      }
      this.isReloadRequired.set(true);
    }
  }

  public toggleEnterprise(): void {
    if (this.config) {
      const newMode = !this.currentEnterpriseMode();
      this.config.useEnterprise = newMode;
      this.currentEnterpriseMode.set(newMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recaptcha_enterprise', String(newMode));
      }
      this.isReloadRequired.set(true);
    }
  }

  public reloadPage(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

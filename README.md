# angular-google-recaptcha-v3

A production-grade, enterprise-ready, tree-shakable Angular library for integrating Google reCAPTCHA v2 (Checkbox & Invisible), v3, and Enterprise. Fully compatible with Angular 17.1 through 22, SSR‑safe (Universal), and native Angular Signals‑ready.

 **<a href="https://tapdiq49.github.io/angular-google-recaptcha-v3/" target="_blank">Interactive Live Demo (Playground)</a>**

---

## Key Features

- **Full Angular Compatibility**: Out‑of‑the‑box support for Angular 17.1 to 22.
- **First‑Class Signals Support**: Decoupled `angular-google-recaptcha-v3/signals` entry point for modern reactive applications.
- **SSR & Hydration Safe**: Strictly guards DOM operations on the server side using `isPlatformBrowser`.
- **Zoneless Support**: Executes heavy execution logic outside `Zone.js` context for high performance.
- **Dynamic Re‑Render**: V2 widget automatically re‑renders when inputs (theme, size, tabIndex, siteKey) change! No manual cleanup required!
- **Tree‑Shakable Secondary Entry Points**: Only import what you use (`core`, `v2`, `v3`, `enterprise`, `signals`, `forms`, `testing`).
- **ControlValueAccessor (CVA)**: Native support for Reactive Forms and Template‑driven Forms.
- **Region & Domain Flex**: Easily switch between `google.com` and `recaptcha.net` (for restricted regions).

---

## Folder & Entrypoint Architecture

To provide clean architectural separation and optimize bundle sizes, the codebase utilizes isolated secondary entry points:

- `angular-google-recaptcha-v3/core`: Script loading lifecycle, dynamic configuration tokens.
- `angular-google-recaptcha-v3/v2`: V2 Checkbox and Invisible component.
- `angular-google-recaptcha-v3/v3`: Score‑based execution service.
- `angular-google-recaptcha-v3/enterprise`: Score‑based Enterprise service.
- `angular-google-recaptcha-v3/forms`: Angular Forms ControlValueAccessor directive.
- `angular-google-recaptcha-v3/signals`: Reactive signals wrapper (Angular 16+ only).
- `angular-google-recaptcha-v3/testing`: Mock services and providers for Jest/Karma test isolation.

---

## Installation

```bash
npm install angular-google-recaptcha-v3
```

Configure your global settings during the application bootstrap phase:

### Standard Module Bootstrapping (Angular 17+)
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';
import { AppComponent } from './app.component';

const recaptchaConfig: RecaptchaConfig = {
  v2SiteKey: 'YOUR_V2_SITE_KEY',
  v3SiteKey: 'YOUR_V3_SITE_KEY',
  recaptchaDomain: 'google.com'
};

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    { provide: RECAPTCHA_CONFIG, useValue: recaptchaConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Standalone Bootstrapping (Angular 17+)
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { RECAPTCHA_CONFIG, RecaptchaConfig } from 'angular-google-recaptcha-v3/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: RECAPTCHA_CONFIG,
      useValue: {
        v2SiteKey: 'YOUR_V2_SITE_KEY',
        v3SiteKey: 'YOUR_V3_SITE_KEY',
        useEnterprise: false
      } as RecaptchaConfig
    }
  ]
});
```

---

## Usage Examples

### 1. reCAPTCHA v2 Checkbox with Reactive Forms

```typescript
import { Component, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaV2Component } from 'angular-google-recaptcha-v3/v2';
import { RecaptchaValueAccessorDirective } from 'angular-google-recaptcha-v3/forms';

@Component({
  selector: 'app-login',
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="username" type="text" placeholder="Username" />
      
      <!-- Toggle theme to test dynamic re-render! -->
      <div style="margin: 1rem 0;">
        <label style="margin-right: 1rem;">
          <input type="radio" [value]="'light'" (change)="setTheme('light')" [checked]="theme() === 'light'"> Light
        </label>
        <label>
          <input type="radio" [value]="'dark'" (change)="setTheme('dark')" [checked]="theme() === 'dark'"> Dark
        </label>
      </div>
      
      <!-- CVA Directive Automatically Binds value to FormGroup -->
      <angular-google-recaptcha-v3 
        [siteKey]="'YOUR_V2_SITE_KEY'"
        [theme]="theme()"
        formControlName="recaptcha">
      </angular-google-recaptcha-v3>
      
      <button [disabled]="loginForm.invalid" type="submit">Login</button>
    </form>
  `,
  standalone: true,
  imports: [ReactiveFormsModule, RecaptchaV2Component, RecaptchaValueAccessorDirective]
})
export class LoginComponent {
  theme = signal<'light' | 'dark'>('light');
  
  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    recaptcha: new FormControl(null, Validators.required)
  });
  
  setTheme(newTheme: 'light' | 'dark'): void {
    this.theme.set(newTheme);
  }

  onSubmit() {
    console.log(this.loginForm.value);
  }
}
```

**Dynamic Re‑Render Feature**: `RecaptchaV2Component` now supports automatic re‑rendering when any of its inputs (siteKey, theme, size, tabIndex) change! This means you can dynamically switch between light/dark themes, or normal/compact/invisible sizes at runtime without any manual cleanup!

### 2. reCAPTCHA v3 Execution Service (RxJS & Promise)

```typescript
import { Component, inject } from '@angular/core';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';

@Component({
  selector: 'app-payment',
  template: `
    <div style="display: flex; gap: 1rem;">
      <button (click)="processPaymentRxjs()">Pay Now (RxJS)</button>
      <button (click)="processPaymentAsync()">Pay Now (Async/Await)</button>
    </div>
  `,
  standalone: true
})
export class PaymentComponent {
  private recaptchaV3 = inject(RecaptchaV3Service);

  processPaymentRxjs(): void {
    this.recaptchaV3.execute('checkout').subscribe({
      next: (token) => {
        // Send token to backend API for verification assessment
        console.log('Action token resolved (RxJS):', token);
      },
      error: (err) => {
        console.error('Resolution error (RxJS):', err);
      }
    });
  }
  
  async processPaymentAsync(): Promise<void> {
    try {
      const token = await this.recaptchaV3.executeAsync('checkout');
      console.log('Action token resolved (Async/Await):', token);
    } catch (err) {
      console.error('Resolution error (Async/Await):', err);
    }
  }
}
```

### 3. Reactive Signals Integration (Angular 16+)

```typescript
import { Component, effect, inject } from '@angular/core';
import { RecaptchaSignalService } from 'angular-google-recaptcha-v3/signals';
import { RecaptchaV2Component } from 'angular-google-recaptcha-v3/v2';

@Component({
  selector: 'app-signals-page',
  template: `
    <angular-google-recaptcha-v3 
      [siteKey]="'YOUR_V2_SITE_KEY'"
      (resolved)="recaptchaSignals.setToken($event)"
      (error)="recaptchaSignals.setError('Load Error occurred')">
    </angular-google-recaptcha-v3>

    @if (recaptchaSignals.verified()) {
      <p>Verification successful! Token: {{ recaptchaSignals.token() }}</p>
    }
  `,
  standalone: true,
  imports: [RecaptchaV2Component]
})
export class SignalsPageComponent {
  recaptchaSignals = inject(RecaptchaSignalService);
  
  constructor() {
    // Intercept state reactively
    effect(() => {
      if (this.recaptchaSignals.verified()) {
        console.log('User verified with token:', this.recaptchaSignals.token());
      }
    });
  }
}
```

---

## SSR (Server‑Side Rendering) Support
The library contains native safety guards. When rendering on a server environment, the script loading will gracefully bypass DOM manipulation and execute empty mock resolutions. This ensures standard universal/SSR pipelines do not trigger `window` or `document` reference execution errors.

---

## Unit Testing Setup

The library provides testing mocks under the `/testing` sub‑entrypoint.

```typescript
import { TestBed } from '@angular/core/testing';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';
import { RecaptchaMockV3Service } from 'angular-google-recaptcha-v3/testing';

describe('MyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RecaptchaV3Service, useClass: RecaptchaMockV3Service }
      ]
    });
  });

  // Your unit tests...
});
```

---

## Migration Guide (From `ng-recaptcha`)

If migrating from legacy packages like `ng-recaptcha`:

1. Remove old configurations and modules from your app imports.
2. Update imports from `ng-recaptcha` to `angular-google-recaptcha-v3/v2`, `angular-google-recaptcha-v3/v3`, or `angular-google-recaptcha-v3/core`.
3. Provide settings using the unified configuration injection token: `RECAPTCHA_CONFIG`.
4. Replace event listeners `(resolved)` with signals using `RecaptchaSignalService` if using Angular 16+.

---

## FAQ & Troubleshooting

### Why is my reCAPTCHA script not loading?
- Double‑check that you provided `v2SiteKey` or `v3SiteKey` inside the `RECAPTCHA_CONFIG` InjectionToken.
- Verify that your network has direct access to `google.com` or switch config settings to use `recaptchaDomain: 'recaptcha.net'`.

### Is it compatible with Angular Zoneless mode?
Yes. The library is built with zoneless capability, utilizing custom element zones via `NgZone.runOutsideAngular` to handle script callbacks without triggering change detection cycles redundantly.

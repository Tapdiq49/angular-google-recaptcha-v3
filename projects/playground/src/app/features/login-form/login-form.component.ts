import { Component, signal, ViewChild, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecaptchaV2Component } from 'angular-google-recaptcha-v3/v2';
import { RecaptchaValueAccessorDirective } from 'angular-google-recaptcha-v3/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecaptchaV2Component, RecaptchaValueAccessorDirective],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  // ViewChild reference for programmatic V2 API calling
  @ViewChild('v2Recaptcha') public v2Recaptcha?: RecaptchaV2Component;

  // V2 Component Configuration Inputs simulation
  public v2Theme = signal<'light' | 'dark'>('light');
  public v2Size = signal<'normal' | 'compact' | 'invisible'>('normal');

  // V2 direct event logs
  public v2EventLogs = signal<string[]>([]);

  public loginForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(4)]),
    password: new FormControl('', [Validators.required]),
    recaptcha: new FormControl<string | null>(null, [Validators.required])
  });

  public lastSubmittedValue = signal<any>(null);

  // Documentation Code Snippets
  public readonly v2HtmlCode = `<form [formGroup]="form">
  <angular-google-recaptcha-v3 
    siteKey="YOUR_SITE_KEY"
    formControlName="recaptcha"
    theme="light"
    size="normal"
    (resolved)="onResolved($event)"
    (error)="onError()"
    (expired)="onExpired()">
  </angular-google-recaptcha-v3>
</form>`;

  public readonly v2TsCode = `import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaV2Component } from 'angular-google-recaptcha-v3/v2';
import { RecaptchaValueAccessorDirective } from 'angular-google-recaptcha-v3/forms';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RecaptchaV2Component, 
    RecaptchaValueAccessorDirective
  ]
})
export class MyComponent {
  form = new FormGroup({
    recaptcha: new FormControl(null)
  });

  onResolved(token: string | null) {
    console.log('Resolved token:', token);
  }
}`;

  // Form Submission
  public onFormSubmit(): void {
    if (this.loginForm.valid) {
      this.lastSubmittedValue.set(this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  // Reset forms and recaptcha CVA directive
  public onFormReset(): void {
    this.loginForm.reset();
    this.lastSubmittedValue.set(null);
  }

  // V2 Component Direct API Simulation handlers
  public onV2Resolved(token: string | null): void {
    const logMsg = `[Event: resolved] token=${token ? token.substring(0, 15) + '...' : 'null'}`;
    this.v2EventLogs.update((prev) => [logMsg, ...prev].slice(0, 5));
  }

  public onV2Error(): void {
    const logMsg = `[Event: error] Failed to load or execute captcha`;
    this.v2EventLogs.update((prev) => [logMsg, ...prev].slice(0, 5));
  }

  public onV2Expired(): void {
    const logMsg = `[Event: expired] User verification expired`;
    this.v2EventLogs.update((prev) => [logMsg, ...prev].slice(0, 5));
  }

  public executeV2Programmatically(): void {
    this.v2Recaptcha?.execute();
  }

  public resetV2Programmatically(): void {
    this.v2Recaptcha?.reset();
  }

  public setV2Theme(theme: 'light' | 'dark'): void {
    this.v2Theme.set(theme);
  }

  public setV2Size(size: 'normal' | 'compact' | 'invisible'): void {
    this.v2Size.set(size);
  }
}

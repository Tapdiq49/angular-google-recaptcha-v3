import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';
import { RecaptchaConfigurationError, RecaptchaExecuteError, RecaptchaLoadError } from 'angular-google-recaptcha-v3/core';

@Component({
  selector: 'app-error-tester',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-tester.component.html',
  styleUrl: './error-tester.component.scss'
})
export class ErrorTesterComponent {
  private v3Service = inject(RecaptchaV3Service);

  public lastErrorType = signal<string | null>(null);
  public lastErrorMessage = signal<string | null>(null);
  public lastErrorCode = signal<string | null>(null);

  public triggerError(): void {
    // Deliberately calling a method that might fail, or in this case
    // we can artificially simulate it, or just call execute normally and catch any config issues.
    // Assuming the user hasn't provided a siteKey or something, it will throw a RecaptchaConfigurationError.
    
    // To reliably trigger an error in playground without breaking the actual app config,
    // we just manually test the execute method. If it succeeds, it means they provided a valid key,
    // so we can manually throw a mock to demonstrate if it doesn't fail naturally.
    
    this.v3Service.execute('test_error_action').subscribe({
      next: (token) => {
        // If it somehow succeeds, we simulate what catching looks like
        const dummyError = new RecaptchaExecuteError('Simulated failure because execution actually succeeded.');
        this.handleError(dummyError);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private handleError(err: unknown): void {
    if (err instanceof RecaptchaConfigurationError) {
      this.lastErrorType.set('RecaptchaConfigurationError');
      this.lastErrorCode.set(err.code);
      this.lastErrorMessage.set(err.message);
    } else if (err instanceof RecaptchaExecuteError) {
      this.lastErrorType.set('RecaptchaExecuteError');
      this.lastErrorCode.set(err.code);
      this.lastErrorMessage.set(err.message);
    } else if (err instanceof RecaptchaLoadError) {
      this.lastErrorType.set('RecaptchaLoadError');
      this.lastErrorCode.set(err.code);
      this.lastErrorMessage.set(err.message);
    } else if (err instanceof Error) {
      this.lastErrorType.set('Standard Error');
      this.lastErrorCode.set('N/A');
      this.lastErrorMessage.set(err.message);
    } else {
      this.lastErrorType.set('Unknown');
      this.lastErrorCode.set('N/A');
      this.lastErrorMessage.set(String(err));
    }
  }
}

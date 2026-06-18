import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecaptchaSignalService } from 'angular-google-recaptcha-v3/signals';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signals-demo.component.html',
  styleUrl: './signals-demo.component.scss'
})
export class SignalsDemoComponent {
  public signalService = inject(RecaptchaSignalService);

  public signalEffectLogs = signal<string[]>([]);

  public readonly signalsHtmlCode = `<div>
  Loading: {{ recaptchaSignals.loading() }}
  Verified: {{ recaptchaSignals.verified() ? 'YES' : 'NO' }}
  Token: {{ recaptchaSignals.token() }}
  Error: {{ recaptchaSignals.error() }}
</div>`;

  public readonly signalsTsCode = `import { Component, inject, effect } from '@angular/core';
import { RecaptchaSignalService } from 'angular-google-recaptcha-v3/signals';

@Component({ ... })
export class MyComponent {
  public recaptchaSignals = inject(RecaptchaSignalService);

  constructor() {
    effect(() => {
      console.log('Current token:', this.recaptchaSignals.token());
      console.log('Is loading:', this.recaptchaSignals.loading());
      console.log('Error if any:', this.recaptchaSignals.error());
    });
  }
}`;

  constructor() {
    // Module 3: Angular Signals effect mapping
    effect(() => {
      const token = this.signalService.token();
      const error = this.signalService.error();
      const loading = this.signalService.loading();
      const verified = this.signalService.verified();

      const logMsg = `[Signal Update] loading=${loading}, verified=${verified}, token=${token ? token.substring(0, 15) + '...' : 'null'}, error=${error}`;
      
      this.signalEffectLogs.update((prev) => [logMsg, ...prev].slice(0, 10));
    }, { allowSignalWrites: true });
  }

  public simulateV2Resolution(): void {
    this.signalService.setToken('test-token-123');
  }

  public simulateNetworkError(): void {
    this.signalService.setError('RECAPTCHA_LOAD_FAILED');
  }

  public triggerLoadingState(): void {
    this.signalService.setLoading(true);
    setTimeout(() => {
      this.signalService.setLoading(false);
    }, 1500);
  }

  public resetAllSignals(): void {
    this.signalService.setToken(null);
    this.signalService.setError(null);
    this.signalService.setLoading(false);
  }
}

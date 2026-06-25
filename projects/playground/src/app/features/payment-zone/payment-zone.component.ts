import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';
import { RecaptchaSignalService } from 'angular-google-recaptcha-v3/signals';

interface LogEntry {
  time: string;
  action: string;
  token: string;
  type: 'RxJS' | 'Promise' | 'Signal';
}

@Component({
  selector: 'app-payment-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-zone.component.html',
  styleUrl: './payment-zone.component.scss'
})
export class PaymentZoneComponent {
  private v3Service = inject(RecaptchaV3Service);
  private signalService = inject(RecaptchaSignalService);

  // Logs state
  public logs = signal<LogEntry[]>([]);

  public readonly v3RxjsCode = `import { Component, inject } from '@angular/core';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';

@Component({ ... })
export class MyComponent {
  private v3Service = inject(RecaptchaV3Service);

  executeAction() {
    this.v3Service.execute('login').subscribe({
      next: (token) => {
        console.log('Action token resolved:', token);
      },
      error: (err) => console.error(err)
    });
  }
}`;

  public readonly v3PromiseCode = `import { Component, inject } from '@angular/core';
import { RecaptchaV3Service } from 'angular-google-recaptcha-v3/v3';

@Component({ ... })
export class MyComponent {
  private v3Service = inject(RecaptchaV3Service);

  async executeAction() {
    try {
      const token = await this.v3Service.executeAsync('checkout');
      console.log('Action token resolved:', token);
    } catch (err) {
      console.error(err);
    }
  }
}`;

  public runV3Rxjs(): void {
    this.signalService.setLoading(true);
    this.v3Service.execute('login').subscribe({
      next: (token) => {
        this.signalService.setToken(token);
        this.addLog('execute("login")', token, 'RxJS');
        this.signalService.setLoading(false);
      },
      error: (err) => {
        this.signalService.setError(err.message);
        this.signalService.setLoading(false);
      }
    });
  }

  public async runV3Promise(): Promise<void> {
    this.signalService.setLoading(true);
    try {
      const token = await this.v3Service.executeAsync('checkout');
      this.signalService.setToken(token);
      this.addLog('executeAsync("checkout")', token, 'Promise');
    } catch (err: unknown) {
      console.error('Promise execution failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      this.signalService.setError(errMsg);
    } finally {
      this.signalService.setLoading(false);
    }
  }

  private addLog(action: string, token: string, type: 'RxJS' | 'Promise' | 'Signal'): void {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const entry: LogEntry = { time, action, token, type };
    this.logs.update((prev) => [entry, ...prev]);
  }
}

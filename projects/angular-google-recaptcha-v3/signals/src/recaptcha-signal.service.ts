import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecaptchaLoaderService } from 'angular-google-recaptcha-v3/core';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaSignalService {
  private loader = inject(RecaptchaLoaderService);
  private destroyRef = inject(DestroyRef);

  private _token = signal<string | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Simplified Signals API (No redundant computed wraps)
  public readonly token = this._token.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly verified = computed(() => !!this._token());

  constructor() {
    this.loader.scriptLoadStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        if (status === 'loading') {
          this._loading.set(true);
        } else if (status === 'loaded') {
          this._loading.set(false);
        } else if (status === 'error') {
          this._loading.set(false);
          this._error.set('Failed to load Google reCAPTCHA script.');
        }
      });
  }

  public setToken(token: string | null): void {
    this._token.set(token);
    this._error.set(null);
  }

  public setError(errorMsg: string | null): void {
    this._token.set(null);
    this._error.set(errorMsg);
  }

  public setLoading(isLoading: boolean): void {
    this._loading.set(isLoading);
  }
}

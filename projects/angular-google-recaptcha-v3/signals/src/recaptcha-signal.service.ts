import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaSignalService {
  private _token = signal<string | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Simplified Signals API (No redundant computed wraps)
  public readonly token = this._token.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly verified = computed(() => !!this._token());

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

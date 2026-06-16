import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaMockV3Service {
  private mockToken = 'mock-v3-recaptcha-token';

  /**
   * Configures the mock token to be returned upon execution.
   */
  public setMockToken(token: string): void {
    this.mockToken = token;
  }

  /**
   * Mock execute returning a pre-configured token immediately.
   */
  public execute(action: string): Observable<string> {
    return of(this.mockToken);
  }
}

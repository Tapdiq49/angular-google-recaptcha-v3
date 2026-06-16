import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaMockLoaderService {
  /**
   * Immediately resolves to true, bypassing network and DOM script injections.
   */
  public loadScript(): Observable<boolean> {
    return of(true);
  }
}

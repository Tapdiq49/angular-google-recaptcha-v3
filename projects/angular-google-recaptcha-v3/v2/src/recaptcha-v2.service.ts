import { Injectable } from '@angular/core';
import { RecaptchaV2Component } from './recaptcha-v2.component';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaV2Service {
  private instances = new Map<string, RecaptchaV2Component>();

  /**
   * Registers a V2 widget instance under a specific key.
   */
  public register(key: string, component: RecaptchaV2Component): void {
    this.instances.set(key, component);
  }

  /**
   * Unregisters a V2 widget instance.
   */
  public unregister(key: string): void {
    this.instances.delete(key);
  }

  /**
   * Executes a registered invisible V2 component by key.
   */
  public execute(key: string): void {
    const comp = this.instances.get(key);
    if (comp) {
      comp.execute();
    }
  }

  /**
   * Resets a registered V2 component by key.
   */
  public reset(key: string): void {
    const comp = this.instances.get(key);
    if (comp) {
      comp.reset();
    }
  }
}

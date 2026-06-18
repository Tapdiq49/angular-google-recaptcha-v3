import { Injectable } from '@angular/core';
import { IRecaptchaV2 } from './recaptcha-v2.interface';

@Injectable({
  providedIn: 'root'
})
export class RecaptchaV2Service {
  // Fix #5: Use IRecaptchaV2 interface instead of the concrete RecaptchaV2Component
  // class so the component can inject this service without creating a circular dependency.
  private instances = new Map<string, IRecaptchaV2>();

  /**
   * Registers a V2 widget instance under a specific key.
   * When using RecaptchaV2Component with a [registrationKey] input, registration
   * happens automatically. Manual registration is only needed for custom widgets.
   */
  public register(key: string, component: IRecaptchaV2): void {
    this.instances.set(key, component);
  }

  /**
   * Unregisters a V2 widget instance.
   * RecaptchaV2Component unregisters automatically on destroy when [registrationKey] is set.
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

/**
 * Minimal interface that RecaptchaV2Component implements.
 * RecaptchaV2Service holds instances of this interface instead of the concrete
 * component class so that the component can safely inject the service without
 * creating a circular dependency.
 */
export interface IRecaptchaV2 {
  /** Manually executes an invisible reCAPTCHA v2 widget. */
  execute(): void;
  /** Resets the reCAPTCHA widget instance. */
  reset(): void;
}

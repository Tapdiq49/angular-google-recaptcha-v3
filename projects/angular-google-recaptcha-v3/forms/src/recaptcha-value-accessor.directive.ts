import { Directive, forwardRef, inject, DestroyRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecaptchaV2Component } from 'angular-google-recaptcha-v3/v2';

@Directive({
  selector: `angular-google-recaptcha-v3[formControlName],angular-google-recaptcha-v3[formControl],angular-google-recaptcha-v3[ngModel],
             recaptcha-v2[formControlName],recaptcha-v2[formControl],recaptcha-v2[ngModel]`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RecaptchaValueAccessorDirective),
      multi: true
    }
  ],
  standalone: true
})
export class RecaptchaValueAccessorDirective implements ControlValueAccessor {
  private host = inject(RecaptchaV2Component, { host: true, optional: true });
  private destroyRef = inject(DestroyRef);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.host) {
      // Connect callbacks to Form, protected against memory leaks via takeUntilDestroyed
      this.host.resolved
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((token) => {
          this.onChange(token);
          this.onTouched();
        });

      this.host.expired
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.onChange(null);
          this.onTouched();
        });

      this.host.error
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.onChange(null);
          this.onTouched();
        });
    }
  }

  /**
   * Writes value from the form model.
   * If value is empty, resets the recaptcha widget.
   */
  public writeValue(value: string | null): void {
    if (!value && this.host) {
      this.host.reset();
    }
  }

  /**
   * Registers a callback function to be triggered when the value changes.
   */
  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback function to be triggered when the control is touched.
   */
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Sets disabled state. reCAPTCHA does not have a native disabled state,
   * but we can hook this if required.
   */
  public setDisabledState?(isDisabled: boolean): void {
    // reCAPTCHA does not support disabling natively.
  }
}

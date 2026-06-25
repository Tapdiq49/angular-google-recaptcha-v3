import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  NgZone,
  ChangeDetectorRef,
  ViewChild,
  inject,
  DestroyRef,
  effect,
  input,
  signal,
  OnInit,
  AfterViewInit,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecaptchaLoaderService, WindowWithGrecaptcha } from 'angular-google-recaptcha-v3/core';
import { IRecaptchaV2 } from './recaptcha-v2.interface';
import { RecaptchaV2Service } from './recaptcha-v2.service';

@Component({
  // Fix #11 (selector): keep the original selector for backward compatibility and
  // add the semantically correct `recaptcha-v2` alias.
  selector: 'angular-google-recaptcha-v3, recaptcha-v2',
  template: `<div #wrapper><div #container></div></div>`,
  styles: [`:host { display: inline-block; min-height: 78px; }`],
  standalone: true
})
export class RecaptchaV2Component implements OnInit, AfterViewInit, IRecaptchaV2 {
  @ViewChild('wrapper', { static: false }) wrapper?: ElementRef<HTMLDivElement>;
  @ViewChild('container', { static: false }) container?: ElementRef<HTMLDivElement>;

  siteKey = input.required<string>();
  theme = input<'light' | 'dark'>('light');
  size = input<'normal' | 'compact' | 'invisible'>('normal');
  tabIndex = input(0);

  /**
   * Optional registration key for RecaptchaV2Service.
   * When provided, the component automatically registers itself on init and
   * unregisters on destroy, so you can call `RecaptchaV2Service.execute(key)`
   * or `RecaptchaV2Service.reset(key)` without manual bookkeeping.
   */
  registrationKey = input<string | undefined>(undefined);

  @Output() resolved = new EventEmitter<string | null>();
  @Output() error = new EventEmitter<void>();
  @Output() expired = new EventEmitter<void>();

  private loader = inject(RecaptchaLoaderService);
  private v2Service = inject(RecaptchaV2Service);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  private widgetId: number | null = null;
  private isBrowser = isPlatformBrowser(this.platformId);

  // Fix #6: scriptLoaded is now a signal so the effect() can track it reactively.
  private scriptLoaded = signal<boolean>(false);
  private viewReady = signal<boolean>(false);

  constructor() {
    effect(() => {
      // Read all signal inputs AND states to register them as reactive dependencies.
      const sk = this.siteKey();
      const th = this.theme();
      const sz = this.size();
      const ti = this.tabIndex();
      const loaded = this.scriptLoaded();
      const ready = this.viewReady();

      if (this.isBrowser && loaded && ready && this.wrapper?.nativeElement) {
        this.reRenderWidget();
      }
    });
  }

  ngOnInit(): void {
    // Fix #7: Auto-register with RecaptchaV2Service when a key is provided.
    const key = this.registrationKey();
    if (key) {
      this.v2Service.register(key, this);
      this.destroyRef.onDestroy(() => this.v2Service.unregister(key));
    }

    // Fix: Clean up the widget on component destroy to avoid memory/callback leaks.
    this.destroyRef.onDestroy(() => this.cleanupWidget());

    if (this.isBrowser) {
      this.loader.loadScript()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (loaded) => {
            if (loaded) {
              this.scriptLoaded.set(true);
            }
          },
          error: () => {
            this.error.emit();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  private reRenderWidget(): void {
    if (!this.wrapper?.nativeElement) return;
    this.cleanupWidget();
    this.renderWidget();
  }

  private cleanupWidget(): void {
    if (this.widgetId !== null) {
      const windowRef = window as WindowWithGrecaptcha;
      const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;
      if (grecaptchaObj) {
        try {
          grecaptchaObj.reset(this.widgetId);
        } catch (e) {
          // ignore errors on reset
        }
      }
      this.widgetId = null;
    }
  }

  private renderWidget(): void {
    if (!this.isBrowser || !this.scriptLoaded() || !this.wrapper?.nativeElement) return;

    // Replace the inner container with a fresh div to avoid stale widget state
    this.wrapper.nativeElement.innerHTML = '<div></div>';
    const newContainer = this.wrapper.nativeElement.firstElementChild as HTMLDivElement;

    this.ngZone.runOutsideAngular(() => {
      const windowRef = window as WindowWithGrecaptcha;
      const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;

      if (!grecaptchaObj) {
        console.warn('Google reCAPTCHA script is not loaded or missing.');
        return;
      }

      this.widgetId = grecaptchaObj.render(newContainer, {
        sitekey: this.siteKey(),
        theme: this.theme(),
        size: this.size(),
        tabindex: this.tabIndex(),
        callback: (token: string) => {
          this.ngZone.run(() => {
            this.resolved.emit(token);
            this.cdr.markForCheck();
          });
        },
        'expired-callback': () => {
          this.ngZone.run(() => {
            this.expired.emit();
            this.cdr.markForCheck();
          });
        },
        'error-callback': () => {
          this.ngZone.run(() => {
            this.error.emit();
            this.cdr.markForCheck();
          });
        }
      });
    });
  }

  /**
   * Manually executes an invisible reCAPTCHA v2 widget.
   */
  public execute(): void {
    if (!this.isBrowser || this.widgetId === null) return;

    const windowRef = window as WindowWithGrecaptcha;
    const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;

    if (grecaptchaObj) {
      this.ngZone.runOutsideAngular(() => {
        grecaptchaObj.execute(this.widgetId);
      });
    }
  }

  /**
   * Resets the reCAPTCHA widget instance state.
   */
  public reset(): void {
    if (!this.isBrowser || this.widgetId === null) return;

    const windowRef = window as WindowWithGrecaptcha;
    const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;

    if (grecaptchaObj) {
      this.ngZone.runOutsideAngular(() => {
        grecaptchaObj.reset(this.widgetId);
      });
      this.resolved.emit(null);
    }
  }
}

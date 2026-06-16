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
  OnInit,
  AfterViewInit,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecaptchaLoaderService } from 'angular-google-recaptcha-v3/core';

@Component({
  selector: 'angular-google-recaptcha-v3',
  template: `<div #wrapper><div #container></div></div>`,
  styles: [`:host { display: inline-block; min-height: 78px; }`],
  standalone: true
})
export class RecaptchaV2Component implements OnInit, AfterViewInit {
  @ViewChild('wrapper', { static: false }) wrapper?: ElementRef<HTMLDivElement>;
  @ViewChild('container', { static: false }) container?: ElementRef<HTMLDivElement>;

  siteKey = input.required<string>();
  theme = input<'light' | 'dark'>('light');
  size = input<'normal' | 'compact' | 'invisible'>('normal');
  tabIndex = input(0);

  @Output() resolved = new EventEmitter<string | null>();
  @Output() error = new EventEmitter<void>();
  @Output() expired = new EventEmitter<void>();

  private loader = inject(RecaptchaLoaderService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  private widgetId: number | null = null;
  private isBrowser = isPlatformBrowser(this.platformId);
  private scriptLoaded = false;
  private viewReady = false;

  constructor() {
    effect(() => {
      // Read all signal inputs to register them as dependencies
      const sk = this.siteKey();
      const th = this.theme();
      const sz = this.size();
      const ti = this.tabIndex();

      if (this.isBrowser && this.scriptLoaded && this.viewReady && this.wrapper?.nativeElement) {
        this.reRenderWidget();
      }
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loader.loadScript()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((loaded) => {
          if (loaded) {
            this.scriptLoaded = true;
            if (this.viewReady && this.wrapper?.nativeElement) {
              this.renderWidget();
            }
          }
        });
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.isBrowser && this.scriptLoaded && this.wrapper?.nativeElement) {
      this.renderWidget();
    }
  }

  private reRenderWidget(): void {
    if (!this.wrapper?.nativeElement) return;
    this.cleanupWidget();
    this.renderWidget();
  }

  private cleanupWidget(): void {
    if (this.widgetId !== null) {
      const windowRef = window as any;
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
    if (!this.isBrowser || !this.scriptLoaded || !this.wrapper?.nativeElement) return;

    // Replace the inner container with a brand new div
    this.wrapper.nativeElement.innerHTML = '<div></div>';
    const newContainer = this.wrapper.nativeElement.firstElementChild as HTMLDivElement;

    this.ngZone.runOutsideAngular(() => {
      const windowRef = window as any;
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

    const windowRef = window as any;
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

    const windowRef = window as any;
    const grecaptchaObj = windowRef.grecaptcha?.enterprise || windowRef.grecaptcha;

    if (grecaptchaObj) {
      this.ngZone.runOutsideAngular(() => {
        grecaptchaObj.reset(this.widgetId);
      });
      this.resolved.emit(null);
    }
  }
}

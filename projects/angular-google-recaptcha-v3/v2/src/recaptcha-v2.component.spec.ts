import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, PLATFORM_ID, Input, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RecaptchaV2Component } from './recaptcha-v2.component';
import { RecaptchaLoaderService, WindowWithGrecaptcha } from 'angular-google-recaptcha-v3/core';
import { RecaptchaV2Service } from './recaptcha-v2.service';
import { of, throwError } from 'rxjs';

interface HasPropDecorators {
  propDecorators: Record<string, Array<{ type: typeof Input }>>;
}

// JIT compiler signal inputs workaround for Jest ts-jest environment
function setupJitSignalInputs() {
  (RecaptchaV2Component as unknown as HasPropDecorators).propDecorators = {
    siteKey: [{ type: Input }],
    theme: [{ type: Input }],
    size: [{ type: Input }],
    tabIndex: [{ type: Input }],
    badge: [{ type: Input }],
    registrationKey: [{ type: Input }]
  };

  const inputs = ['siteKey', 'theme', 'size', 'tabIndex', 'badge', 'registrationKey'];
  inputs.forEach(inputName => {
    const internalSignal = signal<unknown>(undefined);
    Object.defineProperty(RecaptchaV2Component.prototype, inputName, {
      get() {
        const val = internalSignal();
        if (typeof val === 'function') {
          return val;
        }
        return () => val;
      },
      set(v) {
        internalSignal.set(v);
      },
      configurable: true
    });
  });
}

// Run the patch before any compilation
setupJitSignalInputs();

@Component({
  template: `
    <angular-google-recaptcha-v3
      [siteKey]="siteKey"
      [theme]="theme"
      [size]="size"
      [tabIndex]="tabIndex"
      [badge]="badge"
      [registrationKey]="registrationKey"
      (resolved)="onResolved($event)"
      (expired)="onExpired()"
      (error)="onError()">
    </angular-google-recaptcha-v3>
  `,
  standalone: true,
  imports: [RecaptchaV2Component]
})
class TestHostComponent {
  siteKey = 'test-v2-sitekey';
  theme: 'light' | 'dark' = 'light';
  size: 'normal' | 'compact' | 'invisible' = 'normal';
  tabIndex = 0;
  badge: 'bottomright' | 'bottomleft' | 'inline' = 'bottomright';
  registrationKey: string | undefined = undefined;

  resolvedToken: string | null = null;
  expiredEmitted = false;
  errorEmitted = false;

  onResolved(token: string | null): void {
    this.resolvedToken = token;
  }
  onExpired(): void {
    this.expiredEmitted = true;
  }
  onError(): void {
    this.errorEmitted = true;
  }
}

describe('RecaptchaV2Component via TestHostComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let component: RecaptchaV2Component;
  let mockLoader: {
    loadScript: jest.Mock;
  };
  let mockV2Service: {
    register: jest.Mock;
    unregister: jest.Mock;
  };

  let mockGrecaptchaRender: jest.Mock;
  let mockGrecaptchaReset: jest.Mock;
  let mockGrecaptchaExecute: jest.Mock;

  function setupMockGrecaptcha(): void {
    mockGrecaptchaRender = jest.fn().mockReturnValue(42);
    mockGrecaptchaReset = jest.fn();
    mockGrecaptchaExecute = jest.fn();
    (window as unknown as WindowWithGrecaptcha).grecaptcha = {
      render: mockGrecaptchaRender,
      reset: mockGrecaptchaReset,
      execute: mockGrecaptchaExecute,
      ready: (cb: () => void) => cb(),
    } as unknown as WindowWithGrecaptcha['grecaptcha'];
  }

  function clearMockGrecaptcha(): void {
    delete (window as unknown as WindowWithGrecaptcha).grecaptcha;
  }

  beforeEach(async () => {
    setupMockGrecaptcha();

    mockLoader = {
      loadScript: jest.fn().mockReturnValue(of(true)),
    };

    mockV2Service = {
      register: jest.fn(),
      unregister: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, RecaptchaV2Component],
      providers: [
        { provide: RecaptchaLoaderService, useValue: mockLoader },
        { provide: RecaptchaV2Service, useValue: mockV2Service },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  afterEach(() => {
    clearMockGrecaptcha();
  });

  function initComponent(): void {
    hostFixture.detectChanges();
    const debugEl = hostFixture.debugElement.query(By.directive(RecaptchaV2Component));
    component = debugEl.componentInstance;
  }

  it('should create and load script on init', () => {
    initComponent();
    expect(component).toBeTruthy();
    expect(mockLoader.loadScript).toHaveBeenCalled();
  });

  it('should emit error when script loader fails', () => {
    mockLoader.loadScript.mockReturnValue(throwError(() => new Error('Load failed')));
    initComponent();
    expect(hostComponent.errorEmitted).toBe(true);
  });

  it('should render widget with default input values', () => {
    initComponent();

    expect(mockGrecaptchaRender).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sitekey: 'test-v2-sitekey',
        theme: 'light',
        size: 'normal',
        tabindex: 0,
        badge: 'bottomright',
      })
    );
  });

  it('should render widget with custom input values including badge', () => {
    hostComponent.theme = 'dark';
    hostComponent.size = 'invisible';
    hostComponent.tabIndex = 2;
    hostComponent.badge = 'inline';

    initComponent();

    expect(mockGrecaptchaRender).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sitekey: 'test-v2-sitekey',
        theme: 'dark',
        size: 'invisible',
        tabindex: 2,
        badge: 'inline',
      })
    );
  });

  it('should re-render when badge or other inputs change dynamically', async () => {
    initComponent();
    expect(mockGrecaptchaRender).toHaveBeenCalledTimes(1);

    hostComponent.badge = 'bottomleft';
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    // Re-rendering cleans up the previous widget and renders again
    expect(mockGrecaptchaReset).toHaveBeenCalledWith(42);
    expect(mockGrecaptchaRender).toHaveBeenCalledTimes(2);
    expect(mockGrecaptchaRender).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        badge: 'bottomleft',
      })
    );
  });

  it('should execute manually when execute() is called', () => {
    initComponent();
    component.execute();
    expect(mockGrecaptchaExecute).toHaveBeenCalledWith(42);
  });

  it('should reset manually and emit null resolved event when reset() is called', () => {
    initComponent();
    component.reset();

    expect(mockGrecaptchaReset).toHaveBeenCalledWith(42);
    expect(hostComponent.resolvedToken).toBeNull();
  });

  it('should trigger resolved output when grecaptcha invokes callback', () => {
    initComponent();

    // Retrieve callback from the parameters passed to render
    const params = mockGrecaptchaRender.mock.calls[0][1];
    params.callback('test-resolved-token');

    expect(hostComponent.resolvedToken).toBe('test-resolved-token');
  });

  it('should trigger expired output when grecaptcha invokes expired-callback', () => {
    initComponent();

    const params = mockGrecaptchaRender.mock.calls[0][1];
    params['expired-callback']();

    expect(hostComponent.expiredEmitted).toBe(true);
  });

  it('should trigger error output when grecaptcha invokes error-callback', () => {
    initComponent();

    const params = mockGrecaptchaRender.mock.calls[0][1];
    params['error-callback']();

    expect(hostComponent.errorEmitted).toBe(true);
  });

  it('should register and unregister with RecaptchaV2Service when registrationKey is provided', () => {
    hostComponent.registrationKey = 'my-v2-widget';
    initComponent();

    expect(mockV2Service.register).toHaveBeenCalledWith('my-v2-widget', component);

    hostFixture.destroy();
    expect(mockV2Service.unregister).toHaveBeenCalledWith('my-v2-widget');
  });
});

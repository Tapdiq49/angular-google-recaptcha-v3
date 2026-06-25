export interface GrecaptchaV3 {
  ready(cb: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string | null | undefined>;
}

export interface GrecaptchaV2 {
  render(
    container: HTMLElement,
    parameters: {
      sitekey: string;
      theme?: 'light' | 'dark';
      size?: 'normal' | 'compact' | 'invisible';
      tabindex?: number;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }
  ): number;
  reset(widgetId?: number | null): void;
  execute(widgetId?: number | null): void;
}

export type Grecaptcha = (GrecaptchaV2 | GrecaptchaV3) & {
  enterprise?: GrecaptchaV2 | GrecaptchaV3;
};

export type WindowWithGrecaptcha = Window &
  typeof globalThis & {
    grecaptcha?: (GrecaptchaV2 & GrecaptchaV3) & {
      enterprise?: GrecaptchaV2 & GrecaptchaV3;
    };
    ngRecaptchaLoaded?: (() => void) | undefined;
  };

/** Base error class for Google reCAPTCHA v3 errors */
export class RecaptchaError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'RecaptchaError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the Google reCAPTCHA script fails to load after all retries */
export class RecaptchaLoadError extends RecaptchaError {
  constructor(message: string = 'Failed to load Google reCAPTCHA script after multiple retries.') {
    super(message, 'LOAD_ERROR');
    this.name = 'RecaptchaLoadError';
  }
}

/** Thrown when there is an issue with the RECAPTCHA_CONFIG configuration */
export class RecaptchaConfigurationError extends RecaptchaError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'RecaptchaConfigurationError';
  }
}

/** Thrown when Google reCAPTCHA execution fails (e.g. execution rejected by google or null token) */
export class RecaptchaExecuteError extends RecaptchaError {
  constructor(message: string) {
    super(message, 'EXECUTE_ERROR');
    this.name = 'RecaptchaExecuteError';
  }
}

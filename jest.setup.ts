// zone.js — required by Angular's NgZone and TestBed at runtime.
// NOTE: zone.js/testing is Jasmine-specific and must NOT be imported for Jest.
import 'zone.js';

// @angular/compiler — enables JIT fallback for partially-compiled Angular packages.
import '@angular/compiler';

// Bootstrap Angular's TestBed environment.
// This MUST run in setupFilesAfterEnv (after Jest is installed) so that
// TestBed.inject() and createEnvironmentInjector() are usable in spec files.
//
// NOTE: BrowserDynamicTestingModule / platformBrowserDynamicTesting() were
// deprecated in Angular 19 along with the entire platform-browser-dynamic/testing
// entry-point. The modern replacement is BrowserTestingModule +
// platformBrowserTesting() from @angular/platform-browser/testing.
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);

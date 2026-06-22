import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from './features/login-form/login-form.component';
import { PaymentZoneComponent } from './features/payment-zone/payment-zone.component';
import { SignalsDemoComponent } from './features/signals-demo/signals-demo.component';
import { ConfigToggleComponent } from './features/config-toggle/config-toggle.component';
import { ErrorTesterComponent } from './features/error-tester/error-tester.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginFormComponent,
    PaymentZoneComponent,
    SignalsDemoComponent,
    ConfigToggleComponent,
    ErrorTesterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public activeTab = signal<'v2-forms' | 'v3-execute' | 'signals' | 'config-toggle' | 'errors'>('v2-forms');

  public setTab(tab: 'v2-forms' | 'v3-execute' | 'signals' | 'config-toggle' | 'errors'): void {
    this.activeTab.set(tab);
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from './features/login-form/login-form.component';
import { PaymentZoneComponent } from './features/payment-zone/payment-zone.component';
import { SignalsDemoComponent } from './features/signals-demo/signals-demo.component';
import { ConfigToggleComponent } from './features/config-toggle/config-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginFormComponent,
    PaymentZoneComponent,
    SignalsDemoComponent,
    ConfigToggleComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  public activeTab = signal<'v2-forms' | 'v3-execute' | 'signals' | 'config-toggle'>('v2-forms');

  public setTab(tab: 'v2-forms' | 'v3-execute' | 'signals' | 'config-toggle'): void {
    this.activeTab.set(tab);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UserResponse } from '../../core/models/auth.models';
import { NotificationUiService } from '../../core/services/notification-ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

export interface UserProfileModel {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  themePreference: 'light' | 'dark' | 'system';
  emailAlerts: boolean;
  smsAlerts: boolean;
  notes: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent
  ],
  template: `
    <div class="profile-page">
      <app-page-header
        title="User Profile & Station Preferences"
        subtitle="Manage personal contact information, alert settings, and display preferences using Angular Template-Driven Forms"
      ></app-page-header>

      <div class="profile-layout">
        <!-- Account Overview Card -->
        <div class="card user-summary-card" *ngIf="currentUser">
          <div class="avatar-large">{{ currentUser.username.charAt(0).toUpperCase() }}</div>
          <h3>{{ currentUser.username }}</h3>
          <span class="role-badge">{{ currentUser.role }}</span>
          <p class="email-sub">{{ currentUser.email }}</p>

          <div class="summary-details">
            <div class="detail-row">
              <span class="label">User ID:</span>
              <span class="val">#{{ currentUser.id }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Account Status:</span>
              <span class="val text-success">Active</span>
            </div>
            <div class="detail-row">
              <span class="label">Security State:</span>
              <span class="val text-success">Verified & Unlocked</span>
            </div>
          </div>
        </div>

        <!-- Template-Driven Form Card -->
        <div class="card form-card">
          <div class="form-header">
            <h3>Profile Preferences</h3>
            <span class="form-type-tag">Template-Driven Form (ngForm / ngModel)</span>
          </div>

          <!-- Angular Template-Driven Form with [(ngModel)] and #profileForm="ngForm" -->
          <form #profileForm="ngForm" (ngSubmit)="saveProfile(profileForm)">
            <div class="form-row">
              <div class="form-group col">
                <label for="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  [(ngModel)]="profile.fullName"
                  #fullNameInput="ngModel"
                  required
                  minlength="3"
                  class="form-control"
                  [class.is-invalid]="fullNameInput.invalid && (fullNameInput.dirty || fullNameInput.touched)"
                />
                <div *ngIf="fullNameInput.invalid && (fullNameInput.dirty || fullNameInput.touched)" class="error-msg">
                  <span *ngIf="fullNameInput.errors?.['required']">Full name is required.</span>
                  <span *ngIf="fullNameInput.errors?.['minlength']">Minimum 3 characters required.</span>
                </div>
              </div>

              <div class="form-group col">
                <label for="phoneNumber">Direct Contact Phone *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  [(ngModel)]="profile.phoneNumber"
                  #phoneInput="ngModel"
                  required
                  pattern="^\\+?[0-9\\-\\s()]{7,20}$"
                  class="form-control"
                  [class.is-invalid]="phoneInput.invalid && (phoneInput.dirty || phoneInput.touched)"
                />
                <div *ngIf="phoneInput.invalid && (phoneInput.dirty || phoneInput.touched)" class="error-msg">
                  <span *ngIf="phoneInput.errors?.['required']">Phone number is required.</span>
                  <span *ngIf="phoneInput.errors?.['pattern']">Please enter a valid telephone format.</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label for="email">Notification Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="profile.email"
                  #emailInput="ngModel"
                  required
                  email
                  class="form-control"
                  [class.is-invalid]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
                />
                <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="error-msg">
                  <span *ngIf="emailInput.errors?.['required']">Email is required.</span>
                  <span *ngIf="emailInput.errors?.['email']">Valid email address required.</span>
                </div>
              </div>

              <div class="form-group col">
                <label for="themePreference">Theme Preference</label>
                <select
                  id="themePreference"
                  name="themePreference"
                  [(ngModel)]="profile.themePreference"
                  class="form-control"
                >
                  <option value="light">Light Aesthetic</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">Follow System</option>
                </select>
              </div>
            </div>

            <div class="preferences-box">
              <h4>Notification Subscriptions</h4>
              <div class="checkbox-row">
                <label class="custom-checkbox">
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    [(ngModel)]="profile.emailAlerts"
                  />
                  <span>Receive Email Dispatch Alerts for Low-Stock and Room Status Updates</span>
                </label>
              </div>

              <div class="checkbox-row">
                <label class="custom-checkbox">
                  <input
                    type="checkbox"
                    name="smsAlerts"
                    [(ngModel)]="profile.smsAlerts"
                  />
                  <span>Receive Urgent SMS Alerts for VIP Check-ins and Maintenance Emergencies</span>
                </label>
              </div>
            </div>

            <div class="form-group mt-3">
              <label for="notes">Station Notes / Internal Memo</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="profile.notes"
                rows="3"
                class="form-control"
                placeholder="Personal notes, shift handover reminders..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="resetForm(profileForm)"
              >
                Reset to Defaults
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="profileForm.invalid || saving"
              >
                {{ saving ? 'Saving Preferences...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }
    }
    .user-summary-card {
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }
    .avatar-large {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    .role-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: var(--bg-hover);
    }
    .email-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .summary-details {
      width: 100%;
      border-top: 1px solid var(--border-color);
      margin-top: 1rem;
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
    }
    .detail-row .label {
      color: var(--text-muted);
    }
    .form-card {
      padding: 1.75rem;
    }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .form-type-tag {
      font-size: 0.75rem;
      color: var(--primary);
      background: var(--bg-hover);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .preferences-box {
      margin-top: 1.25rem;
      background: var(--bg-hover);
      padding: 1rem 1.25rem;
      border-radius: var(--radius);
    }
    .preferences-box h4 {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }
    .checkbox-row {
      margin-bottom: 0.5rem;
    }
    .custom-checkbox {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private notify = inject(NotificationUiService);

  currentUser: UserResponse | null = null;
  saving = false;

  // Template-driven form data model bound via [(ngModel)]
  profile: UserProfileModel = {
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    themePreference: 'light',
    emailAlerts: true,
    smsAlerts: false,
    notes: ''
  };

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profile.username = this.currentUser.username;
      this.profile.email = this.currentUser.email;
      this.profile.fullName = this.currentUser.username.toUpperCase() + ' (HMS User)';
      this.profile.phoneNumber = '+1-555-0199';
    }
  }

  saveProfile(form: NgForm): void {
    if (form.invalid) {
      this.notify.error('Please resolve validation errors in the form.');
      return;
    }

    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.notify.success('Profile preferences saved successfully (Template-Driven Form)');
    }, 600);
  }

  resetForm(form: NgForm): void {
    form.reset({
      fullName: this.currentUser ? this.currentUser.username + ' User' : '',
      email: this.currentUser?.email || '',
      phoneNumber: '+1-555-0199',
      themePreference: 'light',
      emailAlerts: true,
      smsAlerts: false,
      notes: ''
    });
    this.notify.info('Preferences reset to default values');
  }
}

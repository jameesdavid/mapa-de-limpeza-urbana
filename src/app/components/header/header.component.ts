import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly authService = inject(AuthService);

  async onLogin(): Promise<void> {
    await this.authService.signInWithGoogle();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}

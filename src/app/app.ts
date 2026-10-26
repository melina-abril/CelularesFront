import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from './core/layout/app-header';
import { SideNav } from './core/layout/side-nav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeader, SideNav],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}

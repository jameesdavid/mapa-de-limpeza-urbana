import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { MapComponent } from './components/map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, MapComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}

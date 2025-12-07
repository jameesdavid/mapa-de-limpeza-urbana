import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { CleanlinessService } from '../../services/cleanliness.service';
import { AuthService } from '../../services/auth.service';
import { CleanlinessReport, AreaStatistics } from '../../models/cleanliness-report.model';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RatingModalComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  private readonly cleanlinessService = inject(CleanlinessService);
  readonly authService = inject(AuthService);
  private map!: L.Map;
  private areaLayers: L.Circle[] = [];
  private subscription?: Subscription;

  showModal = signal(false);
  showLoginRequired = signal(false);
  selectedLocation = signal<{ lat: number; lng: number } | null>(null);
  areaStatistics = signal<AreaStatistics[]>([]);
  isLoading = signal(true);

  private readonly DEFAULT_RADIUS = 500;

  ngOnInit(): void {
    this.initMap();
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [-23.5505, -46.6333],
      zoom: 15
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.authService.isLoggedIn()) {
        this.showLoginRequired.set(true);
        setTimeout(() => this.showLoginRequired.set(false), 3000);
        return;
      }
      this.selectedLocation.set({ lat: e.latlng.lat, lng: e.latlng.lng });
      this.showModal.set(true);
    });

    this.tryGeolocation();
  }

  private tryGeolocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 16);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }

  private loadReports(): void {
    this.subscription = this.cleanlinessService.getReports().subscribe({
      next: (reports) => {
        const statistics = this.cleanlinessService.calculateAreaStatistics(reports);
        this.areaStatistics.set(statistics);
        this.updateMapOverlays(statistics);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateMapOverlays(statistics: AreaStatistics[]): void {
    for (const layer of this.areaLayers) {
      this.map.removeLayer(layer);
    }
    this.areaLayers = [];

    for (const stat of statistics) {
      const color = this.cleanlinessService.getRatingColor(stat.averageRating);
      const label = this.cleanlinessService.getRatingLabel(stat.averageRating);

      const circle = L.circle([stat.latitude, stat.longitude], {
        radius: stat.radius,
        fillColor: color,
        fillOpacity: 0.35,
        color: color,
        weight: 2
      }).addTo(this.map);

      circle.bindPopup(`
        <div class="popup-content">
          <strong>Média de Limpeza</strong><br>
          <span class="rating">${stat.averageRating.toFixed(1)}/10</span><br>
          <span class="label">${label}</span><br>
          <small>${stat.totalReports} avaliação(ões)</small>
        </div>
      `);

      this.areaLayers.push(circle);
    }
  }

  async onRatingSubmitted(rating: number): Promise<void> {
    const location = this.selectedLocation();
    const userId = this.authService.userId();
    if (!location || !userId) return;

    const report: Omit<CleanlinessReport, 'id'> = {
      latitude: location.lat,
      longitude: location.lng,
      rating,
      radius: this.DEFAULT_RADIUS,
      timestamp: new Date(),
      userId
    };

    try {
      await this.cleanlinessService.addReport(report);
      this.showModal.set(false);
      this.selectedLocation.set(null);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  }

  onModalClose(): void {
    this.showModal.set(false);
    this.selectedLocation.set(null);
  }
}

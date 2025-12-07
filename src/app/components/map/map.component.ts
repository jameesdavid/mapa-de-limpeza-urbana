import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { CleanlinessService } from '../../services/cleanliness.service';
import { AuthService } from '../../services/auth.service';
import { CleanlinessReport, AreaStatistics } from '../../models/cleanliness-report.model';
import { RatingModalComponent, RatingSubmission } from '../rating-modal/rating-modal.component';
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
  private previewCircle: L.Circle | null = null;
  private subscription?: Subscription;

  showModal = signal(false);
  showLoginRequired = signal(false);
  selectedLocation = signal<{ lat: number; lng: number } | null>(null);
  areaStatistics = signal<AreaStatistics[]>([]);
  isLoading = signal(true);

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
      center: [-7.222299490282227, -35.889158248901374],
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
      const contributorsList = stat.contributors.length > 0
        ? stat.contributors.slice(0, 3).join(', ') + (stat.contributors.length > 3 ? '...' : '')
        : 'Anônimo';

      const circle = L.circle([stat.latitude, stat.longitude], {
        radius: stat.radius,
        fillColor: color,
        fillOpacity: 0.35,
        color: color,
        weight: 2
      }).addTo(this.map);

      const lastDate = stat.lastEvaluationDate instanceof Date
        ? stat.lastEvaluationDate
        : new Date(stat.lastEvaluationDate);
      const formattedDate = lastDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const tooltipContent = `
        <strong>Média: ${stat.averageRating.toFixed(1)}/10</strong><br>
        ${label} · ${stat.totalReports} avaliação(ões)<br>
        <small>Última: ${formattedDate}</small><br>
        <small>Por: ${contributorsList}</small>
      `;

      circle.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'area-tooltip'
      });

      circle.on('click', (e: L.LeafletMouseEvent) => {
        if (!this.authService.isLoggedIn()) {
          this.showLoginRequired.set(true);
          setTimeout(() => this.showLoginRequired.set(false), 3000);
          return;
        }
        this.selectedLocation.set({ lat: e.latlng.lat, lng: e.latlng.lng });
        this.showModal.set(true);
      });

      this.areaLayers.push(circle);
    }
  }

  onRadiusChanged(radius: number): void {
    const location = this.selectedLocation();

    if (this.previewCircle) {
      this.map.removeLayer(this.previewCircle);
      this.previewCircle = null;
    }

    if (radius > 0 && location) {
      this.previewCircle = L.circle([location.lat, location.lng], {
        radius: radius,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 10'
      }).addTo(this.map);
    }
  }

  async onRatingSubmitted(submission: RatingSubmission): Promise<void> {
    const location = this.selectedLocation();
    const userId = this.authService.userId();
    const userName = this.authService.userDisplayName();
    if (!location || !userId) return;

    const report: Omit<CleanlinessReport, 'id'> = {
      latitude: location.lat,
      longitude: location.lng,
      rating: submission.rating,
      radius: submission.radius,
      timestamp: new Date(),
      userId,
      userName: userName ?? undefined
    };

    try {
      await this.cleanlinessService.addReport(report);
      this.closeModalAndCleanup();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  }

  onModalClose(): void {
    this.closeModalAndCleanup();
  }

  private closeModalAndCleanup(): void {
    this.showModal.set(false);
    this.selectedLocation.set(null);

    if (this.previewCircle) {
      this.map.removeLayer(this.previewCircle);
      this.previewCircle = null;
    }
  }
}

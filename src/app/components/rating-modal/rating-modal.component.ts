import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RatingSubmission {
  rating: number;
  radius: number;
}

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss'
})
export class RatingModalComponent implements OnInit, OnDestroy {
  @Input() location: { lat: number; lng: number } | null = null;
  @Output() ratingSubmitted = new EventEmitter<RatingSubmission>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() radiusChanged = new EventEmitter<number>();

  selectedRating = signal<number>(5);
  selectedRadius = signal<number>(500);
  isSubmitting = signal(false);

  readonly ratingOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly radiusOptions = [
    { value: 100, label: '100m' },
    { value: 250, label: '250m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' }
  ];

  ngOnInit(): void {
    this.radiusChanged.emit(this.selectedRadius());
  }

  ngOnDestroy(): void {
    this.radiusChanged.emit(0);
  }

  setRating(rating: number): void {
    this.selectedRating.set(rating);
  }

  setRadius(radius: number): void {
    this.selectedRadius.set(radius);
    this.radiusChanged.emit(radius);
  }

  getRadiusLabel(radius: number): string {
    return radius >= 1000 ? `${radius / 1000}km` : `${radius}m`;
  }

  getRatingColor(rating: number): string {
    if (rating >= 8) return '#22c55e';
    if (rating >= 6) return '#84cc16';
    if (rating >= 4) return '#eab308';
    if (rating >= 2) return '#f97316';
    return '#ef4444';
  }

  getRatingLabel(rating: number): string {
    if (rating >= 8) return 'Excelente';
    if (rating >= 6) return 'Bom';
    if (rating >= 4) return 'Regular';
    if (rating >= 2) return 'Ruim';
    return 'Péssimo';
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.ratingSubmitted.emit({
      rating: this.selectedRating(),
      radius: this.selectedRadius()
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss'
})
export class RatingModalComponent {
  @Input() location: { lat: number; lng: number } | null = null;
  @Output() ratingSubmitted = new EventEmitter<number>();
  @Output() closeModal = new EventEmitter<void>();

  selectedRating = signal<number>(5);
  isSubmitting = signal(false);

  readonly ratingOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  setRating(rating: number): void {
    this.selectedRating.set(rating);
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
    this.ratingSubmitted.emit(this.selectedRating());
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

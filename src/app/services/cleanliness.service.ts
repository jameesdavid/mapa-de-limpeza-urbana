import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CleanlinessReport, AreaStatistics } from '../models/cleanliness-report.model';

@Injectable({
  providedIn: 'root'
})
export class CleanlinessService {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'cleanliness-reports';

  getReports(): Observable<CleanlinessReport[]> {
    const reportsRef = collection(this.firestore, this.collectionName);
    const reportsQuery = query(reportsRef, orderBy('timestamp', 'desc'));
    return collectionData(reportsQuery, { idField: 'id' }) as Observable<CleanlinessReport[]>;
  }

  async addReport(report: Omit<CleanlinessReport, 'id'>): Promise<string> {
    const reportsRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(reportsRef, {
      ...report,
      timestamp: new Date()
    });
    return docRef.id;
  }

  calculateAreaStatistics(reports: CleanlinessReport[]): AreaStatistics[] {
    const areaMap = new Map<string, { ratings: number[], lat: number, lng: number, radius: number }>();

    for (const report of reports) {
      const key = this.getGridKey(report.latitude, report.longitude);

      if (!areaMap.has(key)) {
        areaMap.set(key, {
          ratings: [],
          lat: report.latitude,
          lng: report.longitude,
          radius: report.radius
        });
      }

      areaMap.get(key)!.ratings.push(report.rating);
    }

    const statistics: AreaStatistics[] = [];

    for (const [, area] of areaMap) {
      const sum = area.ratings.reduce((a, b) => a + b, 0);
      statistics.push({
        latitude: area.lat,
        longitude: area.lng,
        averageRating: sum / area.ratings.length,
        totalReports: area.ratings.length,
        radius: area.radius
      });
    }

    return statistics;
  }

  private getGridKey(lat: number, lng: number): string {
    const gridSize = 0.009;
    const gridLat = Math.floor(lat / gridSize) * gridSize;
    const gridLng = Math.floor(lng / gridSize) * gridSize;
    return `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
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
}

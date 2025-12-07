import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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
    const areaMap = new Map<string, {
      ratings: number[],
      lat: number,
      lng: number,
      radius: number,
      contributors: Set<string>,
      lastDate: Date
    }>();

    for (const report of reports) {
      const key = this.getGridKey(report.latitude, report.longitude);
      const reportDate = this.toDate(report.timestamp);

      if (!areaMap.has(key)) {
        areaMap.set(key, {
          ratings: [],
          lat: report.latitude,
          lng: report.longitude,
          radius: report.radius,
          contributors: new Set(),
          lastDate: reportDate
        });
      }

      const area = areaMap.get(key)!;
      area.ratings.push(report.rating);
      if (report.userName) {
        area.contributors.add(report.userName);
      }
      if (reportDate > area.lastDate) {
        area.lastDate = reportDate;
      }
    }

    const statistics: AreaStatistics[] = [];

    for (const [, area] of areaMap) {
      const sum = area.ratings.reduce((a, b) => a + b, 0);
      statistics.push({
        latitude: area.lat,
        longitude: area.lng,
        averageRating: sum / area.ratings.length,
        totalReports: area.ratings.length,
        radius: area.radius,
        contributors: Array.from(area.contributors),
        lastEvaluationDate: area.lastDate
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

  private toDate(timestamp: unknown): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date((timestamp as { seconds: number }).seconds * 1000);
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return new Date();
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

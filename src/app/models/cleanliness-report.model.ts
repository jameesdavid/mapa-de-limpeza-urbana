export interface CleanlinessReport {
  id?: string;
  latitude: number;
  longitude: number;
  rating: number;
  radius: number;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export interface AreaStatistics {
  latitude: number;
  longitude: number;
  averageRating: number;
  totalReports: number;
  radius: number;
  contributors: string[];
}

export interface AnalysisResult {
  predictedDisease: string;
  reasoning: string;
  disclaimer: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LogEntry {
  id: string;
  user_id: string;
  symptoms: string;
  disease: string;
  location: Location | null;
  timestamp: string;
}

export interface DailyRateDetail {
  date: string;
  basePrice: number;
  weekendMultiplier: number;
  seasonalMultiplier: number;
  occupancyMultiplier: number;
  finalDailyRate: number;
}

export interface QuoteRequest {
  categoryId: number;
  roomId?: number;
  resourceType?: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount?: number;
  currentOccupancyPercentage?: number;
}

export interface RateQuoteResponse {
  categoryId: number;
  roomId?: number;
  resourceType?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  guestsCount?: number;
  basePricePerNight: number;
  totalBasePrice: number;
  totalDynamicAdjustment: number;
  totalQuotedAmount: number;
  dailyBreakdown: DailyRateDetail[];
}

export interface RateResponse {
  id: number;
  categoryId: number;
  basePrice: number;
  weekendMultiplier: number;
  seasonalMultiplier: number;
  highOccupancyMultiplier: number;
  lowOccupancyMultiplier: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRateRequest {
  categoryId: number;
  basePrice: number;
  weekendMultiplier?: number;
  seasonalMultiplier?: number;
  highOccupancyMultiplier?: number;
  lowOccupancyMultiplier?: number;
}

export interface UpdateRateRequest {
  basePrice?: number;
  weekendMultiplier?: number;
  seasonalMultiplier?: number;
  highOccupancyMultiplier?: number;
  lowOccupancyMultiplier?: number;
  active?: boolean;
}

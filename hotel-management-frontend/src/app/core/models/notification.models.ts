export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export interface NotificationResponse {
  id: number;
  recipient: string;
  role?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  read: boolean;
  eventType?: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

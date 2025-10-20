// Common type definitions to replace 'any' types throughout the application

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Property related types
export interface PropertyData {
  id: string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  type: string;
  description?: string;
  images?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyValuation {
  id: string;
  propertyId: string;
  estimatedValue: number;
  confidence: number;
  method: string;
  createdAt: string;
  updatedAt: string;
}

// User and Auth types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'ambassador';
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

// Calculator types
export interface CalculatorData {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  propertyValue: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

export interface CalculationResult {
  id: string;
  userId: string;
  propertyId?: string;
  calculationData: CalculatorData;
  result: CalculatorData;
  createdAt: string;
  updatedAt: string;
}

// Building and Construction types
export interface BuildingProject {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'construction' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost?: number;
  progress: number;
}

export interface ConstructionItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

// Lease and Rental types
export interface LeaseAgreement {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  terms: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  leaseId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Document types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  propertyId?: string;
  leaseId?: string;
}

// Chat and Communication types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Map and Location types
export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  type: 'property' | 'tenant' | 'service';
  data?: Record<string, unknown>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Form and Input types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormData {
  [key: string]: string | number | boolean | Date | null;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Event types
export interface AppEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  userId: string;
}

// Settings types
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: Record<string, unknown>;
  updatedAt: string;
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

// Generic response wrapper
export interface ResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

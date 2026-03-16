/**
 * Shared TypeScript types for GroGon systems
 */

// Product Types
export interface Product {
  id: string;
  name: string;
  model: string;
  price: number;
  priceRange?: { min: number; max: number };
  description: string;
  specifications: ProductSpecifications;
  features: string[];
  category: ProductCategory;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 
  | 'commercial-inspection'
  | 'real-estate'
  | 'agricultural'
  | 'public-safety';

export type ProductStatus = 
  | 'development'
  | 'prototype'
  | 'production'
  | 'discontinued';

export interface ProductSpecifications {
  flightTime: string;
  maxSpeed: string;
  range: string;
  camera: string;
  payload?: string;
  weight?: string;
  dimensions?: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  priceRange?: { min: number; max: number };
  category: ServiceCategory;
  features: string[];
  useCases: string[];
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory =
  | 'aerial-photography'
  | 'inspection'
  | 'surveying'
  | 'training'
  | 'maintenance';

export type ServiceStatus =
  | 'active'
  | 'inactive'
  | 'coming-soon';

// Order Types
export interface Order {
  id: string;
  customerId: string;
  type: 'product' | 'service';
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId?: string;
  serviceId?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  type: CustomerType;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerType = 'individual' | 'business' | 'government';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Manufacturing Types
export interface WorkOrder {
  id: string;
  productId: string;
  quantity: number;
  status: WorkOrderStatus;
  priority: Priority;
  startDate?: Date;
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkOrderStatus =
  | 'pending'
  | 'scheduled'
  | 'in-progress'
  | 'quality-check'
  | 'completed'
  | 'on-hold'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Service Job Types
export interface ServiceJob {
  id: string;
  customerId: string;
  serviceId: string;
  pilotId?: string;
  droneId?: string;
  scheduledDate: Date;
  status: ServiceJobStatus;
  location: Location;
  notes?: string;
  deliverables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceJobStatus =
  | 'scheduled'
  | 'in-progress'
  | 'data-processing'
  | 'completed'
  | 'cancelled';

export interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Flight Planning Types
export interface FlightPlan {
  id: string;
  jobId: string;
  missionType: MissionType;
  waypoints: Waypoint[];
  altitude: number;
  speed: number;
  estimatedDuration: number;
  weatherCheck: WeatherCheck;
  airspaceCheck: AirspaceCheck;
  status: FlightPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MissionType =
  | 'photography'
  | 'inspection'
  | 'surveying'
  | 'mapping'
  | 'monitoring';

export interface Waypoint {
  lat: number;
  lng: number;
  altitude: number;
  action?: string;
}

export interface WeatherCheck {
  checked: boolean;
  conditions: string;
  windSpeed: number;
  visibility: number;
  approved: boolean;
}

export interface AirspaceCheck {
  checked: boolean;
  restrictions: string[];
  approved: boolean;
}

export type FlightPlanStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'completed';

// Compliance Types
export interface ComplianceRecord {
  id: string;
  entityType: 'product' | 'service' | 'pilot' | 'equipment';
  entityId: string;
  complianceType: ComplianceType;
  status: ComplianceStatus;
  certificateNumber?: string;
  expiryDate?: Date;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ComplianceType =
  | 'faa-part107'
  | 'fcc'
  | 'ndaa'
  | 'insurance'
  | 'state-license'
  | 'local-permit';

export type ComplianceStatus =
  | 'pending'
  | 'approved'
  | 'expired'
  | 'rejected';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


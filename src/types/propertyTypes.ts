// src/types/propertyTypes.ts

export interface PropertyListing {
    propertyListingId: number;
    accountId: string;
    propertyAddress: string;
    propertyTypeName: string;
    yearBuilt: number;
    bedrooms: number;
    bathrooms: number;
    squareFoot: number;
    price: number;
    lotSize: string;
    parking: string[];
    heatingSystems: string[];
    coolingSystems: string[];
    siteOrPropertyImages: string[]; 
    documents: string[];
    description: string;
    networth: number;
    rehabEstimate: number;
    averageLeasePrice: number;
    imageCount: number;
    videoCount: number;
    views: number;
    saves: number;
    shares: number;
    soldStatus: string;
    pricePerSquareFoot: number;
    isDeleted: boolean;
    isExpired: boolean;
    sellerName: string | null;
    createdDate: string;
    modifiedDate: string;
    expireDate: string;
    
    // For backward compatibility and UI display
    id?: string;
    status?: string;
    bookmarks?: number;
    city?: string;
    state?: string;
    country?: string;
    propertyType?: string;
  }
  
  export interface PropertyListingsResponse {
    items: PropertyListing[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }
  
  export interface CreatePropertyListingRequest {
    SiteOrPropertyImages: string[]; 
    PropertyAddress: string;
    PropertyType: string;
    YearBuilt: number;
    HeatingSystems: string[];
    CoolingSystems: string[];
    Price: number;
    Bedrooms: number;
    Bathrooms: number;
    Parking: string[];
    LotSize: string;
    SquareFoot: number;
    Documents: string[];
    Description: string;
    Networth: number;
    RehabEstimate?: number; // Optional
    AverageLeasePrice?: number; // Optional
    ImageCount: number;
    VideoCount: number;
  }
  
  // Dropdown options
  export const PROPERTY_TYPES = [
    'House',
    'Townhouse',
    'Condo',
    'Multifamily',
    'Manufactured',
    'Co-op'
  ] as const;
  
  export const HEATING_OPTIONS = [
    'Baseboard',
    'Forced Air',
    'Geothermal',
    'Heat Pump',
    'Radiant',
    'Stove',
    'Wall',
    'Other'
  ] as const;
  
  export const COOLING_OPTIONS = [
    'Central',
    'Evaporative',
    'Fans',
    'Geothermal',
    'Refrigeration',
    'Room/Window Air Conditioners',
    'Solar',
    'Wall',
    'Other',
    'None'
  ] as const;
  
  export const PARKING_OPTIONS = [
    'Carport', // Fixed typo from 'Corport'
    'Garage-Attached',
    'Garage-Detached',
    'Off-Street',
    'On-Street',
    'None'
  ] as const;
  
  export const LOT_UNITS = [
    'Acres',
    'Sq Ft'
  ] as const;
  
  export type PropertyType = typeof PROPERTY_TYPES[number];
  export type HeatingOption = typeof HEATING_OPTIONS[number];
  export type CoolingOption = typeof COOLING_OPTIONS[number];
  export type ParkingOption = typeof PARKING_OPTIONS[number];
  export type LotUnit = typeof LOT_UNITS[number];
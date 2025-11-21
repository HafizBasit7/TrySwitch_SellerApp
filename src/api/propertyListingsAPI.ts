// src/api/propertyListingsAPI.ts
import apiClient from './axiosConfig';
import { 
  PropertyListing, 
  PropertyListingsResponse, 
  CreatePropertyListingRequest 
} from '../types/propertyTypes';

export interface CreatePropertyListingResponse {
  message: string;
  success: boolean;
  data?: PropertyListing;
}

export interface DeletePropertyResponse {
  message: string;
}

export interface UpdateSoldStatusResponse {
  message: string;
  success: boolean;
}

export interface RenewPropertyResponse {
  message: string;
  success: boolean;
}

// Helper functions for URL validation and cleaning
const cleanUrlArray = (urls: string[]): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls.filter(url => {
    // Remove null, undefined, empty strings, and "null" strings
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
      return false;
    }
    
    // Validate URL format - accept both Cloudinary and AWS S3 URLs
    try {
      // Check if it's a valid URL (http, https, or S3)
      if (url.startsWith('http://') || 
          url.startsWith('https://') || 
          url.includes('cloudinary.com') || 
          url.includes('s3.amazonaws.com') ||
          url.includes('tryswitch.s3')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
};

const cleanSingleUrl = (url: string): string => {
  if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
    return '';
  }
  
  // Validate URL format
  try {
    if (url.startsWith('http://') || 
        url.startsWith('https://') || 
        url.includes('cloudinary.com') || 
        url.includes('s3.amazonaws.com') ||
        url.includes('tryswitch.s3')) {
      return url;
    }
    return '';
  } catch {
    return '';
  }
};

export const propertyListingsAPI = {
  // GET - Get user's property listings
  getLoggedUserPropertyListings: async (
    pageNumber: number = 1, 
    pageSize: number = 100
  ): Promise<PropertyListingsResponse> => {
    const response = await apiClient.get<PropertyListingsResponse>(
      `/PropertyListings/GetLoggedUserPropertyListings?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    // console.log("Total Properties in DB: ", response.data.totalCount);
    return response.data;
  },

  // POST - Create new property listing
  createPropertyListing: async (
    data: CreatePropertyListingRequest
  ): Promise<CreatePropertyListingResponse> => {
    const formData = new FormData();

    console.log('🛠️ Sending request with address:', data.PropertyAddress);
    console.log('📸 Media items count:', data.SiteOrPropertyImages?.length || 0);
    console.log('📄 Document items count:', data.Documents?.length || 0);

    // Clean and append image URLs (AWS S3 URLs)
    const cleanImages = cleanUrlArray(data.SiteOrPropertyImages || []);
    if (cleanImages.length > 0) {
      cleanImages.forEach((imageUrl, index) => {
        formData.append('SiteOrPropertyImages', imageUrl.trim());
        console.log(`📷 Appending image URL ${index + 1}:`, imageUrl.substring(0, 50) + '...');
      });
    } else {
      formData.append('SiteOrPropertyImages', '');
    }

    // Clean and append document URLs (AWS S3 URLs)
    const cleanDocuments = cleanUrlArray(data.Documents || []);
    if (cleanDocuments.length > 0) {
      cleanDocuments.forEach((docUrl, index) => {
        formData.append('Documents', docUrl.trim());
        console.log(`📄 Appending document URL ${index + 1}:`, docUrl.substring(0, 50) + '...');
      });
    } else {
      formData.append('Documents', '');
    }

    // Append other fields
    formData.append('PropertyAddress', data.PropertyAddress);
    formData.append('PropertyType', data.PropertyType);
    formData.append('YearBuilt', data.YearBuilt.toString());
    
    // Handle array fields with proper cleaning
    const cleanHeatingSystems = data.HeatingSystems?.filter(system => 
      system && system.trim() !== ''
    ) || [];
    if (cleanHeatingSystems.length > 0) {
      cleanHeatingSystems.forEach(system => {
        formData.append('HeatingSystems', system.trim());
      });
    } else {
      formData.append('HeatingSystems', '');
    }
    
    const cleanCoolingSystems = data.CoolingSystems?.filter(system => 
      system && system.trim() !== ''
    ) || [];
    if (cleanCoolingSystems.length > 0) {
      cleanCoolingSystems.forEach(system => {
        formData.append('CoolingSystems', system.trim());
      });
    } else {
      formData.append('CoolingSystems', '');
    }
    
    formData.append('Price', data.Price.toString());
    formData.append('Bedrooms', data.Bedrooms.toString());
    formData.append('Bathrooms', data.Bathrooms.toString());
    
    const cleanParking = data.Parking?.filter(parking => 
      parking && parking.trim() !== ''
    ) || [];
    if (cleanParking.length > 0) {
      cleanParking.forEach(parking => {
        formData.append('Parking', parking.trim());
      });
    } else {
      formData.append('Parking', '');
    }
    
    formData.append('LotSize', data.LotSize);
    formData.append('SquareFoot', data.SquareFoot.toString());
    formData.append('Description', data.Description);
    formData.append('Networth', data.Networth.toString());
    
    if (data.RehabEstimate !== undefined && data.RehabEstimate !== null) {
      formData.append('RehabEstimate', data.RehabEstimate.toString());
    } else {
      formData.append('RehabEstimate', '');
    }
    
    if (data.AverageLeasePrice !== undefined && data.AverageLeasePrice !== null) {
      formData.append('AverageLeasePrice', data.AverageLeasePrice.toString());
    } else {
      formData.append('AverageLeasePrice', '');
    }
    
    formData.append('ImageCount', data.ImageCount.toString());
    formData.append('VideoCount', data.VideoCount.toString());

    try {
      console.log('🚀 Sending POST request to /PropertyListings/CreatePropertyListing');
      console.log('📊 Cleaned data summary:', {
        images: cleanImages.length,
        documents: cleanDocuments.length,
        heatingSystems: cleanHeatingSystems.length,
        coolingSystems: cleanCoolingSystems.length,
        parking: cleanParking.length
      });
      
      const response = await apiClient.post<CreatePropertyListingResponse>(
        '/PropertyListings/CreatePropertyListing',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );
      
      // console.log('✅ API Response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // POST - Update sold status
  updateSoldStatus: async (id: number): Promise<UpdateSoldStatusResponse> => {
    try {
      const response = await apiClient.post<UpdateSoldStatusResponse>(
        `/PropertyListings/UpdateSoldStatus?id=${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Update Sold Status Error:', error);
      throw error;
    }
  },

  // POST - Delete property listing
  deletePropertyListing: async (id: number): Promise<DeletePropertyResponse> => {
    try {
      const response = await apiClient.post<DeletePropertyResponse>(
        `/PropertyListings/DeletePropertyListing?id=${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Delete Property Error:', error);
      throw error;
    }
  },

  // POST - Renew property listing
  renewProperty: async (id: number): Promise<RenewPropertyResponse> => {
    try {
      const response = await apiClient.post<RenewPropertyResponse>(
        `/PropertyListings/RenewProperty/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Renew Property Error:', error);
      throw error;
    }
  },

  // POST - Update property listing
  updatePropertyListing: async (
    id: number,
    data: CreatePropertyListingRequest
  ): Promise<CreatePropertyListingResponse> => {
    const formData = new FormData();

    console.log('🛠️ Updating property listing ID:', id);
    console.log('📸 Media items count:', data.SiteOrPropertyImages?.length || 0);
    console.log('📄 Document items count:', data.Documents?.length || 0);

    // Clean and append image URLs (AWS S3 URLs)
    const cleanImages = cleanUrlArray(data.SiteOrPropertyImages || []);
    if (cleanImages.length > 0) {
      cleanImages.forEach((imageUrl, index) => {
        formData.append('SiteOrPropertyImages', imageUrl.trim());
        console.log(`📷 Appending image URL ${index + 1}:`, imageUrl.substring(0, 50) + '...');
      });
    } else {
      formData.append('SiteOrPropertyImages', '');
    }

    // Clean and append document URLs (AWS S3 URLs)
    const cleanDocuments = cleanUrlArray(data.Documents || []);
    if (cleanDocuments.length > 0) {
      cleanDocuments.forEach((docUrl, index) => {
        formData.append('Documents', docUrl.trim());
        console.log(`📄 Appending document URL ${index + 1}:`, docUrl.substring(0, 50) + '...');
      });
    } else {
      formData.append('Documents', '');
    }

    // Append other fields
    formData.append('PropertyAddress', data.PropertyAddress);
    formData.append('PropertyType', data.PropertyType);
    formData.append('YearBuilt', data.YearBuilt.toString());
    
    // Handle array fields with proper cleaning
    const cleanHeatingSystems = data.HeatingSystems?.filter(system => 
      system && system.trim() !== ''
    ) || [];
    if (cleanHeatingSystems.length > 0) {
      cleanHeatingSystems.forEach(system => {
        formData.append('HeatingSystems', system.trim());
      });
    } else {
      formData.append('HeatingSystems', '');
    }
    
    const cleanCoolingSystems = data.CoolingSystems?.filter(system => 
      system && system.trim() !== ''
    ) || [];
    if (cleanCoolingSystems.length > 0) {
      cleanCoolingSystems.forEach(system => {
        formData.append('CoolingSystems', system.trim());
      });
    } else {
      formData.append('CoolingSystems', '');
    }
    
    formData.append('Price', data.Price.toString());
    formData.append('Bedrooms', data.Bedrooms.toString());
    formData.append('Bathrooms', data.Bathrooms.toString());
    
    const cleanParking = data.Parking?.filter(parking => 
      parking && parking.trim() !== ''
    ) || [];
    if (cleanParking.length > 0) {
      cleanParking.forEach(parking => {
        formData.append('Parking', parking.trim());
      });
    } else {
      formData.append('Parking', '');
    }
    
    formData.append('LotSize', data.LotSize);
    formData.append('SquareFoot', data.SquareFoot.toString());
    formData.append('Description', data.Description);
    formData.append('Networth', data.Networth.toString());
    
    if (data.RehabEstimate !== undefined && data.RehabEstimate !== null) {
      formData.append('RehabEstimate', data.RehabEstimate.toString());
    } else {
      formData.append('RehabEstimate', '');
    }
    
    if (data.AverageLeasePrice !== undefined && data.AverageLeasePrice !== null) {
      formData.append('AverageLeasePrice', data.AverageLeasePrice.toString());
    } else {
      formData.append('AverageLeasePrice', '');
    }
    
    formData.append('ImageCount', data.ImageCount.toString());
    formData.append('VideoCount', data.VideoCount.toString());

    try {
      console.log('🚀 Sending POST request to /PropertyListings/UpdatePropertyListing');
      console.log('📊 Cleaned data summary:', {
        images: cleanImages.length,
        documents: cleanDocuments.length,
        heatingSystems: cleanHeatingSystems.length,
        coolingSystems: cleanCoolingSystems.length,
        parking: cleanParking.length
      });
      
      const response = await apiClient.post<CreatePropertyListingResponse>(
        `/PropertyListings/UpdatePropertyListing?id=${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );
      
      // console.log('✅ API Response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
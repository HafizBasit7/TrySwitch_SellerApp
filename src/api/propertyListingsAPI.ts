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

export const propertyListingsAPI = {
  // GET - Get user's property listings
  getLoggedUserPropertyListings: async (
    pageNumber: number = 1, 
    pageSize: number = 10
  ): Promise<PropertyListingsResponse> => {
    const response = await apiClient.get<PropertyListingsResponse>(
      `/PropertyListings/GetLoggedUserPropertyListings?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // POST - Create new property listing
  createPropertyListing: async (
    data: CreatePropertyListingRequest
  ): Promise<CreatePropertyListingResponse> => {
    const formData = new FormData();

    console.log('🛠️ Sending request with address:', data.PropertyAddress);
    console.log('📸 Media items count:', data.SiteOrPropertyImages.length);
    console.log('📄 Document items count:', data.Documents.length);

    // Append image URLs as strings
    if (data.SiteOrPropertyImages && data.SiteOrPropertyImages.length > 0) {
      data.SiteOrPropertyImages.forEach((imageUrl, index) => {
        if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
          formData.append('SiteOrPropertyImages', imageUrl.trim());
          console.log(`📷 Appending image URL ${index + 1}:`, imageUrl.substring(0, 50) + '...');
        } else {
          console.warn(`⚠️ Skipping invalid image at index ${index}:`, imageUrl);
        }
      });
    }

    // Append document URLs as strings
    if (data.Documents && data.Documents.length > 0) {
      data.Documents.forEach((docUrl, index) => {
        if (typeof docUrl === 'string' && docUrl.trim().startsWith('http')) {
          formData.append('Documents', docUrl.trim());
          console.log(`📄 Appending document URL ${index + 1}:`, docUrl.substring(0, 50) + '...');
        } else {
          console.warn(`⚠️ Skipping invalid document at index ${index}:`, docUrl);
        }
      });
    }

    // Append other fields
    formData.append('PropertyAddress', data.PropertyAddress);
    formData.append('PropertyType', data.PropertyType);
    formData.append('YearBuilt', data.YearBuilt.toString());
    
    if (data.HeatingSystems && data.HeatingSystems.length > 0) {
      data.HeatingSystems.forEach(system => {
        formData.append('HeatingSystems', system);
      });
    }
    
    if (data.CoolingSystems && data.CoolingSystems.length > 0) {
      data.CoolingSystems.forEach(system => {
        formData.append('CoolingSystems', system);
      });
    }
    
    formData.append('Price', data.Price.toString());
    formData.append('Bedrooms', data.Bedrooms.toString());
    formData.append('Bathrooms', data.Bathrooms.toString());
    
    if (data.Parking && data.Parking.length > 0) {
      data.Parking.forEach(parking => {
        formData.append('Parking', parking);
      });
    }
    
    formData.append('LotSize', data.LotSize);
    formData.append('SquareFoot', data.SquareFoot.toString());
    formData.append('Description', data.Description);
    formData.append('Networth', data.Networth.toString());
    
    if (data.RehabEstimate !== undefined && data.RehabEstimate !== null) {
      formData.append('RehabEstimate', data.RehabEstimate.toString());
    }
    
    if (data.AverageLeasePrice !== undefined && data.AverageLeasePrice !== null) {
      formData.append('AverageLeasePrice', data.AverageLeasePrice.toString());
    }
    
    formData.append('ImageCount', data.ImageCount.toString());
    formData.append('VideoCount', data.VideoCount.toString());

    try {
      console.log('🚀 Sending POST request to /PropertyListings/CreatePropertyListing');
      
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

  updatePropertyListing: async (
    id: number,
    data: CreatePropertyListingRequest
  ): Promise<CreatePropertyListingResponse> => {
    const formData = new FormData();

    console.log('🛠️ Updating property listing ID:', id);
    console.log('📸 Media items count:', data.SiteOrPropertyImages.length);
    console.log('📄 Document items count:', data.Documents.length);

    // Append image URLs as strings
    if (data.SiteOrPropertyImages && data.SiteOrPropertyImages.length > 0) {
      data.SiteOrPropertyImages.forEach((imageUrl, index) => {
        if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
          formData.append('SiteOrPropertyImages', imageUrl.trim());
          console.log(`📷 Appending image URL ${index + 1}:`, imageUrl.substring(0, 50) + '...');
        } else {
          console.warn(`⚠️ Skipping invalid image at index ${index}:`, imageUrl);
        }
      });
    }

    // Append document URLs as strings
    if (data.Documents && data.Documents.length > 0) {
      data.Documents.forEach((docUrl, index) => {
        if (typeof docUrl === 'string' && docUrl.trim().startsWith('http')) {
          formData.append('Documents', docUrl.trim());
          console.log(`📄 Appending document URL ${index + 1}:`, docUrl.substring(0, 50) + '...');
        } else {
          console.warn(`⚠️ Skipping invalid document at index ${index}:`, docUrl);
        }
      });
    }

    // Append other fields
    formData.append('PropertyAddress', data.PropertyAddress);
    formData.append('PropertyType', data.PropertyType);
    formData.append('YearBuilt', data.YearBuilt.toString());
    
    if (data.HeatingSystems && data.HeatingSystems.length > 0) {
      data.HeatingSystems.forEach(system => {
        formData.append('HeatingSystems', system);
      });
    }
    
    if (data.CoolingSystems && data.CoolingSystems.length > 0) {
      data.CoolingSystems.forEach(system => {
        formData.append('CoolingSystems', system);
      });
    }
    
    formData.append('Price', data.Price.toString());
    formData.append('Bedrooms', data.Bedrooms.toString());
    formData.append('Bathrooms', data.Bathrooms.toString());
    
    if (data.Parking && data.Parking.length > 0) {
      data.Parking.forEach(parking => {
        formData.append('Parking', parking);
      });
    }
    
    formData.append('LotSize', data.LotSize);
    formData.append('SquareFoot', data.SquareFoot.toString());
    formData.append('Description', data.Description);
    formData.append('Networth', data.Networth.toString());
    
    if (data.RehabEstimate !== undefined && data.RehabEstimate !== null) {
      formData.append('RehabEstimate', data.RehabEstimate.toString());
    }
    
    if (data.AverageLeasePrice !== undefined && data.AverageLeasePrice !== null) {
      formData.append('AverageLeasePrice', data.AverageLeasePrice.toString());
    }
    
    formData.append('ImageCount', data.ImageCount.toString());
    formData.append('VideoCount', data.VideoCount.toString());

    try {
      console.log('🚀 Sending POST request to /PropertyListings/UpdatePropertyListing');
      
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
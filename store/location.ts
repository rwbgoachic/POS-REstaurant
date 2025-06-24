import { create } from 'zustand';
import { RestaurantLocation } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './auth';

interface LocationState {
  selectedLocation: RestaurantLocation | null;
  locations: RestaurantLocation[];
  isLoading: boolean;
  error: Error | null;
  setSelectedLocation: (location: RestaurantLocation | null) => void;
  setLocations: (locations: RestaurantLocation[]) => void;
  getLocationId: () => string | null;
  fetchLocations: () => Promise<void>;
  createLocation: (location: Omit<RestaurantLocation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RestaurantLocation>;
  updateLocation: (id: string, updates: Partial<RestaurantLocation>) => Promise<RestaurantLocation>;
  deleteLocation: (id: string) => Promise<void>;
  toggleLocationStatus: (id: string) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  selectedLocation: null,
  locations: [],
  isLoading: false,
  error: null,
  
  setSelectedLocation: (location) => {
    set({ selectedLocation: location });
    
    // Update user's default location in the database if user is authenticated
    const user = useAuthStore.getState().user;
    if (user && location) {
      supabase
        .from('user_profiles')
        .update({
          default_location_id: location.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update default location:', error);
          }
        });
    }
  },
  
  setLocations: (locations) => set({ locations }),
  
  getLocationId: () => {
    const { selectedLocation } = get();
    return selectedLocation?.id || null;
  },

  fetchLocations: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get the current user's restaurant ID
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ locations: [], isLoading: false });
        return;
      }
      
      let query = supabase
        .from('restaurant_locations')
        .select('*')
        .order('name');
      
      // Filter by restaurant ID if user is not a super admin
      if (user.role !== 'super-admin' && user.role !== 'sub-super-admin') {
        query = query.eq('restaurant_id', user.restaurantId);
      } else if (user.role === 'sub-super-admin' && user.managedRestaurantIds) {
        // For sub-super-admin, filter by managed restaurant IDs
        query = query.in('restaurant_id', user.managedRestaurantIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const locations = data.map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zip_code,
        phone: location.phone,
        email: location.email,
        taxRate: location.tax_rate,
        isActive: location.is_active,
        createdAt: new Date(location.created_at),
        updatedAt: new Date(location.updated_at),
        restaurant_id: location.restaurant_id
      }));
      
      set({ 
        locations,
        isLoading: false 
      });
      
      // If user has a default location, select it
      if (user.defaultLocationId) {
        const defaultLocation = locations.find(loc => loc.id === user.defaultLocationId);
        if (defaultLocation) {
          set({ selectedLocation: defaultLocation });
          return;
        }
      }
      
      // If no default location or it wasn't found, select the first active location
      const activeLocation = locations.find(loc => loc.isActive);
      if (activeLocation) {
        set({ selectedLocation: activeLocation });
      } else if (locations.length > 0) {
        // If no active locations, select the first one
        set({ selectedLocation: locations[0] });
      }
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to fetch locations');
    }
  },

  createLocation: async (location) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get the current user's restaurant ID
      const user = useAuthStore.getState().user;
      if (!user || !user.restaurantId) {
        throw new Error('User not associated with a restaurant');
      }
      
      const { data, error } = await supabase
        .from('restaurant_locations')
        .insert({
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zip_code: location.zipCode,
          phone: location.phone,
          email: location.email,
          tax_rate: location.taxRate,
          is_active: location.isActive,
          restaurant_id: user.restaurantId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newLocation: RestaurantLocation = {
        id: data.id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        email: data.email,
        taxRate: data.tax_rate,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        restaurant_id: data.restaurant_id
      };
      
      set(state => ({
        locations: [...state.locations, newLocation],
        isLoading: false
      }));
      
      toast.success('Location created successfully');
      return newLocation;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to create location');
      throw error;
    }
  },

  updateLocation: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('restaurant_locations')
        .update({
          name: updates.name,
          address: updates.address,
          city: updates.city,
          state: updates.state,
          zip_code: updates.zipCode,
          phone: updates.phone,
          email: updates.email,
          tax_rate: updates.taxRate,
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedLocation: RestaurantLocation = {
        id: data.id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        email: data.email,
        taxRate: data.tax_rate,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        restaurant_id: data.restaurant_id
      };
      
      set(state => ({
        locations: state.locations.map(location => 
          location.id === id ? updatedLocation : location
        ),
        selectedLocation: state.selectedLocation?.id === id ? updatedLocation : state.selectedLocation,
        isLoading: false
      }));
      
      toast.success('Location updated successfully');
      return updatedLocation;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update location');
      throw error;
    }
  },

  deleteLocation: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('restaurant_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => {
        const newLocations = state.locations.filter(location => location.id !== id);
        const newSelectedLocation = state.selectedLocation?.id === id
          ? newLocations.length > 0 ? newLocations[0] : null
          : state.selectedLocation;
        
        return {
          locations: newLocations,
          selectedLocation: newSelectedLocation,
          isLoading: false
        };
      });
      
      toast.success('Location deleted successfully');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to delete location');
      throw error;
    }
  },

  toggleLocationStatus: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current status
      const location = get().locations.find(loc => loc.id === id);
      if (!location) throw new Error('Location not found');
      
      const { data, error } = await supabase
        .from('restaurant_locations')
        .update({
          is_active: !location.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedLocation: RestaurantLocation = {
        id: data.id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        email: data.email,
        taxRate: data.tax_rate,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        restaurant_id: data.restaurant_id
      };
      
      set(state => ({
        locations: state.locations.map(location => 
          location.id === id ? updatedLocation : location
        ),
        selectedLocation: state.selectedLocation?.id === id ? updatedLocation : state.selectedLocation,
        isLoading: false
      }));
      
      toast.success(`Location ${updatedLocation.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update location status');
      throw error;
    }
  }
}));
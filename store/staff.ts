import { create } from 'zustand';
import { User, UserRole } from '../types';
import * as queries from '../lib/queries';
import { toast } from 'react-hot-toast';

interface StaffState {
  staffMembers: User[];
  isLoading: boolean;
  error: Error | null;
  fetchStaffMembers: () => Promise<void>;
  createStaffMember: (email: string, password: string, profile: Omit<User, 'id' | 'email' | 'createdAt' | 'lastLoginAt'>) => Promise<void>;
  updateStaffMember: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteStaffMember: (userId: string) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set) => ({
  staffMembers: [],
  isLoading: false,
  error: null,

  fetchStaffMembers: async () => {
    try {
      set({ isLoading: true, error: null });
      const staffMembers = await queries.getStaffMembers();
      set({ staffMembers, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to fetch staff members');
    }
  },

  createStaffMember: async (email, password, profile) => {
    try {
      set({ isLoading: true, error: null });
      const newStaffMember = await queries.createStaffMember(email, password, profile);
      set(state => ({
        staffMembers: [...state.staffMembers, newStaffMember],
        isLoading: false
      }));
      toast.success('Staff member created successfully');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to create staff member');
    }
  },

  updateStaffMember: async (userId, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedStaffMember = await queries.updateStaffMember(userId, updates);
      set(state => ({
        staffMembers: state.staffMembers.map(member =>
          member.id === userId ? updatedStaffMember : member
        ),
        isLoading: false
      }));
      toast.success('Staff member updated successfully');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update staff member');
    }
  },

  deleteStaffMember: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      await queries.deleteStaffMember(userId);
      set(state => ({
        staffMembers: state.staffMembers.filter(member => member.id !== userId),
        isLoading: false
      }));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to delete staff member');
    }
  }
}));
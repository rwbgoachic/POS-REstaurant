import { create } from 'zustand';
import { MenuItem, Order, OrderItem, InventoryTransaction, OrderType } from '../types';
import * as queries from '../lib/queries';
import { OfflineManager } from '../lib/OfflineManager';
import { storeOfflinePayment, getOfflinePayments } from '../lib/indexedDB';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/auth';

interface POSState {
  // State
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  offlinePayments: any[];

  // Actions
  initialize: () => Promise<void>;
  createMenuItem: (menuItem: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  updateMenuItem: (menuItemId: string, updates: Partial<MenuItem>) => Promise<MenuItem>;
  deleteMenuItem: (menuItemId: string) => Promise<void>;
  restockMenuItem: (menuItemId: string, quantity: number, notes?: string) => Promise<MenuItem>;
  adjustMenuItemStock: (menuItemId: string, newStock: number, notes?: string) => Promise<MenuItem>;
  recordWaste: (menuItemId: string, quantity: number, notes?: string, reason?: string) => Promise<MenuItem>;
  setError: (error: Error | null) => void;
  setOfflineStatus: (isOffline: boolean) => void;
  syncOfflineData: () => Promise<void>;
  syncOfflinePayments: () => Promise<void>;
  addOrder: (order: any) => Promise<any>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<Order>;
  processPayment: (orderId: string, amount: number, paymentMethod: string, details?: any) => Promise<void>;
  processSplitPayment: (orderId: string, payments: any[]) => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  menuItems: [],
  orders: [],
  isLoading: false,
  error: null,
  isOffline: false,
  offlinePayments: [],

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Fetch menu items from the database
      const menuItems = await queries.getMenuItems();
      
      // Fetch orders
      const orders = await queries.getOrders();
      
      // Fetch offline payments
      const offlinePayments = await queries.getOfflinePayments();
      
      set({ 
        menuItems, 
        orders,
        offlinePayments,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  createMenuItem: async (menuItem) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create the menu item
      const newItem = await queries.createMenuItem(menuItem);
      
      // Update the local state
      set(state => ({
        menuItems: [...state.menuItems, newItem],
        isLoading: false
      }));
      
      return newItem;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateMenuItem: async (menuItemId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      // Update the menu item in the database
      const updatedItem = await queries.updateMenuItem(menuItemId, updates);
      
      // Update the local state
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === menuItemId ? updatedItem : item
        ),
        isLoading: false
      }));
      
      return updatedItem;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  deleteMenuItem: async (menuItemId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Delete the menu item from the database
      await queries.deleteMenuItem(menuItemId);
      
      // Update the local state
      set(state => ({
        menuItems: state.menuItems.filter(item => item.id !== menuItemId),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  restockMenuItem: async (menuItemId, quantity, notes) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find the current menu item
      const menuItem = get().menuItems.find(item => item.id === menuItemId);
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      
      // Calculate new stock
      const currentStock = menuItem.currentStock || 0;
      const newStock = currentStock + quantity;
      
      // Get current user ID
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Update stock in database and record transaction
      const updatedItem = await queries.updateMenuItemStock(
        menuItemId,
        newStock,
        'restock',
        quantity,
        userId,
        notes
      );
      
      // Update local state
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === menuItemId ? updatedItem : item
        ),
        isLoading: false
      }));
      
      return updatedItem;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  adjustMenuItemStock: async (menuItemId, newStock, notes) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find the current menu item
      const menuItem = get().menuItems.find(item => item.id === menuItemId);
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      
      // Calculate quantity change
      const currentStock = menuItem.currentStock || 0;
      const quantityChange = newStock - currentStock;
      
      // Get current user ID
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Update stock in database and record transaction
      const updatedItem = await queries.updateMenuItemStock(
        menuItemId,
        newStock,
        'adjustment',
        quantityChange,
        userId,
        notes
      );
      
      // Update local state
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === menuItemId ? updatedItem : item
        ),
        isLoading: false
      }));
      
      return updatedItem;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  recordWaste: async (menuItemId, quantity, notes, reason) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find the current menu item
      const menuItem = get().menuItems.find(item => item.id === menuItemId);
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      
      // Calculate new stock
      const currentStock = menuItem.currentStock || 0;
      const newStock = Math.max(0, currentStock - quantity);
      
      // Get current user ID
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Update stock in database and record transaction
      const updatedItem = await queries.updateMenuItemStock(
        menuItemId,
        newStock,
        'waste',
        -quantity,
        userId,
        notes,
        reason
      );
      
      // Update local state
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === menuItemId ? updatedItem : item
        ),
        isLoading: false
      }));
      
      return updatedItem;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  setError: (error) => set({ error }),
  
  setOfflineStatus: (isOffline) => set({ isOffline }),

  syncOfflineData: async () => {
    try {
      set({ isLoading: true });
      
      // Process the offline queue
      await queries.processOfflineQueue();
      
      // Refresh data after sync
      const menuItems = await queries.getMenuItems();
      const orders = await queries.getOrders();
      
      set({ 
        menuItems,
        orders,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return { success: false, error };
    }
  },

  syncOfflinePayments: async () => {
    try {
      set({ isLoading: true });
      
      // Process offline payments
      const result = await queries.processOfflinePayments();
      
      // Refresh orders after sync
      const orders = await queries.getOrders();
      const offlinePayments = await queries.getOfflinePayments();
      
      set({ 
        orders,
        offlinePayments,
        isLoading: false 
      });
      
      return { success: true, ...result };
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return { success: false, error };
    }
  },

  addOrder: async (order) => {
    try {
      set({ isLoading: true });
      
      // Create the order in the database
      const result = await queries.createOrder(order, order.items);
      
      // Update orders in state
      const orders = await queries.getOrders();
      
      // Refresh menu items to get updated stock levels
      const menuItems = await queries.getMenuItems();
      
      set({ 
        orders,
        menuItems,
        isLoading: false 
      });
      
      return result;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      set({ isLoading: true });
      
      // Update order status
      const updatedOrder = await queries.updateOrderStatus(orderId, status);
      
      // Update orders in state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? updatedOrder : order
        ),
        isLoading: false
      }));
      
      return updatedOrder;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  processPayment: async (orderId, amount, paymentMethod, details) => {
    try {
      set({ isLoading: true });
      
      const { isOffline } = get();
      
      if (isOffline) {
        // Store payment for offline processing
        const offlinePayment = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          orderId,
          amount,
          paymentMethod,
          tipAmount: details?.tipAmount || 0,
          tipPercentage: details?.tipPercentage,
          taxAmount: details?.taxAmount,
          taxRate: details?.taxRate,
          createdAt: new Date()
        };
        
        // Store in IndexedDB
        await storeOfflinePayment(offlinePayment);
        
        // Update local state
        set(state => ({
          offlinePayments: [...state.offlinePayments, offlinePayment],
          orders: state.orders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: 'completed', 
                  paymentStatus: 'paid',
                  updatedAt: new Date()
                } 
              : order
          ),
          isLoading: false
        }));
        
        // Add to offline queue for later sync
        OfflineManager.addToQueue('processPayment', {
          orderId,
          amount,
          paymentMethod,
          tipAmount: details?.tipAmount,
          tipPercentage: details?.tipPercentage,
          taxAmount: details?.taxAmount,
          taxRate: details?.taxRate
        });
      } else {
        // Create payment transaction
        await queries.createPayment({
          orderId,
          amount,
          paymentMethod,
          status: 'completed',
          tipAmount: details?.tipAmount,
          tipPercentage: details?.tipPercentage,
          taxAmount: details?.taxAmount,
          taxRate: details?.taxRate
        });
        
        // Update order status
        await queries.updateOrderStatus(orderId, 'completed');
        
        // Refresh orders
        const orders = await queries.getOrders();
        
        set({ 
          orders,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  processSplitPayment: async (orderId, payments) => {
    try {
      set({ isLoading: true });
      
      const { isOffline } = get();
      
      if (isOffline) {
        // Handle split payments offline
        for (const payment of payments) {
          const offlinePayment = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            orderId,
            amount: payment.amount,
            paymentMethod: payment.method,
            tipAmount: payment.tipAmount || 0,
            taxAmount: payment.taxAmount || 0,
            createdAt: new Date()
          };
          
          // Store in IndexedDB
          await storeOfflinePayment(offlinePayment);
          
          // Update local state
          set(state => ({
            offlinePayments: [...state.offlinePayments, offlinePayment]
          }));
          
          // Add to offline queue for later sync
          OfflineManager.addToQueue('processPayment', {
            orderId,
            amount: payment.amount,
            paymentMethod: payment.method,
            tipAmount: payment.tipAmount,
            taxAmount: payment.taxAmount
          });
        }
        
        // Update order status locally
        set(state => ({
          orders: state.orders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: 'completed', 
                  paymentStatus: 'paid',
                  updatedAt: new Date()
                } 
              : order
          ),
          isLoading: false
        }));
        
        toast.success('Split payment processed (offline mode)');
      } else {
        // Process each payment
        for (const payment of payments) {
          await queries.createPayment({
            orderId,
            amount: payment.amount,
            paymentMethod: payment.method,
            status: 'completed',
            tipAmount: payment.tipAmount || 0,
            taxAmount: payment.taxAmount || 0
          });
        }
        
        // Update order status
        await queries.updateOrderStatus(orderId, 'completed');
        
        // Refresh orders
        const orders = await queries.getOrders();
        
        set({ 
          orders,
          isLoading: false 
        });
        
        toast.success('Split payment processed successfully');
      }
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  }
}));
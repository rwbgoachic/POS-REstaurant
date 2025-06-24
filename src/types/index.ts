export type UserRole = 'super-admin' | 'sub-super-admin' | 'business-owner' | 'store-manager' | 'cashier' | 'waiter' | 'kitchen-crew' | 'cleaning-crew';

export const DEFAULT_TIP_PERCENTAGES = [0, 10, 15, 20, 25];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  restaurantId?: string;
  restaurantName?: string;
  defaultLocationId?: string;
  locationId?: string;
  parentUserId?: string;
  managedRestaurantIds?: string[];
  preferredLanguage?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  ingredients: string[];
  preparationTime: number;
  isAvailable: boolean;
  currentStock?: number;
  minStock?: number;
  modifiers?: Modifier[];
  pricingRules?: PricingRule[];
  locationId?: string;
  restaurant_id?: string;
  version?: number;
}

export interface PricingRule {
  type: 'time-based' | 'holiday-surge';
  schedule: {
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    daysOfWeek?: string[]; // ['monday', 'tuesday', etc.]
    dates?: string[]; // ['2025-12-25', etc.]
  };
  priceAdjustment: number; // Percentage adjustment (e.g., 10 for 10% increase)
  description: string;
}

export interface Modifier {
  id: string;
  name: string;
  options: ModifierOption[];
  required: boolean;
  multiSelect: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  selectedModifiers?: SelectedModifier[];
}

export interface SelectedModifier {
  id: string;
  name: string;
  options: SelectedModifierOption[];
}

export interface SelectedModifierOption {
  id: string;
  name: string;
  price: number;
}

export type OrderType = 'dine-in' | 'takeout' | 'delivery';

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'pending_sync';
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'pending_sync';
  orderSource: 'pos' | 'web' | 'mobile' | 'qr';
  orderType: OrderType;
  estimatedPrepTime: number;
  notes?: string;
  tipAmount?: number;
  tipPercentage?: number;
  taxAmount?: number;
  taxRate?: number;
  discountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  restaurant_id?: string;
  locationId?: string;
  version?: number;
}

export interface OrderRating {
  id: string;
  orderId: string;
  rating: number;
  feedback?: string;
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'gift_card' | 'digital_wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'pending_sync';
export type DigitalWalletType = 'apple_pay' | 'google_pay' | 'samsung_pay';

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  url?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  locationId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  allowMarketing: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  restaurant_id?: string;
  locationId?: string;
  version?: number;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  tipAmount?: number;
  tipPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
  version?: number;
}

export interface DeliveryProvider {
  id: string;
  name: string;
  isActive: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  commissionRate: number;
  logo?: string;
  hiddenFeesConfig?: {
    serviceFee?: number;
    deliveryFee?: number;
    smallOrderFee?: number;
    minimumOrderAmount?: number;
  };
  loyaltyCommissionLogic?: {
    enabled: boolean;
    discountRate?: number;
    pointsPerDollar?: number;
    minimumPointsForDiscount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: Date;
  endTime: Date;
  breakDuration?: number;
  notes?: string;
  locationId?: string;
}

export interface TimeClockEntry {
  id: string;
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours?: number;
  notes?: string;
  locationId?: string;
}

export interface RestaurantLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  taxRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  restaurant_id?: string;
}

export interface WebsiteSettings {
  id: string;
  restaurantId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  heroImage?: string;
  aboutText?: string;
  isEcommerceEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee?: number;
  minimumOrderAmount?: number;
  menuSections?: {
    name: string;
    description: string;
  }[];
  contactInfo?: {
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  type: 'receipt' | 'kitchen' | 'label';
  model: string;
  connectionType: 'usb' | 'network' | 'bluetooth' | 'serial';
  ipAddress?: string;
  port?: number;
  macAddress?: string;
  serialPort?: string;
  baudRate?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface CashDrawerDevice {
  id: string;
  name: string;
  model: string;
  connectionType: 'printer' | 'direct' | 'network';
  printerName?: string;
  serialPort?: string;
  ipAddress?: string;
  port?: number;
  openCommand?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface CardReaderDevice {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  connectionType: 'usb' | 'bluetooth' | 'network';
  serialNumber?: string;
  ipAddress?: string;
  port?: number;
  macAddress?: string;
  apiKey?: string;
  processor: 'fluidpay' | 'stripe' | 'square' | 'clover' | 'other';
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface DisplayDevice {
  id: string;
  name: string;
  type: 'customer' | 'kitchen' | 'menu';
  model?: string;
  screenSize?: string;
  orientation: 'landscape' | 'portrait';
  resolution?: string;
  ipAddress?: string;
  macAddress?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface CashDrawerTransaction {
  id: string;
  drawerId: string;
  type: 'open' | 'close' | 'no_sale' | 'deposit' | 'withdrawal';
  amount?: number;
  reason?: string;
  userId: string;
  createdAt: Date;
  locationId?: string;
}

export interface CardTransaction {
  id: string;
  readerId: string;
  orderId?: string;
  amount: number;
  tipAmount?: number;
  cardType: string;
  last4: string;
  authCode: string;
  transactionId: string;
  status: 'approved' | 'declined' | 'error';
  errorMessage?: string;
  isRefunded: boolean;
  refundedAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  locationId?: string;
}

export interface OfflinePayment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  tipAmount?: number;
  tipPercentage?: number;
  createdAt: Date;
  details?: any;
  locationId?: string;
}

export interface InventoryTransaction {
  id: string;
  menuItemId: string;
  transactionType: 'sale' | 'restock' | 'adjustment' | 'waste';
  quantityChange: number;
  currentStock: number;
  userId: string;
  notes?: string;
  reason?: string;
  orderId?: string;
  createdAt: Date;
  restaurantId?: string;
  locationId?: string;
}

export interface LocationSpecificData {
  locationId: string;
  data: any;
}

export interface LoyaltyProgram {
  id: string;
  restaurantId: string;
  name: string;
  pointsPerDollar: number;
  rewardThresholds: {
    points: number;
    rewardType: 'discount' | 'freeItem' | 'giftCard';
    rewardValue: number;
    description: string;
  }[];
  birthdayReward?: {
    enabled: boolean;
    rewardType: 'discount' | 'freeItem' | 'giftCard';
    rewardValue: number;
    description: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface CustomerLoyaltyAccount {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  loyaltyProgramId: string;
  currentPoints: number;
  lifetimePoints: number;
  birthdate?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerLoyaltyAccountId: string;
  orderId?: string;
  pointsChange: number;
  transactionType: 'earn' | 'redeem' | 'adjust' | 'expire';
  description?: string;
  createdAt: Date;
  locationId?: string;
}

export interface TipPoolingRule {
  id: string;
  restaurantId: string;
  ruleName: string;
  distributionMethod: 'percentage_by_role' | 'hours_worked' | 'custom';
  ruleDetails: {
    rolePercentages?: Record<UserRole, number>;
    useHoursWorked?: boolean;
    customLogic?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locationId?: string;
}

export interface DailyTipLog {
  id: string;
  restaurantId: string;
  locationId?: string;
  date: Date;
  totalCashTips: number;
  totalCardTips: number;
  totalDigitalTips: number;
  totalTipsCollected: number;
  tipPoolingRuleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeTipDistribution {
  id: string;
  dailyTipLogId: string;
  employeeId: string;
  distributedAmount: number;
  calculationDetails?: {
    hoursWorked?: number;
    rolePercentage?: number;
    calculationMethod: string;
  };
  createdAt: Date;
  locationId?: string;
}

export interface FluidpayConfig {
  privateKey: string;
  publicKey: string;
  environment: 'sandbox' | 'production';
  isActive: boolean;
}
import { z } from 'zod';

// ============================================================
// CONSTANTS
// ============================================================

export const GEMSTONE_TYPES = [
  'Ruby', 'Sapphire', 'Emerald', 'Amethyst', 'Opal',
  'Diamond', 'Topaz', 'Aquamarine', 'Garnet', 'Tourmaline',
  'Tanzanite', 'Spinel', 'Other',
] as const;

export const CUT_TYPES = [
  'Round', 'Oval', 'Pear', 'Cushion', 'Marquise',
  'Princess', 'Emerald', 'Radiant', 'Asscher', 'Heart',
] as const;

export const CLARITY_GRADES = [
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2',
  'SI1', 'SI2', 'I1', 'I2', 'I3',
] as const;

export const TREATMENT_TYPES = [
  'None', 'Heated', 'Oiled', 'Filled', 'Irradiated',
] as const;

export const CERTIFICATION_BODIES = [
  'GIA', 'IGI', 'AGL', 'GRS', 'Gübelin', 'None',
] as const;

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    full_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    role: z.enum(['buyer', 'seller']),
    store_name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'seller') {
        return data.store_name && data.store_name.length >= 3;
      }
      return true;
    },
    {
      message: 'Store name must be at least 3 characters',
      path: ['store_name'],
    }
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ============================================================
// PRODUCT SCHEMA
// ============================================================

export const productSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(200, 'Product name is too long'),
    gemstone_type: z.enum(GEMSTONE_TYPES, {
      errorMap: () => ({ message: 'Please select a gemstone type' }),
    }),
    cut: z.enum(CUT_TYPES, {
      errorMap: () => ({ message: 'Please select a cut type' }),
    }),
    clarity: z.enum(CLARITY_GRADES, {
      errorMap: () => ({ message: 'Please select a clarity grade' }),
    }),
    color_grade: z.string().max(20, 'Color grade is too long').optional(),
    carat_weight: z
      .number({ invalid_type_error: 'Please enter a valid carat weight' })
      .min(0.01, 'Carat weight must be at least 0.01')
      .max(1000, 'Carat weight cannot exceed 1000'),
    origin_country: z.string().max(100, 'Country name is too long').optional(),
    treatment: z.enum(TREATMENT_TYPES),
    certification_body: z.enum(CERTIFICATION_BODIES),
    certification_number: z.string().optional(),
    price: z
      .number({ invalid_type_error: 'Please enter a valid price' })
      .min(1, 'Price must be at least $1'),
    compare_price: z
      .number({ invalid_type_error: 'Please enter a valid compare price' })
      .optional(),
    cost_price: z
      .number({ invalid_type_error: 'Please enter a valid cost price' })
      .optional(),
    stock_quantity: z
      .number({ invalid_type_error: 'Please enter a valid quantity' })
      .int('Quantity must be a whole number')
      .min(1, 'Stock quantity must be at least 1'),
    low_stock_threshold: z
      .number()
      .int('Threshold must be a whole number')
      .min(0, 'Threshold cannot be negative')
      .default(3),
    description: z
      .string()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description is too long'),
    tags: z.string().optional(),
    category_id: z.string().uuid('Invalid category').optional(),
    dimensions_mm: z.string().max(50, 'Dimensions too long').optional(),
    weight_grams: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.compare_price && data.compare_price <= data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Compare price must be greater than the selling price',
      path: ['compare_price'],
    }
  )
  .refine(
    (data) => {
      if (
        data.certification_body !== 'None' &&
        !data.certification_number
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Certification number is required when a certification body is selected',
      path: ['certification_number'],
    }
  );

// ============================================================
// ADDRESS SCHEMA
// ============================================================

export const addressSchema = z.object({
  label: z.string().default('Home'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  address_line1: z.string().min(5, 'Street address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postal_code: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  is_default: z.boolean().default(false),
});

// ============================================================
// CHECKOUT SCHEMA
// ============================================================

export const checkoutSchema = z.object({
  shipping: addressSchema,
  save_address: z.boolean().default(false),
});

// ============================================================
// REVIEW SCHEMA
// ============================================================

export const reviewSchema = z.object({
  rating: z
    .number({ invalid_type_error: 'Please select a rating' })
    .int()
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  title: z.string().max(200, 'Title is too long').optional(),
  body: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review is too long')
    .optional(),
});

// ============================================================
// SELLER ONBOARDING SCHEMA
// ============================================================

export const sellerOnboardSchema = z.object({
  store_name: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name is too long')
    .regex(
      /^[a-zA-Z0-9\s\-_&.]+$/,
      'Store name can only contain letters, numbers, spaces, and basic punctuation'
    ),
  store_description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description is too long'),
  business_type: z.enum(['individual', 'company']),
  tax_id: z.string().optional(),
});

// ============================================================
// PROFILE SCHEMA
// ============================================================

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// ============================================================
// ORDER TRACKING SCHEMA (admin)
// ============================================================

export const trackingUpdateSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  tracking_carrier: z.string().min(1, 'Carrier is required'),
  status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
});

// ============================================================
// PLATFORM SETTINGS SCHEMA (admin)
// ============================================================

export const platformSettingsSchema = z.object({
  platform_fee_rate: z
    .number()
    .min(0, 'Fee rate cannot be negative')
    .max(50, 'Fee rate cannot exceed 50%'),
  min_payout_amount: z
    .number()
    .min(0, 'Minimum payout cannot be negative'),
  payout_schedule: z.enum(['daily', 'weekly', 'monthly']),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type SellerOnboardFormData = z.infer<typeof sellerOnboardSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type TrackingUpdateFormData = z.infer<typeof trackingUpdateSchema>;
export type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;

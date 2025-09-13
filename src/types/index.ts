// Type definitions for Loro Templates extension

export interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    content: string;
    sampleData?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId?: string;
    schema?: string;
}

export interface UsageInfo {
    usageCount: number;
    usageLimit: number;
    overageCount: number;
    overageRate: number;
    tier: string;
    tierDisplayName: string;
    monthlyPrice: number;
    billingCycleStart: string;
    remainingUsage: number;
    percentageUsed: number;
}

export interface TestResult {
    success: boolean;
    output: string;
    duration: number;
    errors?: string[];
    usageConsumed?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AuthCredentials {
    apiKey: string;
    userEmail?: string;
}

export interface TemplateCreateRequest {
    name: string;
    category: string;
    description: string;
    content: string;
    sampleData?: string;
    isActive: boolean;
}
/**
 * @file tool-contract.ts
 * @layer Domain
 * @description Standardized contracts, interfaces, and taxonomy for agent tools and execution contexts.
 */

import { z } from 'zod';

export type ToolRiskLevel = 'SAFE' | 'SENSITIVE';

export interface ToolExecutionContext {
  userId?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  sessionContext?: Record<string, any>;
}

export interface ToolDefinition<TParams extends z.ZodTypeAny = z.ZodTypeAny, TResult = any> {
  name: string;
  description: string;
  riskLevel: ToolRiskLevel;
  parameters: TParams;
  requiresConfirmationMessage?: (params: z.infer<TParams>) => string;
  execute: (params: z.input<TParams>, context?: ToolExecutionContext) => Promise<TResult>;
}

export interface ToolExecutionResponse<T = any> {
  success: boolean;
  data?: T;
  reason?: string;
  error?: string;
}

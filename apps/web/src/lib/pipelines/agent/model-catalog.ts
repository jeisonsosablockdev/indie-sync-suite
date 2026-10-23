/**
 * @file model-catalog.ts
 * @layer Domain
 * @description Curated multi-provider model catalog and capability descriptors for the agent orchestrator.
 */

export type SupportedProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export type ModelCapability = 'reasoning' | 'vision' | 'fast_tools' | 'streaming';

export type RecommendationUse = 'brand_interview' | 'task_generation' | 'fast_tools';

export interface ModelDescriptor {
  id: string;
  provider: SupportedProvider;
  label: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  recommendedFor: RecommendationUse[];
}

export const MODEL_CATALOG: readonly ModelDescriptor[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    label: 'OpenAI GPT-4o',
    capabilities: ['reasoning', 'vision', 'fast_tools', 'streaming'],
    contextWindow: 128_000,
    recommendedFor: ['brand_interview', 'task_generation'],
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    label: 'OpenAI GPT-4o Mini',
    capabilities: ['fast_tools', 'streaming'],
    contextWindow: 128_000,
    recommendedFor: ['fast_tools'],
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    label: 'Anthropic Claude 3.5 Sonnet',
    capabilities: ['reasoning', 'vision', 'fast_tools', 'streaming'],
    contextWindow: 200_000,
    recommendedFor: ['brand_interview', 'task_generation'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    label: 'Anthropic Claude 3.5 Haiku',
    capabilities: ['fast_tools', 'streaming'],
    contextWindow: 200_000,
    recommendedFor: ['fast_tools'],
  },
  {
    id: 'gemini-1.5-pro-latest',
    provider: 'google',
    label: 'Google Gemini 1.5 Pro',
    capabilities: ['reasoning', 'vision', 'fast_tools', 'streaming'],
    contextWindow: 1_000_000,
    recommendedFor: ['brand_interview', 'task_generation'],
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    label: 'Google Gemini 2.0 Flash',
    capabilities: ['fast_tools', 'streaming'],
    contextWindow: 1_000_000,
    recommendedFor: ['fast_tools'],
  },
  {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    label: 'Groq Llama 3.3 70B',
    capabilities: ['reasoning', 'fast_tools', 'streaming'],
    contextWindow: 128_000,
    recommendedFor: ['brand_interview', 'fast_tools'],
  },
  {
    id: 'llama3.2',
    provider: 'ollama',
    label: 'Ollama Llama 3.2 (Local)',
    capabilities: ['streaming', 'fast_tools'],
    contextWindow: 8_192,
    recommendedFor: ['fast_tools'],
  },
] as const;

/**
 * Finds a model descriptor by exact model ID.
 *
 * @param modelId - Target model identifier
 * @returns ModelDescriptor or undefined if not in catalog
 */
export function getModelDescriptor(modelId: string): ModelDescriptor | undefined {
  return MODEL_CATALOG.find(m => m.id === modelId);
}

/**
 * Lists models recommended for a specific orchestrator task.
 *
 * @param useCase - Target use case
 * @returns Array of ModelDescriptors
 */
export function getRecommendedModels(useCase: RecommendationUse): ModelDescriptor[] {
  return MODEL_CATALOG.filter(m => m.recommendedFor.includes(useCase));
}

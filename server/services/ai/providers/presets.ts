import type { KnownProvider, ProviderInfo } from '../drivers/types'

/**
 * Provider presets for known AI providers
 *
 * These presets contain default configurations for popular AI providers
 * that implement the OpenAI-compatible API format.
 */
export const PROVIDER_PRESETS: Record<Exclude<KnownProvider, 'claude'>, ProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    envKeyName: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsJsonMode: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', vision: true, contextLength: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', vision: true, contextLength: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', vision: true, contextLength: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', vision: false, contextLength: 16385 },
    ],
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    envKeyName: 'GROQ_API_KEY',
    supportsVision: true,
    supportsJsonMode: true,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', vision: false, contextLength: 131072 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', vision: false, contextLength: 131072 },
      { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', vision: true, contextLength: 8192 },
      { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision', vision: true, contextLength: 8192 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', vision: false, contextLength: 32768 },
    ],
  },

  together: {
    id: 'together',
    name: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    envKeyName: 'TOGETHER_API_KEY',
    supportsVision: true,
    supportsJsonMode: true,
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', vision: false, contextLength: 131072 },
      { id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', name: 'Llama 3.2 90B Vision', vision: true, contextLength: 131072 },
      { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', name: 'Llama 3.2 11B Vision', vision: true, contextLength: 131072 },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', vision: false, contextLength: 131072 },
    ],
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    envKeyName: 'MISTRAL_API_KEY',
    supportsVision: true,
    supportsJsonMode: true,
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', vision: false, contextLength: 128000 },
      { id: 'mistral-small-latest', name: 'Mistral Small', vision: false, contextLength: 128000 },
      { id: 'pixtral-large-latest', name: 'Pixtral Large', vision: true, contextLength: 128000 },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B', vision: true, contextLength: 128000 },
      { id: 'codestral-latest', name: 'Codestral', vision: false, contextLength: 32000 },
    ],
  },

  ollama: {
    id: 'ollama',
    name: 'Ollama',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    envKeyName: 'OLLAMA_HOST', // URL instead of key
    supportsVision: true,
    supportsJsonMode: true,
    isOllama: true,
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', vision: false, contextLength: 131072 },
      { id: 'llama3.2-vision', name: 'Llama 3.2 Vision', vision: true, contextLength: 131072 },
      { id: 'mistral', name: 'Mistral', vision: false, contextLength: 32000 },
      { id: 'llava', name: 'LLaVA', vision: true, contextLength: 4096 },
      { id: 'qwen2.5', name: 'Qwen 2.5', vision: false, contextLength: 131072 },
    ],
  },
}

/**
 * Get preset for a known provider
 */
export function getProviderPreset(provider: KnownProvider): ProviderInfo | null {
  if (provider === 'claude') {
    // Claude uses a different driver (Anthropic SDK)
    return null
  }
  return PROVIDER_PRESETS[provider] || null
}

/**
 * Get all available provider presets
 */
export function getAllProviderPresets(): ProviderInfo[] {
  return Object.values(PROVIDER_PRESETS)
}

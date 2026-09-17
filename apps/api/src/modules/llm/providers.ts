/**
 * Providers this application can talk to.
 *
 * All of them speak the OpenAI chat-completions protocol, which is why the
 * `openai` SDK is still the transport: it is the protocol client, not a
 * commitment to the vendor. Switching between OpenAI, DeepSeek and OpenRouter
 * is a base URL, a key and a model name.
 */
export const LLM_PROVIDERS = [
  'openai',
  'deepseek',
  'openrouter',
  'custom',
] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export interface ProviderDefinition {
  label: string;
  /** Undefined means the SDK default (api.openai.com). */
  baseUrl?: string;
  defaultModel: string;
  /** USD per token. Published list prices; see PRICING below for the caveat. */
  pricing: Record<string, { prompt: number; completion: number }>;
}

const perMillion = (prompt: number, completion: number) => ({
  prompt: prompt / 1_000_000,
  completion: completion / 1_000_000,
});

export const PROVIDERS: Record<LlmProvider, ProviderDefinition> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    pricing: {
      'gpt-4': perMillion(30, 60),
      'gpt-4-turbo': perMillion(10, 30),
      'gpt-4o': perMillion(5, 15),
      'gpt-4o-mini': perMillion(0.15, 0.6),
      'gpt-3.5-turbo': perMillion(1.5, 2),
    },
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    pricing: {
      'deepseek-chat': perMillion(0.27, 1.1),
      'deepseek-reasoner': perMillion(0.55, 2.19),
    },
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    // OpenRouter addresses models as `vendor/model`.
    defaultModel: 'deepseek/deepseek-chat',
    // Deliberately empty: OpenRouter fronts hundreds of models at prices that
    // move, and guessing one would put invented numbers in the cost report.
    // Set LLM_PRICING in the admin settings for the models you actually use.
    pricing: {},
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    defaultModel: '',
    pricing: {},
  },
};

export function isLlmProvider(value: string): value is LlmProvider {
  return (LLM_PROVIDERS as readonly string[]).includes(value);
}

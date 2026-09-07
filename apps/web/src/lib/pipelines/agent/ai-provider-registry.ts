/**
 * @file ai-provider-registry.ts
 * @layer Domain
 * @description Decoupled multi-provider LLM factory over Vercel AI SDK Core with lazy credential injection and anti-SSRF protection.
 */

import { KeyringPort } from '../../infrastructure/security/keyring-adapter';
import { CredentialService } from '../security/credential-service';
import { computeKeyFingerprint } from '../security/key-masker';
import { ClientCache } from './client-cache';
import { getModelDescriptor, SupportedProvider, ModelDescriptor } from './model-catalog';
import { validateBaseUrl } from './ssrf-validator';

export interface ModelResolutionOptions {
  customBaseUrl?: string;
  temperature?: number;
}

export interface ResolvedModel {
  modelId: string;
  provider: SupportedProvider;
  descriptor: ModelDescriptor;
  keyFingerprint: string;
  baseUrl?: string;
}

/**
 * Registry resolving and caching AI models backed by secure BYOK storage.
 */
export class AiProviderRegistry {
  private keyring: KeyringPort;
  private clientCache: ClientCache<ResolvedModel>;
  private credentialService?: CredentialService;

  /**
   * Initializes AiProviderRegistry with a KeyringPort and optional CredentialService.
   *
   * @param keyring - KeyringPort implementation
   * @param credentialService - Optional CredentialService for reactive cache purging
   * @param clientCache - Optional custom ClientCache instance
   */
  constructor(
    keyring: KeyringPort,
    credentialService?: CredentialService,
    clientCache?: ClientCache<ResolvedModel>
  ) {
    this.keyring = keyring;
    this.credentialService = credentialService;
    this.clientCache = clientCache || new ClientCache<ResolvedModel>();

    // Step 1: Hook into credential change events for deterministic cache purging
    if (this.credentialService) {
      this.credentialService.onCredentialChange((provider) => {
        this.clientCache.purgeProvider(provider);
      });
    }
  }

  /**
   * Resolves a model instance lazily with credential injection and anti-SSRF verification.
   *
   * @param modelId - Target model identifier (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022')
   * @param options - Custom model resolution options including optional customBaseUrl
   * @returns ResolvedModel object containing verified descriptor and key fingerprint
   */
  async resolveModel(
    modelId: string,
    options: ModelResolutionOptions = {}
  ): Promise<ResolvedModel> {
    // Step 2: Lookup model descriptor in catalog
    const descriptor = getModelDescriptor(modelId);
    if (!descriptor) {
      throw new Error(`Modelo "${modelId}" no reconocido en el catálogo de proveedores`);
    }

    const { provider } = descriptor;
    let targetBaseUrl = options.customBaseUrl;

    // Step 3: Default base URLs for OpenAI-compatible providers
    if (provider === 'groq' && !targetBaseUrl) {
      targetBaseUrl = 'https://api.groq.com/openai/v1';
    } else if (provider === 'ollama' && !targetBaseUrl) {
      targetBaseUrl = 'http://localhost:11434/v1';
    }

    // Step 4: Validate custom base URL against SSRF vulnerabilities
    if (targetBaseUrl) {
      const ssrfCheck = validateBaseUrl(targetBaseUrl);
      if (!ssrfCheck.valid) {
        throw new Error(`URL de endpoint rechazada por seguridad: ${ssrfCheck.reason}`);
      }
    }

    // Step 5: Resolve API key from secure keyring (Ollama allows local dummy key)
    let rawKey = await this.keyring.getSecret(`ai:${provider}`, 'default');

    if (!rawKey && provider === 'ollama') {
      rawKey = 'ollama-local-key';
    }

    if (!rawKey) {
      throw new Error(
        `Credencial no configurada para el proveedor "${provider}". Configúrala en la consola BYOK para usar "${modelId}".`
      );
    }

    // Step 6: Compute fingerprint for cache lookup (never cache raw secret)
    const keyFingerprint = computeKeyFingerprint(rawKey);
    const cached = this.clientCache.get(provider, modelId, keyFingerprint);
    if (cached) {
      return cached;
    }

    // Step 7: Instantiate resolved model record
    const resolved: ResolvedModel = {
      modelId,
      provider,
      descriptor,
      keyFingerprint,
      baseUrl: targetBaseUrl,
    };

    // Step 8: Cache resolved model instance
    this.clientCache.set(provider, modelId, keyFingerprint, resolved);

    return resolved;
  }

  /**
   * Returns reference to the internal client cache.
   */
  getCache(): ClientCache<ResolvedModel> {
    return this.clientCache;
  }
}

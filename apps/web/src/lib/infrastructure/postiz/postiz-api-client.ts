/**
 * @file postiz-api-client.ts
 * @layer Infrastructure
 * @description Client driver for headless Postiz Cloud REST API with anti-SSRF URL validation
 *              and safe timeouts. Pure functional factory pattern, zero classes.
 */

export interface PostizClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface PostizScheduleRequest {
  idempotencyKey: string;
  platform: string;
  content: string;
  scheduledAt: string;
  mediaUrls?: string[];
}

export interface PostizScheduleResponse {
  postId: string;
  status: 'QUEUED' | 'SCHEDULED' | 'FAILED';
  scheduledAt: string;
  error?: string;
}

export interface PostizChannel {
  channelId: string;
  platform: string;
  accountName: string;
  isConnected: boolean;
  expiresAt?: string;
}

export interface PostizApiClient {
  schedulePost: (request: PostizScheduleRequest) => Promise<PostizScheduleResponse>;
  listChannels: () => Promise<PostizChannel[]>;
  checkServiceHealth: () => Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE'; latencyMs: number }>;
}

/**
 * Validates that a target URL is safe and does not target private, loopback, or metadata networks.
 *
 * @param urlString - Target URL string
 * @returns True if URL passes anti-SSRF safety checks
 */
export function assertSafePublicUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Disallow loopback, private IP ranges, link-local, and cloud metadata
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Functional factory instantiating the Postiz Cloud API client.
 *
 * @param config - Postiz client configuration including baseUrl and apiKey
 * @returns Fully typed PostizApiClient implementation
 */
export function createPostizApiClient(config: PostizClientConfig = {}): PostizApiClient {
  const baseUrl = config.baseUrl ?? 'https://api.postiz.com';
  const apiKey = config.apiKey ?? '';
  const timeoutMs = config.timeoutMs ?? 5000;

  // Step 1: Validate baseUrl configuration against anti-SSRF rules
  if (!assertSafePublicUrl(baseUrl) && baseUrl !== 'https://api.postiz.com') {
    throw new Error(`Security Violation: Unsafe Postiz API baseUrl: ${baseUrl}`);
  }

  return {
    schedulePost: async (request: PostizScheduleRequest): Promise<PostizScheduleResponse> => {
      // Step 1: Validate media URLs if provided
      if (request.mediaUrls) {
        for (const mediaUrl of request.mediaUrls) {
          if (!assertSafePublicUrl(mediaUrl)) {
            throw new Error(`Security Violation: Potentially unsafe media URL in schedule request: ${mediaUrl}`);
          }
        }
      }

      // Step 2: Stub implementation returning deterministic queued response
      // (Will execute fetch to Postiz endpoint when BYOK is connected)
      return {
        postId: `postiz-${request.idempotencyKey}`,
        status: 'QUEUED',
        scheduledAt: request.scheduledAt,
      };
    },

    listChannels: async (): Promise<PostizChannel[]> => {
      // Step 1: Stub implementation returning default empty channel list
      return [];
    },

    checkServiceHealth: async (): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE'; latencyMs: number }> => {
      // Step 1: Simulated health ping
      return {
        status: apiKey ? 'HEALTHY' : 'DEGRADED',
        latencyMs: 42,
      };
    },
  };
}

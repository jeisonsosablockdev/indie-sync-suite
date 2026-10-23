/**
 * @file stream-adapter.test.ts
 * @layer Domain Test
 * @description Unit tests for Server-Sent Events (SSE) stream formatting and chunk parsing.
 */

import { describe, test, expect } from 'vitest';
import {
  formatSseEvent,
  parseSseChunk,
  createSseStream,
  StreamEvent,
} from '../../../apps/web/src/lib/pipelines/agent/stream-adapter';

describe('SSE Stream Adapter', () => {
  test('formats and parses text-delta stream event roundtrip', () => {
    const event: StreamEvent = { type: 'text-delta', content: 'Hola mundo musical' };
    const formatted = formatSseEvent(event);

    expect(formatted).toBe('data: {"type":"text-delta","content":"Hola mundo musical"}\n\n');

    const parsed = parseSseChunk(formatted);
    expect(parsed).toEqual(event);
  });

  test('formats and parses tool-call stream event', () => {
    const event: StreamEvent = {
      type: 'tool-call',
      toolName: 'crear_artista',
      toolCallId: 'call_123',
      args: { name: 'Luna Nueva' },
    };
    const formatted = formatSseEvent(event);
    const parsed = parseSseChunk(formatted);

    expect(parsed).toEqual(event);
  });

  test('returns null when parsing invalid or non-data chunk', () => {
    expect(parseSseChunk(': ping comment\n\n')).toBeNull();
    expect(parseSseChunk('data: not-a-json\n\n')).toBeNull();
  });

  test('converts async generator into readable stream and emits bytes', async () => {
    async function* mockEventSource(): AsyncIterable<StreamEvent> {
      yield { type: 'status', status: 'thinking' };
      yield { type: 'text-delta', content: 'Token 1' };
      yield { type: 'text-delta', content: 'Token 2' };
      yield { type: 'status', status: 'complete' };
    }

    const stream = createSseStream(mockEventSource());
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let fullOutput = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      fullOutput += decoder.decode(value);
    }

    expect(fullOutput).toContain('"status":"thinking"');
    expect(fullOutput).toContain('"content":"Token 1"');
    expect(fullOutput).toContain('"content":"Token 2"');
    expect(fullOutput).toContain('"status":"complete"');
  });
});

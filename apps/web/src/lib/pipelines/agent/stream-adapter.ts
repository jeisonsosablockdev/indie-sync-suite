/**
 * @file stream-adapter.ts
 * @layer Domain
 * @description Server-Sent Events (SSE) stream formatting and parser for streaming assistant tokens and tool events.
 */

export type StreamEvent =
  | { type: 'text-delta'; content: string }
  | { type: 'tool-call'; toolName: string; toolCallId: string; args: Record<string, any> }
  | { type: 'tool-result'; toolCallId: string; result: any }
  | { type: 'status'; status: 'thinking' | 'tool_calling' | 'complete' }
  | { type: 'error'; message: string };

/**
 * Formats a StreamEvent into a valid SSE data line.
 *
 * @param event - Typed stream event
 * @returns Serialized SSE string
 */
export function formatSseEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parses an incoming SSE chunk back into a typed StreamEvent.
 *
 * @param chunk - Raw SSE chunk string (e.g. 'data: {"type":"text-delta",...}\n\n')
 * @returns Parsed StreamEvent or null if not an SSE data line
 */
export function parseSseChunk(chunk: string): StreamEvent | null {
  const trimmed = chunk.trim();
  if (!trimmed.startsWith('data:')) {
    return null;
  }

  const jsonStr = trimmed.slice(5).trim();
  try {
    return JSON.parse(jsonStr) as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Converts an AsyncIterable of StreamEvents into a Web standard ReadableStream of Uint8Array bytes.
 *
 * @param eventSource - Async iterable emitting StreamEvents
 * @returns ReadableStream suitable for Next.js Route Handlers
 */
export function createSseStream(eventSource: AsyncIterable<StreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of eventSource) {
          const sseLine = formatSseEvent(event);
          controller.enqueue(encoder.encode(sseLine));
        }
        controller.close();
      } catch (err: any) {
        const errorLine = formatSseEvent({
          type: 'error',
          message: err?.message || 'Error en el flujo de streaming',
        });
        controller.enqueue(encoder.encode(errorLine));
        controller.close();
      }
    },
  });
}

import type { Response } from 'express';
import type { SseEvent } from '@open-arena/shared';

/**
 * Send a typed SSE event to the client.
 *
 * Handles serialization, formatting, and optional flushing.
 * Every event the backend emits should go through this helper to ensure
 * the format is consistent and matches the `@open-arena/shared` SSE union.
 */
export function sseSend(res: Response, event: SseEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
}

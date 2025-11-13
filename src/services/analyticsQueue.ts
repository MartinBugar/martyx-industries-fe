/**
 * Analytics Offline Queue
 * Handles failed analytics events with retry logic
 *
 * ARCHITECTURE:
 * - Events that fail to send are stored in localStorage
 * - Queue processes events with exponential backoff
 * - Maximum 100 events in queue (FIFO)
 * - Events expire after 24 hours
 */

import type { AnalyticsEventDto } from '../types/analytics';
import { logInfo, logWarn, logError } from './logger';

const QUEUE_KEY = 'martyx_analytics_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
const EVENT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_INTERVAL_MS = 30000; // 30 seconds

interface QueuedEvent {
  id: string;
  event: Partial<AnalyticsEventDto>;
  retryCount: number;
  timestamp: number;
  nextRetry: number;
}

let isProcessing = false;
let retryTimer: NodeJS.Timeout | null = null;

/**
 * Add event to offline queue
 */
export const enqueueEvent = (event: Partial<AnalyticsEventDto>): void => {
  try {
    const queue = getQueue();

    // Check queue size limit
    if (queue.length >= MAX_QUEUE_SIZE) {
      logWarn('[Analytics Queue] Queue full, removing oldest event');
      queue.shift(); // Remove oldest (FIFO)
    }

    const queuedEvent: QueuedEvent = {
      id: generateEventId(),
      event,
      retryCount: 0,
      timestamp: Date.now(),
      nextRetry: Date.now(),
    };

    queue.push(queuedEvent);
    saveQueue(queue);

    logInfo('[Analytics Queue] Event enqueued:', queuedEvent.id);

    // Start processing if not already running
    if (!isProcessing) {
      scheduleProcessing();
    }
  } catch (error) {
    logError('[Analytics Queue] Error enqueueing event:', error);
  }
};

/**
 * Get all queued events
 */
const getQueue = (): QueuedEvent[] => {
  try {
    const queueData = localStorage.getItem(QUEUE_KEY);
    if (!queueData) {
      return [];
    }

    const queue: QueuedEvent[] = JSON.parse(queueData);

    // Filter out expired events
    const now = Date.now();
    const validQueue = queue.filter(
      (event) => now - event.timestamp < EVENT_EXPIRY_MS
    );

    // Save filtered queue if events were removed
    if (validQueue.length !== queue.length) {
      saveQueue(validQueue);
      logInfo(
        `[Analytics Queue] Removed ${queue.length - validQueue.length} expired events`
      );
    }

    return validQueue;
  } catch (error) {
    logError('[Analytics Queue] Error reading queue:', error);
    return [];
  }
};

/**
 * Save queue to localStorage
 */
const saveQueue = (queue: QueuedEvent[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logError('[Analytics Queue] Error saving queue:', error);
  }
};

/**
 * Process queued events
 */
export const processQueue = async (
  sendFunction: (event: Partial<AnalyticsEventDto>) => Promise<boolean>
): Promise<void> => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  logInfo('[Analytics Queue] Processing queue...');

  try {
    const queue = getQueue();
    const now = Date.now();

    // Find events ready for retry
    const eventsToProcess = queue.filter((event) => event.nextRetry <= now);

    if (eventsToProcess.length === 0) {
      logInfo('[Analytics Queue] No events ready for processing');
      isProcessing = false;
      scheduleProcessing();
      return;
    }

    logInfo(
      `[Analytics Queue] Processing ${eventsToProcess.length} events...`
    );

    const successfulIds: string[] = [];
    const failedEvents: QueuedEvent[] = [];

    // Process each event
    for (const queuedEvent of eventsToProcess) {
      try {
        const success = await sendFunction(queuedEvent.event);

        if (success) {
          successfulIds.push(queuedEvent.id);
          logInfo('[Analytics Queue] Event sent successfully:', queuedEvent.id);
        } else {
          // Increment retry count and calculate backoff
          queuedEvent.retryCount++;

          if (queuedEvent.retryCount >= MAX_RETRIES) {
            logWarn(
              `[Analytics Queue] Event ${queuedEvent.id} failed after ${MAX_RETRIES} retries, discarding`
            );
            successfulIds.push(queuedEvent.id); // Remove from queue
          } else {
            // Exponential backoff: 30s, 60s, 120s
            const backoff = RETRY_INTERVAL_MS * Math.pow(2, queuedEvent.retryCount - 1);
            queuedEvent.nextRetry = now + backoff;
            failedEvents.push(queuedEvent);

            logInfo(
              `[Analytics Queue] Event ${queuedEvent.id} retry scheduled for ${new Date(
                queuedEvent.nextRetry
              ).toLocaleTimeString()} (attempt ${queuedEvent.retryCount}/${MAX_RETRIES})`
            );
          }
        }
      } catch (error) {
        logError('[Analytics Queue] Error processing event:', error);
        queuedEvent.retryCount++;

        if (queuedEvent.retryCount < MAX_RETRIES) {
          const backoff = RETRY_INTERVAL_MS * Math.pow(2, queuedEvent.retryCount - 1);
          queuedEvent.nextRetry = now + backoff;
          failedEvents.push(queuedEvent);
        }
      }
    }

    // Update queue: remove successful events, keep failed events with updated retry info
    const updatedQueue = queue
      .filter((event) => !successfulIds.includes(event.id))
      .map((event) => {
        const failedEvent = failedEvents.find((fe) => fe.id === event.id);
        return failedEvent || event;
      });

    saveQueue(updatedQueue);

    logInfo(
      `[Analytics Queue] Processed ${successfulIds.length} successfully, ${failedEvents.length} failed`
    );
  } catch (error) {
    logError('[Analytics Queue] Error processing queue:', error);
  } finally {
    isProcessing = false;
    scheduleProcessing();
  }
};

/**
 * Schedule next queue processing
 */
const scheduleProcessing = (): void => {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }

  const queue = getQueue();
  if (queue.length === 0) {
    return;
  }

  // Find next retry time
  const now = Date.now();
  const nextRetry = Math.min(...queue.map((event) => event.nextRetry));
  const delay = Math.max(0, nextRetry - now);

  logInfo(
    `[Analytics Queue] Next processing scheduled in ${Math.round(delay / 1000)}s`
  );

  retryTimer = setTimeout(() => {
    // Will be called by the service that uses this queue
    logInfo('[Analytics Queue] Retry timer fired, waiting for manual processing');
  }, delay);
};

/**
 * Generate unique event ID
 */
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Get queue size (for debugging)
 */
export const getQueueSize = (): number => {
  return getQueue().length;
};

/**
 * Clear entire queue (for testing/debugging)
 */
export const clearQueue = (): void => {
  try {
    localStorage.removeItem(QUEUE_KEY);
    logInfo('[Analytics Queue] Queue cleared');
  } catch (error) {
    logError('[Analytics Queue] Error clearing queue:', error);
  }
};

export default {
  enqueueEvent,
  processQueue,
  getQueueSize,
  clearQueue,
};

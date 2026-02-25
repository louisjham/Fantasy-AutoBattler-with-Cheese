export type EventCallback = (payload: unknown) => void;

export class EventBus {
  private listeners: Record<string, EventCallback[]> = {};
  private processedEvents: Set<string> = new Set();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, payload: unknown, eventId?: string): void {
    // Prevent infinite passive loops by checking if this specific event instance has been processed
    if (eventId) {
      if (this.processedEvents.has(eventId)) {
        return;
      }
      this.processedEvents.add(eventId);
    }

    if (!this.listeners[event]) return;
    
    // Create a copy of listeners to prevent issues if listeners are added/removed during execution
    const callbacks = [...this.listeners[event]];
    for (const callback of callbacks) {
      callback(payload);
    }
  }

  clearProcessedEvents(): void {
    this.processedEvents.clear();
  }
}

export const globalEventBus = new EventBus();

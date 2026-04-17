import type { StockChangeEvent, StockObserver } from "./types.js";

/**
 * Observer Pattern: Subject emits stock-change events after the DB update.
 */
export class StockSubject {
  private readonly observers: StockObserver[] = [];

  register(observer: StockObserver): void {
    this.observers.push(observer);
  }

  async notify(event: StockChangeEvent): Promise<void> {
    await Promise.all(this.observers.map((o) => o.onStockChange(event)));
  }
}

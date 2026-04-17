export type StockChangeEvent = {
  productId: string;
  productName: string;
  sku: string;
  oldQuantity: number;
  newQuantity: number;
  lowStockThreshold: number;
};

export interface StockObserver {
  onStockChange(event: StockChangeEvent): Promise<void>;
}

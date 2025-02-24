const STOCK_THRESHOLD = 3;

enum StockEventType {
    Sale = 'sale',
    Refill = 'refill',
    LowStockLevel = 'low_stock_level',
    OkStockLevel = 'ok_stock_level'
}

export { STOCK_THRESHOLD, StockEventType }

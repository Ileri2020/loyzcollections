/**
 * FIFO Stock Pricing Utility
 * 
 * This utility calculates the current price of a product based on available stock
 * using First-In-First-Out (FIFO) logic.
 * 
 * Logic:
 * 1. Use the price from the oldest stock with available quantity
 * 2. If all stocks are sold out, use the price from the most recent stock
 * 3. Falls back to product.price if no stock exists
 */

export interface StockItem {
    id: string;
    addedQuantity: number;
    pricePerProduct: number;
    costPerProduct: number;
    createdAt: string | Date;
}

export interface CartItemWithCart {
    quantity: number;
    cart: {
        status: string;
    };
}

export interface ProductWithStock {
    id: string;
    name: string;
    price: number;
    stock?: StockItem[];
    cartItems?: CartItemWithCart[];
}

/**
 * Calculate total available stock quantity
 */
export function getTotalStockQuantity(stocks?: StockItem[]): number {
    if (!stocks || stocks.length === 0) return 1;
    return stocks.reduce((total, stock) => total + (stock.addedQuantity || 0), 0);
}

/**
 * Get confirmed sold quantity
 */
export function getConfirmedSoldQuantity(cartItems?: CartItemWithCart[]): number {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total, item) => {
        const isPaid = item.cart?.status === "paid" || item.cart?.status === "completed";
        return total + (isPaid ? (item.quantity || 0) : 0);
    }, 0);
}

/**
 * Get the current selling price for a product based on FIFO stock logic
 * 
 * @param product - Product with stock array
 * @returns Current selling price
 */
export function getProductPrice(product: ProductWithStock): number {
    // No stock data available, use product.price
    if (!product.stock || product.stock.length === 0) {
        return product.price || 0;
    }

    // Sort stocks by creation date (oldest first) for FIFO
    const sortedStocks = [...product.stock].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
    });

    // Find the first stock with available quantity (oldest stock)
    const availableStock = sortedStocks.find(stock => stock.addedQuantity > 0);

    if (availableStock) {
        // Use price from oldest available stock
        return availableStock.pricePerProduct || product.price || 0;
    }

    // All stocks are sold out, use the most recent stock price
    const mostRecentStock = sortedStocks[sortedStocks.length - 1];
    return mostRecentStock?.pricePerProduct || product.price || 0;
}

/**
 * Get the cost price for a product (for profit calculation)
 */
export function getProductCost(product: ProductWithStock): number {
    if (!product.stock || product.stock.length === 0) {
        return 0;
    }

    const sortedStocks = [...product.stock].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
    });

    const availableStock = sortedStocks.find(stock => stock.addedQuantity > 0);

    if (availableStock) {
        return availableStock.costPerProduct || 0;
    }

    const mostRecentStock = sortedStocks[sortedStocks.length - 1];
    return mostRecentStock?.costPerProduct || 0;
}

/**
 * Check if product is in stock
 */
export function isProductInStock(product: ProductWithStock): boolean {
    const totalStock = getTotalStockQuantity(product.stock || []);
    const totalSold = getConfirmedSoldQuantity(product.cartItems || []);
    return (totalStock - totalSold) > 0;
}

/**
 * Get stock status information
 */
export function getStockStatus(product: ProductWithStock): {
    inStock: boolean;
    quantity: number;
    currentPrice: number;
    currentCost: number;
} {
    const totalStock = getTotalStockQuantity(product.stock || []);
    const totalSold = getConfirmedSoldQuantity(product.cartItems || []);
    const quantity = Math.max(0, totalStock - totalSold);

    return {
        inStock: quantity > 0,
        quantity,
        currentPrice: getProductPrice(product),
        currentCost: getProductCost(product),
    };
}

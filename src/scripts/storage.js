// Storage manager for the Shop POS System using Electron Store

const { ipcRenderer } = require('electron');

class StorageManager {
  constructor() {
    this.cache = new Map();
  }

  // Get data from storage
  async get(key, defaultValue = null) {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const value = await ipcRenderer.invoke('store-get', key);
      const result = value !== undefined ? value : defaultValue;

      // Cache the result
      this.cache.set(key, result);
      return result;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }

  // Set data in storage
  async set(key, value) {
    try {
      await ipcRenderer.invoke('store-set', key, value);
      // Update cache
      this.cache.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  }

  // Delete data from storage
  async delete(key) {
    try {
      await ipcRenderer.invoke('store-delete', key);
      // Remove from cache
      this.cache.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting ${key} from storage:`, error);
      return false;
    }
  }

  // Clear all data
  async clear() {
    try {
      await ipcRenderer.invoke('store-clear');
      // Clear cache
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Product management
  async getProducts() {
    const products = await this.get('products', []);
    return products;
  }

  async setProducts(products) {
    return await this.set('products', products);
  }

  async addProduct(product) {
    const products = await this.getProducts();
    const newProduct = {
      id: Utils.generateId(),
      ...product,
      dateAdded: new Date().toISOString(),
    };
    products.push(newProduct);
    await this.setProducts(products);
    return newProduct;
  }

  async updateProduct(productId, updates) {
    const products = await this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      await this.setProducts(products);
      return products[index];
    }
    return null;
  }

  async deleteProduct(productId) {
    const products = await this.getProducts();
    const filteredProducts = products.filter((p) => p.id !== productId);
    await this.setProducts(filteredProducts);
    return filteredProducts.length < products.length;
  }

  async getProductById(productId) {
    const products = await this.getProducts();
    return products.find((p) => p.id === productId) || null;
  }

  async updateStock(productId, newStock) {
    return await this.updateProduct(productId, { stock: newStock });
  }

  // Sales management
  async getSales() {
    return await this.get('sales', []);
  }

  async setSales(sales) {
    return await this.set('sales', sales);
  }

  async addSale(sale) {
    const sales = await this.getSales();
    const newSale = {
      id: Utils.generateId(),
      receiptNumber: Utils.generateReceiptNumber(),
      ...sale,
      date: new Date().toISOString(),
    };
    sales.push(newSale);
    await this.setSales(sales);

    // Update product stock
    for (const item of sale.items) {
      const product = await this.getProductById(item.productId);
      if (product) {
        await this.updateStock(item.productId, product.stock - item.quantity);
      }
    }

    return newSale;
  }

  async getSalesByDateRange(startDate, endDate) {
    const sales = await this.getSales();
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  async getTodaysSales() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return await this.getSalesByDateRange(startOfDay, endOfDay);
  }

  // Customer management
  async getCustomers() {
    return await this.get('customers', []);
  }

  async setCustomers(customers) {
    return await this.set('customers', customers);
  }

  async addCustomer(customer) {
    const customers = await this.getCustomers();
    const newCustomer = {
      id: Utils.generateId(),
      ...customer,
      dateAdded: new Date().toISOString(),
      totalPurchases: 0,
      totalSpent: 0,
    };
    customers.push(newCustomer);
    await this.setCustomers(customers);
    return newCustomer;
  }

  async updateCustomer(customerId, updates) {
    const customers = await this.getCustomers();
    const index = customers.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      await this.setCustomers(customers);
      return customers[index];
    }
    return null;
  }

  async deleteCustomer(customerId) {
    const customers = await this.getCustomers();
    const filteredCustomers = customers.filter((c) => c.id !== customerId);
    await this.setCustomers(filteredCustomers);
    return filteredCustomers.length < customers.length;
  }

  // Settings management
  async getSettings() {
    return await this.get('settings', {
      shopName: 'My Shop',
      shopAddress: '123 Main Street, City, State',
      shopPhone: '+1 234 567 8900',
      taxRate: 0,
      enableQRPayment: true,
      qrPaymentInstructions: 'Scan QR code to pay with your mobile wallet',
      currency: 'USD',
      theme: 'light',
    });
  }

  async setSettings(settings) {
    return await this.set('settings', settings);
  }

  async updateSettings(updates) {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    await this.setSettings(newSettings);

    // Clear cache to ensure fresh data
    this.clearCache();

    // Dispatch event to notify other components
    document.dispatchEvent(
      new CustomEvent('storageUpdated', {
        detail: { key: 'settings', data: newSettings },
      }),
    );

    return newSettings;
  }

  // Analytics data
  async getAnalytics() {
    const sales = await this.getSales();
    const products = await this.getProducts();
    const customers = await this.getCustomers();

    // Calculate basic analytics
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Today's analytics
    const todaysSales = await this.getTodaysSales();
    const todayTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

    // Top selling products
    const productSales = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            quantity: 0,
            revenue: 0,
            productName: item.name,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Low stock products
    const lowStockProducts = products.filter((product) => product.stock <= 10);

    return {
      totalSales,
      totalTransactions,
      averageSale,
      todayTotal,
      todayTransactions: todaysSales.length,
      topProducts,
      lowStockProducts,
      totalProducts: products.length,
      totalCustomers: customers.length,
    };
  }

  // Export/Import functionality
  async exportData() {
    try {
      const data = {
        products: await this.getProducts(),
        sales: await this.getSales(),
        customers: await this.getCustomers(),
        settings: await this.getSettings(),
        exportDate: new Date().toISOString(),
      };

      const dataString = JSON.stringify(data, null, 2);
      const filename = `shop-data-backup-${new Date().toISOString().split('T')[0]}.json`;

      const result = await ipcRenderer.invoke('save-file', filename, dataString);
      if (result.success) {
        Utils.showNotification('Data exported successfully', 'success');
        return result.path;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Utils.showNotification('Export failed: ' + error.message, 'error');
      return null;
    }
  }

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (data.products) await this.setProducts(data.products);
      if (data.sales) await this.setSales(data.sales);
      if (data.customers) await this.setCustomers(data.customers);
      if (data.settings) await this.setSettings(data.settings);

      // Clear cache to force refresh
      this.cache.clear();

      Utils.showNotification('Data imported successfully', 'success');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      Utils.showNotification('Import failed: ' + error.message, 'error');
      return false;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create global storage instance
const Storage = new StorageManager();
window.Storage = Storage;

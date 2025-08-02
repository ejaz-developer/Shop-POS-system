// Main application controller for the Shop POS System

class App {
  constructor() {
    this.currentPage = 'pos';
    this.managers = {};

    this.init();
  }

  async init() {
    try {
      // Initialize utilities
      Utils.initializeClock();
      Utils.initializeModals();

      // Setup navigation
      this.setupNavigation();

      // Setup global event listeners
      this.setupGlobalEventListeners();

      // Initialize all managers
      await this.initializeManagers();

      // Show initial page
      this.showPage('pos');

      // Setup auto-save and periodic tasks
      this.setupPeriodicTasks();

      console.log('Shop POS System initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      Utils.showNotification('Error initializing application', 'error');
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const page = item.dataset.page;
        if (page) {
          this.showPage(page);
        }
      });
    });
  }

  showPage(pageId) {
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // Update page visibility
    const pages = document.querySelectorAll('.page');
    pages.forEach((page) => {
      page.classList.toggle('active', page.id === `${pageId}-page`);
    });

    this.currentPage = pageId;

    // Trigger page-specific initialization
    this.onPageChange(pageId);
  }

  onPageChange(pageId) {
    switch (pageId) {
      case 'pos':
        // Refresh product grid for POS
        if (this.managers.products) {
          this.managers.products.renderProducts();
        }
        break;

      case 'inventory':
        // Refresh inventory table
        if (this.managers.inventory) {
          this.managers.inventory.renderInventoryTable();
        }
        break;

      case 'products':
        // Refresh products list
        if (this.managers.products) {
          this.managers.products.renderProductsList();
        }
        break;

      case 'sales':
        // Refresh sales data and chart
        if (this.managers.sales) {
          this.managers.sales.renderSalesData();
          this.managers.sales.updateChart();
        }
        break;

      case 'customers':
        // Refresh customers list
        if (this.managers.customers) {
          this.managers.customers.renderCustomers();
        }
        break;

      case 'settings':
        // Refresh settings form
        if (this.managers.settings) {
          this.managers.settings.populateSettingsForm();
        }
        break;
    }
  }

  async initializeManagers() {
    // Store references to managers for easy access
    this.managers = {
      storage: window.Storage,
      products: window.ProductManager,
      pos: window.POSManager,
      inventory: window.InventoryManager,
      sales: window.SalesManager,
      customers: window.CustomerManager,
      settings: window.SettingsManager,
    };

    // Wait for all managers to be ready
    await this.waitForManagersReady();
  }

  async waitForManagersReady() {
    // Simple check to ensure all managers are initialized
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const allReady = Object.values(this.managers).every((manager) => manager !== undefined);

      if (allReady) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    console.warn('Some managers may not be fully initialized');
  }

  setupGlobalEventListeners() {
    // Listen for menu events from main process
    if (window.ipcRenderer) {
      window.ipcRenderer.on('menu-add-product', () => {
        this.showPage('products');
        if (this.managers.products) {
          this.managers.products.openAddProductModal();
        }
      });

      window.ipcRenderer.on('menu-manage-inventory', () => {
        this.showPage('inventory');
      });

      window.ipcRenderer.on('menu-daily-sales', () => {
        this.showPage('sales');
      });

      window.ipcRenderer.on('menu-inventory-report', () => {
        this.showPage('inventory');
        if (this.managers.inventory) {
          this.managers.inventory.exportInventoryReport();
        }
      });
    }

    // Listen for settings updates
    document.addEventListener('settingsUpdated', (event) => {
      const newSettings = event.detail;

      // Update POS manager with new settings
      if (this.managers.pos) {
        this.managers.pos.settings = newSettings;
      }

      // Update other components as needed
      this.onSettingsChanged(newSettings);
    });

    // Listen for data restoration
    document.addEventListener('dataRestored', () => {
      this.refreshAllData();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle window beforeunload
    window.addEventListener('beforeunload', (e) => {
      this.onBeforeUnload(e);
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      Utils.showNotification('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      Utils.showNotification('Working offline', 'info');
    });
  }

  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      switch (e.key) {
        case 'n': // New sale
          e.preventDefault();
          this.showPage('pos');
          if (this.managers.pos) {
            this.managers.pos.clearCart();
          }
          break;

        case 'p': // Print receipt
          e.preventDefault();
          if (this.managers.pos) {
            this.managers.pos.showLastReceipt();
          }
          break;

        case 's': // Save (not used but prevent browser save)
          e.preventDefault();
          break;

        case '1': // Go to POS
          e.preventDefault();
          this.showPage('pos');
          break;

        case '2': // Go to Inventory
          e.preventDefault();
          this.showPage('inventory');
          break;

        case '3': // Go to Products
          e.preventDefault();
          this.showPage('products');
          break;

        case '4': // Go to Sales
          e.preventDefault();
          this.showPage('sales');
          break;

        case '5': // Go to Customers
          e.preventDefault();
          this.showPage('customers');
          break;

        case '6': // Go to Settings
          e.preventDefault();
          this.showPage('settings');
          break;
      }
    }
  }

  onSettingsChanged(newSettings) {
    // Update document title
    if (newSettings.shopName) {
      document.title = `${newSettings.shopName} - POS System`;
    }

    // Apply theme if changed
    if (newSettings.theme) {
      document.body.className =
        document.body.className.replace(/theme-\w+/, '') + ` theme-${newSettings.theme}`;
    }

    // Update currency format if needed
    // (This would require updating the Utils.formatCurrency function)
  }

  async refreshAllData() {
    try {
      // Clear storage cache
      if (this.managers.storage) {
        this.managers.storage.clearCache();
      }

      // Refresh all managers
      const refreshPromises = [];

      if (this.managers.products) {
        refreshPromises.push(this.managers.products.refreshProducts());
      }

      if (this.managers.inventory) {
        refreshPromises.push(this.managers.inventory.refreshInventory());
      }

      if (this.managers.sales) {
        refreshPromises.push(this.managers.sales.refreshSales());
      }

      if (this.managers.customers) {
        refreshPromises.push(this.managers.customers.refreshCustomers());
      }

      if (this.managers.settings) {
        refreshPromises.push(this.managers.settings.loadSettings());
      }

      await Promise.all(refreshPromises);

      // Refresh current page
      this.onPageChange(this.currentPage);

      Utils.showNotification('All data refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      Utils.showNotification('Error refreshing data', 'error');
    }
  }

  setupPeriodicTasks() {
    // Auto-save interval (every 5 minutes)
    setInterval(() => {
      this.autoSave();
    }, 5 * 60 * 1000);

    // Update customer statistics daily
    setInterval(() => {
      this.updateCustomerStatistics();
    }, 24 * 60 * 60 * 1000);

    // Check for low stock daily
    setInterval(() => {
      this.checkLowStock();
    }, 24 * 60 * 60 * 1000);
  }

  async autoSave() {
    try {
      // This is mostly handled by electron-store automatically
      // But we can use this for any additional backup logic
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  async updateCustomerStatistics() {
    try {
      if (this.managers.customers) {
        await this.managers.customers.updateCustomerStats();
      }
    } catch (error) {
      console.error('Error updating customer statistics:', error);
    }
  }

  async checkLowStock() {
    try {
      if (this.managers.inventory) {
        const lowStockProducts = this.managers.inventory.getLowStockProducts();
        const outOfStockProducts = this.managers.inventory.getOutOfStockProducts();

        if (outOfStockProducts.length > 0) {
          Utils.showNotification(
            `${outOfStockProducts.length} products are out of stock!`,
            'error',
          );
        }

        if (lowStockProducts.length > 0) {
          Utils.showNotification(`${lowStockProducts.length} products are low on stock`, 'info');
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }

  onBeforeUnload(e) {
    // Check if there are unsaved changes (like items in cart)
    if (this.managers.pos && this.managers.pos.getCart().length > 0) {
      e.preventDefault();
      e.returnValue = 'You have items in your cart. Are you sure you want to close?';
      return e.returnValue;
    }
  }

  // Public API methods
  async exportAllData() {
    try {
      if (this.managers.storage) {
        await this.managers.storage.exportData();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Utils.showNotification('Error exporting data', 'error');
    }
  }

  async importData(jsonString) {
    try {
      if (this.managers.storage) {
        const success = await this.managers.storage.importData(jsonString);
        if (success) {
          await this.refreshAllData();
        }
        return success;
      }
    } catch (error) {
      console.error('Error importing data:', error);
      Utils.showNotification('Error importing data', 'error');
      return false;
    }
  }

  getSystemInfo() {
    return {
      version: '1.0.0',
      currentPage: this.currentPage,
      managersLoaded: Object.keys(this.managers).length,
      online: navigator.onLine,
      timestamp: new Date().toISOString(),
    };
  }

  // Diagnostic methods
  async runDiagnostics() {
    const diagnostics = {
      storage: false,
      managers: false,
      data: false,
    };

    try {
      // Test storage
      await this.managers.storage.get('test');
      diagnostics.storage = true;

      // Test managers
      diagnostics.managers = Object.values(this.managers).every((m) => m !== undefined);

      // Test data integrity
      const products = await this.managers.storage.getProducts();
      const sales = await this.managers.storage.getSales();
      diagnostics.data = Array.isArray(products) && Array.isArray(sales);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    }

    return diagnostics;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.App = new App();
});

// Make App available globally for debugging
window.ShopPOS = {
  version: '1.0.0',
  Utils,
  Storage,
  ProductManager,
  POSManager,
  InventoryManager,
  SalesManager,
  CustomerManager,
  SettingsManager,
};

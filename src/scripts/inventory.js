// Inventory management for the Shop POS System

class InventoryManager {
  constructor() {
    this.products = [];
    this.lowStockThreshold = 10;

    this.init();
  }

  async init() {
    await this.loadProducts();
    this.setupEventListeners();
    this.renderInventoryTable();
  }

  async loadProducts() {
    try {
      this.products = await Storage.getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      Utils.showNotification('Error loading inventory', 'error');
    }
  }

  setupEventListeners() {
    // Listen for product updates from other modules
    document.addEventListener('productsUpdated', () => {
      this.loadProducts();
      this.renderInventoryTable();
    });
  }

  renderInventoryTable() {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;

    if (this.products.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-box-open" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px; display: block;"></i>
                        No products in inventory
                        <br><small>Add products to start managing inventory</small>
                    </td>
                </tr>
            `;
      return;
    }

    // Sort products by stock status (low stock first)
    const sortedProducts = [...this.products].sort((a, b) => {
      const aStatus = Utils.getStockStatus(a.stock);
      const bStatus = Utils.getStockStatus(b.stock);

      if (aStatus === 'out-of-stock' && bStatus !== 'out-of-stock') return -1;
      if (bStatus === 'out-of-stock' && aStatus !== 'out-of-stock') return 1;
      if (aStatus === 'low-stock' && bStatus === 'in-stock') return -1;
      if (bStatus === 'low-stock' && aStatus === 'in-stock') return 1;

      return 0;
    });

    tableBody.innerHTML = sortedProducts
      .map((product) => {
        const stockStatus = Utils.getStockStatus(product.stock);
        const statusText = stockStatus.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        return `
                <tr class="${
                  stockStatus === 'out-of-stock'
                    ? 'table-row-danger'
                    : stockStatus === 'low-stock'
                    ? 'table-row-warning'
                    : ''
                }">
                    <td>
                        <div class="product-image-small">
                            <i class="${Utils.getCategoryIcon(product.category)}"></i>
                        </div>
                    </td>
                    <td>
                        <div class="product-info-cell">
                            <strong>${product.name}</strong>
                            ${
                              product.barcode
                                ? `<br><small class="text-muted">Barcode: ${product.barcode}</small>`
                                : ''
                            }
                            ${
                              product.description
                                ? `<br><small class="text-muted">${product.description.substring(
                                    0,
                                    50,
                                  )}${product.description.length > 50 ? '...' : ''}</small>`
                                : ''
                            }
                        </div>
                    </td>
                    <td>
                        <span class="category-tag category-${product.category}">
                            ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </span>
                    </td>
                    <td class="price-cell">${Utils.formatCurrency(product.price)}</td>
                    <td class="stock-cell">
                        <div class="stock-controls">
                            <button class="stock-btn decrease" onclick="window.InventoryManager.adjustStock('${
                              product.id
                            }', -1)" ${product.stock <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="stock-value">${product.stock}</span>
                            <button class="stock-btn increase" onclick="window.InventoryManager.adjustStock('${
                              product.id
                            }', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${stockStatus}">
                            ${statusText}
                        </span>
                        ${
                          stockStatus === 'low-stock'
                            ? '<i class="fas fa-exclamation-triangle text-warning ml-1" title="Low stock warning"></i>'
                            : ''
                        }
                        ${
                          stockStatus === 'out-of-stock'
                            ? '<i class="fas fa-exclamation-circle text-danger ml-1" title="Out of stock"></i>'
                            : ''
                        }
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="window.InventoryManager.editProduct('${
                              product.id
                            }')" title="Edit Product">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn restock" onclick="window.InventoryManager.restockProduct('${
                              product.id
                            }')" title="Restock">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <button class="action-btn delete" onclick="window.InventoryManager.deleteProduct('${
                              product.id
                            }')" title="Delete Product">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join('');

    // Add CSS styles for inventory table if not already added
    this.addInventoryStyles();
  }

  addInventoryStyles() {
    if (document.querySelector('#inventory-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'inventory-styles';
    styles.textContent = `
            .table-row-danger { background-color: #fee; }
            .table-row-warning { background-color: #fffbe6; }
            .category-tag {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .category-electronics { background: #e3f2fd; color: #1976d2; }
            .category-clothing { background: #f3e5f5; color: #7b1fa2; }
            .category-food { background: #e8f5e8; color: #388e3c; }
            .category-books { background: #fff3e0; color: #f57c00; }
            .category-other { background: #f5f5f5; color: #616161; }

            .stock-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            }
            .stock-btn {
                width: 24px;
                height: 24px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                transition: all 0.2s;
            }
            .stock-btn:hover:not(:disabled) {
                background: #f8f9fa;
                border-color: #3498db;
            }
            .stock-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .stock-btn.decrease:hover:not(:disabled) { border-color: #e74c3c; }
            .stock-btn.increase:hover:not(:disabled) { border-color: #27ae60; }
            .stock-value {
                min-width: 30px;
                text-align: center;
                font-weight: 600;
            }
            .action-buttons {
                display: flex;
                gap: 4px;
                justify-content: center;
            }
            .action-btn {
                padding: 6px 8px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            .action-btn.edit { background: #f39c12; color: white; }
            .action-btn.restock { background: #27ae60; color: white; }
            .action-btn.delete { background: #e74c3c; color: white; }
            .action-btn:hover { transform: translateY(-1px); opacity: 0.9; }
            .text-warning { color: #f39c12; }
            .text-danger { color: #e74c3c; }
            .text-muted { color: #6c757d; }
            .ml-1 { margin-left: 4px; }
        `;
    document.head.appendChild(styles);
  }

  async adjustStock(productId, adjustment) {
    try {
      const product = await Storage.getProductById(productId);
      if (!product) return;

      const newStock = Math.max(0, product.stock + adjustment);
      await Storage.updateStock(productId, newStock);

      // Update local data
      const productIndex = this.products.findIndex((p) => p.id === productId);
      if (productIndex !== -1) {
        this.products[productIndex].stock = newStock;
      }

      this.renderInventoryTable();

      const actionText = adjustment > 0 ? 'increased' : 'decreased';
      Utils.showNotification(`Stock ${actionText} for ${product.name}`, 'success');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      Utils.showNotification('Error adjusting stock', 'error');
    }
  }

  async restockProduct(productId) {
    const product = await Storage.getProductById(productId);
    if (!product) return;

    const restockAmount = prompt(
      `How many units of "${product.name}" would you like to add to stock?\nCurrent stock: ${product.stock}`,
      '10',
    );

    if (restockAmount === null) return; // User cancelled

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      Utils.showNotification('Please enter a valid positive number', 'error');
      return;
    }

    try {
      const newStock = product.stock + amount;
      await Storage.updateStock(productId, newStock);

      // Update local data
      const productIndex = this.products.findIndex((p) => p.id === productId);
      if (productIndex !== -1) {
        this.products[productIndex].stock = newStock;
      }

      this.renderInventoryTable();
      Utils.showNotification(
        `Added ${amount} units to ${product.name}. New stock: ${newStock}`,
        'success',
      );
    } catch (error) {
      console.error('Error restocking product:', error);
      Utils.showNotification('Error restocking product', 'error');
    }
  }

  async editProduct(productId) {
    // Delegate to ProductManager
    if (window.ProductManager) {
      window.ProductManager.editProduct(productId);
    }
  }

  async deleteProduct(productId) {
    const product = await Storage.getProductById(productId);
    if (!product) return;

    const confirmMessage = `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone and will remove the product from all future sales.`;

    if (confirm(confirmMessage)) {
      try {
        await Storage.deleteProduct(productId);

        // Update local data
        this.products = this.products.filter((p) => p.id !== productId);

        this.renderInventoryTable();
        Utils.showNotification(`${product.name} deleted successfully`, 'success');

        // Refresh other components
        if (window.ProductManager) {
          window.ProductManager.refreshProducts();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        Utils.showNotification('Error deleting product', 'error');
      }
    }
  }

  getLowStockProducts() {
    return this.products.filter(
      (product) => product.stock <= this.lowStockThreshold && product.stock > 0,
    );
  }

  getOutOfStockProducts() {
    return this.products.filter((product) => product.stock === 0);
  }

  getInventorySummary() {
    const totalProducts = this.products.length;
    const totalValue = this.products.reduce(
      (sum, product) => sum + product.price * product.stock,
      0,
    );
    const lowStockCount = this.getLowStockProducts().length;
    const outOfStockCount = this.getOutOfStockProducts().length;
    const totalUnits = this.products.reduce((sum, product) => sum + product.stock, 0);

    return {
      totalProducts,
      totalValue,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inStockCount: totalProducts - outOfStockCount,
    };
  }

  generateInventoryReport() {
    const summary = this.getInventorySummary();
    const lowStockProducts = this.getLowStockProducts();
    const outOfStockProducts = this.getOutOfStockProducts();

    const reportData = {
      summary,
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.name,
        category: p.category,
        stock: p.stock,
        price: p.price,
        value: p.price * p.stock,
      })),
      outOfStockProducts: outOfStockProducts.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price,
      })),
      allProducts: this.products.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        value: p.price * p.stock,
        status: Utils.getStockStatus(p.stock),
      })),
    };

    return reportData;
  }

  exportInventoryReport() {
    const reportData = this.generateInventoryReport();
    const filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;

    Utils.exportToCSV(reportData.allProducts, filename);
  }

  // Public methods for external access
  async refreshInventory() {
    await this.loadProducts();
    this.renderInventoryTable();
  }

  getProducts() {
    return this.products;
  }
}

// Create global inventory manager instance
const inventoryManager = new InventoryManager();
window.InventoryManager = inventoryManager;

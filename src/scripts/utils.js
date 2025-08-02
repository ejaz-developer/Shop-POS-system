// Utility functions for the Shop POS System

const Utils = {
  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  // Format date
  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  },

  // Format time
  formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Generate receipt number
  generateReceiptNumber() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `R${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date
      .getDate()
      .toString()
      .padStart(2, '0')}-${timestamp}`;
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show notification
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${
                  type === 'success'
                    ? 'check-circle'
                    : type === 'error'
                    ? 'exclamation-circle'
                    : 'info-circle'
                }"></i>
                <span>${message}</span>
            </div>
        `;

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                }
                .notification-success { background: #27ae60; }
                .notification-error { background: #e74c3c; }
                .notification-info { background: #3498db; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
      document.head.appendChild(styles);
    }

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  },

  // Validate product data
  validateProduct(product) {
    const errors = [];

    if (!product.name || product.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters long');
    }

    if (!product.category) {
      errors.push('Please select a category');
    }

    if (!product.price || product.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!product.stock || product.stock < 0) {
      errors.push('Stock must be 0 or greater');
    }

    return errors;
  },

  // Calculate stock status
  getStockStatus(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 10) return 'low-stock';
    return 'in-stock';
  },

  // Search products
  searchProducts(products, query) {
    if (!query) return products;

    const lowercaseQuery = query.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery) ||
        (product.barcode && product.barcode.includes(query)),
    );
  },

  // Filter products by category
  filterProductsByCategory(products, category) {
    if (category === 'all') return products;
    return products.filter((product) => product.category === category);
  },

  // Calculate cart totals
  calculateCartTotals(cart, taxRate = 0) {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * (taxRate || 0);
    const total = subtotal + tax;

    return {
      subtotal: subtotal,
      tax: tax,
      total: total,
    };
  },

  // Print receipt
  async printReceipt() {
    try {
      await window.print();
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  },

  // Export data to CSV
  exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      Utils.showNotification('No data to export', 'error');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Generate random product data for demo
  generateDemoProducts() {
    const categories = ['electronics', 'clothing', 'food', 'books'];
    const products = [];

    const sampleProducts = [
      { name: 'Laptop Computer', category: 'electronics', price: 899.99, stock: 15 },
      { name: 'Wireless Mouse', category: 'electronics', price: 29.99, stock: 50 },
      { name: 'T-Shirt', category: 'clothing', price: 19.99, stock: 25 },
      { name: 'Jeans', category: 'clothing', price: 49.99, stock: 30 },
      { name: 'Coffee Beans', category: 'food', price: 12.99, stock: 40 },
      { name: 'Chocolate Bar', category: 'food', price: 3.99, stock: 60 },
      { name: 'Programming Book', category: 'books', price: 39.99, stock: 20 },
      { name: 'Novel', category: 'books', price: 14.99, stock: 35 },
    ];

    sampleProducts.forEach((product) => {
      products.push({
        id: Utils.generateId(),
        ...product,
        barcode: Math.random().toString().slice(2, 15),
        description: `High quality ${product.name.toLowerCase()}`,
        dateAdded: new Date().toISOString(),
      });
    });

    return products;
  },

  // Get category icon
  getCategoryIcon(category) {
    const icons = {
      electronics: 'fas fa-laptop',
      clothing: 'fas fa-tshirt',
      food: 'fas fa-apple-alt',
      books: 'fas fa-book',
      other: 'fas fa-box',
    };
    return icons[category] || icons.other;
  },

  // Update clock
  updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');

    if (timeElement) {
      timeElement.textContent = Utils.formatTime(now);
    }

    if (dateElement) {
      dateElement.textContent = Utils.formatDate(now);
    }
  },

  // Initialize clock
  initializeClock() {
    Utils.updateClock();
    setInterval(Utils.updateClock, 1000);
  },

  // Handle modal operations
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  },

  // Initialize modal event listeners
  initializeModals() {
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });

    // Close modal when pressing Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach((modal) => {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        });
      }
    });
  },

  // Escape CSV field
  escapeCSV(field) {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },
};

// Make Utils available globally
window.Utils = Utils;

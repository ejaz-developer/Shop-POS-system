// Point of Sale system for the Shop POS System

class POSManager {
  constructor() {
    this.cart = [];
    this.paymentMethod = 'cash';
    this.settings = null;
    this.selectedCustomer = null;
    this.customers = [];

    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadCustomers();
    this.setupEventListeners();
    this.updateCartDisplay();
    this.populateCustomerSelect();

    // Listen for customer updates from other modules
    window.addEventListener('customerAdded', () => {
      this.refreshCustomers();
    });

    window.addEventListener('customerUpdated', () => {
      this.refreshCustomers();
    });
  }

  async loadSettings() {
    try {
      this.settings = await Storage.getSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadCustomers() {
    try {
      this.customers = await Storage.getCustomers();
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  setupEventListeners() {
    // Clear cart button
    const clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => this.clearCart());
    }

    // Payment method buttons
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        paymentBtns.forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
        this.paymentMethod = e.target.dataset.method;
        this.toggleCashInput();
      });
    });

    // Process payment button
    const processPaymentBtn = document.getElementById('processPayment');
    if (processPaymentBtn) {
      processPaymentBtn.addEventListener('click', () => this.processPayment());
    }

    // Cash amount input
    const cashAmountInput = document.getElementById('cashAmount');
    if (cashAmountInput) {
      cashAmountInput.addEventListener('input', () => this.updateChangeAmount());
    }

    // Customer selection
    const customerSelect = document.getElementById('customerSelect');
    const addNewCustomerBtn = document.getElementById('addNewCustomerFromPOS');
    const removeCustomerBtn = document.getElementById('removeCustomer');

    if (customerSelect) {
      customerSelect.addEventListener('change', (e) => {
        this.selectCustomer(e.target.value);
      });
    }

    if (addNewCustomerBtn) {
      addNewCustomerBtn.addEventListener('click', () => {
        if (window.CustomerManager) {
          window.CustomerManager.openAddCustomerModal();
        }
      });
    }

    if (removeCustomerBtn) {
      removeCustomerBtn.addEventListener('click', () => {
        this.selectCustomer('');
      });
    }

    // Receipt modal buttons
    const printReceiptBtn = document.getElementById('printReceipt');
    const generateQRBtn = document.getElementById('generateQR');
    const closeReceiptModal = document.getElementById('closeReceiptModal');

    if (printReceiptBtn) {
      printReceiptBtn.addEventListener('click', () => this.printReceipt());
    }

    if (generateQRBtn) {
      generateQRBtn.addEventListener('click', () => this.generateQRCode());
    }

    if (closeReceiptModal) {
      closeReceiptModal.addEventListener('click', () => Utils.closeModal('receiptModal'));
    }

    // Menu events from main process
    if (window.ipcRenderer) {
      window.ipcRenderer.on('menu-new-sale', () => this.clearCart());
      window.ipcRenderer.on('menu-print-receipt', () => this.showLastReceipt());
    }
  }

  addProductToCart(product) {
    const existingItem = this.cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity += 1;
        Utils.showNotification(`Added another ${product.name} to cart`, 'success');
      } else {
        Utils.showNotification('Not enough stock available', 'error');
        return;
      }
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
      });
      Utils.showNotification(`${product.name} added to cart`, 'success');
    }

    this.updateCartDisplay();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter((item) => item.productId !== productId);
    this.updateCartDisplay();
    Utils.showNotification('Item removed from cart', 'success');
  }

  updateQuantity(productId, newQuantity) {
    const item = this.cart.find((item) => item.productId === productId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = newQuantity;
        this.updateCartDisplay();
      }
    }
  }

  clearCart() {
    this.cart = [];
    this.updateCartDisplay();
    Utils.showNotification('Cart cleared', 'info');
  }

  populateCustomerSelect() {
    const customerSelect = document.getElementById('customerSelect');
    if (!customerSelect) return;

    // Clear existing options except the first one
    customerSelect.innerHTML = '<option value="">Select Customer</option>';

    // Add customer options
    this.customers.forEach((customer) => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = `${customer.name}${customer.email ? ` (${customer.email})` : ''}`;
      customerSelect.appendChild(option);
    });
  }

  selectCustomer(customerId) {
    const customerSelect = document.getElementById('customerSelect');
    const customerInfo = document.getElementById('selectedCustomerInfo');

    if (!customerId) {
      this.selectedCustomer = null;
      if (customerSelect) customerSelect.value = '';
      if (customerInfo) customerInfo.style.display = 'none';
      return;
    }

    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return;

    this.selectedCustomer = customer;

    if (customerSelect) customerSelect.value = customerId;

    if (customerInfo) {
      const nameEl = customerInfo.querySelector('.customer-name');
      const statsEl = customerInfo.querySelector('.customer-stats');

      if (nameEl) nameEl.textContent = customer.name;
      if (statsEl) {
        statsEl.textContent = `${customer.totalPurchases || 0} purchases • ${Utils.formatCurrency(
          customer.totalSpent || 0,
        )} spent`;
      }

      customerInfo.style.display = 'block';
    }

    Utils.showNotification(`Customer ${customer.name} selected`, 'success');
  }

  async refreshCustomers() {
    await this.loadCustomers();
    this.populateCustomerSelect();

    // Reset selected customer if they no longer exist
    if (this.selectedCustomer) {
      const stillExists = this.customers.find((c) => c.id === this.selectedCustomer.id);
      if (!stillExists) {
        this.selectCustomer('');
      }
    }
  }

  updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (!cartItems) return;

    // Render cart items
    if (this.cart.length === 0) {
      cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>Cart is empty</p>
                    <p>Add products to start a sale</p>
                </div>
            `;
    } else {
      cartItems.innerHTML = this.cart
        .map(
          (item) => `
                <div class="cart-item" data-product-id="${item.productId}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${Utils.formatCurrency(item.price)} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="window.POSManager.updateQuantity('${
                          item.productId
                        }', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="window.POSManager.updateQuantity('${
                          item.productId
                        }', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <div class="cart-item-total">${Utils.formatCurrency(
                          item.price * item.quantity,
                        )}</div>
                        <button class="remove-item" onclick="window.POSManager.removeFromCart('${
                          item.productId
                        }')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `,
        )
        .join('');
    }

    // Calculate and display totals
    const totals = Utils.calculateCartTotals(this.cart, this.settings?.taxRate || 0);

    if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(totals.subtotal);
    if (taxEl) taxEl.textContent = Utils.formatCurrency(totals.tax);
    if (totalEl) totalEl.textContent = Utils.formatCurrency(totals.total);

    // Update tax label
    const taxLabel = document.getElementById('taxLabel');
    if (taxLabel) {
      const taxRate = this.settings?.taxRate || 0;
      if (taxRate > 0) {
        taxLabel.textContent = `Tax (${(taxRate * 100).toFixed(1)}%):`;
      } else {
        taxLabel.textContent = 'Tax:';
      }
    } // Update change amount if cash payment
    this.updateChangeAmount();

    // Add scroll detection for cart items
    this.setupCartScrollDetection();
  }

  setupCartScrollDetection() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    // Remove existing scroll listener
    cartItems.removeEventListener('scroll', this.handleCartScroll);

    // Add scroll listener
    this.handleCartScroll = () => {
      if (cartItems.scrollTop > 10) {
        cartItems.classList.add('scrolled');
      } else {
        cartItems.classList.remove('scrolled');
      }
    };

    cartItems.addEventListener('scroll', this.handleCartScroll);

    // Initial check
    setTimeout(() => {
      if (cartItems.scrollHeight > cartItems.clientHeight) {
        cartItems.classList.add('scrollable');
      } else {
        cartItems.classList.remove('scrollable');
      }
    }, 100);
  }

  toggleCashInput() {
    const cashInput = document.getElementById('cashInput');
    if (cashInput) {
      cashInput.style.display = this.paymentMethod === 'cash' ? 'block' : 'none';
    }
  }

  updateChangeAmount() {
    if (this.paymentMethod !== 'cash') return;

    const cashAmountInput = document.getElementById('cashAmount');
    const totalEl = document.getElementById('total');

    if (!cashAmountInput || !totalEl) return;

    const cashAmount = parseFloat(cashAmountInput.value) || 0;
    const total = Utils.calculateCartTotals(this.cart, this.settings?.taxRate || 0).total;
    const change = cashAmount - total;

    // Update or create change display
    let changeDisplay = document.querySelector('.change-display');
    if (!changeDisplay) {
      changeDisplay = document.createElement('div');
      changeDisplay.className = 'change-display';
      cashAmountInput.parentNode.appendChild(changeDisplay);
    }

    if (cashAmount > 0) {
      if (change >= 0) {
        changeDisplay.innerHTML = `<span style="color: #27ae60;">Change: ${Utils.formatCurrency(
          change,
        )}</span>`;
      } else {
        changeDisplay.innerHTML = `<span style="color: #e74c3c;">Insufficient amount: ${Utils.formatCurrency(
          -change,
        )} short</span>`;
      }
    } else {
      changeDisplay.innerHTML = '';
    }
  }

  async processPayment() {
    if (this.cart.length === 0) {
      Utils.showNotification('Cart is empty', 'error');
      return;
    }

    const totals = Utils.calculateCartTotals(this.cart, this.settings?.taxRate || 0);

    // Validate payment for cash
    if (this.paymentMethod === 'cash') {
      const cashAmountInput = document.getElementById('cashAmount');
      const cashAmount = parseFloat(cashAmountInput?.value) || 0;

      if (cashAmount < totals.total) {
        Utils.showNotification('Insufficient cash amount', 'error');
        return;
      }
    }

    try {
      // Create sale record
      const sale = {
        items: [...this.cart],
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: this.paymentMethod,
        cashReceived:
          this.paymentMethod === 'cash'
            ? parseFloat(document.getElementById('cashAmount')?.value) || 0
            : null,
        change:
          this.paymentMethod === 'cash'
            ? (parseFloat(document.getElementById('cashAmount')?.value) || 0) - totals.total
            : 0,
        customerId: this.selectedCustomer?.id || null,
        customerName: this.selectedCustomer?.name || null,
      };

      // Save sale to storage
      const savedSale = await Storage.addSale(sale);

      // Update customer statistics if customer was selected
      if (this.selectedCustomer) {
        await this.updateCustomerStats(this.selectedCustomer.id, totals.total);
      }

      // Notify that a new sale was added
      document.dispatchEvent(
        new CustomEvent('saleAdded', {
          detail: savedSale,
        }),
      );

      // Show receipt
      this.showReceipt(savedSale);

      // If QR payment method, automatically generate QR code
      if (this.paymentMethod === 'qr') {
        setTimeout(() => {
          this.generateQRCode();
        }, 500); // Small delay to ensure modal is open
      }

      // Clear cart
      this.clearCart();

      // Clear cash input
      const cashAmountInput = document.getElementById('cashAmount');
      if (cashAmountInput) cashAmountInput.value = '';

      Utils.showNotification('Payment processed successfully', 'success');
    } catch (error) {
      console.error('Error processing payment:', error);
      Utils.showNotification('Error processing payment', 'error');
    }
  }

  showReceipt(sale) {
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;

    const settings = this.settings || {};
    const receiptHTML = `
            <div class="receipt-header">
                <div class="receipt-title">${settings.shopName || 'My Shop'}</div>
                <div>${settings.shopAddress || '123 Main Street, City, State'}</div>
                <div>${settings.shopPhone || '+1 234 567 8900'}</div>
                <hr>
                <div>Receipt #: ${sale.receiptNumber}</div>
                <div>Date: ${Utils.formatDate(new Date(sale.date))}</div>
                <div>Time: ${Utils.formatTime(new Date(sale.date))}</div>
            </div>

            <div class="receipt-items">
                <hr>
                ${sale.items
                  .map(
                    (item) => `
                    <div class="receipt-item">
                        <div>${item.name}</div>
                        <div>${item.quantity} x ${Utils.formatCurrency(
                      item.price,
                    )} = ${Utils.formatCurrency(item.price * item.quantity)}</div>
                    </div>
                `,
                  )
                  .join('')}
            </div>

            <div class="receipt-summary">
                <div class="receipt-item">
                    <span>Subtotal:</span>
                    <span>${Utils.formatCurrency(sale.subtotal)}</span>
                </div>
                <div class="receipt-item">
                    <span>Tax:</span>
                    <span>${Utils.formatCurrency(sale.tax)}</span>
                </div>
                <div class="receipt-item receipt-total">
                    <span>Total:</span>
                    <span>${Utils.formatCurrency(sale.total)}</span>
                </div>

                ${
                  sale.paymentMethod === 'cash'
                    ? `
                    <div class="receipt-item">
                        <span>Cash Received:</span>
                        <span>${Utils.formatCurrency(sale.cashReceived)}</span>
                    </div>
                    <div class="receipt-item">
                        <span>Change:</span>
                        <span>${Utils.formatCurrency(sale.change)}</span>
                    </div>
                `
                    : `
                    <div class="receipt-item">
                        <span>Payment Method:</span>
                        <span>${sale.paymentMethod.toUpperCase()}</span>
                    </div>
                `
                }
            </div>

            <div class="receipt-footer">
                <hr>
                <div>Thank you for your purchase!</div>
                <div>Please come again</div>
            </div>
        `;

    receiptContent.innerHTML = receiptHTML;
    this.currentSale = sale;
    Utils.openModal('receiptModal');
  }

  async showLastReceipt() {
    try {
      const sales = await Storage.getSales();
      if (sales.length > 0) {
        const lastSale = sales[sales.length - 1];
        this.showReceipt(lastSale);
      } else {
        Utils.showNotification('No recent sales found', 'info');
      }
    } catch (error) {
      console.error('Error loading last receipt:', error);
      Utils.showNotification('Error loading receipt', 'error');
    }
  }

  async printReceipt() {
    try {
      const printWindow = window.open('', '_blank');
      const receiptContent = document.getElementById('receiptContent').innerHTML;

      printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                        .receipt { max-width: 300px; margin: 0 auto; }
                        .receipt-header { text-align: center; margin-bottom: 20px; }
                        .receipt-title { font-weight: bold; font-size: 16px; }
                        .receipt-item { display: flex; justify-content: space-between; margin: 5px 0; }
                        .receipt-total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
                        .receipt-footer { text-align: center; margin-top: 20px; }
                        hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="receipt">${receiptContent}</div>
                </body>
                </html>
            `);

      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Print failed:', error);
      Utils.showNotification('Print failed', 'error');
    }
  }

  async generateQRCode() {
    console.log('generateQRCode called');
    if (!this.currentSale) {
      console.log('No current sale found');
      return;
    }

    try {
      const qrContainer = document.getElementById('qrCodeContainer');
      const qrDisplay = document.getElementById('qrCodeDisplay');
      const qrInstructions = document.getElementById('qrInstructions');

      console.log('QR elements found:', { qrContainer, qrDisplay, qrInstructions });

      if (!qrContainer || !qrDisplay) {
        console.log('QR elements not found');
        return;
      }

      // Create QR code data (in real implementation, this would be payment gateway data)
      const qrData = {
        amount: this.currentSale.total,
        receiptNumber: this.currentSale.receiptNumber,
        merchant: this.settings?.shopName || 'My Shop',
        timestamp: new Date().toISOString(),
      };

      console.log('QR data:', qrData);
      console.log('QRCode library available:', typeof QRCode !== 'undefined');

      // Check if QRCode library is available
      if (typeof QRCode !== 'undefined') {
        // Use QRCode library
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(
          canvas,
          JSON.stringify(qrData),
          {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          },
          function (error) {
            if (error) {
              console.error('QR generation error:', error);
              Utils.showNotification('QR code generation failed', 'error');
            } else {
              console.log('QR code generated successfully');
              qrDisplay.innerHTML = `
                            <div style="text-align: center;">
                                ${canvas.outerHTML}
                                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                                    Amount: ${Utils.formatCurrency(qrData.amount)}<br>
                                    Receipt: ${qrData.receiptNumber}
                                </p>
                            </div>
                        `;
              qrInstructions.textContent =
                this.settings?.qrPaymentInstructions ||
                'Scan QR code to pay with your mobile wallet';
              qrContainer.style.display = 'block';
            }
          },
        );
      } else {
        // Fallback: Create a simple pattern
        console.log('Using fallback QR generation');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 200, 200);

        // Create a simple pattern
        const dataString = JSON.stringify(qrData);
        const gridSize = 10;
        const cellSize = 200 / gridSize;

        ctx.fillStyle = '#000000';

        // Create a simple pattern based on the data
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const index = (i * gridSize + j) % dataString.length;
            const charCode = dataString.charCodeAt(index);
            if (charCode % 2 === 0) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
          }
        }

        // Add corner markers
        ctx.fillRect(0, 0, cellSize * 3, cellSize * 3);
        ctx.fillRect((gridSize - 3) * cellSize, 0, cellSize * 3, cellSize * 3);
        ctx.fillRect(0, (gridSize - 3) * cellSize, cellSize * 3, cellSize * 3);

        qrDisplay.innerHTML = `
                    <div style="text-align: center;">
                        ${canvas.outerHTML}
                        <p style="margin-top: 10px; font-size: 12px; color: #666;">
                            Amount: ${Utils.formatCurrency(qrData.amount)}<br>
                            Receipt: ${qrData.receiptNumber}
                        </p>
                    </div>
                `;

        qrInstructions.textContent =
          this.settings?.qrPaymentInstructions || 'Scan QR code to pay with your mobile wallet';
        qrContainer.style.display = 'block';
        console.log('Fallback QR code generated');
      }
    } catch (error) {
      console.error('QR code generation failed:', error);
      Utils.showNotification('QR code generation failed', 'error');
    }
  }

  // Public methods for external access
  getCart() {
    return this.cart;
  }

  getCartTotal() {
    return Utils.calculateCartTotals(this.cart, this.settings?.taxRate || 0).total;
  }

  async updateCustomerStats(customerId, saleAmount) {
    try {
      const customer = await Storage.getCustomers().then((customers) =>
        customers.find((c) => c.id === customerId),
      );

      if (customer) {
        const updates = {
          totalPurchases: (customer.totalPurchases || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + saleAmount,
          lastPurchase: new Date().toISOString(),
        };

        await Storage.updateCustomer(customerId, updates);

        // Update local customer data
        const localCustomer = this.customers.find((c) => c.id === customerId);
        if (localCustomer) {
          Object.assign(localCustomer, updates);

          // Update selected customer display if this is the selected customer
          if (this.selectedCustomer && this.selectedCustomer.id === customerId) {
            Object.assign(this.selectedCustomer, updates);
            this.selectCustomer(customerId); // Refresh display
          }
        }
      }
    } catch (error) {
      console.error('Error updating customer stats:', error);
    }
  }
}

// Create global POS manager instance
const posManager = new POSManager();
window.POSManager = posManager;

// Customer management for the Shop POS System

class CustomerManager {
  constructor() {
    this.customers = [];

    this.init();
  }

  async init() {
    await this.loadCustomers();
    this.setupEventListeners();
    this.renderCustomers();
  }

  async loadCustomers() {
    try {
      this.customers = await Storage.getCustomers();
    } catch (error) {
      console.error('Error loading customers:', error);
      Utils.showNotification('Error loading customers', 'error');
    }
  }

  setupEventListeners() {
    // Add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
      addCustomerBtn.addEventListener('click', () => this.openAddCustomerModal());
    }

    // Customer modal events
    const customerForm = document.getElementById('customerForm');
    const closeCustomerModal = document.getElementById('closeCustomerModal');
    const cancelCustomer = document.getElementById('cancelCustomer');

    if (customerForm) {
      customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCustomer();
      });
    }

    if (closeCustomerModal) {
      closeCustomerModal.addEventListener('click', () => Utils.closeModal('customerModal'));
    }

    if (cancelCustomer) {
      cancelCustomer.addEventListener('click', () => Utils.closeModal('customerModal'));
    }
  }

  renderCustomers() {
    const customersList = document.getElementById('customersList');
    if (!customersList) return;

    if (this.customers.length === 0) {
      customersList.innerHTML = `
                <div class="no-customers">
                    <i class="fas fa-users" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <h3>No Customers Yet</h3>
                    <p>Start building your customer database by adding customer information</p>
                    <button class="btn-primary" onclick="window.CustomerManager.openAddCustomerModal()">
                        <i class="fas fa-plus"></i> Add First Customer
                    </button>
                </div>
            `;
      return;
    }

    // Sort customers by total spent (highest first)
    const sortedCustomers = [...this.customers].sort(
      (a, b) => (b.totalSpent || 0) - (a.totalSpent || 0),
    );

    customersList.innerHTML = `
            <div class="customers-grid">
                ${sortedCustomers
                  .map(
                    (customer) => `
                    <div class="customer-card" data-customer-id="${customer.id}">
                        <div class="customer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="customer-info">
                            <h4 class="customer-name">${customer.name}</h4>
                            <p class="customer-email">${customer.email || 'No email'}</p>
                            <p class="customer-phone">${customer.phone || 'No phone'}</p>
                        </div>
                        <div class="customer-stats">
                            <div class="stat">
                                <span class="stat-label">Total Spent</span>
                                <span class="stat-value">${Utils.formatCurrency(
                                  customer.totalSpent || 0,
                                )}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Purchases</span>
                                <span class="stat-value">${customer.totalPurchases || 0}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Member Since</span>
                                <span class="stat-value">${Utils.formatDate(
                                  new Date(customer.dateAdded),
                                )}</span>
                            </div>
                        </div>
                        <div class="customer-actions">
                            <button class="action-btn edit" onclick="window.CustomerManager.editCustomer('${
                              customer.id
                            }')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn history" onclick="window.CustomerManager.viewPurchaseHistory('${
                              customer.id
                            }')">
                                <i class="fas fa-history"></i> History
                            </button>
                            <button class="action-btn delete" onclick="window.CustomerManager.deleteCustomer('${
                              customer.id
                            }')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        `;

    // Add customer styles if not already added
    this.addCustomerStyles();
  }

  addCustomerStyles() {
    if (document.querySelector('#customer-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'customer-styles';
    styles.textContent = `
            .no-customers {
                text-align: center;
                padding: 60px 20px;
                color: #7f8c8d;
            }
            .no-customers h3 {
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .no-customers p {
                margin-bottom: 20px;
            }

            .customers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 20px;
            }

            .customer-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }

            .customer-card:hover {
                transform: translateY(-2px);
            }

            .customer-avatar {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                margin-bottom: 15px;
            }

            .customer-info {
                margin-bottom: 20px;
            }

            .customer-name {
                color: #2c3e50;
                margin-bottom: 8px;
                font-size: 1.2rem;
            }

            .customer-email, .customer-phone {
                color: #7f8c8d;
                margin: 4px 0;
                font-size: 0.9rem;
            }

            .customer-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .stat {
                text-align: center;
            }

            .stat:last-child {
                grid-column: 1 / -1;
            }

            .stat-label {
                display: block;
                font-size: 0.8rem;
                color: #7f8c8d;
                margin-bottom: 4px;
            }

            .stat-value {
                display: block;
                font-weight: 600;
                color: #2c3e50;
            }

            .customer-actions {
                display: flex;
                gap: 8px;
                justify-content: center;
            }

            .customer-actions .action-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .customer-actions .action-btn.edit {
                background: #f39c12;
                color: white;
            }

            .customer-actions .action-btn.history {
                background: #3498db;
                color: white;
            }

            .customer-actions .action-btn.delete {
                background: #e74c3c;
                color: white;
            }

            .customer-actions .action-btn:hover {
                transform: translateY(-1px);
                opacity: 0.9;
            }
        `;
    document.head.appendChild(styles);
  }

  openAddCustomerModal() {
    this.currentEditingCustomer = null;
    this.clearCustomerForm();

    const modalTitle = document.getElementById('customerModalTitle');
    const saveBtn = document.getElementById('saveCustomer');

    if (modalTitle) modalTitle.textContent = 'Add Customer';
    if (saveBtn) saveBtn.textContent = 'Add Customer';

    Utils.openModal('customerModal');
  }

  clearCustomerForm() {
    const form = document.getElementById('customerForm');
    if (form) form.reset();
  }

  async saveCustomer() {
    console.log('saveCustomer called');
    const nameField = document.getElementById('customerName');
    const emailField = document.getElementById('customerEmail');
    const phoneField = document.getElementById('customerPhone');
    const addressField = document.getElementById('customerAddress');

    const customerData = {
      name: nameField?.value.trim() || '',
      email: emailField?.value.trim() || '',
      phone: phoneField?.value.trim() || '',
      address: addressField?.value.trim() || '',
    };

    console.log('Customer data:', customerData);

    if (!customerData.name) {
      Utils.showNotification('Customer name is required', 'error');
      return;
    }

    try {
      if (this.currentEditingCustomer) {
        // Edit existing customer
        console.log('Updating existing customer:', this.currentEditingCustomer.id);
        await Storage.updateCustomer(this.currentEditingCustomer.id, customerData);

        const customerIndex = this.customers.findIndex(
          (c) => c.id === this.currentEditingCustomer.id,
        );
        if (customerIndex !== -1) {
          this.customers[customerIndex] = { ...this.customers[customerIndex], ...customerData };
        }

        Utils.showNotification('Customer updated successfully', 'success');

        // Emit event for other modules to listen
        window.dispatchEvent(
          new CustomEvent('customerUpdated', {
            detail: this.customers[customerIndex],
          }),
        );
      } else {
        // Check for duplicate name/email before adding
        const existingCustomer = this.customers.find(
          (c) =>
            c.name.toLowerCase() === customerData.name.toLowerCase() ||
            (customerData.email &&
              c.email &&
              c.email.toLowerCase() === customerData.email.toLowerCase()),
        );

        if (existingCustomer) {
          Utils.showNotification('Customer with this name or email already exists', 'error');
          return;
        }

        console.log('Adding new customer');
        // Add new customer
        const newCustomer = await Storage.addCustomer(customerData);
        this.customers.push(newCustomer);
        Utils.showNotification(`Customer ${customerData.name} added successfully`, 'success');

        // Emit event for other modules to listen
        window.dispatchEvent(new CustomEvent('customerAdded', { detail: newCustomer }));
      }

      this.renderCustomers();
      Utils.closeModal('customerModal');
    } catch (error) {
      console.error('Error saving customer:', error);
      Utils.showNotification('Error saving customer', 'error');
    }
  }

  async addCustomer(customerData) {
    try {
      const newCustomer = await Storage.addCustomer(customerData);
      this.customers.push(newCustomer);
      this.renderCustomers();
      Utils.showNotification(`Customer ${customerData.name} added successfully`, 'success');

      // Emit event for other modules to listen
      window.dispatchEvent(new CustomEvent('customerAdded', { detail: newCustomer }));
    } catch (error) {
      console.error('Error adding customer:', error);
      Utils.showNotification('Error adding customer', 'error');
    }
  }

  async editCustomer(customerId) {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return;

    this.currentEditingCustomer = customer;

    // Populate form with customer data
    const nameField = document.getElementById('customerName');
    const emailField = document.getElementById('customerEmail');
    const phoneField = document.getElementById('customerPhone');
    const addressField = document.getElementById('customerAddress');

    if (nameField) nameField.value = customer.name || '';
    if (emailField) emailField.value = customer.email || '';
    if (phoneField) phoneField.value = customer.phone || '';
    if (addressField) addressField.value = customer.address || '';

    const modalTitle = document.getElementById('customerModalTitle');
    const saveBtn = document.getElementById('saveCustomer');

    if (modalTitle) modalTitle.textContent = 'Edit Customer';
    if (saveBtn) saveBtn.textContent = 'Update Customer';

    Utils.openModal('customerModal');
  }

  async deleteCustomer(customerId) {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return;

    if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      try {
        await Storage.deleteCustomer(customerId);
        this.customers = this.customers.filter((c) => c.id !== customerId);
        this.renderCustomers();
        Utils.showNotification('Customer deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting customer:', error);
        Utils.showNotification('Error deleting customer', 'error');
      }
    }
  }

  async viewPurchaseHistory(customerId) {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return;

    try {
      const sales = await Storage.getSales();
      const customerSales = sales.filter((sale) => sale.customerId === customerId);

      if (customerSales.length === 0) {
        alert(`${customer.name} has no purchase history yet.`);
        return;
      }

      // Create a simple summary
      const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = customerSales.length;
      const lastPurchase = customerSales[customerSales.length - 1];

      const summary =
        `Purchase History for ${customer.name}\n\n` +
        `Total Purchases: ${totalPurchases}\n` +
        `Total Spent: ${Utils.formatCurrency(totalSpent)}\n` +
        `Last Purchase: ${Utils.formatDate(new Date(lastPurchase.date))}\n\n` +
        `Recent Purchases:\n` +
        customerSales
          .slice(-5)
          .map(
            (sale) =>
              `${Utils.formatDate(new Date(sale.date))}: ${Utils.formatCurrency(sale.total)}`,
          )
          .join('\n');

      alert(summary);
    } catch (error) {
      console.error('Error loading purchase history:', error);
      Utils.showNotification('Error loading purchase history', 'error');
    }
  }

  async updateCustomerStats() {
    // Update customer statistics based on sales data
    try {
      const sales = await Storage.getSales();

      for (const customer of this.customers) {
        const customerSales = sales.filter((sale) => sale.customerId === customer.id);

        const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalPurchases = customerSales.length;

        if (customer.totalSpent !== totalSpent || customer.totalPurchases !== totalPurchases) {
          await Storage.updateCustomer(customer.id, {
            totalSpent,
            totalPurchases,
          });

          // Update local data
          const customerIndex = this.customers.findIndex((c) => c.id === customer.id);
          if (customerIndex !== -1) {
            this.customers[customerIndex].totalSpent = totalSpent;
            this.customers[customerIndex].totalPurchases = totalPurchases;
          }
        }
      }

      this.renderCustomers();
    } catch (error) {
      console.error('Error updating customer stats:', error);
    }
  }

  searchCustomers(query) {
    if (!query) return this.customers;

    const lowercaseQuery = query.toLowerCase();
    return this.customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        (customer.email && customer.email.toLowerCase().includes(lowercaseQuery)) ||
        (customer.phone && customer.phone.includes(query)),
    );
  }

  getTopCustomers(limit = 10) {
    return [...this.customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limit);
  }

  getCustomerStats() {
    const totalCustomers = this.customers.length;
    const totalSpent = this.customers.reduce(
      (sum, customer) => sum + (customer.totalSpent || 0),
      0,
    );
    const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    const activeCustomers = this.customers.filter(
      (customer) => (customer.totalPurchases || 0) > 0,
    ).length;

    return {
      totalCustomers,
      activeCustomers,
      totalSpent,
      averageSpent,
    };
  }

  exportCustomers() {
    if (this.customers.length === 0) {
      Utils.showNotification('No customers to export', 'error');
      return;
    }

    const exportData = this.customers.map((customer) => ({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      totalSpent: customer.totalSpent || 0,
      totalPurchases: customer.totalPurchases || 0,
      dateAdded: Utils.formatDate(new Date(customer.dateAdded)),
    }));

    const filename = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    Utils.exportToCSV(exportData, filename);
  }

  // Public methods for external access
  async refreshCustomers() {
    await this.loadCustomers();
    this.renderCustomers();
  }

  getCustomers() {
    return this.customers;
  }

  findCustomerById(customerId) {
    return this.customers.find((c) => c.id === customerId);
  }

  findCustomerByEmail(email) {
    return this.customers.find((c) => c.email === email);
  }

  findCustomerByPhone(phone) {
    return this.customers.find((c) => c.phone === phone);
  }
}

// Create global customer manager instance
const customerManager = new CustomerManager();
window.CustomerManager = customerManager;

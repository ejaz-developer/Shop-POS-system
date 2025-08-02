// Settings management for the Shop POS System

class SettingsManager {
  constructor() {
    this.settings = null;

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateSettingsForm();
  }

  async loadSettings() {
    try {
      this.settings = await Storage.getSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      Utils.showNotification('Error loading settings', 'error');
    }
  }

  setupEventListeners() {
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Listen for QR payment checkbox changes
    const enableQRCheckbox = document.getElementById('enableQRPayment');
    if (enableQRCheckbox) {
      enableQRCheckbox.addEventListener('change', (e) => {
        const instructionsField = document.getElementById('qrPaymentInstructions');
        if (instructionsField) {
          instructionsField.disabled = !e.target.checked;
        }
      });
    }

    // Data management event listeners
    this.setupDataManagementListeners();
  }

  setupDataManagementListeners() {
    // Clear products
    const clearProductsBtn = document.getElementById('clearProducts');
    if (clearProductsBtn) {
      clearProductsBtn.addEventListener('click', () => this.clearProducts());
    }

    // Clear sales
    const clearSalesBtn = document.getElementById('clearSales');
    if (clearSalesBtn) {
      clearSalesBtn.addEventListener('click', () => this.clearSales());
    }

    // Clear customers
    const clearCustomersBtn = document.getElementById('clearCustomers');
    if (clearCustomersBtn) {
      clearCustomersBtn.addEventListener('click', () => this.clearCustomers());
    }

    // Clear all data
    const clearAllDataBtn = document.getElementById('clearAllData');
    if (clearAllDataBtn) {
      clearAllDataBtn.addEventListener('click', () => this.clearAllData());
    }

    // Open data folder
    const openDataFolderBtn = document.getElementById('openDataFolder');
    if (openDataFolderBtn) {
      openDataFolderBtn.addEventListener('click', () => this.openDataFolder());
    }

    // Load data location
    this.loadDataLocation();
  }

  populateSettingsForm() {
    if (!this.settings) return;

    // Shop information
    const shopNameField = document.getElementById('shopName');
    const shopAddressField = document.getElementById('shopAddress');
    const shopPhoneField = document.getElementById('shopPhone');
    const taxRateField = document.getElementById('taxRate');

    if (shopNameField) shopNameField.value = this.settings.shopName || '';
    if (shopAddressField) shopAddressField.value = this.settings.shopAddress || '';
    if (shopPhoneField) shopPhoneField.value = this.settings.shopPhone || '';
    if (taxRateField) {
      const taxPercentage = (this.settings.taxRate || 0) * 100; // Default to 0% instead of 10%
      taxRateField.value = taxPercentage;
      console.log('Settings form populated - Tax rate:', {
        taxRateFromSettings: this.settings.taxRate,
        taxPercentageDisplayed: taxPercentage,
      });
    }

    // Payment settings
    const enableQRField = document.getElementById('enableQRPayment');
    const qrInstructionsField = document.getElementById('qrPaymentInstructions');

    if (enableQRField) {
      enableQRField.checked = this.settings.enableQRPayment !== false;
    }
    if (qrInstructionsField) {
      qrInstructionsField.value =
        this.settings.qrPaymentInstructions || 'Scan QR code to pay with your mobile wallet';
      qrInstructionsField.disabled = !enableQRField.checked;
    }
  }

  async saveSettings() {
    console.log('saveSettings called');
    try {
      const shopNameField = document.getElementById('shopName');
      const shopAddressField = document.getElementById('shopAddress');
      const shopPhoneField = document.getElementById('shopPhone');
      const taxRateField = document.getElementById('taxRate');
      const enableQRField = document.getElementById('enableQRPayment');
      const qrInstructionsField = document.getElementById('qrPaymentInstructions');

      console.log('Form fields found:', {
        shopNameField: !!shopNameField,
        shopAddressField: !!shopAddressField,
        shopPhoneField: !!shopPhoneField,
        taxRateField: !!taxRateField,
        enableQRField: !!enableQRField,
        qrInstructionsField: !!qrInstructionsField,
      });

      const newSettings = {
        shopName: shopNameField?.value.trim() || 'My Shop',
        shopAddress: shopAddressField?.value.trim() || '',
        shopPhone: shopPhoneField?.value.trim() || '',
        taxRate: (parseFloat(taxRateField?.value) || 0) / 100, // Convert from percentage, default to 0
        enableQRPayment: enableQRField?.checked === true,
        qrPaymentInstructions:
          qrInstructionsField?.value.trim() || 'Scan QR code to pay with your mobile wallet',
      };

      console.log('New settings to save:', newSettings);

      // Validate settings
      if (!newSettings.shopName) {
        Utils.showNotification('Shop name is required', 'error');
        return;
      }

      if (newSettings.taxRate < 0 || newSettings.taxRate > 1) {
        Utils.showNotification('Tax rate must be between 0% and 100%', 'error');
        return;
      }

      await Storage.updateSettings(newSettings);
      this.settings = { ...this.settings, ...newSettings };

      console.log('Settings saved successfully');
      Utils.showNotification('Settings saved successfully', 'success');

      // Notify other components that settings have changed
      document.dispatchEvent(
        new CustomEvent('settingsUpdated', {
          detail: this.settings,
        }),
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Utils.showNotification('Error saving settings', 'error');
    }
  }

  async resetSettings() {
    if (
      confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')
    ) {
      try {
        const defaultSettings = {
          shopName: 'My Shop',
          shopAddress: '123 Main Street, City, State',
          shopPhone: '+1 234 567 8900',
          taxRate: 0.1,
          enableQRPayment: true,
          qrPaymentInstructions: 'Scan QR code to pay with your mobile wallet',
          currency: 'USD',
          theme: 'light',
        };

        await Storage.setSettings(defaultSettings);
        this.settings = defaultSettings;
        this.populateSettingsForm();

        Utils.showNotification('Settings reset to defaults', 'success');

        // Notify other components
        document.dispatchEvent(
          new CustomEvent('settingsUpdated', {
            detail: this.settings,
          }),
        );
      } catch (error) {
        console.error('Error resetting settings:', error);
        Utils.showNotification('Error resetting settings', 'error');
      }
    }
  }

  async exportSettings() {
    try {
      const settingsData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const dataString = JSON.stringify(settingsData, null, 2);
      const filename = `shop-settings-${new Date().toISOString().split('T')[0]}.json`;

      // Create download
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      Utils.showNotification('Settings exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting settings:', error);
      Utils.showNotification('Error exporting settings', 'error');
    }
  }

  async importSettings() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);

            if (data.settings) {
              await Storage.setSettings(data.settings);
              this.settings = data.settings;
              this.populateSettingsForm();

              Utils.showNotification('Settings imported successfully', 'success');

              // Notify other components
              document.dispatchEvent(
                new CustomEvent('settingsUpdated', {
                  detail: this.settings,
                }),
              );
            } else {
              throw new Error('Invalid settings file format');
            }
          } catch (error) {
            console.error('Error importing settings:', error);
            Utils.showNotification('Error importing settings: ' + error.message, 'error');
          }
        };

        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error('Error importing settings:', error);
      Utils.showNotification('Error importing settings', 'error');
    }
  }

  // Backup and restore functionality
  async createFullBackup() {
    try {
      const backupData = {
        products: await Storage.getProducts(),
        sales: await Storage.getSales(),
        customers: await Storage.getCustomers(),
        settings: await Storage.getSettings(),
        backupDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const dataString = JSON.stringify(backupData, null, 2);
      const filename = `shop-full-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Create download
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      Utils.showNotification('Full backup created successfully', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      Utils.showNotification('Error creating backup', 'error');
    }
  }

  async restoreFromBackup() {
    if (!confirm('This will replace ALL current data with the backup data. Are you sure?')) {
      return;
    }

    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);

            // Validate backup data
            if (!data.products || !data.sales || !data.customers || !data.settings) {
              throw new Error('Invalid backup file format');
            }

            // Restore all data
            await Storage.setProducts(data.products);
            await Storage.setSales(data.sales);
            await Storage.setCustomers(data.customers);
            await Storage.setSettings(data.settings);

            // Update local settings
            this.settings = data.settings;
            this.populateSettingsForm();

            Utils.showNotification('Data restored successfully from backup', 'success');

            // Notify all components to refresh
            document.dispatchEvent(new CustomEvent('dataRestored'));

            // Refresh the page to ensure all components are updated
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error('Error restoring backup:', error);
            Utils.showNotification('Error restoring backup: ' + error.message, 'error');
          }
        };

        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error('Error restoring backup:', error);
      Utils.showNotification('Error restoring backup', 'error');
    }
  }

  // Theme management
  async setTheme(themeName) {
    try {
      await Storage.updateSettings({ theme: themeName });
      this.settings.theme = themeName;

      // Apply theme to document
      document.body.className =
        document.body.className.replace(/theme-\w+/, '') + ` theme-${themeName}`;

      Utils.showNotification(`Theme changed to ${themeName}`, 'success');
    } catch (error) {
      console.error('Error setting theme:', error);
      Utils.showNotification('Error changing theme', 'error');
    }
  }

  // Print settings
  async updatePrintSettings(printSettings) {
    try {
      await Storage.updateSettings({ printSettings });
      this.settings.printSettings = printSettings;

      Utils.showNotification('Print settings updated', 'success');
    } catch (error) {
      console.error('Error updating print settings:', error);
      Utils.showNotification('Error updating print settings', 'error');
    }
  }

  // Get formatted settings for display
  getFormattedSettings() {
    if (!this.settings) return {};

    return {
      'Shop Name': this.settings.shopName,
      Address: this.settings.shopAddress,
      Phone: this.settings.shopPhone,
      'Tax Rate': `${(this.settings.taxRate * 100).toFixed(1)}%`,
      'QR Payments': this.settings.enableQRPayment ? 'Enabled' : 'Disabled',
      Currency: this.settings.currency || 'USD',
      Theme: this.settings.theme || 'Light',
    };
  }

  // Public methods for external access
  getSettings() {
    return this.settings;
  }

  getSetting(key, defaultValue = null) {
    return this.settings?.[key] ?? defaultValue;
  }

  async updateSetting(key, value) {
    try {
      await Storage.updateSettings({ [key]: value });
      if (this.settings) {
        this.settings[key] = value;
      }
      return true;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      return false;
    }
  }

  // Data Management Methods
  async loadDataLocation() {
    try {
      const { ipcRenderer } = require('electron');
      const dataLocation = await ipcRenderer.invoke('get-data-path');
      const dataLocationElement = document.getElementById('dataLocation');
      if (dataLocationElement) {
        dataLocationElement.textContent = dataLocation;
      }
    } catch (error) {
      console.error('Error getting data location:', error);
      const dataLocationElement = document.getElementById('dataLocation');
      if (dataLocationElement) {
        dataLocationElement.textContent = 'Unable to determine data location';
      }
    }
  }

  async openDataFolder() {
    try {
      const { ipcRenderer } = require('electron');
      await ipcRenderer.invoke('open-data-folder');
    } catch (error) {
      console.error('Error opening data folder:', error);
      Utils.showNotification('Error opening data folder', 'error');
    }
  }

  async clearProducts() {
    const confirmed = await this.showConfirmationDialog(
      'Clear All Products',
      'This will permanently delete all products from your inventory. This action cannot be undone.',
      'warning',
    );

    if (confirmed) {
      try {
        await Storage.set('products', []);
        Utils.showNotification('All products cleared successfully', 'success');

        // Refresh products page if it's currently visible
        if (window.ProductsManager) {
          window.ProductsManager.loadProducts();
        }
      } catch (error) {
        console.error('Error clearing products:', error);
        Utils.showNotification('Error clearing products', 'error');
      }
    }
  }

  async clearSales() {
    const confirmed = await this.showConfirmationDialog(
      'Clear All Sales Reports',
      'This will permanently delete all sales data and reports. This action cannot be undone.',
      'warning',
    );

    if (confirmed) {
      try {
        await Storage.set('sales', []);
        Utils.showNotification('All sales data cleared successfully', 'success');

        // Refresh sales page if it's currently visible
        if (window.SalesManager) {
          window.SalesManager.loadSales();
        }
      } catch (error) {
        console.error('Error clearing sales:', error);
        Utils.showNotification('Error clearing sales data', 'error');
      }
    }
  }

  async clearCustomers() {
    const confirmed = await this.showConfirmationDialog(
      'Clear All Customers',
      'This will permanently delete all customer information. This action cannot be undone.',
      'warning',
    );

    if (confirmed) {
      try {
        await Storage.set('customers', []);
        Utils.showNotification('All customers cleared successfully', 'success');

        // Refresh customers page if it's currently visible
        if (window.CustomersManager) {
          window.CustomersManager.loadCustomers();
        }
      } catch (error) {
        console.error('Error clearing customers:', error);
        Utils.showNotification('Error clearing customers', 'error');
      }
    }
  }

  async clearAllData() {
    const confirmed = await this.showConfirmationDialog(
      'Clear ALL Data',
      'This will permanently delete ALL your data including:\n• All products and inventory\n• All sales reports and transactions\n• All customer information\n• All settings (except shop info)\n\nThis action cannot be undone!',
      'danger',
    );

    if (confirmed) {
      try {
        // Clear all data except basic settings
        await Storage.set('products', []);
        await Storage.set('sales', []);
        await Storage.set('customers', []);

        Utils.showNotification('All data cleared successfully', 'success');

        // Refresh all pages
        if (window.ProductsManager) window.ProductsManager.loadProducts();
        if (window.SalesManager) window.SalesManager.loadSales();
        if (window.CustomersManager) window.CustomersManager.loadCustomers();
      } catch (error) {
        console.error('Error clearing all data:', error);
        Utils.showNotification('Error clearing data', 'error');
      }
    }
  }

  async showConfirmationDialog(title, message, type = 'warning') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';

      const iconClass = type === 'danger' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
      const iconColor = type === 'danger' ? '#e74c3c' : '#f39c12';

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3><i class="fas ${iconClass}" style="color: ${iconColor}; margin-right: 10px;"></i>${title}</h3>
          </div>
          <div class="modal-body">
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
            <div class="form-actions" style="margin-top: 20px;">
              <button id="cancelAction" class="btn-secondary">Cancel</button>
              <button id="confirmAction" class="btn-${type}">Confirm</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cancelBtn = modal.querySelector('#cancelAction');
      const confirmBtn = modal.querySelector('#confirmAction');

      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      confirmBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      });
    });
  }
}

// Create global settings manager instance
const settingsManager = new SettingsManager();
window.SettingsManager = settingsManager;

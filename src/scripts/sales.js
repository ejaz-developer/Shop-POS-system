// Sales management and reporting for the Shop POS System

class SalesManager {
  constructor() {
    this.sales = [];
    this.chart = null;
    this.currentDateRange = this.getDefaultDateRange();

    this.init();
  }

  async init() {
    await this.loadSales();
    this.setupEventListeners();
    this.populateDateInputs(); // Ensure date inputs are populated first
    this.renderSalesData();
    this.initializeChart();
  }

  populateDateInputs() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
      startDateInput.value = this.currentDateRange.startDate.toISOString().split('T')[0];
      endDateInput.value = this.currentDateRange.endDate.toISOString().split('T')[0];
      console.log('Date inputs populated:', {
        startDate: startDateInput.value,
        endDate: endDateInput.value,
      });
    } else {
      console.warn('Date input elements not found');
    }
  }

  async loadSales() {
    try {
      this.sales = await Storage.getSales();
      console.log('Sales loaded:', this.sales.length, 'sales found');
    } catch (error) {
      console.error('Error loading sales:', error);
      Utils.showNotification('Error loading sales data', 'error');
    }
  }

  setupEventListeners() {
    // Date filter
    const filterBtn = document.getElementById('filterSales');
    const refreshBtn = document.getElementById('refreshSales');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate && endDate && startDate <= endDate) {
          this.currentDateRange = { startDate, endDate };
          this.renderSalesData();
          this.updateChart();
        } else {
          Utils.showNotification('Please select a valid date range', 'error');
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshSales();
      });
    }

    // Export sales button
    const exportBtn = document.getElementById('exportSales');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportSalesToCSV();
      });
    }

    // Listen for new sales being added
    document.addEventListener('saleAdded', (event) => {
      console.log('New sale added, refreshing sales data');
      this.refreshSales();
    });
  }

  getDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Show last 30 days of data

    console.log('Default date range:', { startDate, endDate });
    return { startDate, endDate };
  }

  getFilteredSales() {
    return this.sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return (
        saleDate >= this.currentDateRange.startDate && saleDate <= this.currentDateRange.endDate
      );
    });
  }

  renderSalesData() {
    this.renderSalesStats();
    this.renderSalesTable();
  }

  renderSalesStats() {
    const filteredSales = this.getFilteredSales();
    console.log('Rendering sales stats. Filtered sales:', filteredSales.length);

    // Calculate statistics
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Today's sales
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysSales = this.sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= todayStart && saleDate < todayEnd;
    });

    const todayTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

    console.log('Sales stats:', { totalSales, totalTransactions, averageSale, todayTotal });

    // Update DOM elements
    const todaySalesEl = document.getElementById('todaySales');
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const averageSaleEl = document.getElementById('averageSale');

    if (todaySalesEl) todaySalesEl.textContent = Utils.formatCurrency(todayTotal);
    if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions.toString();
    if (averageSaleEl) averageSaleEl.textContent = Utils.formatCurrency(averageSale);
  }

  renderSalesTable() {
    const tableBody = document.getElementById('salesTableBody');
    if (!tableBody) {
      console.log('Sales table body not found');
      return;
    }

    const filteredSales = this.getFilteredSales();
    console.log('Rendering sales table. Filtered sales:', filteredSales.length);

    if (filteredSales.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-chart-line" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px; display: block;"></i>
                        No sales found for the selected period
                        <br><small>Try adjusting the date range</small>
                    </td>
                </tr>
            `;
      return;
    }

    // Sort by date (newest first)
    const sortedSales = [...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = sortedSales
      .map(
        (sale) => `
            <tr class="sales-row" data-sale-id="${sale.id}">
                <td>
                    <div class="date-cell">
                        <div class="sale-date">${Utils.formatDate(new Date(sale.date))}</div>
                        <div class="sale-time">${Utils.formatTime(new Date(sale.date))}</div>
                    </div>
                </td>
                <td>
                    <div class="receipt-number">
                        <strong>${sale.receiptNumber}</strong>
                        <div class="payment-method-badge ${sale.paymentMethod}">
                            <i class="fas fa-${this.getPaymentIcon(sale.paymentMethod)}"></i>
                            ${sale.paymentMethod.toUpperCase()}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="items-summary">
                        <div class="item-count">${sale.items.length} item${
          sale.items.length !== 1 ? 's' : ''
        }</div>
                        <div class="item-list">
                            ${sale.items
                              .slice(0, 2)
                              .map((item) => `<small>${item.quantity}x ${item.name}</small>`)
                              .join('<br>')}
                            ${
                              sale.items.length > 2
                                ? `<small>+${sale.items.length - 2} more</small>`
                                : ''
                            }
                        </div>
                    </div>
                </td>
                <td class="total-cell">
                    <strong>${Utils.formatCurrency(sale.total)}</strong>
                    <small>Tax: ${Utils.formatCurrency(sale.tax)}</small>
                </td>
                <td>
                    <div class="payment-info">
                        <span class="payment-method">${sale.paymentMethod.toUpperCase()}</span>
                        ${
                          sale.paymentMethod === 'cash' && sale.change > 0
                            ? `<small>Change: ${Utils.formatCurrency(sale.change)}</small>`
                            : ''
                        }
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="window.SalesManager.viewSaleDetails('${
                          sale.id
                        }')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn reprint" onclick="window.SalesManager.reprintReceipt('${
                          sale.id
                        }')" title="Reprint Receipt">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="action-btn refund" onclick="window.SalesManager.processRefund('${
                          sale.id
                        }')" title="Process Refund">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join('');

    // Add sales table styles if not already added
    this.addSalesTableStyles();
  }

  addSalesTableStyles() {
    if (document.querySelector('#sales-table-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'sales-table-styles';
    styles.textContent = `
            .sales-row:hover { background-color: #f8f9fa; }
            .date-cell { text-align: center; }
            .sale-date { font-weight: 600; }
            .sale-time { font-size: 0.8rem; color: #6c757d; }
            .receipt-number strong { display: block; margin-bottom: 4px; }
            .payment-method-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 0.7rem;
                font-weight: 600;
            }
            .payment-method-badge.cash { background: #d4edda; color: #155724; }
            .payment-method-badge.card { background: #cce7ff; color: #004085; }
            .payment-method-badge.qr { background: #e2e3e5; color: #383d41; }
            .items-summary .item-count { font-weight: 600; margin-bottom: 4px; }
            .items-summary .item-list { font-size: 0.8rem; color: #6c757d; line-height: 1.2; }
            .total-cell { text-align: right; }
            .total-cell strong { display: block; margin-bottom: 2px; }
            .total-cell small { color: #6c757d; }
            .payment-info .payment-method {
                display: block;
                font-weight: 600;
                margin-bottom: 2px;
            }
            .payment-info small { color: #6c757d; }
        `;
    document.head.appendChild(styles);
  }

  getPaymentIcon(paymentMethod) {
    const icons = {
      cash: 'money-bill',
      card: 'credit-card',
      qr: 'qrcode',
    };
    return icons[paymentMethod] || 'money-bill';
  }

  initializeChart() {
    const chartCanvas = document.getElementById('salesChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Daily Sales',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return Utils.formatCurrency(value);
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Sales: ${Utils.formatCurrency(context.parsed.y)}`;
              },
            },
          },
        },
      },
    });

    this.updateChart();
  }

  updateChart() {
    const chartContainer = document.querySelector('.sales-chart');

    if (!this.chart) {
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    const filteredSales = this.getFilteredSales();

    // Hide chart if no sales data
    if (filteredSales.length === 0) {
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    } else {
      if (chartContainer) chartContainer.style.display = 'block';
    }

    // Group sales by date
    const salesByDate = {};
    filteredSales.forEach((sale) => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += sale.total;
    });

    // Generate date range (limit to reasonable number of days)
    const dates = [];
    const currentDate = new Date(this.currentDateRange.startDate);
    const endDate = new Date(this.currentDateRange.endDate);
    const maxDays = 30; // Limit chart to 30 days to avoid clutter
    let dayCount = 0;

    while (currentDate <= endDate && dayCount < maxDays) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }

    // Prepare chart data
    const chartData = dates.map((date) => salesByDate[date] || 0);
    const chartLabels = dates.map((date) => Utils.formatDate(new Date(date)));

    this.chart.data.labels = chartLabels;
    this.chart.data.datasets[0].data = chartData;
    this.chart.update();
  }

  async viewSaleDetails(saleId) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return;

    // Create modal content for sale details
    const detailsHTML = `
            <div class="sale-details">
                <div class="sale-header">
                    <h3>Sale Details</h3>
                    <p><strong>Receipt #:</strong> ${sale.receiptNumber}</p>
                    <p><strong>Date:</strong> ${Utils.formatDate(
                      new Date(sale.date),
                    )} at ${Utils.formatTime(new Date(sale.date))}</p>
                    <p><strong>Payment Method:</strong> ${sale.paymentMethod.toUpperCase()}</p>
                </div>

                <div class="sale-items">
                    <h4>Items Purchased</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items
                              .map(
                                (item) => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${Utils.formatCurrency(item.price)}</td>
                                    <td>${Utils.formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `,
                              )
                              .join('')}
                        </tbody>
                    </table>
                </div>

                <div class="sale-summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${Utils.formatCurrency(sale.subtotal)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span>${Utils.formatCurrency(sale.tax)}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>${Utils.formatCurrency(sale.total)}</span>
                    </div>
                    ${
                      sale.paymentMethod === 'cash'
                        ? `
                        <div class="summary-row">
                            <span>Cash Received:</span>
                            <span>${Utils.formatCurrency(sale.cashReceived)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Change:</span>
                            <span>${Utils.formatCurrency(sale.change)}</span>
                        </div>
                    `
                        : ''
                    }
                </div>
            </div>
        `;

    // Show in a modal (you might want to create a specific modal for this)
    alert(
      `Sale Details:\n\nReceipt: ${sale.receiptNumber}\nDate: ${Utils.formatDate(
        new Date(sale.date),
      )}\nItems: ${sale.items.length}\nTotal: ${Utils.formatCurrency(sale.total)}`,
    );
  }

  async reprintReceipt(saleId) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return;

    // Use POS manager to show receipt
    if (window.POSManager) {
      window.POSManager.showReceipt(sale);
    }
  }

  async processRefund(saleId) {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return;

    const confirmRefund = confirm(
      `Process refund for receipt ${sale.receiptNumber}?\n\n` +
        `Total: ${Utils.formatCurrency(sale.total)}\n` +
        `Date: ${Utils.formatDate(new Date(sale.date))}\n\n` +
        `This will restore stock quantities for all items.`,
    );

    if (confirmRefund) {
      try {
        // Restore stock for each item
        for (const item of sale.items) {
          const product = await Storage.getProductById(item.productId);
          if (product) {
            await Storage.updateStock(item.productId, product.stock + item.quantity);
          }
        }

        // Create refund record (mark sale as refunded)
        const refundedSale = {
          ...sale,
          refunded: true,
          refundDate: new Date().toISOString(),
        };

        // Update sales array
        const saleIndex = this.sales.findIndex((s) => s.id === saleId);
        if (saleIndex !== -1) {
          this.sales[saleIndex] = refundedSale;
          await Storage.setSales(this.sales);
        }

        Utils.showNotification('Refund processed successfully', 'success');
        this.renderSalesData();

        // Refresh other components
        if (window.InventoryManager) {
          window.InventoryManager.refreshInventory();
        }
      } catch (error) {
        console.error('Error processing refund:', error);
        Utils.showNotification('Error processing refund', 'error');
      }
    }
  }

  generateSalesReport() {
    const filteredSales = this.getFilteredSales();

    // Basic statistics
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Payment method breakdown
    const paymentMethods = {};
    filteredSales.forEach((sale) => {
      if (!paymentMethods[sale.paymentMethod]) {
        paymentMethods[sale.paymentMethod] = { count: 0, total: 0 };
      }
      paymentMethods[sale.paymentMethod].count++;
      paymentMethods[sale.paymentMethod].total += sale.total;
    });

    // Top selling products
    const productSales = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: {
        start: this.currentDateRange.startDate.toISOString().split('T')[0],
        end: this.currentDateRange.endDate.toISOString().split('T')[0],
      },
      summary: {
        totalSales,
        totalTransactions,
        averageSale,
      },
      paymentMethods,
      topProducts,
      sales: filteredSales.map((sale) => ({
        date: sale.date,
        receiptNumber: sale.receiptNumber,
        total: sale.total,
        items: sale.items.length,
        paymentMethod: sale.paymentMethod,
      })),
    };
  }

  exportSalesReport() {
    const reportData = this.generateSalesReport();
    const filename = `sales-report-${reportData.period.start}-to-${reportData.period.end}.csv`;

    Utils.exportToCSV(reportData.sales, filename);
  }

  // Public methods for external access
  async refreshSales() {
    console.log('Refreshing sales data...');

    // Clear cache to ensure fresh data
    Storage.clearCache();

    await this.loadSales();
    this.renderSalesData();
    this.updateChart();

    console.log('Sales data refreshed');
    Utils.showNotification('Sales data refreshed successfully', 'success');
  }

  getSales() {
    return this.sales;
  }

  getFilteredSales() {
    const filtered = this.sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const inRange =
        saleDate >= this.currentDateRange.startDate && saleDate <= this.currentDateRange.endDate;
      return inRange;
    });

    console.log('Sales filtering:', {
      totalSales: this.sales.length,
      filteredSales: filtered.length,
      dateRange: {
        start: this.currentDateRange.startDate.toISOString().split('T')[0],
        end: this.currentDateRange.endDate.toISOString().split('T')[0],
      },
      firstSaleDate: this.sales.length > 0 ? this.sales[0].date : 'No sales',
      lastSaleDate: this.sales.length > 0 ? this.sales[this.sales.length - 1].date : 'No sales',
    });

    return filtered;
  }

  exportSalesToCSV() {
    try {
      const filteredSales = this.getFilteredSales();

      if (filteredSales.length === 0) {
        Utils.showNotification('No sales data to export', 'error');
        return;
      }

      // CSV Headers
      const headers = [
        'Receipt Number',
        'Date',
        'Time',
        'Customer',
        'Payment Method',
        'Items Count',
        'Subtotal',
        'Tax',
        'Total',
        'Items Details',
      ];

      // Convert sales data to CSV rows
      const csvRows = [headers.join(',')];

      filteredSales.forEach((sale) => {
        const saleDate = new Date(sale.date);
        const itemsDetails = sale.items
          .map((item) => `${item.name} (${item.quantity}x${Utils.formatCurrency(item.price)})`)
          .join('; ');

        const row = [
          Utils.escapeCSV(sale.receiptNumber || 'N/A'),
          Utils.escapeCSV(Utils.formatDate(saleDate)),
          Utils.escapeCSV(Utils.formatTime(saleDate)),
          Utils.escapeCSV(sale.customerName || 'Walk-in Customer'),
          Utils.escapeCSV(sale.paymentMethod || 'cash'),
          sale.items.length,
          sale.subtotal || sale.total - (sale.tax || 0),
          sale.tax || 0,
          sale.total,
          Utils.escapeCSV(itemsDetails),
        ];

        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        // Generate filename with date range
        const startDate = this.currentDateRange.startDate.toISOString().split('T')[0];
        const endDate = this.currentDateRange.endDate.toISOString().split('T')[0];
        const filename = `sales-report-${startDate}-to-${endDate}.csv`;

        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Utils.showNotification(`Sales report exported: ${filename}`, 'success');
      } else {
        Utils.showNotification('Export not supported in this browser', 'error');
      }
    } catch (error) {
      console.error('Error exporting sales:', error);
      Utils.showNotification('Error exporting sales data', 'error');
    }
  }
}

// Create global sales manager instance
const salesManager = new SalesManager();
window.SalesManager = salesManager;

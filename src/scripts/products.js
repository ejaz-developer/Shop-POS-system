// Products management for the Shop POS System

class ProductManager {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentCategory = 'all';
    this.searchQuery = '';

    this.init();
  }

  async init() {
    await this.loadProducts();
    this.setupEventListeners();
    this.renderProducts();
  }

  async loadProducts() {
    try {
      this.products = await Storage.getProducts();
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Error loading products:', error);
      Utils.showNotification('Error loading products', 'error');
    }
  }

  setupEventListeners() {
    // Product search
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        Utils.debounce((e) => {
          this.searchQuery = e.target.value;
          this.filterProducts();
        }, 300),
      );
    }

    // Category filters
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // Update active state
        categoryButtons.forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');

        this.currentCategory = e.target.dataset.category;
        this.filterProducts();
      });
    });

    // Add product modal
    const addProductBtn = document.getElementById('addProductBtn');
    const addNewProductBtn = document.getElementById('addNewProductBtn');

    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => this.openAddProductModal());
    }

    if (addNewProductBtn) {
      addNewProductBtn.addEventListener('click', () => this.openAddProductModal());
    }

    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
    }

    // Modal close buttons
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProduct = document.getElementById('cancelProduct');

    if (closeProductModal) {
      closeProductModal.addEventListener('click', () => Utils.closeModal('productModal'));
    }

    if (cancelProduct) {
      cancelProduct.addEventListener('click', () => Utils.closeModal('productModal'));
    }
  }

  filterProducts() {
    let filtered = [...this.products];

    // Filter by category
    if (this.currentCategory !== 'all') {
      filtered = Utils.filterProductsByCategory(filtered, this.currentCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = Utils.searchProducts(filtered, this.searchQuery);
    }

    this.filteredProducts = filtered;
    this.renderProducts();
  }

  renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    if (this.filteredProducts.length === 0) {
      productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>No products found</p>
                    ${
                      this.searchQuery
                        ? '<p>Try adjusting your search</p>'
                        : '<p>Add some products to get started</p>'
                    }
                </div>
            `;
      return;
    }

    productsGrid.innerHTML = this.filteredProducts
      .map(
        (product) => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <i class="${Utils.getCategoryIcon(product.category)}"></i>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${Utils.formatCurrency(product.price)}</div>
                <div class="product-stock ${Utils.getStockStatus(product.stock)}">
                    Stock: ${product.stock}
                </div>
            </div>
        `,
      )
      .join('');

    // Add click event listeners to product cards
    const productCards = productsGrid.querySelectorAll('.product-card');
    productCards.forEach((card) => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        this.addToCart(productId);
      });
    });
  }

  renderProductsList() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    if (this.products.length === 0) {
      productsList.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>No products available</p>
                    <p>Click "Add New Product" to get started</p>
                </div>
            `;
      return;
    }

    productsList.innerHTML = this.products
      .map(
        (product) => `
            <div class="product-item">
                <div class="product-info">
                    <div class="product-image-small">
                        <i class="${Utils.getCategoryIcon(product.category)}"></i>
                    </div>
                    <div class="product-details">
                        <h4>${product.name}</h4>
                        <p>${product.category} • ${Utils.formatCurrency(product.price)}</p>
                        <p class="product-description">${
                          product.description || 'No description'
                        }</p>
                    </div>
                </div>
                <div class="product-actions">
                    <div class="stock-info">
                        <span class="status-badge status-${Utils.getStockStatus(product.stock)}">
                            ${product.stock} in stock
                        </span>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="window.ProductManager.editProduct('${
                          product.id
                        }')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="window.ProductManager.deleteProduct('${
                          product.id
                        }')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `,
      )
      .join('');
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
                    </td>
                </tr>
            `;
      return;
    }

    tableBody.innerHTML = this.products
      .map(
        (product) => `
            <tr>
                <td>
                    <div class="product-image-small">
                        <i class="${Utils.getCategoryIcon(product.category)}"></i>
                    </div>
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.barcode ? `<br><small>Barcode: ${product.barcode}</small>` : ''}
                </td>
                <td><span class="category-tag">${product.category}</span></td>
                <td>${Utils.formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge status-${Utils.getStockStatus(product.stock)}">
                        ${Utils.getStockStatus(product.stock).replace('-', ' ')}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" onclick="window.ProductManager.editProduct('${
                      product.id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="window.ProductManager.deleteProduct('${
                      product.id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join('');
  }

  openAddProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');

    if (!modal || !form) return;

    // Reset form
    form.reset();
    form.dataset.productId = productId || '';

    if (productId) {
      // Edit mode
      title.textContent = 'Edit Product';
      this.loadProductToForm(productId);
    } else {
      // Add mode
      title.textContent = 'Add New Product';
    }

    Utils.openModal('productModal');
  }

  async loadProductToForm(productId) {
    const product = await Storage.getProductById(productId);
    if (!product) return;

    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productDescription').value = product.description || '';
  }

  async handleProductSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const productId = form.dataset.productId;

    const productData = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value,
      price: parseFloat(document.getElementById('productPrice').value),
      stock: parseInt(document.getElementById('productStock').value),
      barcode: document.getElementById('productBarcode').value.trim(),
      description: document.getElementById('productDescription').value.trim(),
    };

    // Validate product data
    const errors = Utils.validateProduct(productData);
    if (errors.length > 0) {
      Utils.showNotification(errors[0], 'error');
      return;
    }

    try {
      if (productId) {
        // Update existing product
        await Storage.updateProduct(productId, productData);
        Utils.showNotification('Product updated successfully', 'success');
      } else {
        // Add new product
        await Storage.addProduct(productData);
        Utils.showNotification('Product added successfully', 'success');
      }

      await this.loadProducts();
      this.renderProducts();
      this.renderProductsList();
      this.renderInventoryTable();
      Utils.closeModal('productModal');
    } catch (error) {
      console.error('Error saving product:', error);
      Utils.showNotification('Error saving product', 'error');
    }
  }

  async editProduct(productId) {
    this.openAddProductModal(productId);
  }

  async deleteProduct(productId) {
    const product = await Storage.getProductById(productId);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await Storage.deleteProduct(productId);
        await this.loadProducts();
        this.renderProducts();
        this.renderProductsList();
        this.renderInventoryTable();
        Utils.showNotification('Product deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        Utils.showNotification('Error deleting product', 'error');
      }
    }
  }

  async addToCart(productId) {
    const product = await Storage.getProductById(productId);
    if (!product) return;

    if (product.stock <= 0) {
      Utils.showNotification('Product is out of stock', 'error');
      return;
    }

    // Add to cart via POS manager
    if (window.POSManager) {
      window.POSManager.addProductToCart(product);
    }
  }

  // Public methods for external access
  async refreshProducts() {
    await this.loadProducts();
    this.filterProducts();
    this.renderProductsList();
    this.renderInventoryTable();
  }

  getProducts() {
    return this.products;
  }

  getFilteredProducts() {
    return this.filteredProducts;
  }
}

// Create global product manager instance
const productManager = new ProductManager();
window.ProductManager = productManager;

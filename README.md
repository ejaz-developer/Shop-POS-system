# Shop POS System

A comprehensive point-of-sale desktop application built with Electron.js for retail shops and small businesses.

## Features

### 🛒 Point of Sale

- **Product Search & Selection**: Search products by name or barcode
- **Shopping Cart Management**: Add, remove, and modify quantities
- **Multiple Payment Methods**: Support for cash, card, and QR code payments
- **Receipt Generation**: Professional receipts with QR codes
- **Real-time Calculations**: Automatic tax and total calculations

### 📦 Inventory Management

- **Stock Tracking**: Real-time inventory updates
- **Low Stock Alerts**: Automatic notifications for low stock items
- **Stock Adjustments**: Easy stock increase/decrease controls
- **Product Categories**: Organize products by categories
- **Barcode Support**: Product identification via barcodes

### 🏷️ Product Management

- **Product Database**: Complete product information management
- **Category Management**: Electronics, Clothing, Food, Books, and more
- **Price Management**: Easy price updates and modifications
- **Product Images**: Visual product representation with icons
- **Bulk Operations**: Import/export product data

### 📊 Sales Reporting

- **Daily Sales**: Track daily revenue and transactions
- **Sales Analytics**: Visual charts and graphs
- **Date Range Filtering**: Custom period reports
- **Top Products**: Best-selling items analysis
- **Payment Method Breakdown**: Transaction type analysis

### 👥 Customer Management

- **Customer Database**: Store customer information
- **Purchase History**: Track customer buying patterns
- **Customer Statistics**: Total spent and purchase counts
- **Customer Search**: Quick customer lookup

### ⚙️ Settings & Configuration

- **Shop Information**: Store name, address, contact details
- **Tax Configuration**: Customizable tax rates
- **Payment Settings**: Enable/disable payment methods
- **Data Backup**: Export and import all data
- **Theme Customization**: Light/dark theme options

## Technology Stack

- **Framework**: Electron.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Data Storage**: Electron Store (JSON-based)
- **Charts**: Chart.js
- **QR Codes**: QRCode.js
- **PDF Generation**: jsPDF
- **Icons**: Font Awesome

## Installation

1. **Clone or download** this repository to your local machine
2. **Install dependencies**:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will start the Electron application with developer tools enabled.

## Building for Production

To run the application in production mode:

```bash
npm start
```

To build the application for distribution:

```bash
npm run build
```

This will create distribution packages in the `dist` folder for your current platform.

## Project Structure

```
customer-reception-system/
├── main.js              # Main Electron process
├── preload.js           # Preload script for security
├── index.html           # Main HTML file
├── styles.css           # Application styles
├── app.js               # Frontend JavaScript
├── package.json         # Project configuration
├── assets/              # Application assets
│   └── icon.png         # Application icon
└── README.md           # This file
```

## Technologies Used

- **Electron.js**: Desktop application framework
- **HTML5/CSS3**: Modern web technologies
- **JavaScript**: Application logic
- **electron-store**: Data persistence
- **Font Awesome**: Icons

## Features Overview

### Customer Management

- Add new customers with detailed information
- Edit existing customer records
- Delete customers (with confirmation)
- Search and filter customers
- Status tracking (Active, Inactive, Pending)

### Appointment System

- Schedule new appointments
- Edit existing appointments
- Delete appointments (with confirmation)
- Link appointments to customers
- Status tracking (Scheduled, Confirmed, Completed, Cancelled)
- Purpose and notes for each appointment

### Dashboard Analytics

- Total customers count
- Total appointments count
- Today's appointments
- New customers today
- Recent customers list
- Upcoming appointments list

### Data Management

- Local data storage
- Data export functionality
- Automatic data persistence
- Backup and restore capabilities

## Keyboard Shortcuts

- `Ctrl+N` (or `Cmd+N` on Mac): Add new customer
- `Ctrl+E` (or `Cmd+E` on Mac): Export data
- `Ctrl+Q` (or `Cmd+Q` on Mac): Quit application

## System Requirements

- **Windows**: Windows 7 or later
- **macOS**: macOS 10.10 or later
- **Linux**: Ubuntu 12.04 or later, Fedora 21, Debian 8

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the existing issues in the repository
2. Create a new issue with detailed information about the problem
3. Include your operating system and version information

## Future Enhancements

- [ ] Cloud synchronization
- [ ] Advanced reporting and analytics
- [ ] Email notifications for appointments
- [ ] Calendar integration
- [ ] Multi-user support
- [ ] Advanced search filters
- [ ] Data import from CSV/Excel
- [ ] Print functionality
- [ ] Dark theme option
- [ ] Multi-language support

## Changelog

### Version 1.0.0

- Initial release
- Basic customer management
- Appointment scheduling
- Dashboard with statistics
- Data export functionality
- Modern UI design

---

**Built with ❤️ using Electron.js**

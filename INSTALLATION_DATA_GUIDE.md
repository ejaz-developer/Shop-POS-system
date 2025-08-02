# Shop POS System - Installation & Data Management Guide

## 🚀 Installation Files Location

Your compiled application is ready for distribution! The installation files are located at:

### Windows Installer (Recommended)

```
📁 out/make/squirrel.windows/x64/
├── 📦 shop-pos-system-1.0.0 Setup.exe  ← Main installer file
├── 📄 RELEASES
└── 📦 shop_pos_system-1.0.0-full.nupkg
```

### Portable Version

```
📁 out/shop-pos-system-win32-x64/
├── 🎯 shop-pos-system.exe  ← Main executable
├── 📁 locales/
├── 📁 resources/
└── 📄 Various support files...
```

## 💾 Data Management & Cache Clearing

### Application Data Location

Your POS system stores all data in the Windows user data folder:

```
C:\Users\[Username]\AppData\Roaming\shop-pos-system\
├── 📄 config.json          ← All your data (products, sales, customers)
├── 📁 Cache/               ← Temporary files
├── 📁 logs/                ← Application logs
└── 📁 Partitions/          ← Browser data
```

### Built-in Data Management (Easy Way)

The application now includes a **Data Management** section in Settings:

1. **Open the Application**
2. **Navigate to Settings** (⚙️ icon in sidebar)
3. **Scroll to "Data Management" section**

**Available Actions:**

- 🗑️ **Clear All Products** - Removes all inventory items
- 🗑️ **Clear All Sales Reports** - Removes all transaction history
- 🗑️ **Clear All Customers** - Removes all customer data
- ⚠️ **Clear ALL Data** - Removes everything (nuclear option)
- 📁 **Open Data Folder** - Opens the data storage location in File Explorer

### Manual Data Clearing (Advanced)

#### Method 1: Delete Individual Data Types

Navigate to: `C:\Users\[Username]\AppData\Roaming\shop-pos-system\`

Edit `config.json` and set specific arrays to empty:

```json
{
  "products": [],     ← Clear products
  "sales": [],        ← Clear sales reports
  "customers": [],    ← Clear customers
  "settings": {...}   ← Keep settings
}
```

#### Method 2: Complete Reset

**Option A:** Delete the entire folder:

```
C:\Users\[Username]\AppData\Roaming\shop-pos-system\
```

**Option B:** Delete just the data file:

```
C:\Users\[Username]\AppData\Roaming\shop-pos-system\config.json
```

#### Method 3: Using Windows Run Dialog

1. Press `Win + R`
2. Type: `%APPDATA%\shop-pos-system`
3. Press Enter
4. Delete desired files/folders

## 📋 Installation Instructions

### For End Users (Installer)

1. Navigate to your project folder: `out\make\squirrel.windows\x64\`
2. Double-click `shop-pos-system-1.0.0 Setup.exe`
3. Follow the installation wizard
4. Launch from desktop shortcut or Start Menu

### For Portable Use

1. Navigate to: `out\shop-pos-system-win32-x64\`
2. Copy the entire folder to desired location
3. Double-click `shop-pos-system.exe` to run
4. **Important:** Keep all files in the folder together

## 🔄 Data Backup & Migration

### Backup Your Data

**Before clearing data, always backup:**

1. Go to Settings → Data Management
2. Click "Open Data Folder"
3. Copy `config.json` to a safe location

### Restore Data

1. Close the POS application
2. Replace `config.json` in the data folder with your backup
3. Restart the application

### Transfer to Another Computer

1. Export data from old computer (copy `config.json`)
2. Install POS system on new computer
3. Replace the new `config.json` with your backup
4. All products, sales, and customers will be restored

## 🛠️ Distribution Options

### Option 1: Professional Installation

- **File:** `shop-pos-system-1.0.0 Setup.exe` (112 MB)
- **Benefits:** Proper Windows integration, uninstaller, auto-updates
- **Use Case:** Customer installations, business deployments

### Option 2: Portable Distribution

- **Folder:** `shop-pos-system-win32-x64/` (150 MB)
- **Benefits:** No installation required, USB-friendly
- **Use Case:** Demo purposes, temporary setups

## 🔍 Troubleshooting

### Can't Find Data Folder?

1. Open the POS application
2. Go to Settings → Data Management
3. The exact path is displayed under "Application Storage Location"

### App Won't Start After Data Clearing?

1. Make sure you didn't delete the entire application folder
2. Only delete files inside `%APPDATA%\shop-pos-system\`
3. The installed application files should remain intact

### Want to Start Fresh?

Use the built-in "Clear ALL Data" button in Settings for safest reset.

## 📊 What Data Gets Cleared?

| Action             | Products | Sales | Customers | Settings | Shop Info |
| ------------------ | -------- | ----- | --------- | -------- | --------- |
| Clear Products     | ✅       | ❌    | ❌        | ❌       | ❌        |
| Clear Sales        | ❌       | ✅    | ❌        | ❌       | ❌        |
| Clear Customers    | ❌       | ❌    | ✅        | ❌       | ❌        |
| Clear ALL Data     | ✅       | ✅    | ✅        | ❌       | ❌        |
| Delete config.json | ✅       | ✅    | ✅        | ✅       | ✅        |

**Note:** Shop information (name, address, tax rate) is preserved in all "Clear" operations except when manually deleting config.json.

---

**Need Help?** The data management features include confirmation dialogs to prevent accidental data loss. Always backup your data before making major changes!

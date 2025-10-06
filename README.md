# EZ-BET Lucky Draw System

A modern, bilingual (English/Myanmar) lucky draw application with comprehensive admin panel.

## Features

### User Features
- 🎯 Interactive spinning wheel with prizes
- 🌐 Bilingual support (English/Myanmar)
- 🎨 Modern UI with animations and effects
- 🔒 One-spin-per-user validation
- 🏆 Winner board with historical data
- 📱 Fully responsive design

### Admin Features
- 📊 Real-time statistics dashboard
- 👥 User management with search and filtering
- 🗑️ Bulk user deletion capabilities
- 💾 Database reset functionality
- 📤 Data export (JSON/CSV)
- 📥 Data import functionality
- 🔐 Secure admin authentication

## File Structure

```
├── index.html          # Main lucky draw interface
├── luckyspin.css       # Styling for main interface
├── luckyspin.js        # Main application logic
├── admin.html          # Admin panel interface
├── admin.js            # Admin panel logic
├── admin.css           # Admin panel styling
└── README.md           # This file
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. Open `index.html` in a web browser for the main application
2. Open `admin.html` in a web browser for the admin panel

### 3. Admin Access

**Default Admin Credentials:**
- Username: `admin`
- Password: `ezbet123@`

**⚠️ IMPORTANT:** Change these credentials in `admin.js` before deployment!

## API Endpoints

### Public Endpoints
- `POST /api/spin` - Submit a spin result
- `GET /api/spins` - Get all spins (limited to 100)
- `GET /api/test` - Test database connection

### Admin Endpoints
- `GET /api/admin/stats` - Get system statistics
- `POST /api/admin/delete-user` - Delete single user
- `POST /api/admin/batch-delete` - Delete multiple users
- `POST /api/admin/reset-all` - Reset entire database
- `GET /api/admin/export` - Export data (JSON/CSV)
- `POST /api/admin/import` - Import data from file

## Admin Panel Features

### 📊 Statistics Dashboard
- Total users count
- Total spins count
- Total prizes distributed (in MMK)
- Today's spins count

### 👥 User Management
- View all users with their prizes and dates
- Search users by username
- Filter users by date
- Select multiple users for bulk operations
- Individual user deletion

### 🗑️ Bulk Operations
- Select all/deselect all users
- Delete selected users
- Batch delete by username list
- Complete database reset

### 📤 Data Management
- Export data as JSON or CSV
- Import data from JSON or CSV files
- Automatic data validation during import

## Security Features

- One-spin-per-user validation
- Admin authentication
- Input sanitization
- Error handling and logging
- Secure database operations

## Customization

### Changing Admin Credentials
Edit the `ADMIN_CREDENTIALS` object in `admin.js`:
```javascript
const ADMIN_CREDENTIALS = {
    username: 'your_username',
    password: 'your_secure_password'
};
```

### Modifying Prizes
Edit the `prizes` arrays in the `translations` object in `luckyspin.js`:
```javascript
prizes: ["500 MMK", "1,000 MMK", ...] // English
prizes: ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", ...] // Myanmar
```

### Adjusting Prize Probabilities
Modify the `prizeProbabilities` array in `luckyspin.js`:
```javascript
const prizeProbabilities = [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001];
```

## Deployment

1. Deploy the server to a platform like Render, Heroku, or Railway
2. Update the `BACKEND_URL` in both `luckyspin.js` and `admin.js`
3. Serve the HTML files through a web server or CDN
4. Ensure MongoDB connection is properly configured

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please check the code comments or create an issue in the repository.
const Spin = mongoose.model('Spin', spinSchema);

// Configuration schema for prizes and probabilities
const configSchema = new mongoose.Schema({
  prizes: {
    en: [String],
    mm: [String]
  },
  probabilities: [Number],
  totalSpinsBase: { type: Number, default: 1958 },
  displayMode: { type: String, default: 'demo' }, // 'real' or 'demo'
  lastUpdated: { type: Date, default: Date.now }
});

const Config = mongoose.model('Config', configSchema);

// Initialize default configuration
async function initializeConfig() {
  try {
    const existingConfig = await Config.findOne();
    if (!existingConfig) {
      const defaultConfig = new Config({
        prizes: {
          en: ["500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK", "15,000 MMK", "30,000 MMK", "100,000 MMK"],
          mm: ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၂၀၀၀ ကျပ်", "၃၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", "၁၀၀၀၀ ကျပ်", "၁၅၀၀၀ ကျပ်", "၃၀၀၀၀ ကျပ်", "၁၀၀၀၀၀ ကျပ်"]
        },
        probabilities: [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001],
        totalSpinsBase: 1958,
        displayMode: 'demo'
      });
      await defaultConfig.save();
      console.log('✅ Default configuration initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing config:', error);
  }
}

// Initialize config on startup
initializeConfig();

// Save a spin result// Get configuration (prizes, probabilities)
app.get('/api/config', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    res.json({
      success: true,
      config: {
        prizes: config.prizes,
        probabilities: config.probabilities
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get total spins count
app.get('/api/total-spins', async (req, res) => {
  try {
    const config = await Config.findOne();
    const dbSpinCount = await Spin.countDocuments();
    const baseCount = config ? config.totalSpinsBase : 1958;
    const totalSpins = baseCount + dbSpinCount;
    
    res.json({
      success: true,
      totalSpins: totalSpins,
      baseCounter: baseCount,
      dbSpins: dbSpinCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get winner board data
app.get('/api/winner-board', async (req, res) => {
  try {
    const config = await Config.findOne();
    const displayMode = config ? config.displayMode : 'demo';
    
    if (displayMode === 'real') {
      // Return real users with masked usernames
      const spins = await Spin.find().sort({ date: -1 }).limit(10);
      const winners = spins.map((spin, index) => ({
        idx: index + 1,
        en: spin.username.substring(0, 3) + '****',
        mm: spin.username.substring(0, 3) + '****',
        prize: spin.prize
      }));
      
      res.json({
        success: true,
        winners: winners,
        mode: 'real'
      });
    } else {
      // Return demo data
      const demoWinners = [
        { idx: 1, en: "SNTYG****", mm: "SNTYG****", prize: "500 MMK" },
        { idx: 2, en: "SNTnay****", mm: "SNTnay****", prize: "1,000 MMK" },
        { idx: 3, en: "SNTMin****", mm: "SNTMin****", prize: "2,000 MMK" },
        { idx: 4, en: "SNTD****", mm: "SNTD****", prize: "3,000 MMK" },
        { idx: 5, en: "SNTKh*****", mm: "SNTKh*****", prize: "5,000 MMK" },
        { idx: 6, en: "SNTna*****", mm: "SNTna*****", prize: "10,000 MMK" },
        { idx: 7, en: "SNTMi*****", mm: "SNTMi*****", prize: "15,000 MMK" },
        { idx: 8, en: "SNTDE*****", mm: "SNTDE*****", prize: "30,000 MMK" },
        { idx: 9, en: "SNT22*****", mm: "SNT22*****", prize: "100,000 MMK" },
        { idx: 10, en: "SNT32***", mm: "SNT32***", prize: "2,000 MMK" }
      ];
      
      res.json({
        success: true,
        winners: demoWinners,
        mode: 'demo'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test endpoint for database connection
app.get('/api/test', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const spinCount = await Spin.countDocuments();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      database: mongoose.connection.name,
      connectionState: dbState === 1 ? 'Connected' : 'Disconnected',
      spinCount: spinCount,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin endpoints
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { dateFilter } = req.query;
    let query = {};
    
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const spins = await Spin.find(query);
    const totalUsers = spins.length;
    const totalSpins = spins.length;
    
    // Calculate total prize value
    const totalPrizes = spins.reduce((total, spin) => {
      const prizeValue = parseInt(spin.prize.replace(/[^\d]/g, '')) || 0;
      return total + prizeValue;
    }, 0);
    
    // Today's spins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySpins = await Spin.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSpins,
        totalPrizes,
        todaySpins,
        dateLabel: dateFilter ? new Date(dateFilter).toLocaleDateString() : 'All Time'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete single user
app.post('/api/admin/delete-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    const result = await Spin.deleteMany({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch delete users
app.post('/api/admin/batch-delete', async (req, res) => {
  try {
    const { usernames } = req.body;
    if (!usernames || !Array.isArray(usernames)) {
      return res.status(400).json({ success: false, error: 'Usernames array is required' });
    }
    
    const result = await Spin.deleteMany({
      username: { $in: usernames.map(u => new RegExp(`^${u}$`, 'i')) }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset all database
app.post('/api/admin/reset-all', async (req, res) => {
  try {
    await Spin.deleteMany({});
    res.json({ success: true, message: 'All data deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get prizes for admin
app.get('/api/admin/prizes', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    res.json({
      success: true,
      prizes: config.prizes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update prizes
app.post('/api/admin/prizes', async (req, res) => {
  try {
    const { prizes } = req.body;
    const config = await Config.findOne();
    
    if (config) {
      config.prizes = prizes;
      config.lastUpdated = new Date();
      await config.save();
    } else {
      const newConfig = new Config({ prizes });
      await newConfig.save();
    }
    
    res.json({ success: true, message: 'Prizes updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get probabilities
app.get('/api/admin/probabilities', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }
    res.json({
      success: true,
      probabilities: config.probabilities
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update probabilities
app.post('/api/admin/probabilities', async (req, res) => {
  try {
    const { probabilities } = req.body;
    const config = await Config.findOne();
    
    if (config) {
      config.probabilities = probabilities;
      config.lastUpdated = new Date();
      await config.save();
    } else {
      const newConfig = new Config({ probabilities });
      await newConfig.save();
    }
    
    res.json({ success: true, message: 'Probabilities updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export data
app.get('/api/admin/export', async (req, res) => {
  try {
    const { format } = req.query;
    const spins = await Spin.find().sort({ date: -1 });
    
    if (format === 'csv') {
      const csvHeader = 'Username,Prize,Date\n';
      const csvContent = spins.map(spin => 
        `"${spin.username}","${spin.prize}","${spin.date.toISOString()}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="luckyspin-data.csv"');
      res.send(csvHeader + csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="luckyspin-data.json"');
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: spins.length,
        data: spins
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});
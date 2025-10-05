          fetch(`${BACKEND_URL}/api/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prize: wonPrize })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                // Only after backend confirms, set localStorage
                localStorage.setItem("spun_" + username, "true");
                // Save to local spin_records for history (optional)
                const today = new Date().toISOString().slice(0, 10);
                let records = JSON.parse(localStorage.getItem("spin_records") || "[]");
                records.push({ username, date: today, prize: wonPrize });
                localStorage.setItem("spin_records", JSON.stringify(records));
                btn.disabled = true;
              } else {
                resultDiv.innerText = data.error || 'Error saving your spin. Please try again.';
                btn.disabled = false;
              }
            })
            .catch(error => {
              // Backend error, inform user
              console.error('Error saving spin:', error);
              resultDiv.innerText = 'Error saving your spin. Please try again.';
              btn.disabled = false;
            });    .catch(error => {
      // Backend error, fallback: block spin for safety
      console.error('Error verifying spin status:', error);
      resultDiv.innerText = 'Cannot verify spin status. Please try again later.';
      btn.disabled = false;
    });      .catch(error => {
        // If backend fails, block spin for safety
        console.error('Error checking spin status:', error);
        btn.disabled = true;
        document.getElementById("result").innerText = 'Cannot verify spin status.';
      });// Error Popup Notification Function
function showErrorPopup(message) {// Auto-run database test on page load (for debugging)
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 Running database connection test...');
  testDatabaseConnection();
});// Load and display total spin count
async function loadTotalSpinCount() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/total-spins`);
    const data = await response.json();
    
    if (data.success) {
      const totalCount = data.totalSpins || 1958;
      document.getElementById('totalSpinNumber').textContent = totalCount.toLocaleString();
      console.log(`Total spins loaded: ${totalCount}`);
    }
  } catch (error) {
    console.log('Server unavailable, using default count');
    document.getElementById('totalSpinNumber').textContent = '1958';
  }
}// Increment total spin counter with animation
function incrementSpinCounter() {
  const counterElement = document.getElementById('totalSpinNumber');
  const currentCount = parseInt(counterElement.textContent.replace(/,/g, '')) || 1958;
  const newCount = currentCount + 1;
  
  // Animate the increment
  counterElement.style.animation = 'counterIncrement 0.6s ease-out';
  
  setTimeout(() => {
    counterElement.textContent = newCount.toLocaleString();
    counterElement.style.animation = '';
  }, 300);
  
  console.log(`Spin counter incremented: ${currentCount} → ${newCount}`);
}document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lang-en").onclick = () => setLanguage("en");
  document.getElementById("lang-mm").onclick = () => setLanguage("mm");
  
  // Load configuration and total spin count, then set language
  loadConfig().then(() => {
    setLanguage("mm"); // default
  });
  loadTotalSpinCount();
  
  // Sync with server every 30 seconds
  setInterval(() => {
    loadTotalSpinCount();
  }, 30000);
});          // --- Save to backend ---
          fetch(`${BACKEND_URL}/api/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prize: wonPrize })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                btn.disabled = true;
                console.log('Spin saved successfully to database');
              } else {
                resultDiv.innerText = data.error || 'Error saving your spin. Please try again.';
                btn.disabled = false;
              }
            })
            .catch(error => {
              // Backend error, inform user
              console.error('Error saving spin:', error);
              resultDiv.innerText = 'Error saving your spin. Please try again.';
              btn.disabled = false;
            });
// Example code to delete download history entries from db.json users
// This should be integrated into your existing service

const deleteDownloadHistory = async (userId, historyId) => {
  try {
    // Read current db.json
    const response = await fetch('/api/db.json');
    const data = await response.json();
    
    // Find user and remove history entry
    const user = data.users.find(u => u.id === userId);
    if (user && user.downloadHistory) {
      user.downloadHistory = user.downloadHistory.filter(h => h.id !== historyId);
      
      // Update the user's download count
      user.downloads = user.downloadHistory.length;
      
      // Save back to db.json (this requires a backend endpoint)
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    }
  } catch (error) {
    console.error('Error deleting download history:', error);
    throw error;
  }
};

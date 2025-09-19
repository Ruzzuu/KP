// UserService.js - Service to manage users in db.json
export const UserService = {
  // Delete a user entirely from db.json
  async deleteUser(userId) {
    try {
      // This requires a backend API endpoint that can modify db.json
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        return true;
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Alternative: local simulation (won't persist to db.json)
  async deleteUserLocal(userId) {
    // This only works in memory, not persistent
    const users = this.getLocalUsers();
    const updatedUsers = users.filter(user => user.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return true;
  },

  getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch {
      return [];
    }
  }
};

// JWT Debug Script for Browser Console
// Copy and paste this entire script into browser console

console.log('🔧 JWT Debug Script loaded');
console.log('========================');

// Debug current token
function debugCurrentToken() {
  console.log('=== JWT Token Debug ===');
  
  const rawToken = localStorage.getItem('token');
  console.log('Raw token from localStorage:', rawToken);
  
  let token = rawToken;
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (typeof parsed === 'string') {
        token = parsed;
      }
    } catch {
      // Token is already a plain string
    }
  }
  
  console.log('Parsed token:', token);
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);
  console.log('Token first 50 chars:', token?.substring(0, 50));
  
  if (token) {
    const parts = token.split('.');
    console.log('Token parts count:', parts.length);
    console.log('Is valid JWT format:', parts.length === 3);
    
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token header:', header);
      console.log('Token payload:', payload);
      console.log('Token expiry:', new Date(payload.exp * 1000));
      console.log('Is token expired:', Date.now() >= payload.exp * 1000);
    } catch (e) {
      console.log('Failed to decode token:', e);
    }
  }
  
  console.log('Authorization header:', `Bearer ${token}`.substring(0, 60) + '...');
}

// Clear all auth data
function clearAllAuthData() {
  console.log('🧹 Clearing all authentication data...');
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('jwt');
  
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('jwt');
  
  console.log('✅ All authentication data cleared');
}

// Quick fix function
function quickFix() {
  console.log('🚨 JWT Authentication Quick Fix');
  console.log('================================');
  
  debugCurrentToken();
  clearAllAuthData();
  
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Refresh the page (F5)');
  console.log('2. Logout completely from the app');
  console.log('3. Login again with your credentials');
  console.log('4. Try uploading photos again');
}

// Available commands
console.log('Available commands:');
console.log('- debugCurrentToken() - Show current token details');
console.log('- clearAllAuthData() - Clear all stored tokens');
console.log('- quickFix() - Complete JWT reset with instructions');
console.log('');
console.log('Example usage:');
console.log('debugCurrentToken();');
console.log('quickFix();');

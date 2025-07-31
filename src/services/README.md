# Authentication API Service

This document describes the implementation of the authentication API service for the Martyx Industries application.

## Overview

The authentication API service provides functions for communicating with the backend API for user authentication, including login, registration, and logout.

## Files

- `api.ts`: Contains the API client configuration and authentication endpoints.
- `AuthProvider.tsx`: Implements the AuthContext provider that uses the API service.
- `AuthContext.tsx`: Defines the shape of the authentication context.
- `useAuth.tsx`: Custom hook for accessing the authentication context.

## API Endpoints

### Login

```typescript
authApi.login(email: string, password: string): Promise<{ user: User, token: string }>
```

This function sends a POST request to the `/auth/login` endpoint with the user's email and password. It returns a Promise that resolves to an object containing the user data and an authentication token.

### Registration

```typescript
authApi.register(name: string, email: string, password: string): Promise<{ user: User, token: string }>
```

This function sends a POST request to the `/auth/register` endpoint with the user's name, email, and password. It returns a Promise that resolves to an object containing the user data and an authentication token.

### Logout

```typescript
authApi.logout(token: string): Promise<void>
```

This function sends a POST request to the `/auth/logout` endpoint with the user's authentication token. It returns a Promise that resolves when the logout is complete.

## Token Management

The API service includes functions for managing the authentication token:

- `setAuthToken(token: string)`: Sets the authentication token for future API requests.
- `removeAuthToken()`: Removes the authentication token from future API requests.

## Usage

To use the authentication API service, import the `useAuth` hook:

```typescript
import { useAuth } from '../context/useAuth';

const MyComponent = () => {
  const { login, register, logout, user, isAuthenticated } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      const success = await login(email, password);
      if (success) {
        // Login successful
      } else {
        // Login failed
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      const success = await register(name, email, password);
      if (success) {
        // Registration successful
      } else {
        // Registration failed
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Logout successful
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <p>Please login or register</p>
          {/* Login/Register forms */}
        </div>
      )}
    </div>
  );
};
```

## Configuration

The API base URL is configured in `api.ts`. Update the `API_BASE_URL` constant to point to your backend API:

```typescript
const API_BASE_URL = 'https://api.example.com'; // Replace with your actual API base URL
```
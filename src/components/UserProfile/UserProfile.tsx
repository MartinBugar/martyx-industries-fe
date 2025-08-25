import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import './UserProfile.css';

interface UserProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const UserProfile: React.FC = () => {
  const { user, updateProfile, fetchProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<UserProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || ''
  });

  // Fetch user profile data only when user ID changes
  useEffect(() => {
    const getProfileData = async () => {
      // Only fetch if user exists and we haven't fetched for this user ID yet
      if (user && lastFetchedUserIdRef.current !== user.id) {
        setIsFetching(true);
        setError(null);
        
        try {
          const success = await fetchProfile();
          if (success) {
            // Store the user ID we just fetched for
            lastFetchedUserIdRef.current = user.id;
          } else {
            setError('Failed to fetch profile data. Please try again later.');
          }
        } catch (err) {
          setError('An error occurred while fetching profile data.');
          console.error('Fetch profile error:', err);
        } finally {
          setIsFetching(false);
        }
      }
    };
    
    getProfileData();
  }, [user, fetchProfile]);

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      });
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set loading state and clear messages
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Update user profile
      const success = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        }
      });
      
      if (success) {
        setSuccessMessage('Profile updated successfully!');
        // Exit edit mode
        setIsEditing(false);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while updating your profile.');
      console.error('Update profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    
    // Reset form data and clear messages when entering edit mode
    if (!isEditing) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || ''
      });
      setError(null);
      setSuccessMessage(null);
    }
  };

  // Listen for edit profile event from navigation
  useEffect(() => {
    const handleEditProfile = () => {
      if (!isEditing) {
        toggleEditMode();
      }
    };

    window.addEventListener('editProfile', handleEditProfile);
    return () => window.removeEventListener('editProfile', handleEditProfile);
  }, [isEditing]);

  if (!user) {
    return (
      <div className="profile-empty-state">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Show loading indicator while fetching profile data */}
      {isFetching && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      )}
      
      {/* Show error message if there's an error */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Show success message if profile was updated successfully */}
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}
      
      {!isEditing ? (
        <>
          <div className="profile-sections">
            <div className="profile-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="profile-card">
                <div className="profile-field">
                  <div className="field-label">Email</div>
                  <div className="field-value">{user.email}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Full Name</div>
                  <div className="field-value">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.name || 'Not provided'}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Phone</div>
                  <div className="field-value">{user.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3 className="section-title">Shipping Address</h3>
              <div className="profile-card">
                {user.address && (Object.values(user.address).some(value => value)) ? (
                  <>
                    <div className="profile-field">
                      <div className="field-label">Street</div>
                      <div className="field-value">{user.address.street || 'Not provided'}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">City</div>
                      <div className="field-value">{user.address.city || 'Not provided'}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">State/Province</div>
                      <div className="field-value">{user.address.state || 'Not provided'}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">ZIP/Postal Code</div>
                      <div className="field-value">{user.address.zipCode || 'Not provided'}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">Country</div>
                      <div className="field-value">{user.address.country || 'Not provided'}</div>
                    </div>
                  </>
                ) : (
                  <div className="empty-address">
                    <p>No address information provided.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h3>Edit Profile</h3>
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={toggleEditMode}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Show error message in form if there's an error */}
          {error && (
            <div className="form-error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-sections">
            <div className="form-section">
              <h4 className="section-title">Personal Information</h4>
              <div className="form-card">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4 className="section-title">Shipping Address</h4>
              <div className="form-card">
                <div className="form-group">
                  <label htmlFor="street">Street Address</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state/province"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="Enter ZIP/postal code"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
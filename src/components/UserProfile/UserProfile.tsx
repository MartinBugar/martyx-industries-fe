import React, { useState } from 'react';
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
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update user profile
    updateProfile({
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
    
    // Exit edit mode
    setIsEditing(false);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    
    // Reset form data when entering edit mode
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
    }
  };

  if (!user) {
    return (
      <div className="user-profile-container">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h2>User Profile</h2>
        <button 
          className="edit-profile-btn"
          onClick={toggleEditMode}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
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
            />
          </div>
          
          <h3>Address</h3>
          
          <div className="form-group">
            <label htmlFor="street">Street</label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
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
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              Save Changes
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={toggleEditMode}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-section">
            <h3>Account Information</h3>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.name}
              </span>
            </div>
            {user.phone && (
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{user.phone}</span>
              </div>
            )}
          </div>
          
          {user.address && (
            <div className="info-section">
              <h3>Address</h3>
              {user.address.street && (
                <div className="info-row">
                  <span className="info-label">Street:</span>
                  <span className="info-value">{user.address.street}</span>
                </div>
              )}
              {(user.address.city || user.address.state) && (
                <div className="info-row">
                  <span className="info-label">City/State:</span>
                  <span className="info-value">
                    {[user.address.city, user.address.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(user.address.zipCode || user.address.country) && (
                <div className="info-row">
                  <span className="info-label">ZIP/Country:</span>
                  <span className="info-value">
                    {[user.address.zipCode, user.address.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
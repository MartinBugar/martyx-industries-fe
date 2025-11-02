import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button, Badge } from '../../components/ui';
import {
  adminSegmentsService,
  type CustomerSegment,
  type CreateSegmentRequest,
} from '../../services/adminSegmentsService';
import './AdminSegments.css';

const AdminSegments: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');

  // Data state
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<number | null>(null);

  // Form state for creating/editing segment
  const [formData, setFormData] = useState<CreateSegmentRequest>({
    segmentName: '',
    segmentCode: '',
    segmentType: 'VALUE_BASED',
    description: '',
    criteria: '{\n  "total_orders": {"gte": 5},\n  "total_spent": {"gte": 500}\n}',
    autoUpdateEnabled: true,
  });

  // Load segments
  const loadSegments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminSegmentsService.getSegments();
      setSegments(response || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error('Failed to load segments'));
    } finally {
      setIsLoading(false);
    }
  };

  // Create segment
  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validate JSON criteria
      JSON.parse(formData.criteria);

      await adminSegmentsService.createSegment(formData);
      alert('Segment created successfully!');
      setFormData({
        segmentName: '',
        segmentCode: '',
        segmentType: 'VALUE_BASED',
        description: '',
        criteria: '{\n  "total_orders": {"gte": 5},\n  "total_spent": {"gte": 500}\n}',
        autoUpdateEnabled: true,
      });
      await loadSegments();
      setActiveTab('list');
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        alert('Invalid JSON in criteria field');
      } else {
        alert(e instanceof Error ? e.message : 'Failed to create segment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update segment
  const handleUpdateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment) return;

    setIsLoading(true);
    try {
      // Validate JSON criteria
      JSON.parse(formData.criteria);

      await adminSegmentsService.updateSegment(selectedSegment.id, formData);
      alert('Segment updated successfully!');
      setSelectedSegment(null);
      await loadSegments();
      setActiveTab('list');
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        alert('Invalid JSON in criteria field');
      } else {
        alert(e instanceof Error ? e.message : 'Failed to update segment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete segment
  const handleDeleteSegment = async (segmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;

    try {
      await adminSegmentsService.deleteSegment(segmentId);
      alert('Segment deleted successfully!');
      await loadSegments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete segment');
    }
  };

  // Recalculate segment
  const handleRecalculateSegment = async (segmentId: number) => {
    setIsRecalculating(segmentId);
    try {
      await adminSegmentsService.recalculateSegment(segmentId);
      alert('Segment recalculated successfully!');
      await loadSegments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to recalculate segment');
    } finally {
      setIsRecalculating(null);
    }
  };

  // Recalculate all segments
  const handleRecalculateAll = async () => {
    if (!window.confirm('Recalculate all segments? This may take a while.')) return;

    setIsLoading(true);
    try {
      await adminSegmentsService.recalculateAllSegments();
      alert('All segments recalculated successfully!');
      await loadSegments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to recalculate segments');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit segment handler
  const handleEditSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    setFormData({
      segmentName: segment.segmentName,
      segmentCode: segment.segmentCode,
      segmentType: segment.segmentType,
      description: segment.description || '',
      criteria: segment.criteria,
      autoUpdateEnabled: segment.autoUpdateEnabled,
    });
    setActiveTab('edit');
  };

  // Load data on mount
  useEffect(() => {
    loadSegments();
  }, []);

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  // Get segment type badge variant
  const getSegmentTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' => {
    switch (type) {
      case 'VALUE_BASED': return 'success';
      case 'BEHAVIORAL': return 'warning';
      case 'RECENCY': return 'danger';
      default: return 'default';
    }
  };

  // Navigation tabs
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'list' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('list');
          setSelectedSegment(null);
        }}
        aria-label="View all segments"
      >
        <Users size={16} />
        All Segments
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('create');
          setSelectedSegment(null);
          setFormData({
            segmentName: '',
            segmentCode: '',
            segmentType: 'VALUE_BASED',
            description: '',
            criteria: '{\n  "total_orders": {"gte": 5},\n  "total_spent": {"gte": 500}\n}',
            autoUpdateEnabled: true,
          });
        }}
        aria-label="Create new segment"
      >
        <Plus size={16} />
        Create New
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Customer Segments" navTabs={navTabs}>
      <div className="admin-segments">

        {/* ALL SEGMENTS TAB */}
        {activeTab === 'list' && (
          <div className="segments-list">
            <div className="segments-header">
              <h2>Customer Segments</h2>
              <Button variant="outline" onClick={handleRecalculateAll}>
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                Recalculate All
              </Button>
            </div>

            {isLoading ? (
              <div className="loading">Loading segments...</div>
            ) : error ? (
              <div className="error">Error: {error.message}</div>
            ) : segments.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No segments yet</h3>
                <p>Create your first customer segment to get started</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus size={16} />
                  Create Segment
                </Button>
              </div>
            ) : (
              <div className="segments-grid">
                {segments.map((segment) => (
                  <div key={segment.id} className="segment-card">
                    <div className="segment-header">
                      <h3>{segment.segmentName}</h3>
                      <Badge variant={getSegmentTypeVariant(segment.segmentType)}>
                        {segment.segmentType.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="segment-meta">
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{segment.memberCount} members</span>
                      </div>
                      {segment.description && (
                        <p className="segment-description">{segment.description}</p>
                      )}
                    </div>

                    <div className="segment-criteria">
                      <strong>Criteria:</strong>
                      <pre>{segment.criteria}</pre>
                    </div>

                    <div className="segment-footer">
                      <div className="segment-status">
                        {segment.autoUpdateEnabled && (
                          <Badge size="sm" variant="success">Auto-update</Badge>
                        )}
                        {segment.lastCalculatedAt && (
                          <span className="last-calc">
                            Last calculated: {formatDate(segment.lastCalculatedAt)}
                          </span>
                        )}
                      </div>
                      <div className="segment-actions">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecalculateSegment(segment.id)}
                          disabled={isRecalculating === segment.id}
                        >
                          <RefreshCw size={14} style={{ marginRight: 4 }} />
                          {isRecalculating === segment.id ? 'Recalculating...' : 'Recalculate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSegment(segment)}
                        >
                          <Edit size={14} style={{ marginRight: 4 }} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSegment(segment.id)}
                        >
                          <Trash2 size={14} style={{ marginRight: 4 }} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE SEGMENT TAB */}
        {activeTab === 'create' && (
          <div className="create-segment">
            <form onSubmit={handleCreateSegment} className="segment-form">
              <h2>Create New Segment</h2>

              <div className="form-group">
                <label htmlFor="segmentName">Segment Name *</label>
                <input
                  type="text"
                  id="segmentName"
                  value={formData.segmentName}
                  onChange={(e) => setFormData({ ...formData, segmentName: e.target.value })}
                  placeholder="e.g., VIP Customers"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="segmentCode">Segment Code *</label>
                <input
                  type="text"
                  id="segmentCode"
                  value={formData.segmentCode}
                  onChange={(e) => setFormData({ ...formData, segmentCode: e.target.value })}
                  placeholder="e.g., VIP_CUSTOMERS"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="segmentType">Segment Type *</label>
                <select
                  id="segmentType"
                  value={formData.segmentType}
                  onChange={(e) => setFormData({ ...formData, segmentType: e.target.value as any })}
                  required
                >
                  <option value="VALUE_BASED">Value Based</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="RECENCY">Recency</option>
                  <option value="DEMOGRAPHIC">Demographic</option>
                  <option value="ENGAGEMENT">Engagement</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this segment..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="criteria">Criteria (JSON) *</label>
                <textarea
                  id="criteria"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  placeholder='{"total_orders": {"gte": 5}}'
                  rows={10}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
                <small>
                  Available fields: total_orders, total_spent, average_order_value, days_since_last_order, days_since_registration<br />
                  Operators: gte (≥), lte (≤), gt (&gt;), lt (&lt;), eq (=)
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.autoUpdateEnabled}
                    onChange={(e) => setFormData({ ...formData, autoUpdateEnabled: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Auto-update enabled (automatically recalculate members)
                </label>
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Segment'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* EDIT SEGMENT TAB */}
        {activeTab === 'edit' && selectedSegment && (
          <div className="edit-segment">
            <form onSubmit={handleUpdateSegment} className="segment-form">
              <h2>Edit Segment: {selectedSegment.segmentName}</h2>

              <div className="form-group">
                <label htmlFor="segmentName">Segment Name *</label>
                <input
                  type="text"
                  id="segmentName"
                  value={formData.segmentName}
                  onChange={(e) => setFormData({ ...formData, segmentName: e.target.value })}
                  placeholder="e.g., VIP Customers"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="segmentCode">Segment Code *</label>
                <input
                  type="text"
                  id="segmentCode"
                  value={formData.segmentCode}
                  onChange={(e) => setFormData({ ...formData, segmentCode: e.target.value })}
                  placeholder="e.g., VIP_CUSTOMERS"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="segmentType">Segment Type *</label>
                <select
                  id="segmentType"
                  value={formData.segmentType}
                  onChange={(e) => setFormData({ ...formData, segmentType: e.target.value as any })}
                  required
                >
                  <option value="VALUE_BASED">Value Based</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="RECENCY">Recency</option>
                  <option value="DEMOGRAPHIC">Demographic</option>
                  <option value="ENGAGEMENT">Engagement</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this segment..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="criteria">Criteria (JSON) *</label>
                <textarea
                  id="criteria"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  placeholder='{"total_orders": {"gte": 5}}'
                  rows={10}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
                <small>
                  Available fields: total_orders, total_spent, average_order_value, days_since_last_order, days_since_registration<br />
                  Operators: gte (≥), lte (≤), gt (&gt;), lt (&lt;), eq (=)
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.autoUpdateEnabled}
                    onChange={(e) => setFormData({ ...formData, autoUpdateEnabled: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Auto-update enabled (automatically recalculate members)
                </label>
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Segment'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSegments;

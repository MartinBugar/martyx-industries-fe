import React from 'react';
import { Trash2, Globe, X } from 'lucide-react';
import { Button } from '../ui';
import './BulkActionsBar.css';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMakePublic: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onMakePublic,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-info">
        <strong>{selectedCount}</strong> photo{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="bulk-actions-buttons">
        <Button
          variant="outline"
          size="sm"
          icon={Globe}
          onClick={onMakePublic}
          disabled={isLoading}
        >
          Make Public
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={onDelete}
          disabled={isLoading}
          loading={isLoading}
        >
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={X}
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;

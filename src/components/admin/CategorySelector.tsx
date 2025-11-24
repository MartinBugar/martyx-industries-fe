import React, { useEffect, useState } from 'react';
import { adminCategoryService } from '../../services/adminCategoryService';
import { adminProductCategoryService } from '../../services/adminProductCategoryService';
import { ProductCategory } from '../../types/category';
import { X } from 'lucide-react';

interface CategorySelectorProps {
    productId: number;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ productId }) => {
    const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load all categories and selected categories
    useEffect(() => {
        loadData();
    }, [productId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [allCats, selectedCats] = await Promise.all([
                adminCategoryService.getAllCategories(),
                adminProductCategoryService.getProductCategories(productId)
            ]);
            setAllCategories(allCats);
            setSelectedCategories(selectedCats);
        } catch (err) {
            console.error('Failed to load categories:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCategory = async (category: ProductCategory) => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const isSelected = selectedCategories.some(c => c.id === category.id);

            if (isSelected) {
                // Remove category
                await adminProductCategoryService.removeCategory(productId, category.id);
                setSelectedCategories(prev => prev.filter(c => c.id !== category.id));
                setSuccess(`Removed category: ${category.name}`);
            } else {
                // Add category
                await adminProductCategoryService.addCategory(productId, category.id);
                setSelectedCategories(prev => [...prev, category]);
                setSuccess(`Added category: ${category.name}`);
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Failed to toggle category:', err);
            setError('Failed to update categories');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading categories...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fafafa' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
                Product Categories
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                Assign this product to one or more categories. Categories are displayed in the golden category bar on the products page.
            </p>

            {/* Alerts */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '14px',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: '12px 16px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    color: '#16a34a',
                    fontSize: '14px',
                    marginBottom: '16px'
                }}>
                    {success}
                </div>
            )}

            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                        Selected Categories:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedCategories.map(category => (
                            <div
                                key={category.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #B8860B 0%, #9A7209 100%)',
                                    color: '#2C1810',
                                    borderRadius: '16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                                onClick={() => !saving && handleToggleCategory(category)}
                            >
                                {category.icon && <span>{category.icon}</span>}
                                <span>{category.name}</span>
                                <X size={14} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Categories */}
            <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Available Categories:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {allCategories
                        .filter(cat => !selectedCategories.some(sc => sc.id === cat.id))
                        .map(category => (
                            <button
                                key={category.id}
                                onClick={() => handleToggleCategory(category)}
                                disabled={saving || !category.isActive}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: category.isActive ? '#ffffff' : '#f3f4f6',
                                    color: category.isActive ? '#1f2937' : '#9ca3af',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: saving || !category.isActive ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (category.isActive && !saving) {
                                        e.currentTarget.style.background = '#f9fafb';
                                        e.currentTarget.style.borderColor = '#B8860B';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (category.isActive) {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                    }
                                }}
                            >
                                {category.icon && <span>{category.icon}</span>}
                                <span>{category.name}</span>
                                {!category.isActive && <span style={{ fontSize: '12px' }}>(inactive)</span>}
                            </button>
                        ))}
                </div>
            </div>

            {allCategories.length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                }}>
                    No categories available. Create categories first in the Categories admin panel.
                </div>
            )}
        </div>
    );
};

export default CategorySelector;

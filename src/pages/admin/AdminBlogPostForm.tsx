/**
 * Admin Blog Post Form Page
 * Vytvorenie a úprava blogových článkov
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  getPostById,
  createPost,
  updatePost,
  getAllCategories,
  getAllTags,
  getStatuses,
  formatScheduledAt,
  parseScheduledAt,
  type BlogCategoryDto,
  type BlogTagDto,
  type CreateBlogPostRequest,
  type UpdateBlogPostRequest,
  type StatusOption
} from '../../services/adminBlogService';
import {
  FileText,
  Save,
  ArrowLeft,
  Image,
  Tag,
  Calendar,
  Settings,
  Eye,
  Clock,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { logError } from '../../services/logger';
import './AdminBlogPostForm.css';

const AdminBlogPostForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';

  // Form data
  const [formData, setFormData] = useState<CreateBlogPostRequest>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    featuredImageAlt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'DRAFT',
    categoryId: undefined,
    tagIds: [],
    relatedProductIds: '',
    scheduledAt: '',
    featured: false,
    allowComments: true
  });

  // Reference data
  const [categories, setCategories] = useState<BlogCategoryDto[]>([]);
  const [tags, setTags] = useState<BlogTagDto[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Load post data if editing
  const loadPost = useCallback(async () => {
    if (!isEditing) return;

    setLoading(true);
    try {
      const post = await getPostById(parseInt(id!));
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        featuredImage: post.featuredImage || '',
        featuredImageAlt: post.featuredImageAlt || '',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
        metaKeywords: post.metaKeywords || '',
        status: post.status,
        categoryId: post.categoryId || undefined,
        tagIds: post.tags?.map(t => t.id) || [],
        relatedProductIds: post.relatedProductIds || '',
        scheduledAt: parseScheduledAt(post.scheduledAt),
        featured: post.featured,
        allowComments: post.allowComments
      });
      setSlugManuallyEdited(true); // Don't auto-generate slug when editing
    } catch (err) {
      logError('Failed to load post:', err);
      setError('Nepodarilo sa načítať článok');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    try {
      const [categoriesData, tagsData, statusesData] = await Promise.all([
        getAllCategories(),
        getAllTags(),
        getStatuses()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
      setStatuses(statusesData);
    } catch (err) {
      logError('Failed to load reference data:', err);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
    loadPost();
  }, [loadReferenceData, loadPost]);

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .replace(/^-|-$/g, ''); // Trim hyphens
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title)
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({
      ...prev,
      slug: e.target.value
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagToggle = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...(prev.tagIds || []), tagId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Názov článku je povinný');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const request = {
        ...formData,
        categoryId: formData.categoryId || undefined,
        scheduledAt: formatScheduledAt(formData.scheduledAt)
      };

      if (isEditing) {
        await updatePost(parseInt(id!), request as UpdateBlogPostRequest);
      } else {
        await createPost(request);
      }

      navigate('/admin/blog/posts');
    } catch (err: any) {
      logError('Failed to save post:', err);
      setError(err.response?.data?.message || 'Nepodarilo sa uložiť článok');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.title.trim()) {
      setError('Názov článku je povinný');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const request = {
        ...formData,
        status: 'DRAFT', // Force DRAFT status
        categoryId: formData.categoryId || undefined,
        scheduledAt: formatScheduledAt(formData.scheduledAt)
      };

      if (isEditing) {
        await updatePost(parseInt(id!), request as UpdateBlogPostRequest);
      } else {
        await createPost(request);
      }

      navigate('/admin/blog/posts');
    } catch (err: any) {
      logError('Failed to save post:', err);
      setError(err.response?.data?.message || 'Nepodarilo sa uložiť článok');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Upraviť článok' : 'Nový článok'}>
        <div className="admin-blog-post-form">
          <div className="loading-state">
            <Clock size={32} className="spinning" />
            <span>Načítavam...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Upraviť článok' : 'Nový článok'}>
      <div className="admin-blog-post-form">
        {/* Header */}
        <div className="form-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/admin/blog/posts')}>
              <ArrowLeft size={20} />
            </button>
            <h1>
              <FileText size={24} />
              {isEditing ? 'Upraviť článok' : 'Nový článok'}
            </h1>
          </div>
          <div className="header-actions">
            {isEditing && formData.slug && (
              <a
                href={`/blog/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-preview"
              >
                <Eye size={16} />
                Náhľad
              </a>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveAsDraft}
              disabled={saving}
            >
              Uložiť ako koncept
            </button>
            <button
              type="submit"
              form="post-form"
              className="btn-primary"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="form-tabs">
          <button
            className={`form-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FileText size={16} />
            Obsah
          </button>
          <button
            className={`form-tab ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <Eye size={16} />
            SEO
          </button>
          <button
            className={`form-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            Nastavenia
          </button>
        </div>

        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-layout">
            {/* Main Content */}
            <div className="form-main">
              {activeTab === 'content' && (
                <>
                  {/* Title */}
                  <div className="form-group">
                    <label htmlFor="title">Názov článku *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Zadajte názov článku"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div className="form-group">
                    <label htmlFor="slug">URL slug</label>
                    <div className="slug-input">
                      <span className="slug-prefix">/blog/</span>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        placeholder="url-slug"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="form-group">
                    <label htmlFor="excerpt">Úryvok</label>
                    <textarea
                      id="excerpt"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleChange}
                      placeholder="Krátky popis článku..."
                      rows={3}
                    />
                    <span className="char-count">
                      {formData.excerpt?.length || 0}/500
                    </span>
                  </div>

                  {/* Content */}
                  <div className="form-group">
                    <label htmlFor="content">Obsah článku</label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Napíšte obsah článku... (podporuje HTML)"
                      rows={20}
                      className="content-editor"
                    />
                  </div>

                  {/* Featured Image */}
                  <div className="form-group">
                    <label>
                      <Image size={16} />
                      Hlavný obrázok
                    </label>
                    <div className="image-input-group">
                      <input
                        type="text"
                        name="featuredImage"
                        value={formData.featuredImage}
                        onChange={handleChange}
                        placeholder="URL obrázka"
                      />
                      {formData.featuredImage && (
                        <img
                          src={formData.featuredImage}
                          alt="Preview"
                          className="image-preview"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      name="featuredImageAlt"
                      value={formData.featuredImageAlt}
                      onChange={handleChange}
                      placeholder="Alt text obrázka"
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <>
                  {/* Meta Title */}
                  <div className="form-group">
                    <label htmlFor="metaTitle">Meta Title</label>
                    <input
                      type="text"
                      id="metaTitle"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      placeholder="SEO titulok (max 70 znakov)"
                      maxLength={70}
                    />
                    <span className="char-count">
                      {formData.metaTitle?.length || 0}/70
                    </span>
                  </div>

                  {/* Meta Description */}
                  <div className="form-group">
                    <label htmlFor="metaDescription">Meta Description</label>
                    <textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleChange}
                      placeholder="SEO popis (max 160 znakov)"
                      rows={3}
                      maxLength={160}
                    />
                    <span className="char-count">
                      {formData.metaDescription?.length || 0}/160
                    </span>
                  </div>

                  {/* Meta Keywords */}
                  <div className="form-group">
                    <label htmlFor="metaKeywords">Meta Keywords</label>
                    <input
                      type="text"
                      id="metaKeywords"
                      name="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={handleChange}
                      placeholder="kľúčové, slová, oddelené, čiarkami"
                    />
                  </div>

                  {/* SEO Preview */}
                  <div className="seo-preview">
                    <h4>Náhľad vo vyhľadávači</h4>
                    <div className="preview-box">
                      <div className="preview-title">
                        {formData.metaTitle || formData.title || 'Názov článku'}
                      </div>
                      <div className="preview-url">
                        martyx-industries.com/blog/{formData.slug || 'url-slug'}
                      </div>
                      <div className="preview-description">
                        {formData.metaDescription || formData.excerpt || 'Popis článku...'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'settings' && (
                <>
                  {/* Scheduled At */}
                  <div className="form-group">
                    <label htmlFor="scheduledAt">
                      <Calendar size={16} />
                      Naplánovať publikovanie
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledAt"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleChange}
                    />
                    <span className="help-text">
                      Ak nastavíte dátum, článok bude automaticky publikovaný v danom čase
                    </span>
                  </div>

                  {/* Related Products */}
                  <div className="form-group">
                    <label htmlFor="relatedProductIds">Súvisiace produkty</label>
                    <input
                      type="text"
                      id="relatedProductIds"
                      name="relatedProductIds"
                      value={formData.relatedProductIds}
                      onChange={handleChange}
                      placeholder="ID produktov oddelené čiarkami (napr. 1,2,3)"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                      />
                      <span className="checkmark"></span>
                      Odporúčaný článok
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="allowComments"
                        checked={formData.allowComments}
                        onChange={handleChange}
                      />
                      <span className="checkmark"></span>
                      Povoliť komentáre
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="form-sidebar">
              {/* Status */}
              <div className="sidebar-card">
                <h3>Stav</h3>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statuses.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="sidebar-card">
                <h3>Kategória</h3>
                <select
                  name="categoryId"
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    categoryId: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                >
                  <option value="">Bez kategórie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="sidebar-card">
                <h3>
                  <Tag size={16} />
                  Štítky
                </h3>
                <div className="tags-list">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`tag-chip ${formData.tagIds?.includes(tag.id) ? 'selected' : ''}`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {formData.tagIds?.includes(tag.id) && <Check size={12} />}
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogPostForm;

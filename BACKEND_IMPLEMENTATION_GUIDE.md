# Backend Implementation Guide
## Build Progress Tracker & Community Features

This document provides comprehensive instructions for implementing the backend functionality for the Build Progress Tracker and Community Features that have been added to the user account section.

## 🏗️ Build Progress Tracker Backend

### Database Schema

#### Build Projects Table
```sql
CREATE TABLE build_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    total_time_spent INTEGER DEFAULT 0, -- minutes
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_build_projects_user_id ON build_projects(user_id);
CREATE INDEX idx_build_projects_status ON build_projects(status);
```

#### Build Steps Table
```sql
CREATE TABLE build_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES build_projects(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0, -- minutes
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(project_id, step_order)
);

CREATE INDEX idx_build_steps_project_id ON build_steps(project_id);
```

#### Build Step Photos Table
```sql
CREATE TABLE build_step_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES build_steps(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_build_step_photos_step_id ON build_step_photos(step_id);
```

#### Build Problems Table
```sql
CREATE TABLE build_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES build_steps(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    solution TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_build_problems_step_id ON build_problems(step_id);
CREATE INDEX idx_build_problems_severity ON build_problems(severity);
```

### API Endpoints

#### Build Projects CRUD
```typescript
// GET /api/build-projects
// Get all build projects for authenticated user
interface GetBuildProjectsResponse {
  projects: BuildProject[];
  total: number;
}

// POST /api/build-projects
// Create new build project
interface CreateBuildProjectRequest {
  name: string;
  modelName: string;
  steps?: Array<{
    title: string;
    description: string;
  }>;
}

// GET /api/build-projects/:id
// Get specific build project with steps and problems
interface GetBuildProjectResponse {
  project: BuildProject & {
    steps: Array<BuildStep & {
      photos: BuildStepPhoto[];
      problems: BuildProblem[];
    }>;
  };
}

// PUT /api/build-projects/:id
// Update build project
interface UpdateBuildProjectRequest {
  name?: string;
  modelName?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
}

// DELETE /api/build-projects/:id
// Delete build project and all associated data
```

#### Build Steps Management
```typescript
// POST /api/build-projects/:projectId/steps
// Add new step to project
interface CreateBuildStepRequest {
  title: string;
  description: string;
  stepOrder: number;
}

// PUT /api/build-steps/:id
// Update build step
interface UpdateBuildStepRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  timeSpent?: number; // additional minutes to add
}

// POST /api/build-steps/:id/photos
// Upload photos for build step
// Multipart form data with image files

// DELETE /api/build-step-photos/:id
// Delete specific photo
```

#### Build Problems Management
```typescript
// POST /api/build-steps/:stepId/problems
// Report new problem
interface CreateBuildProblemRequest {
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// PUT /api/build-problems/:id
// Update problem (mainly for adding solution)
interface UpdateBuildProblemRequest {
  solution?: string;
  resolved?: boolean;
}

// DELETE /api/build-problems/:id
// Delete problem report
```

### Time Tracking System
```typescript
// POST /api/build-steps/:id/time-sessions
// Start time tracking session
interface StartTimeSessionResponse {
  sessionId: string;
  startTime: string;
}

// PUT /api/time-sessions/:sessionId/stop
// Stop time tracking and save duration
interface StopTimeSessionRequest {
  endTime: string;
}
```

## 🌟 Community Features Backend

### Database Schema

#### Community Gallery Table
```sql
CREATE TABLE community_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('gundam', 'mecha', 'vehicle', 'figure', 'diorama', 'custom')),
    customizations TEXT[], -- Array of customization types
    techniques TEXT[], -- Array of techniques used
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_gallery_user_id ON community_gallery(user_id);
CREATE INDEX idx_community_gallery_category ON community_gallery(category);
CREATE INDEX idx_community_gallery_featured ON community_gallery(featured);
CREATE INDEX idx_community_gallery_likes ON community_gallery(likes_count DESC);
```

#### Gallery Images Table
```sql
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES community_gallery(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_images_gallery_id ON gallery_images(gallery_id);
```

#### Build Logs Table
```sql
CREATE TABLE build_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    build_time_hours INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    tags TEXT[], -- Array of tags
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_build_logs_user_id ON build_logs(user_id);
CREATE INDEX idx_build_logs_difficulty ON build_logs(difficulty);
CREATE INDEX idx_build_logs_featured ON build_logs(featured);
```

#### Build Log Steps Table
```sql
CREATE TABLE build_log_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_log_id UUID NOT NULL REFERENCES build_logs(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(500),
    tips TEXT[], -- Array of tips
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(build_log_id, step_order)
);

CREATE INDEX idx_build_log_steps_build_log_id ON build_log_steps(build_log_id);
```

#### Video Tutorials Table
```sql
CREATE TABLE video_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_path VARCHAR(500),
    video_url VARCHAR(500) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('assembly', 'painting', 'weathering', 'customization', 'tools', 'techniques')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_tutorials_creator_id ON video_tutorials(creator_id);
CREATE INDEX idx_video_tutorials_category ON video_tutorials(category);
CREATE INDEX idx_video_tutorials_difficulty ON video_tutorials(difficulty);
```

#### Community Likes Table
```sql
CREATE TABLE community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('gallery', 'build_log', 'video_tutorial')),
    content_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX idx_community_likes_content ON community_likes(content_type, content_id);
```

#### Community Comments Table
```sql
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('gallery', 'build_log', 'video_tutorial')),
    content_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_comments_content ON community_comments(content_type, content_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
```

### API Endpoints

#### Community Gallery
```typescript
// GET /api/community/gallery
// Get gallery items with filtering and pagination
interface GetGalleryRequest {
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'popular' | 'featured';
  search?: string;
}

// POST /api/community/gallery
// Create new gallery item
interface CreateGalleryItemRequest {
  modelName: string;
  title: string;
  description: string;
  category: 'gundam' | 'mecha' | 'vehicle' | 'figure' | 'diorama' | 'custom';
  customizations?: string[];
  techniques?: string[];
}

// POST /api/community/gallery/:id/images
// Upload images for gallery item
// Multipart form data

// PUT /api/community/gallery/:id
// Update gallery item (only by owner)

// DELETE /api/community/gallery/:id
// Delete gallery item (only by owner)
```

#### Build Logs
```typescript
// GET /api/community/build-logs
// Get build logs with filtering
interface GetBuildLogsRequest {
  difficulty?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'popular';
  tags?: string[];
}

// POST /api/community/build-logs
// Create new build log
interface CreateBuildLogRequest {
  modelName: string;
  title: string;
  description: string;
  buildTimeHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  steps: Array<{
    title: string;
    description: string;
    tips?: string[];
  }>;
}

// GET /api/community/build-logs/:id
// Get specific build log with steps
```

#### Video Tutorials
```typescript
// GET /api/community/videos
// Get video tutorials with filtering
interface GetVideosRequest {
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'popular' | 'views';
}

// POST /api/community/videos
// Create new video tutorial
interface CreateVideoTutorialRequest {
  title: string;
  description: string;
  videoUrl: string;
  durationSeconds: number;
  category: 'assembly' | 'painting' | 'weathering' | 'customization' | 'tools' | 'techniques';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}
```

#### Likes and Comments
```typescript
// POST /api/community/:contentType/:id/like
// Toggle like on content
interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

// GET /api/community/:contentType/:id/comments
// Get comments for content
interface GetCommentsResponse {
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    commentText: string;
    likesCount: number;
    isLiked: boolean;
    createdAt: string;
    replies?: Comment[];
  }>;
}

// POST /api/community/:contentType/:id/comments
// Add comment to content
interface CreateCommentRequest {
  commentText: string;
  parentCommentId?: string;
}
```

### File Upload Strategy

#### Image Storage
```typescript
// Recommended: Use cloud storage (AWS S3, Cloudinary, etc.)
// File naming convention: {userId}/{contentType}/{timestamp}_{randomId}.{ext}

interface FileUploadService {
  uploadImage(file: Buffer, metadata: {
    userId: string;
    contentType: 'build_step' | 'gallery' | 'tutorial_thumbnail';
    fileName: string;
  }): Promise<{
    filePath: string;
    fileUrl: string;
  }>;

  deleteImage(filePath: string): Promise<void>;

  generateThumbnail(originalPath: string, sizes: number[]): Promise<string[]>;
}
```

#### File Validation
```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 10;

function validateImageUpload(files: File[]): {
  valid: boolean;
  errors: string[];
} {
  // Implement validation logic
}
```

### Security Considerations

1. **Content Moderation**
   - Implement image content scanning
   - User reporting system
   - Admin moderation dashboard

2. **Rate Limiting**
   - Upload limits per user per day
   - API request rate limiting
   - Time-based restrictions on content creation

3. **Privacy Controls**
   - User can set projects as private/public
   - Option to hide from community features
   - Content visibility settings

### Performance Optimizations

1. **Database Indexing**
   - All foreign keys indexed
   - Composite indexes for common queries
   - Pagination optimization

2. **Caching Strategy**
   - Redis cache for popular content
   - CDN for image delivery
   - Query result caching

3. **Image Optimization**
   - Automatic thumbnail generation
   - Progressive image loading
   - WebP format conversion

### Analytics and Insights

```typescript
// Track user engagement
interface AnalyticsEvent {
  userId: string;
  eventType: 'view' | 'like' | 'comment' | 'share' | 'upload';
  contentType: string;
  contentId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Generate user insights
interface UserBuildStats {
  totalProjects: number;
  completedProjects: number;
  totalBuildTime: number;
  avgProjectTime: number;
  favoriteCategories: string[];
  skillProgression: {
    difficulty: string;
    count: number;
  }[];
}
```

## 🚀 Implementation Priority

### Phase 1: Core Build Tracker
1. Database schema creation
2. Basic CRUD operations for projects and steps
3. Time tracking functionality
4. Photo upload for steps

### Phase 2: Problem Reporting
1. Problem/issue reporting system
2. Solution tracking
3. Problem analytics

### Phase 3: Community Gallery
1. Gallery item creation and viewing
2. Image upload and management
3. Like system
4. Basic filtering and search

### Phase 4: Build Logs & Tutorials
1. Build log creation and sharing
2. Video tutorial management
3. Comment system
4. Advanced search and filtering

### Phase 5: Advanced Features
1. Content moderation tools
2. User reputation system
3. Advanced analytics
4. Social features (following, notifications)

## 🔧 AI Programmer Prompt

**You are tasked with implementing the backend for a model building community platform. The frontend has been completed with Build Progress Tracker and Community Features. Your implementation should:**

1. **Create a robust, scalable backend** that supports:
   - Personal build project tracking with time management
   - Photo documentation system
   - Problem reporting and solution tracking
   - Community gallery with customization showcases
   - Build log sharing with step-by-step documentation
   - Video tutorial platform with categorization

2. **Use modern best practices including:**
   - RESTful API design with proper status codes
   - Input validation and sanitization
   - Comprehensive error handling
   - Rate limiting and security measures
   - Database optimization with proper indexing
   - File upload handling with validation
   - Image processing and thumbnail generation

3. **Implement the complete data flow:**
   - User authentication and authorization
   - CRUD operations for all entities
   - File storage and CDN integration
   - Real-time features where appropriate
   - Analytics and user insights
   - Content moderation capabilities

4. **Ensure production readiness with:**
   - Comprehensive API documentation
   - Unit and integration tests
   - Performance monitoring
   - Logging and error tracking
   - Database migrations
   - Deployment configurations

**The frontend expects specific data structures and API endpoints as defined in this guide. Maintain compatibility while implementing robust business logic and data validation.**

Start with Phase 1 implementation and ensure each phase is fully functional before proceeding to the next.
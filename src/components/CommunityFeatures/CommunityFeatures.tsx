import React, { useState } from 'react';
import './CommunityFeatures.css';

interface BuildLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  modelName: string;
  title: string;
  description: string;
  images: string[];
  buildTime: number; // hours
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  steps?: BuildLogStep[];
}

interface BuildLogStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  tips?: string[];
}

interface GalleryItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  modelName: string;
  title: string;
  description: string;
  images: string[];
  category: 'gundam' | 'mecha' | 'vehicle' | 'figure' | 'diorama' | 'custom';
  customizations?: string[];
  techniques?: string[];
  likes: number;
  isLiked: boolean;
  createdAt: Date;
}

interface VideoTutorial {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // seconds
  category: 'assembly' | 'painting' | 'weathering' | 'customization' | 'tools' | 'techniques';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  likes: number;
  views: number;
  isLiked: boolean;
  createdAt: Date;
  tags: string[];
}

const CommunityFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'builds' | 'videos' | 'showcase'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Mock data - In real app, this would come from API
  const [galleryItems] = useState<GalleryItem[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'ModelMaster92',
      userAvatar: '/api/placeholder/40/40',
      modelName: 'RG RX-78-2 Gundam',
      title: 'Custom Weathered RX-78-2',
      description: 'Battle-worn finish with custom damage effects and weathering',
      images: ['/api/placeholder/300/300', '/api/placeholder/300/300'],
      category: 'gundam',
      customizations: ['Weathering', 'Battle Damage', 'Custom Paint'],
      techniques: ['Dry brushing', 'Panel lining', 'Chipping'],
      likes: 245,
      isLiked: false,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'BuilderPro',
      userAvatar: '/api/placeholder/40/40',
      modelName: 'MG Barbatos',
      title: 'LED Modified Barbatos',
      description: 'Custom LED installation with working mono-eye and chest reactor',
      images: ['/api/placeholder/300/300', '/api/placeholder/300/300', '/api/placeholder/300/300'],
      category: 'mecha',
      customizations: ['LED Installation', 'Custom Wiring', 'Battery Pack'],
      techniques: ['Electronics', 'Drilling', 'Wire Management'],
      likes: 189,
      isLiked: true,
      createdAt: new Date('2024-01-10')
    }
  ]);

  const [buildLogs] = useState<BuildLog[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'ModelMaster92',
      userAvatar: '/api/placeholder/40/40',
      modelName: 'RG Strike Freedom',
      title: 'My First Real Grade Build',
      description: 'Complete build log of my first RG kit with lessons learned',
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      buildTime: 12,
      difficulty: 'intermediate',
      tags: ['first-build', 'real-grade', 'strike-freedom'],
      likes: 156,
      isLiked: false,
      createdAt: new Date('2024-01-20'),
      steps: [
        {
          id: 's1',
          title: 'Unboxing and Parts Check',
          description: 'First impression and parts organization',
          image: '/api/placeholder/300/200',
          tips: ['Organize parts by sprues', 'Check for missing pieces']
        },
        {
          id: 's2',
          title: 'Main Body Assembly',
          description: 'Building the torso and internal frame',
          image: '/api/placeholder/300/200',
          tips: ['Take your time with small parts', 'Dry fit before final assembly']
        }
      ]
    }
  ]);

  const [videoTutorials] = useState<VideoTutorial[]>([
    {
      id: '1',
      creatorId: 'creator1',
      creatorName: 'GunplaGuruTech',
      creatorAvatar: '/api/placeholder/40/40',
      title: 'Panel Lining Techniques for Beginners',
      description: 'Learn the basics of panel lining to make your builds pop',
      thumbnail: '/api/placeholder/320/180',
      videoUrl: '#',
      duration: 480, // 8 minutes
      category: 'techniques',
      difficulty: 'beginner',
      likes: 1247,
      views: 15420,
      isLiked: true,
      createdAt: new Date('2024-01-18'),
      tags: ['panel-lining', 'techniques', 'beginner']
    },
    {
      id: '2',
      creatorId: 'creator2',
      creatorName: 'AdvancedBuilder',
      creatorAvatar: '/api/placeholder/40/40',
      title: 'Custom LED Installation Guide',
      description: 'Step-by-step guide to adding LEDs to your Gunpla',
      thumbnail: '/api/placeholder/320/180',
      videoUrl: '#',
      duration: 1200, // 20 minutes
      category: 'customization',
      difficulty: 'advanced',
      likes: 892,
      views: 8340,
      isLiked: false,
      createdAt: new Date('2024-01-12'),
      tags: ['LED', 'electronics', 'customization']
    }
  ]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const toggleLike = (type: 'gallery' | 'build' | 'video', id: string) => {
    // In real app, this would make API call to toggle like
    console.log(`Toggle like for ${type} item ${id}`);
  };

  return (
    <div className="community-features">
      <div className="community-header">
        <h2>Community Hub</h2>
        <p>Discover amazing builds, learn new techniques, and share your creations</p>
      </div>

      <nav className="community-nav">
        <button
          className={`nav-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <span className="tab-icon">🎨</span>
          Gallery
        </button>
        <button
          className={`nav-tab ${activeTab === 'builds' ? 'active' : ''}`}
          onClick={() => setActiveTab('builds')}
        >
          <span className="tab-icon">📖</span>
          Build Logs
        </button>
        <button
          className={`nav-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <span className="tab-icon">🎥</span>
          Tutorials
        </button>
        <button
          className={`nav-tab ${activeTab === 'showcase' ? 'active' : ''}`}
          onClick={() => setActiveTab('showcase')}
        >
          <span className="tab-icon">⭐</span>
          Showcase
        </button>
      </nav>

      {activeTab === 'gallery' && (
        <div className="gallery-section">
          <div className="section-filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="gundam">Gundam</option>
              <option value="mecha">Mecha</option>
              <option value="vehicle">Vehicle</option>
              <option value="figure">Figure</option>
              <option value="diorama">Diorama</option>
              <option value="custom">Custom</option>
            </select>

            <button className="upload-btn">
              + Share Your Build
            </button>
          </div>

          <div className="gallery-grid">
            {galleryItems.map(item => (
              <div key={item.id} className="gallery-card">
                <div className="card-image">
                  <img src={item.images[0]} alt={item.title} />
                  {item.images.length > 1 && (
                    <div className="image-count">+{item.images.length - 1}</div>
                  )}
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <div className="user-info">
                      <img src={item.userAvatar} alt={item.userName} className="user-avatar" />
                      <span className="user-name">{item.userName}</span>
                    </div>
                    <span className="category-badge">{item.category}</span>
                  </div>

                  <h3 className="card-title">{item.title}</h3>
                  <p className="model-name">{item.modelName}</p>
                  <p className="card-description">{item.description}</p>

                  {item.customizations && (
                    <div className="customizations">
                      <strong>Customizations:</strong>
                      <div className="tags">
                        {item.customizations.map(custom => (
                          <span key={custom} className="tag">{custom}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-footer">
                    <button
                      className={`like-btn ${item.isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLike('gallery', item.id)}
                    >
                      ❤️ {item.likes}
                    </button>
                    <span className="date">{item.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'builds' && (
        <div className="builds-section">
          <div className="section-filters">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            <button className="upload-btn">
              + Share Build Log
            </button>
          </div>

          <div className="builds-list">
            {buildLogs.map(log => (
              <div key={log.id} className="build-log-card">
                <div className="log-header">
                  <div className="user-info">
                    <img src={log.userAvatar} alt={log.userName} className="user-avatar" />
                    <div className="user-details">
                      <span className="user-name">{log.userName}</span>
                      <span className="post-date">{log.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="log-meta">
                    <span className={`difficulty-badge ${log.difficulty}`}>
                      {log.difficulty}
                    </span>
                    <span className="build-time">⏱️ {log.buildTime}h</span>
                  </div>
                </div>

                <div className="log-content">
                  <h3 className="log-title">{log.title}</h3>
                  <p className="model-name">{log.modelName}</p>
                  <p className="log-description">{log.description}</p>

                  <div className="log-images">
                    {log.images.map((image, index) => (
                      <img key={index} src={image} alt={`Build step ${index + 1}`} />
                    ))}
                  </div>

                  {log.steps && (
                    <div className="build-steps">
                      <h4>Build Steps</h4>
                      {log.steps.map(step => (
                        <div key={step.id} className="build-step">
                          <div className="step-content">
                            <h5>{step.title}</h5>
                            <p>{step.description}</p>
                            {step.tips && (
                              <div className="step-tips">
                                <strong>Tips:</strong>
                                <ul>
                                  {step.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {step.image && (
                            <img src={step.image} alt={step.title} className="step-image" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="tags">
                    {log.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="log-footer">
                  <button
                    className={`like-btn ${log.isLiked ? 'liked' : ''}`}
                    onClick={() => toggleLike('build', log.id)}
                  >
                    ❤️ {log.likes}
                  </button>
                  <button className="comment-btn">💬 Comments</button>
                  <button className="share-btn">📤 Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="videos-section">
          <div className="section-filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="assembly">Assembly</option>
              <option value="painting">Painting</option>
              <option value="weathering">Weathering</option>
              <option value="customization">Customization</option>
              <option value="tools">Tools</option>
              <option value="techniques">Techniques</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="videos-grid">
            {videoTutorials.map(video => (
              <div key={video.id} className="video-card">
                <div className="video-thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  <div className="video-duration">{formatDuration(video.duration)}</div>
                  <div className="play-overlay">▶️</div>
                </div>

                <div className="video-content">
                  <div className="video-header">
                    <div className="creator-info">
                      <img src={video.creatorAvatar} alt={video.creatorName} className="creator-avatar" />
                      <span className="creator-name">{video.creatorName}</span>
                    </div>
                    <span className={`difficulty-badge ${video.difficulty}`}>
                      {video.difficulty}
                    </span>
                  </div>

                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-description">{video.description}</p>

                  <div className="video-stats">
                    <span className="views">👁️ {formatViews(video.views)} views</span>
                    <span className="date">{video.createdAt.toLocaleDateString()}</span>
                  </div>

                  <div className="tags">
                    {video.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="video-footer">
                    <button
                      className={`like-btn ${video.isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLike('video', video.id)}
                    >
                      ❤️ {video.likes}
                    </button>
                    <button className="watch-btn">▶️ Watch</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'showcase' && (
        <div className="showcase-section">
          <div className="showcase-hero">
            <h3>Featured This Week</h3>
            <p>Amazing builds selected by our community</p>
          </div>

          <div className="featured-builds">
            <div className="featured-card">
              <img src="/api/placeholder/600/400" alt="Featured build" />
              <div className="featured-content">
                <h4>Master Grade Perfectibility</h4>
                <p>Custom LED and weathering work by BuildMaster2023</p>
                <div className="featured-stats">
                  <span>❤️ 1.2K likes</span>
                  <span>💬 89 comments</span>
                  <span>📤 245 shares</span>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-categories">
            <h4>Browse by Achievement</h4>
            <div className="achievement-grid">
              <div className="achievement-card">
                <span className="achievement-icon">🏆</span>
                <h5>Most Creative</h5>
                <p>Unique and innovative builds</p>
              </div>
              <div className="achievement-card">
                <span className="achievement-icon">🔥</span>
                <h5>Trending</h5>
                <p>Popular builds this month</p>
              </div>
              <div className="achievement-card">
                <span className="achievement-icon">⭐</span>
                <h5>Staff Picks</h5>
                <p>Curated by our team</p>
              </div>
              <div className="achievement-card">
                <span className="achievement-icon">🎨</span>
                <h5>Best Painted</h5>
                <p>Outstanding paint work</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFeatures;
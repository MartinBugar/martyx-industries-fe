import React from 'react';

const VideoDemo: React.FC = () => {
  // Optional poster and video import (will be empty until assets exist)
  const posterMap = import.meta.glob('../../assets/home/video-poster.jpg', { eager: true, as: 'url' });
  const videoMap = import.meta.glob('../../assets/home/demo.mp4', { eager: true, as: 'url' });
  const poster = (posterMap['../../assets/home/video-poster.jpg'] as string) || undefined;
  const video = (videoMap['../../assets/home/demo.mp4'] as string) || undefined;

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--card)' }}>
      <video
        style={{ width: '100%', height: '100%', display: 'block' }}
        controls
        preload="none"
        muted
        playsInline
        poster={poster}
      >
        {video ? <source src={video} type="video/mp4" /> : null}
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoDemo;

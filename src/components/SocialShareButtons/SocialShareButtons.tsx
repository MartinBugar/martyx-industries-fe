import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './SocialShareButtons.css';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium';
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description: _description = '',
  imageUrl = '',
  variant = 'horizontal',
  size = 'medium'
}) => {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = encodeURIComponent(imageUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform];
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('share.linkCopied', 'Link copied to clipboard!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('share.copyFailed', 'Failed to copy link'));
    }
  };

  const iconSize = size === 'small' ? 16 : 20;

  return (
    <div className={`social-share-buttons ${variant} ${size}`}>
      <span className="share-label">{t('share.shareOn', 'Share:')}</span>
      <div className="share-buttons">
        <button
          onClick={() => handleShare('facebook')}
          className="share-btn facebook"
          aria-label={t('share.facebook', 'Share on Facebook')}
          title={t('share.facebook', 'Share on Facebook')}
        >
          <Facebook size={iconSize} />
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="share-btn twitter"
          aria-label={t('share.twitter', 'Share on X (Twitter)')}
          title={t('share.twitter', 'Share on X (Twitter)')}
        >
          <Twitter size={iconSize} />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="share-btn linkedin"
          aria-label={t('share.linkedin', 'Share on LinkedIn')}
          title={t('share.linkedin', 'Share on LinkedIn')}
        >
          <Linkedin size={iconSize} />
        </button>
        <button
          onClick={() => handleShare('pinterest')}
          className="share-btn pinterest"
          aria-label={t('share.pinterest', 'Share on Pinterest')}
          title={t('share.pinterest', 'Share on Pinterest')}
        >
          <svg
            viewBox="0 0 24 24"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
          </svg>
        </button>
        <button
          onClick={handleCopyLink}
          className={`share-btn copy-link ${copied ? 'copied' : ''}`}
          aria-label={t('share.copyLink', 'Copy link')}
          title={t('share.copyLink', 'Copy link')}
        >
          {copied ? <Check size={iconSize} /> : <Link2 size={iconSize} />}
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;

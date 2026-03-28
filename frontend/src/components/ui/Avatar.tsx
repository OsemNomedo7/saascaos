import React, { CSSProperties } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type UserLevel = 'iniciante' | 'intermediario' | 'avancado' | 'elite';

interface AvatarUser {
  name?: string;
  avatar?: string | null;
  level?: string;
}

interface AvatarProps {
  user?: AvatarUser;
  size?: AvatarSize;
  showOnline?: boolean;
  showLevelRing?: boolean;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 80,
};

const LEVEL_COLORS: Record<string, string> = {
  iniciante: '#00ff41',
  intermediario: '#00d4ff',
  avancado: '#cc66ff',
  elite: '#ff4400',
};

const LEVEL_BG: Record<string, string> = {
  iniciante: 'rgba(0,255,65,0.15)',
  intermediario: 'rgba(0,212,255,0.15)',
  avancado: 'rgba(204,102,255,0.15)',
  elite: 'rgba(255,68,0,0.15)',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  user,
  size = 'md',
  showOnline = false,
  showLevelRing = false,
}: AvatarProps) {
  const px = SIZES[size];
  const level = (user?.level as UserLevel) ?? 'iniciante';
  const ringColor = LEVEL_COLORS[level] ?? '#00ff41';
  const bgColor = LEVEL_BG[level] ?? 'rgba(0,255,65,0.15)';
  const fontSize = Math.max(8, Math.floor(px * 0.38));
  const ringWidth = size === 'xl' ? 3 : size === 'lg' ? 2 : 2;
  const onlineDotSize = Math.max(6, Math.floor(px * 0.22));

  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    width: px,
    height: px,
  };

  const ringStyle: CSSProperties = showLevelRing
    ? {
        position: 'absolute',
        inset: -ringWidth - 1,
        borderRadius: '50%',
        border: `${ringWidth}px solid ${ringColor}`,
        boxShadow: `0 0 8px ${ringColor}66`,
        pointerEvents: 'none',
        zIndex: 1,
      }
    : {};

  const imageStyle: CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    background: '#0a0a0a',
    border: showLevelRing ? 'none' : `1px solid ${ringColor}44`,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const initialsStyle: CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bgColor,
    border: showLevelRing ? 'none' : `1px solid ${ringColor}44`,
    color: ringColor,
    fontSize: `${fontSize}px`,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
    userSelect: 'none',
    flexShrink: 0,
  };

  const onlineDotStyle: CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: onlineDotSize,
    height: onlineDotSize,
    borderRadius: '50%',
    background: '#00ff41',
    border: '2px solid #050a05',
    zIndex: 2,
    boxShadow: '0 0 6px #00ff41',
    animation: 'avatarPulse 2s ease-in-out infinite',
  };

  return (
    <>
      <style>{`
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 4px #00ff41, 0 0 8px #00ff4166; }
          50% { box-shadow: 0 0 8px #00ff41, 0 0 16px #00ff4199; }
        }
      `}</style>
      <span style={containerStyle}>
        {showLevelRing && <span style={ringStyle} />}
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user?.name ?? 'avatar'}
            style={imageStyle}
          />
        ) : (
          <span style={initialsStyle}>{getInitials(user?.name)}</span>
        )}
        {showOnline && <span style={onlineDotStyle} />}
      </span>
    </>
  );
}

export default Avatar;

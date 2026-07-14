import { avatarUrl } from '../../lib/format';

const SIZES = {
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-12 h-12 rounded-xl',
  lg: 'w-16 h-16 rounded-2xl',
  xl: 'w-20 h-20 rounded-2xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  return (
    <img
      src={src || avatarUrl(name)}
      alt={name || ''}
      onError={e => { e.target.src = avatarUrl(name); }}
      className={`${SIZES[size]} object-cover bg-sand shrink-0 ${className}`}
    />
  );
}

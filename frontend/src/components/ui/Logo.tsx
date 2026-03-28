import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 120, className = '' }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Elite Trojan"
      width={size}
      height={size}
      className={className}
      style={{ mixBlendMode: 'screen', display: 'block' }}
      priority
    />
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 120, className = '' }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Elite Trojan"
      width={size}
      className={className}
      style={{ mixBlendMode: 'screen', display: 'block', height: 'auto' }}
    />
  );
}

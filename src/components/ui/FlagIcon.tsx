interface FlagIconProps {
  country: 'gb' | 'tr';
  className?: string;
}

const FlagGB = () => (
  <svg viewBox="0 0 60 30" className="w-full h-full">
    <clipPath id="gb-clip"><rect width="60" height="30" /></clipPath>
    <g clipPath="url(#gb-clip)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

const FlagTR = () => (
  <svg viewBox="0 0 30 20" className="w-full h-full">
    <rect width="30" height="20" fill="#E30A17" />
    <circle cx="10.5" cy="10" r="6" fill="#fff" />
    <circle cx="12" cy="10" r="4.8" fill="#E30A17" />
    <polygon
      fill="#fff"
      points="17.5,10 15.2,11.1 15.7,8.6 13.8,6.9 16.3,6.6 17.5,4.3 18.7,6.6 21.2,6.9 19.3,8.6 19.8,11.1"
      transform="rotate(18 17.5 10) translate(0 2.2)"
    />
  </svg>
);

const FlagIcon = ({ country, className = '' }: FlagIconProps) => (
  <span className={`inline-block rounded-sm overflow-hidden ${className}`}>
    {country === 'gb' ? <FlagGB /> : <FlagTR />}
  </span>
);

export default FlagIcon;

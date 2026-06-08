export default function DotsPattern({ id, opacity = 0.15 }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="9"  cy="9"  r="1.5" fill="#4285F4" opacity={opacity} />
          <circle cx="27" cy="9"  r="1.5" fill="#EA4335" opacity={opacity} />
          <circle cx="9"  cy="27" r="1.5" fill="#34A853" opacity={opacity} />
          <circle cx="27" cy="27" r="1.5" fill="#FBBC05" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

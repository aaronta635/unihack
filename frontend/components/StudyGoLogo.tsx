"use client";

/**
 * studygo logo to match reference: dark teal background, open book with
 * yellow outline, 2x2 colored squares (pink, cyan, green, orange), white pencil.
 */
export default function StudyGoLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Dark teal background */}
      <rect width="48" height="48" rx="10" fill="#1E615D" />
      {/* Book left page (yellow outline) */}
      <path
        d="M8 14v20c0 1.5 2 2 4 2h4V12H12c-2 0-4 1-4 2z"
        fill="none"
        stroke="#FFD93D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Book right page - main open area with 2x2 grid */}
      <path
        d="M16 12v24h12c2 0 4-.5 4-2V14c0-1.5-2-2-4-2H16z"
        fill="none"
        stroke="#FFD93D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 2x2 colored squares inside right page */}
      <rect x="20" y="16" width="10" height="10" fill="#FF3377" />
      <rect x="30" y="16" width="10" height="10" fill="#33CCFF" />
      <rect x="20" y="26" width="10" height="10" fill="#66FF33" />
      <rect x="30" y="26" width="10" height="10" fill="#FF9933" />
      {/* Pencil diagonal (white body, blue eraser) */}
      <g transform="rotate(-35 24 24)">
        <path
          d="M14 18 L32 34 L30 36 L12 20 Z"
          fill="white"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
        />
        <path d="M30 34 L34 30 L36 32 L32 36 Z" fill="#33CCFF" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <path d="M14 18 L16 16 L18 18 L16 20 Z" fill="#888" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        {/* Zigzag break in middle */}
        <path d="M22 24 L24 26 L26 24 L28 26" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

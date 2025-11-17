import React from "react";

export const StardustButton = ({
  children = "Get Started",
  //@ts-expect-error
  onClick,
  className = "",
  ...props
}) => {
  const buttonStyle: React.CSSProperties & Record<string, string | number> = {
    '--white': '#e6f3ff',
    '--bg': '#0a1929',
    '--radius': '60px', // smaller radius
    outline: 'none',
    cursor: 'pointer',
    border: 0,
    position: 'relative',
    borderRadius: 'var(--radius)',
    background: 'linear-gradient(135deg, #22c55e, #10b981)', // green gradient
    transition: 'all 0.25s ease',
    boxShadow: `
      inset 0 0.3rem 0.7rem rgba(34, 197, 94, 0.3),
      inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.5),
      0 0 1.5rem rgba(16, 185, 129, 0.6),
      0 0.3rem 0.7rem rgba(34, 197, 94, 0.7)
    `,
  };

  const wrapStyle: React.CSSProperties = {
    fontSize: '20px', // smaller font
    fontWeight: 600,
    color: 'rgba(240, 255, 240, 0.95)',
    padding: '18px 36px', // smaller padding
    borderRadius: 'inherit',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'center' as const,
  };

  const pStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: 0,
    transition: 'all 0.25s ease',
    transform: 'translateY(1%)',
    maskImage: 'linear-gradient(to bottom, rgba(240, 255, 240, 1) 40%, transparent)',
  };

  const beforeAfterStyles = `
    .pearl-button .wrap::before,
    .pearl-button .wrap::after {
      content: "";
      position: absolute;
      transition: all 0.3s ease;
    }

    .pearl-button .wrap::before {
      left: -15%;
      right: -15%;
      bottom: 25%;
      top: -120%;
      border-radius: 50%;
      background-color: rgba(34, 197, 94, 0.15);
    }

    .pearl-button .wrap::after {
      left: 6%;
      right: 6%;
      top: 12%;
      bottom: 40%;
      border-radius: 16px 16px 0 0;
      box-shadow: inset 0 8px 6px -6px rgba(34, 197, 94, 0.6);
      background: linear-gradient(
        180deg,
        rgba(34, 197, 94, 0.25) 0%,
        rgba(0, 0, 0, 0) 50%,
        rgba(0, 0, 0, 0) 100%
      );
    }

    .pearl-button .wrap p span:nth-child(2) {
      display: none;
    }

    .pearl-button:hover .wrap p span:nth-child(1) {
      display: none;
    }

    .pearl-button:hover .wrap p span:nth-child(2) {
      display: inline-block;
    }

    .pearl-button:hover {
      box-shadow:
        inset 0 0.3rem 0.7rem rgba(34, 197, 94, 0.4),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.5),
        0 0 2rem rgba(16, 185, 129, 0.7),
        0 0.3rem 0.7rem rgba(34, 197, 94, 0.8);
    }

    .pearl-button:hover .wrap::before {
      transform: translateY(-5%);
    }

    .pearl-button:hover .wrap::after {
      opacity: 0.4;
      transform: translateY(5%);
    }

    .pearl-button:hover .wrap p {
      transform: translateY(-4%);
    }

    .pearl-button:active {
      transform: translateY(2px);
      box-shadow:
        inset 0 0.3rem 0.7rem rgba(34, 197, 94, 0.5),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.6),
        0 0 1.5rem rgba(16, 185, 129, 0.5),
        0 0.3rem 0.7rem rgba(34, 197, 94, 0.7);
    }
  `;

  return (
    <>
      <style>{beforeAfterStyles}</style>
      <button
        className={`pearl-button ${className}`}
        style={buttonStyle}
        onClick={onClick}
        {...props}
      >
        <div className="wrap" style={wrapStyle}>
          <p style={pStyle}>
            <span>✧</span>
            <span>✦</span>
            {children}
          </p>
        </div>
      </button>
    </>
  );
};

'use client';

import React, { useState, useEffect } from 'react';

interface ModeToggleProps {
  defaultMode?: 'learning' | 'assessment';
  value?: 'learning' | 'assessment';
  onModeChange?: (mode: 'learning' | 'assessment') => void;
}

export function ModeToggle({ defaultMode = 'learning', value, onModeChange }: ModeToggleProps) {
  const [internal, setInternal] = useState<'learning' | 'assessment'>(defaultMode);
  const mode = value !== undefined ? value : internal;
  const activeIndex = mode === 'learning' ? 0 : 1;

  const handleClick = (next: 'learning' | 'assessment') => {
    if (next === mode) return;
    setInternal(next);
    onModeChange?.(next);
  };

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap");

        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }
        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .mode-toggle-wrap {
          --shiny-bg: #001e33;
          --shiny-fg: #e0f4ff;
          --shiny-highlight: #38bdf8;
          --shiny-highlight-subtle: #7dd3fc;
          --animation: gradient-angle linear infinite;
          --duration: 4s;
          --shadow-size: 2px;
          --t: 500ms cubic-bezier(0.25, 1, 0.5, 1);

          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 5px;
          border: 1px solid transparent;
          border-radius: 9999px;
          background:
            linear-gradient(var(--shiny-bg), var(--shiny-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.15), 0 0 20px rgba(56, 189, 248, 0.1);
          transition: var(--t);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine, box-shadow;
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        /* Dots layer */
        .mode-toggle-wrap::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: 0;
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            rgba(255,255,255,0.4) calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.3;
          animation: var(--animation) var(--duration);
        }

        /* Inner shimmer */
        .mode-toggle-wrap::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: 0;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0;
          animation: shimmer linear infinite var(--duration);
          transition: opacity var(--t);
        }

        .mode-toggle-wrap:hover::after,
        .mode-toggle-wrap:focus-within::after {
          opacity: 0.4;
        }

        .mode-toggle-wrap:hover,
        .mode-toggle-wrap:focus-within {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-highlight-subtle);
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.25), 0 0 32px rgba(56, 189, 248, 0.25);
          animation-play-state: running;
        }

        .mode-toggle-wrap:hover::before,
        .mode-toggle-wrap:focus-within::before {
          animation-play-state: running;
        }

        .mode-toggle-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          border-radius: 9999px;
          background: transparent;
        }

        .mode-pill {
          position: absolute;
          top: 0;
          bottom: 0;
          border-radius: 9999px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%);
          box-shadow: 0 0 12px rgba(14, 165, 233, 0.6), 0 0 24px rgba(14, 165, 233, 0.3);
          transition: transform 480ms cubic-bezier(0.25, 1, 0.5, 1),
                      left 480ms cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 300ms ease;
          width: 50%;
          left: 0;
        }

        .mode-btn {
          position: relative;
          z-index: 2;
          padding: 0.45rem 1.5rem;
          font-family: "Instrument Serif", Georgia, serif;
          font-size: 0.95rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          border-radius: 9999px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: color 300ms ease;
          white-space: nowrap;
          outline: none;
        }

        .mode-btn:focus-visible {
          outline: 2px solid rgba(56, 189, 248, 0.8);
          outline-offset: 2px;
        }

        .mode-btn-active {
          color: #ffffff;
          text-shadow: 0 0 8px rgba(255,255,255,0.4);
        }

        .mode-btn-inactive {
          color: rgba(148, 208, 235, 0.7);
        }

        .mode-btn-inactive:hover {
          color: rgba(186, 230, 253, 0.9);
        }

        .mode-toggle-wrap:active {
          scale: 0.98;
        }

        @keyframes gradient-angle {
          to { --gradient-angle: 360deg; }
        }
        @keyframes shimmer {
          to { rotate: 360deg; }
        }
      `}</style>

      <div className="mode-toggle-wrap" role="group" aria-label="Mode selector">
        <div className="mode-toggle-inner">
          {/* Sliding pill */}
          <div
            className="mode-pill"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
            aria-hidden="true"
          />

          {/* Learning */}
          <button
            className={`mode-btn ${activeIndex === 0 ? 'mode-btn-active' : 'mode-btn-inactive'}`}
            onClick={() => handleClick('learning')}
            aria-pressed={activeIndex === 0}
          >
            LEARNING
          </button>

          {/* Assessment */}
          <button
            className={`mode-btn ${activeIndex === 1 ? 'mode-btn-active' : 'mode-btn-inactive'}`}
            onClick={() => handleClick('assessment')}
            aria-pressed={activeIndex === 1}
          >
            ASSESSMENT
          </button>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * LoveGiftFinder
 * ----------------
 * A romantic landing page with a floating-hearts animated background,
 * two name inputs (yours + your spouse's) that persist to localStorage,
 * and a "Click here to find your gift" button that reveals a surprise.
 *
 * The reveal is gated behind a countdown: before the target time, visitors
 * see a countdown timer instead of the gift-finder card.
 *
 * Usage: import LoveGiftFinder from "./LoveGiftFinder";
 *        <LoveGiftFinder />
 *
 * No external dependencies required — pure React + inline CSS.
 */

const STORAGE_KEY = "loveGiftFinder.names";

// Target reveal time: 12:00 AM, Nov 25 2026, IST (UTC+5:30).
// Using an explicit offset means this fires at the same real-world
// instant no matter what timezone the visitor's browser is set to.
const REVEAL_TIME = new Date("2026-11-25T00:00:00+05:30").getTime();

// Generate a stable set of hearts with randomized animation params
function makeHearts(count) {
  const hearts = [];
  for (let i = 0; i < count; i++) {
    hearts.push({
      id: i,
      left: Math.random() * 100, // vw %
      size: 14 + Math.random() * 28, // px
      duration: 8 + Math.random() * 10, // seconds
      delay: Math.random() * 10, // seconds
      drift: (Math.random() - 0.5) * 120, // px horizontal drift
      opacity: 0.35 + Math.random() * 0.5,
    });
  }
  return hearts;
}

function getTimeParts(msRemaining) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function LoveGiftFinder() {
  const [name, setName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const heartsRef = useRef(makeHearts(28));
  const navigate = useNavigate();

  const [isUnlocked, setIsUnlocked] = useState(() => Date.now() >= REVEAL_TIME);
  const [remaining, setRemaining] = useState(() => REVEAL_TIME - Date.now());

  // Clear any previously saved names on mount so the page always asks fresh
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // localStorage may be unavailable (e.g. private browsing) — fail silently
    }
    setName("");
    setSpouseName("");
  }, []);

  // Persist names to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, spouseName })
      );
    } catch (e) {
      // localStorage may be unavailable (e.g. private browsing) — fail silently
    }
  }, [name, spouseName]);

  // Tick the countdown every second until the reveal time passes
  useEffect(() => {
    if (isUnlocked) return;

    const tick = () => {
      const diff = REVEAL_TIME - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setIsUnlocked(true);
      } else {
        setRemaining(diff);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isUnlocked]);

  const { days, hours, minutes, seconds } = getTimeParts(remaining);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div style={styles.page}>
      <style>{keyframesCSS}</style>

      {/* Floating hearts background */}
      <div style={styles.heartsLayer} aria-hidden="true">
        {heartsRef.current.map((h) => (
          <span
            key={h.id}
            style={{
              position: "absolute",
              left: `${h.left}%`,
              bottom: "-10%",
              fontSize: `${h.size}px`,
              opacity: h.opacity,
              animation: `floatUp ${h.duration}s linear ${h.delay}s infinite`,
              "--drift": `${h.drift}px`,
            }}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Foreground card */}
      <div style={styles.card}>
        {!isUnlocked ? (
          <>
            <h1 style={styles.title}>Something's Coming 💝</h1>
            <p style={styles.subtitle}>
              Come back when the countdown hits zero to find your gift.
            </p>
            <div style={styles.countdownRow}>
              {[
                { label: "Days", value: days },
                { label: "Hours", value: hours },
                { label: "Mins", value: minutes },
                { label: "Secs", value: seconds },
              ].map((unit) => (
                <div key={unit.label} style={styles.countdownUnit}>
                  <div style={styles.countdownNumber}>{pad(unit.value)}</div>
                  <div style={styles.countdownLabel}>{unit.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Find Your Gift 🎁</h1>
            <p style={styles.subtitle}>
              Enter your names and discover a little something made for you two.
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="your-name">
                Your Name
              </label>
              <input
                id="your-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="spouse-name">
                Your Spouse's Name
              </label>
              <input
                id="spouse-name"
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                placeholder="e.g. Jordan"
                style={styles.input}
              />
            </div>

            <button style={styles.button} onClick={() => navigate("/admin")}>
              Click here to find your gift
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const keyframesCSS = `
  @keyframes floatUp {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg);
    }
    50% {
      transform: translateY(-55vh) translateX(var(--drift)) rotate(15deg);
    }
    100% {
      transform: translateY(-115vh) translateX(0) rotate(-10deg);
    }
  }
`;

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #6a2c70 100%)",
    fontFamily:
      "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  heartsLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255, 255, 255, 0.92)",
    borderRadius: "20px",
    padding: "36px 32px",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    textAlign: "center",
    backdropFilter: "blur(4px)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "28px",
    color: "#c44569",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#555",
    fontSize: "14px",
  },
  countdownRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "8px",
  },
  countdownUnit: {
    background: "#fff0f5",
    border: "1px dashed #c44569",
    borderRadius: "10px",
    padding: "10px 12px",
    minWidth: "60px",
  },
  countdownNumber: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#6a2c70",
    fontVariantNumeric: "tabular-nums",
  },
  countdownLabel: {
    fontSize: "11px",
    color: "#888",
    marginTop: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  inputGroup: {
    textAlign: "left",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#6a2c70",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    marginTop: "10px",
    width: "100%",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #ff6b9d, #c44569)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(196,69,105,0.4)",
  },
};

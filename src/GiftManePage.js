import React, { useState, useEffect, useRef } from "react";

/**
 * GiftCards
 * ----------
 * A page of 6 gift boxes in an anniversary theme. Clicking ANY box starts
 * the SAME single scavenger-hunt sequence (it's a surprise either way) —
 * the clicked box enlarges to the center of the screen and the other 5
 * boxes fade out of view.
 *
 * Sequence after clicking a box:
 *   "Go to your Room"  -> [Next]
 *   "Open Almirah"      -> [Next]
 *   "Open Locker"       -> [Next]
 *   "You found your gift!" -> pick a rating out of 10
 *   "Happy Marriage Anniversary again!" -> [Complete] (attempts to close the tab)
 *
 * Usage: import GiftCards from "./GiftCards";
 *        <Route path="/finale" element={<GiftCards />} />
 *
 * Props:
 *   steps (string[])     — the hunt instructions shown one at a time, each
 *                          with a "Next" button. Default: the 3 steps above.
 *   foundTitle (string)  — heading shown once the hunt is done, before rating.
 *   finalMessage (string) — message shown after a rating is chosen.
 *
 * No external dependencies required — pure React + inline CSS.
 */

const STORAGE_KEY = "loveGiftFinder.names";

const DEFAULT_STEPS = ["Go to your Room", "Open Almirah", "Open Locker"];

const CONFETTI_COLORS = ["#ff6b9d", "#c44569", "#ffd3e0", "#c77dff", "#ffb6c1", "#fff5c3"];

// Generates a stable burst of confetti pieces with randomized fall params
function makeConfetti(count) {
  const pieces = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      id: i,
      left: Math.random() * 100, // vw %
      size: 6 + Math.random() * 8, // px
      duration: 2.5 + Math.random() * 2, // seconds
      delay: Math.random() * 0.8, // seconds
      drift: (Math.random() - 0.5) * 160, // px horizontal drift
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotateStart: Math.random() * 360,
    });
  }
  return pieces;
}

const BALLOON_EMOJIS = ["🎈"];
let balloonBurstId = 0;

// Generates a fresh burst of balloons that float from the bottom of the
// screen to the top. `burstId` tags every balloon in this particular burst
// so multiple bursts (from rapid Next clicks) never collide or get mixed up.
function makeBalloons(count) {
  const burstId = ++balloonBurstId;
  const balloons = [];
  for (let i = 0; i < count; i++) {
    balloons.push({
      id: `${burstId}-${i}`,
      left: 10 + Math.random() * 80, // vw %, kept away from the very edges
      size: 32 + Math.random() * 20, // px
      duration: 2.2 + Math.random() * 1.3, // seconds
      delay: Math.random() * 0.4, // seconds
      drift: (Math.random() - 0.5) * 100, // px horizontal sway
      emoji: BALLOON_EMOJIS[i % BALLOON_EMOJIS.length],
    });
  }
  return { burstId, balloons };
}

export default function GiftCards({
  steps = DEFAULT_STEPS,
  foundTitle = "You found your gift! 🎉",
  finalMessage = "Happy Marriage Anniversary again! 💞",
}) {
  const [names, setNames] = useState({ name: "", spouseName: "" });
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  // stepIndex: 0..steps.length-1 = hunt instructions
  //            steps.length     = "found it" + rating screen
  //            steps.length + 1 = final anniversary message + Complete button
  const [stepIndex, setStepIndex] = useState(0);
  const [rating, setRating] = useState(null);
  const [showCloseHint, setShowCloseHint] = useState(false);
  const [balloonBurst, setBalloonBurst] = useState(null); // { burstId, balloons } | null
  const confettiRef = useRef(makeConfetti(70));
  const balloonTimeoutRef = useRef(null);

  const RATING_STEP = steps.length;
  const FINAL_STEP = steps.length + 1;

  // Launches a fresh batch of balloons floating bottom-to-top, then clears
  // them once their animation has finished so they don't linger behind
  // whatever step comes next.
  const launchBalloons = () => {
    if (balloonTimeoutRef.current) clearTimeout(balloonTimeoutRef.current);
    const burst = makeBalloons(10);
    setBalloonBurst(burst);
    balloonTimeoutRef.current = setTimeout(() => {
      setBalloonBurst((current) => (current && current.burstId === burst.burstId ? null : current));
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (balloonTimeoutRef.current) clearTimeout(balloonTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setNames({
        name: saved.name || "",
        spouseName: saved.spouseName || "",
      });
    } catch (e) {
      // ignore corrupted storage
    }
  }, []);

  // Clicking ANY box triggers the same single sequence — one command for
  // every card, not a separate one per box.
  const handleBoxClick = (i) => {
    if (revealed) return;
    setSelectedIndex(i);
    setRevealed(true);
    setStepIndex(0);
  };

  const handleNext = () => {
    launchBalloons();
    setStepIndex((s) => s + 1);
  };

  const handleRate = (value) => {
    setRating(value);
    setStepIndex(FINAL_STEP);
  };

  const handleComplete = () => {
    // Attempts to close the current tab. Browsers only allow script-driven
    // closing for tabs that were themselves opened by a script — a tab the
    // user reached via normal navigation cannot be closed this way by
    // design, and there is no official workaround. The window.open('', '_self')
    // call below is an unofficial trick that lets this succeed in a handful
    // of browsers, but it is not reliable everywhere — so we also show a
    // "you can close this tab" message regardless, as a fallback.
    try {
      window.open("", "_self");
      window.close();
    } catch (e) {
      // ignore — the fallback message below covers this case
    }
    setShowCloseHint(true);
  };

  const heading =
    names.name && names.spouseName
      ? `${names.name} & ${names.spouseName}, pick a gift 🎁`
      : "Pick a gift 🎁";

  return (
    <div style={styles.page}>
      <style>{cardCSS}</style>

      {/* Background sparkle layer */}
      <div style={styles.sparkleLayer} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 41) % 100}%`,
              top: `${(i * 59) % 100}%`,
              fontSize: `${10 + (i % 5) * 4}px`,
              animation: `twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.6,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      {/* Celebration confetti burst once the final message appears */}
      {stepIndex === FINAL_STEP && (
        <div style={styles.confettiLayer} aria-hidden="true">
          {confettiRef.current.map((p) => (
            <span
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: "-5%",
                width: `${p.size}px`,
                height: `${p.size * 1.6}px`,
                background: p.color,
                borderRadius: "2px",
                opacity: 0.9,
                transform: `rotate(${p.rotateStart}deg)`,
                animation: `confettiFall ${p.duration}s ease-in ${p.delay}s 1 forwards`,
                "--drift": `${p.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Balloons floating bottom-to-top, launched on every "Next" click */}
      {balloonBurst && (
        <div style={styles.balloonLayer} aria-hidden="true">
          {balloonBurst.balloons.map((b) => (
            <span
              key={b.id}
              style={{
                position: "absolute",
                left: `${b.left}%`,
                bottom: "-15%",
                fontSize: `${b.size}px`,
                animation: `balloonRise ${b.duration}s ease-out ${b.delay}s 1 forwards`,
                "--balloon-drift": `${b.drift}px`,
              }}
            >
              {b.emoji}
            </span>
          ))}
        </div>
      )}

      <div style={styles.content}>
        {!revealed && (
          <>
            <h1 style={styles.title}>{heading}</h1>
            <p style={styles.subtitle}>Tap any box — they all lead to the same surprise</p>
          </>
        )}

        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => {
            const isSelected = selectedIndex === i;
            const isOther = revealed && !isSelected;

            return (
              <div
                key={i}
                className={`gift-box${isSelected && revealed ? " gift-box-enlarged" : ""}${
                  isOther ? " gift-box-hidden" : ""
                }`}
                onClick={() => handleBoxClick(i)}
                style={styles.boxOuter}
                role="button"
                tabIndex={isOther ? -1 : 0}
                aria-hidden={isOther}
                aria-label={
                  isSelected && revealed ? "Gift hunt in progress" : `Gift box ${i + 1}, click to start`
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleBoxClick(i);
                }}
              >
                {!(isSelected && revealed) ? (
                  <div style={styles.boxFace}>
                    <div style={styles.boxEmoji}>🎁</div>
                    <p style={styles.boxLabel}>Tap to open</p>
                  </div>
                ) : (
                  <div style={{ ...styles.boxFace, ...styles.revealFace }}>
                    {stepIndex < RATING_STEP && (
                      <>
                        <p style={styles.stepText}>{steps[stepIndex]}</p>
                        <button style={styles.actionBtn} onClick={handleNext}>
                          Next
                        </button>
                      </>
                    )}

                    {stepIndex === RATING_STEP && (
                      <>
                        <p style={styles.stepTitle}>{foundTitle}</p>
                        <p style={styles.ratingPrompt}>Rate your gift out of 10</p>
                        <div style={styles.ratingGrid}>
                          {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
                            <button
                              key={n}
                              onClick={() => handleRate(n)}
                              style={{
                                ...styles.ratingBtn,
                                ...(rating === n ? styles.ratingBtnActive : {}),
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {stepIndex === FINAL_STEP && (
                      <>
                        <p style={styles.stepTitle}>{finalMessage}</p>
                        {!showCloseHint ? (
                          <button style={styles.actionBtn} onClick={handleComplete}>
                            Complete
                          </button>
                        ) : (
                          <p style={styles.closeHint}>
                            You're all done — you can close this tab now. 💕
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const cardCSS = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 0.9; transform: scale(1.2); }
  }

  @keyframes popIn {
    0% { transform: scale(0.7); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes confettiFall {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(105vh) translateX(var(--drift)) rotate(540deg);
      opacity: 0.9;
    }
  }

  @keyframes balloonRise {
    0% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    100% {
      transform: translateY(-120vh) translateX(var(--balloon-drift));
      opacity: 0;
    }
  }

  .gift-box {
    transition: transform 0.4s ease, opacity 0.4s ease;
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
  }

  .gift-box:hover:not(.gift-box-hidden):not(.gift-box-enlarged) {
    transform: translateY(-4px);
  }

  .gift-box-hidden {
    opacity: 0;
    transform: scale(0.6);
    pointer-events: none;
    position: absolute;
  }

  .gift-box-enlarged {
    position: fixed;
    top: 50%;
    left: 50%;
    width: min(90vw, 440px) !important;
    height: auto !important;
    transform: translate(-50%, -50%) scale(1);
    animation: popIn 0.45s ease;
    z-index: 50;
    cursor: default;
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
    background:
      "linear-gradient(135deg, #ffe8ec 0%, #ffd3e0 35%, #e0c3fc 70%, #c77dff 100%)",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "32px 20px",
    boxSizing: "border-box",
  },
  sparkleLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  confettiLayer: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 60,
  },
  balloonLayer: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 70,
  },
  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "900px",
    textAlign: "center",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "26px",
    color: "#c44569",
  },
  subtitle: {
    margin: "0 0 28px",
    color: "#6a2c70",
    fontSize: "14px",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },
  boxOuter: {
    width: "100%",
    aspectRatio: "3 / 4",
    boxSizing: "border-box",
  },
  boxFace: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
    boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
    background: "linear-gradient(135deg, #ff8fab, #c44569)",
  },
  boxEmoji: {
    fontSize: "48px",
    marginBottom: "10px",
  },
  boxLabel: {
    margin: 0,
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  revealFace: {
    background: "rgba(255, 255, 255, 0.98)",
    padding: "32px 24px",
    boxSizing: "border-box",
    minHeight: "260px",
  },
  stepText: {
    margin: "0 0 20px",
    color: "#c44569",
    fontSize: "20px",
    fontWeight: 700,
  },
  stepTitle: {
    margin: "0 0 16px",
    color: "#c44569",
    fontSize: "19px",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  ratingPrompt: {
    margin: "0 0 14px",
    color: "#6a2c70",
    fontSize: "14px",
  },
  ratingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    width: "100%",
  },
  ratingBtn: {
    padding: "8px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#c44569",
    background: "#fff0f5",
    border: "1px solid #f0c3d3",
    borderRadius: "8px",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  ratingBtnActive: {
    background: "linear-gradient(135deg, #ff6b9d, #c44569)",
    color: "#fff",
    border: "1px solid transparent",
  },
  actionBtn: {
    padding: "10px 28px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #ff6b9d, #c44569)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 6px 16px rgba(196,69,105,0.35)",
  },
  closeHint: {
    margin: 0,
    color: "#6a2c70",
    fontSize: "14px",
    fontStyle: "italic",
  },
};

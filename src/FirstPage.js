import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AnniversaryCarousel
 * --------------------
 * Reads the names saved on the previous page (from localStorage),
 * shows a warm anniversary-themed background with a rotating image
 * carousel, and a button to continue to the next page.
 *
 * Usage: import AnniversaryCarousel from "./AnniversaryCarousel";
 *        <Route path="/carousel" element={<AnniversaryCarousel nextPath="/finale" />} />
 *
 * Props:
 *   nextPath (string) — route to navigate to when "Next" is clicked.
 *                        Defaults to "/finale".
 *
 * No external dependencies beyond react-router-dom (already in your app).
 *
 * ---------------------------------------------------------------------
 * USING YOUR OWN GOOGLE DRIVE IMAGES
 * ---------------------------------------------------------------------
 * 1. Open the image in Google Drive, right-click → "Share" → make sure
 *    it's set to "Anyone with the link" (Viewer).
 * 2. Copy the share link. It looks like:
 *      https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing
 * 3. Take just the FILE_ID_HERE part and use it with the helper below:
 *      driveImageUrl("FILE_ID_HERE")
 *    which turns it into a direct, embeddable image URL.
 * 4. Paste that into the `image` field for each slide in SLIDES below.
 *
 * Note: Google occasionally rate-limits or blocks hotlinked Drive images
 * for heavy traffic. For a personal/low-traffic page like this it's
 * normally fine, but if images fail to load, re-upload the photos to a
 * proper image host (e.g. imgur, your own server, Cloudinary) instead.
 * ---------------------------------------------------------------------
 */

const STORAGE_KEY = "loveGiftFinder.names";

// ---------------------------------------------------------------------
// IMAGES: bundled locally instead of hotlinked from Google Drive.
// Drive blocks/throttles cross-origin <img> requests too unpredictably
// to depend on, so this uses files placed in your project's public folder.
//
// 1. Download the 5 photos from Google Drive to your computer.
// 2. Put them in your React project at: public/images/
//      public/images/slide1.jpg
//      public/images/slide2.jpg
//      public/images/slide3.jpg
//      public/images/slide4.jpg
//      public/images/slide5.jpg
// 3. (Optional) rename the files below to match whatever you actually named them.
// ---------------------------------------------------------------------

// Fixed set of 5 slides.
const SLIDES = [
  {
    caption: "Here's to the two of you",
    image: "/images/slide1.jpg",
  },
  {
    caption: "A toast to forever",
    image: "/images/slide2.jpg",
  },
  {
    caption: "Sweet memories, sweeter future",
    image: "/images/slide3.jpg",
  },
  {
    caption: "Walking into the sunset, together",
    image: "/images/slide4.jpg",
  },
  {
    caption: "Forever starts today",
    image: "/images/slide5.jpg",
  },
];

export default function AnniversaryCarousel() {
  const [names, setNames] = useState({ name: "", spouseName: "" });
  const [index, setIndex] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

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

  // Auto-advance the carousel every 4 seconds, stopping once the last slide
  // is reached. Any manual navigation (arrows/dots) also stops it, via
  // stopAutoAdvance() below, so it never fights with the user's clicks.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= SLIDES.length - 1) {
          clearInterval(timerRef.current);
          return i;
        }
        return i + 1;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Track whether the user is currently on the final slide — the Next
  // button only shows while this is true.
  useEffect(() => {
    setReachedEnd(index === SLIDES.length - 1);
  }, [index]);

  const stopAutoAdvance = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goTo = (i) => {
    stopAutoAdvance();
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  };
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const heading =
    names.name && names.spouseName
      ? `Happy Anniversary, ${names.name} & ${names.spouseName}! 💞`
      : "Happy Anniversary! 💞";

  return (
    <div style={styles.page}>
      <style>{sparkleCSS}</style>

      {/* Background sparkle layer */}
      <div style={styles.sparkleLayer} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              fontSize: `${10 + (i % 5) * 4}px`,
              animation: `twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.6,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      <div style={styles.card}>
        <h1 style={styles.title}>{heading}</h1>
        <p style={styles.subtitle}>A little look back before your gift...</p>

        {/* Carousel */}
        <div style={styles.carouselWrap}>
          <img
            src={SLIDES[index].image}
            alt={SLIDES[index].caption}
            style={styles.slideImg}
          />

          <button
            aria-label="Previous slide"
            onClick={prev}
            style={{ ...styles.navBtn, left: 8 }}
          >
            ‹
          </button>
          <button
            aria-label="Next slide"
            onClick={next}
            disabled={index === SLIDES.length - 1}
            style={{
              ...styles.navBtn,
              right: 8,
              opacity: index === SLIDES.length - 1 ? 0.35 : 1,
              cursor: index === SLIDES.length - 1 ? "default" : "pointer",
            }}
          >
            ›
          </button>
        </div>

        <p style={styles.caption}>{SLIDES[index].caption}</p>

        <div style={styles.dots}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              onClick={() => goTo(i)}
              style={{
                ...styles.dot,
                background: i === index ? "#c44569" : "#f0c3d3",
              }}
            />
          ))}
        </div>

        {reachedEnd && (
          <button style={styles.nextPageBtn} onClick={() => navigate("/gift")}>
            Next ➜
          </button>
        )}
      </div>
    </div>
  );
}

const sparkleCSS = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 0.9; transform: scale(1.2); }
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
    padding: "20px",
    boxSizing: "border-box",
  },
  sparkleLayer: {
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
    padding: "32px 28px",
    maxWidth: "460px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
    backdropFilter: "blur(4px)",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "24px",
    color: "#c44569",
  },
  subtitle: {
    margin: "0 0 20px",
    color: "#666",
    fontSize: "14px",
  },
  carouselWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    background: "#f3e6ec",
  },
  slideImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.85)",
    color: "#c44569",
    fontSize: "20px",
    lineHeight: "34px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  caption: {
    margin: "14px 0 6px",
    fontSize: "15px",
    color: "#6a2c70",
    fontStyle: "italic",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    margin: "4px 0 22px",
  },
  dot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "inline-block",
  },
  nextPageBtn: {
    width: "100%",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #c77dff, #c44569)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(196,69,105,0.4)",
  },
};
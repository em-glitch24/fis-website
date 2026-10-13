/* ============================================================
   Filipino Inventors Society — site scripts
   Each feature has its own init function and skips quietly if
   its elements are not on the page.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  initMobileNav();
  initHeroSlider(reduceMotion);
  initLeadership();
  initGallery();
  initLightbox();
  initEvents();
  initContactModal();
  initScrollReveal(reduceMotion);
  initScrollspy();
  initHeroInfoCard(reduceMotion);
});

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-open")),
  );
  nav
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => setOpen(false)));
}

/* ---------- Hero slider ---------- */
function initHeroSlider(reduceMotion) {
  const track = document.getElementById("heroTrack");
  const hero = document.getElementById("hero");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  if (!track || !hero || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

  const AUTOPLAY_MS = 6500;
  let current = 0;
  let timer = null;

  const stopAutoplay = () => clearInterval(timer);
  const startAutoplay = () => {
    stopAutoplay();
    if (reduceMotion || slides.length < 2) return;
    timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  };

  function goTo(index) {
    slides[current].classList.remove("is-active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    startAutoplay(); // restart the timer after every change
  }

  nextBtn.addEventListener("click", () => goTo(current + 1));
  prevBtn.addEventListener("click", () => goTo(current - 1));
  hero.addEventListener("mouseenter", stopAutoplay);
  hero.addEventListener("mouseleave", startAutoplay);

  startAutoplay();
}

/* ---------- Leadership carousel ---------- */
function initLeadership() {
  const section = document.getElementById("leadership");
  const prevBtn = document.getElementById("leadershipPrev");
  const nextBtn = document.getElementById("leadershipNext");
  const currentLabel = document.getElementById("leadershipCurrent");
  const totalLabel = document.getElementById("leadershipTotal");
  if (!section || !prevBtn || !nextBtn || !currentLabel) return;

  const media = Array.from(section.querySelectorAll(".leadership-media-item"));
  const profiles = Array.from(section.querySelectorAll(".leadership-profile"));
  const total = Math.min(media.length, profiles.length);
  if (!total) return;

  const pad = (n) => String(n).padStart(2, "0");
  let current = 0;

  // The counter total always matches the number of leaders in the HTML
  if (totalLabel) totalLabel.textContent = pad(total);

  // Reloading an iframe's src stops a video that is still playing
  const stopVideo = (item) => {
    const frame = item.querySelector("iframe");
    if (frame) frame.src = frame.src;
  };

  function show(index) {
    media[current].classList.remove("is-active");
    profiles[current].classList.remove("is-active");
    stopVideo(media[current]);

    current = (index + total) % total;

    media[current].classList.add("is-active");
    profiles[current].classList.add("is-active");
    currentLabel.textContent = pad(current + 1);
  }

  nextBtn.addEventListener("click", () => show(current + 1));
  prevBtn.addEventListener("click", () => show(current - 1));

  section.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });

  // Make sure exactly one leader is showing on load
  media.forEach((m) => m.classList.remove("is-active"));
  profiles.forEach((p) => p.classList.remove("is-active"));
  media[0].classList.add("is-active");
  profiles[0].classList.add("is-active");
  currentLabel.textContent = pad(1);
}

/* ---------- Gallery: scrolls on desktop, infinite swipe loop on phones ---------- */
function initGallery() {
  const gallery = document.querySelector(".gallery");
  const viewport = document.querySelector(".gallery-viewport");
  const track = document.getElementById("galleryTrack");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");
  if (!gallery || !viewport || !track || !prevBtn || !nextBtn) return;

  const first = track.querySelector(".gallery-item");
  if (!first) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // One step = one photo plus the gap between photos
  const step = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return first.offsetWidth + gap;
  };

  const scrollStep = (direction) =>
    viewport.scrollBy({
      left: direction * step(),
      behavior: reduceMotion ? "auto" : "smooth",
    });

  // Grey out the arrows at the start and end
  const updateArrows = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    prevBtn.disabled = viewport.scrollLeft <= 1;
    nextBtn.disabled = viewport.scrollLeft >= max - 1;
  };

  prevBtn.addEventListener("click", () => scrollStep(-1));
  nextBtn.addEventListener("click", () => scrollStep(1));
  viewport.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();

  initGalleryLoop(gallery, viewport, track);
}

/* Phone mode: photos sit around the center one, wrap around forever,
   and can be dragged left or right. */
function initGalleryLoop(gallery, viewport, track) {
  const items = Array.from(track.querySelectorAll(".gallery-item"));
  const n = items.length;
  if (n < 5) return; // too few photos to loop nicely

  const mq = window.matchMedia("(max-width: 560px)");
  const half = Math.floor(n / 2);

  let current = 0;
  let enabled = false;

  // Where each photo sits relative to the center: ..., -1, 0, 1, ...
  const offsetOf = (i) => ((((i - current + half) % n) + n) % n) - half;

  function render(skipAnimation = false) {
    items.forEach((item, i) => {
      const off = offsetOf(i);
      const prev = Number(item.dataset.offset);
      const jumped = !Number.isNaN(prev) && Math.abs(off - prev) > 1;

      // A photo wrapping from one end to the other should not fly across the screen
      if (skipAnimation || jumped) {
        item.classList.add("no-anim");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => item.classList.remove("no-anim")),
        );
      }

      item.dataset.offset = off;
      item.style.setProperty("--offset", off);
      item.classList.toggle("is-active", off === 0);
      item.classList.toggle("is-far", Math.abs(off) >= 3);
      item.tabIndex = off === 0 ? 0 : -1;
    });
  }

  function move(delta) {
    current = (((current + delta) % n) + n) % n;
    track.style.setProperty("--drag", "0px");
    render();
  }

  /* ----- Dragging ----- */
  let startX = 0;
  let startTime = 0;
  let dx = 0;
  let moved = false;
  let suppressClickUntil = 0;

  function onDown(e) {
    if (!enabled || !e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    startTime = performance.now();
    dx = 0;
    moved = false;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  function onMove(e) {
    const limit = viewport.clientWidth * 0.8;
    dx = Math.max(-limit, Math.min(limit, e.clientX - startX));
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      track.classList.add("is-dragging");
    }
    if (moved) track.style.setProperty("--drag", `${dx}px`);
  }

  function finish(commit) {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    track.classList.remove("is-dragging");

    if (moved) suppressClickUntil = performance.now() + 350;

    const elapsed = Math.max(1, performance.now() - startTime);
    const fast = Math.abs(dx) / elapsed > 0.35;
    const far = Math.abs(dx) > 50 || (Math.abs(dx) > 20 && fast);

    if (commit && moved && far) {
      move(dx < 0 ? 1 : -1); // swipe left shows the next photo
    } else {
      track.style.setProperty("--drag", "0px"); // snap back
    }
  }
  const onUp = () => finish(true);
  const onCancel = () => finish(false);

  viewport.addEventListener("pointerdown", onDown);

  // Tapping: a side photo moves to the center, the center photo opens the lightbox.
  // A tap that ends a drag does neither.
  viewport.addEventListener(
    "click",
    (e) => {
      if (!enabled) return;

      if (performance.now() < suppressClickUntil) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      const item = e.target.closest(".gallery-item");
      if (item && !item.classList.contains("is-active")) {
        e.stopPropagation();
        e.preventDefault();
        current = items.indexOf(item);
        render();
      }
    },
    true,
  );

  gallery.addEventListener("keydown", (e) => {
    if (!enabled) return;
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });

  /* ----- Switch on for phones, off for larger screens ----- */
  function enable() {
    if (enabled) return;
    enabled = true;
    gallery.classList.add("is-loop");
    viewport.scrollLeft = 0;
    render(true);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    gallery.classList.remove("is-loop");
    track.style.removeProperty("--drag");
    items.forEach((item) => {
      item.classList.remove("is-active", "is-far", "no-anim");
      item.style.removeProperty("--offset");
      item.removeAttribute("data-offset");
      item.removeAttribute("tabindex");
    });
  }

  const sync = () => (mq.matches ? enable() : disable());
  sync();
  mq.addEventListener("change", sync);
}

/* ---------- Lightbox: any element with data-full opens its image ---------- */
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  if (!lightbox || !lightboxImg || !lightboxClose) return;

  const close = () => {
    lightbox.classList.remove("is-open");
    lightboxImg.src = "";
  };

  document.querySelectorAll("[data-full]").forEach((el) => {
    el.addEventListener("click", () => {
      const thumb = el.querySelector("img");
      lightboxImg.src = el.dataset.full;
      lightboxImg.alt = thumb ? thumb.alt : "";
      lightbox.classList.add("is-open");
    });
  });

  lightboxClose.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* ---------- Events: status badges, session progress, placeholder buttons ---------- */
function initEvents() {
  const parseDate = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Badge on each event: Upcoming / Today / Happening now / Ended
  document.querySelectorAll(".ev-row[data-start]").forEach((row) => {
    const badge = row.querySelector("[data-status]");
    if (!badge) return;

    const start = parseDate(row.dataset.start);
    const end = parseDate(row.dataset.end || row.dataset.start);
    const sameDay = start.getTime() === end.getTime();

    badge.classList.remove("is-live", "is-ended");
    if (today < start) {
      badge.textContent = "Upcoming";
    } else if (today <= end) {
      badge.textContent = sameDay ? "Today" : "Happening now";
      badge.classList.add("is-live");
    } else {
      badge.textContent = "Ended";
      badge.classList.add("is-ended");
    }
  });

  // Training sessions: dim finished ones, mark the next one
  let nextMarked = false;
  document.querySelectorAll(".ev-sessions li[data-date]").forEach((li) => {
    const date = parseDate(li.dataset.date);
    if (date < today) {
      li.classList.add("is-past");
    } else if (!nextMarked) {
      li.classList.add("is-next");
      nextMarked = true;
    }
  });

  // Buttons without a real link yet do nothing
  document.querySelectorAll("[data-placeholder]").forEach((link) => {
    link.addEventListener("click", (e) => e.preventDefault());
  });
}

/* ---------- Contact modal (opens the visitor's email app) ---------- */
function initContactModal() {
  const modal = document.getElementById("contactModal");
  const openBtn = document.getElementById("contactOpenBtn");
  const closeBtn = document.getElementById("contactModalClose");
  const backdrop = document.getElementById("contactModalBackdrop");
  const form = document.getElementById("contactForm");
  if (!modal || !openBtn || !closeBtn || !backdrop || !form) return;

  const open = () => modal.classList.add("is-open");
  const close = () => modal.classList.remove("is-open");

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { name, email, phone, message } = form.elements;

    const subject = encodeURIComponent(`Website inquiry from ${name.value}`);
    const body = encodeURIComponent(
      `Name: ${name.value}\nEmail: ${email.value}\nPhone: ${phone.value}\n\nMessage:\n${message.value}`,
    );

    window.location.href = `mailto:info@fis.com.ph?subject=${subject}&body=${body}`;
  });
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal(reduceMotion) {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Scrollspy: highlight the nav link for the section in view ---------- */
function initScrollspy() {
  const links = Array.from(
    document.querySelectorAll(".primary-nav a[data-nav]"),
  );
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links
    .map((link) => document.getElementById(link.dataset.nav))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) =>
    links.forEach((link) =>
      link.classList.toggle("is-active", link.dataset.nav === id),
    );

  // Fires when a section crosses the vertical middle of the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));

  // Near the top of the page, Home is always the active link
  window.addEventListener("scroll", () => {
    if (window.scrollY < 200) setActive("hero");
  });
  setActive("hero");
}

/* ---------- Hero info card: slides in while the hero is visible ---------- */
function initHeroInfoCard(reduceMotion) {
  const hero = document.getElementById("hero");
  const card = document.querySelector(".hero-info-card");
  if (!hero || !card) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    card.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) =>
        card.classList.toggle("is-visible", entry.isIntersecting),
      );
    },
    { threshold: 0.4 },
  );
  observer.observe(hero);
}

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
  initEventsCollapse();
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

/* Mountain gallery: the center photo is the biggest and photos shrink toward
   the edges. No looping. It opens on a middle photo so the first view is
   symmetrical, and stops at the first and last photo.
   Drag, click a side photo, or use the arrow keys to move. */
function initGalleryLoop(gallery, viewport, track) {
  const items = Array.from(track.querySelectorAll(".gallery-item"));
  const n = items.length;
  if (n < 2) return;

  // Mountain shape controls
  const START = 4; // which photo shows in the center first (1 = first photo, 4 = fourth)
  const SHRINK = 0.22; // how much smaller each step away from the center gets
  const MIN_SCALE = 0.35; // smallest a photo can get
  const GAP = 0.03; // space between photos (fraction of the center photo width)

  // How many photos show on each side of the center one
  const phone = window.matchMedia("(max-width: 560px)");
  const reach = () => (phone.matches ? 1 : 2); // phones: 3 photos, larger screens: 5

  const clamp = (i) => Math.max(0, Math.min(n - 1, i));

  const scaleOf = (a) => Math.max(MIN_SCALE, 1 - a * SHRINK);

  // Distance from the center, in center-photo widths, so shrunk photos stay evenly spaced
  const positionOf = (off) => {
    let x = 0;
    for (let k = 1; k <= Math.abs(off); k++) {
      x += scaleOf(k - 1) / 2 + GAP + scaleOf(k) / 2;
    }
    return Math.sign(off) * x;
  };

  // Start in the middle, but never so close to an end that the first view is lopsided
  const r = Math.min(reach(), Math.floor((n - 1) / 2));
  let current = Math.max(r, Math.min(n - 1 - r, START - 1));

  function render(skipAnimation = false) {
    const visible = reach();

    items.forEach((item, i) => {
      const off = i - current; // no wrap-around
      const abs = Math.abs(off);

      if (skipAnimation) {
        item.classList.add("no-anim");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => item.classList.remove("no-anim")),
        );
      }

      item.style.setProperty("--tx", positionOf(off));
      item.style.setProperty("--scale", scaleOf(abs));
      item.style.zIndex = String(20 - abs);
      item.classList.toggle("is-active", off === 0);
      item.classList.toggle("is-far", abs > visible);
      item.tabIndex = off === 0 ? 0 : -1;
    });
  }

  function move(delta) {
    const next = clamp(current + delta);
    track.style.setProperty("--drag", "0px");
    if (next === current) return; // already at the first or last photo
    current = next;
    render();
  }

  /* ----- Dragging (mouse and touch) ----- */
  let startX = 0;
  let startTime = 0;
  let dx = 0;
  let moved = false;
  let suppressClickUntil = 0;

  function onDown(e) {
    if (!e.isPrimary) return;
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
    let raw = Math.max(-limit, Math.min(limit, e.clientX - startX));

    // At the first or last photo, dragging further feels stiff
    const atStart = current === 0 && raw > 0;
    const atEnd = current === n - 1 && raw < 0;
    if (atStart || atEnd) raw *= 0.3;

    dx = raw;
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
      move(dx < 0 ? 1 : -1); // drag left shows the next photo
    } else {
      track.style.setProperty("--drag", "0px"); // snap back
    }
  }
  const onUp = () => finish(true);
  const onCancel = () => finish(false);

  viewport.addEventListener("pointerdown", onDown);

  // Clicking: a side photo moves to the center, the center photo opens the lightbox.
  // A click that ends a drag does neither.
  viewport.addEventListener(
    "click",
    (e) => {
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
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });

  // Re-draw when the screen crosses the phone size (3 photos vs 5)
  phone.addEventListener("change", () => render(true));

  gallery.classList.add("is-loop");
  viewport.scrollLeft = 0;
  render(true);
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

/* ---------- Events: collapse / expand on mobile (collapsed by default) ---------- */
function initEventsCollapse() {
  const rows = Array.from(document.querySelectorAll(".ev-row"));
  if (!rows.length) return;

  const mq = window.matchMedia("(max-width: 859px)");

  function enable() {
    rows.forEach((row) => {
      const title = row.querySelector(".ev-name");
      if (!title || row.classList.contains("is-collapsible")) return;

      // Remember the original title text so it can be restored on desktop
      title.dataset.title = title.textContent.replace(/\s+/g, " ").trim();

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ev-toggle";
      btn.setAttribute("aria-expanded", "false");

      const label = document.createElement("span");
      label.textContent = title.dataset.title;

      const icon = document.createElement("span");
      icon.className = "ev-toggle-icon";
      icon.setAttribute("aria-hidden", "true");

      btn.append(label, icon);
      btn.addEventListener("click", () => {
        const open = row.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });

      title.textContent = "";
      title.appendChild(btn);
      row.classList.add("is-collapsible");
      row.classList.remove("is-open");
    });
  }

  function disable() {
    rows.forEach((row) => {
      const title = row.querySelector(".ev-name");
      if (!title || !row.classList.contains("is-collapsible")) return;
      title.textContent = title.dataset.title || title.textContent;
      row.classList.remove("is-collapsible", "is-open");
    });
  }

  const sync = () => (mq.matches ? enable() : disable());
  sync();
  mq.addEventListener("change", sync);
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

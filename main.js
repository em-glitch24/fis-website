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

/* ---------- Gallery carousel + lightbox ---------- */
function initGallery() {
  const track = document.getElementById("galleryTrack");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");
  if (!track || !prevBtn || !nextBtn) return;

  const items = Array.from(track.querySelectorAll(".gallery-item"));
  if (!items.length) return;

  const GAP = 16;
  let index = 0;

  const perView = () => {
    if (window.innerWidth <= 560) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  };
  const maxIndex = () => Math.max(0, items.length - perView());

  function update() {
    index = Math.min(index, maxIndex());
    const itemWidth = items[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${index * (itemWidth + GAP)}px)`;
  }

  nextBtn.addEventListener("click", () => {
    index = Math.min(index + 1, maxIndex());
    update();
  });
  prevBtn.addEventListener("click", () => {
    index = Math.max(index - 1, 0);
    update();
  });
  window.addEventListener("resize", update);
  update();

  /* Lightbox */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  if (!lightbox || !lightboxImg || !lightboxClose) return;

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightboxImg.src = "";
  };

  items.forEach((item) => {
    item.addEventListener("click", () => {
      lightboxImg.src = item.dataset.full;
      lightboxImg.alt = item.querySelector("img").alt;
      lightbox.classList.add("is-open");
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
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

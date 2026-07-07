// MeetandGreat.Co — site scripts

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("nav.main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  // Generic mailto-based form handler.
  // Works with zero backend: builds a mailto: link from the form fields
  // and opens the visitor's email client. Swap this for a real form
  // endpoint (Formspree, HubSpot, Google Forms) when one is connected.
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto");
      var subject = form.getAttribute("data-subject") || "Contato via site";
      var lines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (!el.name) return;
        var label = el.closest(".field") ? el.closest(".field").querySelector("label") : null;
        var name = label ? label.textContent.trim() : el.name;
        var value = el.value.trim();
        if (value) lines.push(name + ": " + value);
      });
      var body = encodeURIComponent(lines.join("\n"));
      var mailtoUrl = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + body;
      window.location.href = mailtoUrl;

      var note = form.querySelector(".form-sent-note");
      if (note) note.style.display = "block";
    });
  });

  // Cases reveal gallery — click/tap toggles the reveal (desktop already
  // gets it via CSS :hover; this covers touch devices and adds a11y parity).
  document.querySelectorAll(".case-reveal-panel").forEach(function (panel) {
    panel.addEventListener("click", function () {
      var wasOpen = panel.classList.contains("is-open");
      var group = panel.closest(".cases-reveal");
      if (group) {
        group.querySelectorAll(".case-reveal-panel").forEach(function (p) {
          p.classList.remove("is-open");
        });
      }
      if (!wasOpen) panel.classList.add("is-open");
    });
  });

  // Opportunity card "Ver detalhes" toggle — delegated because cards are
  // injected dynamically by content-render.js after this listener is set up.
  var vBlocks = document.getElementById("vertical-blocks");
  if (vBlocks) {
    vBlocks.addEventListener("click", function (e) {
      var btn = e.target.closest(".opp-toggle");
      if (!btn) return;
      var card = btn.closest(".opp-card");
      if (!card) return;
      var isOpen = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      var label = btn.querySelector(".opp-toggle-label");
      if (label) label.textContent = isOpen ? "Ver menos" : "Ver detalhes";
    });
  }

  // Highlight current page in nav
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.main-nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  // Static pages (no dynamic content-render.js on them) can reveal right away.
  if (!document.body.hasAttribute("data-dynamic")) {
    window.MGReveal.initReveal();
    window.MGReveal.initCounters();
  }
});

// ---------- Scroll reveal + counters (exposed so content-render.js can call
// them once dynamically-fetched cards have been injected into the page) ----------
window.MGReveal = {
  initReveal: function () {
    var revealSelector = ".diff-item, .opp-card, .vertical-card, .team-card, .case-reveal-panel, .contact-direct .person, .stats-band .stat, .section-head";
    var items = document.querySelectorAll(revealSelector + ":not(.reveal-armed)");
    if (!items.length) return;
    items.forEach(function (el) { el.classList.add("reveal-armed"); });

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("reveal-in"); });
      return;
    }

    // Stagger siblings that share a parent so groups (grids/lists) cascade in.
    var counts = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      var idx = counts.get(parent) || 0;
      counts.set(parent, idx + 1);
      el.style.transitionDelay = Math.min(idx * 70, 420) + "ms";
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  },

  initCounters: function () {
    var stats = document.querySelectorAll(".stats-band .stat b:not(.counter-armed)");
    if (!stats.length) return;
    stats.forEach(function (el) { el.classList.add("counter-armed"); });

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    function animateCount(el) {
      var raw = el.textContent.trim();
      var match = raw.match(/^([^\d]*)(\d+)(.*)$/);
      if (!match) return;
      var prefix = match[1], target = parseInt(match[2], 10), suffix = match[3];
      var duration = 1200;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target + suffix;
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    stats.forEach(function (el) { observer.observe(el); });
  }
};

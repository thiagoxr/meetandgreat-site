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

  // Highlight current page in nav
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.main-nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  // ---------- Scroll reveal ----------
  // Fades + slides content blocks into view as they enter the viewport.
  (function () {
    var revealSelector = ".diff-item, .opp-card, .vertical-card, .team-card, .case-card, .contact-direct .person, .stats-band .stat, .section-head";
    var items = document.querySelectorAll(revealSelector);
    if (!items.length) return;

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
  })();

  // ---------- Animated stat counters ----------
  // Counts each stat number up from 0 the first time it scrolls into view.
  (function () {
    var stats = document.querySelectorAll(".stats-band .stat b");
    if (!stats.length) return;

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
  })();
});

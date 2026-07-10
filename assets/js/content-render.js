// MeetandGreat.Co — dynamic content renderer
// Fetches JSON files from /content and injects the markup for cards, stats,
// team members, etc. so the site can be edited through the CMS at /admin
// without touching HTML. Falls back silently (keeps whatever is already in
// the page) if a fetch fails, so the site never shows a blank page.

(function () {
  function esc(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + path);
      return r.json();
    });
  }

  function setText(sel, text) {
    var el = document.querySelector(sel);
    if (el && text !== undefined) el.textContent = text;
  }

  function visible(list) {
    return (list || []).filter(function (item) { return !item.hidden; });
  }

  function waLink(number, personName) {
    if (!number) return "";
    var digits = String(number).replace(/\D/g, "");
    var msg = "Olá" + (personName ? " " + personName : "") + "! Vim pelo site da MeetandGreat.Co.";
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(msg);
  }

  function oppDetailHTML(card) {
    if (!card.detail) return "";
    var paragraphs = String(card.detail).split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
    return (
      '<div class="opp-detail">' +
      (card.image ? '<img src="' + esc(card.image) + '" alt="' + esc(card.name) + '" loading="lazy">' : '<div class="opp-detail-placeholder" aria-hidden="true"></div>') +
      paragraphs +
      "</div>"
    );
  }

  function oppCardHTML(card) {
    var hasDetail = !!card.detail;
    return (
      '<div class="opp-card">' +
      "<h4>" + esc(card.name) + "</h4>" +
      (card.location ? '<span class="loc">' + esc(card.location) + "</span>" : "") +
      "<p>" + esc(card.description) + "</p>" +
      '<div class="opp-meta"><div><b>' + esc(card.value) + "</b><span>" + esc(card.valueLabel) + "</span></div>" +
      "<div><b>" + esc(card.period) + "</b><span>" + esc(card.periodLabel) + "</span></div></div>" +
      (hasDetail ? oppDetailHTML(card) : "") +
      '<div class="opp-actions">' +
      '<a class="interest" href="contato.html?interesse=' + esc(card.interestQuery) + '">Tenho interesse →</a>' +
      "</div>" +
      "</div>"
    );
  }

  function diffItemHTML(item) {
    return (
      '<div class="diff-item"><h4>' + esc(item.title) + "</h4><p>" + esc(item.description) + "</p></div>"
    );
  }

  function countNoun(slug) {
    if (slug === "comunicacao") return "talentos";
    if (slug === "social") return "causas";
    return "oportunidades";
  }

  // ---------- Home page ----------
  function renderHome() {
    Promise.all([getJSON("content/home.json"), getJSON("content/portfolio.json")])
      .then(function (results) {
        var home = results[0];
        var portfolio = results[1];

        if (home.hero) {
          setText(".hero-content h1", home.hero.title);
          setText(".hero-content p.lead", home.hero.lead);
          var p1 = document.querySelector(".hero-cta a.btn-primary");
          if (p1) { p1.textContent = home.hero.ctaPrimaryText; p1.setAttribute("href", home.hero.ctaPrimaryLink); }
          var p2 = document.querySelector(".hero-cta a.btn-outline");
          if (p2) { p2.textContent = home.hero.ctaSecondaryText; p2.setAttribute("href", home.hero.ctaSecondaryLink); }
        }

        if (home.whatWeDo) {
          setText("#what-we-do .eyebrow", home.whatWeDo.eyebrow);
          setText("#what-we-do h2", home.whatWeDo.title);
          setText("#what-we-do .section-head p", home.whatWeDo.description);
          var grid = document.querySelector("#what-we-do .grid-3");
          if (grid) grid.innerHTML = visible(home.whatWeDo.items).map(diffItemHTML).join("");
        }

        if (home.verticalsSection) {
          setText("#verticals-section .eyebrow", home.verticalsSection.eyebrow);
          setText("#verticals-section h2", home.verticalsSection.title);
          setText("#verticals-section .section-head p", home.verticalsSection.description);
        }
        var cardsWrap = document.querySelector("#verticals-section .grid-cards");
        if (cardsWrap && portfolio.verticals) {
          cardsWrap.innerHTML = portfolio.verticals.map(function (v) {
            var count = visible(v.cards).length;
            return (
              '<a class="vertical-card ' + v.colorClass + '" href="portfolio.html#' + v.slug + '">' +
              '<span class="count">' + count + " " + countNoun(v.slug) + "</span>" +
              "<h3>" + esc(v.navLabel) + "</h3>" +
              '<span class="arrow">→</span></a>'
            );
          }).join("");
        }

        if (home.cases) {
          setText("#cases-section .eyebrow", home.cases.eyebrow);
          setText("#cases-section h2", home.cases.title);
          setText("#cases-section p", home.cases.description);
          [
            [".case-1", home.cases.photoOne],
            [".case-2", home.cases.photoTwo],
            [".case-3", home.cases.photoThree]
          ].forEach(function (pair) {
            var panel = document.querySelector(pair[0]);
            var data = pair[1];
            if (!panel || !data) return;
            var img = panel.querySelector("img"); if (img) { img.src = data.image; img.alt = data.label; }
            var name = panel.querySelector(".case-reveal-name"); if (name) name.textContent = data.label;
          });
          var band = document.querySelector(".stats-band");
          if (band && home.cases.stats) {
            band.innerHTML = home.cases.stats.map(function (s) {
              return '<div class="stat"><b>' + esc(s.value) + "</b><span>" + esc(s.label) + "</span></div>";
            }).join("");
          }
        }

        if (home.ctaFinal) {
          setText("#cta-final h2", home.ctaFinal.title);
          setText("#cta-final p", home.ctaFinal.description);
          var c1 = document.querySelector("#cta-final .btn-primary");
          if (c1) { c1.textContent = home.ctaFinal.primaryText; c1.setAttribute("href", home.ctaFinal.primaryLink); }
          var c2 = document.querySelector("#cta-final .btn-outline");
          if (c2) { c2.textContent = home.ctaFinal.secondaryText; c2.setAttribute("href", home.ctaFinal.secondaryLink); }
        }
      })
      .catch(function (err) { console.warn("content-render (home):", err); })
      .finally(function () { window.MGReveal.initReveal(); window.MGReveal.initCounters(); });
  }

  // ---------- Portfolio page ----------
  function renderPortfolio() {
    getJSON("content/portfolio.json")
      .then(function (data) {
        if (data.intro) {
          setText(".tagline", data.intro.tagline);
          setText("h1", data.intro.title);
          setText(".tight.bg-dark p", data.intro.description);
        }

        var jumpNav = document.querySelector(".jump-nav");
        if (jumpNav && data.verticals) {
          jumpNav.innerHTML = data.verticals.map(function (v) {
            return '<a href="#' + v.slug + '">' + esc(v.navLabel) + "</a>";
          }).join("");
        }

        var container = document.querySelector("#vertical-blocks");
        if (container && data.verticals) {
          container.innerHTML = data.verticals.map(function (v) {
            var cards = visible(v.cards).map(oppCardHTML).join("");
            return (
              '<section class="vertical-block ' + v.tintClass + '" id="' + v.slug + '">' +
              '<div class="wrap">' +
              '<span class="vertical-title ' + v.colorClass + '">' + esc(v.titleLine) + "</span>" +
              (v.intro ? '<p style="max-width:640px;">' + esc(v.intro) + "</p>" : "") +
              '<div class="opp-grid">' + cards + "</div>" +
              "</div></section>"
            );
          }).join("");
        }
      })
      .catch(function (err) { console.warn("content-render (portfolio):", err); })
      .finally(function () { window.MGReveal.initReveal(); window.MGReveal.initCounters(); });
  }

  // ---------- Sobre page ----------
  function renderSobre() {
    getJSON("content/sobre.json")
      .then(function (data) {
        if (data.intro) {
          setText("h1", data.intro.title);
          setText(".tight.bg-dark p", data.intro.description);
        }
        if (data.missao) {
          setText("#missao .eyebrow", data.missao.eyebrow);
          setText("#missao h2", data.missao.title);
          setText("#missao .section-head p", data.missao.description);
          var list = document.querySelector("#missao .diff-list");
          if (list) list.innerHTML = visible(data.missao.items).map(diffItemHTML).join("");
        }
        if (data.time) {
          setText("#time .eyebrow", data.time.eyebrow);
          setText("#time h2", data.time.title);
          var teamWrap = document.querySelector("#time-cards");
          if (teamWrap) {
            teamWrap.innerHTML = visible(data.time.members).map(function (m) {
              return (
                '<div class="team-card"><img src="' + esc(m.photo) + '" alt="' + esc(m.name) + '">' +
                "<div><span class=\"role\">" + esc(m.role) + "</span><h3>" + esc(m.name) + "</h3>" +
                "<p>" + esc(m.description) + '</p><a class="linkedin" href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a>" +
                (m.whatsapp ? '<a class="linkedin whatsapp-link" href="' + esc(waLink(m.whatsapp, m.name)) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
                "</div></div>"
              );
            }).join("");
          }
        }
        if (data.ctaFinal) {
          setText("#cta-final h2", data.ctaFinal.title);
          setText("#cta-final p", data.ctaFinal.description);
          var c1 = document.querySelector("#cta-final .btn-primary");
          if (c1) { c1.textContent = data.ctaFinal.primaryText; c1.setAttribute("href", data.ctaFinal.primaryLink); }
          var c2 = document.querySelector("#cta-final .btn-outline");
          if (c2) { c2.textContent = data.ctaFinal.secondaryText; c2.setAttribute("href", data.ctaFinal.secondaryLink); }
        }
      })
      .catch(function (err) { console.warn("content-render (sobre):", err); })
      .finally(function () { window.MGReveal.initReveal(); window.MGReveal.initCounters(); });
  }

  // ---------- Cadastro comercial page ----------
  function renderCadastro() {
    getJSON("content/cadastro.json")
      .then(function (data) {
        if (data.intro) {
          setText("h1", data.intro.title);
          setText(".tight.bg-dark p", data.intro.description);
        }
        if (data.diffs) {
          var list = document.querySelector(".diff-list");
          if (list) list.innerHTML = visible(data.diffs.items).map(diffItemHTML).join("");
        }
        if (data.ctaFinal) {
          setText("#cta-final h2", data.ctaFinal.title);
          setText("#cta-final p", data.ctaFinal.description);
          var c1 = document.querySelector("#cta-final .btn-primary");
          if (c1) { c1.textContent = data.ctaFinal.primaryText; c1.setAttribute("href", data.ctaFinal.primaryLink); }
        }
      })
      .catch(function (err) { console.warn("content-render (cadastro):", err); })
      .finally(function () { window.MGReveal.initReveal(); window.MGReveal.initCounters(); });
  }

  // ---------- Contato page ----------
  function renderContato() {
    getJSON("content/contato.json")
      .then(function (data) {
        if (data.intro) {
          setText("h1", data.intro.title);
          setText(".tight.bg-dark p", data.intro.description);
        }
        var wrap = document.querySelector(".contact-direct");
        if (wrap && data.people) {
          wrap.innerHTML = visible(data.people).map(function (p) {
            return (
              '<div class="person"><h4>' + esc(p.name) + '</h4><span style="font-size:.82rem;color:var(--ink-soft);">' +
              esc(p.role) + '</span><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" +
              (p.whatsapp ? '<a class="whatsapp-link" href="' + esc(waLink(p.whatsapp, p.name)) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
              "</div>"
            );
          }).join("");
        }
      })
      .catch(function (err) { console.warn("content-render (contato):", err); })
      .finally(function () { window.MGReveal.initReveal(); window.MGReveal.initCounters(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHome();
    else if (page === "portfolio") renderPortfolio();
    else if (page === "sobre") renderSobre();
    else if (page === "cadastro") renderCadastro();
    else if (page === "contato") renderContato();
  });
})();

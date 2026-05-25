(function () {
    /* ===================================================================
       PASTE YOUR ENDPOINT URL HERE.
       URL of your deployed read function, e.g.
       "https://your-project.vercel.app/api/testimonials"
       =================================================================== */
    var FEED_ENDPOINT = "https://testimonials-api.vercel.app/api/testimonials";

    /* Element lookups are deferred: a WordPress Custom HTML block can run
       this script before the markup exists in the DOM. */
    var root, track, strip;

    function init() {
      root  = document.getElementById("zd-marquee");
      if (!root) return;
      if (root.dataset.zdInit === "1") return;
      root.dataset.zdInit = "1";
      track = root.querySelector("#zd-track");
      strip = root.querySelector("#zd-strip-track");
      if (!track || !strip) return;
      run();
    }

    function run() {

    /* fill the yellow strip with brand phrases */
    var phrases = ["REAL WORDS", "FROM REAL PEOPLE", "&#9733;", "WHAT IT'S ACTUALLY LIKE", "&#9733;", "ZOE DEW"];
    strip.innerHTML = phrases.concat(phrases).map(function (p) {
      return "<span>" + p + "</span>";
    }).join("");

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function initials(name) {
      var parts = String(name || "").trim().split(/\s+/).slice(0, 2);
      return parts.map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || "?";
    }

    function cardHTML(t) {
      var stars = (t.rating >= 1 && t.rating <= 5)
        ? new Array(Math.round(t.rating) + 1).join("&#9733;") : "";

      /* line under the name: role + company, whichever exist */
      var org = [t.role, t.company].filter(Boolean).join(", ");

      var avatar = t.photo
        ? '<img class="zd-avatar" src="' + esc(t.photo) + '" alt="' + esc(t.name) + '" loading="lazy" '
          + 'onerror="this.outerHTML=\'<div class=&quot;zd-avatar-fallback&quot;>'
          + esc(initials(t.name)) + '</div>\'">'
        : '<div class="zd-avatar-fallback">' + esc(initials(t.name)) + '</div>';

      var tab = t.workType ? '<span class="zd-cardtab">' + esc(t.workType) + '</span>' : '';

      return '' +
        '<div class="zd-card">' +
          tab +
        '  <div class="zd-rating">' + stars + '</div>' +
        '  <p class="zd-quote">' + esc(t.testimonial) + '</p>' +
        '  <div class="zd-person">' +
             avatar +
        '    <div>' +
        '      <div class="zd-name">' + esc(t.name) + '</div>' +
        (org ? '      <div class="zd-org">' + esc(org) + '</div>' : '') +
        '    </div>' +
        '  </div>' +
        '</div>';
    }

    function render(list) {
      if (!list || !list.length) { root.style.display = "none"; return; }
      var html = list.map(cardHTML).join("");
      track.innerHTML = html + html;  /* doubled for the seamless -50% loop */
      root.style.setProperty("--speed", (list.length * 7) + "s");
      var cards = track.children;
      for (var i = list.length; i < cards.length; i++) {
        cards[i].setAttribute("aria-hidden", "true");
      }
    }

    if (FEED_ENDPOINT.indexOf("REPLACE_WITH") === 0) {
      console.warn("[zd-marquee] FEED_ENDPOINT not set - widget hidden.");
      root.style.display = "none";
      return;
    }

    fetch(FEED_ENDPOINT)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) { render(data && data.testimonials); })
      .catch(function (err) {
        console.warn("[zd-marquee] could not load testimonials:", err);
        root.style.display = "none";
      });

    } /* end run */

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

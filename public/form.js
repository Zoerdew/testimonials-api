(function () {
    /* ===================================================================
       PASTE YOUR ENDPOINT URL HERE.
       URL of your deployed submit function, e.g.
       "https://your-project.vercel.app/api/submit"
       =================================================================== */
    var SUBMIT_ENDPOINT = "https://testimonials-api.vercel.app/api/submit";

    /* -------------------------------------------------------------------
       QUESTION SETS. Plain language, no coach-speak. "main" is the answer
       that becomes the website quote. The rest are saved as background.
       ------------------------------------------------------------------- */
    var QUESTIONS = {
      "One-to-one": [
        { id: "before", label: "What were you trying to sort out when you came to me?",
          help: "The thing that was on your plate at the start." },
        { id: "did",    label: "What did we actually do?",
          help: "A line or two on the work itself." },
        { id: "main",   label: "What's different now?",
          main: true }
      ],
      "Training": [
        { id: "before", label: "What was the training on, and who was in the room?",
          help: "The topic and the kind of people you brought me in for." },
        { id: "main",   label: "What's one thing people took away and used?",
          main: true },
        { id: "again",  label: "Would you book me again?",
          help: "Yes or no, and why." }
      ],
      "Speaking": [
        { id: "before", label: "What was the event, and what did I speak about?",
          help: "Where it was and the talk itself." },
        { id: "main",   label: "What did people say afterwards?",
          main: true },
        { id: "again",  label: "Would you have me back?",
          help: "Yes or no, and why." }
      ],
      "100 Reps Club": [
        { id: "before", label: "What made you join the 100 Reps Club?",
          help: "What was going on in your business at the time." },
        { id: "shift",  label: "Before the club, what did you think counted as sales activity? What do you count now?",
          help: "What changed in how you think about it." },
        { id: "main",   label: "What's your biggest win since you joined?",
          main: true }
      ],
      "Something else": [
        { id: "before", label: "What was the work?",
          help: "Tell me what we did." },
        { id: "main",   label: "What changed because of it?",
          main: true }
      ]
    };

    /* asked for everyone, after the type-specific questions.
       label is set per-type at build time (join vs work with me). */
    function recommendQuestion(type) {
      var isClub = type === "100 Reps Club";
      return {
        id: "recommend",
        label: isClub
          ? "If a friend asked whether they should join, what would you say?"
          : "If a friend asked whether they should work with me, what would you say?",
        help: "Say it how you'd say it to them."
      };
    }

    /* -------------------------------------------------------------------
       Element lookups are deferred and scoped to the #zd-tform container.
       Deferred: a WordPress Custom HTML block can run this script before
       the form markup exists in the DOM. Scoped: protects against another
       plugin on the page using a clashing id.
       ------------------------------------------------------------------- */
    var root, form, typesBox, qBox, aboutBox, wtInput, btn, msg, stars, ratingIn;

    function init() {
      root = document.getElementById("zd-tform");
      if (!root) return;                 // markup not on the page
      if (root.dataset.zdInit === "1") return;  // guard against double-init
      root.dataset.zdInit = "1";

      var $ = function (id) { return root.querySelector("#" + id); };
      form     = $("zd-form");
      typesBox = $("zd-types");
      qBox     = $("zd-questions");
      aboutBox = $("zd-about");
      wtInput  = $("zd-worktype");
      btn      = $("zd-submit");
      msg      = $("zd-msg");
      stars    = $("zd-stars");
      ratingIn = $("zd-rating");

      if (!form || !typesBox || !qBox) return;  // markup incomplete, bail safely

      wireUp();
    }

    function wireUp() {

    /* ---- work-type selection ---- */
    typesBox.addEventListener("click", function (e) {
      var b = e.target.closest(".zd-type");
      if (!b) return;
      typesBox.querySelectorAll(".zd-type").forEach(function (x) {
        x.classList.toggle("on", x === b);
        x.setAttribute("aria-checked", x === b);
      });
      wtInput.value = b.dataset.type;
      hideErr("err-type");
      buildQuestions(b.dataset.type);
      aboutBox.classList.remove("zd-hidden");
    });

    function buildQuestions(type) {
      var set = QUESTIONS[type] || [];
      var html = "";
      set.concat([recommendQuestion(type)]).forEach(function (q) {
        var opt = q.optional ? ' <span class="zd-opt">(optional)</span>' : "";
        html +=
          '<label class="zd-q" for="q-' + q.id + '">' + q.label + opt + '</label>' +
          (q.help ? '<p class="zd-help">' + q.help + '</p>' : '') +
          '<textarea id="q-' + q.id + '" data-qid="' + q.id +
            '" data-main="' + (q.main ? "1" : "") +
            '" data-optional="' + (q.optional ? "1" : "") + '"></textarea>' +
          '<div class="zd-fielderr" id="err-q-' + q.id + '">Add a line here.</div>';
      });
      qBox.innerHTML = html;
      qBox.classList.remove("zd-hidden");
    }

    /* ---- star rating ---- */
    function paintStars(v) {
      stars.querySelectorAll(".zd-star").forEach(function (s) {
        s.classList.toggle("on", Number(s.dataset.val) <= v);
        s.setAttribute("aria-checked", Number(s.dataset.val) === v);
      });
    }
    stars.addEventListener("click", function (e) {
      var s = e.target.closest(".zd-star"); if (!s) return;
      var v = Number(s.dataset.val);
      if (ratingIn.value === String(v)) { ratingIn.value = ""; paintStars(0); }
      else { ratingIn.value = String(v); paintStars(v); }
    });
    stars.addEventListener("keydown", function (e) {
      var s = e.target.closest(".zd-star"); if (!s) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); s.click(); }
    });

    /* ---- helpers ---- */
    function showErr(id) { var el = document.getElementById(id); if (el) el.style.display = "block"; }
    function hideErr(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; }
    function setMsg(t) { msg.textContent = t; msg.className = "zd-msg zd-err"; }

    /* ---- submit ---- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "zd-msg";
      var ok = true;

      if (!wtInput.value) { showErr("err-type"); ok = false; }

      var name = form.name.value.trim();
      var company = form.company.value.trim();
      hideErr("err-name"); hideErr("err-company");
      if (!name)    { showErr("err-name"); ok = false; }
      if (!company) { showErr("err-company"); ok = false; }

      /* the "main" question is required; others are required unless marked optional */
      var areas = qBox.querySelectorAll("textarea");
      var mainText = "", contextParts = [], recommendText = "";
      areas.forEach(function (ta) {
        var val = ta.value.trim();
        hideErr("err-q-" + ta.dataset.qid);
        var required = ta.dataset.main === "1" || ta.dataset.optional !== "1";
        if (required && !val) { showErr("err-q-" + ta.dataset.qid); ok = false; }

        if (ta.dataset.main === "1") {
          mainText = val;
        } else if (ta.dataset.qid === "recommend") {
          recommendText = val;
        } else if (val) {
          var lbl = document.querySelector('label[for="q-' + ta.dataset.qid + '"]');
          contextParts.push((lbl ? lbl.textContent.replace(/\s*\(optional\)\s*$/, "") : ta.dataset.qid)
            + "\n" + val);
        }
      });

      if (!ok) { setMsg("A couple of things still need filling in (marked in red)."); return; }

      /* honeypot tripped -> fake success, drop silently */
      if (document.getElementById("zd-hp").value) { renderDone(); return; }

      if (SUBMIT_ENDPOINT.indexOf("REPLACE_WITH") === 0) {
        setMsg("This form isn't connected yet. The SUBMIT_ENDPOINT URL still needs setting.");
        return;
      }

      var payload = {
        workType: wtInput.value,
        name: name,
        company: company,
        role: form.role.value.trim(),
        link: form.link.value.trim(),
        photo: form.photo.value.trim(),
        testimonial: mainText,
        context: contextParts.join("\n\n"),
        recommend: recommendText,
        rating: ratingIn.value ? Number(ratingIn.value) : null
      };

      btn.disabled = true;
      btn.textContent = "Sending...";

      fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        return r.json().catch(function () { return {}; });
      })
      .then(function () { renderDone(); })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Send it";
        setMsg("Something went wrong sending that. Give it another go in a moment.");
      });
    });

    function renderDone() {
      var wrap = root.querySelector(".zd-wrap");
      if (!wrap) return;
      wrap.innerHTML =
        '<div class="zd-sticker zd-sticker--head zd-done" style="transform:rotate(-1deg);">' +
        '  <span class="zd-tab zd-tab--pink">Done</span>' +
        '  <div class="zd-big">&#10003;</div>' +
        '  <h2>Thank you, <span class="zd-accent">really</span>.</h2>' +
        '  <p class="zd-lead">That\'s in. It\'ll show up on the site once I\'ve given it a quick look.</p>' +
        '</div>';
    }

    } /* end wireUp */

    /* Run init now if the DOM is ready, otherwise wait for it.
       Covers both: script after the markup, and script run early by a
       WordPress Custom HTML block before the markup is parsed. */
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

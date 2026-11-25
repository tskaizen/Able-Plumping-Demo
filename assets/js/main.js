/* Able Plumbing - site script. Config first, nothing buried in markup logic. */
const CONFIG = {
  PHONE_DISPLAY: "(561) 582-1819",
  PHONE_TEL: "+15615821819",
  TIMEZONE: "America/New_York",
  OPEN_HOUR: 7,          // 7 AM
  CLOSE_HOUR: 16,        // 4 PM
  OPEN_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
  FORM_ENDPOINT: "",     // Set to a form endpoint (e.g. Formspree) to send requests. Empty = demo mode.
  MAX_FILE_MB: 25,
  MAX_FILES: 5
};

document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Time in Lake Worth Beach ---------- */
function localNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.TIMEZONE, weekday: "short", hour: "numeric", minute: "numeric", hour12: false
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: days[get("weekday")], hour: Number(get("hour")) % 24, minute: Number(get("minute")) };
}
function officeOpen(now = localNow()) {
  return CONFIG.OPEN_DAYS.includes(now.day) && now.hour >= CONFIG.OPEN_HOUR && now.hour < CONFIG.CLOSE_HOUR;
}

/* ---------- Status banner ---------- */
function updateStatus() {
  const now = localNow();
  const open = officeOpen(now);
  document.querySelectorAll("[data-status]").forEach((el) => {
    el.dataset.state = open ? "open" : "after";
    const label = el.querySelector(".status__label");
    const note = el.querySelector(".status__note");
    if (label) label.textContent = open ? "Office open now" : "Emergency line available";
    if (note) note.textContent = open ? "Until 4 PM today" : "Call for after hours and weekend service";
  });
  document.querySelectorAll(".hours tr[data-day]").forEach((tr) => {
    tr.classList.toggle("is-today", tr.dataset.day.split(",").map(Number).includes(now.day));
  });
}
updateStatus();
setInterval(updateStatus, 60 * 1000);

/* ---------- Header height var for mobile menu ---------- */
function setStatusHeight() {
  const bar = document.querySelector(".demo-banner");
  if (bar) document.documentElement.style.setProperty("--status-h", bar.offsetHeight + "px");
}
setStatusHeight();
window.addEventListener("resize", setStatusHeight);

/* ---------- Navigation ---------- */
(function nav() {
  const navEl = document.querySelector(".nav");
  const menuBtn = document.querySelector(".menu-btn");
  const drops = document.querySelectorAll(".nav__item--drop");
  const desktop = window.matchMedia("(min-width: 961px)");

  if (menuBtn && navEl) {
    menuBtn.addEventListener("click", () => {
      const open = navEl.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.querySelector(".menu-btn__label").textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
      setStatusHeight();
    });
  }

  drops.forEach((item) => {
    const toggle = item.querySelector(".nav__toggle");
    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!item.classList.contains("is-open")));
    item.addEventListener("mouseenter", () => { if (desktop.matches) setOpen(true); });
    item.addEventListener("mouseleave", () => { if (desktop.matches) setOpen(false); });
    item.addEventListener("focusout", (e) => { if (desktop.matches && !item.contains(e.relatedTarget)) setOpen(false); });
    item.addEventListener("keydown", (e) => { if (e.key === "Escape") { setOpen(false); toggle.focus(); } });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navEl && navEl.classList.contains("is-open")) menuBtn.click();
  });
})();

/* ---------- Pipe joints connect on scroll ---------- */
(function joints() {
  const els = document.querySelectorAll(".joint");
  if (!els.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((j) => j.classList.add("is-connected")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-connected"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12% 0px" });
  els.forEach((j) => io.observe(j));
})();

/* ---------- Counters ---------- */
(function counters() {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  const fmt = (n, el) => (el.dataset.format === "comma" ? n.toLocaleString("en-US") : String(n)) + (el.dataset.suffix || "");
  const finish = (el) => { el.textContent = fmt(Number(el.dataset.count), el); };
  if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(finish); return; }
  const run = (el) => {
    const end = Number(el.dataset.count);
    const start = Number(el.dataset.from || 0);
    const dur = 1100;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(start + (end - start) * eased), el);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
})();

/* ---------- Gallery filter ---------- */
(function gallery() {
  const chips = document.querySelectorAll(".chip[data-filter]");
  if (!chips.length) return;
  const items = document.querySelectorAll(".gallery [data-cat]");
  const status = document.querySelector("#gallery-status");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    let shown = 0;
    items.forEach((it) => { const match = f === "all" || it.dataset.cat === f; it.hidden = !match; if (match) shown++; });
    if (status) status.textContent = `Showing ${shown} ${shown === 1 ? "project" : "projects"}`;
  }));
})();

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- Schedule Service form ---------- */
(function scheduleForm() {
  const form = document.querySelector("#schedule-form");
  if (!form) return;

  const steps = [...form.querySelectorAll(".step")];
  const progress = [...document.querySelectorAll(".progress li")];
  const backBtn = form.querySelector("[data-back]");
  const nextBtn = form.querySelector("[data-next]");
  const submitBtn = form.querySelector("[data-submit]");
  const success = document.querySelector("#form-success");
  const errorBox = form.querySelector("#form-error");
  let current = 0;
  let files = [];

  // Preselect service from ?service=
  const preset = new URLSearchParams(location.search).get("service");
  if (preset) {
    const radio = form.querySelector(`input[name="service"][value="${CSS.escape(preset)}"]`);
    if (radio) radio.checked = true;
  }

  // Date input: earliest is today in Lake Worth Beach
  const dateInput = form.querySelector("#visit-date");
  if (dateInput) {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE }));
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    dateInput.min = iso(d);
    const max = new Date(d); max.setDate(max.getDate() + 60);
    dateInput.max = iso(max);
  }

  function setError(field, msg) {
    const id = field.getAttribute("aria-describedby")?.split(" ").find((x) => x.endsWith("-error"));
    const box = id ? document.getElementById(id) : null;
    if (box) box.textContent = msg || "";
    if (field.type !== "radio") field.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validateStep(i) {
    const step = steps[i];
    let firstBad = null;

    // Radio groups
    const groups = new Set([...step.querySelectorAll("input[type=radio][required]")].map((r) => r.name));
    groups.forEach((name) => {
      const radios = step.querySelectorAll(`input[name="${name}"]`);
      const ok = [...radios].some((r) => r.checked);
      const box = document.getElementById(`${name}-error`);
      if (box) box.textContent = ok ? "" : box.dataset.msg;
      if (!ok && !firstBad) firstBad = radios[0];
    });

    // Other fields
    step.querySelectorAll("input:not([type=radio]):not([type=file]), textarea, select").forEach((f) => {
      let msg = "";
      const v = f.value.trim();
      if (f.required && !v) msg = f.dataset.msgRequired || "This field is required.";
      else if (v && f.type === "tel" && v.replace(/\D/g, "").length < 10) msg = "Enter a 10 digit phone number, like (561) 555-0100.";
      else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Enter an email address like name@example.com.";
      else if (v && f.id === "describe" && v.length < 10) msg = "Add a little more detail so the plumber knows what to bring.";
      else if (v && f.id === "visit-date") {
        const [y, m, d] = v.split("-").map(Number);
        const day = new Date(y, m - 1, d).getDay();
        if (day === 0 || day === 6) msg = `Scheduled visits run Monday to Friday. For a weekend emergency, call ${CONFIG.PHONE_DISPLAY}.`;
        else if (f.min && v < f.min) msg = "Pick today or a later date.";
      }
      setError(f, msg);
      if (msg && !firstBad) firstBad = f;
    });

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function show(i) {
    steps.forEach((s, n) => { s.hidden = n !== i; });
    progress.forEach((p, n) => {
      if (n === i) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current");
      p.classList.toggle("is-done", n < i);
    });
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === steps.length - 1;
    submitBtn.hidden = i !== steps.length - 1;
    current = i;
    const legend = steps[i].querySelector("legend");
    legend.setAttribute("tabindex", "-1");
    legend.focus({ preventScroll: true });
    const top = form.closest(".form-shell").getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > top) window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  nextBtn.addEventListener("click", () => { if (validateStep(current)) show(current + 1); });
  backBtn.addEventListener("click", () => show(current - 1));

  // Clear errors as people fix fields
  form.addEventListener("input", (e) => {
    const f = e.target;
    if (f.type === "radio") { const box = document.getElementById(`${f.name}-error`); if (box) box.textContent = ""; }
    else if (f.getAttribute("aria-invalid") === "true") setError(f, "");
  });

  // Files
  const fileInput = form.querySelector("#media");
  const list = form.querySelector(".file-list");
  const drop = form.querySelector(".dropzone");
  const fileErr = form.querySelector("#media-error");
  const human = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

  function renderFiles() {
    list.innerHTML = "";
    files.forEach((f, i) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = `${f.name} (${human(f.size)})`;
      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "Remove";
      rm.setAttribute("aria-label", `Remove ${f.name}`);
      rm.addEventListener("click", () => { files.splice(i, 1); renderFiles(); fileInput.focus(); });
      li.append(name, rm);
      list.append(li);
    });
  }
  function addFiles(incoming) {
    const msgs = [];
    [...incoming].forEach((f) => {
      if (!/^(image|video)\//.test(f.type)) msgs.push(`${f.name} isn't a photo or video.`);
      else if (f.size > CONFIG.MAX_FILE_MB * 1048576) msgs.push(`${f.name} is over ${CONFIG.MAX_FILE_MB} MB. Try a shorter clip.`);
      else if (files.length >= CONFIG.MAX_FILES) msgs.push(`You can attach up to ${CONFIG.MAX_FILES} files.`);
      else files.push(f);
    });
    fileErr.textContent = [...new Set(msgs)].join(" ");
    renderFiles();
  }
  if (fileInput) {
    fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
    ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));
    drop.addEventListener("drop", (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
  }

  function summaryRows() {
    const fd = new FormData(form);
    const label = (name) => {
      const el = form.querySelector(`input[name="${name}"]:checked`);
      return el ? el.closest(".choice").querySelector(".choice__name").textContent : "";
    };
    let date = fd.get("date");
    if (date) {
      const [y, m, d] = date.split("-").map(Number);
      date = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    }
    return [
      ["Service", label("service")],
      ["Problem", fd.get("describe")],
      ["Water leaking now", label("leaking")],
      ["Photos or video", files.length ? files.map((f) => f.name).join(", ") : "None attached"],
      ["Preferred day", date],
      ["Time window", label("window")],
      ["Name", fd.get("name")],
      ["Phone", fd.get("phone")],
      ["Email", fd.get("email") || "Not provided"],
      ["Address", `${fd.get("address")}, ${fd.get("city")}`],
      ["Best way to reach you", label("contact_pref")]
    ];
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(current)) return;
    errorBox.textContent = "";
    submitBtn.disabled = true;
    submitBtn.querySelector(".label").textContent = "Sending request";

    try {
      if (CONFIG.FORM_ENDPOINT) {
        const fd = new FormData(form);
        fd.delete("media");
        files.forEach((f) => fd.append("media", f));
        const res = await fetch(CONFIG.FORM_ENDPOINT, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Request failed");
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      const dl = success.querySelector(".summary");
      dl.innerHTML = "";
      summaryRows().forEach(([k, v]) => {
        const row = document.createElement("div");
        const dt = document.createElement("dt"); dt.textContent = k;
        const dd = document.createElement("dd"); dd.textContent = v;
        row.append(dt, dd); dl.append(row);
      });
      form.closest(".form-shell").hidden = true;
      success.hidden = false;
      const h = success.querySelector("h2");
      h.setAttribute("tabindex", "-1");
      h.focus();
    } catch (err) {
      errorBox.textContent = `Your request didn't go through. Check your connection and try again, or call ${CONFIG.PHONE_DISPLAY}.`;
      submitBtn.disabled = false;
      submitBtn.querySelector(".label").textContent = "Send request";
    }
  });

  show(0);
  // Don't steal focus on first load
  document.activeElement && document.activeElement.blur();
  window.scrollTo(0, 0);
})();

/* ---------- Free consultation card (demo only, nothing is sent) ---------- */
document.querySelectorAll("[data-consult]").forEach((form) => {
  const msg = form.querySelector(".consult__msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name, phone = form.elements.phone;
    const bad = [name, phone].filter((f) => !f.value.trim());
    [name, phone].forEach((f) => f.setAttribute("aria-invalid", bad.includes(f) ? "true" : "false"));
    msg.classList.toggle("is-error", bad.length > 0);
    if (bad.length) { msg.textContent = "Please enter your name and phone number."; bad[0].focus(); return; }
    msg.textContent = "Thanks, " + name.value.trim().split(" ")[0] + "! This is a demo, so no request was sent. On the live site, a plumber would call you back.";
    form.reset();
  });
});

/* ---------- Gallery lightbox ---------- */
(function lightbox() {
  const links = [...document.querySelectorAll("a[data-lightbox]")];
  if (!links.length || !window.HTMLDialogElement) return;
  const dlg = document.createElement("dialog");
  dlg.className = "lightbox"; dlg.setAttribute("aria-label", "Photo viewer");
  dlg.innerHTML = '<div class="lightbox__inner"><img alt=""><p class="lightbox__cap"></p><div class="lightbox__bar"><button type="button" data-prev aria-label="Previous photo">&larr;</button><button type="button" data-close>Close</button><button type="button" data-next aria-label="Next photo">&rarr;</button></div></div>';
  document.body.appendChild(dlg);
  const img = dlg.querySelector("img"), cap = dlg.querySelector(".lightbox__cap");
  let cur = 0, shown = [];
  const visible = () => links.filter((a) => !a.closest("li").hidden);
  const show = (i) => { cur = (i + shown.length) % shown.length; const a = shown[cur]; img.src = a.href; img.alt = a.querySelector("img").alt; cap.textContent = a.dataset.caption || ""; };
  links.forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); shown = visible(); show(shown.indexOf(a)); dlg.showModal(); }));
  dlg.querySelector("[data-prev]").addEventListener("click", () => show(cur - 1));
  dlg.querySelector("[data-next]").addEventListener("click", () => show(cur + 1));
  dlg.querySelector("[data-close]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
})();

/* ---------- Glossary search ---------- */
(function glossary() {
  const box = document.querySelector("#gl-search");
  if (!box) return;
  const terms = [...document.querySelectorAll(".term")], groups = [...document.querySelectorAll("[data-letter]")];
  const status = document.querySelector("#gl-status"), empty = document.querySelector("#gl-empty");
  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase(); let n = 0;
    terms.forEach((t) => { const m = !q || t.textContent.toLowerCase().includes(q); t.hidden = !m; if (m) n++; });
    groups.forEach((g) => { g.hidden = !g.querySelector(".term:not([hidden])"); });
    empty.hidden = n > 0;
    status.textContent = q ? `${n} matching ${n === 1 ? "term" : "terms"}` : "";
  });
})();

/* ---------- Print button ---------- */
document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

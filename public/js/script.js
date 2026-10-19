(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---- Bootstrap-style custom validation ---- */
  $$(".needs-validation").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    }, false);
  });

  /* ---- Theme toggle (persisted) ---- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const paintThemeIcon = () => {
    if (!themeBtn) return;
    const dark = root.getAttribute("data-bs-theme") === "dark";
    themeBtn.innerHTML = `<i class="fa-solid ${dark ? "fa-moon" : "fa-sun"}"></i>`;
  };
  paintThemeIcon();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-bs-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage may be blocked */ }
      paintThemeIcon();
    });
  }

  /* ---- Navbar shadow on scroll ---- */
  const nav = $(".navbar");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal ---- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---- Flash toasts ---- */
  $$(".toast-msg").forEach((t, i) => {
    const close = () => { t.classList.add("out"); setTimeout(() => t.remove(), 400); };
    $("button", t).addEventListener("click", close);
    setTimeout(close, 5000 + i * 600);
  });

  /* ---- Confirm dialogs on destructive forms ---- */
  $$("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  /* ---- GST toggle on listing grid ---- */
  const taxSwitch = $("#taxSwitch");
  if (taxSwitch) {
    taxSwitch.addEventListener("change", () => document.body.classList.toggle("show-tax", taxSwitch.checked));
  }

  /* ---- Filter form: tidy URLs + auto-submit ---- */
  const filterForm = $("#filterForm");
  if (filterForm) {
    filterForm.addEventListener("submit", () => {
      // Don't send empty params so shared URLs stay clean.
      $$("input, select", filterForm).forEach((el) => {
        if (el.value === "" || (el.name === "sort" && el.value === "newest")) el.disabled = true;
      });
    });
    $$("[data-autosubmit]", filterForm).forEach((el) =>
      el.addEventListener("change", () => filterForm.requestSubmit()));

    const ci = $("#checkIn", filterForm);
    const co = $("#checkOut", filterForm);
    if (ci && co) {
      ci.addEventListener("change", () => {
        if (!ci.value) return;
        const next = new Date(ci.value + "T00:00:00Z");
        next.setUTCDate(next.getUTCDate() + 1);
        const min = next.toISOString().slice(0, 10);
        co.min = min;
        if (!co.value || co.value < min) co.value = min;
      });
    }
  }

  /* ---- Image upload preview ---- */
  $$("input[type=file][data-preview]").forEach((input) => {
    const img = $(input.dataset.preview);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file || !img) return;
      img.src = URL.createObjectURL(file);
      img.classList.add("has");
    });
  });

  /* ---- Booking widget ---- */
  const card = $("#bookCard");
  const form = $("#bookForm");
  if (card && form) {
    const price = Number(card.dataset.price);
    const booked = JSON.parse(card.dataset.booked || "[]");
    const MAX_NIGHTS = 30;
    const GST = 0.18;
    const inEl = $("#bCheckIn");
    const outEl = $("#bCheckOut");
    const btn = $("#bookBtn");
    const warn = $("#bookWarn");
    const box = $("#breakdown");
    const money = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
    const day = (s) => new Date(s + "T00:00:00Z");

    const setWarn = (msg) => {
      warn.textContent = msg || "";
      warn.classList.toggle("show", !!msg);
    };

    const update = () => {
      const a = inEl.value;
      const b = outEl.value;
      box.classList.remove("show");
      if (btn) btn.disabled = true;
      setWarn("");
      if (!a || !b) return;

      const nights = Math.round((day(b) - day(a)) / 86400000);
      if (nights < 1) return setWarn("Check-out must be after check-in.");
      if (nights > MAX_NIGHTS) return setWarn(`Stays are limited to ${MAX_NIGHTS} nights.`);
      // Same overlap rule as the server: [checkIn, checkOut) intersects an existing booking.
      if (booked.some((r) => a < r.to && b > r.from)) return setWarn("Those dates overlap an existing booking.");

      const sub = nights * price;
      const tax = sub * GST;
      $("#bkLine").textContent = `${money(price)} × ${nights} night${nights > 1 ? "s" : ""}`;
      $("#bkSub").textContent = money(sub);
      $("#bkTax").textContent = money(tax);
      $("#bkTotal").textContent = money(sub + tax);
      box.classList.add("show");
      if (btn) btn.disabled = false;
    };

    inEl.addEventListener("change", () => {
      if (inEl.value) {
        const next = day(inEl.value);
        next.setUTCDate(next.getUTCDate() + 1);
        const min = next.toISOString().slice(0, 10);
        outEl.min = min;
        if (!outEl.value || outEl.value < min) outEl.value = min;
      }
      update();
    });
    outEl.addEventListener("change", update);

    // Prefill from search filters (?checkIn=&checkOut=) when arriving from the grid.
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkIn") && params.get("checkOut")) {
      inEl.value = params.get("checkIn");
      outEl.value = params.get("checkOut");
      update();
    }

    form.addEventListener("submit", (e) => {
      if (!btn || btn.disabled) e.preventDefault();
    });
  }
})();

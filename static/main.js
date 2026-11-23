/* asitorenk.com — sepet + Shopify (AsitLabs) ürün bağlantısı */
(() => {
  "use strict";
  const MAGAZA = window.ASITORENK_MAGAZA || "https://asitlabs.com";
  const ANAHTAR = "asitorenk_sepet_v1";
  const az = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tl = (kurus) => (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  const kacis = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const gorselUrl = (src, en) => {
    if (!src) return "";
    let u = src.startsWith("//") ? "https:" + src : src;
    return u + (u.includes("?") ? "&" : "?") + "width=" + en;
  };

  /* ---------- sepet durumu ---------- */
  let sepet = [];
  try {
    const kayit = JSON.parse(localStorage.getItem(ANAHTAR) || "[]");
    if (Array.isArray(kayit)) sepet = kayit.filter((i) => i && i.id && i.adet > 0);
  } catch (e) { sepet = []; }
  const kaydet = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(sepet)); } catch (e) { /* özel pencere */ } };

  const cekmece = document.getElementById("sepet");
  const perde = document.querySelector(".sepet-perde");
  const liste = cekmece.querySelector(".sepet-liste");
  const bos = cekmece.querySelector(".sepet-bos");
  const toplamEl = cekmece.querySelector("[data-sepet-toplam]");
  const odeme = cekmece.querySelector("[data-odeme]");
  const adetEls = document.querySelectorAll("[data-sepet-adet]");
  let oncekiOdak = null;

  function ciz() {
    const adet = sepet.reduce((t, i) => t + i.adet, 0);
    adetEls.forEach((el) => { el.textContent = adet; });
    bos.hidden = sepet.length > 0;
    liste.innerHTML = sepet.map((i, n) => `
      <li>
        <img src="${kacis(i.gorsel)}" alt="" width="64" height="64">
        <div>
          <b>${kacis(i.ad)}</b>${i.secenek ? `<small>${kacis(i.secenek)}</small>` : ""}
          <div class="adet">
            <button type="button" data-azalt="${n}" aria-label="${kacis(i.ad)} adedini azalt">−</button>
            <span aria-live="polite">${i.adet}</span>
            <button type="button" data-arttir="${n}" aria-label="${kacis(i.ad)} adedini arttır">+</button>
          </div>
        </div>
        <span class="sepet-fiyat">${tl(i.fiyat * i.adet)}</span>
      </li>`).join("");
    toplamEl.textContent = tl(sepet.reduce((t, i) => t + i.fiyat * i.adet, 0));
    if (sepet.length) {
      odeme.href = MAGAZA + "/cart/" + sepet.map((i) => i.id + ":" + i.adet).join(",") + "?attributes%5Bkaynak%5D=asitorenk.com";
      odeme.removeAttribute("aria-disabled");
    } else {
      odeme.href = MAGAZA + "/cart";
      odeme.setAttribute("aria-disabled", "true");
    }
  }

  function ac() {
    oncekiOdak = document.activeElement;
    cekmece.hidden = false;
    perde.hidden = false;
    requestAnimationFrame(() => document.body.classList.add("sepet-acik"));
    cekmece.querySelector(".sepet-kapat").focus();
  }
  function kapat() {
    document.body.classList.remove("sepet-acik");
    setTimeout(() => { cekmece.hidden = true; perde.hidden = true; }, az ? 0 : 280);
    if (oncekiOdak) oncekiOdak.focus();
  }

  document.querySelectorAll("[data-sepet-ac]").forEach((b) => b.addEventListener("click", ac));
  document.querySelectorAll("[data-sepet-kapat]").forEach((b) => b.addEventListener("click", kapat));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !cekmece.hidden) kapat(); });
  odeme.addEventListener("click", (e) => { if (!sepet.length) e.preventDefault(); });
  liste.addEventListener("click", (e) => {
    const az_ = e.target.closest("[data-azalt]"), ar = e.target.closest("[data-arttir]");
    if (az_) { const n = +az_.dataset.azalt; sepet[n].adet -= 1; if (sepet[n].adet <= 0) sepet.splice(n, 1); }
    else if (ar) { const n = +ar.dataset.arttir; sepet[n].adet = Math.min(sepet[n].adet + 1, 20); }
    else return;
    kaydet(); ciz();
  });

  function ekle(kalem) {
    const var_ = sepet.find((i) => i.id === kalem.id);
    if (var_) var_.adet = Math.min(var_.adet + 1, 20); else sepet.push({ ...kalem, adet: 1 });
    kaydet(); ciz();
  }

  /* ---------- Shopify ürünleri ---------- */
  function kur(kart, urun) {
    const gorsel = kart.querySelector(".urun-gorsel");
    if (urun.featured_image) {
      gorsel.innerHTML = `<img src="${kacis(gorselUrl(urun.featured_image, 700))}" alt="${kacis(urun.title)}" loading="lazy">`;
    }
    const satista = urun.variants.filter((v) => v.available);
    if (!satista.length) return;

    kart.classList.add("satista");
    kart.querySelector(".durum").textContent = "Satışta";
    const fiyatlar = satista.map((v) => v.price);
    const fiyatEl = kart.querySelector(".fiyat");
    const enAz = Math.min(...fiyatlar);
    fiyatEl.textContent = enAz !== Math.max(...fiyatlar) ? tl(enAz) + "'den başlayan" : tl(enAz);
    fiyatEl.hidden = false;

    const etiket = kart.querySelector(".varyant");
    const secim = etiket.querySelector("select");
    const tekVaryant = urun.variants.length === 1;
    if (!tekVaryant) {
      etiket.querySelector("span").textContent = (urun.options && urun.options[0] && urun.options[0].name) || "Seçenek";
      secim.innerHTML = urun.variants.map((v) =>
        `<option value="${v.id}"${v.available ? "" : " disabled"}>${kacis(v.title)}${v.available ? "" : " (tükendi)"}</option>`).join("");
      secim.value = String(satista[0].id);
      etiket.hidden = false;
      secim.addEventListener("change", () => {
        const v = urun.variants.find((x) => String(x.id) === secim.value);
        if (v) fiyatEl.textContent = tl(v.price);
      });
    }

    const btn = kart.querySelector(".btn-ekle");
    btn.disabled = false;
    btn.textContent = "Sepete ekle";
    btn.addEventListener("click", () => {
      const v = tekVaryant ? urun.variants[0] : urun.variants.find((x) => String(x.id) === secim.value);
      if (!v || !v.available) return;
      ekle({
        id: v.id,
        ad: urun.title,
        secenek: v.title === "Default Title" ? "" : v.title,
        fiyat: v.price,
        gorsel: urun.featured_image ? gorselUrl(urun.featured_image, 160) : kart.dataset.thumb,
      });
      btn.textContent = "Sepete eklendi ✓";
      btn.classList.add("eklendi");
      setTimeout(() => { btn.textContent = "Sepete ekle"; btn.classList.remove("eklendi"); }, 1600);
      ac();
    });
  }

  document.querySelectorAll(".urun[data-handle]").forEach((kart) => {
    fetch(`${MAGAZA}/products/${kart.dataset.handle}.js`, { mode: "cors", credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((urun) => { if (urun && Array.isArray(urun.variants)) kur(kart, urun); })
      .catch(() => { /* ürün henüz yayında değil: "Yakında" kalır */ });
  });
  // Yerel deneme için: window.asitorenkDene(handle, urunJson)
  window.asitorenkDene = (handle, urun) => { const k = document.querySelector(`.urun[data-handle="${handle}"]`); if (k) kur(k, urun); };

  /* ---------- videolar: yalnızca görünürken oynasın ---------- */
  const videolar = document.querySelectorAll("video[data-autoplay]");
  if (!az && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((girdiler) => {
      girdiler.forEach((g) => {
        const v = g.target;
        if (g.isIntersecting) { v.preload = "auto"; const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
      });
    }, { threshold: 0.25 });
    videolar.forEach((v) => io.observe(v));
  }

  ciz();
})();

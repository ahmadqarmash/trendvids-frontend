
// واجهة الـ Worker لديك
const API_BASE = "https://trend.trendvids.workers.dev";

// نصوص الواجهة باللغتين
const I18N = {
  ar: {
    title: "الفيديوهات الرائجة عالميًا",
    labelLang: "اللغة:",
    labelRegion: "المنطقة:",
    refresh: "تحديث",
    loadMore: "تحميل المزيد",
    privacy: "وضع الخصوصية (nocookie)",
    note: "ملاحظة: بعض الفيديوهات قد تُعرض على YouTube مباشرةً إذا كانت محدودة عمر/سياسة.",
    copy: "© 2025 TrendVids",
    channel: "القناة",
    views: "المشاهدات",
    published: "تاريخ النشر",
    loading: "جاري الجلب...",
    errorPrefix: "خطأ",
    regions: {
      JO: "الأردن", US: "الولايات المتحدة", GB: "المملكة المتحدة",
      DE: "ألمانيا", FR: "فرنسا", KR: "كوريا الجنوبية",
      JP: "اليابان", IN: "الهند", BR: "البرازيل",
      AE: "الإمارات", SA: "السعودية", EG: "مصر"
    },
    locale: "ar-JO",
    dir: "rtl"
  },
  en: {
    title: "Trending Videos Worldwide",
    labelLang: "Language:",
    labelRegion: "Region:",
    refresh: "Refresh",
    loadMore: "Load more",
    privacy: "Privacy mode (nocookie)",
    note: "Note: Some videos may redirect to YouTube if age/policy restricted.",
    copy: "© 2025 TrendVids",
    channel: "Channel",
    views: "Views",
    published: "Published",
    loading: "Loading...",
    errorPrefix: "Error",
    regions: {
      JO: "Jordan", US: "United States", GB: "United Kingdom",
      DE: "Germany", FR: "France", KR: "South Korea",
      JP: "Japan", IN: "India", BR: "Brazil",
      AE: "United Arab Emirates", SA: "Saudi Arabia", EG: "Egypt"
    },
    locale: "en-US",
    dir: "ltr"
  }
};

const grid = document.getElementById("grid");
const regionSel = document.getElementById("region");
const langSel = document.getElementById("lang");
const refreshBtn = document.getElementById("refresh");
const loadMoreBtn = document.getElementById("loadMore");
const privacyChk = document.getElementById("privacyMode");

let state = {
  lang: localStorage.getItem("lang") || "ar",
  region: localStorage.getItem("region") || "JO",
  limit: 20,           // عدد العناصر المعروضة
  privacy: localStorage.getItem("privacy") === "1" // وضع الخصوصية
};

// تنسيق أرقام/تواريخ حسب اللغة
function fmtNumber(n, locale) {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? "";
  return new Intl.NumberFormat(locale).format(num);
}
function fmtDate(iso, locale) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

// تطبيق اللغة على الصفحة
function applyLanguage(lang) {
  const t = I18N[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;

  document.getElementById("page-title").textContent = t.title;
  document.getElementById("app-title").textContent = t.title;
  document.getElementById("label-lang").textContent = t.labelLang;
  document.getElementById("label-region").textContent = t.labelRegion;
  refreshBtn.textContent = t.refresh;
  loadMoreBtn.textContent = t.loadMore;
  document.getElementById("privacy-label").textContent = t.privacy;
  document.getElementById("note").textContent = t.note;
  document.getElementById("copy").textContent = t.copy;

  // إعادة بناء قائمة المناطق مع الحفاظ على الاختيار الحالي
  const prev = regionSel.value || state.region;
  regionSel.innerHTML = "";
  Object.entries(t.regions).forEach(([code, name]) => {
    const opt = document.createElement("option");
    opt.value = code; opt.textContent = name;
    regionSel.appendChild(opt);
  });
  regionSel.value = prev;
}

// بناء بطاقة فيديو
function buildCard(v, t, nocookie) {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";
  const img = document.createElement("img");
  img.className = "thumb";
  img.src = v.thumb;
  img.alt = v.title || (state.lang === "ar" ? "صورة مصغرة" : "Thumbnail");
  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = v.title || (state.lang === "ar" ? "بدون عنوان" : "Untitled");
  header.appendChild(img);
  header.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent =
    `${t.channel}: ${v.channelTitle || "-"} · ${t.views}: ${fmtNumber(v.viewCount, t.locale)} · ${t.published}: ${fmtDate(v.publishedAt, t.locale)}`;

  // تضمين YouTube عبر IFrame الرسمي
  const base = nocookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
  const iframe = document.createElement("iframe");
  iframe.className = "player";
  iframe.loading = "lazy";
  iframe.src = `${base}/embed/${v.id}?rel=0&modestbranding=1&playsinline=1`;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(iframe);
  return card;
}

// تحميل البيانات من الـ API
async function load() {
  const t = I18N[state.lang];
  grid.innerHTML = `<p>${t.loading}</p>`;
  try {
    const res = await fetch(`${API_BASE}/api/trending?region=${encodeURIComponent(state.region)}&limit=${state.limit}`);
    const data = await res.json();
    grid.innerHTML = "";

    if (data.error) {
      grid.innerHTML = `<p style="color:#ff6b6b">${t.errorPrefix}: ${data.error.message}</p>`;
      return;
    }

    data.items.forEach(v => {
      const card = buildCard(v, t, state.privacy);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#ff6b6b">${I18N[state.lang].errorPrefix}: ${err.message}</p>`;
  }
}

// أحداث الواجهة
langSel.addEventListener("change", () => {
  state.lang = langSel.value;
  localStorage.setItem("lang", state.lang);
  applyLanguage(state.lang);
  load(); // أعِد التحميل ليُحدّث التنسيق
});
regionSel.addEventListener("change", () => {
  state.region = regionSel.value;
  localStorage.setItem("region", state.region);
  // إعادة ضبط limit عند تغيير المنطقة
  state.limit = 20;
  load();
});
refreshBtn.addEventListener("click", () => {
  state.limit = 20;
  load();
});
loadMoreBtn.addEventListener("click", () => {
  // لا تتجاوز 50 (حد الـ API في Worker)
  state.limit = Math.min(state.limit + 10, 50);
  load();
});
privacyChk.addEventListener("change", () => {
  state.privacy = privacyChk.checked;
  localStorage.setItem("privacy", state.privacy ? "1" : "0");
  load();
});

// تهيئة أولية
langSel.value = state.lang;
privacyChk.checked = state.privacy;
applyLanguage(state.lang);
regionSel.value = state.region;
load();

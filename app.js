
// عدّل هذا العنوان إلى واجهتك الخلفية (Worker):
const API_BASE = "https://trend.trendvids.workers.dev";

const grid = document.getElementById("grid");
const regionSel = document.getElementById("region");
document.getElementById("refresh").addEventListener("click", load);

function fmtNumber(n) {
  if (!n && n !== 0) return "";
  const num = Number(n);
  if (isNaN(num)) return n;
  return new Intl.NumberFormat('ar-JO').format(num);
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ar-JO', { dateStyle: 'medium' }).format(d);
}

async function load() {
  const region = regionSel.value;
  grid.innerHTML = "<p>جاري الجلب...</p>";
  try {
    const res = await fetch(`${API_BASE}/api/trending?region=${encodeURIComponent(region)}&limit=20`);
    const data = await res.json();
    grid.innerHTML = "";

    if (data.error) {
      grid.innerHTML = `<p style="color:#ff6b6b">خطأ: ${data.error.message}</p>`;
      return;
    }

    data.items.forEach(v => {
      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header";
      const img = document.createElement("img");
      img.className = "thumb";
      img.src = v.thumb;
      img.alt = v.title || "صورة مصغّرة";
      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = v.title || "بدون عنوان";
      header.appendChild(img);
      header.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `القناة: ${v.channelTitle || "-"} · المشاهدات: ${fmtNumber(v.viewCount)} · النشر: ${fmtDate(v.publishedAt)}`;

      // تضمين YouTube عبر IFrame الرسمي
      const iframe = document.createElement("iframe");
      // إن رغبت بوضع الخصوصية: استبدل النطاق بـ youtube-nocookie.com (سياسة الخصوصية المحسّنة) [1](https://www.answeroverflow.com/m/1339606875787759737)
      iframe.className = "player";
      iframe.loading = "lazy";
      iframe.src = `https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(iframe);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#ff6b6b">فشل الجلب: ${err.message}</p>`;
  }
}

// تحميل تلقائي عند فتح الصفحة
load();

async function loadIndex() {
  try {
    const res = await fetch("data/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("index.json fetch failed");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to data/index.js:", err.message);
    if (window.AI_BRIEF_INDEX) return window.AI_BRIEF_INDEX;
    throw err;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${inlineMd(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${inlineMd(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${inlineMd(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inlineMd(line.slice(2))}</li>`);
    } else if (line.length === 0) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push("");
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p>${inlineMd(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");

  return html.join("\n");
}

async function loadMarkdown(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return await response.text();
}

function clearActive() {
  document.querySelectorAll(".item-list button.active").forEach((b) => b.classList.remove("active"));
}

async function openEntry(entry, button) {
  clearActive();
  if (button) button.classList.add("active");

  const titleEl = document.getElementById("detail-title");
  const dateEl = document.getElementById("detail-date");
  const contentEl = document.getElementById("detail-content");

  titleEl.textContent = entry.title;
  dateEl.textContent = `${entry.type.toUpperCase()} · ${entry.date}`;
  contentEl.textContent = "Loading...";

  try {
    const md = await loadMarkdown(entry.path);
    contentEl.innerHTML = mdToHtml(md);
  } catch (e) {
    contentEl.textContent = `Cannot load markdown: ${e.message}`;
  }
}

function makeButton(entry) {
  const button = document.createElement("button");
  button.textContent = `${entry.date} — ${entry.title}`;
  button.addEventListener("click", () => openEntry(entry, button));
  return button;
}

function renderList(id, items) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.appendChild(makeButton(item));
    list.appendChild(li);
  });
}

(async function init() {
  try {
    const indexData = await loadIndex();
    const daily = (indexData.daily || []).map((d) => ({ ...d, type: "daily" }));
    const biweekly = (indexData.biweekly || []).map((d) => ({ ...d, type: "biweekly" }));

    renderList("daily-list", daily);
    renderList("biweekly-list", biweekly);

    const dc = document.getElementById("daily-count");
    const bc = document.getElementById("biweekly-count");
    if (dc) dc.textContent = String(daily.length);
    if (bc) bc.textContent = String(biweekly.length);

    const first = daily[0] || biweekly[0];
    if (first) openEntry(first, document.querySelector(".item-list button"));
  } catch (e) {
    document.getElementById("detail-content").textContent =
      `Failed to initialize app: ${e.message}`;
  }
})();

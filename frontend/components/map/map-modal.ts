import { StoreListItemVM } from "@/lib/vm/store.vm";

export function createStoreOverlayElement(store: StoreListItemVM) {
  const maxRate = store.maxDiscountRate;
  const hasEvent = !!store.hasEvent;

  const c = {
    border: "#e5e7eb",
    text: "#111827",
    sub: "#6b7280",
    chipBg: "#f3f4f6",
    chipText: "#374151",
    green50: "#ecfdf5",
    green200: "#a7f3d0",
    green700: "#047857",
    red50: "#fef2f2",
    red200: "#fecaca",
    red700: "#b91c1c",
    blue50: "#eff6ff",
    blue200: "#bfdbfe",
    blue600: "#2563eb",
    cardBg: "#ffffff",
    brand: "#0f766e",
    shadow: "0 6px 18px rgba(0,0,0,0.08)",
  };

  

  const root = document.createElement("div");
  root.style.cssText = `
    background:${c.cardBg};
    border:1px solid ${c.border};
    border-radius:12px;
    box-shadow:${c.shadow};
    width:260px;
    overflow:hidden;
    transition:transform .12s ease, box-shadow .12s ease;
  `;
  root.onmouseenter = () => {
    root.style.boxShadow = "0 8px 22px rgba(0,0,0,0.12)";
    root.style.transform = "translateY(-1px)";
  };
  root.onmouseleave = () => {
    root.style.boxShadow = c.shadow;
    root.style.transform = "translateY(0)";
  };

  // 썸네일 (옵션)
  if (store.thumbnail) {
    const thumb = document.createElement("div");
    thumb.style.cssText = "height:100px; overflow:hidden; background:#e5e7eb;";
    thumb.innerHTML = `<img src="${store.thumbnail}" alt="${store.name}" style="width:100%; height:100%; object-fit:cover;">`;
    root.appendChild(thumb);
  }
  

  const body = document.createElement("div");
  body.style.cssText = "padding:12px 14px 14px;";
  root.appendChild(body);
  

  // 상단: 이름 + 제휴 배지
  const titleRow = document.createElement("div");
  titleRow.style.cssText =
    "display:flex; align-items:center; gap:8px; margin-bottom:6px;";
  titleRow.innerHTML = `
    <h3 style="
      margin:0;
      font-size:15px;
      font-weight:700;
      color:${c.text};
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    ">${store.name}</h3>
  `;
  if (store.partershipText) {
    const badge = document.createElement("span");
    badge.textContent = "제휴";
    badge.title = store.partershipText;
    badge.style.cssText = `
      display:inline-flex; align-items:center;
      padding:2px 6px; border:1px solid ${c.blue200};
      background:${c.blue50}; color:${c.blue600};
      border-radius:6px; font-size:10px; font-weight:600; line-height:1;
    `;
    titleRow.appendChild(badge);
  }
  body.appendChild(titleRow);

// 거리 + 카테고리
const metaRow = document.createElement("div");
metaRow.style.cssText = `
  display:flex;
  align-items:center;
  gap:4px;              /* 거리와 칩 사이 여백 최소 */
  margin-bottom:12px;
`;

const distanceEl = document.createElement("span"); // ✅ div 대신 span
distanceEl.style.cssText = `
  font-size:12px;
  color:${c.sub};
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
`;
distanceEl.textContent = store.distanceText ?? store.address ?? "";
metaRow.appendChild(distanceEl);

if (store.category) {
  const chip = document.createElement("span");
  chip.textContent = store.category;
  chip.style.cssText = `
    background:${c.chipBg};
    color:${c.chipText};
    padding:1px 4px;
    border-radius:6px;
    font-size:11px;
    font-weight:600;
    line-height:1.2;
  `;
  metaRow.appendChild(chip);
}

body.appendChild(metaRow);

  // 이벤트/할인 배지
  const badgesRow = document.createElement("div");
  badgesRow.style.cssText = "display:flex; gap:6px; flex-wrap:wrap;";
  const evt = document.createElement("span");
  if (hasEvent) {
    evt.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background:${c.green700};"></span>이벤트 진행중`;
    evt.style.cssText = `
      display:inline-flex; align-items:center; gap:6px;
      padding:2px 8px; border-radius:9999px;
      font-size:11px; font-weight:600;
      background:${c.green50}; color:${c.green700};
      border:1px solid ${c.green200};
    `;
  } else {
    evt.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background:#9ca3af;"></span>이벤트 준비중`;
    evt.style.cssText = `
      display:inline-flex; align-items:center; gap:6px;
      padding:2px 8px; border-radius:9999px;
      font-size:11px; font-weight:600;
      background:#f9fafb; color:#374151;
      border:1px solid #e5e7eb;
    `;
  }
  badgesRow.appendChild(evt);
  if (typeof maxRate === "number") {
    const disc = document.createElement("span");
    disc.textContent = `최대 ${maxRate}% 할인`;
    disc.style.cssText = `
      display:inline-flex; align-items:center;
      padding:2px 8px; border-radius:9999px;
      font-size:11px; font-weight:700;
      background:${c.red50}; color:${c.red700};
      border:1px solid ${c.red200};
    `;
    badgesRow.appendChild(disc);
  }
  body.appendChild(badgesRow);

    // 구분선
    const hr = document.createElement("hr");
    hr.style.cssText =
        "border:none; border-top:1px solid #eee; margin:10px 0;";
    body.appendChild(hr);

  // ✅ 버튼 영역
  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display:flex; justify-content:space-between; gap:8px; margin-top:12px;";

  const goBtn = document.createElement("button");
  goBtn.textContent = "가게 보러가기";
  goBtn.style.cssText = `
    flex:1; padding:4px 0; border-radius:6px;
    background:${c.blue600}; color:white;
    font-size:10px; font-weight:600;
    border:none; cursor:pointer;
  `;
  goBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.location.href = `/store/${store.id}`;
  });
  btnRow.appendChild(goBtn);

  if (store.naverLink) {
    const navBtn = document.createElement("button");
    navBtn.textContent = "길 찾기";
    navBtn.style.cssText = `
      flex:1; padding:4px 0; border-radius:6px;
      background:${c.chipBg}; color:${c.text};
      font-size:10px; font-weight:600;
      border:1px solid ${c.border};
      cursor:pointer;
    `;
    navBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(store.naverLink!, "_blank", "noopener,noreferrer");
    });
    btnRow.appendChild(navBtn);
  }

  body.appendChild(btnRow);

  return root;
}
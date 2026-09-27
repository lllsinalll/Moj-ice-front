let selected = "waffle";
const menu = document.querySelector("#menu"),
  tabs = document.querySelector("#tabs"),
  search = document.querySelector("#search");
const imageViewer = document.querySelector("#imageViewer"),
  viewerImage = document.querySelector("#viewerImage"),
  viewerClose = document.querySelector("#viewerClose"),
  viewerName = document.querySelector("#viewerName");

function openImage(src, name) {
  if (!src) return;
  viewerImage.src = src;
  viewerImage.alt = name || "نمایش بزرگ محصول";
  viewerName.textContent = name || "";
  imageViewer.showModal();
}
function closeImage() {
  if (imageViewer.open) imageViewer.close();
}

function render() {
  let d = getMenuData();
  if (!d.categories.length) {
    menu.innerHTML = "";
    return;
  }
  let c = d.categories.find((x) => x.id === selected) || d.categories[0];
  selected = c.id;
  tabs.innerHTML = d.categories
    .map(
      (x) =>
        `<button class="tab ${x.id === selected ? "active" : ""}" data-id="${
          x.id
        }">${x.emoji || "🍦"} ${x.title}</button>`
    )
    .join("");
  let q = search.value.trim().toLowerCase();
  let items = c.items.filter((i) =>
    (i.name + " " + (i.description || "")).toLowerCase().includes(q)
  );
  menu.innerHTML =
    `<h2 class="section-title">${c.title}</h2>` +
    items
      .map((i, n) => {
        const discount = Number(i.discount) || 0;
        const finalPrice = Math.round(Number(i.price) * (1 - discount / 100));

        return `
      <article 
        class="product ${i.available === false ? "unavailable" : ""}" 
        style="--delay:${n * 55}ms"
      >

 <button 
  class="product-image" 
  type="button"
  data-image="${i.image || ""}" 
  data-name="${i.name}" 
  aria-label="نمایش بزرگ ${i.name}"
>

  ${
    i.available === false
      ? `<span class="unavailable-overlay">ناموجود</span>`
      : ""
  }

  ${
    i.image
      ? `<img src="${i.image}" alt="${i.name}" loading="lazy">`
      : i.emoji || "🍦"
  }
</button>

        <div class="info">

          <div class="name">
            ${i.name}
          </div>

          <div class="desc">
            ${i.description || ""}
          </div>

          <div class="product-badges">

            ${
              i.available === false
                ? `<span class="menu-badge unavailable-badge">ناموجود</span>`
                : ""
            }

            ${
              i.popular
                ? `<span class="menu-badge popular-badge">🔥 پرطرفدار</span>`
                : ""
            }

            ${
              discount === 100
                ? `<span class="menu-badge discount-badge">رایگان</span>`
                : discount > 0
                ? `<span class="menu-badge discount-badge">${discount}% تخفیف</span>`
                : ""
            }

          </div>

        </div>

        <div class="price">

        ${
          discount === 100
            ? `<strong class="free-price">رایگان</strong>`
            : discount > 0
            ? `
                <span class="old-price">
                  ${Number(i.price).toLocaleString("fa-IR")}
                  <small>تومان</small>
                </span>
        
                <span class="new-price">
                  ${finalPrice.toLocaleString("fa-IR")}
                  <small>تومان</small>
                </span>
              `
            : `
                <span class="normal-price">
                  ${Number(i.price).toLocaleString("fa-IR")}
                  <small>تومان</small>
                </span>
              `
        }

        </div>

      </article>
    `;
      })
      .join("");
  document.querySelector("#empty").style.display = items.length
    ? "none"
    : "block";
}

tabs.onclick = (e) => {
  let b = e.target.closest(".tab");
  if (!b) return;
  selected = b.dataset.id;
  render();
  menu.animate(
    [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
};
menu.onclick = (e) => {
  const box = e.target.closest(".product-image");
  if (!box) return;

  const product = box.closest(".product");

  // محصول ناموجود قابل کلیک نیست
  if (product?.classList.contains("unavailable")) {
    return;
  }

  openImage(box.dataset.image, box.dataset.name);
};
viewerClose.onclick = closeImage;
imageViewer.addEventListener("click", (e) => {
  if (e.target === imageViewer || e.target.classList.contains("viewer-shell"))
    closeImage();
});
search.oninput = render;
addEventListener("storage", render);
addEventListener("mojIceDataChanged", render);
render();

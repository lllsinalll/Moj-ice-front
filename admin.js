const login = document.querySelector("#login");
const app = document.querySelector("#app");
const list = document.querySelector("#list");

const $ = (id) => document.getElementById(id);

const itemStock = $("itemStock");
const itemPopular = $("itemPopular");
const itemDiscount = $("itemDiscount");

const confirmDialog = $("confirmDialog");

let pendingConfirm = null;

// =========================
// START
// =========================

async function start() {
  if (sessionStorage.getItem("mojAdmin") === "1") {
    login.classList.add("hidden");
    app.classList.remove("hidden");

    await loadCategoriesFromMongoDB();

    render();
  }
}

start();

// =========================
// FORM HELPERS
// =========================

addCat.onclick = () => {
  clearErrors(catForm);

  catForm.reset();
  catId.value = "";

  catDialog.showModal();
};

catForm.onsubmit = async (e) => {
  e.preventDefault();
  clearErrors(catForm);

  const titleValid = requireField(catTitle, "نام سربرگ را وارد کن.");

  const emojiValid = requireField(catEmoji, "ایموجی را وارد کن.");

  if (!titleValid || !emojiValid) {
    shake(catForm);
    return;
  }

  const category = {
    title: catTitle.value.trim(),
    emoji: catEmoji.value.trim(),
  };

  try {
    const response = await fetch(
      "https://moj-ice-back.onrender.com/categories",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "خطا در افزودن سربرگ");
    }

    console.log("Category created:", data);

    catDialog.close();

    await loadCategoriesFromMongoDB();
    render();
  } catch (error) {
    console.error("Create category error:", error);
    alert("افزودن سربرگ با خطا مواجه شد.");
  }
};

function fieldError(input, message) {
  const field = input.closest(".field");

  if (!field) return;

  field.classList.toggle("invalid", !!message);

  const error = field.querySelector(".field-error");

  if (error) {
    error.textContent = message || "";
  }
}

function clearErrors(form) {
  form
    .querySelectorAll(".field")
    .forEach((field) => field.classList.remove("invalid"));

  form
    .querySelectorAll(".field-error")
    .forEach((error) => (error.textContent = ""));
}

function requireField(input, message) {
  const value = input.value.trim();

  fieldError(input, value ? "" : message);

  return !!value;
}

function requirePrice(input) {
  const valid = input.value !== "" && Number(input.value) >= 0;

  fieldError(input, valid ? "" : "قیمت را به‌صورت معتبر وارد کن.");

  return valid;
}

function shake(element) {
  element.classList.remove("shake");

  void element.offsetWidth;

  element.classList.add("shake");
}

// =========================
// LOGIN
// =========================

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  clearErrors(loginForm);

  const usernameValid = requireField(user, "نام کاربری را وارد کن.");

  const passwordValid = requireField(pass, "رمز عبور را وارد کن.");

  if (!usernameValid || !passwordValid) {
    shake(loginForm);
    return;
  }

  if (user.value.trim() === "admin" && pass.value === "1234") {
    sessionStorage.setItem("mojAdmin", "1");

    start();
  } else {
    fieldError(pass, "نام کاربری یا رمز عبور اشتباه است.");

    shake(loginForm);
  }
});

[user, pass].forEach((input) => {
  input.addEventListener("input", () => {
    fieldError(input, "");
  });
});

logout.onclick = () => {
  sessionStorage.removeItem("mojAdmin");

  location.reload();
};

// =========================
// RENDER PRODUCTS
// =========================

function render() {
  const data = getMenuData();

  list.innerHTML = data.categories
    .map(
      (category) => `
        <section class="card">

          <div class="chead">

            <div class="cname">
  ${category.emoji || "🍦"} ${category.title}
</div>

<div class="buttons">
  <button
    class="small danger delCat"
    data-c="${category.id}"
  >
    حذف سربرگ
  </button>
</div>

          </div>

          <div class="items">

            ${category.items
              .map(
                (item) => `
                  <div class="item">

                    <div class="emoji">
                      ${
                        item.image
                          ? `<img src="${item.image}" alt="${item.name}">`
                          : item.emoji || "🍦"
                      }
                    </div>

                    <div>
                      <div class="name">
                        ${item.name}
                      </div>

                      <div class="desc">
                        ${item.description || ""}
                      </div>
                    </div>

                   <div class="price">
  ${
    item.discount > 0
      ? item.discount === 100
        ? `<span class="free-price">رایگان</span>`
        : `
          <span class="old-price">
            ${Number(item.price).toLocaleString("fa-IR")} تومان
          </span>

          <span class="new-price">
            ${Math.round(
              Number(item.price) * (1 - item.discount / 100)
            ).toLocaleString("fa-IR")} تومان
          </span>
        `
      : `
        ${Number(item.price).toLocaleString("fa-IR")} تومان
      `
  }
</div>
                    <div class="badges">

  ${
    item.available === false
      ? `<span class="badge out">ناموجود</span>`
      : `<span class="badge stock">موجود</span>`
  }

  ${item.popular ? `<span class="badge popular">🔥 پرطرفدار</span>` : ""}

  ${
    item.discount === 100
      ? `<span class="badge discount">رایگان</span>`
      : item.discount > 0
      ? `<span class="badge discount">${item.discount}% تخفیف</span>`
      : ""
  }

</div>

                    <div class="buttons">

                      <button
                        class="small editItem"
                        data-c="${category.id}"
                        data-i="${item.id}"
                      >
                        ویرایش
                      </button>

                      <button
                        class="small danger delItem"
                        data-c="${category.id}"
                        data-i="${item.id}"
                      >
                        حذف
                      </button>

                    </div>

                  </div>
                `
              )
              .join("")}

            <button
              class="add addItem"
              data-c="${category.id}"
            >
              ＋ افزودن آیتم
            </button>

          </div>

        </section>
      `
    )
    .join("");
  renderStats();
}

function renderStats() {
  const stats = document.getElementById("stats");

  const data = getMenuData();

  const items = data.categories.flatMap((category) => category.items);

  const total = items.length;

  const available = items.filter((item) => item.available !== false).length;

  const unavailable = items.filter((item) => item.available === false).length;

  const popular = items.filter((item) => item.popular).length;

  const discount = items.filter((item) => item.discount > 0).length;

  stats.innerHTML = `
    <div class="stat-card">
      🍦
      <b>${total}</b>
      <span>کل محصولات</span>
    </div>

    <div class="stat-card">
      ✅
      <b>${available}</b>
      <span>موجود</span>
    </div>

    <div class="stat-card">
      🚫
      <b>${unavailable}</b>
      <span>ناموجود</span>
    </div>

    <div class="stat-card">
      🔥
      <b>${popular}</b>
      <span>پرطرفدار</span>
    </div>

    <div class="stat-card">
      🏷
      <b>${discount}</b>
      <span>تخفیف‌دار</span>
    </div>
  `;
}

// =========================
// LIST BUTTONS
// =========================

list.onclick = (e) => {
  console.log("CLICK TARGET:", e.target);
  console.log("BUTTON:", e.target.closest("button"));

  const button = e.target.closest("button");

  if (!button) return;

  // افزودن محصول
  if (button.classList.contains("addItem")) {
    openItem(button.dataset.c);
    return;
  }

  // ویرایش محصول
  if (button.classList.contains("editItem")) {
    openItem(button.dataset.c, button.dataset.i);
    return;
  }

  // حذف سربرگ
  if (button.classList.contains("delCat")) {
    const categoryId = button.dataset.c;

    askConfirm(
      "حذف سربرگ",
      "این سربرگ حذف می‌شود. مطمئنی؟",
      async () => {
        const success = await deleteCategory(categoryId);

        if (!success) return;

        await loadCategoriesFromMongoDB();
        render();
      },
      true
    );

    return;
  }

  // حذف محصول
  if (button.classList.contains("delItem")) {
    const id = button.dataset.i;

    askConfirm(
      "حذف آیتم",
      "این آیتم از منو حذف می‌شود. مطمئنی؟",
      async () => {
        const success = await deleteProduct(id);

        if (!success) return;

        await loadProductsFromMongoDB();
        render();
      },
      true
    );

    return;
  }
};

// =========================
// OPEN PRODUCT FORM
// =========================

function openItem(categoryId, productId = "") {
  const data = getMenuData();

  const category = data.categories.find(
    (category) => category.id === categoryId
  );

  if (!category) return;

  itemCat.value = categoryId;
  itemId.value = productId;

  clearErrors(itemForm);

  if (productId) {
    const item = category.items.find((item) => item.id === productId);

    if (!item) return;

    itemName.value = item.name;
    itemDesc.value = item.description || "";
    itemPrice.value = item.price;
    itemEmoji.value = item.emoji || "";
    itemImage.value = item.image || "";
    itemStock.checked = item.available !== false;

    itemPopular.checked = item.popular || false;

    itemDiscount.value = item.discount || 0;

    imagePreview.innerHTML = item.image
      ? `<img src="${item.image}" alt="پیش‌نمایش">`
      : "";
  } else {
    itemForm.reset();

    itemCat.value = categoryId;
    itemId.value = "";
    itemStock.checked = true;

    itemPopular.checked = false;

    itemDiscount.value = 0;

    imagePreview.innerHTML = "";
  }

  itemDialog.showModal();
}

// =========================
// ADD / EDIT PRODUCT
// =========================

itemForm.onsubmit = async (e) => {
  e.preventDefault();

  clearErrors(itemForm);

  const nameValid = requireField(itemName, "نام محصول را وارد کن.");

  const priceValid = requirePrice(itemPrice);

  if (!nameValid || !priceValid) {
    shake(itemForm);
    return;
  }

  const data = getMenuData();

  const category = data.categories.find(
    (category) => category.id === itemCat.value
  );

  if (!category) {
    alert("دسته‌بندی محصول پیدا نشد.");
    return;
  }

  const id = itemId.value;

  let imageUrl = itemImage.value.trim();

  if (itemImageFile.files[0]) {
    imageUrl = await uploadImage(itemImageFile.files[0]);

    if (!imageUrl) {
      return;
    }
  }

  const discount = Number(itemDiscount.value);

  if (discount < 0 || discount > 100) {
    showError(itemDiscount, "تخفیف باید بین ۰ تا ۱۰۰ درصد باشد.");
    return;
  }

  const product = {
    name: itemName.value.trim(),
    price: Number(itemPrice.value),
    category: category.title,
    ingredients: itemDesc.value.trim(),
    image: imageUrl,
    available: itemStock.checked,
    popular: itemPopular.checked,
    discount: discount,
  };

  const action = id ? "ذخیره تغییرات آیتم" : "افزودن آیتم";

  const message = id
    ? "تغییرات این محصول ذخیره شود؟"
    : "این محصول به منو اضافه شود؟";

  askConfirm(action, message, async () => {
    let result;

    // ویرایش
    if (id) {
      result = await updateProduct(id, product);
    }

    // افزودن
    else {
      result = await createProduct(product);
    }

    if (!result) return;

    await loadProductsFromMongoDB();

    itemDialog.close();

    render();
  });
};

// =========================
// IMAGE PREVIEW
// =========================

itemImageFile.addEventListener("change", () => {
  const file = itemImageFile.files[0];

  if (!file) {
    imagePreview.innerHTML = "";
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  imagePreview.innerHTML = `
      <img src="${imageUrl}" alt="پیش‌نمایش">
  `;
});

itemImage.addEventListener("input", () => {
  const value = itemImage.value.trim();

  imagePreview.innerHTML = value ? `<img src="${value}" alt="پیش‌نمایش">` : "";
});

// =========================
// CONFIRM DIALOG
// =========================

function askConfirm(title, text, action, danger = false) {
  pendingConfirm = action;

  confirmIcon.textContent = danger ? "!" : "✓";

  confirmLabel.textContent = danger ? "DELETE" : "CONFIRM";

  confirmTitle.textContent = title;

  confirmText.textContent = text;

  confirmOk.classList.toggle("confirm-danger", danger);

  confirmDialog.showModal();
}

// =========================
// NOTICE
// =========================

function showNotice(title, text) {
  pendingConfirm = null;

  confirmIcon.textContent = "i";

  confirmLabel.textContent = "NOTICE";

  confirmTitle.textContent = title;

  confirmText.textContent = text;

  confirmOk.classList.remove("confirm-danger");

  confirmOk.textContent = "باشه";

  confirmCancel.classList.add("hidden");

  confirmDialog.showModal();
}

// =========================
// CONFIRM BUTTONS
// =========================

confirmCancel.onclick = () => {
  confirmDialog.close();

  confirmCancel.classList.remove("hidden");

  confirmOk.textContent = "تأیید";
};

confirmOk.onclick = () => {
  const action = pendingConfirm;

  pendingConfirm = null;

  confirmDialog.close();

  confirmCancel.classList.remove("hidden");

  confirmOk.textContent = "تأیید";

  if (action) {
    action();
  }
};

confirmDialog.addEventListener("close", () => {
  pendingConfirm = null;

  confirmCancel.classList.remove("hidden");

  confirmOk.textContent = "تأیید";
});

// =========================
// CREATE PRODUCT - POST
// =========================

async function createProduct(product) {
  try {
    const response = await fetch("https://moj-ice-back.onrender.com/products", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(product),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "خطا در افزودن محصول");
    }

    console.log("Product created:", data);

    return data;
  } catch (error) {
    console.error("Create product error:", error);

    alert("افزودن محصول با خطا مواجه شد.");

    return null;
  }
}

// =========================
// UPDATE PRODUCT - PUT
// =========================

async function updateProduct(id, product) {
  try {
    const response = await fetch(
      `https://moj-ice-back.onrender.com/products/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(product),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "خطا در ویرایش محصول");
    }

    console.log("Product updated:", data);

    return data;
  } catch (error) {
    console.error("Update product error:", error);

    alert("ویرایش محصول با خطا مواجه شد.");

    return null;
  }
}

// =========================
// DELETE PRODUCT - DELETE
// =========================

async function deleteProduct(id) {
  try {
    const response = await fetch(
      `https://moj-ice-back.onrender.com/products/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "خطا در حذف محصول");
    }

    console.log("Product deleted:", data);

    return true;
  } catch (error) {
    console.error("Delete product error:", error);

    alert("حذف محصول با خطا مواجه شد.");

    return false;
  }
}

async function deleteCategory(id) {
  try {
    const response = await fetch(
      `https://moj-ice-back.onrender.com/categories/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "خطا در حذف سربرگ");
    }

    console.log("Category deleted:", data);

    return true;
  } catch (error) {
    console.error("Delete category error:", error);
    alert("حذف سربرگ با خطا مواجه شد.");
    return false;
  }
}

async function uploadImage(file) {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();

    const progressBar = document.getElementById("progressBar");

    if (progressBar) {
      progressBar.style.width = "0%";
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && progressBar) {
        const percent = (event.loaded / event.total) * 100;
        progressBar.style.width = percent + "%";
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("UPLOAD SUCCESS:", data);

          if (progressBar) {
            progressBar.style.width = "100%";
          }

          resolve(data.imageUrl);
        } else {
          throw new Error(data.message || "خطا در آپلود عکس");
        }
      } catch (error) {
        console.error("Upload error:", error);

        alert("آپلود عکس با خطا مواجه شد.");

        resolve(null);
      }
    };

    xhr.onerror = () => {
      console.error("Upload network error");

      alert("خطا در ارتباط با سرور.");

      resolve(null);
    };

    xhr.open("POST", "https://moj-ice-back.onrender.com/upload");

    xhr.send(formData);
  });
}

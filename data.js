const STORAGE_KEY = "mojIceMenuData";

let menuData = {
  categories: [],
};

function getMenuData() {
  return menuData;
}

// ================================
// Load Categories From MongoDB
// ================================

async function loadCategoriesFromMongoDB() {
  try {
    const response = await fetch(
      "https://moj-ice-back.onrender.com/categories"
    );

    if (!response.ok) {
      throw new Error("Failed to load categories");
    }

    const categories = await response.json();

    menuData.categories = categories.map((category) => ({
      id: category._id,
      title: category.title,
      emoji: category.emoji,
      items: [],
    }));

    await loadProductsFromMongoDB();

    console.log("MongoDB categories loaded:", categories);
  } catch (error) {
    console.error("MongoDB categories error:", error);
  }
}

// ================================
// Load Products From MongoDB
// ================================

async function loadProductsFromMongoDB() {
  try {
    const response = await fetch("https://moj-ice-back.onrender.com/products");

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const products = await response.json();

    // پاک کردن محصولات قبلی
    menuData.categories.forEach((category) => {
      category.items = [];
    });

    // اضافه کردن محصولات به دسته مربوطه
    products.forEach((product) => {
      const category = menuData.categories.find(
        (c) => c.title === product.category
      );

      if (!category) {
        console.warn(
          "Category not found for product:",
          product.name,
          product.category
        );

        return;
      }

      category.items.push({
        id: product._id,
        name: product.name,
        description: product.ingredients || "",
        price: product.price,
        image: product.image || "",
        emoji: category.emoji,

        available: product.available !== false,
        popular: product.popular || false,
        discount: product.discount || 0,
      });
    });

    window.dispatchEvent(new Event("mojIceDataChanged"));

    console.log("MongoDB products loaded:", products);
  } catch (error) {
    console.error("MongoDB products error:", error);
  }
}

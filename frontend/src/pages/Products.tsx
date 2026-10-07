import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isActive: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // FETCH PRODUCTS + CATEGORIES

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse] =
        await Promise.all([
        fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products`),
        ]);

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products");
      }

      if (!categoriesResponse.ok) {
        throw new Error("Failed to fetch categories");
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= RESET FORM =================

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setCategoryId("");
    setEditingProduct(null);
  };

  // ================= CLOSE MODAL =================

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  // ================= ADD PRODUCT =================

  const handleAddProduct = async () => {
    if (!name.trim()) {
      alert("Please enter product name");
      return;
    }

    if (!price) {
      alert("Please enter product price");
      return;
    }

    if (!categoryId) {
      alert("Please select a category");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            image: image.trim(),
            categoryId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to add product");
        return;
      }

      alert("Product added successfully");

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Unable to connect to server");
    }
  };

  // ================= EDIT PRODUCT =================

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);

    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setImage(product.image || "");
    setCategoryId(product.categoryId);

    setShowModal(true);
  };

  // ================= UPDATE PRODUCT =================

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!name.trim()) {
      alert("Please enter product name");
      return;
    }

    if (!price) {
      alert("Please enter product price");
      return;
    }

    if (!categoryId) {
      alert("Please select a category");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/products/${editingProduct.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            image: image.trim(),
            categoryId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to update product");
        return;
      }

      alert("Product updated successfully");

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Unable to connect to server");
    }
  };

  // ================= DELETE PRODUCT =================

  const handleDeleteProduct = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:3000/products/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to delete product");
        return;
      }

      alert("Product deleted successfully");

      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Unable to connect to server");
    }
  };

  // ================= ACTIVE / INACTIVE =================

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await fetch(
        `http://localhost:3000/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !product.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to update status");
        return;
      }

      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Unable to connect to server");
    }
  };

  // ================= OPEN ADD MODAL =================

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm font-semibold text-[#0795A3] mb-1">
            LIVEAZY ADMIN
          </p>

          <h1 className="text-3xl font-bold text-[#123B63]">
            Products Master
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your furniture products
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="
            bg-[#123B63]
            hover:bg-[#0795A3]
            text-white
            px-5
            py-3
            rounded-lg
            font-semibold
            transition
          "
        >
          + Add Product
        </button>

      </div>


      {/* ================= SUMMARY ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">

        <div className="bg-white border border-[#D8EEF0] rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <h2 className="text-2xl font-bold text-[#123B63] mt-1">
            {products.length}
          </h2>

        </div>


        <div className="bg-white border border-[#D8EEF0] rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Products
          </p>

          <h2 className="text-2xl font-bold text-[#0795A3] mt-1">
            {
              products.filter(
                (product) => product.isActive
              ).length
            }
          </h2>

        </div>


        <div className="bg-white border border-[#D8EEF0] rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Inactive Products
          </p>

          <h2 className="text-2xl font-bold text-gray-500 mt-1">
            {
              products.filter(
                (product) => !product.isActive
              ).length
            }
          </h2>

        </div>

      </div>


      {/* ================= PRODUCT TABLE ================= */}

      <div className="bg-white rounded-xl border border-[#D8EEF0] shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b border-[#D8EEF0]">

          <h2 className="text-lg font-bold text-[#123B63]">
            All Products
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            View and manage all products
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#F5FAFA]">

              <tr>

                <th className="text-left px-6 py-4 text-sm font-semibold text-[#123B63]">
                  Product
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-[#123B63]">
                  Category
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-[#123B63]">
                  Price
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-[#123B63]">
                  Status
                </th>

                <th className="text-right px-6 py-4 text-sm font-semibold text-[#123B63]">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-500"
                  >
                    Loading products...
                  </td>

                </tr>

              ) : products.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center py-12"
                  >

                    <div className="text-4xl mb-3">
                      🛋️
                    </div>

                    <p className="font-semibold text-[#123B63]">
                      No products found
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Add your first furniture product
                    </p>

                  </td>

                </tr>

              ) : (

                products.map((product) => {

                  const category =
                    categories.find(
                      (cat) =>
                        cat.id === product.categoryId
                    );

                  return (

                    <tr
                      key={product.id}
                      className="
                        border-t
                        border-gray-100
                        hover:bg-[#F8FCFC]
                        transition
                      "
                    >

                      {/* PRODUCT */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          {product.image ? (

                            <img
                              src={product.image}
                              alt={product.name}
                              className="
                                w-14
                                h-14
                                rounded-lg
                                object-cover
                                border
                                border-gray-200
                              "
                            />

                          ) : (

                            <div
                              className="
                                w-14
                                h-14
                                rounded-lg
                                bg-[#E8F7F8]
                                flex
                                items-center
                                justify-center
                                text-xl
                              "
                            >
                              🛋️
                            </div>

                          )}

                          <div>

                            <p className="font-semibold text-[#123B63]">
                              {product.name}
                            </p>

                            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {product.description ||
                                "No description"}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* CATEGORY */}

                      <td className="px-6 py-4">

                        <span className="text-sm text-gray-600">
                          {category?.name ||
                            "Unknown Category"}
                        </span>

                      </td>


                      {/* PRICE */}

                      <td className="px-6 py-4">

                        <span className="font-semibold text-[#123B63]">
                          ₹{product.price}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <button
                          onClick={() =>
                            handleToggleStatus(product)
                          }
                          className={`
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }
                          `}
                        >
                          {product.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>

                      </td>


                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              handleEditProduct(
                                product
                              )
                            }
                            className="
                              px-3
                              py-2
                              rounded-lg
                              bg-[#E8F7F8]
                              text-[#0795A3]
                              text-sm
                              font-semibold
                              hover:bg-[#D8EEF0]
                              transition
                            "
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProduct(
                                product.id
                              )
                            }
                            className="
                              px-3
                              py-2
                              rounded-lg
                              bg-red-50
                              text-red-600
                              text-sm
                              font-semibold
                              hover:bg-red-100
                              transition
                            "
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ================= ADD / EDIT MODAL ================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <p className="text-xs font-semibold text-[#0795A3] uppercase">
                  LIVEAZY
                </p>

                <h2 className="text-xl font-bold text-[#123B63] mt-1">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

              </div>

              <button
                onClick={closeModal}
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-gray-100
                  text-gray-500
                  hover:bg-gray-200
                  transition
                "
              >
                ✕
              </button>

            </div>


            {/* FORM */}

            <div className="p-6 space-y-5">

              {/* PRODUCT NAME */}

              <div>

                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Product Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter product name"
                  className="
                    w-full
                    h-11
                    px-4
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    focus:border-[#0795A3]
                    focus:ring-2
                    focus:ring-[#0795A3]/10
                  "
                />

              </div>


              {/* CATEGORY */}

              <div>

                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Category *
                </label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  className="
                    w-full
                    h-11
                    px-4
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    bg-white
                    focus:border-[#0795A3]
                  "
                >

                  <option value="">
                    Select Category
                  </option>

                  {categories
                    .filter(
                      (category) =>
                        category.isActive
                    )
                    .map((category) => (

                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>

                    ))}

                </select>

              </div>


              {/* PRICE */}

              <div>

                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Price *
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                    placeholder="Enter price"
                    min="0"
                    className="
                      w-full
                      h-11
                      pl-9
                      pr-4
                      border
                      border-gray-300
                      rounded-lg
                      outline-none
                      focus:border-[#0795A3]
                    "
                  />

                </div>

              </div>


              {/* IMAGE */}

              <div>

                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Image URL
                </label>

                <input
                  type="url"
                  value={image}
                  onChange={(e) =>
                    setImage(e.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                  className="
                    w-full
                    h-11
                    px-4
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    focus:border-[#0795A3]
                  "
                />

              </div>


              {/* IMAGE PREVIEW */}

              {image && (

                <div>

                  <p className="text-xs text-gray-500 mb-2">
                    Image Preview
                  </p>

                  <img
                    src={image}
                    alt="Preview"
                    className="
                      w-24
                      h-24
                      rounded-lg
                      object-cover
                      border
                    "
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>

              )}


              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Enter product description"
                  rows={4}
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    resize-none
                    focus:border-[#0795A3]
                  "
                />

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-3 px-6 py-5 border-t bg-gray-50 rounded-b-2xl">

              <button
                onClick={closeModal}
                className="
                  px-5
                  py-2.5
                  border
                  border-gray-300
                  rounded-lg
                  text-gray-600
                  font-semibold
                  hover:bg-white
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  editingProduct
                    ? handleUpdateProduct
                    : handleAddProduct
                }
                className="
                  px-5
                  py-2.5
                  bg-[#123B63]
                  hover:bg-[#0795A3]
                  text-white
                  rounded-lg
                  font-semibold
                  transition
                "
              >
                {editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
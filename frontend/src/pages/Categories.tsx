import { useEffect, useRef, useState } from "react";

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Edit category
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saving
  const [saving, setSaving] = useState(false);

  // FETCH CATEGORIES 

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  //  RESET FORM 

  const resetForm = () => {
    setName("");
    setDescription("");
    setImage("");
    setIsActive(true);
    setEditingCategory(null);
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // CLOSE MODAL 

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // IMAGE UPLOAD 

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();

      console.log("Cloudinary response:", data);

      // Cloudinary URL
      setImage(data.url);

      alert("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // FILE SELECT 

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    await handleImageUpload(file);
  };

  // ADD CATEGORY 

  const handleAddCategory = async () => {
    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image: image.trim(),
          isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      alert("Category added successfully");

      closeModal();

      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  // OPEN EDIT MODAL 

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);

    setName(category.name);
    setDescription(category.description || "");
    setImage(category.image || "");
    setIsActive(category.isActive);

    setShowModal(true);
  };

  // UPDATE CATEGORY 

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/categories/${editingCategory.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
            isActive,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      alert("Category updated successfully");

      closeModal();

      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // DELETE CATEGORY 

  const handleDeleteCategory = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      alert("Category deleted successfully");

      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        "Failed to delete category. Products may be linked to this category."
      );
    }
  };

  // TOGGLE ACTIVE 

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await fetch(
        `${API_URL}/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      fetchCategories();
    } catch (error) {
      console.error("Error updating category status:", error);
      alert("Failed to update category status");
    }
  };

  //  UI 

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#123B63]">
            Categories Master
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage furniture categories
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="
            bg-[#123B63]
            hover:bg-[#0795A3]
            text-white
            px-5
            py-2.5
            rounded-lg
            font-semibold
            text-sm
            transition
          "
        >
          + Add Category
        </button>
      </div>

      {/* CATEGORY TABLE */}
      <div className="bg-white rounded-xl border border-[#D8EEF0] shadow-sm overflow-hidden">

        {/* TABLE HEADER */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-[#F0FAFA] border-b border-[#D8EEF0]">
          <div className="col-span-2 text-xs font-bold uppercase text-[#123B63]">
            Image
          </div>

          <div className="col-span-2 text-xs font-bold uppercase text-[#123B63]">
            Name
          </div>

          <div className="col-span-3 text-xs font-bold uppercase text-[#123B63]">
            Description
          </div>

          <div className="col-span-2 text-xs font-bold uppercase text-[#123B63]">
            Status
          </div>

          <div className="col-span-3 text-xs font-bold uppercase text-[#123B63]">
            Actions
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-12 text-center text-gray-500">
            Loading categories...
          </div>
        )}

        {/* EMPTY */}
        {!loading && categories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              No categories found.
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Add your first category to get started.
            </p>
          </div>
        )}

        {/* CATEGORY LIST */}
        {!loading &&
          categories.map((category) => (
            <div
              key={category.id}
              className="
                grid
                grid-cols-1
                md:grid-cols-12
                gap-4
                px-6
                py-5
                border-b
                border-gray-100
                last:border-b-0
                hover:bg-[#F8FCFC]
                transition
              "
            >

              {/* IMAGE */}
              <div className="md:col-span-2">
                <span className="md:hidden text-xs font-semibold text-gray-400">
                  Image
                </span>

                <div
                  className="
                    w-16
                    h-16
                    rounded-lg
                    bg-[#F0FAFA]
                    border
                    border-[#D8EEF0]
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                    mt-1
                  "
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">
                      No Image
                    </span>
                  )}
                </div>
              </div>

              {/* NAME */}
              <div className="md:col-span-2">
                <span className="md:hidden text-xs font-semibold text-gray-400">
                  Name
                </span>

                <h3 className="font-semibold text-[#123B63] mt-1 md:mt-0">
                  {category.name}
                </h3>
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-3">
                <span className="md:hidden text-xs font-semibold text-gray-400">
                  Description
                </span>

                <p className="text-sm text-gray-500 mt-1 md:mt-0 line-clamp-2">
                  {category.description || "No description"}
                </p>
              </div>

              {/* STATUS */}
              <div className="md:col-span-2 flex items-start md:items-center">
                <button
                  onClick={() => handleToggleStatus(category)}
                  className={`
                    inline-flex
                    items-center
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-semibold
                    cursor-pointer
                    transition
                    ${
                      category.isActive
                        ? "bg-[#0795A3]/10 text-[#0795A3] hover:bg-[#0795A3]/20"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }
                  `}
                  title="Click to change status"
                >
                  {category.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              {/* ACTIONS */}
              <div className="md:col-span-3 flex items-center gap-2">

                <button
                  onClick={() => handleEditCategory(category)}
                  className="
                    px-3
                    py-1.5
                    rounded-md
                    border
                    border-[#D8EEF0]
                    text-[#123B63]
                    text-xs
                    font-semibold
                    hover:bg-[#F0FAFA]
                    transition
                  "
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDeleteCategory(category.id)
                  }
                  className="
                    px-3
                    py-1.5
                    rounded-md
                    border
                    border-red-200
                    text-red-500
                    text-xs
                    font-semibold
                    hover:bg-red-50
                    transition
                  "
                >
                  Delete
                </button>

              </div>
            </div>
          ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            px-4
          "
        >
          <div
            className="
              w-full
              max-w-lg
              max-h-[90vh]
              bg-white
              rounded-2xl
              shadow-2xl
              flex
              flex-col
              overflow-hidden
            "
          >

            {/* MODAL HEADER */}
            <div
              className="
                flex
                items-center
                justify-between
                px-6
                py-5
                border-b
                border-gray-200
                shrink-0
              "
            >
              <div>
                <h2 className="text-xl font-bold text-[#123B63]">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingCategory
                    ? "Update furniture category"
                    : "Create a new furniture category"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="
                  w-8
                  h-8
                  rounded-lg
                  text-gray-500
                  hover:bg-gray-100
                  hover:text-gray-700
                  text-xl
                "
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* CATEGORY NAME */}
              <div>
                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Category Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                  className="
                    w-full
                    h-11
                    px-4
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    text-sm
                    focus:border-[#0795A3]
                    focus:ring-2
                    focus:ring-[#0795A3]/10
                  "
                />
              </div>

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
                  placeholder="Enter category description"
                  rows={3}
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    text-sm
                    resize-none
                    focus:border-[#0795A3]
                    focus:ring-2
                    focus:ring-[#0795A3]/10
                  "
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div>
                <label className="block text-sm font-semibold text-[#123B63] mb-2">
                  Category Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="category-image"
                  onChange={handleFileChange}
                />

                <label
                  htmlFor="category-image"
                  className="
                    flex
                    items-center
                    justify-center
                    w-full
                    h-12
                    border-2
                    border-dashed
                    border-[#D8EEF0]
                    rounded-lg
                    cursor-pointer
                    bg-[#F8FCFC]
                    hover:bg-[#F0FAFA]
                    hover:border-[#0795A3]
                    transition
                  "
                >
                  {uploading ? (
                    <span className="text-sm text-[#0795A3] font-semibold">
                      Uploading image...
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Choose Image
                    </span>
                  )}
                </label>

                {/* IMAGE PREVIEW */}
                {image && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Image Preview
                    </p>

                    <div className="w-28 h-28 rounded-lg overflow-hidden border border-[#D8EEF0] bg-[#F0FAFA]">
                      <img
                        src={image}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-2 break-all">
                      Cloudinary image uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* ACTIVE */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) =>
                    setIsActive(e.target.checked)
                  }
                  className="
                    w-4
                    h-4
                    accent-[#0795A3]
                  "
                />

                <label className="text-sm font-medium text-gray-700">
                  Category is active
                </label>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div
              className="
                flex
                justify-end
                gap-3
                px-6
                py-4
                bg-gray-50
                border-t
                border-gray-200
                shrink-0
              "
            >
              <button
                onClick={closeModal}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-gray-300
                  text-gray-600
                  text-sm
                  font-semibold
                  hover:bg-white
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  editingCategory
                    ? handleUpdateCategory
                    : handleAddCategory
                }
                disabled={saving || uploading}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-[#123B63]
                  hover:bg-[#0795A3]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  text-white
                  text-sm
                  font-semibold
                  transition
                "
              >
                {saving
                  ? "Saving..."
                  : editingCategory
                    ? "Update Category"
                    : "Save Category"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
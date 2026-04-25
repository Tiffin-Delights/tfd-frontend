import { useEffect, useState } from "react";
import { deleteMenuDish, getMyMenu, uploadMenuDish } from "../../api/client";
import "./MenuUploadModal.css";

function createDishRow(providerFoodCategory) {
  return {
    name: "",
    food_type: providerFoodCategory === "pure_veg" ? "veg" : "veg",
  };
}

function normalizeDishItems(menuItem) {
  if (Array.isArray(menuItem?.dish_items) && menuItem.dish_items.length > 0) {
    return menuItem.dish_items
      .map((dish) => ({
        name: String(dish?.name || "").trim(),
        food_type: dish?.food_type === "nonveg" ? "nonveg" : "veg",
      }))
      .filter((dish) => dish.name.length > 0);
  }

  return (Array.isArray(menuItem?.dishes) ? menuItem.dishes : [])
    .map((dishName) => String(dishName || "").trim())
    .filter(Boolean)
    .map((dishName) => ({ name: dishName, food_type: "veg" }));
}

function MenuUploadModal({ auth, providerFoodCategory = "mixed", isOpen, onClose, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    day: "monday",
    meal_type: "breakfast",
    dishRows: [createDishRow(providerFoodCategory)],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("form");
  const token = auth?.token;

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      dishRows: prev.dishRows.map((row) => ({
        ...row,
        food_type: providerFoodCategory === "pure_veg" ? "veg" : row.food_type,
      })),
    }));
  }, [providerFoodCategory]);

  useEffect(() => {
    if (!isOpen || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadMenuOnOpen() {
      try {
        setLoadingMenu(true);
        const data = await getMyMenu(token);
        if (!cancelled) {
          setMenuItems(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load menu:", err);
        }
      } finally {
        if (!cancelled) {
          setLoadingMenu(false);
        }
      }
    }

    loadMenuOnOpen();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const loadExistingMenu = async () => {
    try {
      setLoadingMenu(true);
      const data = await getMyMenu(token);
      setMenuItems(data || []);
    } catch (err) {
      console.error("Failed to load menu:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDishRowChange = (index, field, value) => {
    setFormData((prev) => {
      const nextDishRows = [...prev.dishRows];
      nextDishRows[index] = {
        ...nextDishRows[index],
        [field]: field === "food_type" && providerFoodCategory === "pure_veg" ? "veg" : value,
      };
      return {
        ...prev,
        dishRows: nextDishRows,
      };
    });
  };

  const addDishRow = () => {
    setFormData((prev) => ({
      ...prev,
      dishRows: [...prev.dishRows, createDishRow(providerFoodCategory)],
    }));
  };

  const removeDishRow = (index) => {
    setFormData((prev) => {
      if (prev.dishRows.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        dishRows: prev.dishRows.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const dishItems = formData.dishRows
      .map((row) => ({
        name: String(row?.name || "").trim(),
        food_type:
          providerFoodCategory === "pure_veg"
            ? "veg"
            : row?.food_type === "nonveg"
              ? "nonveg"
              : "veg",
      }))
      .filter((row) => row.name.length > 0);

    if (dishItems.length === 0) {
      setError("Please enter at least one dish item");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        day: formData.day,
        meal_type: formData.meal_type,
        dish_items: dishItems,
      };

      await uploadMenuDish(token, payload);

      setSuccess(true);
      setFormData({
        day: "monday",
        meal_type: "breakfast",
        dishRows: [createDishRow(providerFoodCategory)],
      });

      await loadExistingMenu();

      setTimeout(() => {
        setSuccess(false);
        onUploadSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to upload menu item");
    } finally {
      setLoading(false);
    }
  };

  const resolveMenuItemId = (item) => {
    const rawId = item?.menu_id ?? item?.id;
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    if (!Number.isFinite(Number(itemId))) {
      window.alert("Unable to delete this item because its ID is invalid. Please refresh and try again.");
      return;
    }

    try {
      setDeleteLoading(itemId);
      await deleteMenuDish(token, itemId);
      setMenuItems((current) => current.filter((item) => resolveMenuItemId(item) !== itemId));
      await loadExistingMenu();
    } catch (err) {
      window.alert(`Failed to delete menu item: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const groupMenuByDayAndMeal = () => {
    const grouped = {};
    menuItems.forEach((item) => {
      const key = `${item.day}-${item.meal_type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  if (!isOpen) {
    return null;
  }

  const groupedMenu = groupMenuByDayAndMeal();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content menu-upload-modal large-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>🍽️ Manage Menu Items</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="menu-tabs">
          <button
            className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
            onClick={() => setActiveTab("form")}
          >
            ➕ Add New Item
          </button>
          <button
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            📋 View All Items ({menuItems.length})
          </button>
        </div>

        {activeTab === "form" && (
          <>
            {success && (
              <div className="success-message">
                ✓ Menu item added successfully!
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="day">Day of Week *</label>
                  <select
                    id="day"
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="meal_type">Meal Type *</label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    value={formData.meal_type}
                    onChange={handleChange}
                    required
                  >
                    {mealTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Dish Items *</label>
                <div className="dish-items-editor">
                  {formData.dishRows.map((dishRow, index) => (
                    <div key={`dish-row-${index}`} className="dish-item-row">
                      <input
                        type="text"
                        value={dishRow.name}
                        onChange={(event) => handleDishRowChange(index, "name", event.target.value)}
                        placeholder="Dish name"
                      />
                      <select
                        value={providerFoodCategory === "pure_veg" ? "veg" : dishRow.food_type}
                        onChange={(event) => handleDishRowChange(index, "food_type", event.target.value)}
                        disabled={providerFoodCategory === "pure_veg"}
                      >
                        <option value="veg">Veg</option>
                        <option value="nonveg">Non-Veg</option>
                      </select>
                      <button
                        type="button"
                        className="delete-item-btn"
                        onClick={() => removeDishRow(index)}
                        disabled={formData.dishRows.length <= 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="tab-btn" onClick={addDishRow}>
                  + Add Dish Row
                </button>
                {providerFoodCategory === "pure_veg" && (
                  <small>Pure veg profile: all dish tags are locked to veg.</small>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Adding..." : "➕ Add Menu Item"}
              </button>
            </form>
          </>
        )}

        {activeTab === "view" && (
          <>
            {loadingMenu ? (
              <div className="loading-message">Loading menu items...</div>
            ) : menuItems.length === 0 ? (
              <div className="empty-state">
                <p>No menu items added yet. Start by creating your first menu item above!</p>
              </div>
            ) : (
              <div className="menu-items-container">
                {Object.entries(groupedMenu).map(([key, items]) => {
                  const [day, mealType] = key.split("-");
                  return (
                    <div key={key} className="menu-section">
                      <h4 className="menu-section-title">
                        {day.charAt(0).toUpperCase() + day.slice(1)} - {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </h4>
                      <div className="menu-items-list">
                        {items.map((item, index) => {
                          const itemId = resolveMenuItemId(item);
                          const reactKey = itemId ?? `${key}-${index}`;
                          const dishItems = normalizeDishItems(item);

                          return (
                            <div key={reactKey} className="menu-item-card">
                              <div className="menu-item-content">
                                <div className="menu-item-dishes">
                                  {dishItems.map((dish, dishIndex) => (
                                    <span key={`${dish.name}-${dishIndex}`} className={`dish-chip ${dish.food_type === "nonveg" ? "dish-chip--nonveg" : "dish-chip--veg"}`}>
                                      {dish.food_type === "nonveg" ? "NV" : "V"} {dish.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="delete-item-btn"
                                onClick={() => handleDeleteItem(itemId)}
                                disabled={itemId === null || deleteLoading === itemId}
                              >
                                {deleteLoading === itemId ? "..." : "🗑️"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MenuUploadModal;

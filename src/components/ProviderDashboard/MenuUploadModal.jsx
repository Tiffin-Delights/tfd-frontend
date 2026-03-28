import { useState, useEffect } from "react";
import { uploadMenuDish, getMyMenu, deleteMenuDish } from "../../api/client";
import "./MenuUploadModal.css";

function MenuUploadModal({ auth, isOpen, onClose, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    day: "monday",
    meal_type: "breakfast",
    dishes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("form"); // "form" or "view"
  const token = auth?.token;

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];

  // Fetch existing menu items on modal open
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.dishes.trim()) {
      setError("Please enter at least one dish");
      return;
    }

    try {
      setLoading(true);
      const dishesArray = formData.dishes
        .split(",")
        .map((dish) => dish.trim())
        .filter((dish) => dish.length > 0);

      const payload = {
        day: formData.day,
        meal_type: formData.meal_type,
        dishes: dishesArray
      };

      await uploadMenuDish(token, payload);

      setSuccess(true);
      setFormData({
        day: "monday",
        meal_type: "breakfast",
        dishes: ""
      });

      // Reload menu items
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

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    if (!Number.isFinite(Number(itemId))) {
      alert("Unable to delete this item because its ID is invalid. Please refresh and try again.");
      return;
    }

    try {
      setDeleteLoading(itemId);
      await deleteMenuDish(token, itemId);
      setMenuItems(menuItems.filter((item) => resolveMenuItemId(item) !== itemId));
      await loadExistingMenu();
    } catch (err) {
      alert("Failed to delete menu item: " + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const groupMenuByDayAndMeal = () => {
    const grouped = {};
    menuItems.forEach(item => {
      const key = `${item.day}-${item.meal_type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const resolveMenuItemId = (item) => {
    const rawId = item?.menu_id ?? item?.id;
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  };

  if (!isOpen) return null;

  const groupedMenu = groupMenuByDayAndMeal();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content menu-upload-modal large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🍽️ Manage Menu Items</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
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

        {/* Form Tab */}
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
                <label htmlFor="dishes">Dishes (comma-separated) *</label>
                <textarea
                  id="dishes"
                  name="dishes"
                  value={formData.dishes}
                  onChange={handleChange}
                  placeholder="e.g., Aloo Paratha, Curd, Pickle"
                  rows="3"
                  required
                />
                <small>Separate multiple dishes with commas</small>
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

        {/* View Tab */}
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

                          return (
                          <div key={reactKey} className="menu-item-card">
                            <div className="menu-item-content">
                              <div className="menu-item-dishes">
                                {Array.isArray(item.dishes) 
                                  ? item.dishes.join(", ")
                                  : item.dishes
                                }
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

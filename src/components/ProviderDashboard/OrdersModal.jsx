import { useState, useEffect } from "react";
import { getProviderOrders } from "../../api/client";
import "./OrdersModal.css";

function OrdersModal({ auth, isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = auth?.token;

  useEffect(() => {
    if (!isOpen || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProviderOrders(token);
        if (!cancelled) {
          setOrders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load orders");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content orders-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Orders</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders yet</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.order_id}</span>
                  <span className={`status ${(order.payment_status || "").toLowerCase()}`}>
                    {(order.payment_status || "").toUpperCase()}
                  </span>
                </div>
                <div className="order-details">
                  <p><strong>Type:</strong> {order.order_type}</p>
                  <p><strong>Amount:</strong> ₹{order.total_amount}</p>
                  <p><strong>Start Date:</strong> {new Date(order.start_date).toLocaleDateString()}</p>
                  {order.end_date && (
                    <p><strong>End Date:</strong> {new Date(order.end_date).toLocaleDateString()}</p>
                  )}
                  <p><strong>Customer:</strong> {order.customer_name || `User #${order.user_id}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersModal;

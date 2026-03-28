import { useState, useEffect } from "react";
import { getProviderFeedback } from "../../api/client";
import StarRating from "../common/StarRating";
import "./FeedbackModal.css";

function FeedbackModal({ auth, isOpen, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && auth?.token) {
      fetchFeedback();
    }
  }, [isOpen, auth?.token]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviderFeedback(auth.token);
      setFeedbacks(data);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + Number(f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : "0.0";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⭐ Customer Feedback</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading">Loading feedback...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="feedback-summary">
              <div className="average-rating">
                <div className="rating-number">{averageRating}</div>
                <div className="rating-stars">
                  <StarRating value={averageRating} size="md" showValue />
                </div>
                <div className="total-reviews">({feedbacks.length} reviews)</div>
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="empty-state">No feedback yet. Keep up the good work!</div>
            ) : (
              <div className="feedback-list">
                {feedbacks.map((feedback) => (
                  <div key={feedback.feedback_id} className="feedback-card">
                    <div className="feedback-header">
                      <div>
                        <h4>{feedback.customer_name}</h4>
                        <p className="feedback-date">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="feedback-rating">
                        <StarRating value={feedback.rating} size="sm" showValue />
                      </div>
                    </div>
                    <div className="feedback-comment">
                      {feedback.comment || "No comment provided"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;

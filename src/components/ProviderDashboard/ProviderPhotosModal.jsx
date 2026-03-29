import { useEffect, useState } from "react";
import { deleteProviderPhoto, getProviderPhotos, uploadProviderPhotos } from "../../api/client";
import "./ModalsCommon.css";

function ProviderPhotosModal({ auth, isOpen, onClose, onUploadSuccess }) {
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const token = auth?.token;

  useEffect(() => {
    if (!isOpen || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadPhotosOnOpen() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProviderPhotos(token);
        if (!cancelled) {
          setPhotos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load photos");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPhotosOnOpen();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const refreshPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviderPhotos(token);
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await uploadProviderPhotos(token, selectedFiles);
      setSelectedFiles([]);
      await refreshPhotos();
      onUploadSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to upload photos");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await deleteProviderPhoto(token, photoId);
      await refreshPhotos();
      onUploadSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to delete photo");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Provider Photos</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="menu-form">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []).slice(0, 5);
              setSelectedFiles(files);
            }}
          />
          <button type="button" className="action-btn primary" onClick={handleUpload} disabled={saving || !selectedFiles.length}>
            {saving ? "Uploading..." : "Upload Photos"}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="empty-state">No photos uploaded yet</div>
        ) : (
          <div className="feedback-list">
            {photos.map((photo) => (
              <div key={photo.photo_id} className="feedback-card">
                <img
                  src={photo.photo_url}
                  alt="Provider"
                  style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px", marginBottom: "12px" }}
                />
                <div className="detail-row">
                  <span>Display Order</span>
                  <strong>{photo.display_order}</strong>
                </div>
                <button type="button" className="action-btn secondary" onClick={() => handleDelete(photo.photo_id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderPhotosModal;

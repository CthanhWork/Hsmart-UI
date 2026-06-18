import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Sparkles, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiCreateProduct,
  apiFetchCategories,
  apiPrepareListing,
} from '../services/api';
import './SmartUpload.css';

const MAX_IMAGES = 8;

const initialForm = {
  title: '',
  categoryId: '',
  price: '',
  description: '',
};

const createImageItem = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
  file,
  previewUrl: URL.createObjectURL(file),
});

const revokeImage = (image) => {
  if (image?.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(image.previewUrl);
  }
};

const SmartUpload = () => {
  const { isAuthenticated } = useUser();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImageId, setPreviewImageId] = useState('');
  const [analysisImageId, setAnalysisImageId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [isPreparingListing, setIsPreparingListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedImagesRef = useRef([]);

  useEffect(() => {
    apiFetchCategories()
      .then(setCategories)
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => () => {
    selectedImagesRef.current.forEach(revokeImage);
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyListingSuggestions = async (file) => {
    if (!file || !isAuthenticated) {
      return;
    }

    setIsPreparingListing(true);
    try {
      const listingSuggestion = await apiPrepareListing(file);
      const suggestedTitle = listingSuggestion?.suggestedTitle?.trim();
      const suggestedDescription = listingSuggestion?.suggestedDescription?.trim();

      setForm((current) => ({
        ...current,
        title: current.title.trim() ? current.title : (suggestedTitle || ''),
        description: current.description.trim() ? current.description : (suggestedDescription || ''),
      }));
    } catch {
      // Listing suggestions are optional. Sellers can continue with manual input.
    } finally {
      setIsPreparingListing(false);
    }
  };

  const handleFileChange = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) {
      return;
    }

    const availableSlots = Math.max(0, MAX_IMAGES - selectedImages.length);
    const acceptedFiles = incomingFiles.slice(0, availableSlots);
    const nextImages = [...selectedImages, ...acceptedFiles.map(createImageItem)];
    const nextPreviewImageId = previewImageId || nextImages[0]?.id || '';
    const nextAnalysisImageId = analysisImageId
      || (acceptedFiles.length ? (nextImages[0]?.id || '') : '');

    setSelectedImages(nextImages);
    setPreviewImageId(nextPreviewImageId);
    setAnalysisImageId(nextAnalysisImageId);
    setMessage('');
    setError('');
    event.target.value = '';

    if (!analysisImageId && nextImages[0]) {
      await applyListingSuggestions(nextImages[0].file);
    }
  };

  const handleRemoveImage = (imageId) => {
    const imageToRemove = selectedImages.find((image) => image.id === imageId);
    if (!imageToRemove) {
      return;
    }

    const nextImages = selectedImages.filter((image) => image.id !== imageId);
    revokeImage(imageToRemove);

    setSelectedImages(nextImages);
    setPreviewImageId((current) => {
      if (current !== imageId) {
        return current;
      }
      return nextImages[0]?.id || '';
    });
    setAnalysisImageId((current) => {
      if (current !== imageId) {
        return current;
      }
      return nextImages[0]?.id || '';
    });
    setMessage('');
  };

  const handleChooseAnalysisImage = async (imageId) => {
    const nextImage = selectedImages.find((image) => image.id === imageId);
    if (!nextImage) {
      return;
    }

    setAnalysisImageId(imageId);
    setPreviewImageId(imageId);
    setMessage('');
    setError('');
    await applyListingSuggestions(nextImage.file);
  };

  const resetForm = () => {
    selectedImages.forEach(revokeImage);
    setSelectedImages([]);
    setPreviewImageId('');
    setAnalysisImageId('');
    setForm(initialForm);
    setIsPreparingListing(false);
  };

  const handlePublish = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập trước khi đăng sản phẩm.');
      return;
    }
    if (!selectedImages.length) {
      setError('Vui lòng chọn ít nhất một ảnh sản phẩm.');
      return;
    }
    if (!form.title.trim()) {
      setError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!form.categoryId) {
      setError('Vui lòng chọn danh mục sản phẩm.');
      return;
    }
    if (form.price === '' || Number(form.price) <= 0) {
      setError('Vui lòng nhập giá bán hợp lệ.');
      return;
    }

    const analysisImageIndex = Math.max(
      0,
      selectedImages.findIndex((image) => image.id === analysisImageId),
    );

    setIsPublishing(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((image) => {
        formData.append('files', image.file);
      });
      formData.append('analysisImageIndex', String(analysisImageIndex));
      formData.append('title', form.title.trim());
      formData.append('categoryId', form.categoryId);
      formData.append('price', form.price);
      formData.append('description', form.description.trim());

      const createdProduct = await apiCreateProduct(formData);
      toast.success(createdProduct.apiMessage || 'Đăng tin thành công. Sản phẩm của bạn đã được gửi lên hệ thống.');
      setMessage(createdProduct.apiMessage || 'Sản phẩm đã được gửi lên hệ thống.');
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const previewImage = selectedImages.find((image) => image.id === previewImageId) || selectedImages[0] || null;

  return (
    <main className="sell-page">
      <div className="sell-container">
        <header className="sell-header">
          <div>
            <h1>Đăng bán sản phẩm</h1>
          </div>
        </header>

        <form className="sell-layout" onSubmit={handlePublish}>
          <section className="sell-photo-panel" aria-labelledby="photo-section-title">
            <div className="sell-panel-heading">
              <h2 id="photo-section-title">Ảnh sản phẩm</h2>
            </div>

            <label className={`photo-uploader ${previewImage ? 'has-preview' : ''}`} htmlFor="product-photo">
              {previewImage ? (
                <img src={previewImage.previewUrl} alt="Ảnh sản phẩm đang xem trước" />
              ) : (
                <div className="upload-placeholder">
                  <ImagePlus size={38} />
                  <strong>Chọn nhiều ảnh sản phẩm</strong>
                </div>
              )}
              <input
                id="product-photo"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </label>

            <div className="photo-actions">
              <label className="secondary-sell-button" htmlFor="product-photo">
                <Camera size={15} />
                {selectedImages.length ? 'Thêm hoặc đổi ảnh' : 'Chọn ảnh'}
              </label>
              <span>{selectedImages.length ? `${selectedImages.length}/${MAX_IMAGES} ảnh đã chọn` : 'Chưa có ảnh nào được thêm.'}</span>
            </div>

            {selectedImages.length ? (
              <div className="upload-gallery-grid" aria-label="Danh sách ảnh đã chọn">
                {selectedImages.map((image, index) => {
                  const isPreviewImage = image.id === previewImageId;
                  const isAnalysisImage = image.id === analysisImageId;
                  return (
                    <article
                      key={image.id}
                      className={`upload-gallery-card ${isPreviewImage ? 'is-active' : ''}`}
                    >
                      <button
                        className="upload-gallery-preview"
                        type="button"
                        onClick={() => setPreviewImageId(image.id)}
                        aria-label={`Xem ảnh ${index + 1}`}
                      >
                        <img src={image.previewUrl} alt={`Ảnh sản phẩm ${index + 1}`} />
                      </button>

                      <div className="upload-gallery-meta">
                        <div className="upload-gallery-badges">
                          {index === 0 ? <span>Ảnh bìa</span> : null}
                          {isAnalysisImage ? <span className="analysis-badge">Ảnh gợi ý</span> : null}
                        </div>

                        <div className="upload-gallery-actions">
                          <button
                            className={`thumbnail-action-button ${isAnalysisImage ? 'is-selected' : ''}`}
                            type="button"
                            onClick={() => handleChooseAnalysisImage(image.id)}
                          >
                            <Sparkles size={14} />
                            {isAnalysisImage ? 'Đang dùng để gợi ý' : 'Dùng để gợi ý'}
                          </button>
                          <button
                            className="thumbnail-remove-button"
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                            aria-label={`Xóa ảnh ${index + 1}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            {isPreparingListing ? (
              <p className="listing-prep-status">Đang tạo gợi ý từ ảnh đã chọn...</p>
            ) : null}
          </section>

          <section className="sell-form-panel" aria-labelledby="listing-section-title">
            <div className="sell-panel-heading">
              <h2 id="listing-section-title">Thông tin tin đăng</h2>
            </div>

            <div className="sell-field">
              <label htmlFor="product-title">Tên sản phẩm</label>
              <input
                id="product-title"
                name="title"
                type="text"
                value={form.title}
                onChange={updateField}
                placeholder="Ví dụ: Bàn ăn gỗ 4 ghế còn rất tốt, ít trầy xước"
              />
            </div>

            <div className="sell-field-grid">
              <div className="sell-field">
                <label htmlFor="product-category">Danh mục</label>
                <select
                  id="product-category"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={updateField}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.displayName || category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sell-field">
                <label htmlFor="product-price">Giá bán</label>
                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.price}
                  onChange={updateField}
                  placeholder="VND"
                />
              </div>
            </div>

            <div className="sell-field">
              <label htmlFor="product-description">Mô tả</label>
              <textarea
                id="product-description"
                name="description"
                rows="7"
                value={form.description}
                onChange={updateField}
                placeholder="Mô tả tình trạng, kích thước, thời gian sử dụng, phụ kiện đi kèm và cách giao nhận."
              />
            </div>

            {error ? <div className="sell-alert sell-alert-error"><p>{error}</p></div> : null}
            {message ? <div className="sell-alert sell-alert-success"><p>{message}</p></div> : null}

            <div className="sell-submit-row">
              <button className="primary-sell-button" type="submit" disabled={isPublishing || isPreparingListing}>
                {isPublishing ? 'Đang đăng...' : 'Đăng sản phẩm'}
              </button>
              <button className="ghost-sell-button" type="button" onClick={resetForm} disabled={isPublishing || isPreparingListing}>
                Làm mới
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
};

export default SmartUpload;

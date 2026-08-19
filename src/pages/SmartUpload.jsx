import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiCreateProduct,
  apiFetchCategories,
  apiGenerateDescription,
  apiPrepareListing,
} from '../services/api';
import './SmartUpload.css';

const MAX_IMAGES = 8;
const MAX_SELLER_NOTES = 500;

const CONDITION_OPTIONS = [
  'Còn mới (chưa sử dụng)',
  'Như mới',
  'Tốt',
  'Đã qua sử dụng',
  'Cũ, cần sửa chữa',
];

const initialForm = {
  title: '',
  categoryId: '',
  price: '',
  condition: 'Đã qua sử dụng',
  sellerNotes: '',
  description: '',
  negotiable: false,
  minPrice: '',
};

// Trạng thái phân tích AI: idle | analyzing | success | empty | failed
const AI_IDLE = 'idle';
const AI_ANALYZING = 'analyzing';
const AI_SUCCESS = 'success';
const AI_EMPTY = 'empty';
const AI_FAILED = 'failed';

// Định dạng tiền: lưu chuỗi chữ số thuần, hiển thị có dấu phân cách nghìn.
const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');
const groupDigits = (value) => (value ? Number(value).toLocaleString('vi-VN') : '');

const PRICE_QUICK_ADDS = [
  { label: '+10K', amount: 10000 },
  { label: '+100K', amount: 100000 },
  { label: '+1Tr', amount: 1000000 },
];

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
  const [aiStatus, setAiStatus] = useState(AI_IDLE);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [descGenerating, setDescGenerating] = useState(false);
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

  // Ô giá: chỉ giữ chữ số khi nhập; nút nhanh cộng dồn vào giá hiện tại.
  const handlePriceInput = (field) => (event) => {
    const digits = onlyDigits(event.target.value);
    setForm((current) => ({ ...current, [field]: digits }));
  };

  const addToPrice = (field, amount) => {
    setForm((current) => ({ ...current, [field]: String((Number(current[field]) || 0) + amount) }));
  };

  const selectedCategory = categories.find((item) => String(item.id) === String(form.categoryId));

  // Gọi AI để phân tích ảnh và gợi ý tên + mô tả; báo trạng thái rõ ràng.
  const runAiAnalysis = async (file) => {
    if (!file || !isAuthenticated) return;

    setAiStatus(AI_ANALYZING);
    setAiSuggestion(null);

    try {
      const suggestion = await apiPrepareListing(file);
      const suggestedTitle = suggestion?.suggestedTitle?.trim() || '';
      const suggestedDescription = suggestion?.suggestedDescription?.trim() || '';

      if (!suggestedTitle && !suggestedDescription) {
        setAiStatus(AI_EMPTY);
        return;
      }

      setAiSuggestion({ title: suggestedTitle, description: suggestedDescription });
      // Chỉ điền vào ô đang trống, không ghi đè nội dung người dùng đã nhập.
      setForm((current) => ({
        ...current,
        title: current.title.trim() ? current.title : suggestedTitle,
        description: current.description.trim() ? current.description : suggestedDescription,
      }));
      setAiStatus(AI_SUCCESS);
    } catch {
      setAiStatus(AI_FAILED);
    }
  };

  const applySuggestion = () => {
    if (!aiSuggestion) return;
    setForm((current) => ({
      ...current,
      title: aiSuggestion.title || current.title,
      description: aiSuggestion.description || current.description,
    }));
    toast.success('Đã điền gợi ý của AI vào tin đăng.');
  };

  // Tạo mô tả bằng AI từ thông tin đã nhập + ghi chú của người bán.
  const generateDescription = async () => {
    if (!isAuthenticated) return;
    if (!form.title.trim()) {
      toast.error('Hãy nhập tên sản phẩm trước khi tạo mô tả.');
      return;
    }
    if (!form.categoryId) {
      toast.error('Hãy chọn danh mục trước khi tạo mô tả bằng AI.');
      return;
    }

    setDescGenerating(true);
    try {
      const result = await apiGenerateDescription({
        productName: form.title.trim(),
        category: selectedCategory?.displayName || selectedCategory?.name || '',
        condition: form.condition,
        price: form.price || 0,
        sellerNotes: form.sellerNotes.trim() || undefined,
      });
      const description = (typeof result === 'string'
        ? result
        : result?.generatedDescription || result?.description || result?.reply || result?.content || result?.message || ''
      ).trim();

      if (description) {
        setForm((current) => ({ ...current, description }));
        toast.success('AI đã tạo mô tả cho tin đăng.');
      } else {
        toast.error('AI chưa tạo được mô tả. Vui lòng thử lại hoặc nhập thủ công.');
      }
    } catch {
      toast.error('Tạo mô tả bằng AI thất bại. Vui lòng thử lại hoặc nhập thủ công.');
    } finally {
      setDescGenerating(false);
    }
  };

  const handleFileChange = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    const availableSlots = Math.max(0, MAX_IMAGES - selectedImages.length);
    const acceptedFiles = incomingFiles.slice(0, availableSlots);
    const isFirstBatch = selectedImages.length === 0;
    const nextImages = [...selectedImages, ...acceptedFiles.map(createImageItem)];

    setSelectedImages(nextImages);
    setPreviewImageId((current) => current || nextImages[0]?.id || '');
    setMessage('');
    setError('');
    event.target.value = '';

    if (isFirstBatch && nextImages[0]) {
      setAnalysisImageId(nextImages[0].id);
      await runAiAnalysis(nextImages[0].file);
    }
  };

  const handleRemoveImage = (imageId) => {
    const imageToRemove = selectedImages.find((image) => image.id === imageId);
    if (!imageToRemove) return;

    const nextImages = selectedImages.filter((image) => image.id !== imageId);
    revokeImage(imageToRemove);

    setSelectedImages(nextImages);
    setPreviewImageId((current) => (current !== imageId ? current : nextImages[0]?.id || ''));
    setAnalysisImageId((current) => (current !== imageId ? current : nextImages[0]?.id || ''));
    setMessage('');

    if (!nextImages.length) {
      setAiStatus(AI_IDLE);
      setAiSuggestion(null);
    }
  };

  const handleChooseAnalysisImage = async (imageId) => {
    const nextImage = selectedImages.find((image) => image.id === imageId);
    if (!nextImage) return;

    setAnalysisImageId(imageId);
    setPreviewImageId(imageId);
    setMessage('');
    setError('');
    await runAiAnalysis(nextImage.file);
  };

  const retryAnalysis = async () => {
    const target = selectedImages.find((image) => image.id === analysisImageId) || selectedImages[0];
    if (target) await runAiAnalysis(target.file);
  };

  const resetForm = () => {
    selectedImages.forEach(revokeImage);
    setSelectedImages([]);
    setPreviewImageId('');
    setAnalysisImageId('');
    setForm(initialForm);
    setAiStatus(AI_IDLE);
    setAiSuggestion(null);
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
    if (form.negotiable) {
      const minPriceValue = Number(form.minPrice);
      if (form.minPrice === '' || minPriceValue <= 0) {
        setError('Giá sàn phải lớn hơn 0 khi cho phép trả giá.');
        return;
      }
      if (minPriceValue >= Number(form.price)) {
        setError('Giá sàn phải nhỏ hơn giá niêm yết.');
        return;
      }
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
      // Cờ cho admin review: true khi user sửa tên khác với gợi ý CV của AI.
      const titleModifiedByUser = Boolean(aiSuggestion?.title)
        && form.title.trim() !== aiSuggestion.title.trim();

      formData.append('analysisImageIndex', String(analysisImageIndex));
      formData.append('title', form.title.trim());
      formData.append('categoryId', form.categoryId);
      formData.append('price', form.price);
      formData.append('description', form.description.trim());
      formData.append('titleModifiedByUser', String(titleModifiedByUser));
      formData.append('negotiable', String(form.negotiable));
      if (form.negotiable && form.minPrice !== '') {
        formData.append('minPrice', form.minPrice);
      }

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
  const busy = isPublishing || aiStatus === AI_ANALYZING || descGenerating;

  const renderAiStatus = () => {
    if (!selectedImages.length) {
      return (
        <div className="ai-status ai-status--idle">
          <Sparkles size={18} />
          <div className="ai-status-text">
            <strong>Trợ lý AI</strong>
            <span>Thêm ảnh để AI tự gợi ý tên và mô tả sản phẩm cho bạn.</span>
          </div>
        </div>
      );
    }

    if (aiStatus === AI_ANALYZING) {
      return (
        <div className="ai-status ai-status--analyzing">
          <Loader2 size={18} className="ai-spin" />
          <div className="ai-status-text">
            <strong>AI đang phân tích ảnh…</strong>
            <span>Đang nhận diện sản phẩm để gợi ý tên và mô tả.</span>
          </div>
        </div>
      );
    }

    if (aiStatus === AI_SUCCESS) {
      return (
        <div className="ai-status ai-status--success">
          <CheckCircle2 size={18} />
          <div className="ai-status-text">
            <strong>AI đã phân tích xong</strong>
            <span>Đã gợi ý tên và mô tả. Bạn có thể chỉnh sửa lại cho phù hợp.</span>
          </div>
          {aiSuggestion ? (
            <button type="button" className="ai-status-action" onClick={applySuggestion}>
              <RefreshCw size={14} /> Điền lại gợi ý
            </button>
          ) : null}
        </div>
      );
    }

    if (aiStatus === AI_EMPTY) {
      return (
        <div className="ai-status ai-status--warn">
          <TriangleAlert size={18} />
          <div className="ai-status-text">
            <strong>AI chưa nhận diện được sản phẩm</strong>
            <span>Không lấy được gợi ý từ ảnh này. Bạn hãy nhập tên và mô tả thủ công, hoặc thử ảnh rõ hơn.</span>
          </div>
          <button type="button" className="ai-status-action" onClick={retryAnalysis}>
            <RefreshCw size={14} /> Phân tích lại
          </button>
        </div>
      );
    }

    if (aiStatus === AI_FAILED) {
      return (
        <div className="ai-status ai-status--error">
          <TriangleAlert size={18} />
          <div className="ai-status-text">
            <strong>AI phân tích thất bại</strong>
            <span>Có thể do mất kết nối hoặc dịch vụ AI bận. Bạn vẫn có thể nhập thủ công và đăng bình thường.</span>
          </div>
          <button type="button" className="ai-status-action" onClick={retryAnalysis}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="sell-page">
      <div className="sell-container">
        <header className="sell-header">
          <h1>Đăng bán sản phẩm</h1>
          <p>Tạo tin nhanh, rõ ý và dễ kiểm tra trước khi đăng.</p>
        </header>

        <form className="sell-layout" onSubmit={handlePublish}>
          <section className="sell-photo-panel" aria-labelledby="photo-section-title">
            <div className="sell-panel-heading">
              <h2 id="photo-section-title">Hình ảnh sản phẩm</h2>
              <span className="sell-panel-hint">{selectedImages.length}/{MAX_IMAGES}</span>
            </div>

            <label className={`photo-uploader ${previewImage ? 'has-preview' : ''}`} htmlFor="product-photo">
              {previewImage ? (
                <img src={previewImage.previewUrl} alt="Ảnh sản phẩm đang xem trước" />
              ) : (
                <div className="upload-placeholder">
                  <ImagePlus size={40} />
                  <strong>Tải ảnh sản phẩm</strong>
                  <span>Kéo thả hoặc bấm để chọn tối đa {MAX_IMAGES} ảnh</span>
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
                {selectedImages.length ? 'Thêm ảnh' : 'Chọn ảnh'}
              </label>
              {selectedImages.length ? (
                <button
                  type="button"
                  className="ghost-sell-button"
                  onClick={retryAnalysis}
                  disabled={aiStatus === AI_ANALYZING}
                >
                  <Sparkles size={15} /> Phân tích bằng AI
                </button>
              ) : null}
            </div>

            <div className="sell-photo-tips" aria-label="Mẹo đăng ảnh">
              <span>Ảnh đầu tiên sẽ là ảnh bìa</span>
              <span>Chọn một ảnh bất kỳ để AI gợi ý</span>
            </div>

            {selectedImages.length ? (
              <div className="upload-thumb-row" aria-label="Danh sách ảnh đã chọn">
                {selectedImages.map((image, index) => {
                  const isPreviewImage = image.id === previewImageId;
                  const isAnalysisImage = image.id === analysisImageId;
                  return (
                    <div
                      key={image.id}
                      className={`upload-thumb ${isPreviewImage ? 'is-active' : ''} ${isAnalysisImage ? 'is-analysis' : ''}`}
                    >
                      <button
                        className="upload-thumb-img"
                        type="button"
                        onClick={() => setPreviewImageId(image.id)}
                        aria-label={`Xem ảnh ${index + 1}`}
                      >
                        <img src={image.previewUrl} alt={`Ảnh sản phẩm ${index + 1}`} />
                      </button>

                      {index === 0 ? <span className="upload-thumb-cover">Ảnh bìa</span> : null}
                      {isAnalysisImage ? (
                        <span className="upload-thumb-ai" title="Ảnh đang dùng để AI phân tích">
                          <Sparkles size={12} />
                        </span>
                      ) : null}

                      <button
                        className="upload-thumb-remove"
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        aria-label={`Xóa ảnh ${index + 1}`}
                      >
                        <X size={13} />
                      </button>

                      {!isAnalysisImage ? (
                        <button
                          className="upload-thumb-pick"
                          type="button"
                          onClick={() => handleChooseAnalysisImage(image.id)}
                        >
                          Dùng để AI gợi ý
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="sell-form-panel" aria-labelledby="listing-section-title">
            <div className="sell-panel-heading">
              <h2 id="listing-section-title">Thông tin tin đăng</h2>
              <span className="sell-panel-hint"><span className="req">*</span> bắt buộc</span>
            </div>

            {renderAiStatus()}

            <div className="sell-form-sections">
              <div className="sell-block">
                <h3 className="sell-block-title">Thông tin chính</h3>

                <div className="sell-field sell-field--full">
                  <label htmlFor="product-title">Tên sản phẩm <span className="req">*</span></label>
                  <input
                    id="product-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={updateField}
                    placeholder="Ví dụ: Bàn ăn gỗ 4 ghế còn rất tốt, ít trầy xước"
                  />
                </div>

                <div className="sell-field sell-field--full">
                  <label htmlFor="product-category">Danh mục <span className="req">*</span></label>
                  <select id="product-category" name="categoryId" value={form.categoryId} onChange={updateField}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.displayName || category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sell-field-grid">
                  <div className="sell-field">
                    <label htmlFor="product-price">Giá bán <span className="req">*</span></label>
                    <div className="price-input">
                      <input
                        id="product-price"
                        name="price"
                        type="text"
                        inputMode="numeric"
                        value={groupDigits(form.price)}
                        onChange={handlePriceInput('price')}
                        placeholder="0"
                      />
                      <span className="price-suffix">đ</span>
                    </div>
                    <div className="price-quick">
                      {PRICE_QUICK_ADDS.map((quick) => (
                        <button type="button" key={quick.label} onClick={() => addToPrice('price', quick.amount)}>
                          {quick.label}
                        </button>
                      ))}
                      {form.price ? (
                        <button
                          type="button"
                          className="price-clear"
                          onClick={() => setForm((current) => ({ ...current, price: '' }))}
                        >
                          Xóa
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="sell-field">
                    <label htmlFor="product-condition">Tình trạng</label>
                    <select id="product-condition" name="condition" value={form.condition} onChange={updateField}>
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sell-negotiate-field">
                  <label className="sell-toggle">
                    <input
                      type="checkbox"
                      name="negotiable"
                      checked={form.negotiable}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        negotiable: event.target.checked,
                        minPrice: event.target.checked ? current.minPrice : '',
                      }))}
                    />
                    <span>Cho phép người mua trả giá</span>
                  </label>
                  {form.negotiable ? (
                    <div className="sell-field">
                      <label htmlFor="product-min-price">Giá sàn (mức thấp nhất chấp nhận)</label>
                      <div className="price-input">
                        <input
                          id="product-min-price"
                          name="minPrice"
                          type="text"
                          inputMode="numeric"
                          value={groupDigits(form.minPrice)}
                          onChange={handlePriceInput('minPrice')}
                          placeholder="0"
                        />
                        <span className="price-suffix">đ</span>
                      </div>
                      <span className="field-hint">Phải lớn hơn 0 và nhỏ hơn giá niêm yết.</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sell-block">
                <div className="sell-block-head">
                  <h3 className="sell-block-title">Mô tả</h3>
                  <button
                    type="button"
                    className="ai-desc-button"
                    onClick={generateDescription}
                    disabled={descGenerating || !form.title.trim() || !form.categoryId}
                    title={!form.categoryId ? 'Chọn danh mục trước để AI tạo mô tả phù hợp hơn.' : ''}
                  >
                    {descGenerating
                      ? <><Loader2 size={14} className="ai-spin" /> Đang tạo…</>
                      : <><Sparkles size={14} /> Tạo bằng AI</>}
                  </button>
                </div>
                {!form.categoryId ? (
                  <p className="ai-desc-hint">Chọn danh mục trước để dùng AI tạo mô tả.</p>
                ) : null}

                <div className="sell-field">
                  <label htmlFor="seller-notes">
                    Ghi chú cho AI <span className="field-optional">(tuỳ chọn)</span>
                  </label>
                  <textarea
                    id="seller-notes"
                    name="sellerNotes"
                    rows="2"
                    maxLength={MAX_SELLER_NOTES}
                    value={form.sellerNotes}
                    onChange={updateField}
                    placeholder="Ví dụ: còn bảo hành 6 tháng, đầy đủ hộp và phụ kiện, trầy nhẹ ở cạnh phải…"
                  />
                  <span className="field-counter">{form.sellerNotes.length}/{MAX_SELLER_NOTES}</span>
                </div>

                <div className="sell-field">
                  <label htmlFor="product-description">Mô tả chi tiết</label>
                  <textarea
                    id="product-description"
                    name="description"
                    rows="6"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Mô tả tình trạng, kích thước, thời gian sử dụng, phụ kiện đi kèm và cách giao nhận."
                  />
                </div>
              </div>
            </div>

            {error ? <div className="sell-alert sell-alert-error"><p>{error}</p></div> : null}
            {message ? <div className="sell-alert sell-alert-success"><p>{message}</p></div> : null}

            <div className="sell-submit-row">
              <button className="ghost-sell-button" type="button" onClick={resetForm} disabled={busy}>
                Làm mới
              </button>
              <button className="primary-sell-button" type="submit" disabled={busy}>
                {isPublishing ? 'Đang đăng…' : 'Đăng sản phẩm'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
};

export default SmartUpload;

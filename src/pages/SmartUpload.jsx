import { useEffect, useMemo, useState } from 'react';
import { Camera, ShieldCheck, Sparkles, TrendingUp, WandSparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import {
  apiAnalyzeImage,
  apiCreateProduct,
  apiFetchCategories,
  apiGenerateDescription,
} from '../services/api';
import './SmartUpload.css';

const DEFAULT_PREVIEW = 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80';

const SmartUpload = () => {
  const { isAuthenticated } = useUser();
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PREVIEW);
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    price: '',
    description: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetchCategories()
      .then(setCategories)
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const confidence = Number(analysis?.aiMetadata?.confidence || 0);
  const confidenceLabel = confidence > 0
    ? `${Math.round(confidence * 100)}% confidence`
    : 'Awaiting analysis';
  const detectedLabel = analysis?.aiMetadata?.translated_label
    || analysis?.aiMetadata?.translatedLabel
    || analysis?.aiMetadata?.label
    || 'Product image';

  const formattedSuggestedPrice = useMemo(() => {
    const price = Number(analysis?.suggestedPrice);
    return Number.isFinite(price) && price > 0
      ? `${price.toLocaleString('vi-VN')} VND`
      : 'No market price yet';
  }, [analysis?.suggestedPrice]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setMessage('');
    setError('');

    if (!isAuthenticated) {
      setError('Sign in before analyzing and publishing a product.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await apiAnalyzeImage(file);
      setAnalysis(result);
      setForm((current) => ({
        ...current,
        title: current.title || result.suggestedName || '',
        price: current.price || (result.suggestedPrice != null ? String(result.suggestedPrice) : ''),
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    setMessage('');
    setError('');

    if (!isAuthenticated) {
      setError('Sign in before publishing a product.');
      return;
    }
    if (!selectedFile) {
      setError('Choose a product image before publishing.');
      return;
    }
    if (!form.categoryId) {
      setError('Choose a product category before publishing.');
      return;
    }
    if (form.price === '' || Number(form.price) < 0) {
      setError('Enter a valid product price.');
      return;
    }

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', form.title.trim());
      formData.append('categoryId', form.categoryId);
      formData.append('price', form.price);
      formData.append('description', form.description.trim());

      const createdProduct = await apiCreateProduct(formData);
      setMessage(createdProduct.apiMessage || 'Product created successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const generateDescription = async () => {
    if (!form.title || !form.categoryId || form.price === '') {
      setError('Enter a product name, category, and price before generating a description.');
      return;
    }
    const category = categories.find((item) => String(item.id) === String(form.categoryId));
    setIsGenerating(true);
    setError('');
    try {
      const result = await apiGenerateDescription({
        productName: form.title,
        category: category?.name || 'Uncategorized',
        condition: 'Pre-owned',
        price: Number(form.price),
      });
      setForm((current) => ({ ...current, description: result?.generatedDescription || '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="smart-upload-page container">
      <div className="page-header">
        <span className="badge badge-success" style={{ marginBottom: '16px' }}>
          <Sparkles size={12} /> H-SMART AI ENGINE
        </span>
        <h1 className="page-title">Smart Upload</h1>
        <p className="page-desc">
          Upload an appliance image to receive an AI product name and a market-based price suggestion.
        </p>
      </div>

      <div className="upload-content">
        <div className="upload-visual">
          <div className="image-analysis-container">
            <img src={previewUrl} alt="Product analysis" className="analyzed-image" />
            {analysis ? (
              <div className="bounding-box">
                <div className="bounding-box-header">
                  <span>{detectedLabel} - {confidenceLabel}</span>
                  <span className="box-coords">
                    {analysis.aiMetadata?.num_detections ?? analysis.aiMetadata?.numDetections ?? 0} detections
                  </span>
                </div>
              </div>
            ) : null}
            {isAnalyzing ? <div className="scan-line" /> : null}

            <label className="retake-btn" style={{ cursor: 'pointer' }}>
              <Camera size={16} /> {selectedFile ? 'Choose another image' : 'Choose image'}
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>

            <div className="upload-status-badge">
              <span className="status-label text-success font-bold text-xs">STATUS</span>
              <span className="status-text font-bold">
                {isAnalyzing ? 'Analyzing image' : analysis ? 'Analysis complete' : 'Ready for upload'}
              </span>
            </div>
          </div>

          <div className="analysis-results-row">
            <div className="result-card">
              <div className="result-header">
                <ShieldCheck size={16} className="text-success" />
                <span className="text-success font-bold text-xs uppercase tracking-wide">AI Detection</span>
              </div>
              <div className="result-value">{detectedLabel}</div>
            </div>
            <div className="result-card">
              <div className="result-header">
                <TrendingUp size={16} className="text-success" />
                <span className="text-success font-bold text-xs uppercase tracking-wide">Suggested Price</span>
              </div>
              <div className="result-value">{formattedSuggestedPrice}</div>
            </div>
          </div>
        </div>

        <div className="upload-form">
          <div className="form-header">
            <h3>Product Details</h3>
            <span className="text-xs">{analysis ? 'AI suggestions applied' : 'Manual details available'}</span>
          </div>

          <div className="form-group">
            <label htmlFor="product-title">PRODUCT NAME</label>
            <input
              id="product-title"
              name="title"
              type="text"
              value={form.title}
              onChange={updateField}
              placeholder="AI will suggest a name"
              className="form-input bg-gray"
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-category">CATEGORY</label>
            <select
              id="product-category"
              name="categoryId"
              value={form.categoryId}
              onChange={updateField}
              className="form-select bg-gray"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.displayName || category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="product-price">PRICE (VND)</label>
            <input
              id="product-price"
              name="price"
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={updateField}
              placeholder="Enter a selling price"
              className="form-input bg-gray"
            />
          </div>

          <div className="form-group">
            <div className="row-between">
              <label htmlFor="product-description">DESCRIPTION</label>
              <button type="button" className="text-action" onClick={generateDescription} disabled={isGenerating}>
                <WandSparkles size={14} /> {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea
              id="product-description"
              name="description"
              className="form-textarea bg-gray"
              rows="5"
              value={form.description}
              onChange={updateField}
              placeholder="Describe the condition, usage history, and included accessories"
            />
          </div>

          {error ? <p role="alert" style={{ color: '#b42318', marginBottom: '12px' }}>{error}</p> : null}
          {message ? <p role="status" style={{ color: '#067647', marginBottom: '12px' }}>{message}</p> : null}

          <button
            className={`btn btn-primary publish-btn ${isPublishing ? 'opacity-50' : ''}`}
            onClick={handlePublish}
            disabled={isPublishing || isAnalyzing}
          >
            {isPublishing ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartUpload;

import React, { useState } from 'react';
import { Camera, ShieldCheck, TrendingUp } from 'lucide-react';
import { apiCreateProduct } from '../services/api';
import './SmartUpload.css';

const SmartUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPublishSuccess(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        // Just for mock submission if no real file is selected
        const mockBlob = new Blob(['mock content'], { type: 'image/jpeg' });
        formData.append('file', mockBlob, 'mock.jpg');
      }
      
      // Additional fields as required by the backend
      formData.append('title', 'Samsung Bespoke 4-Door French Door Refrigerator');
      formData.append('category', 'Refrigerators');
      formData.append('price', '850');
      formData.append('description', 'Lightly used Samsung Bespoke refrigerator...');
      
      await apiCreateProduct(formData);
      setPublishSuccess(true);
      alert('Listing published successfully!');
    } catch (err) {
      console.error('Failed to publish', err);
      alert('Error publishing listing. Are you logged in?');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="smart-upload-page container">
      <div className="page-header">
        <span className="badge badge-success" style={{ marginBottom: '16px' }}>
          <SparklesIcon /> HERO AI ENGINE
        </span>
        <h1 className="page-title">Smart Upload</h1>
        <p className="page-desc">
          Upload your appliance photo. Our AI will automatically identify the model, specs, and suggest the optimal price based on current market trends.
        </p>
      </div>

      <div className="upload-content">
        <div className="upload-visual">
          <div className="image-analysis-container">
            <img 
              src={previewUrl} 
              alt="Appliance Analysis" 
              className="analyzed-image"
            />
            {/* The bounding box */}
            <div className="bounding-box">
              <div className="bounding-box-header">
                <span>Refrigerator - 98% Confidence</span>
                <span className="box-coords">[x:245, y:180, w:450, h:600]</span>
              </div>
            </div>
            {/* The laser scan line */}
            <div className="scan-line"></div>
            
            <label className="retake-btn cursor-pointer" style={{ cursor: 'pointer' }}>
              <Camera size={16} /> Retake Photo
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            </label>
            
            <div className="status-badge">
              <span className="status-label text-success font-bold text-xs">STATUS</span>
              <span className="status-text font-bold">Analysis Complete</span>
            </div>
          </div>
          
          <div className="analysis-results-row">
            <div className="result-card">
              <div className="result-header">
                <ShieldCheck size={16} className="text-success" />
                <span className="text-success font-bold text-xs uppercase tracking-wide">Condition Grade</span>
              </div>
              <div className="result-value">Excellent (A+)</div>
            </div>
            <div className="result-card">
              <div className="result-header">
                <TrendingUp size={16} className="text-success" />
                <span className="text-success font-bold text-xs uppercase tracking-wide">Est. Market Value</span>
              </div>
              <div className="result-value">$850 - $920</div>
            </div>
          </div>
        </div>
        
        <div className="upload-form">
          <div className="form-header">
            <h3>Product Details</h3>
            <div className="toggle-container">
              <span className="text-xs">Correct AI suggestions?</span>
              <div className="toggle active"></div>
            </div>
          </div>
          
          <div className="form-group">
            <label>PRODUCT NAME</label>
            <input type="text" defaultValue="Samsung Bespoke 4-Door French Door Refrigerator" className="form-input bg-gray" />
          </div>
          
          <div className="form-group">
            <label>CATEGORY</label>
            <select className="form-select bg-gray">
              <option>Refrigerators</option>
            </select>
          </div>
          
          <div className="ai-specs-card">
            <h4 className="specs-title">AI EXTRACTED SPECS</h4>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">COLOR/FINISH</span>
                <span className="spec-value">Stainless Steel</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">CAPACITY</span>
                <span className="spec-value">29 cu. ft.</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">DIMENSIONS</span>
                <span className="spec-value">70" x 35.8" x 34.2"</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">ENERGY STAR</span>
                <span className="spec-value text-success">Certified</span>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>DESCRIPTION</label>
            <textarea className="form-textarea bg-gray" rows="4" defaultValue="Lightly used Samsung Bespoke refrigerator. Features FlexZone drawer and Dual Auto Ice Maker. No visible scratches on the stainless steel finish."></textarea>
          </div>
          
          <button 
            className={`btn btn-primary publish-btn ${isPublishing ? 'opacity-50' : ''}`}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publishing...' : publishSuccess ? 'Published!' : 'Publish Listing'}
          </button>
          
          <p className="transaction-id text-center text-xs text-muted mt-4 uppercase tracking-widest" style={{ fontSize: '9px' }}>
            Encrypted Transaction ID: H-SMART-99283-AIX
          </p>
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);

export default SmartUpload;

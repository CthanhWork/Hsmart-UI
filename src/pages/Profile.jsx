import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, KeyRound, Mail, Pencil, Save, X } from 'lucide-react';
import LocationFields from '../components/common/LocationFields';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiChangePassword,
  apiConfirmEmailChange,
  apiRequestEmailChange,
  apiUpdateProfile,
  apiUploadAvatar,
} from '../services/api';
import './Operations.css';

const MAX_AVATAR_SIZE_BYTES = 20 * 1024 * 1024;

const buildProfileForm = (user) => ({
  fullName: user?.fullName || '',
  phoneNumber: user?.phoneNumber || '',
  provinceCode: user?.provinceCode || '',
  districtCode: user?.districtCode || '',
  wardCode: user?.wardCode || '',
  streetDetail: user?.streetDetail || '',
});

const Profile = () => {
  const { user, refreshProfile } = useUser();
  const toast = useToast();
  const userForm = useMemo(() => buildProfileForm(user), [user]);

  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'password' | 'email'

  const [form, setForm] = useState(userForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [emailStep, setEmailStep] = useState('idle'); // 'idle' | 'otp'
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    if (!activeModal) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setActiveModal(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [activeModal]);

  const openProfileModal = () => {
    setForm(buildProfileForm(user));
    setError('');
    setActiveModal('profile');
  };

  const openPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setActiveModal('password');
  };

  const openEmailModal = () => {
    setEmailStep('idle');
    setNewEmail('');
    setOtp('');
    setEmailError('');
    setActiveModal('email');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp ảnh.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('Ảnh đại diện tối đa 20MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setAvatarUploading(true);
    try {
      await apiUploadAvatar(file);
      await refreshProfile();
      toast.success('Cập nhật ảnh đại diện thành công.');
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tải ảnh đại diện lên.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      await apiUpdateProfile(form);
      await refreshProfile();
      toast.success('Cập nhật hồ sơ thành công.');
      closeModal();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      await apiChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công.');
      closeModal();
    } catch (requestError) {
      setPasswordError(requestError.message || 'Không thể đổi mật khẩu.');
    } finally {
      setChangingPassword(false);
    }
  };

  const requestEmailChange = async (event) => {
    event.preventDefault();
    setEmailError('');
    setEmailBusy(true);
    try {
      await apiRequestEmailChange(newEmail.trim());
      toast.success('Đã gửi mã xác nhận tới email mới.');
      setEmailStep('otp');
      setOtp('');
    } catch (requestError) {
      setEmailError(requestError.message || 'Không thể gửi mã xác nhận.');
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmEmailChange = async (event) => {
    event.preventDefault();
    setEmailError('');
    setEmailBusy(true);
    try {
      await apiConfirmEmailChange(otp.trim());
      await refreshProfile();
      toast.success('Đổi email thành công.');
      closeModal();
    } catch (requestError) {
      setEmailError(requestError.message || 'Mã xác nhận không hợp lệ.');
    } finally {
      setEmailBusy(false);
    }
  };

  const locationText = [user?.district, user?.province].filter(Boolean).join(', ') || '—';

  const modalTitle = activeModal === 'profile'
    ? 'Chỉnh sửa hồ sơ'
    : activeModal === 'password'
      ? 'Đổi mật khẩu'
      : 'Đổi địa chỉ email';

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header">
        <div>
          <h1>Tài khoản của tôi</h1>
        </div>
      </header>

      <section className="surface acc-overview">
        <div className="acc-identity">
          <div className="account-avatar-wrap">
            {user?.avatarUrl ? (
              <img className="account-avatar-img" src={user.avatarUrl} alt="Ảnh đại diện" />
            ) : (
              <div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div>
            )}
            <button
              type="button"
              className="account-avatar-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              <Camera size={13} />
              {avatarUploading ? 'Đang tải...' : 'Đổi ảnh'}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarSelect} />
          </div>

          <div className="acc-identity-text">
            <strong>{user?.fullName || user?.username}</strong>
            <span translate="no">@{user?.username}</span>
          </div>

          <span className="role-badge">{user?.role}</span>
        </div>

        <dl className="acc-info-list">
          <div>
            <dt>Email</dt>
            <dd>{user?.email || '—'}</dd>
          </div>
          <div>
            <dt>Họ và tên</dt>
            <dd>{user?.fullName || '—'}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{user?.phoneNumber || '—'}</dd>
          </div>
          <div>
            <dt>Khu vực</dt>
            <dd>{locationText}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{user?.streetDetail || '—'}</dd>
          </div>
          <div>
            <dt>Độ tin cậy</dt>
            <dd>{Number(user?.trustScore || 0).toFixed(1)} · {user?.reviewCount || 0} đánh giá</dd>
          </div>
        </dl>

        <div className="acc-actions">
          <button type="button" className="btn btn-primary" onClick={openProfileModal}>
            <Pencil size={15} /> Sửa hồ sơ
          </button>
          <button type="button" className="btn btn-secondary" onClick={openPasswordModal}>
            <KeyRound size={15} /> Đổi mật khẩu
          </button>
          <button type="button" className="btn btn-secondary" onClick={openEmailModal}>
            <Mail size={15} /> Đổi email
          </button>
        </div>
      </section>

      {activeModal ? (
        <div className="acc-modal-overlay" onClick={closeModal}>
          <div
            className="acc-modal"
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="acc-modal-head">
              <h2>{modalTitle}</h2>
              <button type="button" className="acc-modal-close" onClick={closeModal} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="acc-modal-body">
              {activeModal === 'profile' ? (
                <form className="form-grid" onSubmit={save}>
                  <label>
                    Họ và tên
                    <input name="fullName" value={form.fullName} onChange={handleChange} />
                  </label>

                  <label>
                    Số điện thoại
                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
                  </label>

                  <LocationFields formData={form} setFormData={setForm} prefix="profile" />

                  <label className="full-field">
                    Địa chỉ chi tiết
                    <input
                      name="streetDetail"
                      value={form.streetDetail}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường, tòa nhà..."
                    />
                  </label>

                  {error ? <div className="feedback feedback-error">{error}</div> : null}

                  <div className="form-actions account-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                      Hủy
                    </button>
                    <button className="btn btn-primary" disabled={saving}>
                      <Save size={16} />
                      {saving ? ' Đang lưu...' : ' Lưu hồ sơ'}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeModal === 'password' ? (
                <form className="form-stack" onSubmit={changePassword}>
                  <label>
                    Mật khẩu hiện tại
                    <input
                      type="password"
                      name="currentPassword"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </label>

                  <label>
                    Mật khẩu mới
                    <input
                      type="password"
                      name="newPassword"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                    />
                  </label>

                  <label>
                    Xác nhận mật khẩu mới
                    <input
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </label>

                  {passwordError ? <div className="feedback feedback-error">{passwordError}</div> : null}

                  <div className="form-actions account-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={changingPassword}>
                      Hủy
                    </button>
                    <button className="btn btn-primary" disabled={changingPassword}>
                      {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeModal === 'email' ? (
                <>
                  <p className="account-current-email">
                    Email hiện tại: <strong>{user?.email}</strong>
                  </p>

                  {emailStep === 'idle' ? (
                    <form className="form-stack" onSubmit={requestEmailChange}>
                      <label>
                        Email mới
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(event) => setNewEmail(event.target.value)}
                          placeholder="email-moi@example.com"
                          required
                        />
                      </label>

                      {emailError ? <div className="feedback feedback-error">{emailError}</div> : null}

                      <div className="form-actions account-form-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={emailBusy}>
                          Hủy
                        </button>
                        <button className="btn btn-primary" disabled={emailBusy}>
                          {emailBusy ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="form-stack" onSubmit={confirmEmailChange}>
                      <p className="account-otp-hint">
                        Mã xác nhận đã được gửi tới <strong>{newEmail}</strong>. Nhập mã để hoàn tất đổi email.
                      </p>

                      <label>
                        Mã xác nhận (OTP)
                        <input
                          value={otp}
                          onChange={(event) => setOtp(event.target.value)}
                          placeholder="Nhập mã từ email"
                          autoComplete="one-time-code"
                          required
                        />
                      </label>

                      {emailError ? <div className="feedback feedback-error">{emailError}</div> : null}

                      <div className="form-actions account-form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setEmailStep('idle')} disabled={emailBusy}>
                          Quay lại
                        </button>
                        <button className="btn btn-primary" disabled={emailBusy}>
                          {emailBusy ? 'Đang xác nhận...' : 'Xác nhận đổi email'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;

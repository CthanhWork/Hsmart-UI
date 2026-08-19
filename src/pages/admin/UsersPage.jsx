import { useEffect, useState } from 'react';
import { Download, Search, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import BooleanBadge from '../../components/admin/BooleanBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import PreviewDrawer from '../../components/admin/PreviewDrawer';
import UserPreview from '../../components/admin/UserPreview';
import {
  apiBanUser,
  apiFetchAdminUserById,
  apiFetchAdminUsers,
  apiUnbanUser,
} from '../../services/api';
import { emptyPage, formatRole, formatTrustScore } from './format';
import { downloadCsv } from './analytics';

const UsersPage = () => {
  const toast = useToast();
  const [usersPage, setUsersPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [pageNo, setPageNo] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const nextPage = await apiFetchAdminUsers({
        search: search || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page: pageNo,
        size: usersPage.pageSize || 10,
      });
      setUsersPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeFilter, pageNo]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPageNo(0);
    setSearch(searchDraft.trim());
  };

  const openPreview = async (user) => {
    setDrawerOpen(true);
    setPreviewLoading(true);
    setPreviewUser(null);
    try {
      setPreviewUser(await apiFetchAdminUserById(user.id));
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tải chi tiết người dùng.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const askToggleBan = (user) => {
    setConfirm({
      user,
      title: user.active ? 'Khóa tài khoản này?' : 'Mở lại tài khoản này?',
      message: user.active
        ? `Tài khoản @${user.username} sẽ bị khóa và người dùng sẽ không thể hoạt động bình thường.`
        : `Tài khoản @${user.username} sẽ được mở lại trạng thái hoạt động.`,
      confirmLabel: user.active ? 'Khóa tài khoản' : 'Mở lại tài khoản',
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { user } = confirm;
    setPending(true);
    try {
      await (user.active ? apiBanUser(user.username) : apiUnbanUser(user.username));
      toast.success(user.active
        ? `Đã khóa người dùng @${user.username}.`
        : `Đã mở lại người dùng @${user.username}.`);
      setConfirm(null);
      await loadUsers();
      if (drawerOpen && previewUser?.id === user.id) {
        await openPreview(user);
      }
    } catch (requestError) {
      toast.error(requestError.message || 'Thao tác không thành công.');
    } finally {
      setPending(false);
    }
  };

  const exportCsv = () => {
    const rows = (usersPage.content || []).map((user) => [
      user.id,
      user.username,
      user.fullName,
      user.email,
      formatRole(user.role),
      user.active ? 'Active' : 'Banned',
      user.emailVerified ? 'Verified' : 'Unverified',
      formatTrustScore(user.trustScore),
      user.reviewCount || 0,
    ]);
    downloadCsv(
      'nguoi-dung.csv',
      ['ID', 'Username', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Xác thực mail', 'Trust', 'Số review'],
      rows,
    );
  };

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (user) => (
        <div className="adm-stack-cell">
          <strong>{user.fullName || user.username || 'Người dùng chưa đặt tên'}</strong>
          <small translate="no">#{user.id} · @{user.username}</small>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email || '—',
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (user) => formatRole(user.role),
    },
    {
      key: 'active',
      header: 'Hoạt động',
      render: (user) => (
        <BooleanBadge value={Boolean(user.active)} trueLabel="Active" falseLabel="Banned" />
      ),
    },
    {
      key: 'verified',
      header: 'Xác thực mail',
      render: (user) => (
        <BooleanBadge value={Boolean(user.emailVerified)} trueLabel="Verified" falseLabel="Unverified" />
      ),
    },
    {
      key: 'trust',
      header: 'Trust',
      render: (user) => `${formatTrustScore(user.trustScore)} · ${user.reviewCount || 0} review`,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (user) => (
        <button
          type="button"
          className={user.active ? 'adm-text-action reject' : 'adm-text-action approve'}
          onClick={(event) => {
            event.stopPropagation();
            askToggleBan(user);
          }}
        >
          {user.active ? 'Ban' : 'Unban'}
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý tài khoản"
        title="Người dùng trên sàn"
        description="Tìm kiếm, lọc trạng thái hoạt động và ban/unban đúng theo username backend yêu cầu."
        onRefresh={loadUsers}
        refreshing={loading}
      >
        <form className="adm-filter-form" onSubmit={submitSearch}>
          <label className="adm-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              name="userSearch"
              autoComplete="off"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm username, email, họ tên…"
            />
          </label>

          <select
            className="adm-select"
            name="userActiveFilter"
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setPageNo(0);
            }}
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Bị khóa</option>
          </select>

          <button type="submit" className="adm-btn adm-btn-primary">Tìm</button>
        </form>
        <button
          type="button"
          className="adm-export-btn"
          onClick={exportCsv}
          disabled={!usersPage.content?.length}
        >
          <Download size={16} aria-hidden="true" /> CSV
        </button>
      </AdminPageHeader>

      <AdminDataTable
        columns={columns}
        rows={usersPage.content}
        loading={loading}
        error={error}
        emptyIcon={Users}
        emptyTitle="Không có người dùng phù hợp với bộ lọc hiện tại."
        onRowClick={openPreview}
        rowAriaLabel={(user) => `Xem chi tiết người dùng ${user.fullName || user.username}`}
        footer={<Pagination page={usersPage} onChange={setPageNo} />}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        pending={pending}
        onConfirm={handleConfirm}
        onClose={() => !pending && setConfirm(null)}
      />

      <PreviewDrawer
        open={drawerOpen}
        kicker="Chi tiết người dùng"
        title={previewUser?.fullName || previewUser?.username || 'Chi tiết người dùng'}
        loading={previewLoading}
        onClose={() => setDrawerOpen(false)}
      >
        {!previewLoading && previewUser ? <UserPreview user={previewUser} /> : null}
      </PreviewDrawer>
    </>
  );
};

export default UsersPage;

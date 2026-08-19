import { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ListChecks,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import MetricCard from '../../components/admin/MetricCard';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import { apiFetchSystemAccount, apiFetchSystemLedger } from '../../services/api';
import { emptyPage, formatDateTime, formatMoney } from './format';
import { downloadCsv } from './analytics';

const ENTRY_TYPE_LABELS = {
  PLATFORM_FEE_IN: 'Thu phí nền tảng',
};

const entryTypeLabel = (type) => ENTRY_TYPE_LABELS[type]
  || (type ? String(type).replaceAll('_', ' ') : '—');

const SystemAccountPage = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState(emptyPage);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [error, setError] = useState('');
  const [pageNo, setPageNo] = useState(0);

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      setSummary(await apiFetchSystemAccount());
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tải tài khoản hệ thống.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadLedger = async () => {
    setLoadingLedger(true);
    setError('');
    try {
      setLedger(await apiFetchSystemLedger({ page: pageNo, size: ledger.pageSize || 20 }));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải sổ giao dịch.');
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo]);

  const refresh = () => {
    loadSummary();
    loadLedger();
  };

  const exportCsv = () => {
    const rows = (ledger.content || []).map((entry) => [
      entry.id,
      entryTypeLabel(entry.entryType),
      entry.direction === 'CREDIT' ? 'Cộng' : 'Trừ',
      entry.amount,
      entry.balanceAfter,
      entry.referenceType ? `${entry.referenceType} #${entry.referenceId}` : '',
      formatDateTime(entry.createdAt),
    ]);
    downloadCsv(
      'so-giao-dich.csv',
      ['ID', 'Bút toán', 'Loại', 'Số tiền', 'Số dư sau', 'Nguồn', 'Thời điểm'],
      rows,
    );
  };

  const metrics = [
    {
      label: 'Số dư ví hệ thống',
      value: loadingSummary ? '…' : (summary ? formatMoney(summary.balance) : '—'),
      caption: 'Số dư hiện tại của tài khoản hệ thống',
      icon: Wallet,
      tone: 'violet',
    },
    {
      label: 'Tổng đã thu',
      value: loadingSummary ? '…' : (summary ? formatMoney(summary.totalCredited) : '—'),
      caption: 'Tổng doanh thu phí nền tảng',
      icon: TrendingUp,
      tone: 'green',
    },
    {
      label: 'Tổng đã chi',
      value: loadingSummary ? '…' : (summary ? formatMoney(summary.totalDebited) : '—'),
      caption: 'Rút / điều chỉnh khỏi ví hệ thống',
      icon: TrendingDown,
      tone: 'red',
    },
    {
      label: 'Số bút toán',
      value: loadingSummary ? '…' : (summary?.entryCount ?? '—'),
      caption: 'Số dòng giao dịch trong sổ',
      icon: ListChecks,
      tone: 'blue',
    },
  ];

  const columns = [
    {
      key: 'entry',
      header: 'Bút toán',
      render: (entry) => (
        <div className="adm-stack-cell">
          <strong>{entryTypeLabel(entry.entryType)}</strong>
          <small>{entry.description || '—'}</small>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Loại',
      render: (entry) => {
        const isCredit = entry.direction === 'CREDIT';
        const Icon = isCredit ? ArrowUpRight : ArrowDownLeft;
        return (
          <span className={`status-badge status-${isCredit ? 'success' : 'danger'}`}>
            <Icon size={13} aria-hidden="true" />
            {isCredit ? 'Cộng' : 'Trừ'}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (entry) => {
        const isCredit = entry.direction === 'CREDIT';
        return (
          <strong className={isCredit ? 'tone-green' : 'tone-red'}>
            {isCredit ? '+' : '−'}{formatMoney(entry.amount)}
          </strong>
        );
      },
    },
    {
      key: 'balanceAfter',
      header: 'Số dư sau',
      render: (entry) => formatMoney(entry.balanceAfter),
    },
    {
      key: 'reference',
      header: 'Nguồn',
      render: (entry) => (entry.referenceType
        ? <span translate="no">{entry.referenceType} #{entry.referenceId}</span>
        : '—'),
    },
    {
      key: 'createdAt',
      header: 'Thời điểm',
      render: (entry) => formatDateTime(entry.createdAt),
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Tài chính"
        title="Tài khoản hệ thống"
        description="Số dư ví hệ thống, tổng doanh thu phí nền tảng và sổ giao dịch cộng/trừ."
        onRefresh={refresh}
        refreshing={loadingSummary || loadingLedger}
      >
        <button
          type="button"
          className="adm-export-btn"
          onClick={exportCsv}
          disabled={!ledger.content?.length}
        >
          <Download size={16} aria-hidden="true" /> CSV
        </button>
      </AdminPageHeader>

      <section className="adm-metrics" aria-label="Chỉ số tài khoản hệ thống">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <AdminDataTable
        columns={columns}
        rows={ledger.content}
        loading={loadingLedger}
        error={error}
        getRowKey={(entry) => entry.id}
        emptyIcon={Wallet}
        emptyTitle="Chưa có giao dịch nào trong sổ ví hệ thống."
        footer={<Pagination page={ledger} onChange={setPageNo} />}
      />
    </>
  );
};

export default SystemAccountPage;

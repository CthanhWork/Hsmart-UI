/* Client-side aggregation helpers that turn the existing admin list endpoints
   (ledger entries, orders) into chartable series. No dedicated analytics API
   exists yet, so every series here is derived from real records fetched from
   the backend. */

const pad2 = (n) => String(n).padStart(2, '0');
const WEEK_WINDOW = 12;

const cloneDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => {
  const d = cloneDate(date);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  if (!d) return null;
  const day = d.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + delta);
  return d;
};

const addDays = (date, days) => {
  const d = cloneDate(date);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return d;
};

const dateKey = (date) => {
  const d = cloneDate(date);
  if (!d) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const formatShortDate = (date) => {
  const d = cloneDate(date);
  if (!d) return '';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
};

const formatWeekRange = (start) => {
  const weekStart = cloneDate(start);
  if (!weekStart) return '';
  const weekEnd = addDays(weekStart, 6);
  return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
};

const bucketOf = (date, granularity) => {
  const d = cloneDate(date);
  if (!d) return null;
  if (granularity === 'day') {
    return {
      key: dateKey(d),
      label: formatShortDate(d),
      range: formatShortDate(d),
    };
  }
  if (granularity === 'week') {
    const weekStart = startOfWeek(d);
    return {
      key: dateKey(weekStart),
      label: formatShortDate(weekStart),
      range: formatWeekRange(weekStart),
      start: weekStart,
    };
  }
  if (granularity === 'year') {
    return {
      key: `${d.getFullYear()}`,
      label: `${d.getFullYear()}`,
      range: `${d.getFullYear()}`,
    };
  }
  return {
    key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
    label: `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
    range: `${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
  };
};

const buildWeeklySlots = (entries, size = WEEK_WINDOW) => {
  const latestDate = entries.reduce((latest, entry) => {
    const when = cloneDate(entry?.createdAt || entry?.updatedAt);
    if (!when) return latest;
    return !latest || when > latest ? when : latest;
  }, null);

  const anchor = startOfWeek(latestDate || new Date()) || new Date();
  const slots = [];

  for (let index = size - 1; index >= 0; index -= 1) {
    const start = addDays(anchor, index * -7);
    const end = addDays(start, 6);
    slots.push({
      key: dateKey(start),
      label: formatShortDate(start),
      range: formatWeekRange(start),
      start,
      end,
      fee: 0,
      debit: 0,
      balance: 0,
      orders: 0,
      revenue: 0,
    });
  }

  return slots;
};

const hydrateWeeklyBalance = (slots) => {
  let runningBalance = 0;
  let hasSeenActivity = false;

  return slots.map((slot) => {
    const hasActivity = slot.fee > 0 || slot.debit > 0 || slot.orders > 0 || slot.revenue > 0;

    if (hasActivity && slot.balance > 0) {
      runningBalance = slot.balance;
      hasSeenActivity = true;
    } else if (hasActivity) {
      runningBalance += slot.fee - slot.debit;
      slot.balance = runningBalance;
      hasSeenActivity = true;
    } else if (hasSeenActivity) {
      slot.balance = runningBalance;
    } else {
      slot.balance = 0;
    }

    return slot;
  });
};

const hasMeaningfulWeeklyData = (slots) => slots.some((slot) =>
  slot.fee > 0 || slot.debit > 0 || slot.balance > 0 || slot.orders > 0 || slot.revenue > 0,
);

const emptyLedgerSeries = (granularity) => {
  const labelMap = {
    day: 'Hôm nay',
    week: '12 tuần gần nhất',
    month: 'Tháng này',
    year: 'Năm nay',
  };
  const label = labelMap[granularity] || labelMap.month;
  return [
    { label, fee: 0, debit: 0, balance: 0 },
    { label: 'Hiện tại', fee: 0, debit: 0, balance: 0 },
  ];
};

/* Ledger -> time series of platform-fee income and running balance. */
export const aggregateLedger = (entries = [], granularity = 'month') => {
  const sorted = [...entries]
    .filter((entry) => entry?.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (granularity === 'week') {
    const slots = buildWeeklySlots(sorted);
    const slotMap = new Map(slots.map((slot) => [slot.key, slot]));

    for (const entry of sorted) {
      const bucket = bucketOf(entry.createdAt, 'week');
      if (!bucket) continue;
      const current = slotMap.get(bucket.key);
      if (!current) continue;

      const amount = Number(entry.amount) || 0;
      const isCredit = entry.direction === 'CREDIT';

      if (isCredit) current.fee += amount;
      else current.debit += amount;

      if (entry.balanceAfter != null) current.balance = Number(entry.balanceAfter) || current.balance;
      current.label = bucket.label;
      current.range = bucket.range;
    }

    const hydrated = hydrateWeeklyBalance(slots);
    if (!hasMeaningfulWeeklyData(hydrated)) {
      return emptyLedgerSeries(granularity);
    }
    return hydrated;
  }

  const buckets = new Map();
  for (const entry of sorted) {
    const bucket = bucketOf(entry.createdAt, granularity);
    if (!bucket) continue;
    const amount = Number(entry.amount) || 0;
    const isCredit = entry.direction === 'CREDIT';
    const current = buckets.get(bucket.key) || {
      label: bucket.label,
      range: bucket.range,
      fee: 0,
      debit: 0,
      balance: 0,
    };
    if (isCredit) current.fee += amount;
    else current.debit += amount;
    if (entry.balanceAfter != null) current.balance = Number(entry.balanceAfter) || current.balance;
    buckets.set(bucket.key, current);
  }

  if (buckets.size === 0) {
    return emptyLedgerSeries(granularity);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, value]) => value);
};

/* Orders -> weekly counts + completed revenue. */
export const aggregateOrdersByWeek = (orders = []) => {
  const sorted = [...orders]
    .filter((order) => order?.createdAt || order?.updatedAt)
    .sort((a, b) => new Date(a.createdAt || a.updatedAt) - new Date(b.createdAt || b.updatedAt));

  if (sorted.length === 0) {
    return [];
  }

  const slots = buildWeeklySlots(sorted);
  const slotMap = new Map(slots.map((slot) => [slot.key, slot]));

  for (const order of sorted) {
    const when = order?.updatedAt || order?.createdAt;
    const bucket = bucketOf(when, 'week');
    if (!bucket) continue;

    const current = slotMap.get(bucket.key);
    if (!current) continue;

    current.orders += 1;
    if (String(order.status) === 'COMPLETED') current.revenue += Number(order.amount) || 0;
    current.label = bucket.label;
    current.range = bucket.range;
  }

  return hydrateWeeklyBalance(slots).filter((slot) => slot.orders > 0 || slot.revenue > 0);
};

/* Orders -> monthly counts + completed revenue. */
export const aggregateOrdersByMonth = (orders = []) => {
  const buckets = new Map();
  for (const order of orders) {
    const when = order?.updatedAt || order?.createdAt;
    const bucket = bucketOf(when, 'month');
    if (!bucket) continue;
    const current = buckets.get(bucket.key) || { label: bucket.label, orders: 0, revenue: 0 };
    current.orders += 1;
    if (String(order.status) === 'COMPLETED') current.revenue += Number(order.amount) || 0;
    buckets.set(bucket.key, current);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, value]) => value);
};

export const ORDER_STATUSES = [
  { key: 'PENDING', label: 'Chờ xử lý', color: '#f9b115' },
  { key: 'PROCESSING', label: 'Đang xử lý', color: '#3399ff' },
  { key: 'COMPLETED', label: 'Hoàn tất', color: '#2eb85c' },
  { key: 'CANCELLED', label: 'Đã hủy', color: '#e55353' },
  { key: 'RETURN_REQUESTED', label: 'Yêu cầu trả', color: '#321fdb' },
  { key: 'RETURNED', label: 'Đã trả', color: '#768192' },
];

/* --- CSV export --------------------------------------------------------- */
const escapeCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const downloadCsv = (filename, headers, rows) => {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) lines.push(row.map(escapeCell).join(','));
  const bom = String.fromCharCode(0xFEFF);
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

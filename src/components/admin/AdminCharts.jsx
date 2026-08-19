import { useMemo } from 'react';
import ReactEChartsCoreModule from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  AxisPointerComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { formatMoney } from '../../pages/admin/format';

const ReactEChartsCore = ReactEChartsCoreModule?.default || ReactEChartsCoreModule;

echarts.use([
  AxisPointerComponent,
  BarChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
]);

const COLORS = {
  primary: '#4f46e5',
  blue: '#3b82f6',
  green: '#10b981',
};

const compactMoney = (value) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')} ty`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')} tr`;
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(v);
};

const axisLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 600,
};

const splitLine = {
  lineStyle: {
    color: 'rgba(148, 163, 184, 0.18)',
    type: 'dashed',
  },
};

const grid = {
  left: 10,
  right: 18,
  top: 20,
  bottom: 18,
  containLabel: true,
};

const defaultTooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderWidth: 0,
  textStyle: {
    color: '#f8fafc',
    fontSize: 12,
  },
  axisPointer: {
    type: 'line',
    lineStyle: {
      color: 'rgba(255, 255, 255, 0.25)',
      width: 1,
    },
  },
};

const EMPTY = <div className="adm-chart-empty">Chua co du lieu de ve bieu do.</div>;

const getAxisLabel = (point) => point?.data?.range || point?.axisValueLabel || '';
const getAxisLabelTitle = (point) => point?.axisValueLabel || point?.data?.label || '';

const ChartShell = ({ option, height, className = '' }) => (
  <div className={`adm-echart-shell ${className}`.trim()} style={{ height }}>
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width: '100%', height: '100%' }}
      notMerge
      lazyUpdate
      opts={{ renderer: 'canvas' }}
    />
  </div>
);

export const FeeAreaChart = ({ data, height = 300 }) => {
  const hasData = Boolean(data?.length);
  const option = useMemo(() => {
    if (!hasData) return null;
    return {
      backgroundColor: 'transparent',
      grid,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!point) return '';
          return `
            <div style="min-width:160px">
              <div style="font-weight:700;margin-bottom:6px">${getAxisLabelTitle(point)}</div>
              <div style="color:rgba(248,250,252,.72);font-size:11px;margin-bottom:8px">${getAxisLabel(point)}</div>
              <div style="display:flex;justify-content:space-between;gap:16px">
                <span>Phi thu</span>
                <strong>${formatMoney(point.value)}</strong>
              </div>
            </div>
          `;
        },
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: data.map((item) => item.label),
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.28)' } },
        axisTick: { show: false },
        axisLabel: { ...axisLabel, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          ...axisLabel,
          formatter: compactMoney,
        },
        splitLine,
      },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          barMaxWidth: 22,
          data: data.map((item) => Number(item.fee) || 0),
          label: {
            show: false,
            position: 'top',
            color: '#334155',
            fontWeight: 700,
            fontSize: 11,
            formatter: ({ value }) => compactMoney(value),
          },
          itemStyle: { borderRadius: [10, 10, 4, 4], color: 'rgba(79, 70, 229, 0.92)' },
        },
      ],
    };
  }, [data, hasData]);

  if (!hasData) return EMPTY;
  return <ChartShell option={option} height={height} />;
};

export const BalanceLineChart = ({ data, height = 260 }) => {
  const hasData = Boolean(data?.length);
  const option = useMemo(() => {
    if (!hasData) return null;
    return {
      backgroundColor: 'transparent',
      grid,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!point) return '';
          return `
            <div style="min-width:160px">
              <div style="font-weight:700;margin-bottom:6px">${getAxisLabelTitle(point)}</div>
              <div style="color:rgba(248,250,252,.72);font-size:11px;margin-bottom:8px">${getAxisLabel(point)}</div>
              <div style="display:flex;justify-content:space-between;gap:16px">
                <span>So du</span>
                <strong>${formatMoney(point.value)}</strong>
              </div>
            </div>
          `;
        },
      },
      legend: { show: false },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: data.map((item) => item.label),
        axisLabel: { ...axisLabel, hideOverlap: true },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.28)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          ...axisLabel,
          formatter: compactMoney,
        },
        splitLine,
      },
      series: [
        {
          type: 'line',
          step: 'middle',
          showSymbol: true,
          symbolSize: 7,
          data: data.map((item) => Number(item.balance) || 0),
          lineStyle: {
            color: COLORS.green,
            width: 3,
          },
          itemStyle: { color: COLORS.green },
          emphasis: { focus: 'series' },
          areaStyle: { color: 'rgba(16, 185, 129, 0.10)' },
        },
      ],
    };
  }, [data, hasData]);

  if (!hasData) return EMPTY;
  return <ChartShell option={option} height={height} />;
};

export const OrdersDonut = ({ data, height = 260 }) => {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const hasData = total > 0;
  const option = useMemo(() => {
    if (!hasData) return null;
    return {
      backgroundColor: 'transparent',
      color: data.map((item) => item.color),
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!point) return '';
          const ratio = total ? ((Number(point.value) || 0) / total) * 100 : 0;
          return `
          <div style="min-width:160px">
            <div style="font-weight:700;margin-bottom:6px">${point.axisValueLabel}</div>
            <div style="display:flex;justify-content:space-between;gap:16px">
              <span>So don</span>
              <strong>${Number(point.value) || 0} (${ratio.toFixed(0)}%)</strong>
            </div>
          </div>
        `;
        },
      },
      legend: { show: false },
      title: {
        text: String(total),
        subtext: 'don',
        left: 'right',
        top: 0,
        textAlign: 'right',
        itemGap: 2,
        textStyle: {
          color: '#0f172a',
          fontSize: 22,
          fontWeight: 800,
        },
        subtextStyle: {
          color: '#64748b',
          fontSize: 12,
          fontWeight: 600,
        },
      },
      grid: {
        left: 16,
        right: 16,
        top: 12,
        bottom: 12,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        show: false,
      },
      yAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: {
          color: '#334155',
          fontSize: 12,
          fontWeight: 600,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Don hang',
          type: 'bar',
          data: data.map((item) => Number(item.value) || 0),
          barWidth: 18,
          itemStyle: {
            borderRadius: [0, 999, 999, 0],
          },
          label: {
            show: true,
            position: 'right',
            color: '#0f172a',
            fontSize: 12,
            fontWeight: 700,
            formatter: ({ value }) => `${value}`,
          },
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(148, 163, 184, 0.10)',
            borderRadius: 999,
          },
          data: data.map((item) => ({
            value: Number(item.value) || 0,
            itemStyle: { color: item.color },
          })),
        },
      ],
    };
  }, [data, hasData, total]);

  if (!hasData) return EMPTY;
  return <ChartShell option={option} height={height} />;
};

export const OrdersWeeklyChart = ({ data, height = 320 }) => {
  const hasData = Boolean(data?.length);
  const option = useMemo(() => {
    if (!hasData) return null;
    return {
      backgroundColor: 'transparent',
      grid,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          const week = params?.[0]?.axisValueLabel || '';
          const ordersPoint = params.find((item) => item.seriesName === 'Số đơn') || params[0];
          const revenuePoint = params.find((item) => item.seriesName === 'Doanh thu') || params[1];
          return `
            <div style="min-width:180px">
              <div style="font-weight:700;margin-bottom:6px">${week}</div>
              <div style="color:rgba(248,250,252,.72);font-size:11px;margin-bottom:8px">${getAxisLabel(params?.[0])}</div>
              <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px">
                <span>Số đơn</span>
                <strong>${ordersPoint ? ordersPoint.value : 0}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px">
                <span>Doanh thu</span>
                <strong>${formatMoney(revenuePoint ? revenuePoint.value : 0)}</strong>
              </div>
            </div>
          `;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
          fontWeight: 600,
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.label),
        axisLabel: { ...axisLabel, hideOverlap: true },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.28)' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Don',
          nameTextStyle: {
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
          },
          axisLabel: {
            ...axisLabel,
            formatter: compactMoney,
          },
          splitLine,
        },
        {
          type: 'value',
          name: 'VND',
          nameTextStyle: {
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
          },
          axisLabel: {
            ...axisLabel,
            formatter: compactMoney,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Số đơn',
          type: 'bar',
          yAxisIndex: 0,
          data: data.map((item) => Number(item.orders) || 0),
          barWidth: 16,
          barMaxWidth: 20,
          itemStyle: {
            borderRadius: [10, 10, 4, 4],
            color: 'rgba(59, 130, 246, 0.82)',
          },
        },
        {
          name: 'Doanh thu',
          type: 'bar',
          yAxisIndex: 1,
          barWidth: 18,
          data: data.map((item) => Number(item.revenue) || 0),
          itemStyle: {
            borderRadius: [10, 10, 4, 4],
            color: 'rgba(79, 70, 229, 0.88)',
          },
          label: {
            show: false,
            position: 'top',
            color: '#334155',
            fontSize: 11,
            fontWeight: 700,
            formatter: ({ value }) => compactMoney(value),
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: {
            width: 3,
            color: 'rgba(79, 70, 229, 0.92)',
          },
          areaStyle: {
            color: 'rgba(79, 70, 229, 0.10)',
          },
        },
      ],
    };
  }, [data, hasData]);

  if (!hasData) return EMPTY;
  return <ChartShell option={option} height={height} />;
};

export const OrdersMonthlyChart = OrdersWeeklyChart;

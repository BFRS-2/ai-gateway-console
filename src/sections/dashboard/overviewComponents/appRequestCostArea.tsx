import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';
import { Chart, useChart } from 'src/components/chart';
import { format } from 'path';
import { form } from 'src/theme/core/components/form';

type Point = { x: string; req: number; cost: number };

type Props = CardProps & {
  title?: string;
  subheader?: string;
  data: Point[]; // [{ x: 'Mon', req: 5200, cost: 38000 }, ...]
  options?: ChartOptions;
  series :  { name:string, type: string , data: number[] }[]
};

export function AppRequestsCostArea({ title, subheader, data, options, series, ...other }: Props) {
  const theme = useTheme();

  const categories = data.map((d) => d.x);


  const chartOptions = useChart({
    chart: { stacked: false, toolbar: { show: false } },
    colors: [theme.palette.info.main, theme.palette.warning.main],
    xaxis: { categories, labels: { style: { colors: theme.palette.text.secondary } } },
    yaxis: [
      {
        title: { text: 'Requests' },
        labels: { formatter: (v: number) => fNumber(v) },
      },
      {
        opposite: true,
        title: { text: 'Cost ($)' },
        labels: { formatter: (v: number) => fNumber(v) },
      },
    ],
    stroke: { width: [2, 2], curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.25, opacityTo: 0, stops: [0, 90] },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        { formatter: (v: number) => fNumber(v) },
        { formatter: (v: number) => `$${fNumber(v)}` },
      ],
    },
    legend: { position: 'top' },
    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Chart type="area" series={series} options={chartOptions} height={340} />
    </Card>
  );
}

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

const createCanvas = (width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
};

export function renderPieChart(data: ChartDatum[], opts: { width?: number; height?: number } = {}): string {
  const width = opts.width ?? 480;
  const height = opts.height ?? 320;
  const { canvas, ctx } = createCanvas(width, height);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = width * 0.35;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;

  let startAngle = -Math.PI / 2;
  data.forEach(d => {
    const slice = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    startAngle += slice;
  });

  const legendX = width * 0.68;
  let legendY = height / 2 - (data.length * 24) / 2;
  ctx.font = '13px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  data.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = '#1F2937';
    ctx.fillText(`${d.label} (${d.value})`, legendX + 18, legendY);
    legendY += 24;
  });

  return canvas.toDataURL('image/png');
}

export function renderBarChart(data: ChartDatum[], opts: { width?: number; height?: number } = {}): string {
  const width = opts.width ?? 480;
  const height = opts.height ?? 320;
  const { canvas, ctx } = createCanvas(width, height);

  const paddingLeft = 40;
  const paddingBottom = 70;
  const paddingTop = 20;
  const chartWidth = width - paddingLeft - 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const maxValue = Math.max(1, ...data.map(d => d.value));
  const barWidth = data.length > 0 ? chartWidth / data.length : chartWidth;

  ctx.strokeStyle = '#D1D5DB';
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, height - paddingBottom);
  ctx.lineTo(width - 20, height - paddingBottom);
  ctx.stroke();

  ctx.font = '11px Arial';
  data.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = paddingLeft + i * barWidth + barWidth * 0.15;
    const y = height - paddingBottom - barHeight;
    const w = barWidth * 0.7;

    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, w, barHeight);

    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.fillText(String(d.value), x + w / 2, y - 6);

    const label = d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label;
    ctx.save();
    ctx.translate(x + w / 2, height - paddingBottom + 14);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'right';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

import {Vector2D} from '../common/lib/vector2d.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
// 坐标翻转到左下角
ctx.translate(0, canvas.height);
ctx.scale(1, -1);
ctx.lineCap = 'round';
// ctx，起始向量，树枝长度，树枝粗细，方向，随机偏向因子
function drawBranch(context, v0, length, thickness, dir, bias) {
  const v = new Vector2D().rotate(dir).scale(length);
  const v1 = v0.copy().add(v);

  context.lineWidth = thickness;
  context.beginPath();
  context.moveTo(...v0);
  context.lineTo(...v1);
  context.stroke();
  // 每个树枝分叉成左右两个树枝
  if(thickness > 2) {
    const left = Math.PI / 4 + 0.5 * (dir + 0.2) + bias * (Math.random() - 0.5);
    drawBranch(context, v1, length * 0.9, thickness * 0.8, left, bias * 0.9);
    const right = Math.PI / 4 + 0.5 * (dir - 0.2) + bias * (Math.random() - 0.5);
    drawBranch(context, v1, length * 0.9, thickness * 0.8, right, bias * 0.9);
  }
  // 绘制花朵
  if(thickness < 5 && Math.random() < 0.3) {
    context.save();
    context.strokeStyle = '#c72c35';
    const th = Math.random() * 6 + 3;
    context.lineWidth = th;
    context.beginPath();
    context.moveTo(...v1);
    context.lineTo(v1.x, v1.y - 2);
    context.stroke();
    context.restore();
  }
}
// 初始向量指向画布底边的中点
const v0 = new Vector2D(256, 0);
drawBranch(ctx, v0, 50, 10, 1, 3);
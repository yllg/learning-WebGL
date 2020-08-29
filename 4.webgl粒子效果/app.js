const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');
// 顶点着色器
// p 是当前动画进度，它的值是 u_time / u_duration，取值区间从 0 到 1。
// rad 是旋转角度，它的值是初始角度 u_rotation 加上 10π，表示在动画过程中它会绕自身旋转 5 周。
// scale 是缩放比例，它的值是初始缩放比例乘以一个系数，这个系数是 p * (2.0 - p)，是一个缓动函数，在这里我们只需要知道，它的作用是让 scale 的变化量随着时间推移逐渐减小就可以了。
// offset 是一个二维向量，它是初始值 u_dir 与 2.0 * p * p 的乘积，因为 u_dir 是个单位向量，这里的 2.0 表示它的最大移动距离为 2，p * p 也是一个缓动函数，作用是让位移的变化量随着时间增加而增大
// 注意：三个矩阵相乘的顺序改变，效果是不一样的
// TODO: skewMatrix 扭曲变换矩阵，效果待验证
// TODO：3D变换，支持 3 维的齐次坐标，需要 4 维齐次矩阵
const vertex = `
  attribute vec2 position;

  uniform float u_rotation;
  uniform float u_time;
  uniform float u_duration;
  uniform float u_scale;
  uniform vec2 u_dir;

  varying float vP;

  void main() {
    float p = min(1.0, u_time / u_duration);
    float rad = u_rotation + 3.14 * 10.0 * p;
    float scale = u_scale * p * (2.0 - p);
    vec2 offset = 2.0 * u_dir * p * p;
    mat3 translateMatrix = mat3(
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      offset.x, offset.y, 1.0
    );
    mat3 rotateMatrix = mat3(
      cos(rad), sin(rad), 0.0,
      -sin(rad), cos(rad), 0.0,
      0.0, 0.0, 1.0
    );
    mat3 scaleMatrix = mat3(
      scale, 0.0, 0.0,
      0.0, scale, 0.0,
      0.0, 0.0, 1.0
    );
    mat3 skewMatrix = mat3(
        1, tan(rad), 0.0,
        tan(rad), 1, 0.0,
        0.0, 0.0, 1.0
      );
    gl_PointSize = 1.0;
    vec3 pos = translateMatrix * rotateMatrix  * scaleMatrix  * vec3(position, 1.0);
    gl_Position = vec4(pos, 1.0);
    vP = p;
  }
`;
// 片元着色器
const fragment = `
  precision mediump float;
  uniform vec4 u_color;
  varying float vP;
  void main()
  {
    gl_FragColor.xyz = u_color.xyz;
    gl_FragColor.a = (1.0 - vP) * u_color.a;
  }    
`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertex);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragment);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// 三角形 顶点坐标
const position = new Float32Array([
  -1, -1,
  0, 1,
  1, -1,
]);
// 将数据写入缓冲区
// 创建一个缓存对象
const bufferId = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);
// 将 buffer 的数据绑定给顶点着色器的 position 变量
// 获取顶点着色器中的position变量的地址
const vPosition = gl.getAttribLocation(program, 'position');
// 给变量设置长度和类型
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
// 激活该变量
gl.enableVertexAttribArray(vPosition);

// 创建随机三角形属性的函数
function randomTriangles() {
  const u_color = [Math.random(), Math.random(), Math.random(), 1.0]; // 随机颜色
  const u_rotation = Math.random() * Math.PI; // 初始旋转角度
  const u_scale = Math.random() * 0.05 + 0.03; // 初始大小
  const u_time = 0; // 初始时间
  const u_duration = 5.0; // 持续3秒钟
  const rad = Math.random() * Math.PI * 2;
  const u_dir = [Math.cos(rad), Math.sin(rad)]; // 运动方向
  const startTime = performance.now(); // 创建时间
  return {u_color, u_rotation, u_scale, u_time, u_duration, u_dir, startTime};
}
// 设置uniform变量
function setUniforms(gl, {u_color, u_rotation, u_scale, u_time, u_duration, u_dir}) {
  let loc = gl.getUniformLocation(program, 'u_color');
  gl.uniform4fv(loc, u_color);
  loc = gl.getUniformLocation(program, 'u_rotation');
  gl.uniform1f(loc, u_rotation);
  loc = gl.getUniformLocation(program, 'u_scale');
  gl.uniform1f(loc, u_scale);
  loc = gl.getUniformLocation(program, 'u_time');
  gl.uniform1f(loc, u_time);
  loc = gl.getUniformLocation(program, 'u_duration');
  gl.uniform1f(loc, u_duration);
  loc = gl.getUniformLocation(program, 'u_dir');
  gl.uniform2fv(loc, u_dir);
}

let triangles = [];
// 绘制并更新的函数
function update(t) {
  // 生成随机个三角形的随机属性
  for(let i = 0; i < 5 * Math.random(); i++) {
    triangles.push(randomTriangles());
  }
  // 清空画布
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 对每个三角形重新设置u_time
  triangles.forEach((triangle) => {
    triangle.u_time = (performance.now() - triangle.startTime) / 1000;
    setUniforms(gl, triangle);
    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, position.length / 2);
  });
  // 移除动画结束的三角形，剩下的继续进行线性变换
  triangles = triangles.filter((triangle) => {
    return triangle.u_time <= triangle.u_duration;
  });
  requestAnimationFrame(update);
}

requestAnimationFrame(update);

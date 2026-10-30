'use strict';

/**
 * Lane widget. The supercar stays fixed and centered in its lane.
 * The road and wheels move with speed, and stop when the car stops.
 * Headlights and taillights follow the gear. The camera does not orbit.
 */

(function () {
  var RADIUS = 0.33;
  var TAU = Math.PI * 2;
  var FOG = [16 / 255, 16 / 255, 18 / 255];
  var METER_PER_MPH = 0.09;
  var LANE_X = 1.72;
  var DASH_SPACING = 3.6;
  var DASH_COUNT = 18;
  var DASH_BASE = -12;

  function S(z, nums) {
    var pts = [];
    for (var i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    return { z: z, pts: pts };
  }

  var BODY = [
    S(2.22, [0, 0.42, 0.08, 0.40, 0.14, 0.36, 0.16, 0.30, 0.12, 0.26, 0.05, 0.24, 0, 0.22]),
    S(1.96, [0, 0.52, 0.20, 0.44, 0.46, 0.40, 0.58, 0.30, 0.52, 0.20, 0.24, 0.15, 0, 0.13]),
    S(1.68, [0, 0.58, 0.30, 0.50, 0.64, 0.48, 0.84, 0.36, 0.80, 0.22, 0.36, 0.15, 0, 0.13]),
    S(1.30, [0, 0.62, 0.34, 0.56, 0.68, 0.70, 0.92, 0.56, 0.88, 0.42, 0.46, 0.36, 0, 0.15]),
    S(0.92, [0, 0.66, 0.32, 0.62, 0.62, 0.66, 0.98, 0.48, 0.94, 0.26, 0.40, 0.16, 0, 0.14]),
    S(0.52, [0, 0.72, 0.28, 0.70, 0.54, 0.68, 1.00, 0.50, 0.98, 0.28, 0.42, 0.16, 0, 0.14]),
    S(0.08, [0, 0.74, 0.26, 0.72, 0.50, 0.68, 1.02, 0.52, 1.00, 0.30, 0.44, 0.17, 0, 0.15]),
    S(-0.42, [0, 0.76, 0.30, 0.74, 0.64, 0.72, 1.08, 0.58, 1.06, 0.34, 0.48, 0.18, 0, 0.16]),
    S(-0.88, [0, 0.78, 0.34, 0.76, 0.72, 0.74, 0.98, 0.62, 0.96, 0.50, 0.52, 0.40, 0, 0.18]),
    S(-1.28, [0, 0.74, 0.30, 0.72, 0.70, 0.70, 0.94, 0.58, 0.90, 0.50, 0.48, 0.42, 0, 0.20]),
    S(-1.72, [0, 0.66, 0.24, 0.62, 0.52, 0.56, 0.84, 0.50, 0.78, 0.40, 0.34, 0.32, 0, 0.26]),
    S(-2.14, [0, 0.54, 0.18, 0.52, 0.40, 0.48, 0.66, 0.42, 0.60, 0.34, 0.26, 0.30, 0, 0.28])
  ];

  var GLASS = [
    S(0.70, [0, 0.80, 0.16, 0.76, 0.28, 0.73, 0.32, 0.70, 0.20, 0.66, 0.08, 0.66, 0, 0.66]),
    S(0.40, [0, 0.98, 0.16, 0.92, 0.30, 0.82, 0.38, 0.74, 0.24, 0.67, 0.10, 0.66, 0, 0.66]),
    S(0.08, [0, 1.13, 0.15, 1.06, 0.30, 0.92, 0.38, 0.78, 0.24, 0.70, 0.10, 0.68, 0, 0.68]),
    S(-0.22, [0, 1.16, 0.16, 1.08, 0.32, 0.94, 0.40, 0.80, 0.26, 0.72, 0.10, 0.70, 0, 0.70]),
    S(-0.48, [0, 1.00, 0.13, 0.95, 0.26, 0.86, 0.34, 0.78, 0.20, 0.72, 0.08, 0.70, 0, 0.70]),
    S(-0.68, [0, 0.84, 0.09, 0.81, 0.16, 0.77, 0.20, 0.74, 0.12, 0.71, 0.04, 0.70, 0, 0.70])
  ];

  var WHEELS = [
    { x: -0.96, z: 1.30, side: -1, rear: false },
    { x: 0.96, z: 1.30, side: 1, rear: false },
    { x: -1.04, z: -1.28, side: -1, rear: true },
    { x: 1.04, z: -1.28, side: 1, rear: true }
  ];

  function identity(o) {
    o[0] = 1; o[1] = 0; o[2] = 0; o[3] = 0;
    o[4] = 0; o[5] = 1; o[6] = 0; o[7] = 0;
    o[8] = 0; o[9] = 0; o[10] = 1; o[11] = 0;
    o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
    return o;
  }

  function multiply(a, b, out) {
    var tmp = out === a || out === b ? new Float32Array(16) : out;
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        tmp[c * 4 + r] = s;
      }
    }
    if (tmp !== out) out.set(tmp);
    return out;
  }

  function translation(x, y, z, out) {
    identity(out);
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
  }

  function rotationX(a, out) {
    var c = Math.cos(a);
    var s = Math.sin(a);
    identity(out);
    out[5] = c;
    out[6] = s;
    out[9] = -s;
    out[10] = c;
    return out;
  }

  function rotationY(a, out) {
    var c = Math.cos(a);
    var s = Math.sin(a);
    identity(out);
    out[0] = c;
    out[2] = -s;
    out[8] = s;
    out[10] = c;
    return out;
  }

  function perspective(fov, aspect, near, far, out) {
    var f = 1 / Math.tan(fov / 2);
    var nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }

  function lookAt(eye, target, up, out) {
    var zx = eye[0] - target[0];
    var zy = eye[1] - target[1];
    var zz = eye[2] - target[2];
    var len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;
    var xx = up[1] * zz - up[2] * zy;
    var xy = up[2] * zx - up[0] * zz;
    var xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    len = Math.hypot(yx, yy, yz) || 1;
    yx /= len; yy /= len; yz /= len;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
  }

  function transformPoint(m, x, y, z) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14]
    ];
  }

  function transformDir(m, x, y, z) {
    return [
      m[0] * x + m[4] * y + m[8] * z,
      m[1] * x + m[5] * y + m[9] * z,
      m[2] * x + m[6] * y + m[10] * z
    ];
  }

  function faceNormal(pos, a, b, c) {
    var ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    var bx = pos[b * 3] - ax, by = pos[b * 3 + 1] - ay, bz = pos[b * 3 + 2] - az;
    var cx = pos[c * 3] - ax, cy = pos[c * 3 + 1] - ay, cz = pos[c * 3 + 2] - az;
    return [by * cz - bz * cy, bz * cx - bx * cz, bx * cy - by * cx];
  }

  function Flat() {
    this.pos = [];
    this.nrm = [];
    this.idx = [];
  }

  Flat.prototype.vertex = function (x, y, z, nx, ny, nz) {
    var i = this.pos.length / 3;
    var len = Math.hypot(nx, ny, nz) || 1;
    this.pos.push(x, y, z);
    this.nrm.push(nx / len, ny / len, nz / len);
    return i;
  };

  Flat.prototype.tri = function (a, b, c) {
    this.idx.push(a, b, c);
  };

  Flat.prototype.addBox = function (w, h, d, matrix) {
    var m = matrix;
    var sx = w, sy = h, sz = d;
    var inv = [1 / w, 1 / h, 1 / d];
    var faces = [
      { n: [1, 0, 0], p: [[0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5]] },
      { n: [-1, 0, 0], p: [[-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5]] },
      { n: [0, 1, 0], p: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
      { n: [0, -1, 0], p: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
      { n: [0, 0, 1], p: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
      { n: [0, 0, -1], p: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] }
    ];
    for (var f = 0; f < faces.length; f++) {
      var face = faces[f];
      var ids = [];
      var nn = face.n;
      var dn = m ? transformDir(m, nn[0] * inv[0], nn[1] * inv[1], nn[2] * inv[2]) : [nn[0] * inv[0], nn[1] * inv[1], nn[2] * inv[2]];
      for (var p = 0; p < 4; p++) {
        var u = face.p[p];
        var x = u[0] * sx, y = u[1] * sy, z = u[2] * sz;
        var wp = m ? transformPoint(m, x, y, z) : [x, y, z];
        ids.push(this.vertex(wp[0], wp[1], wp[2], dn[0], dn[1], dn[2]));
      }
      this.tri(ids[0], ids[1], ids[2]);
      this.tri(ids[0], ids[2], ids[3]);
    }
  };

  Flat.prototype.addCylinderX = function (radius, halfW, segs, wobble) {
    var self = this;
    function ring(side, cap) {
      var ids = [];
      var x = side < 0 ? -halfW : halfW;
      var nx = cap ? side : 0;
      for (var i = 0; i < segs; i++) {
        var a = (i / segs) * TAU;
        var wob = wobble ? (1 + wobble * Math.cos(a * 6)) : 1;
        var y = Math.cos(a) * radius * wob;
        var z = Math.sin(a) * radius * wob;
        var ny = cap ? 0 : Math.cos(a);
        var nz = cap ? 0 : Math.sin(a);
        ids.push(self.vertex(x, y, z, nx, ny, nz));
      }
      return ids;
    }
    var left = ring(-1, false);
    var right = ring(1, false);
    for (var i = 0; i < segs; i++) {
      var j = (i + 1) % segs;
      var a = left[i], b = left[j], c = right[j], d = right[i];
      var nrm = faceNormal(this.pos, a, d, c);
      var ay = (this.pos[a * 3 + 1] + this.pos[d * 3 + 1] + this.pos[c * 3 + 1]) / 3;
      var az = (this.pos[a * 3 + 2] + this.pos[d * 3 + 2] + this.pos[c * 3 + 2]) / 3;
      if (nrm[1] * ay + nrm[2] * az < 0) {
        this.tri(a, c, d);
        this.tri(a, b, c);
      } else {
        this.tri(a, d, c);
        this.tri(a, c, b);
      }
    }
    function cap(side) {
      var x = side < 0 ? -halfW : halfW;
      var center = self.vertex(x, 0, 0, side, 0, 0);
      var ids = ring(side, true);
      for (var i = 0; i < segs; i++) {
        var j = (i + 1) % segs;
        if (side > 0) self.tri(center, ids[i], ids[j]);
        else self.tri(center, ids[j], ids[i]);
      }
    }
    cap(-1);
    cap(1);
  };

  Flat.prototype.addRingX = function (inner, outer, halfW, segs) {
    var self = this;
    function band(radius, nySign) {
      var left = [];
      var right = [];
      for (var i = 0; i < segs; i++) {
        var a = (i / segs) * TAU;
        var y = Math.cos(a) * radius;
        var z = Math.sin(a) * radius;
        var ny = Math.cos(a) * nySign;
        var nz = Math.sin(a) * nySign;
        left.push(self.vertex(-halfW, y, z, 0, ny, nz));
        right.push(self.vertex(halfW, y, z, 0, ny, nz));
      }
      for (var n = 0; n < segs; n++) {
        var m = (n + 1) % segs;
        if (nySign > 0) {
          self.tri(left[n], right[n], right[m]);
          self.tri(left[n], right[m], left[m]);
        } else {
          self.tri(left[n], left[m], right[m]);
          self.tri(left[n], right[m], right[n]);
        }
      }
    }
    band(outer, 1);
    band(inner, -1);
    function annulus(side) {
      var x = side * halfW;
      var o = [];
      var inn = [];
      for (var i = 0; i < segs; i++) {
        var a = (i / segs) * TAU;
        o.push(self.vertex(x, Math.cos(a) * outer, Math.sin(a) * outer, side, 0, 0));
        inn.push(self.vertex(x, Math.cos(a) * inner, Math.sin(a) * inner, side, 0, 0));
      }
      for (var n = 0; n < segs; n++) {
        var m = (n + 1) % segs;
        if (side > 0) {
          self.tri(o[n], o[m], inn[m]);
          self.tri(o[n], inn[m], inn[n]);
        } else {
          self.tri(o[n], inn[m], o[m]);
          self.tri(o[n], inn[n], inn[m]);
        }
      }
    }
    annulus(1);
    annulus(-1);
  };

  function appendMesh(dst, src) {
    var base = dst.pos.length / 3;
    for (var i = 0; i < src.pos.length; i++) dst.pos.push(src.pos[i]);
    for (var n = 0; n < src.nrm.length; n++) dst.nrm.push(src.nrm[n]);
    for (var k = 0; k < src.idx.length; k++) dst.idx.push(src.idx[k] + base);
  }

  function cr(a, b, c, d, t) {
    var t2 = t * t;
    var t3 = t2 * t;
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }

  function subdivide(sections, steps) {
    var ordered = sections.slice().sort(function (a, b) { return a.z - b.z; });
    var out = [];
    var n = ordered.length;
    for (var i = 0; i < n - 1; i++) {
      var i0 = Math.max(0, i - 1);
      var i1 = i;
      var i2 = i + 1;
      var i3 = Math.min(n - 1, i + 2);
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        var a = ordered[i0], b = ordered[i1], c = ordered[i2], d = ordered[i3];
        var pts = [];
        for (var p = 0; p < b.pts.length; p++) {
          pts.push([
            cr(a.pts[p][0], b.pts[p][0], c.pts[p][0], d.pts[p][0], t),
            Math.max(0.08, cr(a.pts[p][1], b.pts[p][1], c.pts[p][1], d.pts[p][1], t))
          ]);
        }
        pts[0][0] = 0;
        pts[pts.length - 1][0] = 0;
        out.push({ z: cr(a.z, b.z, c.z, d.z, t), pts: pts });
      }
    }
    var last = ordered[n - 1];
    var endPts = last.pts.map(function (p) { return [p[0], p[1]]; });
    endPts[0][0] = 0;
    endPts[endPts.length - 1][0] = 0;
    out.push({ z: last.z, pts: endPts });
    return out;
  }

  function smoothLoft(sections) {
    var mesh = { pos: [], idx: [] };
    var rings = [];
    var built = subdivide(sections, 4);
    for (var s = 0; s < built.length; s++) {
      var half = built[s].pts;
      var ring = [];
      for (var i = 0; i < half.length; i++) {
        ring.push(mesh.pos.length / 3);
        mesh.pos.push(half[i][0], half[i][1], built[s].z);
      }
      for (var k = half.length - 2; k >= 1; k--) {
        ring.push(mesh.pos.length / 3);
        mesh.pos.push(-half[k][0], half[k][1], built[s].z);
      }
      rings.push(ring);
    }
    var count = rings[0].length;
    for (var sec = 0; sec < rings.length - 1; sec++) {
      for (var v = 0; v < count; v++) {
        var v2 = (v + 1) % count;
        var a = rings[sec][v];
        var b = rings[sec][v2];
        var c = rings[sec + 1][v2];
        var d = rings[sec + 1][v];
        mesh.idx.push(a, d, c, a, c, b);
      }
    }
    function cap(ring, zSign) {
      var z = 0, y = 0;
      for (var i = 0; i < ring.length; i++) {
        y += mesh.pos[ring[i] * 3 + 1];
        z += mesh.pos[ring[i] * 3 + 2];
      }
      y /= ring.length;
      z = z / ring.length + zSign * 0.02;
      var center = mesh.pos.length / 3;
      mesh.pos.push(0, y, z);
      for (var t = 0; t < ring.length; t++) {
        var n = (t + 1) % ring.length;
        if (zSign > 0) mesh.idx.push(center, ring[n], ring[t]);
        else mesh.idx.push(center, ring[t], ring[n]);
      }
    }
    cap(rings[0], -1);
    cap(rings[rings.length - 1], 1);

    var pos = mesh.pos;
    var idx = mesh.idx;
    var posScore = 0;
    var negScore = 0;
    for (var tri = 0; tri < idx.length; tri += 3) {
      var nrm = faceNormal(pos, idx[tri], idx[tri + 1], idx[tri + 2]);
      var mx = (pos[idx[tri] * 3] + pos[idx[tri + 1] * 3] + pos[idx[tri + 2] * 3]) / 3;
      var my = (pos[idx[tri] * 3 + 1] + pos[idx[tri + 1] * 3 + 1] + pos[idx[tri + 2] * 3 + 1]) / 3;
      var score = nrm[0] * mx + nrm[1] * (my - 0.48);
      if (score > 0) posScore++;
      else if (score < 0) negScore++;
    }
    if (negScore > posScore) {
      for (var flip = 0; flip < idx.length; flip += 3) {
        var swap = idx[flip + 1];
        idx[flip + 1] = idx[flip + 2];
        idx[flip + 2] = swap;
      }
    }

    var nrmOut = new Float32Array(pos.length);
    for (var f = 0; f < idx.length; f += 3) {
      var fn = faceNormal(pos, idx[f], idx[f + 1], idx[f + 2]);
      for (var e = 0; e < 3; e++) {
        var vi = idx[f + e] * 3;
        nrmOut[vi] += fn[0];
        nrmOut[vi + 1] += fn[1];
        nrmOut[vi + 2] += fn[2];
      }
    }
    for (var q = 0; q < nrmOut.length; q += 3) {
      var ln = Math.hypot(nrmOut[q], nrmOut[q + 1], nrmOut[q + 2]);
      if (ln < 1e-8) {
        nrmOut[q] = 0;
        nrmOut[q + 1] = 1;
        nrmOut[q + 2] = 0;
      } else {
        nrmOut[q] /= ln;
        nrmOut[q + 1] /= ln;
        nrmOut[q + 2] /= ln;
      }
    }
    return { pos: pos, nrm: Array.prototype.slice.call(nrmOut), idx: idx };
  }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.bindAttribLocation(p, 1, 'aNrm');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p));
    }
    return p;
  }

  function upload(gl, mesh) {
    var pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.pos), gl.STATIC_DRAW);
    var nrm = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nrm);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.nrm), gl.STATIC_DRAW);
    var idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.idx), gl.STATIC_DRAW);
    return { pos: pos, nrm: nrm, idx: idx, count: mesh.idx.length };
  }

  var LIT_VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aNrm;',
    'uniform mat4 uMvp;',
    'uniform mat4 uModel;',
    'varying vec3 vN;',
    'varying vec3 vW;',
    'void main() {',
    '  vec4 w = uModel * vec4(aPos, 1.0);',
    '  vW = w.xyz;',
    '  vN = mat3(uModel) * aNrm;',
    '  gl_Position = uMvp * vec4(aPos, 1.0);',
    '}'
  ].join('\n');

  var LIT_FS = [
    'precision highp float;',
    'varying vec3 vN;',
    'varying vec3 vW;',
    'uniform vec3 uColor;',
    'uniform vec3 uEye;',
    'uniform vec3 uFog;',
    'uniform vec3 uLight;',
    'uniform vec3 uFill;',
    'uniform float uAmbient;',
    'uniform float uDiffuse;',
    'uniform float uSpec;',
    'uniform float uShine;',
    'uniform float uFresnel;',
    'uniform float uEmit;',
    'uniform float uAlpha;',
    'uniform float uGrain;',
    'uniform float uRoad;',
    'uniform float uFade;',
    'void main() {',
    '  vec3 n = normalize(vN);',
    '  vec3 v = normalize(uEye - vW);',
    '  vec3 l1 = normalize(uLight);',
    '  vec3 l2 = normalize(uFill);',
    '  float ndl1 = max(dot(n, l1), 0.0);',
    '  float ndl2 = max(dot(n, l2), 0.0);',
    '  float hemi = n.y * 0.5 + 0.5;',
    '  vec3 col = uColor * (uAmbient * mix(0.32, 1.0, hemi) + uDiffuse * (ndl1 * 0.82 + ndl2 * 0.36));',
    '  vec3 h1 = normalize(l1 + v);',
    '  float spec = pow(max(dot(n, h1), 0.0), uShine);',
    '  col += vec3(0.95, 0.93, 0.88) * spec * uSpec;',
    '  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);',
    '  col += vec3(0.93, 0.91, 0.86) * fres * uFresnel;',
    '  col += uColor * uEmit;',
    '  if (uGrain > 0.001) {',
    '    float g = fract(sin(dot(floor(vW.xz * vec2(4.5, 6.5)), vec2(127.1, 311.7))) * 43758.5453);',
    '    col *= 1.0 - uGrain * (g - 0.5);',
    '  }',
    '  if (uRoad > 0.5) {',
    '    float shoulder = smoothstep(1.52, 1.86, abs(vW.x));',
    '    col *= mix(1.0, 0.55, shoulder);',
    '  }',
    '  float fog = smoothstep(13.0, 34.0, length(vW - uEye));',
    '  if (uFade > 0.5) {',
    '    float band = smoothstep(28.0, 9.0, vW.z) * smoothstep(-16.0, -1.5, vW.z);',
    '    fog = max(fog, 1.0 - band);',
    '  }',
    '  col = mix(col, uFog, clamp(fog, 0.0, 1.0));',
    '  gl_FragColor = vec4(col, uAlpha);',
    '}'
  ].join('\n');

  var SHADOW_VS = [
    'attribute vec3 aPos;',
    'attribute vec2 aUv;',
    'uniform mat4 uMvp;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aUv;',
    '  gl_Position = uMvp * vec4(aPos, 1.0);',
    '}'
  ].join('\n');

  var SHADOW_FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uTex;',
    'void main() { gl_FragColor = texture2D(uTex, vUv); }'
  ].join('\n');

  function buildGeometry() {
    var paint = new Flat();
    var trim = new Flat();
    var cabin = new Flat();
    var id = new Float32Array(16);
    identity(id);
    appendMesh(paint, smoothLoft(BODY));

    var ry = new Float32Array(16);
    var t = new Float32Array(16);
    var m = new Float32Array(16);
    var tmp = new Float32Array(16);

    paint.addBox(1.72, 0.045, 0.62, translation(0, 0.105, 1.98, t));
    paint.addBox(1.50, 0.04, 0.38, translation(0, 1.28, -1.86, t));
    paint.addBox(0.022, 0.16, 0.42, translation(0.76, 1.28, -1.84, t));
    paint.addBox(0.022, 0.16, 0.42, translation(-0.76, 1.28, -1.84, t));
    paint.addBox(0.035, 0.52, 0.05, translation(0.28, 1.02, -1.78, t));
    paint.addBox(0.035, 0.52, 0.05, translation(-0.28, 1.02, -1.78, t));
    paint.addBox(0.12, 0.07, 0.18, translation(0.78, 0.86, 0.22, t));
    paint.addBox(0.12, 0.07, 0.18, translation(-0.78, 0.86, 0.22, t));

    trim.addBox(0.07, 0.09, 1.45, translation(1.02, 0.15, -0.15, id));
    trim.addBox(0.07, 0.09, 1.45, translation(-1.02, 0.15, -0.15, identity(tmp)));
    trim.addBox(0.92, 0.045, 0.42, translation(0, 0.16, -2.02, identity(t)));
    trim.addBox(0.018, 0.07, 0.36, translation(-0.22, 0.15, -2.00, identity(ry)));
    trim.addBox(0.018, 0.07, 0.36, translation(0, 0.15, -2.00, identity(m)));
    trim.addBox(0.018, 0.07, 0.36, translation(0.22, 0.15, -2.00, identity(tmp)));
    trim.addBox(0.18, 0.18, 0.62, translation(0.98, 0.52, -0.32, identity(t)));
    trim.addBox(0.18, 0.18, 0.62, translation(-0.98, 0.52, -0.32, identity(ry)));
    trim.addBox(0.10, 0.012, 0.42, translation(0.22, 0.645, 1.20, identity(m)));
    trim.addBox(0.10, 0.012, 0.42, translation(-0.22, 0.645, 1.20, identity(tmp)));

    cabin.addBox(0.50, 0.24, 0.62, translation(0, 0.82, -0.08, identity(t)));
    cabin.addBox(0.28, 0.22, 0.30, translation(0, 0.62, -0.02, identity(ry)));
    cabin.addBox(0.16, 0.16, 0.16, translation(0, 0.78, 0.02, identity(m)));

    var glass = smoothLoft(GLASS);

    var tireF = new Flat();
    tireF.addCylinderX(RADIUS, 0.135, 28, 0.012);
    var tireR = new Flat();
    tireR.addCylinderX(RADIUS, 0.165, 28, 0.012);

    function wheelFace(side) {
      var face = new Flat();
      face.addRingX(0.155, 0.228, 0.028, 28);
      var hub = new Flat();
      hub.addCylinderX(0.05, 0.03, 16, 0);
      appendMesh(face, hub);
      var spoke = new Flat();
      var rx = new Float32Array(16);
      var tr = new Float32Array(16);
      var tf = new Float32Array(16);
      for (var i = 0; i < 5; i++) {
        rotationX((i / 5) * TAU, rx);
        translation(side * 0.02, 0.145, 0, tr);
        multiply(rx, tr, tf);
        spoke.addBox(0.05, 0.17, 0.07, tf);
      }
      appendMesh(face, spoke);
      return face;
    }

    var faceL = wheelFace(-1);
    var faceR = wheelFace(1);
    var mark = new Flat();
    mark.addBox(0.018, 0.05, 0.032, null);

    var head = new Flat();
    rotationY(0.55, ry);
    translation(-0.50, 0.40, 1.74, t);
    multiply(t, ry, m);
    head.addBox(0.36, 0.03, 0.05, m);
    rotationY(-0.55, ry);
    translation(0.50, 0.40, 1.74, t);
    multiply(t, ry, m);
    head.addBox(0.36, 0.03, 0.05, m);

    var tail = new Flat();
    tail.addBox(1.28, 0.045, 0.03, translation(0, 0.48, -2.16, identity(t)));
    var glow = new Flat();
    glow.addBox(1.45, 0.10, 0.02, translation(0, 0.47, -2.19, identity(ry)));

    var road = new Flat();
    road.addBox(46, 0.16, 130, null);
    var solid = new Flat();
    solid.addBox(0.055, 0.02, 56, null);
    var dash = new Flat();
    dash.addBox(0.13, 0.028, 1.65, null);

    return {
      paint: paint,
      trim: trim,
      cabin: cabin,
      glass: glass,
      tireF: tireF,
      tireR: tireR,
      faceL: faceL,
      faceR: faceR,
      mark: mark,
      head: head,
      tail: tail,
      glow: glow,
      road: road,
      solid: solid,
      dash: dash
    };
  }

  function shadowTexture(gl) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(128, 128, 18, 128, 128, 122);
    grd.addColorStop(0, 'rgba(0,0,0,0.72)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.34)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function showFallback(root) {
    root.classList.add('is-fallback');
    var img = root.querySelector('.car-fallback');
    if (img) img.alt = 'Supercar centered in its lane';
  }

  function start(root) {
    if (root.getAttribute('data-car-ready') === 'true') return;
    root.setAttribute('data-car-ready', 'true');
    var canvas = root.querySelector('.car-scene');
    if (!canvas) return;

    var gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    if (!gl) {
      showFallback(root);
      return;
    }

    var lit;
    var shadowProg;
    var gpu;
    var shadow;
    try {
      lit = program(gl, LIT_VS, LIT_FS);
      shadowProg = gl.createProgram();
      gl.attachShader(shadowProg, compile(gl, gl.VERTEX_SHADER, SHADOW_VS));
      gl.attachShader(shadowProg, compile(gl, gl.FRAGMENT_SHADER, SHADOW_FS));
      gl.bindAttribLocation(shadowProg, 0, 'aPos');
      gl.bindAttribLocation(shadowProg, 1, 'aUv');
      gl.linkProgram(shadowProg);
      if (!gl.getProgramParameter(shadowProg, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(shadowProg));
      }
      var geo = buildGeometry();
      gpu = {};
      Object.keys(geo).forEach(function (key) {
        gpu[key] = upload(gl, geo[key]);
      });
      shadow = makeShadow(gl);
    } catch (err) {
      console.error(err);
      showFallback(root);
      return;
    }

    var loc = {
      mvp: gl.getUniformLocation(lit, 'uMvp'),
      model: gl.getUniformLocation(lit, 'uModel'),
      color: gl.getUniformLocation(lit, 'uColor'),
      eye: gl.getUniformLocation(lit, 'uEye'),
      fog: gl.getUniformLocation(lit, 'uFog'),
      light: gl.getUniformLocation(lit, 'uLight'),
      fill: gl.getUniformLocation(lit, 'uFill'),
      ambient: gl.getUniformLocation(lit, 'uAmbient'),
      diffuse: gl.getUniformLocation(lit, 'uDiffuse'),
      spec: gl.getUniformLocation(lit, 'uSpec'),
      shine: gl.getUniformLocation(lit, 'uShine'),
      fresnel: gl.getUniformLocation(lit, 'uFresnel'),
      emit: gl.getUniformLocation(lit, 'uEmit'),
      alpha: gl.getUniformLocation(lit, 'uAlpha'),
      grain: gl.getUniformLocation(lit, 'uGrain'),
      road: gl.getUniformLocation(lit, 'uRoad'),
      fade: gl.getUniformLocation(lit, 'uFade')
    };
    var shadowMvp = gl.getUniformLocation(shadowProg, 'uMvp');

    var proj = new Float32Array(16);
    var view = new Float32Array(16);
    var mvp = new Float32Array(16);
    var mv = new Float32Array(16);
    var model = new Float32Array(16);
    var spinM = new Float32Array(16);
    var wheelM = new Float32Array(16);
    var markM = new Float32Array(16);
    var localM = new Float32Array(16);
    var ident = new Float32Array(16);
    identity(ident);

    var roadM = new Float32Array(16);
    translation(0, -0.08, 18, roadM);
    var lineL = new Float32Array(16);
    var lineR = new Float32Array(16);
    translation(-LANE_X, 0.02, 10, lineL);
    translation(LANE_X, 0.02, 10, lineR);

    var eye = [0.78, 2.05, -6.9];
    var target = [0, 0.46, 0.35];
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var scroll = 0;
    var spin = 0;
    var mphSmooth = 64;
    var prevSmooth = 64;
    var headLevel = 1;
    var tailLevel = 0.35;
    var failed = false;
    var lost = false;

    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      lost = true;
      showFallback(root);
    }, false);

    function telemetry() {
      var screen = root.closest('#screen') || document.getElementById('screen');
      var speedEl = (screen && screen.querySelector('#speed')) || document.getElementById('speed');
      var drive = (screen && screen.dataset.drive) || 'd';
      var mph = speedEl ? parseFloat(speedEl.textContent) : 0;
      if (!isFinite(mph)) mph = 0;
      return { drive: drive, mph: mph };
    }

    function visible() {
      var viewEl = root.closest('.view');
      if (viewEl && !viewEl.classList.contains('is-on')) return false;
      var rect = root.getBoundingClientRect();
      return rect.width > 2 && rect.height > 2;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return { w: canvas.width, h: canvas.height, aspect: canvas.width / Math.max(1, canvas.height) };
    }

    function bindMesh(mesh) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nrm);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    }

    function useModel(m) {
      multiply(view, m, mv);
      multiply(proj, mv, mvp);
      gl.uniformMatrix4fv(loc.model, false, m);
      gl.uniformMatrix4fv(loc.mvp, false, mvp);
    }

    function shade(mat) {
      gl.uniform3fv(loc.color, mat.color);
      gl.uniform1f(loc.ambient, mat.ambient);
      gl.uniform1f(loc.diffuse, mat.diffuse);
      gl.uniform1f(loc.spec, mat.spec);
      gl.uniform1f(loc.shine, mat.shine);
      gl.uniform1f(loc.fresnel, mat.fresnel);
      gl.uniform1f(loc.emit, mat.emit);
      gl.uniform1f(loc.alpha, mat.alpha);
      gl.uniform1f(loc.grain, mat.grain || 0);
      gl.uniform1f(loc.road, mat.road || 0);
      gl.uniform1f(loc.fade, mat.fade || 0);
    }

    function draw(mesh, m, mat) {
      useModel(m);
      shade(mat);
      bindMesh(mesh);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    var paintMat = { color: [0.30, 0.31, 0.33], ambient: 0.2, diffuse: 0.78, spec: 0.42, shine: 48, fresnel: 0.22, emit: 0, alpha: 1 };
    var trimMat = { color: [0.07, 0.07, 0.075], ambient: 0.35, diffuse: 0.4, spec: 0.12, shine: 18, fresnel: 0.08, emit: 0, alpha: 1 };
    var cabinMat = { color: [0.015, 0.015, 0.018], ambient: 0.4, diffuse: 0.2, spec: 0.02, shine: 8, fresnel: 0, emit: 0, alpha: 1 };
    var glassMat = { color: [0.04, 0.045, 0.05], ambient: 0.22, diffuse: 0.12, spec: 0.7, shine: 80, fresnel: 0.45, emit: 0, alpha: 0.86 };
    var tireMat = { color: [0.04, 0.04, 0.042], ambient: 0.3, diffuse: 0.42, spec: 0.14, shine: 12, fresnel: 0.06, emit: 0, alpha: 1 };
    var rimMat = { color: [0.62, 0.63, 0.66], ambient: 0.34, diffuse: 0.55, spec: 0.75, shine: 36, fresnel: 0.2, emit: 0, alpha: 1 };
    var markMat = { color: [0.78, 0.76, 0.70], ambient: 0.5, diffuse: 0.3, spec: 0.1, shine: 12, fresnel: 0.05, emit: 0.15, alpha: 1 };
    var roadMat = { color: [0.115, 0.118, 0.128], ambient: 0.85, diffuse: 0.25, spec: 0, shine: 4, fresnel: 0, emit: 0, alpha: 1, grain: 0.07, road: 1 };
    var solidMat = { color: [0.34, 0.33, 0.30], ambient: 0.9, diffuse: 0.15, spec: 0, shine: 4, fresnel: 0, emit: 0.05, alpha: 1, fade: 1 };
    var dashMat = { color: [0.80, 0.78, 0.72], ambient: 0.95, diffuse: 0.1, spec: 0, shine: 4, fresnel: 0, emit: 0.08, alpha: 1, fade: 1 };

    function frame(now) {
      if (failed || lost) return;
      requestAnimationFrame(frame);
      if (!visible()) return;
      try {
      var size = resize();
      var dt = Math.min(0.05, frame.last ? (now - frame.last) / 1000 : 0.016);
      frame.last = now;
      var tel = telemetry();
      var drive = tel.drive;
      var raw = tel.mph;
      prevSmooth = mphSmooth;
      mphSmooth += (raw - mphSmooth) * Math.min(1, dt * 3);
      var slope = dt > 0 ? (mphSmooth - prevSmooth) / dt : 0;
      var moving = raw > 0.4 && !reduce.matches;
      var direction = drive === 'r' ? -1 : 1;
      var visual = moving ? raw * METER_PER_MPH * direction : 0;
      scroll += visual * dt;
      spin += (visual / RADIUS) * dt;

      var headTarget = drive === 'p' ? 0.18 : 1;
      var tailTarget = (drive === 'p' || drive === 'r' || slope < -8) ? 1 : 0.38;
      var blend = 1 - Math.exp(-dt * 6);
      headLevel += (headTarget - headLevel) * blend;
      tailLevel += (tailTarget - tailLevel) * blend;

      gl.viewport(0, 0, size.w, size.h);
      gl.clearColor(FOG[0], FOG[1], FOG[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
      gl.disable(gl.BLEND);
      gl.depthMask(true);

      perspective(38 * Math.PI / 180, size.aspect, 0.12, 90, proj);
      lookAt(eye, target, [0, 1, 0], view);
      gl.useProgram(lit);
      gl.uniform3fv(loc.eye, eye);
      gl.uniform3fv(loc.fog, FOG);
      gl.uniform3fv(loc.light, [0.35, 0.92, 0.42]);
      gl.uniform3fv(loc.fill, [-0.55, 0.48, -0.62]);

      draw(gpu.road, roadM, roadMat);
      draw(gpu.solid, lineL, solidMat);
      draw(gpu.solid, lineR, solidMat);

      var span = DASH_COUNT * DASH_SPACING;
      for (var i = 0; i < DASH_COUNT; i++) {
        var z = DASH_BASE + mod((i * DASH_SPACING) - scroll - DASH_BASE, span);
        translation(-LANE_X, 0.03, z, model);
        draw(gpu.dash, model, dashMat);
        translation(LANE_X, 0.03, z, model);
        draw(gpu.dash, model, dashMat);
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(shadowProg);
      multiply(view, ident, mv);
      multiply(proj, mv, mvp);
      gl.uniformMatrix4fv(shadowMvp, false, mvp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, shadow.tex);
      gl.bindBuffer(gl.ARRAY_BUFFER, shadow.pos);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, shadow.uv);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shadow.idx);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      gl.enable(gl.CULL_FACE);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(lit);
      gl.uniform3fv(loc.eye, eye);
      gl.uniform3fv(loc.fog, FOG);
      gl.uniform3fv(loc.light, [0.35, 0.92, 0.42]);
      gl.uniform3fv(loc.fill, [-0.55, 0.48, -0.62]);

      draw(gpu.paint, ident, paintMat);
      draw(gpu.trim, ident, trimMat);
      draw(gpu.cabin, ident, cabinMat);

      for (var w = 0; w < WHEELS.length; w++) {
        var wheel = WHEELS[w];
        translation(wheel.x, RADIUS, wheel.z, model);
        rotationX(spin, spinM);
        multiply(model, spinM, wheelM);
        draw(gpu[wheel.rear ? 'tireR' : 'tireF'], wheelM, tireMat);
        var half = wheel.rear ? 0.175 : 0.145;
        translation(wheel.side * (half + 0.02), 0, 0, localM);
        multiply(wheelM, localM, markM);
        draw(gpu[wheel.side < 0 ? 'faceL' : 'faceR'], markM, rimMat);
        translation(wheel.side * (half + 0.012), 0.24, 0, localM);
        multiply(wheelM, localM, markM);
        draw(gpu.mark, markM, markMat);
      }

      var headMat = { color: [1, 0.96, 0.88], ambient: 0, diffuse: 0, spec: 0, shine: 1, fresnel: 0, emit: 0.35 + headLevel * 1.15, alpha: 1 };
      var tailMat = { color: [0.961, 0, 0], ambient: 0, diffuse: 0, spec: 0, shine: 1, fresnel: 0, emit: 0.25 + tailLevel * 1.05, alpha: 1 };
      draw(gpu.head, ident, headMat);
      draw(gpu.tail, ident, tailMat);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      draw(gpu.glass, ident, glassMat);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      var glowMat = { color: [0.961, 0.02, 0.02], ambient: 0, diffuse: 0, spec: 0, shine: 1, fresnel: 0, emit: 0.2 + tailLevel, alpha: 0.08 + tailLevel * 0.22 };
      draw(gpu.glow, ident, glowMat);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      } catch (err) {
        failed = true;
        console.error(err);
        showFallback(root);
      }
    }

    requestAnimationFrame(frame);
  }

  function makeShadow(gl) {
    var pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.55, 0.014, -2.65,
      1.55, 0.014, -2.65,
      1.55, 0.014, 2.45,
      -1.55, 0.014, 2.45
    ]), gl.STATIC_DRAW);
    var uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0, 1, 0, 1, 1, 0, 1
    ]), gl.STATIC_DRAW);
    var idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    return { pos: pos, uv: uv, idx: idx, tex: shadowTexture(gl) };
  }

  function boot() {
    var roots = document.querySelectorAll('[data-car-scene]');
    for (var i = 0; i < roots.length; i++) start(roots[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

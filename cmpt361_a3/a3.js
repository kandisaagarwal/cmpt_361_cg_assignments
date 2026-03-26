import { Framebuffer } from './framebuffer.js';
import { Rasterizer } from './rasterizer.js';
// DO NOT CHANGE ANYTHING ABOVE HERE

 
////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////


// blend two colors together along a line
function lerpColor(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}
 

// get the barycentric coords of a point inside a triangle
function barycentricCoordinates(x1, y1, x2, y2, x3, y3, px, py) {
  const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const l1 = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
  const l2 = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
  const l3 = 1.0 - l1 - l2;
  return [l1, l2, l3];
}
 
// tells us which side of an edge a point is on
function edgeFunction(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}
 
// top-left rule: if a pixel is exactly on an edge, only include it
function isTopOrLeftEdge(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const isTop = (dy === 0 && dx > 0);
  const isLeft = (dy > 0);
  return isTop || isLeft;
}


////////////////////////////////////////////////////////////////////////////////
// Implement line rasterization using DDA algorithm with color interpolation
////////////////////////////////////////////////////////////////////////////////
Rasterizer.prototype.drawLine = function(v1, v2) {
  let [x1, y1, c1] = v1;
  let [x2, y2, c2] = v2;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // number of steps is the longer dimension
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
  if (steps === 0) {
    // both endpoints are the same pixel
    this.setPixel(Math.round(x1), Math.round(y1), c1);
    return;
  }

  const xInc = dx / steps;
  const yInc = dy / steps;

  let x = x1;
  let y = y1;

  for (let i = 0; i <= Math.round(steps); i++) {
    const t = i / steps; // how far along the line we are (0 to 1)
    const color = lerpColor(c1, c2, t);
    this.setPixel(Math.round(x), Math.round(y), color);
    x += xInc;
    y += yInc;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Implement triangle rasterization with barycentric interpolation + top-left rule
////////////////////////////////////////////////////////////////////////////////
Rasterizer.prototype.drawTriangle = function(v1, v2, v3) {
  const [x1, y1, c1] = v1;
  const [x2, y2, c2] = v2;
  const [x3, y3, c3] = v3;
  
  // only loop over pixels in the bounding box, not the whole screen
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      // test pixel center
      const cx = px + 0.5;
      const cy = py + 0.5;

      // compute edge functions for all 3 edges
      const e12 = edgeFunction(x1, y1, x2, y2, cx, cy);
      const e23 = edgeFunction(x2, y2, x3, y3, cx, cy);
      const e31 = edgeFunction(x3, y3, x1, y1, cx, cy);

      // check winding order so we handle both CW and CCW triangles
      const area = edgeFunction(x1, y1, x2, y2, x3, y3);
      const sign = area >= 0 ? 1 : -1;

      let inside = true;
      const edges = [
        { e: e12, ax: x1, ay: y1, bx: x2, by: y2 },
        { e: e23, ax: x2, ay: y2, bx: x3, by: y3 },
        { e: e31, ax: x3, ay: y3, bx: x1, by: y1 },
      ];

      for (const { e, ax, ay, bx, by } of edges) {
        const signedE = e * sign;
        if (signedE < 0) {
          inside = false;
          break;
        }

        if (signedE === 0) {
          // pixel is exactly on this edge: apply top-left rule
          const eax = sign > 0 ? ax : bx;
          const eay = sign > 0 ? ay : by;
          const ebx = sign > 0 ? bx : ax;
          const eby = sign > 0 ? by : ay;
          if (!isTopOrLeftEdge(eax, eay, ebx, eby)) {
            inside = false;
            break;
          }
        }
      }

      if (!inside) continue;

      // interpolate color using barycentric coordinates
      const [l1, l2, l3] = barycentricCoordinates(x1, y1, x2, y2, x3, y3, cx, cy);

      const color = [
        l1 * c1[0] + l2 * c2[0] + l3 * c3[0],
        l1 * c1[1] + l2 * c2[1] + l3 * c3[1],
        l1 * c1[2] + l2 * c2[2] + l3 * c3[2],
      ];

      this.setPixel(px, py, color);
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////
// Yellow Smiley face
const DEF_INPUT = [
  // face: yellow square made of 2 triangles
  "v,10,10,1.0,0.9,0.0;",
  "v,52,52,1.0,0.9,0.0;",
  "v,52,10,1.0,0.9,0.0;",
  "v,10,52,1.0,0.9,0.0;",
  "t,0,1,2;",
  "t,0,3,1;",

  // left eye
  "v,20,20,0.1,0.1,0.1;",
  "v,25,20,0.1,0.1,0.1;",
  "v,22,26,0.1,0.1,0.1;",
  "t,4,5,6;",

  // right eye
  "v,37,20,0.1,0.1,0.1;",
  "v,42,20,0.1,0.1,0.1;",
  "v,39,26,0.1,0.1,0.1;",
  "t,7,8,9;",

  // mouth: triangle pointing down
  "v,20,38,1.0,0.5,0.0;",
  "v,31,46,1.0,0.5,0.0;",
  "v,42,38,1.0,0.5,0.0;",
  "t,10,11,12;",

  // outline using lines
  "v,10,10,0.8,0.6,0.0;",
  "v,52,10,0.8,0.6,0.0;",
  "v,52,52,0.8,0.6,0.0;",
  "v,10,52,0.8,0.6,0.0;",
  "l,13,14;",
  "l,14,15;",
  "l,15,16;",
  "l,16,13;",
].join("\n");


// DO NOT CHANGE ANYTHING BELOW HERE
export { Rasterizer, Framebuffer, DEF_INPUT };

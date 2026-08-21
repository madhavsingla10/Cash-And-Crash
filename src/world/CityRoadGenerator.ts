import * as THREE from 'three';

export interface CityLayout {
  mapSize: number;      // 660m
  gridSpacing: number;  // 50m
  streetWidth: number;  // 16m
  blockSize: number;    // 34m
  sidewalkWidth: number;// 3.5m
}

export class CityRoadGenerator {
  /**
   * Generates a single unified high-definition procedural road & sidewalk texture
   * strictly aligned with our map coordinates and webgpu_generator_city.html specs:
   * - Street Centers: [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250]
   * - Block Centers: [-225, -175, -125, -75, -25, 25, 75, 125, 175, 225]
   * - Wet dark asphalt with subtle grain and specular reflectivity
   * - Granite sidewalks & curbs on all blocks
   * - Double solid yellow centerlines and dashed lane dividers
   * - Crisp white edge boundary lines
   * - Full 4-way pedestrian zebra crosswalks at every street intersection
   * - Solid white stop lines
   */
  public static createRoadMaterial(layout: CityLayout): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    const size = 2048;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const { mapSize, streetWidth, blockSize } = layout;
    const halfMap = mapSize / 2; // 330m
    const scale = size / mapSize; // pixels per meter

    // 1. Base Ground: Dark Wet Asphalt (#11141b)
    ctx.fillStyle = '#11141b';
    ctx.fillRect(0, 0, size, size);

    // Paint Central Park Grass Lawn (Core |x| < 45 && |z| < 45)
    const parkMinX = (-45 + halfMap) * scale;
    const parkMaxX = (45 + halfMap) * scale;
    const parkMinY = (-45 + halfMap) * scale;
    const parkMaxY = (45 + halfMap) * scale;
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(parkMinX, parkMinY, parkMaxX - parkMinX, parkMaxY - parkMinY);

    // Paint North-East Desert Badlands & Sand Fields (x >= 45 && z <= -45)
    const desertMinX = (45 + halfMap) * scale;
    const desertMaxY = (-45 + halfMap) * scale;
    ctx.fillStyle = '#deb887';
    ctx.fillRect(desertMinX, 0, size - desertMinX, desertMaxY);

    // Subtle wet asphalt surface grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let i = 0; i < 40000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Exact Map Grid Definitions:
    const streetCoords = [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250];
    const blockCoords = [-225, -175, -125, -75, -25, 25, 75, 125, 175, 225];

    // 2. Draw Sidewalk Blocks & Curbs at exact block centers
    for (let bx of blockCoords) {
      for (let bz of blockCoords) {
        // Exclude Central Park area (Core |x| < 45 && |z| < 45)
        if (Math.abs(bx) < 45 && Math.abs(bz) < 45) continue;
        // Exclude Farmland Sector (North-East: bx > 50 && bz < -50)
        if (bx > 50 && bz < -50) continue;
        // Exclude Countryside Sector (South-East: bx > 60 && bz > 60)
        if (bx > 60 && bz > 60) continue;
        // Exclude Seaport Harbor Sector (South-West: bx < -60 && bz > 60)
        if (bx < -60 && bz > 60) continue;

        // Convert world coords to canvas coords
        const blockCenterX = (bx + halfMap) * scale;
        const blockCenterY = (bz + halfMap) * scale;
        const blockPx = (blockSize - 0.5) * scale;

        const left = blockCenterX - blockPx / 2;
        const top = blockCenterY - blockPx / 2;

        // A. Raised Granite Curb Border (#334155)
        ctx.fillStyle = '#334155';
        ctx.fillRect(left, top, blockPx, blockPx);

        // B. Granite Sidewalk Slab (#475569)
        const curbThickness = 0.4 * scale;
        ctx.fillStyle = '#475569';
        ctx.fillRect(
          left + curbThickness,
          top + curbThickness,
          blockPx - curbThickness * 2,
          blockPx - curbThickness * 2
        );

        // C. Subtle Sidewalk Paving Tiles Mortar Pattern
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.lineWidth = 1;
        const tilePx = 2.5 * scale;
        for (let tx = left + curbThickness + tilePx; tx < left + blockPx - curbThickness; tx += tilePx) {
          ctx.beginPath();
          ctx.moveTo(tx, top + curbThickness);
          ctx.lineTo(tx, top + blockPx - curbThickness);
          ctx.stroke();
        }
        for (let ty = top + curbThickness + tilePx; ty < top + blockPx - curbThickness; ty += tilePx) {
          ctx.beginPath();
          ctx.moveTo(left + curbThickness, ty);
          ctx.lineTo(left + blockPx - curbThickness, ty);
          ctx.stroke();
        }
      }
    }

    // 3. Draw Road Markings along Street Centers
    ctx.lineWidth = Math.max(1.5, 0.28 * scale);

    // A. Longitudinal North-South Streets
    for (let x of streetCoords) {
      const cx = (x + halfMap) * scale;
      const isMajor = x === 0 || Math.abs(x) === 150;

      // In Farmland territory (x >= 60), streets only run south of z = -60
      const startZ = x >= 60 ? -60 : -halfMap;
      const startY = (startZ + halfMap) * scale;

      // Outer White Shoulder Lines
      const roadHalfPx = (streetWidth / 2 - 0.6) * scale;
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - roadHalfPx, startY);
      ctx.lineTo(cx - roadHalfPx, size);
      ctx.moveTo(cx + roadHalfPx, startY);
      ctx.lineTo(cx + roadHalfPx, size);
      ctx.stroke();

      // Center Yellow Lines
      ctx.strokeStyle = '#fbbf24';
      if (isMajor) {
        // Double Solid Yellow
        const gap = 0.35 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - gap, startY);
        ctx.lineTo(cx - gap, size);
        ctx.moveTo(cx + gap, startY);
        ctx.lineTo(cx + gap, size);
        ctx.stroke();
      } else {
        // Dashed Yellow Line
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.moveTo(cx, startY);
        ctx.lineTo(cx, size);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // B. Latitudinal East-West Streets
    for (let z of streetCoords) {
      const cy = (z + halfMap) * scale;
      const isMajor = z === 0 || Math.abs(z) === 150;

      // In Farmland territory (z <= -60), streets only run west of x = 60
      const endX = z <= -60 ? 60 : halfMap;
      const endCanvasX = (endX + halfMap) * scale;

      // Outer White Shoulder Lines
      const roadHalfPx = (streetWidth / 2 - 0.6) * scale;
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, cy - roadHalfPx);
      ctx.lineTo(endCanvasX, cy - roadHalfPx);
      ctx.moveTo(0, cy + roadHalfPx);
      ctx.lineTo(endCanvasX, cy + roadHalfPx);
      ctx.stroke();

      // Center Yellow Lines
      ctx.strokeStyle = '#fbbf24';
      if (isMajor) {
        // Double Solid Yellow
        const gap = 0.35 * scale;
        ctx.beginPath();
        ctx.moveTo(0, cy - gap);
        ctx.lineTo(endCanvasX, cy - gap);
        ctx.moveTo(0, cy + gap);
        ctx.lineTo(endCanvasX, cy + gap);
        ctx.stroke();
      } else {
        // Dashed Yellow Line
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(endCanvasX, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 4. Draw Pedestrian Zebra Crosswalks & Stop Bars at Every Street Intersection
    const crosswalkOffsetPx = (streetWidth / 2 + 1.8) * scale;
    const stripeW = 0.7 * scale;
    const stripeL = 3.6 * scale;
    const numStripes = 7;

    for (let ix of streetCoords) {
      for (let iz of streetCoords) {
        // Skip farmland sector
        if (ix >= 60 && iz <= -60) continue;
        // Skip central park core
        if (Math.abs(ix) < 35 && Math.abs(iz) < 35) continue;
        // Skip perimeter out-of-bounds
        if (Math.abs(ix) >= 250 || Math.abs(iz) >= 250) continue;

        const px = (ix + halfMap) * scale;
        const py = (iz + halfMap) * scale;

        // Clear intersection junction box
        const junctionSize = (streetWidth + 1.0) * scale;
        ctx.fillStyle = '#11141b';
        ctx.fillRect(px - junctionSize / 2, py - junctionSize / 2, junctionSize, junctionSize);

        // North & South Crosswalks
        for (let sign of [-1, 1]) {
          const crosswalkY = py + sign * crosswalkOffsetPx;
          ctx.fillStyle = '#f8fafc';
          for (let s = 0; s < numStripes; s++) {
            const sx = px - ((numStripes - 1) * 1.1 * scale) / 2 + s * 1.1 * scale;
            ctx.fillRect(sx - stripeW / 2, crosswalkY - stripeL / 2, stripeW, stripeL);
          }
          // Stop Line
          ctx.fillRect(
            px - (streetWidth * 0.42 * scale),
            crosswalkY + sign * (stripeL / 2 + 1.2 * scale),
            streetWidth * 0.84 * scale,
            0.6 * scale
          );
        }

        // East & West Crosswalks
        for (let sign of [-1, 1]) {
          const crosswalkX = px + sign * crosswalkOffsetPx;
          ctx.fillStyle = '#f8fafc';
          for (let s = 0; s < numStripes; s++) {
            const sy = py - ((numStripes - 1) * 1.1 * scale) / 2 + s * 1.1 * scale;
            ctx.fillRect(crosswalkX - stripeL / 2, sy - stripeW / 2, stripeL, stripeW);
          }
          // Stop Line
          ctx.fillRect(
            crosswalkX + sign * (stripeL / 2 + 1.2 * scale),
            py - (streetWidth * 0.42 * scale),
            0.6 * scale,
            streetWidth * 0.84 * scale
          );
        }
      }
    }

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.generateMipmaps = true;
    roadTexture.minFilter = THREE.LinearMipmapLinearFilter;
    roadTexture.magFilter = THREE.LinearFilter;
    roadTexture.anisotropy = 16;

    // Return Wet Asphalt Standard Material matching webgpu_generator_city.html
    return new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.28,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
  }

  /**
   * Builds the single unified road and city ground mesh sized to the city footprint
   */
  public static createCityGround(layout: CityLayout): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(layout.mapSize, layout.mapSize);
    geo.rotateX(-Math.PI / 2);
    const mat = this.createRoadMaterial(layout);
    const ground = new THREE.Mesh(geo, mat);
    ground.position.y = 0.05;
    ground.receiveShadow = true;
    return ground;
  }
}

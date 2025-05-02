<script lang="ts">
    import type { Line } from '$lib/types';
    import { toDegrees } from '$lib/index';
  
    const line: Line = $props();
    
    const fromX = line.from.x;
    const fromY = line.from.y;
    const toX = line.to.x;
    const toY = line.to.y;
    const thickness = line.thickness;
  
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2)*1.05;
    const angle = toDegrees(Math.atan2(deltaY, deltaX));
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
  </script>
  
  <div
    class="line"
    style:width={length + 'px'}
    style:height={thickness + 'px'}
    style:left={midX + 'px'}
    style:top={midY + 'px'}
    style:transform={ 'translate(-50%, -50%) rotate('+angle+'deg)'}

  ></div>
  
  <style>
    .line {
      position: absolute;
      background-color: rgba(128, 0, 0, 0.8);
      border-radius: 4px;
      pointer-events: none;
      z-index: 8;
    }
  </style>
  
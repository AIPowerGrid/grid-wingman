import React, { useEffect, useRef } from 'react';
import { useConfig } from '../sidePanel/ConfigContext';

const AnimatedBackground: React.FC = () => {
  const { config } = useConfig();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    if (config?.theme === 'dark') {
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;      if (!ctx) return;
      // From here, ctx is CanvasRenderingContext2D

      const fontSize = 16;
      const columnWidth = fontSize * 1.2;
      const rowHeight = fontSize * 1.2;

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Matrix characters and colors
      const MATRIX_CHARACTERS = [
        'ﾊ','ﾐ','ﾋ','ｰ','ｳ','ｼ','ﾅ','ﾓ','ﾆ','ｻ','ﾜ','ﾂ','ｵ','ﾘ','ｱ','ﾎ','ﾃ','ﾏ','ｹ','ﾒ','ｴ','ｶ','ｷ','ﾑ','ﾕ','ﾗ','ｾ','ﾈ','ｽ','ﾀ','ﾇ','ﾍ','ｦ','ｲ','ｸ','ｺ','ｿ','ﾁ','ﾄ','ﾉ','ﾌ','ﾔ','ﾖ','ﾙ','ﾚ','ﾛ','ﾝ','0','1','2','3','4','5','7','8','9','Z','*','+','-','<','>','¦','|','ç','ﾘ','ｸ',
      ];
      const GREENS = ['#15803d', '#16a34a', '#22c55e', '#4ade80'];
      const WHITE = '#f0fdf4';

      // Calculate columns and rows based on canvas size
      let columns = Math.floor(canvas.width / columnWidth);
      let rows = Math.floor(canvas.height / rowHeight);

      let drops: number[] = Array(columns).fill(0);
      type TrailCell = { char: string; color: string };
      let trails: TrailCell[][] = Array(columns).fill(null).map(() => Array(rows).fill({ char: '', color: '' }));

      // Each column gets its own speed (higher = slower)
      let speeds: number[] = Array(columns)
        .fill(0)
        .map(() => Math.floor(Math.random() * 2) + 1); // random between 10 and 20 frames per step, frame lower = faster
      let columnFrames: number[] = Array(columns).fill(0);

      const TRAIL_LENGTH = 15;

      function drawMatrixRain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 0; i < columns; i++) {
          // Draw the trail for this column
          for (let j = 0; j < TRAIL_LENGTH; j++) {
            const y = drops[i] - j;
            if (y < 0) continue;
            if (y >= rows) continue;

            let cell = trails[i][y];
            if (!cell || !cell.char) continue;

            ctx.fillStyle = j === 0
              ? WHITE
              : cell.color;
            ctx.globalAlpha = 0.8 * (1 - j / TRAIL_LENGTH);
            ctx.fillText(
              cell.char,
              i * columnWidth + columnWidth / 2,
              y * rowHeight
            );
          }
          ctx.globalAlpha = 1;

          // Only increment this column's drop if its frame counter hits its speed
          columnFrames[i]++;
          if (columnFrames[i] >= speeds[i]) {
            const newChar = MATRIX_CHARACTERS[Math.floor(Math.random() * MATRIX_CHARACTERS.length)];
            const color = GREENS[Math.floor(Math.random() * GREENS.length)];
            trails[i][drops[i]] = { char: newChar, color };

            drops[i]++;
            if (drops[i] >= rows + TRAIL_LENGTH) {
              drops[i] = 0;
              trails[i] = Array(rows).fill({ char: '', color: '' });
              speeds[i] = Math.floor(Math.random() * 10) + 10;
            }
            columnFrames[i] = 0;
          }
        }

        requestAnimationFrame(drawMatrixRain);
      }

      drawMatrixRain();

      // Handle resize
      const handleResize = () => {
        resizeCanvas();
        columns = Math.floor(canvas.width / columnWidth);
        rows = Math.floor(canvas.height / rowHeight);
        drops = Array(columns).fill(0);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('resize', handleResize);
        container.removeChild(canvas);
      };
    } else {
      // Bouncing Balls Effect
      const colors = ['#3CC157', '#2AA7FF', '#1B1B1B', '#FCBC0F', '#F85F36'];
      const numBalls = 50;
      const balls: HTMLDivElement[] = [];

      for (let i = 0; i < numBalls; i++) {
        const ball = document.createElement('div');
        ball.classList.add('ball');
        ball.style.background = colors[Math.floor(Math.random() * colors.length)];
        ball.style.left = `${Math.floor(Math.random() * 100)}vw`;
        ball.style.top = `${Math.floor(Math.random() * 100)}vh`;
        ball.style.transform = `scale(${Math.random()})`;
        ball.style.width = `${Math.random()}em`;
        ball.style.height = ball.style.width;

        balls.push(ball);
        container.appendChild(ball);
      }

      balls.forEach((el, i) => {
        const to = {
          x: Math.random() * (i % 2 === 0 ? -11 : 11),
          y: Math.random() * 12,
        };

        el.animate(
          [
            { transform: 'translate(0, 0)' },
            { transform: `translate(${to.x}rem, ${to.y}rem)` },
          ],
          {
            duration: (Math.random() + 1) * 2000, // random duration
            direction: 'alternate',
            fill: 'both',
            iterations: Infinity,
            easing: 'ease-in-out',
          }
        );
      });

      return () => {
        balls.forEach((ball) => container.removeChild(ball));
      };
    }
  }, [config?.theme]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

export default AnimatedBackground;
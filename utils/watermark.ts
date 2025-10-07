

export const addImageWatermark = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // New SVG containing both the logo and the app name "Z-Ai".
    // It is designed to be placed as a single, large, centered block.
    // Opacity is set to 0.25 to be noticeable but not too intrusive.
    const logoSvgString = `
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <g fill="white" opacity="0.25">
            <!-- Centered Crystal Logo, scaled up -->
            <path transform="translate(42, 10) scale(1.5)" d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47Z" />
            <!-- Centered Text Below Logo -->
            <text x="60" y="95" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle">Z-Ai</text>
        </g>
      </svg>
    `;

    const mainImage = new Image();
    mainImage.src = base64Image;

    mainImage.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      canvas.width = mainImage.width;
      canvas.height = mainImage.height;
      ctx.drawImage(mainImage, 0, 0);

      const svgBlob = new Blob([logoSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const logoImage = new Image();

      logoImage.onload = () => {
        try {
            // --- New Sizing and Positioning Logic ---
            // Make the watermark large: 40% of the image's shortest side.
            const watermarkSize = Math.min(canvas.width, canvas.height) * 0.4;
            
            // Calculate coordinates to center the watermark on the canvas.
            const x = (canvas.width - watermarkSize) / 2;
            const y = (canvas.height - watermarkSize) / 2;
            
            // Draw the watermark image (from the SVG) onto the canvas.
            ctx.drawImage(logoImage, x, y, watermarkSize, watermarkSize);
            
            const mimeType = base64Image.substring(5, base64Image.indexOf(';'));
            resolve(canvas.toDataURL(mimeType));
        } finally {
            // Clean up the object URL.
            URL.revokeObjectURL(url);
        }
      };

      logoImage.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load watermark SVG logo'));
      };

      logoImage.src = url;
    };

    mainImage.onerror = () => {
      reject(new Error('Failed to load image for watermarking'));
    };
  });
};
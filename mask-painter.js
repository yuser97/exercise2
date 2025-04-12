registerPaint('maskPainter', class {
    static get inputProperties() { return ['--hole-positions']; }
    
    paint(ctx, size, properties) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size.width, size.height);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'white';
        
        const holePositions = JSON.parse(properties.get('--hole-positions').toString() || '[]');
        
        holePositions.forEach(hole => {
            ctx.fillRect(hole.x, hole.y, hole.width, hole.height);
        });
    }
});


// mask-painter.js
registerPaint('maskPainter', class {
    static get inputProperties() { return ['--hole-positions']; }
    
    paint(ctx, size, properties) {
        // Заливаем черным (это будет непрозрачная часть маски)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size.width, size.height);
        
        // Делаем дыры прозрачными
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'white';
        
        // Получаем позиции дыр из CSS переменной
        const holePositions = JSON.parse(properties.get('--hole-positions').toString() || '[]');
        
        // Рисуем прозрачные прямоугольники в указанных позициях
        holePositions.forEach(hole => {
            ctx.fillRect(hole.x, hole.y, hole.width, hole.height);
        });
    }
});


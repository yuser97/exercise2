document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const VIDEO_DEBOUNCE = 200;
    const CHECK_DEBOUNCE = 150;
    const LONG_TASK_THRESHOLD = 100;

    // Инициализация элементов
    const video = document.getElementById('video-bg');
    const textContainer = document.querySelector('.text-container');
    const bigGaps = document.querySelectorAll('.big-gap');
    
    // Создание маски
    const mask = document.createElement('div');
    mask.className = 'mask';
    document.body.insertBefore(mask, textContainer);

    // Оптимизированный debounce с мониторингом
    function debounce(func, timeout = 100, name = 'anonymous') {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const start = performance.now();
                func.apply(this, args);
                const duration = performance.now() - start;
                
                if (duration > LONG_TASK_THRESHOLD) {
                    console.warn(`[Perf] ${name} took ${duration.toFixed(1)}ms`);
                }
            }, timeout);
        };
    }

    // Обновление позиций отверстий
    function updateHolePositions() {
        const holePositions = [];
        for (const gap of bigGaps) {
            const rect = gap.getBoundingClientRect();
            holePositions.push({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            });
        }
        mask.style.setProperty('--hole-positions', JSON.stringify(holePositions));
    }

    // Инициализация Paint Worklet
    if ('paintWorklet' in CSS) {
        CSS.paintWorklet.addModule('mask-painter.js')
            .then(() => {
                updateHolePositions();
                const debouncedUpdate = debounce(updateHolePositions, VIDEO_DEBOUNCE, 'updateHoles');
                window.addEventListener('resize', debouncedUpdate);
                window.addEventListener('scroll', debouncedUpdate);
            })
            .catch(handlePaintError);
    } else {
        handlePaintError();
    }

    function handlePaintError(e) {
        console.error('Paint Worklet failed:', e);
        mask.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }

    // Адаптация видео
    const optimizedResizeVideo = debounce(() => {
        video.style.width = '100%';
        video.style.height = 'auto';
        
        if (video.offsetHeight < window.innerHeight) {
            video.style.height = '100%';
            video.style.width = 'auto';
        }
    }, VIDEO_DEBOUNCE, 'resizeVideo');

    window.addEventListener('resize', optimizedResizeVideo);
    optimizedResizeVideo();

    // Управление видео
    video.muted = true;
    video.playsInline = true;
    video.play()
        .then(() => console.debug('Video autoplay successful'))
        .catch(e => console.info('Autoplay blocked:', e.message));

    // Проверка переноса текста
    function checkTextWrapping() {
        const textParts = document.querySelectorAll('.text-part');
        let prevBottom = -Infinity;
        const tolerance = 5;
        const windowHeight = window.innerHeight;

        for (let i = 0; i < textParts.length; i++) {
            const part = textParts[i];
            const rect = part.getBoundingClientRect();
            
            if (rect.top - prevBottom > tolerance) {
                part.classList.add('check');
            } else {
                part.classList.remove('check');
            }
            
            prevBottom = rect.bottom;
            if (rect.top > windowHeight) break;
        }
        
        checkLines();
    }

    // Управление gapcheck элементами
    function checkLines() {
        try {
            const checks = document.querySelectorAll('.check');
            const gaps = document.querySelectorAll('.big-gap-check');
            
            if (!gaps.length) return;

            // Сброс состояния
            for (const gap of gaps) {
                gap.style.display = 'none';
            }

            // Обновление по условиям
            if (checks.length >= 7 && gaps.length >= 3) {
                for (const gap of gaps) gap.style.display = 'block';
            } else if (checks.length >= 6 && gaps.length >= 3) {
                gaps[2].style.display = 'block';
                gaps[1].style.display = 'block';
            } else if (checks.length >= 5 && gaps.length >= 2) {
                gaps[1].style.display = 'block';
            }
        } catch (e) {
            console.error('CheckLines error:', e);
        }
    }

    // Оптимизированный обработчик изменений
    const mutationHandler = debounce(() => {
        requestAnimationFrame(() => {
            checkTextWrapping();
            checkLines();
        });
    }, CHECK_DEBOUNCE, 'mutationHandler');

    const observer = new MutationObserver(mutations => {
        const hasRelevantChanges = mutations.some(mutation => 
            mutation.type === 'attributes' || 
            mutation.addedNodes.length > 0
        );
        
        if (hasRelevantChanges) mutationHandler();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    // Первоначальная инициализация
    checkTextWrapping();
    checkLines();
});


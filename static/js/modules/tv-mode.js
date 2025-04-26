/**
 * Модуль TV-режима навигации
 * Позволяет использовать клавиши направления для перемещения между элементами 
 * интерфейса без видимого курсора, как в приложениях для Smart TV
 */
const TVMode = {
    isActive: false,
    currentElement: null,
    focusableElements: [],
    
    // Инициализация модуля
    init: function() {
        // Создаем переключатель режима в верхней панели
        this.createTVModeToggle();
        
        // Инициализируем обработчики клавиш
        this.initKeyHandlers();
        
        // Инициализируем обработчики движения мыши
        this.initMouseHandlers();
        
        // Проверяем сохраненное состояние режима
        this.checkSavedState();
    },
    
    // Создание переключателя режима в верхней панели
    createTVModeToggle: function() {
        // Находим верхнюю панель инструментов
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;
        
        // Создаем обертку для переключателя TV-режима
        const tvModeWrapper = document.createElement('div');
        tvModeWrapper.className = 'tv-mode-wrapper';
        tvModeWrapper.innerHTML = `
            <div class="tv-mode-toggle">
                <div class="toggle-label-text">
                    <span data-i18n="tv_mode">TV-режим</span>
                </div>
                <div class="toggle-switch">
                    <input type="checkbox" id="tv-mode-toggle" class="toggle-input">
                    <label for="tv-mode-toggle" class="toggle-label"></label>
                </div>
            </div>
        `;
        
        // Вставляем переключатель в начало панели инструментов
        toolbar.insertBefore(tvModeWrapper, toolbar.firstChild);
        
        // Добавляем обработчик для переключателя
        const toggleInput = document.getElementById('tv-mode-toggle');
        if (toggleInput) {
            toggleInput.addEventListener('change', (e) => {
                this.toggleTVMode(e.target.checked);
            });
        }
        
        // Инструкции переносим в нижнюю часть страницы, где они будут видны при активации режима
        const instructionsElem = document.createElement('div');
        instructionsElem.className = 'tv-mode-instructions';
        instructionsElem.innerHTML = `
            <p>
                <i class="fa-solid fa-circle-info"></i>
                <span data-i18n="tv_mode_instructions">Используйте клавиши стрелок для навигации и Enter для выбора</span>
            </p>
            <p>
                <i class="fa-solid fa-check-circle"></i>
                <span data-i18n="all_elements_accessible">Все элементы интерфейса доступны для навигации, включая крестики закрытия</span>
            </p>
        `;
        document.body.appendChild(instructionsElem);
        
        // Применяем переводы
        if (typeof loadTranslations === 'function') {
            loadTranslations();
        }
    },
    
    // Обработчики клавиш навигации
    initKeyHandlers: function() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateDirection('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateDirection('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateDirection('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateDirection('right');
                    break;
                case 'Enter':
                case ' ': // Пробел
                    e.preventDefault();
                    this.activateCurrentElement();
                    break;
                case 'Escape':
                    // Выход из TV-режима по нажатию Escape
                    this.toggleTVMode(false);
                    const toggleInput = document.getElementById('tv-mode-toggle');
                    if (toggleInput) toggleInput.checked = false;
                    break;
            }
        });

        // Обработчик изменений DOM для отслеживания открытия/закрытия модальных окон
        const observer = new MutationObserver((mutations) => {
            if (!this.isActive) return;
            
            let shouldRefresh = false;
            
            mutations.forEach(mutation => {
                if (mutation.target.classList && 
                    (mutation.target.classList.contains('modal') || 
                     mutation.target.closest('.modal'))) {
                    shouldRefresh = true;
                }
                
                // Проверяем изменения стилей display
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    mutation.target.style && 
                    mutation.target.style.display !== undefined) {
                    shouldRefresh = true;
                }
            });
            
            if (shouldRefresh) {
                // Немного задержки, чтобы DOM успел обновиться
                setTimeout(() => {
                    this.refreshFocusableElements();
                    
                    // Если открыто модальное окно, фокусируемся на первом элементе в нем
                    const openModal = document.querySelector('.modal[style*="display: block"]');
                    if (openModal) {
                        const modalElements = this.focusableElements.filter(item => 
                            item.element.closest('.modal') === openModal
                        );
                        
                        if (modalElements.length > 0) {
                            this.setFocus(modalElements[0].element);
                        }
                    } else {
                        // Если модальных окон нет, и нет текущего элемента, сбрасываем на первый
                        if (!this.currentElement) {
                            this.focusFirstElement();
                        }
                    }
                }, 100);
            }
        });
        
        // Отслеживаем изменения в DOM
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'class']
        });
    },
    
    // Обработчики движения мыши для навигации
    initMouseHandlers: function() {
        // Состояние мыши
        let lastMouseX = 0;
        let lastMouseY = 0;
        let isMoving = false;
        let lastMoveTime = 0;
        let moveThreshold = 30; // Минимальное расстояние движения для срабатывания
        let directionDelay = 300; // Задержка между обработкой направлений (мс)
        let speedThreshold = 0.5; // Минимальная скорость для определения преднамеренного движения (px/ms)
        let mouseActivityTimeout = null;
        
        // Первичная инициализация позиции мыши
        document.addEventListener('mouseenter', (e) => {
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            lastMoveTime = Date.now();
        });
        
        // Обработчик движения мыши
        document.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;
            
            // Добавляем класс для отображения специального курсора при движении
            document.body.classList.add('mouse-moving');
            
            // Сбрасываем таймер скрытия курсора
            clearTimeout(mouseActivityTimeout);
            mouseActivityTimeout = setTimeout(() => {
                document.body.classList.remove('mouse-moving');
            }, 1500);
            
            const currentTime = Date.now();
            const timeElapsed = currentTime - lastMoveTime;
            
            // Если прошло слишком мало времени, игнорируем
            if (timeElapsed < 20) {
                return;
            }
            
            // Если уже обрабатываем движение и не прошло достаточно времени
            if (isMoving && (timeElapsed < directionDelay)) {
                return;
            }
            
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            // Вычисляем скорость движения мыши (пикселей в миллисекунду)
            const speedX = Math.abs(deltaX) / timeElapsed;
            const speedY = Math.abs(deltaY) / timeElapsed;
            
            // Проверяем, достаточно ли существенное и быстрое движение для срабатывания
            if ((Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) &&
                (speedX > speedThreshold || speedY > speedThreshold)) {
                
                // Направление до движения
                let oldDirection = '';
                
                // Определяем основное направление движения
                let newDirection = '';
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Горизонтальное движение
                    if (deltaX > 0) {
                        newDirection = 'right';
                        this.navigateDirection('right');
                    } else {
                        newDirection = 'left';
                        this.navigateDirection('left');
                    }
                } else {
                    // Вертикальное движение
                    if (deltaY > 0) {
                        newDirection = 'down';
                        this.navigateDirection('down');
                    } else {
                        newDirection = 'up';
                        this.navigateDirection('up');
                    }
                }
                
                // Добавляем визуальную обратную связь
                if (this.currentElement) {
                    this.currentElement.classList.add('tv-direction-change');
                    setTimeout(() => {
                        if (this.currentElement) {
                            this.currentElement.classList.remove('tv-direction-change');
                        }
                    }, 200);
                }
                
                // Обновляем состояние
                isMoving = true;
                lastMoveTime = currentTime;
            }
            
            // Сохраняем позицию мыши для следующего сравнения
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        // Сбрасываем флаг движения при остановке мыши
        let mouseStopTimer;
        document.addEventListener('mousemove', () => {
            clearTimeout(mouseStopTimer);
            mouseStopTimer = setTimeout(() => {
                isMoving = false;
            }, 100);
        });
        
        // Показываем специальный курсор при наведении на элементы управления
        document.addEventListener('mouseover', (e) => {
            if (!this.isActive) return;
            
            // Проверяем, наведена ли мышь на интерактивный элемент
            const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            
            if (interactiveElements.includes(e.target.tagName) || 
                e.target.classList.contains('menu-item') ||
                e.target.classList.contains('file-card') ||
                e.target.classList.contains('btn-primary') ||
                e.target.classList.contains('btn-secondary') ||
                e.target.classList.contains('btn-success') ||
                e.target.classList.contains('btn-danger')) {
                
                document.body.classList.add('mouse-moving');
                
                // Если наводим на интерактивный элемент, ставим на него фокус
                // Но только если он входит в список фокусируемых
                const focusableItem = this.focusableElements.find(item => item.element === e.target);
                if (focusableItem && focusableItem.element !== this.currentElement) {
                    this.setFocus(focusableItem.element);
                }
            }
        });
        
        // Обработчик клика мыши для активации текущего элемента
        document.addEventListener('click', (e) => {
            if (!this.isActive) return;
            
            // При клике мыши в режиме TV активируем текущий элемент в фокусе
            if (this.currentElement) {
                // Если клик был на текущем элементе, позволяем стандартной обработке клика
                if (e.target === this.currentElement || this.currentElement.contains(e.target)) {
                    return;
                }
                
                // Иначе предотвращаем стандартное поведение и активируем текущий элемент
                e.preventDefault();
                e.stopPropagation();
                this.activateCurrentElement();
            }
        });
    },
    
    // Проверка сохраненного состояния режима
    checkSavedState: function() {
        const savedState = localStorage.getItem('tvModeActive') === 'true';
        if (savedState) {
            const toggleInput = document.getElementById('tv-mode-toggle');
            if (toggleInput) toggleInput.checked = true;
            this.toggleTVMode(true);
        }
    },
    
    // Включение/выключение TV-режима
    toggleTVMode: function(enable) {
        this.isActive = enable;
        localStorage.setItem('tvModeActive', enable);
        
        if (enable) {
            document.body.classList.add('tv-mode-active');
            this.refreshFocusableElements();
            this.focusFirstElement();
            
            // Скрываем курсор
            document.documentElement.style.cursor = 'none';
            
            // Показываем инструкции (теперь они появляются автоматически через CSS)
        } else {
            document.body.classList.remove('tv-mode-active');
            this.clearFocus();
            
            // Возвращаем курсор
            document.documentElement.style.cursor = '';
            
            // Скрываем инструкции (теперь они скрываются автоматически через CSS)
        }
    },
    
    // Обновление списка доступных для навигации элементов
    refreshFocusableElements: function() {
        // Собираем все интерактивные элементы страницы
        const selectors = [
            'a', 'button', 'input', 'select', 'textarea',
            '[role="button"]', '[tabindex]', '.menu-item',
            '.file-card', '.movie-card', '.note-card',
            '.btn-primary', '.btn-secondary', '.btn-success', '.btn-danger',
            // Добавляем все возможные кнопки закрытия и мелкие элементы управления
            '.close-modal', '.close', '.close-sidebar', '.close-notification',
            '.close-search-results', '#close-preview', '#close-movie-modal',
            '#close-watch-movie-modal', '.toggle-label', 
            '.language-option', '.file-actions a', '.note-edit-btn', '.note-delete-btn',
            '.sort-options select', '.mobile-menu-button', '.torrent-get-link',
            '.magnet-link', '.torrent-link', '.source-link', '.logout-link',
            '.btn-copy', '.btn-sm', '.btn-add'
        ];
        
        this.focusableElements = Array.from(document.querySelectorAll(selectors.join(',')))
            .filter(el => {
                // Исключаем скрытые и отключенные элементы
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       !el.hasAttribute('disabled') &&
                       !el.closest('.hidden') &&
                       !el.closest('[style*="display: none"]');
            })
            .map(el => {
                // Сохраняем информацию о позиции элемента
                const rect = el.getBoundingClientRect();
                return {
                    element: el,
                    rect: rect,
                    center: {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    }
                };
            });
    },
    
    // Выбор первого доступного элемента
    focusFirstElement: function() {
        if (this.focusableElements.length > 0) {
            this.setFocus(this.focusableElements[0].element);
        }
    },
    
    // Очистка фокуса
    clearFocus: function() {
        if (this.currentElement) {
            this.currentElement.classList.remove('tv-focus');
            this.currentElement.classList.remove('tv-focus-small'); // Удаляем класс для маленьких элементов
            this.currentElement = null;
        }
    },
    
    // Установка фокуса на элемент
    setFocus: function(element) {
        this.clearFocus();
        
        element.classList.add('tv-focus');
        this.currentElement = element;
        
        // Добавляем специальный класс для маленьких элементов, таких как крестики закрытия
        const smallElements = [
            '.close-modal', '.close', '.close-sidebar', '.close-notification',
            '.close-search-results', '#close-preview', '#close-movie-modal',
            '#close-watch-movie-modal'
        ];
        
        // Проверяем, является ли элемент маленьким элементом или содержит его
        const isSmallElement = smallElements.some(selector => {
            return element.matches(selector) || element.querySelector(selector);
        });
        
        // Если это маленький элемент, добавляем класс для усиления видимости
        if (isSmallElement || element.clientWidth < 40 || element.clientHeight < 40) {
            element.classList.add('tv-focus-small');
        }
        
        // Прокрутка к элементу, если он не полностью видим
        this.scrollToElement(element);
    },
    
    // Прокрутка к элементу, если он не видим полностью
    scrollToElement: function(element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = 
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth;
        
        if (!isInViewport) {
            // Плавно прокручиваем к элементу
            element.scrollIntoView({
                behavior: 'smooth', 
                block: 'nearest'
            });
        }
    },
    
    // Активация текущего элемента (симуляция клика)
    activateCurrentElement: function() {
        if (!this.currentElement) return;
        
        // Добавляем временную анимацию нажатия
        this.currentElement.classList.add('tv-active');
        setTimeout(() => {
            this.currentElement.classList.remove('tv-active');
        }, 200);
        
        // Имитируем клик
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        this.currentElement.dispatchEvent(event);
    },
    
    // Навигация в указанном направлении
    navigateDirection: function(direction) {
        if (!this.currentElement || this.focusableElements.length === 0) {
            this.refreshFocusableElements();
            this.focusFirstElement();
            return;
        }
        
        // Обновляем список элементов, если видимые элементы могли измениться
        this.refreshFocusableElements();
        
        // Находим текущий элемент в списке
        const currentInfo = this.focusableElements.find(
            item => item.element === this.currentElement
        );
        
        if (!currentInfo) {
            this.focusFirstElement();
            return;
        }
        
        // Находим ближайший элемент в нужном направлении
        const nextElement = this.findClosestInDirection(currentInfo, direction);
        
        if (nextElement) {
            this.setFocus(nextElement.element);
        }
    },
    
    // Поиск ближайшего элемента в указанном направлении
    findClosestInDirection: function(currentItem, direction) {
        // Фильтруем элементы в нужном направлении от текущего
        let candidates = [];
        
        switch (direction) {
            case 'up':
                candidates = this.focusableElements.filter(item => 
                    item !== currentItem && 
                    item.center.y < currentItem.center.y
                );
                break;
            case 'down':
                candidates = this.focusableElements.filter(item => 
                    item !== currentItem && 
                    item.center.y > currentItem.center.y
                );
                break;
            case 'left':
                candidates = this.focusableElements.filter(item => 
                    item !== currentItem && 
                    item.center.x < currentItem.center.x
                );
                break;
            case 'right':
                candidates = this.focusableElements.filter(item => 
                    item !== currentItem && 
                    item.center.x > currentItem.center.x
                );
                break;
        }
        
        if (candidates.length === 0) return null;
        
        // Вычисляем расстояние до каждого элемента
        candidates.forEach(item => {
            // Учитываем направление при вычислении расстояния
            // Даем больший вес элементам, которые лучше соответствуют направлению
            let distX = item.center.x - currentItem.center.x;
            let distY = item.center.y - currentItem.center.y;
            
            // Базовое евклидово расстояние
            let distance = Math.sqrt(distX * distX + distY * distY);
            
            // Модифицируем расстояние в зависимости от направления
            switch (direction) {
                case 'up':
                case 'down':
                    // Даем приоритет вертикальному выравниванию
                    distance = distance + Math.abs(distX) * 0.5;
                    break;
                case 'left':
                case 'right':
                    // Даем приоритет горизонтальному выравниванию
                    distance = distance + Math.abs(distY) * 0.5;
                    break;
            }
            
            item.distance = distance;
        });
        
        // Сортируем по расстоянию
        candidates.sort((a, b) => a.distance - b.distance);
        
        // Возвращаем ближайший элемент
        return candidates[0];
    }
};

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    TVMode.init();
}); 
// Главный файл приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('Загрузка приложения...');
    
    // Глобальные DOM элементы
    const filesContainer = document.getElementById('files-container');
    const notesContainer = document.querySelector('.notes-container');
    const moviesContainer = document.getElementById('movies-container');
    const movieSearchContainer = document.getElementById('movie-search-container');
    const sidebar = document.querySelector('.sidebar');
    const cloudModule = document.getElementById('cloud-module');
    const moviesModule = document.getElementById('movies-module');
    const notesMenu = document.getElementById('notes-menu');
    const cloudMenu = document.querySelector('.cloud-menu');
    const moviesMenu = document.querySelector('.movies-menu');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const closeSidebarButton = document.querySelector('.close-sidebar');
    const logo = document.querySelector('.logo h2');
    const mobileLogo = document.querySelector('.mobile-logo');
    
    // Переменные для модальных окон
    const previewModal = document.getElementById('preview-modal');
    const closePreview = document.getElementById('close-preview');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const addLinkModal = document.getElementById('add-link-modal');
    const addLinkButton = document.getElementById('add-link-button');
    const saveLinkBtn = document.getElementById('save-link');
    const cancelLinkBtn = document.getElementById('cancel-link');
    const closeAddLinkBtn = document.querySelector('#add-link-modal .close-modal');
    
    // Глобальные переменные
    let currentModule = 'cloud';
    
    // Вспомогательные функции
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    function showNotification(message, type = 'info') {
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    // Функции переключения модулей
    function switchModule(moduleName) {
        console.log('Переключение на модуль:', moduleName);
        
        // Полностью скрываем все контейнеры, устанавливая display: none
        filesContainer.classList.add('hidden');
        filesContainer.style.display = 'none';
        notesContainer.classList.add('hidden');
        moviesContainer.classList.add('hidden');
        movieSearchContainer.classList.add('hidden');
        
        // Скрываем все меню
        cloudMenu.classList.add('hidden');
        moviesMenu.classList.add('hidden');
        
        // Убираем активный класс со всех элементов модуля
        document.querySelectorAll('[data-module]').forEach(item => {
            item.classList.remove('active');
        });
        
        notesMenu.classList.remove('active');
        
        // Устанавливаем новый активный модуль
        currentModule = moduleName;
        
        // Показываем соответствующий контейнер и устанавливаем активный класс
        switch (moduleName) {
            case 'cloud':
                filesContainer.classList.remove('hidden');
                filesContainer.style.display = '';
                cloudModule.classList.add('active');
                cloudMenu.classList.remove('hidden');
                
                if (typeof CloudModule !== 'undefined') {
                    CloudModule.loadFiles();
                } else {
                    console.error('CloudModule не найден!');
                    filesContainer.innerHTML = '<div class="loading error"><i class="fa-solid fa-circle-exclamation"></i> Ошибка загрузки модуля Cloud</div>';
                }
                break;
                
            case 'movies':
                moviesContainer.classList.remove('hidden');
                moviesModule.classList.add('active');
                moviesMenu.classList.remove('hidden');
                
                if (typeof MoviesModule !== 'undefined') {
                    MoviesModule.init();
                } else {
                    console.error('MoviesModule не найден!');
                    moviesContainer.innerHTML = '<div class="loading error"><i class="fa-solid fa-circle-exclamation"></i> Ошибка загрузки модуля Movies</div>';
                }
                break;
                
            case 'movie-search':
                movieSearchContainer.classList.remove('hidden');
                moviesModule.classList.add('active');
                moviesMenu.classList.remove('hidden');
                
                // Устанавливаем активный класс на пункт меню "Поиск фильмов"
                document.querySelectorAll('.menu-item[data-movie-filter]').forEach(item => item.classList.remove('active'));
                document.getElementById('movie-search-menu').classList.add('active');
                
                // Фокусируемся на поле ввода
                setTimeout(() => {
                    const searchInput = document.getElementById('movie-search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
                break;
                
            case 'notes':
                notesContainer.classList.remove('hidden');
                notesMenu.classList.add('active');
                cloudMenu.classList.remove('hidden'); // Показываем меню облака для заметок
                
                if (typeof NotesModule !== 'undefined') {
                    NotesModule.init();
                } else {
                    console.error('NotesModule не найден!');
                    notesContainer.innerHTML = '<div class="loading error"><i class="fa-solid fa-circle-exclamation"></i> Ошибка загрузки модуля Notes</div>';
                }
                break;
        }
        
        // Закрываем боковую панель на мобильных устройствах
        closeSidebar();
    }
    
    function goToAllFiles() {
        console.log('Переход ко всем файлам');
        
        // Переключаемся на модуль облака
        switchModule('cloud');
        
        // Устанавливаем активную категорию
        let allFilesMenuItem = document.querySelector('[data-category="all"]');
        if (allFilesMenuItem) {
            document.querySelectorAll('.menu-item[data-category]').forEach(item => item.classList.remove('active'));
            allFilesMenuItem.classList.add('active');
            
            if (typeof CloudModule !== 'undefined') {
                CloudModule.state.currentCategory = 'all';
                CloudModule.loadFiles();
            }
        }
    }
    
    // Функции для мобильного меню
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
    }
    
    // Функции для модальных окон
    function addLink() {
        const title = document.getElementById('link-title').value.trim();
        const url = document.getElementById('link-url').value.trim();
        const description = document.getElementById('link-description').value.trim();
        
        if (!title) {
            showNotification(t('link_title_required'), 'error');
            return;
        }
        
        if (!url) {
            showNotification(t('link_url_required'), 'error');
            return;
        }
        
        if (!isValidURL(url)) {
            showNotification(t('invalid_url'), 'error');
            return;
        }
        
        const linkData = {
            title: title,
            url: url,
            description: description
        };
        
        fetch('/add_link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(linkData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addLinkModal.style.display = 'none';
                showNotification(t('link_added_success'), 'success');
                
                if (typeof CloudModule !== 'undefined') {
                    CloudModule.loadFiles();
                }
                
                if (typeof Utils !== 'undefined' && Utils.loadStats) {
                    Utils.loadStats();
                }
            } else {
                showNotification(data.error || t('link_add_error'), 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при добавлении ссылки:', error);
            showNotification(t('link_add_error_generic'), 'error');
        });
    }
    
    // Инициализация обработчиков событий
    function initEventListeners() {
        console.log('Инициализация обработчиков событий');
        
        // Обработчики для переключения между модулями
        if (cloudModule) {
            cloudModule.addEventListener('click', function() {
                switchModule('cloud');
            });
        }
        
        if (moviesModule) {
            moviesModule.addEventListener('click', function() {
                switchModule('movies');
            });
        }
        
        if (notesMenu) {
            notesMenu.addEventListener('click', function() {
                switchModule('notes');
            });
        }
        
        // Обработчики для категорий файлов
        document.querySelectorAll('.menu-item[data-category]').forEach(item => {
            item.addEventListener('click', function() {
                // Если мы не в модуле облака, переключаемся на него
                if (currentModule !== 'cloud') {
                    switchModule('cloud');
                }
                
                // Устанавливаем активную категорию
                document.querySelectorAll('.menu-item[data-category]').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Обновляем текущую категорию и загружаем файлы
                if (typeof CloudModule !== 'undefined') {
                    CloudModule.state.currentCategory = item.getAttribute('data-category');
                    CloudModule.loadFiles();
                }
            });
        });
        
        // Обработчики для фильтров фильмов
        document.querySelectorAll('.menu-item[data-movie-filter]').forEach(item => {
            item.addEventListener('click', function() {
                // Если мы не в модуле фильмов, переключаемся на него
                if (currentModule !== 'movies') {
                    switchModule('movies');
                }
                
                // Устанавливаем активный фильтр
                document.querySelectorAll('.menu-item[data-movie-filter]').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Обновляем текущий фильтр и загружаем фильмы
                if (typeof MoviesModule !== 'undefined') {
                    MoviesModule.state.currentMovieFilter = item.getAttribute('data-movie-filter');
                    MoviesModule.loadMovies();
                }
            });
        });
        
        // Обработчик для "Поиск фильмов"
        const movieSearchMenu = document.getElementById('movie-search-menu');
        if (movieSearchMenu) {
            movieSearchMenu.addEventListener('click', function() {
                // Переключаемся на модуль поиска фильмов
                switchModule('movie-search');
            });
        }
        
        // Обработчик кнопки поиска фильмов
        const movieSearchButton = document.getElementById('movie-search-button');
        if (movieSearchButton) {
            movieSearchButton.addEventListener('click', function() {
                const searchInput = document.getElementById('movie-search-input');
                if (searchInput && searchInput.value.trim().length >= 2) {
                    searchMovies(searchInput.value.trim());
                } else {
                    showNotification(t('min_search_chars'), 'warning');
                }
            });
        }
        
        // Обработчик поля ввода поиска фильмов (для Enter)
        const movieSearchInput = document.getElementById('movie-search-input');
        if (movieSearchInput) {
            movieSearchInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    if (this.value.trim().length >= 2) {
                        searchMovies(this.value.trim());
                    } else {
                        showNotification(t('min_search_chars'), 'warning');
                    }
                }
            });
        }
        
        // Функция поиска фильмов
        function searchMovies(query) {
            const resultsContainer = document.querySelector('.movie-search-results-list');
            if (!resultsContainer) return;
            
            resultsContainer.innerHTML = '<div class="search-loading"><i class="fa-solid fa-spinner fa-spin"></i> ' + t('searching_movies') + '</div>';
            
            if (typeof MoviesModule !== 'undefined' && MoviesModule.searchMovies) {
                MoviesModule.searchMoviesInline(query, resultsContainer);
            } else {
                resultsContainer.innerHTML = '<div class="search-empty">' + t('module_loading_error') + '</div>';
            }
        }
        
        // Обработчики для логотипов
        if (logo) {
            logo.addEventListener('click', goToAllFiles);
            logo.style.cursor = 'pointer';
        }
        
        if (mobileLogo) {
            mobileLogo.addEventListener('click', goToAllFiles);
        }
        
        // Обработчики для мобильного меню
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', toggleSidebar);
        }
        
        if (closeSidebarButton) {
            closeSidebarButton.addEventListener('click', closeSidebar);
        }
        
        // Закрытие меню при клике на пункт меню на мобильных устройствах
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        // Закрытие меню при клике вне меню на мобильных устройствах
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(event.target) && 
                event.target !== mobileMenuButton) {
                closeSidebar();
            }
        });
        
        // Обработчики для предпросмотра файла
        if (closePreview) {
            closePreview.addEventListener('click', function() {
                previewModal.style.display = 'none';
            });
        }
        
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', function() {
                previewModal.style.display = 'none';
            });
        }
        
        // Закрытие по клику вне модальных окон
        window.addEventListener('click', function(event) {
            if (event.target === previewModal) {
                previewModal.style.display = 'none';
            }
            
            if (event.target === addLinkModal) {
                addLinkModal.style.display = 'none';
            }
        });
        
        // Обработчики для добавления ссылки
        if (addLinkButton) {
            addLinkButton.addEventListener('click', function() {
                document.getElementById('link-title').value = '';
                document.getElementById('link-url').value = '';
                document.getElementById('link-description').value = '';
                addLinkModal.style.display = 'block';
            });
        }
        
        if (closeAddLinkBtn) {
            closeAddLinkBtn.addEventListener('click', function() {
                addLinkModal.style.display = 'none';
            });
        }
        
        if (cancelLinkBtn) {
            cancelLinkBtn.addEventListener('click', function() {
                addLinkModal.style.display = 'none';
            });
        }
        
        if (saveLinkBtn) {
            saveLinkBtn.addEventListener('click', addLink);
        }
    }
    
    // Инициализация приложения
    function init() {
        console.log('Инициализация приложения');
        
        // Применяем переводы первым делом
        if (typeof loadTranslations === 'function') {
            loadTranslations();
        } else {
            console.error('Функция loadTranslations не найдена');
        }
        
        // Инициализация переключателя языка
        initLanguageSelector();
        
        // Инициализация обработчиков
        initEventListeners();
        
        // Инициализация модуля Cloud (по умолчанию)
        if (typeof CloudModule !== 'undefined') {
            console.log('Инициализация CloudModule');
            CloudModule.initModule();
        } else {
            console.error('CloudModule не найден!');
            filesContainer.innerHTML = '<div class="loading error"><i class="fa-solid fa-circle-exclamation"></i> Ошибка загрузки модуля Cloud</div>';
        }
        
        // Загрузка статистики
        if (typeof Utils !== 'undefined' && Utils.loadStats) {
            console.log('Загрузка статистики');
            Utils.loadStats();
            
            // Обновляем статистику каждую минуту
            setInterval(function() {
                Utils.loadStats();
            }, 60000);
        } else {
            console.error('Utils.loadStats не найден!');
        }
    }
    
    // Обновление UI при изменении ширины экрана
    function handleResize() {
        // Реализация функции handleResize
    }
    
    // Запуск инициализации
    init();
});

// Инициализация переключателя языка
function initLanguageSelector() {
    const currentLang = localStorage.getItem('language') || 'ru';
    
    // Отмечаем активный язык
    document.querySelectorAll('.language-option').forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (lang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
        
        // Добавляем обработчик клика
        option.addEventListener('click', () => {
            changeLanguage(lang);
        });
    });
}
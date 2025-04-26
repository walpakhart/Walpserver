/**
 * Модуль "Фильмы" для работы с коллекцией фильмов
 */
const MoviesModule = {
    // DOM элементы
    elements: {
        moviesList: null,
        movieSearchInput: null,
        addMovieBtn: null,
        movieSearchResults: null,
        searchResultsContainer: null,
        closeSearchResultsBtn: null,
        movieModal: null,
        watchMovieBtn: null,
        toggleWatchedBtn: null,
        deleteMovieBtn: null,
        closeMovieModalBtn: null,
        filterBtns: null,
        // Новые элементы для просмотра фильма в iframe
        watchMovieModal: null,
        movieIframe: null,
        closeWatchMovieBtn: null,
        openExternalBtn: null,
        closeWatchBtn: null,
        watchMovieTitle: null,
        // Новые элементы для торрентов
        searchTorrentsBtn: null,
        torrentsLoading: null,
        torrentsResults: null,
        torrentsError: null,
        torrentsList: null
    },
    
    // Состояние
    state: {
        currentMovieId: null,
        currentMovieFilter: 'all',
        tempMovie: null,
        torrentsSearched: false
    },
    
    // Инициализация модуля
    init: function() {
        // Находим DOM элементы
        this.elements.moviesList = document.querySelector('.movies-list');
        this.elements.movieSearchInput = document.getElementById('movie-search');
        this.elements.addMovieBtn = document.getElementById('add-movie-btn');
        this.elements.movieSearchResults = document.getElementById('movie-search-results');
        this.elements.searchResultsContainer = document.querySelector('.search-results-container');
        this.elements.closeSearchResultsBtn = document.querySelector('.close-search-results');
        this.elements.movieModal = document.getElementById('movie-modal');
        this.elements.watchMovieBtn = document.getElementById('watch-movie-btn');
        this.elements.toggleWatchedBtn = document.getElementById('toggle-watched-btn');
        this.elements.deleteMovieBtn = document.getElementById('delete-movie-btn');
        this.elements.closeMovieModalBtn = document.getElementById('close-movie-modal');
        this.elements.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Инициализация новых элементов для просмотра фильма в iframe
        this.elements.watchMovieModal = document.getElementById('movie-watch-modal');
        this.elements.movieIframe = document.getElementById('movie-iframe');
        this.elements.closeWatchMovieBtn = document.getElementById('close-watch-movie-modal');
        this.elements.openExternalBtn = document.getElementById('open-external-btn');
        this.elements.closeWatchBtn = document.getElementById('close-watch-btn');
        this.elements.watchMovieTitle = document.getElementById('watch-movie-title');
        
        // Инициализация элементов для торрентов
        this.elements.searchTorrentsBtn = document.getElementById('search-torrents-btn');
        this.elements.torrentsLoading = document.getElementById('torrents-loading');
        this.elements.torrentsResults = document.getElementById('torrents-results');
        this.elements.torrentsError = document.getElementById('torrents-error');
        this.elements.torrentsList = document.querySelector('.torrents-list');
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Загружаем фильмы
        this.loadMovies();
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчик нажатия кнопки "Добавить фильм"
        if (this.elements.addMovieBtn) {
            this.elements.addMovieBtn.addEventListener('click', () => {
                // Показываем блок с результатами поиска
                this.elements.movieSearchResults.classList.remove('hidden');
                // Фокусируемся на поле поиска
                this.elements.movieSearchInput.focus();
            });
        }
        
        // Обработчик ввода в поле поиска
        if (this.elements.movieSearchInput) {
            this.elements.movieSearchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    const query = this.elements.movieSearchInput.value.trim();
                    
                    if (query.length >= 2) {
                        // Показываем результаты поиска
                        this.elements.movieSearchResults.classList.remove('hidden');
                        // Выполняем поиск
                        this.searchMovies(query);
                    }
                }
            });
            
            // Создаем обертку для поля поиска, если её еще нет
            const searchWrapper = this.elements.movieSearchInput.parentNode;
            
            // Добавляем кнопку поиска рядом с полем ввода
            const searchButton = document.createElement('button');
            searchButton.type = 'button';
            searchButton.id = 'movie-search-button';
            searchButton.innerHTML = '<i class="fa-solid fa-search"></i> ' + t('find');
            
            // Вставляем кнопку после поля ввода
            searchWrapper.appendChild(searchButton);
            
            // Обработчик для кнопки поиска
            searchButton.addEventListener('click', () => {
                const query = this.elements.movieSearchInput.value.trim();
                
                if (query.length >= 2) {
                    // Показываем результаты поиска
                    this.elements.movieSearchResults.classList.remove('hidden');
                    // Выполняем поиск
                    this.searchMovies(query);
                }
            });
        }
        
        // Обработчик закрытия результатов поиска
        if (this.elements.closeSearchResultsBtn) {
            this.elements.closeSearchResultsBtn.addEventListener('click', () => {
                this.elements.movieSearchResults.classList.add('hidden');
                this.elements.movieSearchInput.value = '';
            });
        }
        
        // Обработчик кнопки просмотра фильма
        if (this.elements.watchMovieBtn) {
            this.elements.watchMovieBtn.addEventListener('click', () => {
                if (this.state.currentMovieId) {
                    this.watchMovie(this.state.currentMovieId);
                }
            });
        }
        
        // Обработчик переключения статуса просмотра
        if (this.elements.toggleWatchedBtn) {
            this.elements.toggleWatchedBtn.addEventListener('click', () => {
                if (this.state.currentMovieId) {
                    this.toggleWatched(this.state.currentMovieId);
                }
            });
        }
        
        // Обработчик удаления фильма
        if (this.elements.deleteMovieBtn) {
            this.elements.deleteMovieBtn.addEventListener('click', () => {
                if (this.state.currentMovieId) {
                    this.deleteMovie(this.state.currentMovieId);
                }
            });
        }
        
        // Обработчик закрытия модального окна
        if (this.elements.closeMovieModalBtn) {
            this.elements.closeMovieModalBtn.addEventListener('click', () => {
                this.closeMovieModal();
            });
        }
        
        // Обработчики кнопок фильтров
        if (this.elements.filterBtns) {
            this.elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Убираем активный класс со всех кнопок
                    this.elements.filterBtns.forEach(b => b.classList.remove('active'));
                    // Добавляем активный класс на текущую кнопку
                    btn.classList.add('active');
                    // Устанавливаем новый фильтр
                    this.state.currentMovieFilter = btn.getAttribute('data-filter');
                    // Загружаем фильмы с новым фильтром
                    this.loadMovies();
                });
            });
        }
        
        // Обработчики для нового модального окна с iframe
        if (this.elements.closeWatchMovieBtn) {
            this.elements.closeWatchMovieBtn.addEventListener('click', () => {
                this.closeWatchMovieModal();
            });
        }
        
        if (this.elements.closeWatchBtn) {
            this.elements.closeWatchBtn.addEventListener('click', () => {
                this.closeWatchMovieModal();
            });
        }
        
        if (this.elements.openExternalBtn) {
            this.elements.openExternalBtn.addEventListener('click', () => {
                // Открываем ссылку из iframe в новой вкладке
                const iframeSrc = this.elements.movieIframe.src;
                if (iframeSrc) {
                    window.open(iframeSrc, '_blank');
                }
            });
        }
        
        // Обработчики для мобильных кнопок модального окна просмотра фильма
        const mobileOpenExternalBtn = document.getElementById('mobile-open-external-btn');
        if (mobileOpenExternalBtn) {
            mobileOpenExternalBtn.addEventListener('click', () => {
                const iframeSrc = this.elements.movieIframe.src;
                if (iframeSrc) {
                    window.open(iframeSrc, '_blank');
                }
            });
        }
        
        const mobileCloseWatchBtn = document.getElementById('mobile-close-watch-btn');
        if (mobileCloseWatchBtn) {
            mobileCloseWatchBtn.addEventListener('click', () => {
                this.closeWatchMovieModal();
            });
        }
        
        // Закрытие модальных окон при клике вне их содержимого
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.movieModal) {
                this.closeMovieModal();
            }
            
            if (event.target === this.elements.watchMovieModal) {
                this.closeWatchMovieModal();
            }
            
            if (event.target === this.elements.movieSearchResults) {
                this.elements.movieSearchResults.classList.add('hidden');
            }
        });
        
        // Обработчик изменения ориентации экрана для мобильных устройств
        window.addEventListener('orientationchange', () => {
            // Проверяем, открыто ли модальное окно просмотра фильма
            if (this.elements.watchMovieModal && 
                this.elements.watchMovieModal.style.display === 'block') {
                // Корректируем размеры модального окна и iframe
                setTimeout(() => {
                    const container = this.elements.watchMovieModal.querySelector('.movie-iframe-container');
                    if (container) {
                        // Устанавливаем оптимальную высоту для фрейма
                        container.style.height = window.innerHeight + 'px';
                    }
                }, 100);
            }
        });
        
        // Обработчик для кнопки поиска торрентов
        if (this.elements.searchTorrentsBtn) {
            this.elements.searchTorrentsBtn.addEventListener('click', () => {
                if (this.state.currentMovieId) {
                    this.searchTorrents(this.state.currentMovieId);
                }
            });
        }
    },
    
    // Загрузка списка фильмов
    loadMovies: function() {
        console.log(`${t('loading_filter')} ${this.state.currentMovieFilter}`);
        this.elements.moviesList.innerHTML = '<div class="search-loading"><i class="fa-solid fa-spinner fa-spin"></i> ' + t('loading_movies') + '</div>';
        
        // Обновляем активный класс кнопок фильтров
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            if (filterType === this.state.currentMovieFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Обновляем активный класс пунктов меню
        const menuItems = document.querySelectorAll('.menu-item[data-movie-filter]');
        menuItems.forEach(item => {
            const filterType = item.getAttribute('data-movie-filter');
            if (filterType === this.state.currentMovieFilter) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        fetch(`/movies?filter=${this.state.currentMovieFilter}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(movies => {
                this.elements.moviesList.innerHTML = '';
                
                if (movies.length === 0) {
                    let message = t('movies_not_found');
                    
                    if (this.state.currentMovieFilter === 'all') {
                        message += ' ' + t('add_first_movie');
                    } else if (this.state.currentMovieFilter === 'watched') {
                        message += ' ' + t('no_watched_movies');
                    } else if (this.state.currentMovieFilter === 'unwatched') {
                        message += ' ' + t('no_unwatched_movies');
                    }
                    
                    this.elements.moviesList.innerHTML = `<div class="search-empty">${message}</div>`;
                    return;
                }
                
                // Добавляем карточки фильмов напрямую в контейнер
                movies.forEach(movie => {
                    const movieCard = this.createMovieCard(movie);
                    this.elements.moviesList.appendChild(movieCard);
                });
                
                console.log(t('loaded_movies').replace('{count}', movies.length) + ' ' + this.state.currentMovieFilter);
            })
            .catch(error => {
                console.error(t('movies_load_error') + ':', error);
                this.elements.moviesList.innerHTML = '<div class="search-empty">' + t('movies_load_error') + '</div>';
            });
    },
    
    // Поиск фильмов для добавления
    searchMovies: function(query) {
        // Очищаем содержимое контейнера и показываем индикатор загрузки
        this.elements.searchResultsContainer.innerHTML = '<div class="search-loading"><i class="fa-solid fa-spinner fa-spin"></i> ' + t('searching_movies') + '</div>';
        
        fetch(`/search_movie?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(movies => {
                // Очищаем контейнер для результатов поиска
                this.elements.searchResultsContainer.innerHTML = '';
                
                if (movies.length === 0) {
                    this.elements.searchResultsContainer.innerHTML = '<div class="search-empty">' + t('movies_not_found_try_another') + '</div>';
                    return;
                }
                
                // Создаем контейнер для отображения результатов в виде сетки
                const resultsGrid = document.createElement('div');
                resultsGrid.className = 'search-results-list';
                
                // Добавляем карточки фильмов в сетку
                movies.forEach(movie => {
                    const movieCard = this.createSearchResultCard(movie);
                    resultsGrid.appendChild(movieCard);
                });
                
                // Добавляем сетку с результатами в контейнер
                this.elements.searchResultsContainer.appendChild(resultsGrid);
            })
            .catch(error => {
                console.error(t('movies_search_error') + ':', error);
                this.elements.searchResultsContainer.innerHTML = '<div class="search-empty">' + t('movies_search_error') + '</div>';
            });
    },
    
    // Создание карточки фильма для результатов поиска
    createSearchResultCard: function(movie) {
        // Создаем карточку в том же стиле, что и для обычных фильмов
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        // Создаем обертку для постера
        const posterWrapper = document.createElement('div');
        posterWrapper.className = 'movie-poster-wrapper';
        
        // Добавляем изображение постера
        const posterImg = document.createElement('img');
        posterImg.src = movie.poster_url || '/static/img/no-poster.svg';
        posterImg.alt = movie.title;
        posterImg.loading = 'lazy';
        posterImg.onerror = function() {
            this.src = '/static/img/no-poster.svg';
        };
        posterWrapper.appendChild(posterImg);
        
        // Создаем блок с информацией о фильме
        const movieInfo = document.createElement('div');
        movieInfo.className = 'movie-info';
        
        // Добавляем название фильма
        const movieTitle = document.createElement('div');
        movieTitle.className = 'movie-title';
        movieTitle.textContent = movie.title;
        movieInfo.appendChild(movieTitle);
        
        // Добавляем год выпуска
        const movieYear = document.createElement('div');
        movieYear.className = 'movie-year';
        movieYear.textContent = movie.year || '-';
        movieInfo.appendChild(movieYear);
        
        // Добавляем кнопку для добавления фильма в коллекцию
        const addButton = document.createElement('button');
        addButton.className = 'btn-primary btn-sm';
        addButton.innerHTML = '<i class="fa-solid fa-plus"></i> ' + t('add_button');
        movieInfo.appendChild(addButton);
        
        // Добавляем обработчик нажатия на кнопку добавления
        addButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплытие события
            this.addMovie(movie.kinopoisk_id);
        });
        
        // Собираем компоненты карточки
        movieCard.appendChild(posterWrapper);
        movieCard.appendChild(movieInfo);
        
        // Добавляем обработчик для отображения детальной информации при клике на карточку
        movieCard.addEventListener('click', () => {
            this.showMovieDetailsForSearch(movie);
        });
        
        return movieCard;
    },
    
    // Показать детали фильма из поиска
    showMovieDetailsForSearch: function(movie) {
        // Заполняем данные о фильме
        document.getElementById('movie-title').textContent = movie.title;
        
        const posterImg = document.getElementById('movie-poster-img');
        posterImg.src = movie.poster_url || '/static/img/no-poster.svg';
        posterImg.onerror = function() {
            // Если изображение не загрузилось, заменяем на заглушку
            this.src = '/static/img/no-poster.svg';
        };
        
        document.getElementById('movie-original-title').textContent = movie.original_title || '-';
        document.getElementById('movie-year').textContent = movie.year || '-';
        document.getElementById('movie-rating').textContent = movie.rating || '-';
        document.getElementById('movie-genres').textContent = movie.genres || '-';
        document.getElementById('movie-description').textContent = movie.description || t('no_description');
        
        // В режиме поиска статус "Не просмотрен"
        const watchedStatus = document.getElementById('movie-watched-status');
        watchedStatus.textContent = t('not_added');
        watchedStatus.style.color = 'var(--dark-gray)';
        
        // Сохраняем фильм временно для использования в кнопке "Смотреть фильм"
        this.state.tempMovie = movie;
        
        // Меняем текст кнопки добавления
        this.elements.toggleWatchedBtn.textContent = t('add_to_collection');
        
        // Меняем обработчик кнопки "Смотреть фильм"
        const originalWatchHandler = this.elements.watchMovieBtn.onclick;
        this.elements.watchMovieBtn.onclick = () => {
            // Вместо открытия новой вкладки, открываем iframe модальное окно
            if (movie.kinopoisk_id) {
                // Открываем модальное окно сразу, чтобы показать процесс загрузки
                this.elements.watchMovieModal.style.display = 'block';
                
                // Создаем элемент индикатора загрузки, если его еще нет
                const loadingContainer = document.querySelector('.movie-iframe-loading');
                if (!loadingContainer) {
                    const loading = document.createElement('div');
                    loading.className = 'movie-iframe-loading';
                    loading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + t('loading_movie');
                    this.elements.watchMovieModal.querySelector('.movie-iframe-container').appendChild(loading);
                } else {
                    loadingContainer.style.display = 'flex';
                }
                
                // Устанавливаем URL в iframe
                const movieUrl = `https://kinopoisk.film/film/${movie.kinopoisk_id}/`;
                this.elements.movieIframe.src = movieUrl;
                
                // Обработчик для события загрузки iframe
                this.elements.movieIframe.onload = () => {
                    // Удаляем индикатор загрузки
                    const loadingContainer = document.querySelector('.movie-iframe-loading');
                    if (loadingContainer) {
                        loadingContainer.style.display = 'none';
                    }
                };
            } else {
                Utils.showNotification(t('movie_watch_error'), 'error');
            }
        };
        
        // Изменяем обработчик кнопки "Отметить просмотренным"
        const originalHandler = this.elements.toggleWatchedBtn.onclick;
        this.elements.toggleWatchedBtn.onclick = () => {
            if (movie.kinopoisk_id) {
                this.addMovie(movie.kinopoisk_id);
            } else {
                // Для совместимости с существующим кодом
                this.addMovieToCollection(movie);
            }
            this.elements.movieModal.style.display = 'none';
            
            // Восстанавливаем обработчики
            setTimeout(() => {
                this.elements.toggleWatchedBtn.onclick = originalHandler;
                this.elements.watchMovieBtn.onclick = originalWatchHandler;
            }, 100);
        };
        
        // Скрываем кнопку удаления
        this.elements.deleteMovieBtn.style.display = 'none';
        
        // Открываем модальное окно
        this.elements.movieModal.style.display = 'block';
        
        // Восстанавливаем отображение кнопки удаления при закрытии модального окна
        const closeModalHandler = () => {
            this.elements.deleteMovieBtn.style.display = 'block';
            this.elements.closeMovieModalBtn.removeEventListener('click', closeModalHandler);
            this.elements.watchMovieBtn.onclick = originalWatchHandler; // Восстанавливаем обработчик просмотра
        };
        
        this.elements.closeMovieModalBtn.addEventListener('click', closeModalHandler);
    },
    
    // Добавление фильма в коллекцию
    addMovieToCollection: function(movie) {
        // Показываем индикатор загрузки
        Utils.showNotification(t('adding_movie'), 'info');
        
        fetch('/add_movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movie)
        })
            .then(response => {
                if (!response.ok) {
                    // Если статус ответа не 200 OK
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Скрываем результаты поиска, если они существуют
                    if (this.elements.movieSearchResults) {
                        this.elements.movieSearchResults.classList.add('hidden');
                    }
                    
                    // Очищаем поле поиска, если оно существует
                    if (this.elements.movieSearchInput) {
                        this.elements.movieSearchInput.value = '';
                    }
                    
                    // Перезагружаем список фильмов
                    this.loadMovies();
                    
                    // Показываем уведомление об успехе
                    Utils.showNotification(t('movie_added_success'), 'success');
                } else {
                    // Показываем ошибку из ответа сервера или общую ошибку
                    Utils.showNotification(data.error || t('movie_add_error'), 'error');
                }
            })
            .catch(error => {
                console.error(t('movie_add_error') + ':', error);
                Utils.showNotification(error.message || t('movie_add_error_generic'), 'error');
            });
    },
    
    // Создание карточки фильма
    createMovieCard: function(movie) {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.id = movie.id;
        
        const posterWrapper = document.createElement('div');
        posterWrapper.className = 'movie-poster-wrapper';
        
        const posterImg = document.createElement('img');
        posterImg.src = movie.poster_url || '/static/img/no-poster.svg';
        posterImg.alt = movie.title;
        posterImg.loading = 'lazy'; // Добавляем ленивую загрузку изображений
        posterImg.onerror = function() {
            // Если изображение не загрузилось, заменяем на заглушку
            this.src = '/static/img/no-poster.svg';
        };
        posterWrapper.appendChild(posterImg);
        
        // Добавляем значок о просмотре, если фильм просмотрен
        if (movie.watched) {
            const watchedBadge = document.createElement('div');
            watchedBadge.className = 'movie-watched-badge';
            watchedBadge.innerHTML = '<i class="fa-solid fa-check"></i>';
            posterWrapper.appendChild(watchedBadge);
        }
        
        const movieInfo = document.createElement('div');
        movieInfo.className = 'movie-info';
        
        const movieTitle = document.createElement('div');
        movieTitle.className = 'movie-title';
        movieTitle.textContent = movie.title;
        
        const movieYear = document.createElement('div');
        movieYear.className = 'movie-year';
        movieYear.textContent = movie.year || '';
        
        movieInfo.appendChild(movieTitle);
        movieInfo.appendChild(movieYear);
        
        movieCard.appendChild(posterWrapper);
        movieCard.appendChild(movieInfo);
        
        // Добавляем обработчик клика для открытия модального окна
        movieCard.addEventListener('click', () => {
            this.showMovieDetails(movie);
        });
        
        return movieCard;
    },
    
    // Показать детали фильма в модальном окне
    showMovieDetails: function(movie) {
        this.state.currentMovieId = movie.id;
        this.state.torrentsSearched = false; // Сбрасываем флаг поиска торрентов
        
        // Заполняем данные о фильме
        document.getElementById('movie-title').textContent = movie.title;
        
        const posterImg = document.getElementById('movie-poster-img');
        posterImg.src = movie.poster_url || '/static/img/no-poster.svg';
        posterImg.onerror = function() {
            // Если изображение не загрузилось, заменяем на заглушку
            this.src = '/static/img/no-poster.svg';
        };
        
        document.getElementById('movie-original-title').textContent = movie.original_title || '-';
        document.getElementById('movie-year').textContent = movie.year || '-';
        document.getElementById('movie-rating').textContent = movie.rating || '-';
        document.getElementById('movie-genres').textContent = movie.genres || '-';
        document.getElementById('movie-description').textContent = movie.description || t('no_description');
        
        // Устанавливаем статус просмотра
        const watchedStatus = document.getElementById('movie-watched-status');
        watchedStatus.textContent = movie.watched ? t('watched') : t('not_watched');
        watchedStatus.style.color = movie.watched ? 'var(--success-color)' : 'var(--dark-gray)';
        
        // Меняем текст кнопки переключения статуса
        this.elements.toggleWatchedBtn.textContent = movie.watched ? t('mark_as_unwatched') : t('mark_as_watched');
        
        // Скрываем результаты поиска торрентов
        if (this.elements.torrentsResults) {
            this.elements.torrentsResults.classList.add('hidden');
        }
        if (this.elements.torrentsError) {
            this.elements.torrentsError.classList.add('hidden');
        }
        if (this.elements.torrentsLoading) {
            this.elements.torrentsLoading.classList.add('hidden');
        }
        
        // Открываем модальное окно
        this.elements.movieModal.style.display = 'block';
    },
    
    // Открытие фильма для просмотра
    watchMovie: function(movieId) {
        // Показываем индикатор загрузки в модальном окне
        this.elements.movieIframe.src = '';
        
        // Создаем элемент индикатора загрузки, если его еще нет
        const loadingContainer = document.querySelector('.movie-iframe-loading');
        if (!loadingContainer) {
            const loading = document.createElement('div');
            loading.className = 'movie-iframe-loading';
            loading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + t('loading_movie');
            this.elements.watchMovieModal.querySelector('.movie-iframe-container').appendChild(loading);
        } else {
            loadingContainer.style.display = 'flex';
        }
        
        // Открываем модальное окно сразу, чтобы показать процесс загрузки
        this.elements.watchMovieModal.style.display = 'block';
        
        // Настраиваем отображение для мобильных устройств
        if (window.innerWidth <= 768) {
            const controls = document.querySelector('.movie-controls');
            if (controls) {
                controls.style.display = 'flex';
            }
            
            // Скрываем обычный футер, если открыто на мобильном
            const footer = this.elements.watchMovieModal.querySelector('.modal-footer');
            if (footer) {
                footer.style.display = 'none';
            }
            
            // Корректируем размеры iframe контейнера
            const container = this.elements.watchMovieModal.querySelector('.movie-iframe-container');
            if (container) {
                container.style.height = window.innerHeight + 'px';
            }
        }
        
        fetch(`/watch_movie/${movieId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.url) {
                    // Удаляем индикатор загрузки
                    const loadingContainer = document.querySelector('.movie-iframe-loading');
                    if (loadingContainer) {
                        loadingContainer.style.display = 'none';
                    }
                    
                    // Устанавливаем URL в iframe
                    this.elements.movieIframe.src = data.url;
                    
                    // Обработчик для события загрузки iframe
                    this.elements.movieIframe.onload = () => {
                        console.log(t('iframe_loaded'));
                    };
                } else {
                    // Закрываем модальное окно в случае ошибки
                    this.closeWatchMovieModal();
                    Utils.showNotification(data.error || t('movie_url_error'), 'error');
                }
            })
            .catch(error => {
                // Закрываем модальное окно в случае ошибки
                this.closeWatchMovieModal();
                console.error(t('movie_url_error') + ':', error);
                Utils.showNotification(t('movie_url_error'), 'error');
            });
    },
    
    // Переключение статуса просмотра фильма
    toggleWatched: function(movieId) {
        // Показываем индикатор загрузки
        Utils.showNotification(t('changing_movie_status'), 'info');
        
        fetch(`/toggle_watched/${movieId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log(t('movie_status_changed') + ':', data);
                    
                    // Закрываем модальное окно
                    this.closeMovieModal();
                    
                    // Обновляем текущий фильтр перед загрузкой фильмов
                    // Это позволит обновить состояние активного фильтра в UI
                    const menuItems = document.querySelectorAll('.menu-item[data-movie-filter]');
                    menuItems.forEach(item => {
                        if (item.classList.contains('active')) {
                            this.state.currentMovieFilter = item.getAttribute('data-movie-filter');
                        }
                    });
                    
                    // Перезагружаем список фильмов
                    this.loadMovies();
                    
                    // Показываем уведомление - всегда используем локализованный текст
                    Utils.showNotification(t('movie_status_changed'), 'success');
                } else {
                    Utils.showNotification(data.error || t('movie_status_error'), 'error');
                }
            })
            .catch(error => {
                console.error(t('movie_status_error') + ':', error);
                Utils.showNotification(t('movie_status_error'), 'error');
            });
    },
    
    // Удаление фильма из коллекции
    deleteMovie: function(movieId) {
        if (confirm(t('delete_movie_confirm'))) {
            fetch(`/delete_movie/${movieId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Закрываем модальное окно
                        this.closeMovieModal();
                        // Перезагружаем список фильмов
                        this.loadMovies();
                        // Показываем уведомление
                        Utils.showNotification(t('movie_deleted'), 'success');
                    } else {
                        Utils.showNotification(data.error || t('movie_delete_error'), 'error');
                    }
                })
                .catch(error => {
                    console.error(t('movie_delete_error') + ':', error);
                    Utils.showNotification(t('movie_delete_error'), 'error');
                });
        }
    },
    
    // Закрытие модального окна фильма
    closeMovieModal: function() {
        this.elements.movieModal.style.display = 'none';
    },
    
    // Закрытие модального окна просмотра фильма
    closeWatchMovieModal: function() {
        this.elements.watchMovieModal.style.display = 'none';
        // Останавливаем видео, очищая src
        this.elements.movieIframe.src = '';
        
        // Сбрасываем настройки для мобильного отображения
        if (window.innerWidth <= 768) {
            const controls = document.querySelector('.movie-controls');
            if (controls) {
                controls.style.display = 'none';
            }
            
            // Возвращаем отображение обычного футера
            const footer = this.elements.watchMovieModal.querySelector('.modal-footer');
            if (footer) {
                footer.style.display = 'flex';
            }
        }
    },
    
    // Поиск фильмов с отображением результатов непосредственно на странице
    searchMoviesInline: function(query, container) {
        fetch(`/search_movie?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(movies => {
                container.innerHTML = '';
                
                if (movies.length === 0) {
                    container.innerHTML = '<div class="search-empty">' + t('movies_not_found_try_another') + '</div>';
                    return;
                }
                
                // Создаем контейнер для результатов поиска в виде сетки
                const resultsContainer = document.createElement('div');
                resultsContainer.className = 'search-results-list'; // Используем стиль для отображения сетки
                
                movies.forEach(movie => {
                    const movieCard = this.createSearchResultCard(movie);
                    resultsContainer.appendChild(movieCard);
                });
                
                container.appendChild(resultsContainer);
            })
            .catch(error => {
                console.error(t('movies_search_error') + ':', error);
                container.innerHTML = '<div class="search-empty">' + t('movies_search_error') + '</div>';
            });
    },
    
    // Добавление фильма в коллекцию
    addMovie: function(movieId) {
        Utils.showNotification(t('adding_movie'), 'info');
        
        fetch(`/add_movie/${movieId}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Utils.showNotification(t('movie_added_success'), 'success');
                
                // Закрываем модальное окно с результатами поиска, если оно открыто
                if (this.elements.movieSearchResults) {
                    this.elements.movieSearchResults.classList.add('hidden');
                }
                
                // Перезагружаем список фильмов
                this.loadMovies();
            } else {
                Utils.showNotification(data.error || data.message || t('movie_add_error'), 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при добавлении фильма:', error);
            Utils.showNotification(t('movie_add_error_generic'), 'error');
        });
    },
    
    // Функция поиска торрентов
    searchTorrents: function(movieId) {
        // Если торренты уже были найдены, просто показываем их
        if (this.state.torrentsSearched && !this.elements.torrentsResults.classList.contains('hidden')) {
            return;
        }
        
        // Сбрасываем предыдущие результаты
        if (this.elements.torrentsList) {
            this.elements.torrentsList.innerHTML = '';
        }
        
        // Скрываем сообщения об ошибках и результаты
        if (this.elements.torrentsError) {
            this.elements.torrentsError.classList.add('hidden');
        }
        if (this.elements.torrentsResults) {
            this.elements.torrentsResults.classList.add('hidden');
        }
        
        // Показываем индикатор загрузки
        if (this.elements.torrentsLoading) {
            this.elements.torrentsLoading.classList.remove('hidden');
        }
        
        fetch(`/search_torrents/${movieId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Скрываем индикатор загрузки
                if (this.elements.torrentsLoading) {
                    this.elements.torrentsLoading.classList.add('hidden');
                }
                
                this.state.torrentsSearched = true;
                
                // Проверяем наличие результатов
                if (data.success && data.results && data.results.length > 0) {
                    // Заполняем список торрентов
                    this.fillTorrentsList(data.results);
                    
                    // Показываем блок с результатами
                    if (this.elements.torrentsResults) {
                        this.elements.torrentsResults.classList.remove('hidden');
                    }
                } else {
                    // Показываем сообщение об ошибке
                    if (this.elements.torrentsError) {
                        this.elements.torrentsError.classList.remove('hidden');
                    }
                }
            })
            .catch(error => {
                // Обработка ошибок
                console.error(t('torrents_search_error') + ':', error);
                
                // Скрываем индикатор загрузки
                if (this.elements.torrentsLoading) {
                    this.elements.torrentsLoading.classList.add('hidden');
                }
                
                // Показываем сообщение об ошибке
                if (this.elements.torrentsError) {
                    this.elements.torrentsError.classList.remove('hidden');
                    const errorMsg = this.elements.torrentsError.querySelector('span');
                    if (errorMsg) {
                        errorMsg.textContent = t('torrents_search_error');
                    }
                }
            });
    },
    
    // Заполнение списка найденных торрентов
    fillTorrentsList: function(torrents) {
        if (!this.elements.torrentsList) return;
        
        // Очищаем список перед заполнением
        this.elements.torrentsList.innerHTML = '';
        
        // Группируем торренты: сначала реальные торренты, затем поисковые ссылки
        const realTorrents = torrents.filter(t => t.seeds !== 'N/A');
        const searchLinks = torrents.filter(t => t.seeds === 'N/A');
        
        // Сортируем настоящие торренты по количеству сидов
        realTorrents.sort((a, b) => {
            // Добавляем более надежную обработку значения seeds
            let seedsA = 0;
            let seedsB = 0;
            
            if (typeof a.seeds === 'number') {
                seedsA = a.seeds;
            } else if (typeof a.seeds === 'string' && !isNaN(parseInt(a.seeds))) {
                seedsA = parseInt(a.seeds);
            }
            
            if (typeof b.seeds === 'number') {
                seedsB = b.seeds;
            } else if (typeof b.seeds === 'string' && !isNaN(parseInt(b.seeds))) {
                seedsB = parseInt(b.seeds);
            }
            
            return seedsB - seedsA; // Сортировка по убыванию
        });
        
        // Счетчик для выделения лучших результатов
        let topResultCount = 0;
        
        // Добавляем реальные торренты с плавной анимацией
        if (realTorrents.length > 0) {
            // Создаем заголовок для реальных торрентов
            const torrentsHeader = document.createElement('div');
            torrentsHeader.className = 'torrents-category-header';
            torrentsHeader.innerHTML = `<i class="fa-solid fa-arrow-down-wide-short"></i> ${t('best_results')}`;
            this.elements.torrentsList.appendChild(torrentsHeader);
            
            realTorrents.forEach((torrent, index) => {
                const torrentItem = document.createElement('div');
                topResultCount++;
                
                // Выделяем первые 3 результата как "лучшие"
                if (topResultCount <= 3) {
                    torrentItem.className = `torrent-item top-result top-${topResultCount}`;
                    // Добавляем небольшую задержку для анимации
                    torrentItem.style.animationDelay = `${(index * 0.05)}s`;
                } else {
                    torrentItem.className = 'torrent-item';
                    torrentItem.style.animationDelay = `${(index * 0.05)}s`;
                }
                
                // Определяем тип отображения: прямая ссылка или кнопка "Получить ссылки"
                let hasDirectLinks = torrent.magnet || torrent.torrent;
                
                // Создаем название торрента с указанием качества
                const torrentName = document.createElement('div');
                torrentName.className = 'torrent-name';
                
                // Формируем заголовок с указанием качества
                let displayName = torrent.name;
                if (torrent.quality && torrent.quality !== 'N/A' && torrent.quality !== 'Unknown' && !torrent.name.includes(torrent.quality)) {
                    displayName = `${torrent.name} [${torrent.quality}]`;
                }
                
                // Проверяем, нужен ли дополнительный запрос для получения ссылок
                if (!hasDirectLinks && this.needsTorrentLinkRequest(torrent)) {
                    // Создаем кнопку "Получить ссылки"
                    const downloadBtn = document.createElement('a');
                    downloadBtn.href = '#';
                    downloadBtn.className = 'torrent-get-link';
                    downloadBtn.innerHTML = `<i class="fa-solid fa-link"></i> ${displayName}`;
                    
                    // Добавляем обработчик для получения ссылок
                    downloadBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Добавляем класс для эффекта нажатия
                        downloadBtn.classList.add('torrent-get-link-active');
                        setTimeout(() => downloadBtn.classList.remove('torrent-get-link-active'), 300);
                        
                        this.getTorrentLinks(torrent.url, torrentItem, torrent.engine);
                    });
                    
                    torrentName.appendChild(downloadBtn);
                } else {
                    // Если уже есть прямые ссылки, создаем обычное название с выпадающими опциями
                    const nameLine = document.createElement('div');
                    nameLine.className = 'torrent-name-line';
                    nameLine.innerHTML = displayName;
                    torrentName.appendChild(nameLine);
                    
                    // Создаем контейнер для прямых ссылок
                    const directLinksContainer = document.createElement('div');
                    directLinksContainer.className = 'direct-links';
                    
                    if (torrent.magnet) {
                        const magnetLink = document.createElement('a');
                        magnetLink.href = torrent.magnet;
                        magnetLink.className = 'magnet-link';
                        magnetLink.target = '_blank';
                        magnetLink.rel = 'noopener noreferrer';
                        magnetLink.innerHTML = '<i class="fa-solid fa-magnet"></i> Magnet';
                        
                        // Добавляем эффект нажатия
                        magnetLink.addEventListener('click', function() {
                            this.classList.add('clicked');
                            setTimeout(() => this.classList.remove('clicked'), 300);
                        });
                        
                        directLinksContainer.appendChild(magnetLink);
                    }
                    
                    if (torrent.torrent) {
                        const torrentLink = document.createElement('a');
                        torrentLink.href = `/download_torrent?url=${encodeURIComponent(torrent.torrent)}`;
                        torrentLink.className = 'torrent-link';
                        torrentLink.download = `${torrent.name.substring(0, 30)}.torrent`;
                        torrentLink.innerHTML = '<i class="fa-solid fa-download"></i> ' + t('download_torrent');
                        
                        // Добавляем эффект нажатия
                        torrentLink.addEventListener('click', function() {
                            this.classList.add('clicked');
                            setTimeout(() => this.classList.remove('clicked'), 300);
                        });
                        
                        directLinksContainer.appendChild(torrentLink);
                    }
                    
                    if (torrent.url && !torrent.url.startsWith('magnet:') && torrent.url !== torrent.torrent && torrent.url !== torrent.magnet) {
                        const sourceLink = document.createElement('a');
                        sourceLink.href = torrent.url;
                        sourceLink.className = 'source-link';
                        sourceLink.target = '_blank';
                        sourceLink.rel = 'noopener noreferrer';
                        sourceLink.innerHTML = '<i class="fa-solid fa-external-link-alt"></i> ' + t('view_details');
                        
                        // Добавляем эффект нажатия
                        sourceLink.addEventListener('click', function() {
                            this.classList.add('clicked');
                            setTimeout(() => this.classList.remove('clicked'), 300);
                        });
                        
                        directLinksContainer.appendChild(sourceLink);
                    }
                    
                    torrentName.appendChild(directLinksContainer);
                }
                
                // Создаем блок с информацией о торренте
                const torrentInfo = document.createElement('div');
                torrentInfo.className = 'torrent-info';
                
                // Иконка для источника
                const sourceIcon = this.getTorrentSourceIcon(torrent.engine);
                const engineSpan = document.createElement('span');
                engineSpan.className = 'torrent-engine';
                engineSpan.innerHTML = `${sourceIcon} ${torrent.engine}`;
                torrentInfo.appendChild(engineSpan);
                
                // Информация о качестве
                if (torrent.quality && torrent.quality !== 'N/A' && torrent.quality !== 'Unknown') {
                    const qualitySpan = document.createElement('span');
                    qualitySpan.className = 'torrent-quality';
                    qualitySpan.innerHTML = `<i class="fa-solid fa-film"></i> ${torrent.quality}`;
                    torrentInfo.appendChild(qualitySpan);
                }
                
                // Информация о размере
                if (torrent.size && torrent.size !== 'N/A') {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'torrent-size';
                    sizeSpan.innerHTML = `<i class="fa-solid fa-file"></i> ${torrent.size}`;
                    torrentInfo.appendChild(sizeSpan);
                }
                
                // Информация о сидах/личах
                if (torrent.seeds && torrent.seeds !== 'N/A') {
                    const seedsSpan = document.createElement('span');
                    seedsSpan.className = 'torrent-seeds';
                    // Выделяем хорошие показатели сидов
                    const seedsInt = parseInt(torrent.seeds);
                    if (seedsInt > 50) {
                        seedsSpan.classList.add('high-seeds');
                    } else if (seedsInt > 10) {
                        seedsSpan.classList.add('medium-seeds');
                    }
                    seedsSpan.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${torrent.seeds}`;
                    torrentInfo.appendChild(seedsSpan);
                }
                
                if (torrent.leech && torrent.leech !== 'N/A') {
                    const leechSpan = document.createElement('span');
                    leechSpan.className = 'torrent-leech';
                    leechSpan.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${torrent.leech}`;
                    torrentInfo.appendChild(leechSpan);
                }
                
                // Добавляем бейдж для топовых результатов
                if (topResultCount <= 3) {
                    const topBadge = document.createElement('div');
                    topBadge.className = 'top-result-badge';
                    topBadge.innerHTML = `<i class="fa-solid fa-award"></i> ${t('best_results')} #${topResultCount}`;
                    torrentItem.appendChild(topBadge);
                }
                
                // Добавляем элементы в торрент
                torrentItem.appendChild(torrentName);
                torrentItem.appendChild(torrentInfo);
                
                // Создаем контейнер для прямых ссылок (если их нет)
                if (!hasDirectLinks) {
                    const torrentLinks = document.createElement('div');
                    torrentLinks.className = 'torrent-links hidden';
                    torrentItem.appendChild(torrentLinks);
                }
                
                // Добавляем в список
                this.elements.torrentsList.appendChild(torrentItem);
            });
        }
        
        // Добавляем разделитель между торрентами и поисковыми ссылками
        if (realTorrents.length > 0 && searchLinks.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'torrents-divider';
            divider.innerHTML = '<span>' + t('no_direct_torrents') + '</span>';
            this.elements.torrentsList.appendChild(divider);
        }
        
        // Добавляем поисковые ссылки
        if (searchLinks.length > 0) {
            searchLinks.forEach(link => {
                const searchItem = document.createElement('div');
                searchItem.className = 'torrent-item search-link';
                
                // Название поисковой ссылки
                const searchName = document.createElement('div');
                searchName.className = 'torrent-name';
                searchName.innerHTML = `<a href="${link.url}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-search"></i> ${link.name}</a>`;
                
                // Информация о поисковике
                const searchInfo = document.createElement('div');
                searchInfo.className = 'torrent-info';
                
                const engineSpan = document.createElement('span');
                engineSpan.className = 'torrent-engine';
                engineSpan.innerHTML = `${this.getTorrentSourceIcon(link.engine)} ${link.engine}`;
                searchInfo.appendChild(engineSpan);
                
                // Добавляем элементы
                searchItem.appendChild(searchName);
                searchItem.appendChild(searchInfo);
                
                this.elements.torrentsList.appendChild(searchItem);
            });
        }
        
        // Если не найдено никаких результатов
        if (torrents.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'torrents-no-results';
            noResults.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${t('torrents_not_found')}`;
            this.elements.torrentsList.appendChild(noResults);
        }
    },
    
    // Проверяет, требуется ли дополнительный запрос для получения ссылок
    needsTorrentLinkRequest: function(torrent) {
        // 1337x всегда требует дополнительный запрос
        if (torrent.engine === '1337x' || torrent.engine === '1337x (alt)') {
            return true;
        }
        
        // RuTracker требует дополнительный запрос
        if (torrent.engine === 'RuTracker') {
            return true;
        }
        
        // URL, которые требуют дополнительную обработку
        const needsExtraRequestDomains = [
            '1337x.to', '1337xto.to', '1337x.st', '1337x.is',
            'rutracker.org', 'rutracker.net',
            'nnmclub.to', 'kinozal.tv'
        ];
        
        return needsExtraRequestDomains.some(domain => torrent.url.includes(domain));
    },
    
    // Получение прямых ссылок на торрент
    getTorrentLinks: function(url, torrentItem, engine) {
        // Находим контейнер для ссылок
        const linksContainer = torrentItem.querySelector('.torrent-links');
        
        // Если контейнер не скрыт, значит ссылки уже загружены/загружаются
        if (!linksContainer.classList.contains('hidden')) {
            linksContainer.classList.add('hidden');
            return;
        }
        
        // Показываем индикатор загрузки
        linksContainer.classList.remove('hidden');
        linksContainer.innerHTML = '<div class="torrent-links-loading"><i class="fa-solid fa-spinner fa-spin"></i> ' + t('loading_torrents') + '</div>';
        
        // Запрашиваем прямые ссылки на скачивание
        fetch(`/get_torrent_link?url=${encodeURIComponent(url)}&engine=${encodeURIComponent(engine || '')}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                linksContainer.innerHTML = '';
                
                if (data.success) {
                    // Добавляем заголовок
                    const linksHeader = document.createElement('div');
                    linksHeader.className = 'torrent-links-header';
                    linksHeader.textContent = t('direct_download');
                    linksContainer.appendChild(linksHeader);
                    
                    // Добавляем ссылки на торрент-файлы
                    if (data.torrent_links && data.torrent_links.length > 0) {
                        const torrentLinksContainer = document.createElement('div');
                        torrentLinksContainer.className = 'torrent-file-links';
                        
                        data.torrent_links.forEach((link, index) => {
                            const linkElement = document.createElement('a');
                            // Используем прокси для скачивания .torrent файлов напрямую
                            linkElement.href = `/download_torrent?url=${encodeURIComponent(link)}`;
                            linkElement.className = 'torrent-link';
                            linkElement.download = `torrent_${index + 1}.torrent`;
                            
                            // Текст ссылки зависит от количества ссылок
                            let linkText = t('download_torrent');
                            if (data.torrent_links.length > 1) {
                                linkText += ` ${index + 1}`;
                            }
                            
                            linkElement.innerHTML = '<i class="fa-solid fa-download"></i> ' + linkText;
                            torrentLinksContainer.appendChild(linkElement);
                        });
                        
                        linksContainer.appendChild(torrentLinksContainer);
                    }
                    
                    // Добавляем магнет-ссылки
                    if (data.magnet_links && data.magnet_links.length > 0) {
                        const magnetLinksContainer = document.createElement('div');
                        magnetLinksContainer.className = 'magnet-links-container';
                        
                        data.magnet_links.forEach((link, index) => {
                            const linkElement = document.createElement('a');
                            linkElement.href = link;
                            linkElement.className = 'magnet-link';
                            linkElement.target = '_blank';
                            linkElement.rel = 'noopener noreferrer';
                            
                            // Текст ссылки зависит от количества ссылок
                            let linkText = 'Magnet';
                            if (data.magnet_links.length > 1) {
                                linkText += ` ${index + 1}`;
                            }
                            
                            linkElement.innerHTML = '<i class="fa-solid fa-magnet"></i> ' + linkText;
                            magnetLinksContainer.appendChild(linkElement);
                        });
                        
                        linksContainer.appendChild(magnetLinksContainer);
                    }
                    
                    // Если есть сообщение, показываем его
                    if (data.message) {
                        const messageElement = document.createElement('div');
                        messageElement.className = 'torrent-links-message';
                        messageElement.textContent = data.message;
                        linksContainer.appendChild(messageElement);
                        
                        // Если есть URL страницы, добавляем ссылку
                        if (data.page_url) {
                            const pageLink = document.createElement('a');
                            pageLink.href = data.page_url;
                            pageLink.target = '_blank';
                            pageLink.rel = 'noopener noreferrer';
                            pageLink.className = 'torrent-page-link';
                            pageLink.innerHTML = '<i class="fa-solid fa-external-link-alt"></i> ' + t('open_torrent_page');
                            linksContainer.appendChild(pageLink);
                        }
                    }
                    
                    // Если нет ссылок, показываем сообщение
                    if ((!data.torrent_links || data.torrent_links.length === 0) && 
                        (!data.magnet_links || data.magnet_links.length === 0) &&
                        !data.message) {
                        linksContainer.innerHTML = '<div class="torrent-links-error">' + t('torrents_not_found') + '</div>';
                    }
                } else {
                    // Показываем сообщение об ошибке
                    linksContainer.innerHTML = '<div class="torrent-links-error">' + (data.error || t('torrents_search_error')) + '</div>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                linksContainer.innerHTML = '<div class="torrent-links-error">' + t('torrents_search_error') + '</div>';
            });
    },
    
    // Получение иконки для источника торрента
    getTorrentSourceIcon: function(source) {
        switch(source.toLowerCase()) {
            case 'yts/yify':
                return '<i class="fa-solid fa-check-circle"></i>';
            case '1337x':
                return '<i class="fa-solid fa-flag"></i>';
            case 'eztv':
                return '<i class="fa-solid fa-tv"></i>';
            case 'google':
                return '<i class="fa-brands fa-google"></i>';
            case 'yandex':
                return '<i class="fa-solid fa-y"></i>';
            case 'duckduckgo':
                return '<i class="fa-solid fa-duck"></i>';
            case 'rutracker':
                return '<i class="fa-solid fa-r"></i>';
            case 'the pirate bay':
                return '<i class="fa-solid fa-ship"></i>';
            case 'rarbg':
                return '<i class="fa-solid fa-registered"></i>';
            case 'kinozal':
                return '<i class="fa-solid fa-k"></i>';
            case 'nnm-club':
                return '<i class="fa-solid fa-n"></i>';
            default:
                return '<i class="fa-solid fa-server"></i>';
        }
    }
}; 

// Создаем функцию для блокировки рекламы в iframe
const adBlockStyles = `
/* Стили для блокировки типичных рекламных блоков */
[class*="ads"], [class*="banner"], [class*="ad-"], [id*="ads"], [id*="banner"], [id*="ad-"],
.adsbygoogle, .ads-container, .ad-container, iframe[src*="googlead"], iframe[src*="doubleclick"],
div[data-content*="ads"], .ytp-ad-overlay-container, .ytp-ad-image-overlay, .ytp-ad-text-overlay,
div[class*="advert"], div[id*="advert"], div[class*="reklama"], div[class*="sideroll"],
div[class*="popup"], div[id*="popup"], div[data-type="ads"], div[id*="adspot"],
div[class*="direct"], div[class*="partner"], div[class*="commercial"], div[class*="_ads"],
iframe[src*="adriver"], iframe[src*="adfox"], iframe[src*="adhigh"], 
iframe[src*="admitad"], iframe[src*="yaads"], iframe[src*="banners"],
a[href*="clickunder"], a[href*="popunder"], a[href*="admitad"], a[href*="bgrndi"],
div[style*="z-index: 9999"], div[style*="z-index:9999"], div[style*="z-index: 99999"], div[style*="z-index:99999"],
.video-ads, .video-ad, .preroll-ads, .preroll-ad, .post-ads, .preroll_ads,
div[class*="preroll"], div[id*="preroll"] {
    display: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    top: -9999px !important;
    left: -9999px !important;
    z-index: -9999 !important;
}

/* Блокировка overflow: hidden на body и html */
body.overflow-hidden, html.overflow-hidden, 
body[style*="overflow: hidden"], html[style*="overflow: hidden"],
body[style*="overflow:hidden"], html[style*="overflow:hidden"] {
    overflow: auto !important;
}

/* Блокировка pointer-events: none на body и html */
body[style*="pointer-events: none"], html[style*="pointer-events: none"],
body[style*="pointer-events:none"], html[style*="pointer-events:none"] {
    pointer-events: auto !important;
}

/* Блокировка модальных окон */
div[class*="modal"], div[id*="modal"],
div[class*="popup"], div[id*="popup"],
div[class*="overlay"], div[id*="overlay"] {
    display: none !important;
}
`;

const adBlockScript = `
// Функция для блокировки рекламы
function blockAds() {
    // Инжектим стили
    const styleEl = document.createElement('style');
    styleEl.textContent = ${JSON.stringify(adBlockStyles)};
    document.head.appendChild(styleEl);
    
    // Блокировка рекламных скриптов
    const adScriptSelectors = [
        'script[src*="ads"]',
        'script[src*="banner"]',
        'script[src*="ad-"]',
        'script[src*="adriver"]',
        'script[src*="adfox"]',
        'script[src*="adhigh"]',
        'script[src*="admitad"]',
        'script[src*="doubleclick"]',
        'script[src*="googlead"]',
        'script[src*="yaads"]'
    ];
    
    adScriptSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.remove();
        });
    });
    
    // Блокировка открытия рекламных попапов и переходов
    window.open = function(url, name, features) {
        if (url && (
            url.includes('ad') || 
            url.includes('banner') || 
            url.includes('pop') || 
            url.includes('click') ||
            url.includes('promo')
        )) {
            console.log('Заблокирован рекламный попап:', url);
            return null;
        }
        return window.originalOpen(url, name, features);
    };
    
    if (typeof window.originalOpen === 'undefined') {
        window.originalOpen = window.open;
    }
    
    // Мутационный обсервер для удаления динамически добавляемой рекламы
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType === 1) { // Только элементы
                        // Проверяем классы и ID на наличие рекламных признаков
                        if (
                            (node.className && (
                                node.className.includes('ads') || 
                                node.className.includes('banner') ||
                                node.className.includes('ad-') ||
                                node.className.includes('reklama') ||
                                node.className.includes('popup')
                            )) ||
                            (node.id && (
                                node.id.includes('ads') || 
                                node.id.includes('banner') ||
                                node.id.includes('ad-') ||
                                node.id.includes('popup')
                            ))
                        ) {
                            node.style.display = 'none';
                            node.style.visibility = 'hidden';
                            node.style.opacity = '0';
                            node.style.pointerEvents = 'none';
                            console.log('Заблокирован рекламный элемент:', node);
                        }
                    }
                }
            }
        });
    });
    
    // Запускаем наблюдение за изменениями в DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Запускаем повторную блокировку рекламы каждые 2 секунды
    setInterval(() => {
        const adElements = document.querySelectorAll([
            '[class*="ads"]', '[class*="banner"]', '[class*="ad-"]', '[id*="ads"]', '[id*="banner"]', '[id*="ad-"]',
            '.adsbygoogle', '.ads-container', '.ad-container', 'iframe[src*="googlead"]', 'iframe[src*="doubleclick"]',
            'div[class*="advert"]', 'div[id*="advert"]', 'div[class*="reklama"]', 'div[class*="sideroll"]',
            'div[class*="popup"]', 'div[id*="popup"]', 'div[data-type="ads"]', 'div[id*="adspot"]',
            'div[class*="direct"]', 'div[class*="partner"]', 'div[class*="commercial"]', 'div[class*="_ads"]',
            'iframe[src*="adriver"]', 'iframe[src*="adfox"]', 'iframe[src*="adhigh"]', 
            'iframe[src*="admitad"]', 'iframe[src*="yaads"]', 'iframe[src*="banners"]'
        ].join(','));
        
        adElements.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        });
    }, 2000);
    
    console.log('Блокировщик рекламы активирован');
}

// Запускаем блокировку рекламы
blockAds();

// На всякий случай запускаем с задержкой для динамически загружаемых реклам
setTimeout(blockAds, 1000);
setTimeout(blockAds, 3000);
setTimeout(blockAds, 5000);
`;

// Обработчик для события загрузки iframe
this.elements.movieIframe.onload = () => {
    // Удаляем индикатор загрузки
    const loadingContainer = document.querySelector('.movie-iframe-loading');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
    
    try {
        // Получаем доступ к содержимому iframe
        const iframeDoc = this.elements.movieIframe.contentDocument || this.elements.movieIframe.contentWindow.document;
        
        // Добавляем стили для блокировки рекламы
        const styleEl = document.createElement('style');
        styleEl.textContent = adBlockStyles;
        iframeDoc.head.appendChild(styleEl);
        
        // Инжектим скрипт для блокировки рекламы
        const scriptEl = document.createElement('script');
        scriptEl.textContent = adBlockScript;
        iframeDoc.body.appendChild(scriptEl);
        
        console.log(t('ad_blocker_enabled'));
    } catch (e) {
        // В случае CORS-ограничений, используем альтернативный подход
        console.error('Не удалось напрямую инжектить блокировщик рекламы:', e);
        
        // Альтернативный подход с использованием srcDoc
        const currentSrc = this.elements.movieIframe.src;
        
        // Создаем проксирующий iframe
        const proxyIframe = document.createElement('iframe');
        proxyIframe.style.width = '100%';
        proxyIframe.style.height = '100%';
        proxyIframe.style.border = 'none';
        proxyIframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation';
        
        // HTML-контент для iframe с блокировщиком рекламы
        proxyIframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${adBlockStyles}</style>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="${currentSrc}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
                <script>${adBlockScript}</script>
            </body>
            </html>
        `;
        
        // Заменяем оригинальный iframe на проксирующий
        this.elements.movieIframe.parentNode.replaceChild(proxyIframe, this.elements.movieIframe);
        this.elements.movieIframe = proxyIframe;
        
        console.log(t('ad_blocker_fallback_enabled'));
    }
}; 
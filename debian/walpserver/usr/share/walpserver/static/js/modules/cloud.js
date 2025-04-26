/**
 * Модуль "Облако" для работы с файлами и ссылками
 */
const CloudModule = {
    // DOM элементы
    elements: {
        filesContainer: null,
        fileUpload: null,
        searchInput: null,
        sortBy: null,
        sortOrder: null,
        addLinkButton: null,
        addLinkModal: null,
        categoryItems: null,
        cancelLinkButton: null,
        saveLinkButton: null,
        closePreviewButton: null,
        previewModal: null,
        torrentCategoryModal: null,
        torrentCategorySelect: null,
        cancelTorrentUploadButton: null,
        confirmTorrentUploadButton: null,
        torrentFilename: null,
        torrentFileInfo: null,
        closeTorrentCategoryButton: null
    },
    
    // Состояние
    state: {
        currentCategory: 'all',
        currentSort: 'date',
        currentOrder: 'desc',
        searchTerm: ''
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы
        this.elements = {
            filesContainer: document.getElementById('files-container'),
            categoryMenuItems: document.querySelectorAll('.cloud-menu .menu-item[data-category]'),
            fileUpload: document.getElementById('file-upload'),
            searchInput: document.getElementById('search'),
            sortBySelect: document.getElementById('sort-by'),
            sortOrderSelect: document.getElementById('sort-order'),
            addLinkButton: document.getElementById('add-link-button'),
            addLinkModal: document.getElementById('add-link-modal'),
            cancelLinkButton: document.getElementById('cancel-link'),
            saveLinkButton: document.getElementById('save-link'),
            closePreviewButton: document.getElementById('close-preview'),
            previewModal: document.getElementById('preview-modal'),
            torrentCategoryModal: document.getElementById('torrent-category-modal'),
            torrentCategorySelect: document.getElementById('torrent-category-select'),
            cancelTorrentUploadButton: document.getElementById('cancel-torrent-upload'),
            confirmTorrentUploadButton: document.getElementById('confirm-torrent-upload'),
            torrentFilename: document.getElementById('torrent-filename'),
            torrentFileInfo: document.getElementById('torrent-file-info'),
            closeTorrentCategoryButton: document.getElementById('close-torrent-category')
        };

        this.initDom();
        this.initEventListeners();
        this.loadFiles();
    },
    
    // Инициализация DOM-элементов
    initDom: function() {
        this.elements = {};
        this.elements.filesContainer = document.getElementById('files-container');
        this.elements.fileUpload = document.getElementById('file-upload');
        this.elements.searchInput = document.getElementById('search');
        this.elements.sortBy = document.getElementById('sort-by');
        this.elements.sortOrder = document.getElementById('sort-order');
        this.elements.addLinkButton = document.getElementById('add-link-button');
        this.elements.addLinkModal = document.getElementById('add-link-modal');
        this.elements.categoryItems = document.querySelectorAll('.menu-item[data-category]');
        this.elements.cancelLinkButton = document.getElementById('cancel-link');
        this.elements.saveLinkButton = document.getElementById('save-link');
        this.elements.closePreviewButton = document.getElementById('close-preview');
        this.elements.previewModal = document.getElementById('preview-modal');
        
        // Элементы модального окна категорий торрентов
        this.elements.torrentCategoryModal = document.getElementById('torrent-category-modal');
        this.elements.torrentCategorySelect = document.getElementById('torrent-category-select');
        this.elements.cancelTorrentUploadButton = document.getElementById('cancel-torrent-upload');
        this.elements.confirmTorrentUploadButton = document.getElementById('confirm-torrent-upload');
        this.elements.torrentFilename = document.getElementById('torrent-filename');
        this.elements.torrentFileInfo = document.getElementById('torrent-file-info');
        this.elements.closeTorrentCategoryButton = document.getElementById('close-torrent-category');
        
        // Проверяем, все ли элементы найдены
        if (!this.elements.filesContainer) {
            console.error('Элемент filesContainer не найден');
            return;
        }
    },
    
    // Полная инициализация модуля
    initModule: function() {
        this.initDom();
        this.initEventListeners();
        this.loadFiles();
        
        // Проверяем торрент-файлы после загрузки DOM
        setTimeout(() => {
            this.checkTorrentFiles();
        }, 1000);
        
        // Добавляем обработчик события изменения языка
        document.addEventListener('languageChanged', () => {
            // Перезагружаем файлы для обновления отображения дат
            this.loadFiles();
        });
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчики категорий
        this.elements.categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                // Обновляем активный элемент
                this.elements.categoryItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Обновляем текущую категорию
                this.state.currentCategory = item.getAttribute('data-category');
                
                // Загружаем файлы
                this.loadFiles();
            });
        });
        
        // Обработчики сортировки
        this.elements.sortBy.addEventListener('change', () => {
            this.state.currentSort = this.elements.sortBy.value;
            this.loadFiles();
        });
        
        this.elements.sortOrder.addEventListener('change', () => {
            this.state.currentOrder = this.elements.sortOrder.value;
            this.loadFiles();
        });
        
        // Обработчик поиска
        let searchTimeout;
        this.elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.state.searchTerm = this.elements.searchInput.value;
                if (this.state.searchTerm.length >= 2) {
                    this.searchFiles();
                } else if (this.state.searchTerm.length === 0) {
                    this.loadFiles();
                }
            }, 300);
        });
        
        // Обработчик загрузки файла
        this.elements.fileUpload.addEventListener('change', () => {
            if (!this.elements.fileUpload.files.length) return;
            
            const file = this.elements.fileUpload.files[0];
            
            // Проверяем размер файла
            if (file.size > 1024 * 1024 * 1024) { // 1GB
                Utils.showNotification(t('file_too_large'), 'warning');
                this.elements.fileUpload.value = '';
                return;
            }
            
            // Проверяем, является ли файл торрентом
            if (file.name.toLowerCase().endsWith('.torrent')) {
                // Показываем модальное окно для выбора категории торрента
                this.showTorrentCategoryModal(file);
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Показываем индикатор загрузки
            this.showLoading(t('uploading_file'));
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadFiles();
                    Utils.loadStats();
                    this.elements.fileUpload.value = '';
                    
                    // Показываем уведомление об успешной загрузке
                    Utils.showNotification(t('file_uploaded_success').replace('{filename}', file.name), 'success');
                } else {
                    Utils.showNotification(`${t('error')}: ${data.error}`, 'error');
                    this.loadFiles();
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки файла:', error);
                Utils.showNotification(t('file_upload_error'), 'error');
                this.loadFiles();
            });
        });
        
        // Настраиваем Drag & Drop для файлов
        this.initDragAndDrop();
        
        // Инициализация обработчиков для модального окна категорий торрентов
        this.initTorrentCategoryModal();
    },
    
    // Инициализация Drag & Drop
    initDragAndDrop: function() {
        const dropZone = this.elements.filesContainer;
        
        // Предотвращаем стандартное поведение браузера при перетаскивании
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, Utils.preventDefaults, false);
            document.body.addEventListener(eventName, Utils.preventDefaults, false);
        });
        
        // Добавляем визуальные индикаторы при перетаскивании
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('highlight');
                dropZone.innerHTML = `<div class="drop-message">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <span>${t('drop_files_here')}</span>
                </div>`;
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('highlight');
                this.loadFiles();
            }, false);
        });
        
        // Обрабатываем сброс файлов
        dropZone.addEventListener('drop', (e) => {
            const items = e.dataTransfer.items;
            
            if (items && items.length > 0) {
                // Если перетаскиваются файлы через DataTransferItemList интерфейс
                this.processItems(items);
            } else {
                // Обычные файлы через DataTransfer интерфейс
                const files = e.dataTransfer.files;
                
                if (files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                        this.uploadFile(files[i]);
                    }
                }
            }
        }, false);
    },
    
    // Рекурсивная обработка папок и файлов
    processItems: function(items) {
        const uploads = [];
        
        function traverseFileTree(item, path = '') {
            if (item.isFile) {
                item.file(file => {
                    // Создаем объект с путем, чтобы сохранить структуру папок
                    const fileWithPath = {
                        file: file,
                        path: path
                    };
                    uploads.push(fileWithPath);
                });
            } else if (item.isDirectory) {
                // Получаем содержимое папки
                const dirReader = item.createReader();
                dirReader.readEntries(entries => {
                    for (let i = 0; i < entries.length; i++) {
                        traverseFileTree(entries[i], path + item.name + '/');
                    }
                });
            }
        }
        
        // Обрабатываем все элементы
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                traverseFileTree(item);
            }
        }
        
        // Процесс загрузки файлов с задержкой, чтобы дать время обработать структуру папок
        setTimeout(() => {
            if (uploads.length > 0) {
                Utils.showNotification(`Загружается ${uploads.length} файлов...`, 'info');
                uploads.forEach(uploadItem => {
                    this.uploadFile(uploadItem.file, uploadItem.path);
                });
            }
        }, 500);
    },
    
    // Загрузка файла
    uploadFile: function(file, path = '') {
        // Проверяем размер файла
        if (file.size > 1024 * 1024 * 1024) { // 1GB
            Utils.showNotification(`Файл "${file.name}" слишком большой. Максимальный размер - 1GB`, 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Добавляем путь, если он есть (для сохранения структуры папок)
        if (path) {
            formData.append('path', path);
        }
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.loadFiles();
                Utils.loadStats();
                
                // Показываем уведомление только при единичной загрузке
                if (!path) {
                    Utils.showNotification(`Файл "${file.name}" успешно загружен`, 'success');
                }
            } else {
                Utils.showNotification(`Ошибка загрузки "${file.name}": ${data.error}`, 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки файла:', error);
            Utils.showNotification(`Ошибка загрузки "${file.name}"`, 'error');
        });
    },
    
    // Загрузка списка файлов
    loadFiles: function() {
        this.showLoading(t('loading_files'));
        
        fetch(`/files?category=${this.state.currentCategory}&sort=${this.state.currentSort}&order=${this.state.currentOrder}`)
            .then(response => response.json())
            .then(files => {
                if (this.state.searchTerm) {
                    files = files.filter(file => {
                        if (file.type === 'file') {
                            return file.original_name.toLowerCase().includes(this.state.searchTerm.toLowerCase());
                        } else if (file.type === 'link') {
                            return file.title.toLowerCase().includes(this.state.searchTerm.toLowerCase()) || 
                                  (file.description && file.description.toLowerCase().includes(this.state.searchTerm.toLowerCase()));
                        }
                        return false;
                    });
                }
                
                if (files.length === 0) {
                    this.showEmptyMessage();
                    return;
                }
                
                this.elements.filesContainer.innerHTML = '';
                files.forEach(item => {
                    if (item.type === 'file') {
                        const fileElement = this.createFileElement(item);
                        this.elements.filesContainer.appendChild(fileElement);
                    } else if (item.type === 'link') {
                        const linkElement = this.createLinkElement(item);
                        this.elements.filesContainer.appendChild(linkElement);
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки файлов:', error);
                this.showLoading(t('file_load_error'), true);
            });
    },
    
    // Поиск файлов
    searchFiles: function() {
        if (!this.state.searchTerm) return this.loadFiles();
        
        this.showLoading(t('searching'));
        
        fetch(`/search?q=${encodeURIComponent(this.state.searchTerm)}`)
            .then(response => response.json())
            .then(results => {
                if (results.length === 0) {
                    this.showEmptyMessage(t('search_no_results').replace('{query}', this.state.searchTerm));
                    return;
                }
                
                this.elements.filesContainer.innerHTML = '';
                results.forEach(item => {
                    if (item.type === 'file') {
                        const fileElement = this.createFileElement(item);
                        this.elements.filesContainer.appendChild(fileElement);
                    } else if (item.type === 'link') {
                        const linkElement = this.createLinkElement(item);
                        this.elements.filesContainer.appendChild(linkElement);
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка поиска:', error);
                this.showLoading(t('search_error'), true);
            });
    },
    
    // Создание элемента файла
    createFileElement: function(file) {
        // Добавляем отладочный вывод для проверки файлов торрентов
        console.log("Создание элемента файла:", file);
        console.log("Категория файла:", file.category);
        console.log("Имя файла:", file.original_name);
        
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.setAttribute('data-id', file.id);
        fileCard.setAttribute('data-filename', file.filename);
        fileCard.setAttribute('data-category', file.category);
        
        const filePreview = document.createElement('div');
        filePreview.className = `file-preview ${this.getFilePreviewClass(file.category)}`;
        
        if (file.category === 'images') {
            // Для изображений показываем превью
            filePreview.style.backgroundImage = `url('/download/${file.category}/${file.filename}')`;
        } else {
            // Для других типов файлов показываем иконку
            const icon = document.createElement('i');
            icon.className = 'file-icon';
            
            // Проверяем, является ли файл торрентом
            if (file.category === 'torrents' || file.original_name.toLowerCase().endsWith('.torrent')) {
                icon.className = 'fa-solid fa-magnet';
            } else {
            switch(file.category) {
                case 'videos':
                    icon.className = 'fa-solid fa-film';
                    break;
                case 'audio':
                    icon.className = 'fa-solid fa-music';
                    break;
                case 'documents':
                    icon.className = 'fa-solid fa-file-lines';
                    break;
                case 'scripts':
                    icon.className = 'fa-solid fa-terminal';
                    break;
                case 'code':
                    icon.className = 'fa-solid fa-code';
                    break;
                case 'archives':
                    icon.className = 'fa-solid fa-file-zipper';
                    break;
                case 'executables':
                    icon.className = 'fa-solid fa-file-code';
                    break;
                case 'databases':
                    icon.className = 'fa-solid fa-database';
                    break;
                default:
                    icon.className = 'fa-solid fa-file';
                }
            }
            
            filePreview.appendChild(icon);
        }
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.original_name;
        
        const fileMeta = document.createElement('div');
        fileMeta.className = 'file-meta';
        
        const fileDate = document.createElement('span');
        fileDate.textContent = Utils.formatDate(file.upload_date);
        
        const fileSize = document.createElement('span');
        fileSize.textContent = Utils.formatFileSize(file.size);
        
        fileMeta.appendChild(fileDate);
        fileMeta.appendChild(fileSize);
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileMeta);
        
        const fileActions = document.createElement('div');
        fileActions.className = 'file-actions';
        
        // Кнопка воспроизведения медиа-файлов
        if (file.category === 'videos' || file.category === 'audio' || 
            file.original_name.toLowerCase().match(/\.(mp4|webm|ogg|mp3|wav|flac|m4a|mov|avi|mkv)$/)) {
            const playButton = document.createElement('a');
            playButton.href = '#';
            playButton.className = 'play-media-btn';
            playButton.innerHTML = '<i class="fa-solid fa-play"></i>';
            playButton.title = t('play_media') || 'Воспроизвести';
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.playMedia(file);
            });
            fileActions.appendChild(playButton);
        }
        
        // Кнопка предпросмотра
        if (Utils.canPreviewFile(file.original_name)) {
            const previewButton = document.createElement('button');
            previewButton.className = 'btn-preview';
            previewButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
            previewButton.title = t('file_preview');
            previewButton.addEventListener('click', () => {
                Utils.showFilePreview(file);
            });
            fileActions.appendChild(previewButton);
        }
        
        // Кнопка скачивания
        const downloadLink = document.createElement('a');
        downloadLink.href = `/download/${file.category}/${file.filename}`;
        downloadLink.innerHTML = '<i class="fa-solid fa-download"></i>';
        downloadLink.title = t('download_file');
        
        // Кнопка шаринга
        const shareLink = document.createElement('a');
        shareLink.href = '#';
        shareLink.className = 'share-btn';
        shareLink.innerHTML = '<i class="fa-solid fa-share-alt"></i>';
        shareLink.title = t('share');
        shareLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.shareFile(file.id);
        });
        
        // Кнопка удаления
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteLink.title = t('delete');
        deleteLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(t('delete_file_confirm').replace('{filename}', file.original_name))) {
                this.deleteFile(file.id);
            }
        });
        
        fileActions.appendChild(downloadLink);
        fileActions.appendChild(shareLink);
        fileActions.appendChild(deleteLink);
        
        fileCard.appendChild(filePreview);
        fileCard.appendChild(fileInfo);
        fileCard.appendChild(fileActions);
        
        return fileCard;
    },
    
    // Создание элемента ссылки
    createLinkElement: function(link) {
        const linkCard = document.createElement('div');
        linkCard.className = 'file-card';
        
        const linkPreview = document.createElement('div');
        linkPreview.className = 'file-preview links';
        
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-link file-icon';
        linkPreview.appendChild(icon);
        
        const linkInfo = document.createElement('div');
        linkInfo.className = 'file-info';
        
        const linkTitle = document.createElement('div');
        linkTitle.className = 'file-name';
        linkTitle.textContent = link.title;
        
        const linkDescription = document.createElement('div');
        linkDescription.className = 'file-description';
        linkDescription.textContent = link.description || t('no_description');
        
        const linkMeta = document.createElement('div');
        linkMeta.className = 'file-meta';
        
        const linkDate = document.createElement('span');
        linkDate.textContent = Utils.formatDate(link.upload_date);
        
        linkMeta.appendChild(linkDate);
        
        linkInfo.appendChild(linkTitle);
        linkInfo.appendChild(linkDescription);
        linkInfo.appendChild(linkMeta);
        
        const linkActions = document.createElement('div');
        linkActions.className = 'file-actions';
        
        // Кнопка открытия ссылки
        const openLink = document.createElement('a');
        openLink.href = link.url;
        openLink.target = '_blank';
        openLink.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
        openLink.title = t('open_link');
        
        // Кнопка удаления
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteLink.title = t('delete');
        deleteLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(t('delete_link_confirm').replace('{title}', link.title))) {
                this.deleteLink(link.id);
            }
        });
        
        linkActions.appendChild(openLink);
        linkActions.appendChild(deleteLink);
        
        linkCard.appendChild(linkPreview);
        linkCard.appendChild(linkInfo);
        linkCard.appendChild(linkActions);
        
        return linkCard;
    },
    
    // Удаление файла
    deleteFile: function(fileId) {
        fetch(`/delete_file/${fileId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadFiles();
                    Utils.loadStats();
                    Utils.showNotification(t('file_deleted'), 'success');
                } else {
                    Utils.showNotification(`${t('file_delete_error')}: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка удаления файла:', error);
                Utils.showNotification(t('file_delete_error_generic'), 'error');
            });
    },
    
    // Удаление ссылки
    deleteLink: function(linkId) {
        fetch(`/delete_link/${linkId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadFiles();
                    Utils.loadStats();
                    Utils.showNotification(t('link_deleted'), 'success');
                } else {
                    Utils.showNotification(`${t('link_delete_error')}: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка удаления ссылки:', error);
                Utils.showNotification(t('link_delete_error_generic'), 'error');
            });
    },
    
    // Вспомогательные функции для отображения состояния
    showLoading: function(message, isError = false) {
        this.elements.filesContainer.innerHTML = `<div class="loading ${isError ? 'error' : ''}">
            <i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-spinner fa-spin'}"></i> 
            ${message}
        </div>`;
    },
    
    showEmptyMessage: function(message = t('no_files')) {
        this.elements.filesContainer.innerHTML = `<div class="loading">
            <i class="fa-solid fa-folder-open"></i> 
            ${message}
        </div>`;
    },

    // Получение названия категории торрента
    getTorrentCategoryName: function(category) {
        const categoryMap = {
            'movies': t('torrent_category_movies') || 'Фильмы',
            'tv': t('torrent_category_tv') || 'Сериалы',
            'music': t('torrent_category_music') || 'Музыка',
            'games': t('torrent_category_games') || 'Игры',
            'software': t('torrent_category_software') || 'Программы',
            'books': t('torrent_category_books') || 'Книги',
            'other': t('torrent_category_other') || 'Другое'
        };
        
        return categoryMap[category] || category;
    },

    // Метод для рендеринга списка файлов
    renderFiles: function(files) {
        if (!files || !files.length) {
            this.elements.filesContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>${t('no_files_found')}</p>
                </div>
            `;
            return;
        }
        
        // Отладочная информация
        console.log("Файлы для рендеринга:", files);
        
        let html = '';
        
        for (const file of files) {
            // Отладочная информация для торрентов
            if (file.category === 'torrents' || (file.original_name && file.original_name.toLowerCase().endsWith('.torrent'))) {
                console.log("Найден торрент-файл:", file);
                // Принудительно устанавливаем категорию torrents для файлов с расширением .torrent
                if (file.original_name && file.original_name.toLowerCase().endsWith('.torrent')) {
                    file.category = 'torrents';
                }
            }
            
            if (file.type === 'file') {
                const fileExt = file.original_name.split('.').pop().toLowerCase();
                
                // Проверяем, является ли файл торрентом по расширению, и если да, принудительно устанавливаем категорию
                if (fileExt === 'torrent') {
                    file.category = 'torrents';
                }
                
                const fileIcon = this.getFileIcon(fileExt, file.category);
                const filePreviewClass = this.getFilePreviewClass(file.category);
                
                // Улучшаем определение торрент-файлов для гарантированного отображения кнопки "Скачать на сервере"
                const isTorrent = file.category === 'torrents' || 
                               fileExt === 'torrent' || 
                               file.original_name.toLowerCase().endsWith('.torrent');
                
                console.log(`Файл: ${file.original_name}, Категория: ${file.category}, Торрент: ${isTorrent}`);
                
                // Добавляем информацию о категории торрента, если она есть
                let torrentCategoryInfo = '';
                if (file.category === 'torrents' && file.torrent_category) {
                    torrentCategoryInfo = `<div class="torrent-category-info"><span class="category-badge" data-category="${file.torrent_category}">${this.getTorrentCategoryName(file.torrent_category)}</span></div>`;
                }
                
                html += `
                    <div class="file-card" 
                        data-id="${file.id}" 
                        data-filename="${file.original_name}" 
                        data-category="${file.category || ''}" 
                        data-is-torrent="${isTorrent}">
                        <div class="file-preview ${filePreviewClass}">
                            ${fileIcon}
                        </div>
                        <div class="file-info">
                            <div class="file-name">${file.original_name}</div>
                            ${torrentCategoryInfo}
                            <div class="file-meta">
                                <span>${this.formatDate(file.upload_date)}</span> · 
                                <span>${this.formatFileSize(file.size)}</span>
                            </div>
                            </div>
                            <div class="file-actions">
                                <a href="#" class="download-btn" title="${t('download')}">
                                    <i class="fa-solid fa-download"></i>
                                </a>
                            ${isTorrent ? `
                            <a href="#" class="download-server-btn" title="${t('download_on_server') || 'Скачать на сервере'}">
                                <i class="fa-solid fa-server"></i>
                            </a>
                            ` : ''}
                                <a href="#" class="preview-btn" title="${t('preview')}" data-preview-supported="${this.isPreviewSupported(file.original_name)}">
                                    <i class="fa-solid fa-eye"></i>
                                </a>
                                <a href="#" class="share-btn" title="${t('share')}">
                                    <i class="fa-solid fa-share-alt"></i>
                                </a>
                                <a href="#" class="delete-btn" title="${t('delete')}">
                                    <i class="fa-solid fa-trash"></i>
                                </a>
                        </div>
                    </div>
                `;
            } else if (file.type === 'link') {
                html += `
                    <div class="file-card" data-id="${file.id}" data-type="link">
                        <div class="file-preview links">
                            <i class="fa-solid fa-link"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">
                                <a href="${file.url}" target="_blank">${file.title}</a>
                            </div>
                            <div class="file-description">${file.description || ''}</div>
                            <div class="file-meta">
                                <span>${this.formatDate(file.upload_date)}</span>
                            </div>
                            <div class="file-actions">
                                <a href="${file.url}" target="_blank" class="open-btn" title="${t('open_link')}">
                                    <i class="fa-solid fa-external-link-alt"></i>
                                </a>
                                <a href="#" class="delete-link-btn" title="${t('delete')}">
                                    <i class="fa-solid fa-trash"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        this.elements.filesContainer.innerHTML = html;
        
        // Добавляем обработчики событий
        this.addFileEventListeners();
    },

    // Обработчики событий файлов
    addFileEventListeners: function() {
        // Получаем все карточки файлов
        const fileCards = document.querySelectorAll('.file-card');
        
        fileCards.forEach(card => {
            // Добавляем обработчик для скачивания файла
            const downloadBtn = card.querySelector('.download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fileId = card.getAttribute('data-id');
                    const filename = card.getAttribute('data-filename');
                    this.downloadFile(fileId, filename);
                });
            }
            
            // Добавляем обработчик для кнопки "Скачать на сервере"
            const downloadServerBtn = card.querySelector('.download-server-btn');
            if (downloadServerBtn) {
                console.log("Найдена кнопка 'Скачать на сервере' для файла:", card.getAttribute('data-filename'));
                downloadServerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fileId = card.getAttribute('data-id');
                    const filename = card.getAttribute('data-filename');
                    const category = card.getAttribute('data-category');
                    console.log("Нажата кнопка 'Скачать на сервере' для файла:", filename);
                    this.downloadTorrentOnServer(category, filename, fileId);
                });
            }
            
            // Добавляем обработчик для предпросмотра файла
            const previewBtn = card.querySelector('.preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (previewBtn.getAttribute('data-preview-supported') === 'false') {
                        Utils.showNotification(t('preview_not_supported'), 'warning');
                        return;
                    }
                    
                    const fileId = card.getAttribute('data-id');
                    const filename = card.getAttribute('data-filename');
                    this.previewFile(fileId, filename);
                });
            }
            
            // Добавляем обработчик для шаринга файла
            const shareBtn = card.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fileId = card.getAttribute('data-id');
                    this.shareFile(fileId);
                });
            }
            
            // Добавляем обработчик для удаления файла
            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const fileId = card.getAttribute('data-id');
                    this.confirmDeleteFile(fileId);
                });
            }
            
            // Удаление ссылки
            const deleteLinkBtn = card.querySelector('.delete-link-btn');
            if (deleteLinkBtn) {
                deleteLinkBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const linkId = card.getAttribute('data-id');
                    this.confirmDeleteLink(linkId);
                });
            }
        });
    },

    // Метод для добавления кнопки "Скачать на сервере" для торрент-файлов
    addDownloadServerButton: function(card) {
        // Проверяем, является ли файл торрентом
        const filename = card.getAttribute('data-filename');
        const category = card.getAttribute('data-category');
        const fileId = card.getAttribute('data-id');
        
        // Улучшаем определение торрент-файлов
        const isTorrent = card.getAttribute('data-is-torrent') === 'true' || 
                         category === 'torrents' || 
                         (filename && filename.toLowerCase().endsWith('.torrent'));
        
        // Отладочная информация
        console.log("Проверка на добавление кнопки для файла:", filename, "Категория:", category, "Торрент:", isTorrent);
        
        // Если файл уже имеет кнопку, не добавляем ее
        if (card.querySelector('.download-server-btn')) {
            console.log("У файла уже есть кнопка 'Скачать на сервере':", filename);
            return;
        }
        
        // Если файл - торрент, добавляем кнопку "Скачать на сервере"
        if (isTorrent) {
            console.log("Добавляем кнопку 'Скачать на сервере' для торрента:", filename);
            
            const fileActions = card.querySelector('.file-actions');
            if (fileActions) {
                // Создаем и добавляем кнопку "Скачать на сервере"
                const serverBtn = document.createElement('a');
                serverBtn.href = "#";
                serverBtn.className = "download-server-btn";
                serverBtn.title = t('download_on_server') || 'Скачать на сервере';
                serverBtn.innerHTML = '<i class="fa-solid fa-server"></i>';
                
                // Добавляем обработчик события
                serverBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.downloadTorrentOnServer(category, filename, fileId);
                });
                
                // Вставляем кнопку в начало списка действий
                fileActions.insertBefore(serverBtn, fileActions.firstChild);
                console.log("Кнопка 'Скачать на сервере' успешно добавлена для:", filename);
            } else {
                console.error("Не удалось найти контейнер для действий файла:", filename);
            }
        }
    },

    // Создание и управление ссылками шаринга
    shareFile: function(fileId) {
        // Создаем модальное окно для шаринга
        const modalHtml = `
            <div id="share-file-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 data-i18n="share_file">Поделиться файлом</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div id="share-loading">
                            <i class="fa-solid fa-spinner fa-spin"></i> <span data-i18n="creating_link">Создание ссылки...</span>
                        </div>
                        <div id="share-link-container" style="display:none;">
                            <div class="input-group">
                                <label data-i18n="share_link">Ссылка для шаринга:</label>
                                <div class="input-with-copy">
                                    <input type="text" id="share-link-input" readonly>
                                    <button id="copy-share-link" class="btn-copy">
                                        <i class="fa-solid fa-copy"></i>
                                        <span data-i18n="copy">Копировать</span>
                                    </button>
                                </div>
                            </div>
                            <div class="input-group">
                                <label data-i18n="expiry_period">Срок действия ссылки:</label>
                                <div class="expiry-time-selector">
                                    <div class="expiry-time-item">
                                        <input type="number" id="expiry-days" min="0" max="365" value="30" class="expiry-input">
                                        <label for="expiry-days" data-i18n="expiry_days_label">дней</label>
                                    </div>
                                    <div class="expiry-time-item">
                                        <input type="number" id="expiry-hours" min="0" max="23" value="0" class="expiry-input">
                                        <label for="expiry-hours" data-i18n="expiry_hours_label">часов</label>
                                    </div>
                                    <div class="expiry-time-item">
                                        <input type="number" id="expiry-minutes" min="0" max="59" value="0" class="expiry-input">
                                        <label for="expiry-minutes" data-i18n="expiry_minutes_label">минут</label>
                                    </div>
                                </div>
                            </div>
                            <div class="share-info">
                                <p>
                                    <span data-i18n="share_link_info_1">Любой, у кого есть эта ссылка, может скачать файл.</span>
                                    <span id="expiry-date-info"></span>
                                </p>
                            </div>
                            <div class="share-actions">
                                <button id="copy-share-link-btn" class="btn-success">
                                    <i class="fa-solid fa-copy"></i> <span data-i18n="copy_to_clipboard">Копировать в буфер обмена</span>
                                </button>
                                <button id="update-expiry-btn" class="btn-primary">
                                    <i class="fa-solid fa-rotate"></i> <span data-i18n="update_expiry">Обновить срок</span>
                                </button>
                                <button id="delete-share-link" class="btn-danger">
                                    <i class="fa-solid fa-trash"></i> <span data-i18n="delete_link">Удалить ссылку</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="close-share-modal" data-i18n="close">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Получаем элементы модального окна
        const modal = document.getElementById('share-file-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const closeModalBtn = document.getElementById('close-share-modal');
        const loading = document.getElementById('share-loading');
        const linkContainer = document.getElementById('share-link-container');
        const linkInput = document.getElementById('share-link-input');
        const copyBtn = document.getElementById('copy-share-link');
        const deleteBtn = document.getElementById('delete-share-link');
        const expiryDaysInput = document.getElementById('expiry-days');
        const expiryHoursInput = document.getElementById('expiry-hours');
        const expiryMinutesInput = document.getElementById('expiry-minutes');
        const updateExpiryBtn = document.getElementById('update-expiry-btn');
        const expiryDateInfo = document.getElementById('expiry-date-info');
        
        // Открываем модальное окно
        modal.style.display = 'block';
        
        // Функция для инициализации переводов для динамически созданных элементов
        const initTranslations = () => {
            // Находим все элементы с атрибутом data-i18n внутри модального окна
            const translationElements = modal.querySelectorAll('[data-i18n]');
            
            // Устанавливаем переведенный текст
            translationElements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.textContent = t(key);
                
                // Для элементов с placeholder
                if (element.hasAttribute('placeholder')) {
                    const placeholderKey = element.getAttribute('data-i18n-placeholder');
                    if (placeholderKey) {
                        element.setAttribute('placeholder', t(placeholderKey));
                    }
                }
                
                // Для кнопок с title
                if (element.hasAttribute('title')) {
                    const titleKey = element.getAttribute('data-i18n-title');
                    if (titleKey) {
                        element.setAttribute('title', t(titleKey));
                    }
                }
            });
            
            // Устанавливаем title для кнопки копирования
            if (copyBtn) {
                copyBtn.setAttribute('title', t('copy_to_clipboard'));
            }
        };
        
        // Применяем переводы к элементам модального окна
        initTranslations();
        
        // Обработчики закрытия модального окна
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Функция для обновления информации о сроке действия
        const updateExpiryInfo = (expiryDate) => {
            const date = new Date(expiryDate);
            // Получаем текущий язык
            const currentLanguage = localStorage.getItem('language') || 'ru';
            // Форматируем дату с учетом локали
            const options = { 
                day: 'numeric', 
                month: 'numeric', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
            };
            const locale = currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
            const formattedDate = date.toLocaleString(locale, options);
            expiryDateInfo.innerHTML = t('expiry_date_info').replace('{date}', formattedDate);
        };
        
        // Получаем срок действия ссылки в днях (с дробной частью)
        const getExpiryDays = () => {
            const days = parseInt(expiryDaysInput.value) || 0;
            const hours = parseInt(expiryHoursInput.value) || 0;
            const minutes = parseInt(expiryMinutesInput.value) || 0;
            
            // Переводим часы и минуты в доли дня
            return days + (hours / 24) + (minutes / (24 * 60));
        };
        
        // Создаем ссылку для шаринга
        const createShareLink = (days) => {
            loading.style.display = 'block';
            linkContainer.style.display = 'none';
            
            fetch('/create_share_link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    file_id: fileId,
                    expiry_days: days || getExpiryDays() 
                })
            })
            .then(response => response.json())
            .then(data => {
                loading.style.display = 'none';
                linkContainer.style.display = 'block';
                
                // Устанавливаем значение ссылки в поле ввода
                linkInput.value = data.url;
                
                // Сохраняем ID ссылки для удаления
                deleteBtn.setAttribute('data-link-id', data.id);
                
                // Обновляем информацию о сроке действия
                updateExpiryInfo(data.expiry_date);
            })
            .catch(error => {
                console.error('Ошибка создания ссылки:', error);
                Utils.showNotification(t('error_creating_share_link'), 'error');
                
                // Закрываем модальное окно
                modal.style.display = 'none';
                
                // Удаляем модальное окно из DOM после закрытия
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
        };
        
        // Первоначальное создание ссылки с выбранным сроком
        createShareLink();
        
        // Обработчик обновления срока действия
        updateExpiryBtn.addEventListener('click', () => {
            // Сначала удаляем старую ссылку
            const linkId = deleteBtn.getAttribute('data-link-id');
            
            fetch(`/delete_share_link/${linkId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Затем создаем новую с обновленным сроком
                    createShareLink();
                } else {
                    Utils.showNotification(t('error_updating_expiry'), 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка обновления срока:', error);
                Utils.showNotification(t('error_updating_expiry'), 'error');
            });
        });
        
        // Обработчик копирования ссылки с анимацией
        copyBtn.addEventListener('click', () => {
            // Выделяем текст и копируем
            linkInput.select();
            document.execCommand('copy');
            
            // Добавляем анимацию для кнопки копирования
            copyBtn.classList.add('copied');
            copyBtn.querySelector('span').textContent = t('copied');
            
            // Показываем уведомление
            Utils.showNotification(t('link_copied_to_clipboard'), 'success');
            
            // Возвращаем исходный вид кнопки через 1.5 секунды
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.querySelector('span').textContent = t('copy');
            }, 1500);
            
            // Добавляем анимацию для поля ввода
            linkInput.classList.add('highlight-success');
            setTimeout(() => {
                linkInput.classList.remove('highlight-success');
            }, 1000);
        });
        
        // Обработчик для дополнительной кнопки копирования в блоке действий
        const copyShareLinkBtn = document.getElementById('copy-share-link-btn');
        if (copyShareLinkBtn) {
            copyShareLinkBtn.addEventListener('click', () => {
                // Выделяем текст и копируем
                linkInput.select();
                document.execCommand('copy');
                
                // Добавляем анимацию для кнопки копирования
                copyShareLinkBtn.classList.add('copied');
                
                // Показываем уведомление
                Utils.showNotification(t('link_copied_to_clipboard'), 'success');
                
                // Возвращаем исходный вид кнопки через 1.5 секунды
                setTimeout(() => {
                    copyShareLinkBtn.classList.remove('copied');
                }, 1500);
                
                // Добавляем анимацию для поля ввода
                linkInput.classList.add('highlight-success');
                setTimeout(() => {
                    linkInput.classList.remove('highlight-success');
                }, 1000);
            });
        }
        
        // Обработчик удаления ссылки
        deleteBtn.addEventListener('click', () => {
            const linkId = deleteBtn.getAttribute('data-link-id');
            
            fetch(`/delete_share_link/${linkId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Utils.showNotification(t('share_link_deleted'), 'success');
                    
                    // Закрываем модальное окно
                    modal.style.display = 'none';
                    
                    // Удаляем модальное окно из DOM после закрытия
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                } else {
                    Utils.showNotification(t('error_deleting_share_link'), 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка удаления ссылки:', error);
                Utils.showNotification(t('error_deleting_share_link'), 'error');
            });
        });
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                
                // Удаляем модальное окно из DOM после закрытия
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    },
    
    // Форматирование размера файла
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Байт';
        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Скачивание торрента на сервере
    downloadTorrentOnServer: function(category, filename, fileId) {
        // Показываем уведомление о начале загрузки
        Utils.showNotification(t('download_started').replace('{filename}', filename), 'info');
        
        // Начинаем скачивание
        fetch('/download_torrent_on_server', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: category,
                filename: filename,
                file_id: fileId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                Utils.showNotification(`${t('error')}: ${data.error}`, 'error');
                return;
            }
            
            // Подключаемся к обновлениям через EventSource
            const eventSource = new EventSource(`/torrent_download_progress/${data.download_id}`);
            
            // Обрабатываем события от сервера
            eventSource.onmessage = function(event) {
                const progress = JSON.parse(event.data);
                
                // Если загрузка завершена, показываем уведомление и закрываем соединение
                if (progress.status === 'completed') {
                    eventSource.close();
                    Utils.showNotification(
                        t('download_completed').replace('{filename}', filename) + 
                        (progress.target_category ? ` (${t(progress.target_category)})` : ''),
                        'success'
                    );
                    
                    // Обновляем список файлов через 1 секунду, чтобы показать скачанный файл
                    setTimeout(() => {
                        this.loadFiles();
                    }, 1000);
                } 
                // Если возникла ошибка, показываем уведомление и закрываем соединение
                else if (progress.status === 'error') {
                    eventSource.close();
                    
                    // Скрываем конкретную ошибку с NoneType
                    if (progress.error && progress.error.includes("'NoneType' object has no attribute 'id'")) {
                        console.error("Скрытая ошибка:", progress.error);
                        Utils.showNotification(t('download_error') + ": " + t('unknown_error'), 'error');
                    } else {
                        Utils.showNotification(`${t('download_error')}: ${progress.error || t('unknown_error')}`, 'error');
                    }
                }
            }.bind(this);
            
            // Обработка ошибок соединения
            eventSource.onerror = function() {
                eventSource.close();
                Utils.showNotification(t('server_connection_error'), 'error');
            };
        })
        .catch(error => {
            console.error('Ошибка при скачивании торрента:', error);
            
            // Скрываем конкретную ошибку с NoneType
            if (error.message && error.message.includes("'NoneType' object has no attribute 'id'")) {
                console.error("Скрытая ошибка:", error.message);
                Utils.showNotification(t('download_error') + ": " + t('unknown_error'), 'error');
            } else {
                Utils.showNotification(`${t('download_error')}: ${error.message}`, 'error');
            }
        });
    },
    
    // Скачивание файла
    downloadFile: function(fileId, filename) {
        // ... existing code ...
    },
    
    // Получение CSS класса для превью файла
    getFilePreviewClass: function(category) {
        // Логируем категорию для отладки
        console.log("Получена категория для превью:", category);
        
        switch(category) {
            case 'images': return 'images';
            case 'videos': return 'videos';
            case 'audio': return 'audio';
            case 'documents': return 'documents';
            case 'scripts': return 'scripts';
            case 'archives': return 'archives';
            case 'code': return 'code';
            case 'executables': return 'executables';
            case 'databases': return 'databases';
            case 'torrents': return 'torrents'; // Добавляем поддержку торрентов
            default: return 'other';
        }
    },
    
    // Получение иконки файла
    getFileIcon: function(fileExt, category) {
        // Логируем расширение и категорию для отладки
        console.log("Получено расширение для иконки:", fileExt, "категория:", category);
        
        // Если категория - торренты или расширение файла .torrent, используем специальную иконку
        if (category === 'torrents' || fileExt === 'torrent') {
            return '<i class="fa-solid fa-magnet"></i>';
        }
        
        // Иконки для разных типов файлов
        switch(fileExt) {
            // Изображения
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': case 'bmp': 
            case 'webp': case 'tiff': case 'ico': case 'ai': case 'psd': case 'xcf': 
            case 'eps':
                return '<i class="fa-regular fa-image"></i>';
                
            // Видео
            case 'mp4': case 'avi': case 'mov': case 'webm': case 'mkv': case 'flv': 
            case '3gp': case 'wmv': case 'mpg': case 'mpeg': case 'm4v':
                return '<i class="fa-solid fa-video"></i>';
                
            // Аудио
            case 'mp3': case 'wav': case 'ogg': case 'flac': case 'aac': case 'm4a': 
            case 'wma': case 'opus':
                return '<i class="fa-solid fa-music"></i>';
                
            // Документы
            case 'pdf': return '<i class="fa-regular fa-file-pdf"></i>';
            case 'doc': case 'docx': case 'odt': case 'rtf':
                return '<i class="fa-regular fa-file-word"></i>';
            case 'xls': case 'xlsx': case 'ods': case 'csv':
                return '<i class="fa-regular fa-file-excel"></i>';
            case 'ppt': case 'pptx': case 'odp':
                return '<i class="fa-regular fa-file-powerpoint"></i>';
            case 'txt': case 'md':
                return '<i class="fa-regular fa-file-lines"></i>';
                
            // Архивы
            case 'zip': case 'rar': case 'tar': case 'gz': case '7z': case 'bz2': 
            case 'xz': case 'tgz': case 'iso':
                return '<i class="fa-solid fa-file-zipper"></i>';
                
            // Код
            case 'py': case 'js': case 'html': case 'css': case 'c': case 'cpp': 
            case 'h': case 'java': case 'php': case 'rb': case 'pl': case 'swift': 
            case 'go': case 'ts': case 'json': case 'xml': case 'yml': case 'yaml': 
            case 'toml': case 'ipynb': case 'sql': case 'r': case 'lua': case 'cs': 
            case 'kt': case 'rs':
                return '<i class="fa-solid fa-code"></i>';
                
            // Исполняемые файлы
            case 'exe': case 'msi': case 'apk': case 'deb': case 'rpm': case 'app': 
            case 'pkg': case 'dmg': case 'jar': case 'war': case 'dll':
                return '<i class="fa-solid fa-cog"></i>';
                
            // Скрипты
            case 'sh': case 'bash': case 'zsh': case 'bat': case 'cmd': case 'ps1': 
            case 'vbs': case 'jsx': case 'cmake':
                return '<i class="fa-solid fa-terminal"></i>';
                
            // Базы данных
            case 'db': case 'sqlite': case 'sqlite3': case 'sql': case 'accdb': 
            case 'mdb': case 'frm':
                return '<i class="fa-solid fa-database"></i>';
                
            // Торренты
            case 'torrent':
                return '<i class="fa-solid fa-magnet"></i>';
                
            // По умолчанию
            default:
                return '<i class="fa-regular fa-file"></i>';
        }
    },
    
    // Проверка, поддерживается ли предпросмотр
    isPreviewSupported: function(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        // Изображения
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
            return true;
        }
        
        // Текстовые файлы
        if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'c', 'cpp', 'h', 'java', 
             'php', 'rb', 'sh', 'bash', 'yml', 'yaml', 'toml', 'log', 'ini', 'cfg', 'conf'].includes(ext)) {
            return true;
        }
        
        // PDF предпросмотр
        if (ext === 'pdf') {
            return true;
        }
        
        // Торренты
        if (ext === 'torrent') {
            return true;
        }
        
        return false;
    },
    
    // Проверка и обновление всех торрент-файлов
    checkTorrentFiles: function() {
        console.log('Проверка торрент-файлов...');
        
        // Проверяем все файловые карточки
        const fileCards = document.querySelectorAll('.file-card');
        fileCards.forEach(card => {
            const filename = card.getAttribute('data-filename');
            if (filename && filename.toLowerCase().endsWith('.torrent')) {
                console.log('Найден торрент-файл:', filename);
                // Устанавливаем категорию 'torrents'
                card.setAttribute('data-category', 'torrents');
                // Обновляем класс превью
                const previewDiv = card.querySelector('.file-preview');
                if (previewDiv) {
                    previewDiv.className = 'file-preview torrents';
                }
                // Добавляем кнопку "Скачать на сервере"
                this.addDownloadServerButton(card);
            }
        });
    },

    // Инициализация обработчиков для модального окна категорий торрентов
    initTorrentCategoryModal: function() {
        if (!this.elements.torrentCategoryModal) return;
        
        // Закрытие модального окна по кнопке "Отмена"
        this.elements.cancelTorrentUploadButton.addEventListener('click', () => {
            this.elements.torrentCategoryModal.style.display = 'none';
            this.elements.fileUpload.value = '';
        });
        
        // Закрытие модального окна по крестику
        this.elements.closeTorrentCategoryButton.addEventListener('click', () => {
            this.elements.torrentCategoryModal.style.display = 'none';
            this.elements.fileUpload.value = '';
        });
        
        // Загрузка торрента по кнопке "Загрузить"
        this.elements.confirmTorrentUploadButton.addEventListener('click', () => {
            const selectedCategory = this.elements.torrentCategorySelect.value;
            const file = this._pendingTorrentFile;
            
            if (!file || !selectedCategory) {
                Utils.showNotification(t('error_uploading_torrent'), 'error');
                this.elements.torrentCategoryModal.style.display = 'none';
                this.elements.fileUpload.value = '';
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('torrent_category', selectedCategory);
            
            // Показываем индикатор загрузки
            this.showLoading(t('uploading_file'));
            this.elements.torrentCategoryModal.style.display = 'none';
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadFiles();
                    Utils.loadStats();
                    this.elements.fileUpload.value = '';
                    
                    // Показываем уведомление об успешной загрузке
                    Utils.showNotification(t('file_uploaded_success').replace('{filename}', file.name), 'success');
                } else {
                    Utils.showNotification(`${t('error')}: ${data.error}`, 'error');
                    this.loadFiles();
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки торрент-файла:', error);
                Utils.showNotification(t('file_upload_error'), 'error');
                this.loadFiles();
            });
        });
    },

    // Показать модальное окно категорий торрентов
    showTorrentCategoryModal: function(file) {
        if (!this.elements.torrentCategoryModal) return;
        
        // Сохраняем файл торрента для дальнейшей обработки
        this._pendingTorrentFile = file;
        
        // Показываем имя файла
        this.elements.torrentFilename.textContent = file.name;
        this.elements.torrentFileInfo.classList.remove('hidden');
        
        // Загружаем категории торрентов
        fetch('/torrent_categories')
            .then(response => response.json())
            .then(data => {
                // Очищаем селект
                this.elements.torrentCategorySelect.innerHTML = '';
                
                // Добавляем категории
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.description;
                    this.elements.torrentCategorySelect.appendChild(option);
                });
                
                // Показываем модальное окно
                this.elements.torrentCategoryModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Ошибка загрузки категорий торрентов:', error);
                Utils.showNotification(t('error_loading_torrent_categories'), 'error');
                
                // Загружаем файл без категории
                this.uploadFile(file);
            });
    },

    // Добавляем новый метод для воспроизведения медиа-файлов
    playMedia: function(file) {
        console.log('Воспроизведение медиа:', file);
        
        // Создаём модальное окно с плеером
        const modalHtml = `
            <div id="media-player-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="media-file-name">${Utils.escapeHtml(file.original_name)}</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div id="media-player-loading" class="loading">
                            <i class="fa-solid fa-spinner fa-spin"></i> <span>${t('loading_media')}</span>
                        </div>
                        <div id="media-player-container" style="display:none;"></div>
                        <div id="media-player-error" class="preview-error" style="display:none;">
                            <i class="fa-solid fa-circle-exclamation"></i>
                            <span class="error-message"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="/download/${file.category}/${file.filename}" class="btn-primary" download="${file.original_name}">
                            <i class="fa-solid fa-download"></i> ${t('download_file')}
                        </a>
                        <button class="btn-secondary" id="close-media-modal">${t('close')}</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Получаем элементы модального окна
        const modal = document.getElementById('media-player-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const closeModalBtn = document.getElementById('close-media-modal');
        const loading = document.getElementById('media-player-loading');
        const playerContainer = document.getElementById('media-player-container');
        const errorContainer = document.getElementById('media-player-error');
        const errorMessage = errorContainer.querySelector('.error-message');
        
        // Открываем модальное окно
        modal.style.display = 'block';
        
        // Загружаем данные медиафайла
        fetch(`/media_player/${file.category}/${file.filename}`)
            .then(response => response.json())
            .then(data => {
                loading.style.display = 'none';
                
                if (data.error) {
                    errorContainer.style.display = 'flex';
                    errorMessage.textContent = data.error;
                    return;
                }
                
                playerContainer.style.display = 'block';
                
                // Создаем плеер в зависимости от типа медиа
                if (data.type === 'video') {
                    const video = document.createElement('video');
                    video.controls = true;
                    video.autoplay = true;
                    video.className = 'media-player';
                    video.src = data.url;
                    video.style.width = '100%';
                    video.style.maxHeight = '70vh';
                    playerContainer.appendChild(video);
                } else if (data.type === 'audio') {
                    const audioContainer = document.createElement('div');
                    audioContainer.className = 'audio-player-container';
                    
                    const audioImage = document.createElement('div');
                    audioImage.className = 'audio-player-image';
                    audioImage.innerHTML = '<i class="fa-solid fa-music"></i>';
                    
                    const audio = document.createElement('audio');
                    audio.controls = true;
                    audio.autoplay = true;
                    audio.className = 'audio-player';
                    audio.src = data.url;
                    audio.style.width = '100%';
                    
                    audioContainer.appendChild(audioImage);
                    audioContainer.appendChild(audio);
                    playerContainer.appendChild(audioContainer);
                } else {
                    errorContainer.style.display = 'flex';
                    errorMessage.textContent = t('unsupported_media_type');
                }
            })
            .catch(error => {
                loading.style.display = 'none';
                errorContainer.style.display = 'flex';
                errorMessage.textContent = `${t('error_loading_media')}: ${error.message}`;
            });
        
        // Обработчики закрытия модального окна
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeModalBtn.addEventListener('click', closeModal);
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    },
}; 
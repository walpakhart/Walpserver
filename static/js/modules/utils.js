/**
 * Утилиты и вспомогательные функции 
 */
const Utils = {
    /**
     * Загрузка статистики
     */
    loadStats: function() {
        fetch('/stats')
            .then(response => response.json())
            .then(stats => {
                document.getElementById('files-count').textContent = stats.file_count;
                document.getElementById('links-count').textContent = stats.link_count;
                document.getElementById('total-size').textContent = this.formatFileSize(stats.total_size);
            })
            .catch(error => {
                console.error('Ошибка загрузки статистики:', error);
            });
    },
    
    /**
     * Проверка валидности URL
     */
    isValidURL: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },
    
    /**
     * Форматирование размера файла
     */
    formatFileSize: function(bytes) {
        if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    /**
     * Форматирование даты
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const lang = localStorage.getItem('language') || 'ru';
        return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    /**
     * Предотвращение стандартного поведения браузера
     */
    preventDefaults: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },
    
    /**
     * Экранирование HTML
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Показ уведомления
     */
    showNotification: function(message, type = 'info') {
        // Используем функцию перевода, если сообщение является ключом перевода
        if (typeof message === 'string' && translations[localStorage.getItem('language') || 'ru'][message]) {
            message = t(message);
        }
        
        // Создаём элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Добавляем иконку в зависимости от типа
        let icon;
        switch(type) {
            case 'success':
                icon = 'fa-circle-check';
                break;
            case 'error':
                icon = 'fa-circle-xmark';
                break;
            case 'warning':
                icon = 'fa-triangle-exclamation';
                break;
            default:
                icon = 'fa-circle-info';
        }
        
        notification.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
            <button class="close-notification"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        // Добавляем уведомление на страницу
        document.body.appendChild(notification);
        
        // Обработчик для закрытия уведомления
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    },
    
    /**
     * Проверка возможности предпросмотра файла
     */
    canPreviewFile: function(filename) {
        const previewableExtensions = ['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'xml', 'csv', 
                                      'sh', 'bash', 'c', 'cpp', 'h', 'java', 'php', 'rb', 'pl', 'swift',
                                      'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'sql', 'yaml',
                                      'yml', 'ini', 'conf', 'log'];
        const ext = filename.split('.').pop().toLowerCase();
        return previewableExtensions.includes(ext);
    },
    
    /**
     * Показ предпросмотра файла
     */
    showFilePreview: function(file) {
        const previewModal = document.getElementById('preview-modal');
        const previewFileName = document.getElementById('preview-file-name');
        const previewContent = document.querySelector('.preview-content');
        const previewLoading = document.querySelector('.preview-loading');
        const previewError = document.querySelector('.preview-error');
        const errorMessage = document.querySelector('.error-message');
        const downloadPreviewBtn = document.getElementById('download-preview');
        
        // Настраиваем модальное окно
        previewFileName.textContent = file.original_name;
        previewContent.innerHTML = '';
        previewLoading.style.display = 'flex';
        previewError.style.display = 'none';
        downloadPreviewBtn.href = `/download/${file.category}/${file.filename}`;
        
        // Показываем модальное окно
        previewModal.style.display = 'block';
        
        // Загружаем предпросмотр
        fetch(`/preview/${file.category}/${file.filename}`)
            .then(response => {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else if (contentType && (contentType.includes('image/') || contentType.includes('application/pdf'))) {
                    // Изображения и PDF отображаем напрямую
                    previewLoading.style.display = 'none';
                    
                    if (contentType.includes('image/')) {
                        const img = document.createElement('img');
                        img.src = `/preview/${file.category}/${file.filename}`;
                        img.alt = file.original_name;
                        previewContent.appendChild(img);
                    } else {
                        const iframe = document.createElement('iframe');
                        iframe.src = `/preview/${file.category}/${file.filename}`;
                        iframe.style.width = '100%';
                        iframe.style.height = '500px';
                        iframe.style.border = 'none';
                        previewContent.appendChild(iframe);
                    }
                    
                    return null;
                } else {
                    throw new Error('Неподдерживаемый формат ответа');
                }
            })
            .then(data => {
                if (!data) return; // Если данные уже обработаны (изображения, PDF)
                
                previewLoading.style.display = 'none';
                
                if (data.error) {
                    previewError.style.display = 'flex';
                    errorMessage.textContent = data.error;
                    return;
                }
                
                if (data.type === 'text') {
                    const pre = document.createElement('pre');
                    pre.textContent = data.content;
                    previewContent.appendChild(pre);
                } else if (data.type === 'unsupported') {
                    previewError.style.display = 'flex';
                    errorMessage.textContent = data.message;
                }
            })
            .catch(error => {
                previewLoading.style.display = 'none';
                previewError.style.display = 'flex';
                errorMessage.textContent = `Ошибка загрузки предпросмотра: ${error.message}`;
            });
    }
}; 
const translations = {
    'ru': {
        // Общие
        'title': 'WalpServer',
        'login': 'Вход',
        'register': 'Регистрация',
        'logout': 'Выход',
        'username': 'Имя пользователя',
        'password': 'Пароль',
        'login_button': 'Войти',
        'register_button': 'Зарегистрироваться',
        'login_error': 'Неверное имя пользователя или пароль',
        'user_exists': 'Пользователь уже существует',
        'language': 'Язык',
        'save': 'Сохранить',
        'cancel': 'Отмена',
        'close': 'Закрыть',
        'edit': 'Редактировать',
        'delete': 'Удалить',
        'open_in_new_tab': 'Открыть в новой вкладке',
        
        // Меню
        'modules': 'Модули',
        'cloud': 'Облако',
        'movies': 'Фильмы',
        'file_categories': 'Категории файлов',
        'all_files': 'Все файлы',
        'images': 'Изображения',
        'videos': 'Видео',
        'audio': 'Аудио',
        'documents': 'Документы',
        'scripts': 'Скрипты',
        'code': 'Код',
        'archives': 'Архивы',
        'executables': 'Программы',
        'databases': 'Базы данных',
        'links': 'Ссылки',
        'other': 'Прочее',
        'notes': 'Заметки',
        
        // Статистика
        'statistics': 'Статистика',
        'files_count': 'файлов',
        'links_count': 'ссылок',
        'total_size': 'занято',
        
        // Поиск и сортировка
        'search_files': 'Поиск файлов...',
        'sort_by': 'По дате',
        'sort_by_date': 'По дате',
        'sort_by_name': 'По имени',
        'sort_by_size': 'По размеру',
        'sort_order_desc': 'По убыванию',
        'sort_order_asc': 'По возрастанию',
        
        // Действия
        'add_link': 'Добавить ссылку',
        'upload_file': 'Загрузить файл',
        'loading_files': 'Загрузка файлов...',
        'download_file': 'Скачать файл',
        
        // Заметки
        'my_notes': 'Мои заметки',
        'new_note': 'Новая заметка',
        'edit_note': 'Редактирование заметки',
        'note_title': 'Заголовок',
        'note_content': 'Содержание',
        'note_priority': 'Приоритет',
        'priority_normal': 'Обычный',
        'priority_important': 'Важный',
        'priority_urgent': 'Срочный',
        'enter_note_title': 'Введите заголовок заметки',
        'enter_note_content': 'Введите содержание заметки',
        'empty_notes_message': 'У вас пока нет заметок. Создайте первую заметку!',
        'note_title_required': 'Заголовок заметки не может быть пустым',
        'note_created': 'Заметка создана',
        'note_updated': 'Заметка обновлена',
        'note_deleted': 'Заметка удалена',
        'delete_note_confirm': 'Вы уверены, что хотите удалить эту заметку?',
        'loading_notes_error': 'Ошибка при загрузке заметок',
        
        // Фильмы
        'my_movies': 'Мои фильмы',
        'all_movies': 'Все фильмы',
        'all': 'Все',
        'unwatched': 'Не просмотренные',
        'watched': 'Просмотренные',
        'search_movies': 'Поиск фильмов',
        'movie_search': 'Поиск фильмов',
        'search_movie_placeholder': 'Введите название фильма...',
        'find': 'Найти',
        'search_results': 'Результаты поиска',
        'original_title': 'Оригинальное название',
        'year': 'Год',
        'rating': 'Рейтинг',
        'genres': 'Жанры',
        'status': 'Статус',
        'no_description': 'Нет описания',
        'not_watched': 'Не просмотрен',
        'watch_movie': 'Смотреть фильм',
        'mark_as_watched': 'Отметить просмотренным',
        'mark_as_unwatched': 'Отметить непросмотренным',
        'delete_from_list': 'Удалить из списка',
        'add_to_collection': 'Добавить в коллекцию',
        'not_added': 'Не добавлен',
        'loading_movie': 'Загрузка фильма...',
        'movie_watch_error': 'Невозможно открыть фильм, отсутствует ID',
        'delete_movie_confirm': 'Вы уверены, что хотите удалить этот фильм из коллекции?',
        'movie_deleted': 'Фильм удален из коллекции',
        'movie_delete_error': 'Ошибка удаления фильма',
        'changing_movie_status': 'Изменение статуса фильма...',
        'movie_status_changed': 'Статус просмотра изменен',
        'movie_status_error': 'Ошибка изменения статуса',
        'movie_url_error': 'Ошибка при получении ссылки на фильм',
        'movie_watching': 'Просмотр фильма',
        'adding_movie': 'Добавление фильма...',
        'movie_added_success': 'Фильм успешно добавлен в коллекцию',
        'movie_add_error': 'Ошибка добавления фильма',
        'movie_add_error_generic': 'Произошла ошибка при добавлении фильма',
        'loading_movies': 'Загрузка фильмов...',
        'movies_not_found': 'Фильмы не найдены.',
        'add_first_movie': 'Добавьте свой первый фильм!',
        'no_watched_movies': 'У вас нет просмотренных фильмов.',
        'no_unwatched_movies': 'У вас нет непросмотренных фильмов.',
        'movies_load_error': 'Ошибка загрузки фильмов',
        'searching_movies': 'Поиск фильмов...',
        'movies_not_found_try_another': 'Фильмы не найдены. Попробуйте другой запрос.',
        'movies_search_error': 'Ошибка поиска фильмов',
        'add_button': 'Добавить',
        'movie_rating_prefix': 'рейтинг:',
        'loading_filter': 'Загрузка фильмов с фильтром:',
        'loaded_movies': 'Загружено {count} фильмов с фильтром:',
        'iframe_loaded': 'Iframe загружен',
        
        // Ссылки
        'add_link_title': 'Добавить ссылку',
        'link_name': 'Название',
        'link_url': 'URL',
        'link_description': 'Описание (необязательно)',
        'enter_link_name': 'Введите название',
        'enter_link_url': 'https://example.com',
        'enter_link_description': 'Описание ссылки',
        
        // Предпросмотр файлов
        'file_preview': 'Предпросмотр',
        'loading_preview': 'Загрузка предпросмотра...',
        
        // Файловый модуль
        'delete_file_confirm': 'Вы уверены, что хотите удалить файл "{filename}"?',
        'delete_link_confirm': 'Вы уверены, что хотите удалить ссылку "{title}"?',
        'file_deleted': 'Файл успешно удалён',
        'file_delete_error': 'Ошибка при удалении файла',
        'file_delete_error_generic': 'Произошла ошибка при удалении файла',
        'link_deleted': 'Ссылка успешно удалена',
        'link_delete_error': 'Ошибка при удалении ссылки',
        'link_delete_error_generic': 'Произошла ошибка при удалении ссылки',
        'open_link': 'Открыть ссылку',
        'no_files': 'Нет файлов',
        'no_description': 'Нет описания',
        'file_too_large': 'Файл слишком большой. Максимальный размер - 1GB',
        'uploading_file': 'Загрузка файла...',
        'file_uploaded_success': 'Файл "{filename}" успешно загружен',
        'file_upload_error': 'Произошла ошибка при загрузке файла',
        'error': 'Ошибка',
        'drop_files_here': 'Перетащите файлы сюда для загрузки',
        'file_load_error': 'Ошибка загрузки файлов',
        'searching': 'Поиск...',
        'search_no_results': 'По запросу "{query}" ничего не найдено',
        'search_error': 'Ошибка поиска',
        'module_loading_error': 'Ошибка загрузки модуля фильмов',
        'link_title_required': 'Название ссылки не может быть пустым',
        'link_url_required': 'URL не может быть пустым',
        'invalid_url': 'Пожалуйста, введите корректный URL',
        'link_added_success': 'Ссылка успешно добавлена',
        'link_add_error': 'Ошибка при добавлении ссылки',
        'link_add_error_generic': 'Произошла ошибка при добавлении ссылки',
        'min_search_chars': 'Введите не менее 2 символов для поиска',
        
        // Торренты
        'torrents': 'Торренты',
        'search_torrents': 'Найти торренты',
        'loading_torrents': 'Поиск торрентов...',
        'torrents_not_found': 'Торренты не найдены',
        'torrents_search_error': 'Ошибка при поиске торрентов',
        'torrent_quality': 'Качество',
        'torrent_size': 'Размер',
        'torrent_seeds': 'Сиды',
        'torrent_leeches': 'Личи',
        'direct_download': 'Скачать напрямую',
        'download_torrent': 'Скачать .torrent',
        'open_torrent_page': 'Открыть страницу торрента',
        'view_details': 'Просмотр деталей',
        'best_results': 'Лучшие результаты',
        'torrent_source': 'Источник',
        'download_error': 'Ошибка скачивания',
        'no_direct_torrents': 'Ссылки на внешние ресурсы',
        'download_on_server': 'Скачать на сервере',
        'select_torrent_category': 'Выберите категорию торрента',
        'torrent_category_description': 'Пожалуйста, выберите категорию для торрент-файла:',
        'file_to_upload': 'Файл для загрузки',
        'upload': 'Загрузить',
        'error_uploading_torrent': 'Ошибка загрузки торрента',
        'error_loading_torrent_categories': 'Ошибка загрузки категорий торрентов',
        'downloading_torrent': 'Скачивание торрента',
        'pause': 'Пауза',
        'resume': 'Продолжить',
        'download_speed': 'Скорость',
        'download_eta': 'Осталось',
        'download_size': 'Размер',
        'download_status': 'Статус',
        'download_completed': 'Скачивание завершено',
        'download_paused': 'Скачивание приостановлено',
        'download_error': 'Ошибка скачивания',
        'download_stopped': 'Скачивание остановлено',
        'done': 'Готово',
        'preparing_download': 'Подготовка к скачиванию...',
        'downloading': 'Скачивание...',
        'file_saved_in': 'Файл сохранен в категории',
        'server_connection_error': 'Ошибка подключения к серверу',
        
        // Категории торрентов
        'torrent_category_movies': 'Фильмы',
        'torrent_category_tv': 'Сериалы',
        'torrent_category_music': 'Музыка',
        'torrent_category_games': 'Игры',
        'torrent_category_software': 'Программы',
        'torrent_category_books': 'Книги',
        'torrent_category_other': 'Другое',
        
        // Добавляем переводы для шаринга файлов
        'share': 'Поделиться',
        'share_file': 'Поделиться файлом',
        'creating_link': 'Создание ссылки...',
        'share_link': 'Ссылка для шаринга:',
        'copy_to_clipboard': 'Копировать в буфер обмена',
        'link_copied_to_clipboard': 'Ссылка скопирована в буфер обмена',
        'share_link_info': 'Любой, у кого есть эта ссылка, может скачать файл. Срок действия ссылки - 30 дней.',
        'share_link_info_1': 'Любой, у кого есть эта ссылка, может скачать файл.',
        'expiry_date_info': 'Срок действия ссылки до {date}.',
        'expiry_period': 'Срок действия ссылки:',
        'expiry_1_day': '1 день',
        'expiry_7_days': '7 дней',
        'expiry_30_days': '30 дней',
        'expiry_90_days': '90 дней',
        'expiry_180_days': '180 дней',
        'expiry_365_days': '1 год',
        'expiry_days_label': 'дней',
        'expiry_hours_label': 'часов',
        'expiry_minutes_label': 'минут',
        'update_expiry': 'Обновить срок',
        'error_updating_expiry': 'Ошибка при обновлении срока действия',
        'delete_link': 'Удалить ссылку',
        'share_link_deleted': 'Ссылка для шаринга удалена',
        'error_creating_share_link': 'Ошибка при создании ссылки',
        'error_deleting_share_link': 'Ошибка при удалении ссылки',
        'copy': 'Копировать',
        'copied': 'Скопировано',
        'copy_link': 'Копировать ссылку',
        
        // Блокировка рекламы
        'ad_blocker_enabled': 'Блокировщик рекламы активирован',
        'ad_blocker_fallback_enabled': 'Запущен альтернативный блокировщик рекламы',
        
        // TV-режим
        'tv_mode': 'TV-режим',
        'tv_mode_on': 'Включен',
        'tv_mode_off': 'Выключен',
        'tv_mode_instructions': 'Используйте клавиши стрелок для навигации и Enter для выбора. Мышь также управляет навигацией.',
        'mouse_navigation_enabled': 'Навигация мышью включена',
        'all_elements_accessible': 'Все элементы интерфейса доступны для навигации, включая крестики закрытия',
        
        // Уведомления о скачивании торрентов
        'download_started': 'Начато скачивание торрента: {filename}',
        'download_completed': 'Торрент успешно скачан: {filename}',
        'download_error': 'Ошибка при скачивании торрента',
        'unknown_error': 'Неизвестная ошибка',
        
        // Добавляем новые переводы для медиаплеера
        'play_media': 'Воспроизвести',
        'loading_media': 'Загрузка медиафайла...',
        'error_loading_media': 'Ошибка загрузки медиафайла',
        'unsupported_media_type': 'Этот формат медиафайла не поддерживается',
    },
    'en': {
        // Common
        'title': 'WalpServer',
        'login': 'Login',
        'register': 'Register',
        'logout': 'Logout',
        'username': 'Username',
        'password': 'Password',
        'login_button': 'Login',
        'register_button': 'Register',
        'login_error': 'Invalid username or password',
        'user_exists': 'User already exists',
        'language': 'Language',
        'save': 'Save',
        'cancel': 'Cancel',
        'close': 'Close',
        'edit': 'Edit',
        'delete': 'Delete',
        'open_in_new_tab': 'Open in new tab',
        
        // Menu
        'modules': 'Modules',
        'cloud': 'Cloud',
        'movies': 'Movies',
        'file_categories': 'File Categories',
        'all_files': 'All Files',
        'images': 'Images',
        'videos': 'Videos',
        'audio': 'Audio',
        'documents': 'Documents',
        'scripts': 'Scripts',
        'code': 'Code',
        'archives': 'Archives',
        'executables': 'Programs',
        'databases': 'Databases',
        'links': 'Links',
        'other': 'Other',
        'notes': 'Notes',
        
        // Statistics
        'statistics': 'Statistics',
        'files_count': 'files',
        'links_count': 'links',
        'total_size': 'used',
        
        // Search and sort
        'search_files': 'Search files...',
        'sort_by': 'By date',
        'sort_by_date': 'By date',
        'sort_by_name': 'By name',
        'sort_by_size': 'By size',
        'sort_order_desc': 'Descending',
        'sort_order_asc': 'Ascending',
        
        // Actions
        'add_link': 'Add link',
        'upload_file': 'Upload file',
        'loading_files': 'Loading files...',
        'download_file': 'Download file',
        
        // Notes
        'my_notes': 'My Notes',
        'new_note': 'New Note',
        'edit_note': 'Edit Note',
        'note_title': 'Title',
        'note_content': 'Content',
        'note_priority': 'Priority',
        'priority_normal': 'Normal',
        'priority_important': 'Important',
        'priority_urgent': 'Urgent',
        'enter_note_title': 'Enter note title',
        'enter_note_content': 'Enter note content',
        'empty_notes_message': 'You don\'t have any notes yet. Create your first note!',
        'note_title_required': 'Note title cannot be empty',
        'note_created': 'Note created',
        'note_updated': 'Note updated',
        'note_deleted': 'Note deleted',
        'delete_note_confirm': 'Are you sure you want to delete this note?',
        'loading_notes_error': 'Error loading notes',
        
        // Movies
        'my_movies': 'My Movies',
        'all_movies': 'All Movies',
        'all': 'All',
        'unwatched': 'Unwatched',
        'watched': 'Watched',
        'search_movies': 'Search Movies',
        'movie_search': 'Movie Search',
        'search_movie_placeholder': 'Enter movie title...',
        'find': 'Find',
        'search_results': 'Search Results',
        'original_title': 'Original Title',
        'year': 'Year',
        'rating': 'Rating',
        'genres': 'Genres',
        'status': 'Status',
        'no_description': 'No description',
        'not_watched': 'Not watched',
        'watch_movie': 'Watch movie',
        'mark_as_watched': 'Mark as watched',
        'mark_as_unwatched': 'Mark as unwatched',
        'delete_from_list': 'Delete from list',
        'add_to_collection': 'Add to collection',
        'not_added': 'Not added',
        'loading_movie': 'Loading movie...',
        'movie_watch_error': 'Cannot open movie, ID is missing',
        'delete_movie_confirm': 'Are you sure you want to delete this movie from your collection?',
        'movie_deleted': 'Movie deleted from collection',
        'movie_delete_error': 'Error deleting movie',
        'changing_movie_status': 'Changing movie status...',
        'movie_status_changed': 'Watch status changed',
        'movie_status_error': 'Error changing status',
        'movie_url_error': 'Error getting movie URL',
        'movie_watching': 'Watch movie',
        'adding_movie': 'Adding movie...',
        'movie_added_success': 'Movie successfully added to collection',
        'movie_add_error': 'Error adding movie',
        'movie_add_error_generic': 'An error occurred while adding the movie',
        'loading_movies': 'Loading movies...',
        'movies_not_found': 'Movies not found.',
        'add_first_movie': 'Add your first movie!',
        'no_watched_movies': 'You don\'t have any watched movies.',
        'no_unwatched_movies': 'You don\'t have any unwatched movies.',
        'movies_load_error': 'Error loading movies',
        'searching_movies': 'Searching movies...',
        'movies_not_found_try_another': 'Movies not found. Try another search query.',
        'movies_search_error': 'Error searching movies',
        'add_button': 'Add',
        'movie_rating_prefix': 'rating:',
        'loading_filter': 'Loading movies with filter:',
        'loaded_movies': 'Loaded {count} movies with filter:',
        'iframe_loaded': 'Iframe loaded',
        
        // Links
        'add_link_title': 'Add Link',
        'link_name': 'Name',
        'link_url': 'URL',
        'link_description': 'Description (optional)',
        'enter_link_name': 'Enter name',
        'enter_link_url': 'https://example.com',
        'enter_link_description': 'Link description',
        
        // File preview
        'file_preview': 'Preview',
        'loading_preview': 'Loading preview...',
        
        // File module
        'delete_file_confirm': 'Are you sure you want to delete the file "{filename}"?',
        'delete_link_confirm': 'Are you sure you want to delete the link "{title}"?',
        'file_deleted': 'File successfully deleted',
        'file_delete_error': 'Error deleting file',
        'file_delete_error_generic': 'An error occurred while deleting the file',
        'link_deleted': 'Link successfully deleted',
        'link_delete_error': 'Error deleting link',
        'link_delete_error_generic': 'An error occurred while deleting the link',
        'open_link': 'Open link',
        'no_files': 'No files',
        'no_description': 'No description',
        'file_too_large': 'File is too large. Maximum size is 1GB',
        'uploading_file': 'Uploading file...',
        'file_uploaded_success': 'File "{filename}" uploaded successfully',
        'file_upload_error': 'An error occurred while uploading the file',
        'error': 'Error',
        'drop_files_here': 'Drop files here to upload',
        'file_load_error': 'Error loading files',
        'searching': 'Searching...',
        'search_no_results': 'No results found for "{query}"',
        'search_error': 'Search error',
        'module_loading_error': 'Error loading movies module',
        'link_title_required': 'Link title cannot be empty',
        'link_url_required': 'URL cannot be empty',
        'invalid_url': 'Please enter a valid URL',
        'link_added_success': 'Link successfully added',
        'link_add_error': 'Error adding link',
        'link_add_error_generic': 'An error occurred while adding the link',
        'min_search_chars': 'Enter at least 2 characters to search',
        
        // Torrents
        'torrents': 'Torrents',
        'search_torrents': 'Find torrents',
        'loading_torrents': 'Searching torrents...',
        'torrents_not_found': 'No torrents found',
        'torrents_search_error': 'Error searching for torrents',
        'torrent_quality': 'Quality',
        'torrent_size': 'Size',
        'torrent_seeds': 'Seeds',
        'torrent_leeches': 'Leeches',
        'direct_download': 'Direct download',
        'download_torrent': 'Download .torrent',
        'open_torrent_page': 'Open torrent page',
        'view_details': 'View details',
        'best_results': 'Best results',
        'torrent_source': 'Source',
        'download_error': 'Download error',
        'no_direct_torrents': 'External search links',
        'download_on_server': 'Download on server',
        'select_torrent_category': 'Select torrent category',
        'torrent_category_description': 'Please select a category for the torrent file:',
        'file_to_upload': 'File to upload',
        'upload': 'Загрузить',
        'error_uploading_torrent': 'Ошибка загрузки торрента',
        'error_loading_torrent_categories': 'Ошибка загрузки категорий торрентов',
        'downloading_torrent': 'Скачивание торрента',
        'pause': 'Пауза',
        'resume': 'Продолжить',
        'download_speed': 'Скорость',
        'download_eta': 'Осталось',
        'download_size': 'Размер',
        'download_status': 'Статус',
        'download_completed': 'Скачивание завершено',
        'download_paused': 'Скачивание приостановлено',
        'download_error': 'Ошибка скачивания',
        'download_stopped': 'Скачивание остановлено',
        'done': 'Готово',
        'preparing_download': 'Подготовка к скачиванию...',
        'downloading': 'Скачивание...',
        'file_saved_in': 'Файл сохранен в категории',
        'server_connection_error': 'Ошибка подключения к серверу',
        
        // Torrent categories
        'torrent_category_movies': 'Movies',
        'torrent_category_tv': 'TV Shows',
        'torrent_category_music': 'Music',
        'torrent_category_games': 'Games',
        'torrent_category_software': 'Software',
        'torrent_category_books': 'Books',
        'torrent_category_other': 'Other',
        
        // Добавляем переводы для шаринга файлов
        'share': 'Share',
        'share_file': 'Share File',
        'creating_link': 'Creating share link...',
        'share_link': 'Share link:',
        'copy_to_clipboard': 'Copy to clipboard',
        'link_copied_to_clipboard': 'Link copied to clipboard',
        'share_link_info': 'Anyone with this link can download the file. The link is valid for 30 days.',
        'share_link_info_1': 'Anyone with this link can download the file.',
        'expiry_date_info': 'Link expires on {date}.',
        'expiry_period': 'Link expires in:',
        'expiry_1_day': '1 day',
        'expiry_7_days': '7 days',
        'expiry_30_days': '30 days',
        'expiry_90_days': '90 days',
        'expiry_180_days': '180 days',
        'expiry_365_days': '1 year',
        'expiry_days_label': 'days',
        'expiry_hours_label': 'hours',
        'expiry_minutes_label': 'minutes',
        'update_expiry': 'Update expiry',
        'error_updating_expiry': 'Error updating expiry',
        'delete_link': 'Delete link',
        'share_link_deleted': 'Share link has been deleted',
        'error_creating_share_link': 'Error creating share link',
        'error_deleting_share_link': 'Error deleting share link',
        'copy': 'Copy',
        'copied': 'Copied',
        'copy_link': 'Copy link',
        
        // Ad blocking
        'ad_blocker_enabled': 'Ad blocker activated',
        'ad_blocker_fallback_enabled': 'Alternative ad blocker activated',
        
        // TV-режим
        'tv_mode': 'TV Mode',
        'tv_mode_on': 'Enabled',
        'tv_mode_off': 'Disabled',
        'tv_mode_instructions': 'Use arrow keys for navigation and Enter to select. Mouse also controls navigation.',
        'mouse_navigation_enabled': 'Mouse navigation enabled',
        'all_elements_accessible': 'All interface elements are accessible for navigation, including close buttons',
        
        // Торрент-скачивание уведомления
        'download_started': 'Started downloading torrent: {filename}',
        'download_completed': 'Torrent downloaded successfully: {filename}',
        'download_error': 'Error downloading torrent',
        'unknown_error': 'Unknown error',
        
        // Добавляем новые переводы для медиаплеера
        'play_media': 'Play',
        'loading_media': 'Loading media file...',
        'error_loading_media': 'Error loading media file',
        'unsupported_media_type': 'This media format is not supported',
    }
};

// Функция для получения перевода
function t(key) {
    const lang = localStorage.getItem('language') || 'ru';
    return translations[lang][key] || key;
}

// Функция для изменения языка
function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    
    // Применяем переводы без перезагрузки страницы
    loadTranslations();
    
    // Обновляем активные элементы интерфейса
    document.querySelectorAll('.language-option').forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Функция для загрузки языка и применения переводов
function loadTranslations() {
    const lang = localStorage.getItem('language') || 'ru';
    
    // Обрабатываем основные элементы с атрибутом data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.getAttribute('placeholder')) {
                    element.setAttribute('placeholder', translations[lang][key]);
                } else {
                    element.value = translations[lang][key];
                }
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Обрабатываем плейсхолдеры с атрибутом data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.setAttribute('placeholder', translations[lang][key]);
        }
    });
    
    // Обновляем заголовок страницы
    document.title = t('title');
    
    // Вызываем событие изменения языка, чтобы модули могли его перехватить
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
} 
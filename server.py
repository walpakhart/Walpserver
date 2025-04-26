from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, Response, send_file
from flask_login import LoginManager, UserMixin, login_required, login_user, logout_user, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from functools import wraps
import jwt
import os
import sqlite3
import json
from datetime import datetime, timedelta
import uuid
import mimetypes
import requests
from bs4 import BeautifulSoup
import re
import random
import urllib.parse
import string
import asyncio
import threading
import time
from torrentp import TorrentDownloader

"""
API Документация

Аутентификация:
- POST /api/auth/register - Регистрация нового пользователя
  Тело запроса: {"username": "user", "password": "password"}
  Ответ: {"message": "Пользователь успешно зарегистрирован", "user_id": 1, "username": "user"}

- POST /api/auth/login - Авторизация пользователя
  Тело запроса: {"username": "user", "password": "password"}
  Ответ: {"message": "Авторизация успешна", "token": "JWT_TOKEN", "user_id": 1, "username": "user"}

- GET /api/users/me - Получение информации о текущем пользователе
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"id": 1, "username": "user"}

Файлы:
- GET /api/files - Получение списка файлов
  Параметры запроса: category=all|images|videos|..., sort=date|name|size, order=asc|desc
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"files": [{"id": 1, "filename": "file.txt", ...}]}

- GET /api/files/<file_id> - Получение информации о файле
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"id": 1, "filename": "file.txt", ...}

- POST /api/files/upload - Загрузка файла
  Заголовки: Authorization: Bearer JWT_TOKEN
  Форма: file=<file>, path=<path>, torrent_category=<category> (опционально)
  Ответ: {"message": "Файл успешно загружен", "file_id": 1, ...}

- GET /api/files/<file_id>/download - Скачивание файла
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: Файл для скачивания

- DELETE /api/files/<file_id> - Удаление файла
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"message": "Файл успешно удален"}

Заметки:
- GET /api/notes - Получение списка заметок
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"notes": [{"id": 1, "title": "Заметка", ...}]}

- GET /api/notes/<note_id> - Получение информации о заметке
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"id": 1, "title": "Заметка", ...}

- POST /api/notes - Создание заметки
  Заголовки: Authorization: Bearer JWT_TOKEN
  Тело запроса: {"title": "Заметка", "content": "Содержание", "priority": 0}
  Ответ: {"message": "Заметка успешно создана", "note_id": 1, ...}

- PUT /api/notes/<note_id> - Обновление заметки
  Заголовки: Authorization: Bearer JWT_TOKEN
  Тело запроса: {"title": "Новое название", "content": "Новое содержание", "priority": 1}
  Ответ: {"message": "Заметка успешно обновлена", "note_id": 1, ...}

- DELETE /api/notes/<note_id> - Удаление заметки
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"message": "Заметка успешно удалена"}

Ссылки:
- GET /api/links - Получение списка ссылок
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"links": [{"id": 1, "title": "Ссылка", ...}]}

- POST /api/links - Добавление ссылки
  Заголовки: Authorization: Bearer JWT_TOKEN
  Тело запроса: {"title": "Ссылка", "url": "https://example.com", "description": "Описание", "category": "links"}
  Ответ: {"message": "Ссылка успешно добавлена", "link_id": 1, ...}

- DELETE /api/links/<link_id> - Удаление ссылки
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"message": "Ссылка успешно удалена"}

Фильмы:
- GET /api/movies - Получение списка фильмов
  Параметры запроса: sort=add_date|title|year|rating|watch_date, order=asc|desc, watched=true|false
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"movies": [{"id": 1, "title": "Фильм", ...}]}

- GET /api/movies/<movie_id> - Получение информации о фильме
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"id": 1, "title": "Фильм", ...}

- POST /api/movies - Добавление фильма
  Заголовки: Authorization: Bearer JWT_TOKEN
  Тело запроса: {"title": "Фильм", "original_title": "Movie", "kinopoisk_id": "123", ...}
  Ответ: {"message": "Фильм успешно добавлен", "movie_id": 1, ...}

- POST /api/movies/<movie_id>/toggle_watched - Изменение статуса просмотра фильма
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"message": "Статус просмотра изменен", "movie_id": 1, ...}

- DELETE /api/movies/<movie_id> - Удаление фильма
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"message": "Фильм успешно удален"}

Статистика:
- GET /api/stats - Получение статистики
  Заголовки: Authorization: Bearer JWT_TOKEN
  Ответ: {"files": {"total": 10, ...}, "notes": {"total": 5}, ...}
"""

app = Flask(__name__)
app.config.from_pyfile('config.py')

# Настройка CORS
CORS(app)

# Секретный ключ для JWT токенов
app.config['JWT_SECRET_KEY'] = 'secret-key-for-jwt'  # В реальном приложении используйте безопасный секретный ключ
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Время жизни токена

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Создаем категории, если еще не созданы
for category in ['images', 'videos', 'documents', 'other', 'links', 'audio', 'scripts', 'archives', 'code', 'executables', 'databases', 'torrents']:
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], category), exist_ok=True)

DB_PATH = "/var/lib/walpserver/users.db"
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Настройка базы данных пользователей
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS users
    (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS files
    (id INTEGER PRIMARY KEY, filename TEXT, original_filename TEXT, 
    category TEXT, upload_date TEXT, size INTEGER, user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id))
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS links
    (id INTEGER PRIMARY KEY, title TEXT, url TEXT, description TEXT,
    category TEXT, add_date TEXT, user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id))
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS notes
    (id INTEGER PRIMARY KEY, title TEXT, content TEXT, 
    create_date TEXT, update_date TEXT, priority INTEGER DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id))
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS movies
    (id INTEGER PRIMARY KEY, title TEXT, original_title TEXT, 
    kinopoisk_id TEXT, poster_url TEXT, year INTEGER,
    rating REAL, genres TEXT, description TEXT,
    add_date TEXT, watched INTEGER DEFAULT 0, watch_date TEXT,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id))
    ''')
    
    # Таблица для ссылок для шаринга файлов
    c.execute('''
    CREATE TABLE IF NOT EXISTS share_links
    (id INTEGER PRIMARY KEY, file_id INTEGER, token TEXT UNIQUE, 
    created_date TEXT, expiry_date TEXT, is_active INTEGER DEFAULT 1,
    FOREIGN KEY(file_id) REFERENCES files(id))
    ''')
    
    # Таблица для категорий торрентов
    c.execute('''
    CREATE TABLE IF NOT EXISTS torrent_categories
    (id INTEGER PRIMARY KEY, name TEXT UNIQUE, description TEXT)
    ''')
    
    # Проверяем наличие категорий торрентов и добавляем, если их нет
    c.execute("SELECT COUNT(*) FROM torrent_categories")
    count = c.fetchone()[0]
    
    if count == 0:
        # Добавляем базовые категории для торрентов
        categories = [
            ('movies', 'Фильмы'),
            ('tv', 'Сериалы'),
            ('music', 'Музыка'),
            ('games', 'Игры'),
            ('software', 'Программы'),
            ('books', 'Книги'),
            ('other', 'Другое')
        ]
        c.executemany("INSERT INTO torrent_categories (name, description) VALUES (?, ?)", categories)
    
    # Проверяем, есть ли колонка torrent_category в таблице files
    c.execute("PRAGMA table_info(files)")
    columns = [column[1] for column in c.fetchall()]
    
    if 'torrent_category' not in columns:
        c.execute("ALTER TABLE files ADD COLUMN torrent_category TEXT")
    
    conn.commit()
    conn.close()

# Инициализация базы данных при запуске
init_db()

# Класс пользователя для Flask-Login
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

# Функция для создания JWT токена
def create_token(user_id):
    payload = {
        'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

# Функция для проверки JWT токена
def decode_token(token):
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Token истек. Пожалуйста, войдите снова.'
    except jwt.InvalidTokenError:
        return 'Недействительный токен. Пожалуйста, войдите снова.'

# Декоратор для проверки JWT токена в запросах API
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Токен отсутствует!'}), 401
        
        user_id = decode_token(token)
        if isinstance(user_id, str):
            return jsonify({'message': user_id}), 401
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'message': 'Пользователь не найден!'}), 401
        
        return f(User(user[0], user[1], user[2]), *args, **kwargs)
    
    return decorated

# Загрузчик пользователя для Flask-Login
@login_manager.user_loader
def load_user(user_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return User(user[0], user[1], user[2])
    return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def get_category(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # Категория изображений
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp', 'tiff', 'ico', 'ai', 'psd', 'xcf', 'eps']:
        return 'images'
    
    # Категория видео
    elif ext in ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', '3gp', 'wmv', 'mpg', 'mpeg', 'm4v']:
        return 'videos'
    
    # Категория аудио
    elif ext in ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus']:
        return 'audio'
    
    # Категория торрентов
    elif ext in ['torrent']:
        return 'torrents'
    
    # Категория документов
    elif ext in ['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'md', 'rtf']:
        return 'documents'
    
    # Категория скриптов
    elif ext in ['sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'vbs', 'jsx', 'cmake']:
        return 'scripts'
    
    # Категория архивов
    elif ext in ['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz', 'tgz', 'iso', 'dmg', 'img']:
        return 'archives'
    
    # Категория кода
    elif ext in ['py', 'js', 'html', 'css', 'c', 'cpp', 'h', 'java', 'php', 'rb', 'pl', 'swift', 'go', 'ts',
                'json', 'xml', 'yml', 'yaml', 'toml', 'ipynb', 'sql', 'r', 'lua', 'cs', 'kt', 'rs']:
        return 'code'
    
    # Категория исполняемых файлов
    elif ext in ['exe', 'msi', 'apk', 'deb', 'rpm', 'app', 'pkg', 'dmg', 'jar', 'war', 'dll']:
        return 'executables'
    
    # Категория баз данных
    elif ext in ['db', 'sqlite', 'sqlite3', 'sql', 'accdb', 'mdb', 'frm']:
        return 'databases'
    
    # Остальные файлы
    else:
        return 'other'

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[2], password):
            user_obj = User(user[0], user[1], user[2])
            login_user(user_obj)
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error='Неверное имя пользователя или пароль')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        if c.fetchone():
            conn.close()
            return render_template('register.html', error='Пользователь уже существует')
        
        hashed_password = generate_password_hash(password)
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                 (username, hashed_password))
        conn.commit()
        conn.close()
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/torrent_categories')
@login_required
def get_torrent_categories():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, description FROM torrent_categories ORDER BY name")
    categories = c.fetchall()
    conn.close()
    
    categories_list = []
    for category in categories:
        categories_list.append({
            'id': category[0],
            'name': category[1],
            'description': category[2]
        })
    
    return jsonify({'categories': categories_list})

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не выбран'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Файл не выбран'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        category = get_category(filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        new_filename = f"{timestamp}_{filename}"
        
        # Проверяем, есть ли путь для сохранения структуры папок
        path = request.form.get('path', '')
        
        # Получаем категорию торрента, если файл является торрентом
        torrent_category = None
        if category == 'torrents':
            torrent_category = request.form.get('torrent_category', 'other')
        
        if path:
            # Создаем подпапку с учетом пути
            folder_path = os.path.join(app.config['UPLOAD_FOLDER'], category, path)
            os.makedirs(folder_path, exist_ok=True)
            file_path = os.path.join(folder_path, new_filename)
        else:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, new_filename)
        
        file.save(file_path)
        
        # Сохраняем информацию о файле в БД
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        if category == 'torrents':
            c.execute("""
            INSERT INTO files (filename, original_filename, category, upload_date, size, user_id, torrent_category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (new_filename if not path else os.path.join(path, new_filename), 
                filename, category, datetime.now().isoformat(), 
                os.path.getsize(file_path), current_user.id, torrent_category))
        else:
            c.execute("""
            INSERT INTO files (filename, original_filename, category, upload_date, size, user_id) 
            VALUES (?, ?, ?, ?, ?, ?)
            """, (new_filename if not path else os.path.join(path, new_filename), 
                filename, category, datetime.now().isoformat(), 
                os.path.getsize(file_path), current_user.id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'filename': new_filename, 'category': category})
    
    return jsonify({'error': 'Недопустимый формат файла'}), 400

@app.route('/add_link', methods=['POST'])
@login_required
def add_link():
    data = request.get_json()
    
    if not data or not data.get('url') or not data.get('title'):
        return jsonify({'error': 'Необходимо указать URL и название'}), 400
    
    title = data.get('title')
    url = data.get('url')
    description = data.get('description', '')
    category = data.get('category', 'links')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    INSERT INTO links (title, url, description, category, add_date, user_id) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, (title, url, description, category, datetime.now().isoformat(), current_user.id))
    conn.commit()
    link_id = c.lastrowid
    conn.close()
    
    return jsonify({
        'success': True, 
        'id': link_id, 
        'title': title, 
        'url': url, 
        'description': description,
        'add_date': datetime.now().isoformat()
    })

@app.route('/files')
@login_required
def list_files():
    category = request.args.get('category', 'all')
    sort_by = request.args.get('sort', 'date')
    order = request.args.get('order', 'desc')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    file_list = []
    
    # Загружаем файлы, только если не выбрана категория "ссылки"
    if category != 'links':
        query = "SELECT * FROM files WHERE user_id = ?"
        params = [current_user.id]
        
        if category != 'all':
            query += " AND category = ?"
            params.append(category)
        
        # Добавляем сортировку в SQL запрос для файлов
        if sort_by == 'date':
            query += " ORDER BY upload_date"
        elif sort_by == 'name':
            query += " ORDER BY original_filename"
        elif sort_by == 'size':
            query += " ORDER BY size"
        
        if order == 'desc':
            query += " DESC"
        else:
            query += " ASC"
        
        c.execute(query, params)
        files = c.fetchall()
        
        for file in files:
            file_data = {
                'id': file[0],
                'filename': file[1],
                'original_name': file[2],
                'category': file[3],
                'upload_date': file[4],
                'size': file[5],
                'type': 'file'
            }
            
            # Добавляем категорию торрента, если это торрент-файл
            if file[3] == 'torrents' and file[7]:  # file[7] - это индекс torrent_category
                file_data['torrent_category'] = file[7]
            
            file_list.append(file_data)
    
    # Если выбрана категория "все" или "ссылки", добавляем ссылки
    if category == 'all' or category == 'links':
        query = "SELECT * FROM links WHERE user_id = ?"
        params = [current_user.id]
        
        # Для ссылок нет поля size, поэтому сортируем только по дате или имени
        if sort_by == 'date':
            query += " ORDER BY add_date"
        elif sort_by == 'name' or sort_by == 'size':  # При сортировке по размеру для ссылок используем сортировку по имени
            query += " ORDER BY title"
        
        if order == 'desc':
            query += " DESC"
        else:
            query += " ASC"
        
        c.execute(query, params)
        links = c.fetchall()
        
        for link in links:
            file_list.append({
                'id': link[0],
                'title': link[1],
                'url': link[2],
                'description': link[3],
                'category': link[4],
                'upload_date': link[5],
                'size': 0,  # Добавляем размер 0 для ссылок, чтобы можно было сортировать вместе с файлами
                'type': 'link'
            })
    
    conn.close()
    
    # Если выбрана общая сортировка для файлов и ссылок вместе
    if category == 'all' and file_list:
        if sort_by == 'date':
            file_list.sort(key=lambda x: x.get('upload_date'), reverse=(order == 'desc'))
        elif sort_by == 'name':
            file_list.sort(key=lambda x: x.get('original_name', x.get('title', '')).lower(), reverse=(order == 'desc'))
        elif sort_by == 'size':
            file_list.sort(key=lambda x: x.get('size', 0), reverse=(order == 'desc'))
    
    return jsonify(file_list)

@app.route('/download/<category>/<filename>')
@login_required
def download_file(category, filename):
    # Проверяем, принадлежит ли файл текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE filename = ? AND user_id = ?", 
             (filename, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return "Файл не найден", 404
    
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], category), 
                              filename, as_attachment=True, 
                              download_name=file[2])  # Оригинальное имя файла

@app.route('/delete_file/<int:file_id>')
@login_required
def delete_file(file_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", 
             (file_id, current_user.id))
    file = c.fetchone()
    
    if not file:
        conn.close()
        return jsonify({'error': 'Файл не найден'}), 404
    
    filename = file[1]
    category = file[3]
    
    # Удаляем файл
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Удаляем запись из БД
    c.execute("DELETE FROM files WHERE id = ?", (file_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/delete_link/<int:link_id>')
@login_required
def delete_link(link_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, принадлежит ли ссылка текущему пользователю
    c.execute("SELECT * FROM links WHERE id = ? AND user_id = ?", 
             (link_id, current_user.id))
    link = c.fetchone()
    
    if not link:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Ссылка не найдена или нет прав доступа'})
    
    c.execute("DELETE FROM links WHERE id = ?", (link_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success'})

@app.route('/file_links')
@login_required
def get_file_links():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Получаем все файлы пользователя
    c.execute("""
    SELECT f.id, f.original_filename, f.filename, f.category, f.upload_date, f.size,
           s.id as share_id, s.token, s.created_date, s.expiry_date, s.is_active
    FROM files f
    LEFT JOIN share_links s ON f.id = s.file_id
    WHERE f.user_id = ?
    ORDER BY f.upload_date DESC
    """, (current_user.id,))
    
    files = c.fetchall()
    conn.close()
    
    file_links = []
    for file in files:
        # Не включаем файлы без ссылок для шаринга
        if file[6] is None:
            continue
            
        file_id, original_filename, filename, category, upload_date, size, share_id, token, created_date, expiry_date, is_active = file
        
        file_links.append({
            'id': file_id,
            'original_filename': original_filename,
            'filename': filename,
            'category': category,
            'upload_date': upload_date,
            'size': size,
            'share_id': share_id,
            'token': token,
            'share_url': url_for('view_shared_file', token=token, _external=True),
            'created_date': created_date,
            'expiry_date': expiry_date,
            'is_active': is_active == 1
        })
    
    return jsonify({'status': 'success', 'file_links': file_links})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/search')
@login_required
def search():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Поиск файлов
    c.execute("""
    SELECT * FROM files 
    WHERE user_id = ? AND lower(original_filename) LIKE ?
    """, (current_user.id, f'%{query}%'))
    files = c.fetchall()
    
    # Поиск ссылок
    c.execute("""
    SELECT * FROM links 
    WHERE user_id = ? AND (lower(title) LIKE ? OR lower(description) LIKE ?)
    """, (current_user.id, f'%{query}%', f'%{query}%'))
    links = c.fetchall()
    
    conn.close()
    
    results = []
    
    for file in files:
        results.append({
            'id': file[0],
            'filename': file[1],
            'original_name': file[2],
            'category': file[3],
            'upload_date': file[4],
            'size': file[5],
            'type': 'file'
        })
    
    for link in links:
        results.append({
            'id': link[0],
            'title': link[1],
            'url': link[2],
            'description': link[3],
            'category': link[4],
            'upload_date': link[5],
            'type': 'link'
        })
    
    return jsonify(results)

@app.route('/stats')
@login_required
def get_stats():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Получаем общее количество файлов и ссылок
    c.execute("SELECT COUNT(*) FROM files WHERE user_id = ?", (current_user.id,))
    file_count = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM links WHERE user_id = ?", (current_user.id,))
    link_count = c.fetchone()[0]
    
    # Получаем статистику по категориям
    c.execute("""
    SELECT category, COUNT(*) as count 
    FROM files 
    WHERE user_id = ? 
    GROUP BY category
    """, (current_user.id,))
    category_stats = {row[0]: row[1] for row in c.fetchall()}
    
    # Считаем общий объем хранимых данных
    c.execute("SELECT SUM(size) FROM files WHERE user_id = ?", (current_user.id,))
    total_size = c.fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'file_count': file_count,
        'link_count': link_count,
        'category_stats': category_stats,
        'total_size': total_size
    })

def is_text_file(filename):
    """Определяет, является ли файл текстовым."""
    text_extensions = ['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'xml', 'csv', 
                       'sh', 'bash', 'c', 'cpp', 'h', 'java', 'php', 'rb', 'pl', 'sql', 
                       'yml', 'yaml', 'toml', 'ini', 'conf', 'log']
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in text_extensions

@app.route('/preview/<category>/<filename>')
@login_required
def preview_file(category, filename):
    # Проверяем, принадлежит ли файл текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE filename = ? AND user_id = ?", 
             (filename, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'Файл не найден'}), 404
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'Файл не найден'}), 404
    
    mime_type, _ = mimetypes.guess_type(file_path)
    
    # Изображения и PDF просто отдаем для отображения в браузере
    if mime_type and (mime_type.startswith('image/') or mime_type == 'application/pdf'):
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], category), 
                                  filename, as_attachment=False)
    
    # Для текстовых файлов возвращаем содержимое (не более 100 КБ)
    if is_text_file(filename):
        try:
            max_size = 100 * 1024  # 100 КБ
            
            if os.path.getsize(file_path) > max_size:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(max_size) + "\n\n... [Файл обрезан, слишком большой для предпросмотра] ..."
            else:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
            return jsonify({
                'type': 'text',
                'content': content
            })
        except Exception as e:
            return jsonify({
                'error': f'Не удалось прочитать файл: {str(e)}'
            }), 500
    
    # Для остальных типов файлов предпросмотр не поддерживается
    return jsonify({
        'type': 'unsupported',
        'message': 'Предпросмотр для данного типа файлов не поддерживается'
    })

@app.route('/notes')
@login_required
def get_notes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("""
    SELECT * FROM notes 
    WHERE user_id = ? 
    ORDER BY priority DESC, create_date DESC
    """, (current_user.id,))
    
    notes = c.fetchall()
    conn.close()
    
    result = []
    for note in notes:
        result.append({
            'id': note[0],
            'title': note[1],
            'content': note[2],
            'create_date': note[3],
            'update_date': note[4],
            'priority': note[5]
        })
    
    return jsonify(result)

@app.route('/add_note', methods=['POST'])
@login_required
def add_note():
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Необходимо указать заголовок заметки'}), 400
    
    title = data.get('title')
    content = data.get('content', '')
    priority = data.get('priority', 0)
    now = datetime.now().isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    INSERT INTO notes (title, content, create_date, update_date, priority, user_id) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, (title, content, now, now, priority, current_user.id))
    conn.commit()
    note_id = c.lastrowid
    conn.close()
    
    return jsonify({
        'success': True, 
        'id': note_id, 
        'title': title, 
        'content': content,
        'create_date': now,
        'update_date': now,
        'priority': priority
    })

@app.route('/update_note/<int:note_id>', methods=['POST'])
@login_required
def update_note(note_id):
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Нет данных для обновления'}), 400
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, принадлежит ли заметка пользователю
    c.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", 
             (note_id, current_user.id))
    note = c.fetchone()
    
    if not note:
        conn.close()
        return jsonify({'error': 'Заметка не найдена'}), 404
    
    # Получаем текущие значения
    title = data.get('title', note[1])
    content = data.get('content', note[2])
    priority = data.get('priority', note[5])
    now = datetime.now().isoformat()
    
    # Обновляем заметку
    c.execute("""
    UPDATE notes 
    SET title = ?, content = ?, update_date = ?, priority = ? 
    WHERE id = ?
    """, (title, content, now, priority, note_id))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'id': note_id,
        'title': title,
        'content': content,
        'update_date': now,
        'priority': priority
    })

@app.route('/delete_note/<int:note_id>')
@login_required
def delete_note(note_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, принадлежит ли заметка пользователю
    c.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", 
             (note_id, current_user.id))
    note = c.fetchone()
    
    if not note:
        conn.close()
        return jsonify({'error': 'Заметка не найдена'}), 404
    
    # Удаляем заметку
    c.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# Маршруты для работы с фильмами
@app.route('/movies')
@login_required
def get_movies():
    filter_type = request.args.get('filter', 'all')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    query = "SELECT * FROM movies WHERE user_id = ?"
    params = [current_user.id]
    
    if filter_type == 'watched':
        query += " AND watched = 1"
    elif filter_type == 'unwatched':
        query += " AND watched = 0"
    
    query += " ORDER BY add_date DESC"
    
    c.execute(query, params)
    movies = c.fetchall()
    conn.close()
    
    result = []
    for movie in movies:
        result.append({
            'id': movie[0],
            'title': movie[1],
            'original_title': movie[2],
            'kinopoisk_id': movie[3],
            'poster_url': movie[4],
            'year': movie[5],
            'rating': movie[6],
            'genres': movie[7],
            'description': movie[8],
            'add_date': movie[9],
            'watched': movie[10],
            'watch_date': movie[11]
        })
    
    return jsonify(result)

@app.route('/search_movie')
@login_required
def search_movie():
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify([])
    
    try:
        # Проверяем наличие ключа и URL API
        api_key = app.config.get('KINOPOISK_API_KEY', '')
        api_url = app.config.get('KINOPOISK_API_URL', '')
        
        if not api_key or not api_url:
            print(f"Ошибка конфигурации API Кинопоиска: API_KEY={api_key}, API_URL={api_url}")
            # Возвращаем тестовые данные для отладки
            return jsonify([
                {
                    'kinopoisk_id': '123456',
                    'title': 'Тестовый фильм: ' + query,
                    'original_title': 'Test Movie',
                    'poster_url': '/static/img/no-poster.svg',
                    'year': '2023',
                    'rating': '8.5',
                    'genres': 'Комедия, Драма',
                    'description': 'Это тестовый фильм для отладки. API ключ или URL для Кинопоиска не настроены.'
                }
            ])
        
        # Запрос к API Кинопоиска
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json',
        }
        
        url = f"{api_url}?keyword={query}&page=1"
        print(f"Запрос к API Кинопоиска: {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            results = []
            
            movie_limit = app.config.get('MOVIE_SEARCH_LIMIT', 50)
            for film in data.get('films', [])[:movie_limit]:  # Используем лимит из конфигурации
                movie_data = {
                    'kinopoisk_id': str(film.get('filmId')),
                    'title': film.get('nameRu', 'Без названия'),
                    'original_title': film.get('nameEn', ''),
                    'poster_url': film.get('posterUrl', ''),
                    'year': film.get('year', ''),
                    'rating': film.get('rating', ''),
                    'genres': ', '.join([genre.get('genre', '') for genre in film.get('genres', [])]),
                    'description': film.get('description', '')
                }
                results.append(movie_data)
            
            return jsonify(results)
        else:
            print(f"Ошибка API Кинопоиска: {response.status_code} - {response.text}")
            return jsonify([])
            
    except Exception as e:
        print(f"Ошибка при поиске фильма: {str(e)}")
        return jsonify([])

@app.route('/add_movie', methods=['POST'])
@login_required
def add_movie():
    data = request.get_json()
    
    if not data or not data.get('kinopoisk_id') or not data.get('title'):
        return jsonify({'error': 'Недостаточно данных для добавления фильма'}), 400
    
    kinopoisk_id = data.get('kinopoisk_id')
    title = data.get('title')
    original_title = data.get('original_title', '')
    poster_url = data.get('poster_url', '')
    year = data.get('year', 0)
    rating = data.get('rating', 0)
    genres = data.get('genres', '')
    description = data.get('description', '')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, есть ли уже такой фильм у пользователя
    c.execute("SELECT id FROM movies WHERE kinopoisk_id = ? AND user_id = ?", 
             (kinopoisk_id, current_user.id))
    existing_movie = c.fetchone()
    
    if existing_movie:
        conn.close()
        return jsonify({'error': 'Этот фильм уже добавлен в вашу коллекцию'}), 400
    
    # Добавляем фильм
    c.execute("""
    INSERT INTO movies 
    (title, original_title, kinopoisk_id, poster_url, year, rating, genres, 
    description, add_date, watched, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, original_title, kinopoisk_id, poster_url, year, rating, genres,
         description, datetime.now().isoformat(), 0, current_user.id))
    
    conn.commit()
    movie_id = c.lastrowid
    conn.close()
    
    return jsonify({
        'success': True,
        'id': movie_id,
        'message': 'Фильм успешно добавлен'
    })

@app.route('/watch_movie/<int:movie_id>')
@login_required
def watch_movie(movie_id):
    # Сначала проверяем, что фильм принадлежит пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("SELECT kinopoisk_id FROM movies WHERE id = ? AND user_id = ?", 
             (movie_id, current_user.id))
    movie = c.fetchone()
    
    if not movie:
        conn.close()
        return jsonify({'error': 'Фильм не найден'}), 404
    
    kinopoisk_id = movie[0]
    conn.close()
    
    # Формируем список зеркал для пробы
    mirrors = app.config.get('KINOPOISK_MIRRORS', [])
    
    if not mirrors:
        # Если зеркала не настроены, используем значения по умолчанию
        mirrors = ['https://kinopoisk.film', 'https://kinopoisk.gold']
        print("Зеркала не настроены, используем значения по умолчанию")
    
    random.shuffle(mirrors)  # Перемешиваем для равномерного распределения нагрузки
    
    # Устанавливаем URL по умолчанию (будет использован, если все зеркала недоступны)
    redirect_url = f"https://kinopoisk.film/film/{kinopoisk_id}/"
    
    # Отключаем проверку SSL сертификата для ускорения проверки зеркал
    session = requests.Session()
    session.verify = False
    
    working_mirrors = []
    for mirror in mirrors:
        mirror_url = f"{mirror}/film/{kinopoisk_id}/"
        try:
            print(f"Проверка зеркала: {mirror_url}")
            response = session.head(mirror_url, timeout=2, allow_redirects=False)
            status = response.status_code
            
            # 200, 301, 302 статусы считаем рабочими
            if status < 400:
                print(f"Зеркало {mirror} доступно, статус: {status}")
                working_mirrors.append(mirror_url)
                
                # Если нашли рабочее зеркало, сразу устанавливаем его
                if status == 200:
                    redirect_url = mirror_url
                    break
        except Exception as e:
            print(f"Ошибка при проверке зеркала {mirror}: {str(e)}")
            continue
    
    # Если нашли хоть одно рабочее зеркало, используем первое
    if working_mirrors:
        redirect_url = working_mirrors[0]
    
    print(f"Перенаправление на: {redirect_url}")
    return jsonify({
        'success': True,
        'url': redirect_url
    })

@app.route('/toggle_watched/<int:movie_id>')
@login_required
def toggle_watched(movie_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, что фильм принадлежит пользователю
    c.execute("SELECT watched FROM movies WHERE id = ? AND user_id = ?", 
             (movie_id, current_user.id))
    movie = c.fetchone()
    
    if not movie:
        conn.close()
        return jsonify({'error': 'Фильм не найден'}), 404
    
    # Инвертируем статус "просмотрено"
    current_status = movie[0]
    new_status = 0 if current_status == 1 else 1
    watch_date = datetime.now().isoformat() if new_status == 1 else None
    
    try:
        c.execute("""
        UPDATE movies SET watched = ?, watch_date = ? WHERE id = ?
        """, (new_status, watch_date, movie_id))
        
        conn.commit()
        
        # Проверяем, что запись была обновлена
        c.execute("SELECT watched FROM movies WHERE id = ?", (movie_id,))
        updated_movie = c.fetchone()
        
        if not updated_movie or updated_movie[0] != new_status:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Не удалось обновить статус фильма'
            }), 500
            
        status_text = "просмотренным" if new_status == 1 else "не просмотренным"
        
        print(f"Фильм с ID {movie_id} отмечен как {status_text}")
        
        conn.close()
        return jsonify({
            'success': True,
            'watched': new_status,
            'message': f'Фильм отмечен как {status_text}'
        })
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"Ошибка при обновлении статуса фильма: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Ошибка при обновлении статуса: {str(e)}'
        }), 500

@app.route('/delete_movie/<int:movie_id>')
@login_required
def delete_movie(movie_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, что фильм принадлежит пользователю
    c.execute("SELECT id FROM movies WHERE id = ? AND user_id = ?", 
             (movie_id, current_user.id))
    movie = c.fetchone()
    
    if not movie:
        conn.close()
        return jsonify({'error': 'Фильм не найден'}), 404
    
    c.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Фильм успешно удален'
    })

@app.route('/add_movie/<movie_id>', methods=['POST'])
@login_required
def add_movie_by_id(movie_id):
    try:
        # Проверяем наличие ключа и URL API
        api_key = app.config.get('KINOPOISK_API_KEY', '')
        api_url = app.config.get('KINOPOISK_API_URL', '')
        film_api_url = app.config.get('KINOPOISK_FILM_API_URL', 'https://kinopoiskapiunofficial.tech/api/v2.2/films/')
        
        if not api_key:
            return jsonify({'error': 'API ключ Кинопоиска не настроен'}), 500
        
        # Запрос к API Кинопоиска
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json',
        }
        
        url = f"{film_api_url}{movie_id}"
        print(f"Запрос к API Кинопоиска для получения информации о фильме: {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            film = response.json()
            
            # Преобразуем полученные данные для добавления в БД
            kinopoisk_id = str(film.get('kinopoiskId') or film.get('filmId') or movie_id)
            title = film.get('nameRu', 'Без названия')
            original_title = film.get('nameEn', '') or film.get('nameOriginal', '')
            poster_url = film.get('posterUrl', '')
            year = film.get('year', 0)
            rating = film.get('ratingKinopoisk', 0) or film.get('rating', 0) or 0
            genres = ', '.join([genre.get('genre', '') for genre in film.get('genres', [])])
            description = film.get('description', '')
            
            # Проверяем, есть ли уже такой фильм у пользователя
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            c.execute("SELECT id FROM movies WHERE kinopoisk_id = ? AND user_id = ?", 
                     (kinopoisk_id, current_user.id))
            existing_movie = c.fetchone()
            
            if existing_movie:
                conn.close()
                return jsonify({'error': 'Этот фильм уже добавлен в вашу коллекцию'}), 400
            
            # Добавляем фильм
            c.execute("""
            INSERT INTO movies 
            (title, original_title, kinopoisk_id, poster_url, year, rating, genres, 
            description, add_date, watched, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (title, original_title, kinopoisk_id, poster_url, year, rating, genres,
                 description, datetime.now().isoformat(), 0, current_user.id))
            
            conn.commit()
            movie_id = c.lastrowid
            conn.close()
            
            return jsonify({
                'success': True,
                'id': movie_id,
                'message': 'Фильм успешно добавлен'
            })
        else:
            print(f"Ошибка API Кинопоиска: {response.status_code} - {response.text}")
            return jsonify({'error': f'Ошибка API Кинопоиска: {response.status_code}'}), 500
            
    except Exception as e:
        print(f"Ошибка при добавлении фильма: {str(e)}")
        return jsonify({'error': f'Ошибка при добавлении фильма: {str(e)}'}), 500

@app.route('/search_torrents/<int:movie_id>')
@login_required
def search_torrents(movie_id):
    """Поиск торрентов для конкретного фильма"""
    # Получаем информацию о фильме из БД
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("SELECT title, original_title, year FROM movies WHERE id = ? AND user_id = ?", 
             (movie_id, current_user.id))
    movie = c.fetchone()
    conn.close()
    
    if not movie:
        return jsonify({'error': 'Фильм не найден'}), 404
    
    title_ru = movie[0]
    title_en = movie[1]
    year = movie[2]
    
    # Создаем различные варианты поисковых запросов для улучшения результатов
    search_queries = []
    
    # Получаем очищенные названия (без специальных символов)
    def clean_title(title):
        if not title:
            return ""
        # Удаляем специальные символы, которые могут мешать поиску
        cleaned = re.sub(r'[^\w\s]', ' ', title)
        # Удаляем лишние пробелы
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned
    
    clean_title_ru = clean_title(title_ru)
    clean_title_en = clean_title(title_en)
    
    # Добавляем запросы в порядке приоритета
    if title_en:
        search_queries.append(f"{title_en} {year}")  # Оригинальное название + год
        search_queries.append(clean_title_en + f" {year}")  # Очищенное название + год
    
    if title_ru and title_ru != title_en:  # Если есть русское название и оно отличается от английского
        search_queries.append(f"{title_ru} {year}")  # Русское название + год
        search_queries.append(clean_title_ru + f" {year}")  # Очищенное русское название + год
    
    # Добавляем запросы без года как запасные варианты
    if title_en:
        search_queries.append(title_en)
    if title_ru and title_ru != title_en:
        search_queries.append(title_ru)
    
    # Удаляем дубликаты, сохраняя порядок
    search_queries = list(dict.fromkeys(search_queries))
    
    print(f"Поисковые запросы для фильма '{title_ru or title_en}': {search_queries}")
    
    # Получаем список трекеров из конфигурации
    trackers = app.config.get('TORRENT_TRACKERS', [])
    
    if not trackers:
        # Если трекеры не настроены, используем значения по умолчанию
        trackers = [
            {'name': 'The Pirate Bay', 'search_url': 'https://thepiratebay.org/search/{query}/0/99/0'},
            {'name': 'RARBG', 'search_url': 'https://rarbgprx.org/torrents.php?search={query}'},
            {'name': 'RuTracker', 'search_url': 'https://rutracker.org/forum/tracker.php?nm={query}'},
            {'name': 'Kinozal', 'search_url': 'https://kinozal.tv/browse.php?s={query}'}
        ]
    
    results = []
    
    # Создаем сессию для запросов
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # Устанавливаем таймаут для запросов
    request_timeout = 5  # секунд
    
    # 1. Поиск на Rutor (русские и зарубежные фильмы)
    try:
        for query in search_queries[:2]:  # Используем только первые два запроса
            rutor_search_url = f"http://rutor.info/search/{urllib.parse.quote(query)}"
            try:
                response = session.get(rutor_search_url, timeout=request_timeout)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Находим таблицу с результатами
                    result_table = soup.select_one('#index')
                    if result_table:
                        rows = result_table.select('tr:not(:first-child)')
                        
                        for row in rows[:10]:  # Берем только первые 10 результатов
                            try:
                                cells = row.select('td')
                                if len(cells) >= 4:
                                    name_cell = cells[1]
                                    size_cell = cells[3]
                                    seeds_cell = cells[4]
                                    leech_cell = cells[5]
                                    
                                    # Ссылка на торрент
                                    magnet_link = name_cell.select_one('a[href^="magnet:"]')
                                    torrent_link = name_cell.select_one('a.downgif')
                                    
                                    # Название торрента (берем из тега b, который содержит название)
                                    name_tag = name_cell.select_one('a:not([href^="magnet:"])')
                                    if not name_tag:
                                        continue
                                    
                                    torrent_name = name_tag.get_text(strip=True)
                                    
                                    # Проверяем соответствие запросу по году
                                    if year and str(year) not in torrent_name and re.search(r'\(\d{4}\)', torrent_name) and not re.search(fr'\({year}\)', torrent_name):
                                        continue
                                    
                                    # Проверяем, чтобы название содержало как минимум часть запроса
                                    query_parts = query.lower().split()
                                    torrent_name_lower = torrent_name.lower()
                                    
                                    if not any(part in torrent_name_lower for part in query_parts if len(part) > 2):
                                        continue
                                    
                                    # URL для деталей
                                    detail_url = "http://rutor.info" + name_tag['href'] if name_tag and name_tag.has_attr('href') else None
                                    
                                    # Определяем качество из названия
                                    quality = "Unknown"
                                    quality_patterns = [
                                        '4K', '2160p', '1080p', '720p', 'BDRip', 'HDRip', 'WEB-DL', 
                                        'BluRay', 'HDTV', 'DVD', 'DVDRip', 'UHD', 'HDR'
                                    ]
                                    for pattern in quality_patterns:
                                        if pattern in torrent_name:
                                            quality = pattern
                                            break
                                    
                                    size = size_cell.get_text(strip=True) if size_cell else "Unknown"
                                    seeds = seeds_cell.get_text(strip=True) if seeds_cell else "0"
                                    leeches = leech_cell.get_text(strip=True) if leech_cell else "0"
                                    
                                    # URL для использования в приложении (магнет или страница с деталями)
                                    url = magnet_link['href'] if magnet_link else (detail_url if detail_url else "")
                                    
                                    results.append({
                                        'name': torrent_name,
                                        'url': url,
                                        'size': size,
                                        'quality': quality,
                                        'seeds': seeds,
                                        'leech': leeches,
                                        'engine': 'Rutor',
                                        'magnet': magnet_link['href'] if magnet_link else None,
                                        'torrent': "http://rutor.info" + torrent_link['href'] if torrent_link and torrent_link.has_attr('href') else None
                                    })
                            except Exception as e:
                                print(f"Ошибка при разборе результата Rutor: {str(e)}")
                                continue
                        
                        # Если нашли хотя бы 3 результата, можно прекратить поиск на данном трекере
                        if len([r for r in results if r['engine'] == 'Rutor']) >= 3:
                            break
            except Exception as e:
                print(f"Ошибка при поиске на Rutor: {str(e)}")
    except Exception as e:
        print(f"Общая ошибка при работе с Rutor: {str(e)}")
    
    # 2. Поиск на YTS/YIFY через API (хорошо для иностранных фильмов)
    try:
        for query in search_queries[:2]:  # Используем только первые два запроса для YTS
            yts_api_url = f"https://yts.mx/api/v2/list_movies.json?query_term={urllib.parse.quote(query)}&limit=10&sort=seeds"
            try:
                yts_response = session.get(yts_api_url, timeout=request_timeout)
                
                if yts_response.status_code == 200:
                    yts_data = yts_response.json()
                    if yts_data.get('status') == 'ok' and yts_data.get('data', {}).get('movie_count', 0) > 0:
                        for movie_data in yts_data.get('data', {}).get('movies', []):
                            movie_title = movie_data.get('title_long', '')
                            movie_year = movie_data.get('year', 0)
                            
                            # Проверяем соответствие года (если указан)
                            if year and abs(int(movie_year) - year) > 1:
                                continue
                                
                            for torrent in movie_data.get('torrents', []):
                                quality = torrent.get('quality', 'Unknown')
                                size = torrent.get('size', 'Unknown')
                                seeds = torrent.get('seeds', 0)
                                peers = torrent.get('peers', 0)
                                torrent_url = torrent.get('url', '')
                                
                                if torrent_url:
                                    torrent_name = f"{movie_title} [{quality}]"
                                    results.append({
                                        'name': torrent_name,
                                        'url': torrent_url,
                                        'size': size,
                                        'quality': quality,
                                        'seeds': seeds,
                                        'leech': peers,
                                        'engine': 'YTS/YIFY',
                                        'torrent': torrent_url,
                                        'magnet': None  # YTS дает только .torrent файлы
                                    })
                        
                        # Если нашли результаты, переходим к следующему источнику
                        if len([r for r in results if r['engine'] == 'YTS/YIFY']) > 0:
                            break
            except Exception as e:
                print(f"Ошибка при поиске YTS: {str(e)}")
    except Exception as e:
        print(f"Общая ошибка при поиске на YTS: {str(e)}")
    
    # 3. Поиск на 1337x через скрапинг
    try:
        for query in search_queries:
            # Сначала пробуем основной домен
            domains = ['https://1337x.to', 'https://1337x.st', 'https://1337x.is']
            
            for domain in domains:
                try:
                    search_url = f"{domain}/search/{urllib.parse.quote(query)}/1/"
                    response = session.get(search_url, timeout=request_timeout)
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        
                        # Находим все строки таблицы с результатами
                        rows = soup.select('table.table-list tbody tr')
                        
                        if rows:
                            for row in rows[:10]:  # Ограничиваем до 10 результатов
                                try:
                                    name_cell = row.select_one('td.name')
                                    if name_cell:
                                        torrent_name = name_cell.select_one('a:nth-child(2)').text.strip()
                                        torrent_link = name_cell.select_one('a:nth-child(2)')['href']
                                        
                                        # Проверка соответствия запросу
                                        query_parts = query.lower().split()
                                        torrent_name_lower = torrent_name.lower()
                                        
                                        # Проверяем наличие ключевых слов из запроса в названии
                                        if not any(part in torrent_name_lower for part in query_parts if len(part) > 2):
                                            continue
                                        
                                        # Проверяем год, если он указан в запросе
                                        if year and str(year) not in torrent_name and re.search(r'\d{4}', torrent_name) and not re.search(fr'{year}', torrent_name):
                                            continue
                                        
                                        # Информация о размере и сидах/личах
                                        size = row.select_one('td.size').get_text(strip=True)
                                        seeds = row.select_one('td.seeds').get_text(strip=True)
                                        leeches = row.select_one('td.leeches').get_text(strip=True)
                                        
                                        # Определяем качество видео из названия
                                        quality = "Unknown"
                                        quality_patterns = [
                                            '4K', '2160p', '1080p', '720p', 'BDRip', 'HDRip', 'WEB-DL', 
                                            'BluRay', 'HDTV', 'DVD', 'DVDRip', 'UHD', 'HDR'
                                        ]
                                        for pattern in quality_patterns:
                                            if pattern in torrent_name:
                                                quality = pattern
                                                break
                                        
                                        # Формируем ссылку на детальную страницу торрента
                                        detail_url = f"{domain}{torrent_link}"
                                        
                                        results.append({
                                            'name': torrent_name,
                                            'url': detail_url,
                                            'size': size,
                                            'quality': quality,
                                            'seeds': seeds,
                                            'leech': leeches,
                                            'engine': '1337x',
                                            'magnet': None,  # Будет получено по запросу
                                            'torrent': None  # Будет получено по запросу
                                        })
                                except Exception as e:
                                    print(f"Ошибка при парсинге результата 1337x: {str(e)}")
                                    continue
                            
                            # Если нашли хотя бы 3 результата, прекращаем поиск на этом трекере
                            if len([r for r in results if r['engine'] == '1337x']) >= 3:
                                break
                except Exception as e:
                    print(f"Ошибка при доступе к домену 1337x {domain}: {str(e)}")
                    continue
            
            # Если нашли результаты для текущего запроса, переходим к следующему трекеру
            if len([r for r in results if r['engine'] == '1337x']) > 0:
                break
    except Exception as e:
        print(f"Общая ошибка при поиске на 1337x: {str(e)}")
    
    # 4. Для русских фильмов особенно полезен RuTracker
    if title_ru:
        try:
            query = title_ru
            if year:
                query += f" {year}"
            
            # RuTracker использует POST-запрос для поиска
            rutracker_search_url = 'https://rutracker.org/forum/tracker.php'
            form_data = {'nm': query}
            
            try:
                rutracker_response = session.post(rutracker_search_url, data=form_data, timeout=request_timeout)
                
                if rutracker_response.status_code == 200:
                    soup = BeautifulSoup(rutracker_response.text, 'html.parser')
                    
                    # Найдем все строки таблицы с результатами
                    rows = soup.select('table.forumline tr.hl-tr')
                    
                    for row in rows[:7]:  # Ограничиваем до 7 результатов
                        try:
                            title_cell = row.select_one('td.t-title')
                            if title_cell:
                                torrent_name = title_cell.select_one('a').text.strip()
                                torrent_link = title_cell.select_one('a')['href']
                                
                                # Проверяем название на соответствие запросу
                                title_parts = [clean_title_ru, clean_title_en]
                                title_parts = [p.lower() for p in title_parts if p]
                                
                                if not any(part in torrent_name.lower() for part in title_parts if part):
                                    continue
                                
                                # Проверяем год, если он указан
                                if year and str(year) not in torrent_name and re.search(r'\d{4}', torrent_name) and not re.search(fr'{year}', torrent_name):
                                    continue
                                
                                # Получаем сиды и личи
                                seeds = row.select_one('td.seedmed b').text.strip() if row.select_one('td.seedmed b') else '0'
                                leeches = row.select_one('td.leechmed b').text.strip() if row.select_one('td.leechmed b') else '0'
                                
                                # Получаем размер
                                size_cell = row.select_one('td.tor-size')
                                size = size_cell.get_text(strip=True) if size_cell else 'Unknown'
                                
                                # Определяем качество из названия
                                quality = "Unknown"
                                quality_patterns = [
                                    '4K', '2160p', '1080p', '720p', 'BDRip', 'HDRip', 'WEB-DL', 
                                    'BluRay', 'HDTV', 'DVD', 'DVDRip', 'UHD', 'HDR'
                                ]
                                for pattern in quality_patterns:
                                    if pattern in torrent_name:
                                        quality = pattern
                                        break
                                
                                # Формируем ссылку на страницу с торрентом
                                if not torrent_link.startswith('http'):
                                    torrent_link = f"https://rutracker.org/forum/{torrent_link}"
                                
                                results.append({
                                    'name': torrent_name,
                                    'url': torrent_link,
                                    'size': size,
                                    'quality': quality,
                                    'seeds': seeds,
                                    'leech': leeches,
                                    'engine': 'RuTracker',
                                    'magnet': None,  # Будет получено по запросу
                                    'torrent': None  # Будет получено по запросу
                                })
                        except Exception as e:
                            print(f"Ошибка при парсинге результата RuTracker: {str(e)}")
                            continue
            except Exception as e:
                print(f"Ошибка запроса к RuTracker: {str(e)}")
        except Exception as e:
            print(f"Общая ошибка при поиске на RuTracker: {str(e)}")
    
    # 5. Kinozal для русских релизов
    if title_ru:
        try:
            query = title_ru
            if year:
                query += f" {year}"
            
            kinozal_search_url = 'https://kinozal.tv/browse.php'
            params = {'s': query}
            
            try:
                kinozal_response = session.get(kinozal_search_url, params=params, timeout=request_timeout)
                
                if kinozal_response.status_code == 200:
                    soup = BeautifulSoup(kinozal_response.text, 'html.parser')
                    
                    # Находим таблицу результатов
                    rows = soup.select('table.t_peer.w100p tr:not(.bg)')
                    
                    for row in rows[:7]:  # Ограничиваем до 7 результатов
                        try:
                            cells = row.select('td')
                            if len(cells) >= 5:
                                name_cell = cells[1]
                                size_cell = cells[3]
                                seeds_cell = cells[4]
                                
                                link = name_cell.select_one('a')
                                if not link:
                                    continue
                                
                                torrent_name = link.get_text(strip=True)
                                detail_url = 'https://kinozal.tv' + link['href'] if link.has_attr('href') else None
                                
                                # Проверяем соответствие запросу
                                if not any(part.lower() in torrent_name.lower() for part in [title_ru, title_en] if part):
                                    continue
                                
                                # Проверяем год, если он указан
                                if year and str(year) not in torrent_name and re.search(r'\d{4}', torrent_name) and not re.search(fr'{year}', torrent_name):
                                    continue
                                
                                # Извлекаем размер и сиды
                                size = size_cell.get_text(strip=True) if size_cell else 'Unknown'
                                seeds = ''.join(filter(str.isdigit, seeds_cell.get_text(strip=True) if seeds_cell else '0'))
                                
                                # Определяем качество из названия
                                quality = "Unknown"
                                quality_patterns = [
                                    '4K', '2160p', '1080p', '720p', 'BDRip', 'HDRip', 'WEB-DL', 
                                    'BluRay', 'HDTV', 'DVD', 'DVDRip', 'UHD', 'HDR'
                                ]
                                for pattern in quality_patterns:
                                    if pattern in torrent_name:
                                        quality = pattern
                                        break
                                
                                results.append({
                                    'name': torrent_name,
                                    'url': detail_url,
                                    'size': size,
                                    'quality': quality,
                                    'seeds': seeds,
                                    'leech': '0',  # Kinozal не показывает личей в результатах поиска
                                    'engine': 'Kinozal',
                                    'magnet': None,  # Требуется регистрация
                                    'torrent': None   # Требуется регистрация
                                })
                        except Exception as e:
                            print(f"Ошибка при парсинге результата Kinozal: {str(e)}")
                            continue
            except Exception as e:
                print(f"Ошибка запроса к Kinozal: {str(e)}")
        except Exception as e:
            print(f"Общая ошибка при поиске на Kinozal: {str(e)}")
    
    # 6. Если это сериал, попробуем EZTV
    is_series = any(word in (title_en or "").lower() + (title_ru or "").lower() for word in ['season', 'series', 'episode', 'сезон', 'серия', 'эпизод'])
    if is_series or (not results and 'season' in search_queries[0].lower()):
        try:
            eztv_search_url = f"https://eztv.re/search/{urllib.parse.quote(search_queries[0])}"
            try:
                eztv_response = session.get(eztv_search_url, timeout=request_timeout)
                
                if eztv_response.status_code == 200:
                    soup = BeautifulSoup(eztv_response.text, 'html.parser')
                    
                    rows = soup.select('table tr.forum_header_border')
                    
                    for row in rows[:10]:  # Ограничиваем до 10 результатов
                        try:
                            title_element = row.select_one('td.forum_thread_post a.epinfo')
                            if title_element:
                                torrent_name = title_element.text.strip()
                                
                                # Проверка соответствия запросу
                                words_in_query = [word.lower() for word in search_queries[0].split()]
                                if not any(word in torrent_name.lower() for word in words_in_query if len(word) > 2):
                                    continue
                                
                                # Ссылка на магнет в третьей ячейке
                                magnet_element = row.select_one('td:nth-child(3) a')
                                if magnet_element and 'magnet:' in magnet_element.get('href', ''):
                                    magnet_url = magnet_element.get('href')
                                    
                                    # Получаем размер и сиды/личи
                                    size = row.select_one('td:nth-child(4)').get_text(strip=True) if row.select_one('td:nth-child(4)') else 'Unknown'
                                    seeds = row.select_one('td:nth-child(6)').get_text(strip=True) if row.select_one('td:nth-child(6)') else '0'
                                    
                                    # Определяем качество видео из названия
                                    quality = "Unknown"
                                    quality_patterns = [
                                        '4K', '2160p', '1080p', '720p', 'BDRip', 'HDRip', 'WEB-DL', 
                                        'BluRay', 'HDTV', 'DVD', 'DVDRip', 'UHD', 'HDR'
                                    ]
                                    for pattern in quality_patterns:
                                        if pattern in torrent_name:
                                            quality = pattern
                                            break
                                    
                                    # Добавляем торрент в результаты
                                    results.append({
                                        'name': torrent_name,
                                        'url': magnet_url,
                                        'size': size,
                                        'quality': quality,
                                        'seeds': seeds,
                                        'leech': '0',  # EZTV не показывает личей
                                        'engine': 'EZTV',
                                        'magnet': magnet_url,
                                        'torrent': None
                                    })
                        except Exception as e:
                            print(f"Ошибка при парсинге результата EZTV: {str(e)}")
                            continue
            except Exception as e:
                print(f"Ошибка при запросе к EZTV: {str(e)}")
        except Exception as e:
            print(f"Общая ошибка при поиске на EZTV: {str(e)}")
    
    # Если после всех попыток торренты не найдены или их слишком мало, добавляем ссылки на поисковые системы
    if len(results) < 3:
        # Безопасные поисковые системы, которые можно использовать как запасной вариант
        search_engines = [
            {'name': 'Google', 'url': f'https://www.google.com/search?q={urllib.parse.quote(search_queries[0])}+torrent'},
            {'name': 'Yandex', 'url': f'https://yandex.ru/search/?text={urllib.parse.quote(search_queries[0])}+torrent'},
            {'name': 'DuckDuckGo', 'url': f'https://duckduckgo.com/?q={urllib.parse.quote(search_queries[0])}+torrent'}
        ]
        
        for engine in search_engines:
            results.append({
                'name': f'Поиск в {engine["name"]}: {search_queries[0]}',
                'url': engine['url'],
                'size': 'N/A',
                'quality': 'N/A',
                'seeds': 'N/A',
                'leech': 'N/A',
                'engine': engine['name'],
                'magnet': None,
                'torrent': None
            })
        
        # Добавляем прямые ссылки на трекеры с безопасным поиском
        for tracker in trackers:
            query_url = tracker['search_url'].format(query=urllib.parse.quote(search_queries[0]))
            results.append({
                'name': f'Поиск на {tracker["name"]}: {search_queries[0]}',
                'url': query_url,
                'size': 'N/A',
                'quality': 'N/A',
                'seeds': 'N/A',
                'leech': 'N/A',
                'engine': tracker['name'],
                'magnet': None,
                'torrent': None
            })
    
    # Сортируем результаты по количеству сидов (если они есть)
    # Исправленная версия сортировки, которая правильно обрабатывает разные типы данных
    def get_seeds_value(item):
        seeds = item.get('seeds', 0)
        if isinstance(seeds, int):
            return seeds
        elif isinstance(seeds, str) and seeds.isdigit():
            return int(seeds)
        return 0
    
    # Сначала вывести настоящие торренты, затем поисковые запросы
    proper_torrents = [item for item in results if item.get('seeds') != 'N/A']
    search_links = [item for item in results if item.get('seeds') == 'N/A']
    
    # Сортируем настоящие торренты по количеству сидов
    proper_torrents.sort(key=get_seeds_value, reverse=True)
    
    # Объединяем отсортированные торренты и поисковые запросы
    results = proper_torrents + search_links
    
    return jsonify({
        'success': True,
        'query': search_queries[0],
        'results': results
    })

@app.route('/get_torrent_link')
@login_required
def get_torrent_link():
    """Получение прямой ссылки на торрент-файл или магнет-ссылки с различных трекеров"""
    url = request.args.get('url')
    engine = request.args.get('engine', '')
    
    if not url:
        return jsonify({'error': 'URL не указан'}), 400
    
    try:
        # Создаем сессию для запросов с пользовательским агентом
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        result = {
            'success': True,
            'torrent_links': [],
            'magnet_links': [],
            'source': engine or 'unknown'
        }
        
        # Если это уже магнет-ссылка, возвращаем ее
        if url.startswith('magnet:'):
            result['magnet_links'].append(url)
            return jsonify(result)
        
        # 1337x и его альтернативные домены
        if any(domain in url for domain in ['1337x.to', '1337xto.to', '1337x.st', '1337x.is']):
            # Делаем запрос к странице деталей
            response = session.get(url, timeout=5)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Ищем ссылку на скачивание торрент-файла
                download_links = soup.select('a.btn-download')
                magnet_links = soup.select('a[href^="magnet:"]')
                
                for link in download_links:
                    href = link.get('href')
                    if href:
                        if not href.startswith('http'):
                            base_domain = url.split('/torrent/')[0]
                            href = f"{base_domain}{href}"
                        result['torrent_links'].append(href)
                
                for link in magnet_links:
                    href = link.get('href')
                    if href:
                        result['magnet_links'].append(href)
            else:
                return jsonify({'error': f'Ошибка доступа к странице 1337x: {response.status_code}'}), response.status_code
        
        # RuTracker
        elif 'rutracker.org' in url or 'rutracker.net' in url:
            response = session.get(url, timeout=5)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Ищем магнет-ссылку
                magnet_link = soup.select_one('a[href^="magnet:"]')
                if magnet_link:
                    result['magnet_links'].append(magnet_link['href'])
                
                # Ищем ссылку на скачивание .torrent файла
                download_link = soup.select_one('a.dl-stub, a.dl-link')
                if download_link:
                    href = download_link.get('href')
                    if href:
                        if not href.startswith('http'):
                            href = f"https://rutracker.org/forum/{href}"
                        result['torrent_links'].append(href)
            else:
                return jsonify({'error': f'Ошибка доступа к странице RuTracker: {response.status_code}'}), response.status_code
        
        # YTS/YIFY
        elif 'yts.mx' in url or 'yify' in url:
            # YTS обычно предоставляет прямые ссылки на торрент-файлы
            # При поиске мы уже получили прямую ссылку на .torrent файл
            result['torrent_links'].append(url)
        
        # EZTV
        elif 'eztv.re' in url or 'eztv.io' in url:
            # EZTV обычно предоставляет только магнет-ссылки, которые мы уже получили при поиске
            # Но для полноты, если пользователь перешел на страницу с деталями, попробуем получить магнет-ссылку
            if not url.startswith('magnet:'):
                response = session.get(url, timeout=5)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    magnet_link = soup.select_one('a[href^="magnet:"]')
                    if magnet_link:
                        result['magnet_links'].append(magnet_link['href'])
                else:
                    return jsonify({'error': f'Ошибка доступа к странице EZTV: {response.status_code}'}), response.status_code
            else:
                result['magnet_links'].append(url)
        
        # Общий случай для других сайтов - пытаемся найти магнет-ссылки и ссылки на .torrent файлы
        else:
            response = session.get(url, timeout=5)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Ищем все магнет-ссылки
                magnet_links = soup.select('a[href^="magnet:"]')
                for link in magnet_links:
                    result['magnet_links'].append(link['href'])
                
                # Ищем ссылки на .torrent файлы (обычно содержат ".torrent" в href или имеют соответствующие классы)
                torrent_links = soup.select('a[href$=".torrent"], a.torrent-download-link, a.dl-link, a.download')
                for link in torrent_links:
                    href = link.get('href')
                    if href:
                        if not href.startswith('http'):
                            parsed_url = urllib.parse.urlparse(url)
                            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                            href = urllib.parse.urljoin(base_url, href)
                        result['torrent_links'].append(href)
            else:
                return jsonify({'error': f'Ошибка доступа к странице: {response.status_code}'}), response.status_code
        
        # Если нашли хотя бы одну ссылку
        if result['torrent_links'] or result['magnet_links']:
            return jsonify(result)
        else:
            # В случае, если не найдены ссылки, но статус-код 200, предложим прямой переход на страницу
            result['message'] = 'Ссылки для скачивания не найдены автоматически. Пожалуйста, перейдите на сайт вручную.'
            result['page_url'] = url
            return jsonify(result)
            
    except Exception as e:
        print(f"Ошибка при получении ссылки на торрент: {str(e)}")
        return jsonify({'error': f'Ошибка при получении ссылки: {str(e)}'}), 500

# Маршрут для непосредственного скачивания торрент-файла
@app.route('/download_torrent')
@login_required
def download_torrent():
    """Проксирует скачивание торрент-файла с внешнего ресурса"""
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL не указан'}), 400
    
    try:
        # Создаем сессию для запросов
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Делаем запрос к ссылке на скачивание
        response = session.get(url, timeout=10, stream=True, allow_redirects=True)
        
        if response.status_code == 200:
            # Парсим имя файла из заголовка Content-Disposition или из URL
            content_disposition = response.headers.get('Content-Disposition')
            filename = None
            
            if content_disposition:
                # Извлекаем имя файла из заголовка
                filename_match = re.search(r'filename="?([^"]+)"?', content_disposition)
                if filename_match:
                    filename = filename_match.group(1)
            
            # Если имя файла не найдено в заголовке, получаем его из URL
            if not filename:
                filename = url.split('/')[-1]
                if '?' in filename:
                    filename = filename.split('?')[0]
            
            # Гарантируем, что файл имеет расширение .torrent
            if not filename.endswith('.torrent'):
                filename += '.torrent'
            
            # Отправляем файл клиенту
            return Response(
                response.iter_content(chunk_size=1024),
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'application/x-bittorrent'
                }
            )
        else:
            return jsonify({'error': f'Ошибка скачивания файла: {response.status_code}'}), response.status_code
            
    except Exception as e:
        print(f"Ошибка при скачивании торрент-файла: {str(e)}")
        return jsonify({'error': f'Ошибка при скачивании: {str(e)}'}), 500

@app.route('/create_share_link', methods=['POST'])
@login_required
def create_share_link():
    """Создает ссылку для шаринга файла"""
    file_id = request.json.get('file_id')
    expiry_days = request.json.get('expiry_days', 30)  # По умолчанию 30 дней
    
    # Проверяем существование файла и принадлежность пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", 
             (file_id, current_user.id))
    file = c.fetchone()
    
    if not file:
        conn.close()
        return jsonify({'error': 'Файл не найден'}), 404
    
    # Генерируем уникальный токен
    token = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    created_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    expiry_date = (datetime.now() + timedelta(days=expiry_days)).strftime("%Y-%m-%d %H:%M:%S")
    
    # Добавляем запись в БД
    c.execute('''
    INSERT INTO share_links (file_id, token, created_date, expiry_date, is_active) 
    VALUES (?, ?, ?, ?, 1)
    ''', (file_id, token, created_date, expiry_date))
    
    share_id = c.lastrowid
    conn.commit()
    
    # Создаем URL для шаринга
    share_url = request.host_url + f'shared/{token}'
    
    conn.close()
    return jsonify({
        'id': share_id,
        'token': token,
        'url': share_url,
        'expiry_date': expiry_date
    })

@app.route('/shared/<token>')
def view_shared_file(token):
    """Открытый доступ к файлу по ссылке без аутентификации"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем токен и актуальность ссылки
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute('''
    SELECT share_links.*, files.filename, files.original_filename, files.category 
    FROM share_links 
    JOIN files ON share_links.file_id = files.id 
    WHERE token = ? AND is_active = 1 AND expiry_date > ?
    ''', (token, current_date))
    
    result = c.fetchone()
    conn.close()
    
    if not result:
        return "Ссылка недействительна или срок её действия истёк", 404
    
    # Если файл существует, отправляем его для скачивания
    share_link = {
        'id': result[0],
        'file_id': result[1], 
        'token': result[2],
        'created': result[3],
        'expires': result[4],
        'is_active': result[5],
        'filename': result[6],
        'original_filename': result[7],
        'category': result[8]
    }
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], share_link['category'], share_link['filename'])
    if os.path.exists(file_path):
        return send_file(file_path, download_name=share_link['original_filename'], as_attachment=True)
    
    return "Файл не найден", 404

@app.route('/my_share_links')
@login_required
def get_my_share_links():
    """Получение списка созданных пользователем ссылок"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
    SELECT share_links.*, files.original_filename, files.category 
    FROM share_links 
    JOIN files ON share_links.file_id = files.id 
    JOIN users ON files.user_id = users.id 
    WHERE users.id = ? 
    ORDER BY share_links.created_date DESC
    ''', (current_user.id,))
    
    results = c.fetchall()
    conn.close()
    
    share_links = []
    for result in results:
        share_links.append({
            'id': result[0],
            'file_id': result[1],
            'token': result[2],
            'created_date': result[3],
            'expiry_date': result[4],
            'is_active': result[5],
            'original_filename': result[6],
            'category': result[7],
            'url': request.host_url + f'shared/{result[2]}'
        })
    
    return jsonify(share_links)

@app.route('/delete_share_link/<int:link_id>', methods=['DELETE'])
@login_required
def delete_share_link(link_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Проверяем, что ссылка принадлежит файлу пользователя
        cursor.execute("""
        SELECT s.id, s.file_id 
        FROM share_links s
        JOIN files f ON s.file_id = f.id
        WHERE s.id = ? AND f.user_id = ?
        """, (link_id, current_user.id))
        
        share_link = cursor.fetchone()
        
        if not share_link:
            conn.close()
            return jsonify({
                'status': 'error',
                'message': 'Ссылка не найдена или у вас нет прав доступа'
            }), 404
        
        # Удаляем ссылку
        cursor.execute("DELETE FROM share_links WHERE id = ?", (link_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Ссылка успешно удалена'
        })
        
    except Exception as e:
        conn.close()
        return jsonify({
            'status': 'error',
            'message': f'Произошла ошибка: {str(e)}'
        }), 500

@app.route('/delete_file_link/<int:link_id>', methods=['DELETE'])
@login_required
def delete_file_link(link_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Проверяем, что ссылка принадлежит пользователю
        cursor.execute("""
        SELECT s.id, s.file_id, f.user_id
        FROM share_links s
        JOIN files f ON s.file_id = f.id
        WHERE s.id = ? AND f.user_id = ?
        """, (link_id, current_user.id))
        
        share_link = cursor.fetchone()
        
        if not share_link:
            conn.close()
            return jsonify({
                'status': 'error',
                'message': 'Ссылка не найдена или у вас нет прав доступа'
            }), 404
        
        # Удаляем только ссылку, сам файл остается
        cursor.execute("DELETE FROM share_links WHERE id = ?", (link_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Ссылка на файл успешно удалена'
        })
        
    except Exception as e:
        conn.close()
        return jsonify({
            'status': 'error',
            'message': f'Произошла ошибка: {str(e)}'
        }), 500

# Словарь для хранения активных торрент-загрузок
active_torrent_downloads = {}

@app.route('/download_torrent_on_server', methods=['POST'])
@login_required
def download_torrent_on_server():
    data = request.json
    category = data.get('category')
    filename = data.get('filename')
    file_id = data.get('file_id')
    
    # Проверяем наличие всех необходимых параметров
    if not category or not filename or not file_id:
        return jsonify({'error': 'Не указаны все необходимые параметры'})
    
    # Проверяем, принадлежит ли файл текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", (file_id, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'Файл не найден или у вас нет доступа к нему'})
    
    # Проверяем существование файла на диске
    torrent_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    if not os.path.exists(torrent_path):
        return jsonify({'error': 'Торрент-файл не найден на сервере'})
    
    # Генерируем уникальный ID для загрузки
    download_id = str(uuid.uuid4())
    
    # Создаем директорию для загрузки
    download_dir = os.path.join(app.config['DOWNLOAD_FOLDER'], 'torrents', download_id)
    os.makedirs(download_dir, exist_ok=True)
    
    # Запускаем загрузку в отдельном потоке
    try:
        thread = threading.Thread(target=start_torrent_download, args=(download_id, torrent_path, download_dir, file_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'download_id': download_id})
    except Exception as e:
        return jsonify({'error': f'Ошибка при запуске загрузки: {str(e)}'})

def start_torrent_download(download_id, torrent_path, download_dir, file_id):
    try:
        # Создаем объект для загрузки
        torrent_download = {
            'id': download_id,
            'torrent_path': torrent_path,
            'download_dir': download_dir,
            'file_id': file_id,
            'start_time': time.time(),
            'status': 'downloading',
            'progress': 0,
            'download_speed': 0,
            'eta': '--:--:--',
            'downloaded': '0 MB',
            'total_size': '0 MB',
            'downloader': None,
            'downloader_instance': None,
            'paused': False,
            'target_category': None,
            'target_filename': None
        }
        
        # Сохраняем информацию о загрузке
        active_torrent_downloads[download_id] = torrent_download
        
        # Запускаем загрузку в асинхронном режиме
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Инициализируем загрузчик
        downloader = TorrentDownloader(torrent_path, download_dir)
        torrent_download['downloader'] = downloader
        
        # Создаем функцию для обновления прогресса
        async def update_progress():
            try:
                # Небольшая задержка, чтобы дать время торренту инициализироваться
                await asyncio.sleep(2)
                
                # Получаем статус загрузки
                try:
                    # Пытаемся вызвать метод status доступный через downloader._file
                    if hasattr(downloader, '_file') and downloader._file is not None and hasattr(downloader._file, 'status'):
                        try:
                            status = downloader._file.status()
                            torrent_download['downloader_instance'] = downloader._file
                            
                            while torrent_download['status'] == 'downloading':
                                await asyncio.sleep(1)
                                
                                if not torrent_download['paused']:
                                    try:
                                        # Проверяем, что объект _file все еще существует
                                        if not hasattr(downloader, '_file') or downloader._file is None:
                                            print("Объект downloader._file стал недоступен")
                                            torrent_download['status'] = 'error'
                                            torrent_download['error'] = "Объект загрузчика недоступен"
                                            break
                                        
                                        # Проверяем, что метод status все еще доступен
                                        if not hasattr(downloader._file, 'status'):
                                            print("Метод status стал недоступен")
                                            torrent_download['status'] = 'error'
                                            torrent_download['error'] = "Метод status недоступен в объекте загрузчика"
                                            break
                                        
                                        # Обновляем статус
                                        try:
                                            status = downloader._file.status()
                                        except AttributeError as ae:
                                            print(f"AttributeError при вызове status: {str(ae)}")
                                            if "has no attribute 'id'" in str(ae):
                                                torrent_download['status'] = 'error'
                                                torrent_download['error'] = "Ошибка доступа к атрибуту id: объект загрузчика был изменен"
                                            else:
                                                torrent_download['status'] = 'error'
                                                torrent_download['error'] = str(ae)
                                            break
                                        
                                        if status:
                                            # Получаем прогресс в процентах
                                            progress = status.progress * 100
                                            download_speed = status.download_rate / 1024  # Конвертируем в KB/s
                                            
                                            # Рассчитываем оставшееся время
                                            if download_speed > 0:
                                                total_bytes = status.total_wanted
                                                downloaded_bytes = total_bytes * status.progress
                                                remaining_bytes = total_bytes - downloaded_bytes
                                                remaining_seconds = remaining_bytes / (download_speed * 1024)
                                                
                                                # Форматируем оставшееся время в ЧЧ:ММ:СС
                                                hours, remainder = divmod(int(remaining_seconds), 3600)
                                                minutes, seconds = divmod(remainder, 60)
                                                eta = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                                            else:
                                                eta = '--:--:--'
                                            
                                            # Форматируем размеры
                                            downloaded = format_size(status.total_wanted * status.progress)
                                            total_size = format_size(status.total_wanted)
                                            
                                            # Обновляем информацию о загрузке
                                            torrent_download['progress'] = round(progress, 1)
                                            torrent_download['download_speed'] = round(download_speed, 1)
                                            torrent_download['eta'] = eta
                                            torrent_download['downloaded'] = downloaded
                                            torrent_download['total_size'] = total_size
                                            
                                            # Если загрузка завершена
                                            if progress >= 100:
                                                # Определяем тип скачанного файла и перемещаем его в соответствующую категорию
                                                move_downloaded_files(download_id, download_dir)
                                                torrent_download['status'] = 'completed'
                                                break
                                    except Exception as e:
                                        print(f"Ошибка обновления статуса: {str(e)}")
                        except Exception as e:
                            print(f"Ошибка при инициализации статуса: {str(e)}")
                            torrent_download['status'] = 'error'
                            torrent_download['error'] = str(e)
                    else:
                        print("Объект загрузчика не инициализирован или не имеет нужных методов")
                        torrent_download['status'] = 'error'
                        torrent_download['error'] = "Объект загрузчика не инициализирован или не имеет нужных методов"
                            
                except Exception as e:
                    print(f"Ошибка при получении статуса: {str(e)}")
                    torrent_download['status'] = 'error'
                    torrent_download['error'] = str(e)
            except Exception as e:
                print(f"Ошибка в update_progress: {str(e)}")
                torrent_download['status'] = 'error'
                torrent_download['error'] = str(e)
        
        # Запускаем задачи
        async def run_tasks():
            try:
                # Запускаем загрузку и обновление прогресса параллельно
                download_task = asyncio.create_task(downloader.start_download(download_speed=0, upload_speed=0))
                progress_task = asyncio.create_task(update_progress())
                
                # Ждем завершения обеих задач
                await asyncio.gather(download_task, progress_task)
            except Exception as e:
                print(f"Ошибка в run_tasks: {str(e)}")
                torrent_download['status'] = 'error'
                torrent_download['error'] = str(e)
        
        # Запускаем цикл событий
        loop.run_until_complete(run_tasks())
        loop.close()
        
    except Exception as e:
        print(f"Ошибка загрузки торрента: {str(e)}")
        torrent_download = active_torrent_downloads.get(download_id)
        if torrent_download:
            torrent_download['status'] = 'error'
            torrent_download['error'] = str(e)

def format_size(size_bytes):
    """Форматирует размер в байтах в человекочитаемый формат"""
    if size_bytes == 0:
        return "0 B"
    size_names = ("B", "KB", "MB", "GB", "TB")
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024
        i += 1
    return f"{size_bytes:.2f} {size_names[i]}"

def move_downloaded_files(download_id, download_dir):
    """Перемещает скачанные файлы в соответствующие категории"""
    torrent_download = active_torrent_downloads.get(download_id)
    if not torrent_download:
        return
    
    try:
        # Получаем список всех скачанных файлов
        downloaded_files = []
        for root, dirs, files in os.walk(download_dir):
            for file in files:
                file_path = os.path.join(root, file)
                downloaded_files.append(file_path)
        
        # Если файлов нет, выходим
        if not downloaded_files:
            return
        
        # Перемещаем каждый файл в соответствующую категорию
        for file_path in downloaded_files:
            file_name = os.path.basename(file_path)
            category = get_category(file_name)
            
            # Создаем новое имя файла с временной меткой
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            new_filename = f"{timestamp}_{file_name}"
            
            # Путь назначения
            dest_path = os.path.join(app.config['UPLOAD_FOLDER'], category, new_filename)
            
            # Перемещаем файл
            os.rename(file_path, dest_path)
            
            # Сохраняем информацию о файле в БД
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Получаем ID пользователя из оригинального торрент-файла
            c.execute("SELECT user_id FROM files WHERE id = ?", (torrent_download['file_id'],))
            user_record = c.fetchone()
            
            # Проверяем, был ли найден файл
            if user_record is None:
                print(f"Не найден файл с ID {torrent_download['file_id']} в базе данных")
                conn.close()
                continue
                
            user_id = user_record[0]
            
            # Добавляем запись о новом файле
            c.execute("""
            INSERT INTO files (filename, original_filename, category, upload_date, size, user_id) 
            VALUES (?, ?, ?, ?, ?, ?)
            """, (new_filename, file_name, category, datetime.now().isoformat(), 
                  os.path.getsize(dest_path), user_id))
            
            conn.commit()
            conn.close()
            
            # Сохраняем информацию о перемещенном файле
            if torrent_download['target_category'] is None:
                torrent_download['target_category'] = category
                torrent_download['target_filename'] = new_filename
    
    except Exception as e:
        print(f"Ошибка при перемещении файлов: {str(e)}")
        torrent_download['status'] = 'error'
        torrent_download['error'] = str(e)

@app.route('/torrent_download_progress/<download_id>')
@login_required
def torrent_download_progress(download_id):
    def generate():
        torrent_download = active_torrent_downloads.get(download_id)
        if not torrent_download:
            yield f"data: {json.dumps({'status': 'error', 'error': 'Загрузка не найдена'})}\n\n"
            return
        
        try:
            # Проверяем, принадлежит ли загрузка текущему пользователю
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT user_id FROM files WHERE id = ?", (torrent_download['file_id'],))
            file = c.fetchone()
            conn.close()
            
            # Проверяем, был ли найден файл и принадлежит ли он текущему пользователю
            if not file:
                yield f"data: {json.dumps({'status': 'error', 'error': 'Файл не найден в базе данных'})}\n\n"
                return
            
            if file[0] != current_user.id:
                yield f"data: {json.dumps({'status': 'error', 'error': 'У вас нет доступа к этой загрузке'})}\n\n"
                return
            
            last_progress = -1
            
            while True:
                # Если статус изменился на completed или error, отправляем последнее сообщение и завершаем
                if torrent_download['status'] in ['completed', 'error']:
                    # Если это ошибка с NoneType, заменяем её на общее сообщение об ошибке
                    error_message = torrent_download.get('error', '')
                    if "has no attribute 'id'" in error_message:
                        error_message = "Ошибка при загрузке торрента"
                    
                    yield f"data: {json.dumps({
                        'status': torrent_download['status'],
                        'progress': torrent_download['progress'],
                        'download_speed': torrent_download['download_speed'],
                        'eta': torrent_download['eta'],
                        'downloaded': torrent_download['downloaded'],
                        'total_size': torrent_download['total_size'],
                        'target_category': torrent_download['target_category'],
                        'error': error_message
                    })}\n\n"
                    break
                
                # Если прогресс изменился, отправляем обновление
                if torrent_download['progress'] != last_progress:
                    last_progress = torrent_download['progress']
                    yield f"data: {json.dumps({
                        'status': torrent_download['status'],
                        'progress': torrent_download['progress'],
                        'download_speed': torrent_download['download_speed'],
                        'eta': torrent_download['eta'],
                        'downloaded': torrent_download['downloaded'],
                        'total_size': torrent_download['total_size']
                    })}\n\n"
                
                time.sleep(1)
        
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/stop_torrent_download', methods=['POST'])
@login_required
def stop_torrent_download():
    data = request.json
    file_id = data.get('file_id')
    
    if file_id is None:
        return jsonify({'error': 'Не указан ID файла'})
    
    # Находим загрузку по file_id
    download_id = None
    for d_id, download in active_torrent_downloads.items():
        if download['file_id'] == file_id:
            download_id = d_id
            break
    
    if not download_id:
        return jsonify({'error': 'Загрузка не найдена'})
    
    # Проверяем, принадлежит ли загрузка текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT user_id FROM files WHERE id = ?", (file_id,))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'Файл не найден в базе данных'})
    
    if file[0] != current_user.id:
        return jsonify({'error': 'У вас нет доступа к этой загрузке'})
    
    # Останавливаем загрузку
    torrent_download = active_torrent_downloads.get(download_id)
    if torrent_download and torrent_download.get('downloader'):
        try:
            torrent_download['downloader'].stop_download()
            torrent_download['status'] = 'stopped'
            
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)})
    
    return jsonify({'error': 'Невозможно остановить загрузку'})

@app.route('/pause_torrent_download', methods=['POST'])
@login_required
def pause_torrent_download():
    data = request.json
    file_id = data.get('file_id')
    
    if file_id is None:
        return jsonify({'error': 'Не указан ID файла'})
    
    # Находим загрузку по file_id
    download_id = None
    for d_id, download in active_torrent_downloads.items():
        if download['file_id'] == file_id:
            download_id = d_id
            break
    
    if not download_id:
        return jsonify({'error': 'Загрузка не найдена'})
    
    # Проверяем, принадлежит ли загрузка текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT user_id FROM files WHERE id = ?", (file_id,))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'Файл не найден в базе данных'})
    
    if file[0] != current_user.id:
        return jsonify({'error': 'У вас нет доступа к этой загрузке'})
    
    # Приостанавливаем загрузку
    torrent_download = active_torrent_downloads.get(download_id)
    if torrent_download and torrent_download.get('downloader'):
        try:
            torrent_download['downloader'].pause_download()
            torrent_download['paused'] = True
            
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)})
    
    return jsonify({'error': 'Невозможно приостановить загрузку'})

@app.route('/resume_torrent_download', methods=['POST'])
@login_required
def resume_torrent_download():
    data = request.json
    file_id = data.get('file_id')
    
    if file_id is None:
        return jsonify({'error': 'Не указан ID файла'})
    
    # Находим загрузку по file_id
    download_id = None
    for d_id, download in active_torrent_downloads.items():
        if download['file_id'] == file_id:
            download_id = d_id
            break
    
    if not download_id:
        return jsonify({'error': 'Загрузка не найдена'})
    
    # Проверяем, принадлежит ли загрузка текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT user_id FROM files WHERE id = ?", (file_id,))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'Файл не найден в базе данных'})
    
    if file[0] != current_user.id:
        return jsonify({'error': 'У вас нет доступа к этой загрузке'})
    
    # Возобновляем загрузку
    torrent_download = active_torrent_downloads.get(download_id)
    if torrent_download and torrent_download.get('downloader'):
        try:
            torrent_download['downloader'].resume_download()
            torrent_download['paused'] = False
            
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)})
    
    return jsonify({'error': 'Невозможно возобновить загрузку'})

@app.route('/media_player/<category>/<filename>')
@login_required
def media_player(category, filename):
    # Проверяем, принадлежит ли файл текущему пользователю
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE filename = ? AND category = ? AND user_id = ?", 
             (filename, category, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({"error": "Файл не найден или у вас нет доступа к нему"}), 404
    
    # Получаем тип файла
    mime_type, _ = mimetypes.guess_type(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    
    if category == 'videos' or (mime_type and mime_type.startswith('video/')):
        # Для видео-файлов создаем HTML с видеоплеером
        return jsonify({
            "type": "video",
            "title": file[2],  # original_filename
            "url": f"/download/{category}/{filename}",
            "mime_type": mime_type
        })
    elif category == 'audio' or (mime_type and mime_type.startswith('audio/')):
        # Для аудио-файлов создаем HTML с аудиоплеером
        return jsonify({
            "type": "audio",
            "title": file[2],  # original_filename
            "url": f"/download/{category}/{filename}",
            "mime_type": mime_type
        })
    else:
        return jsonify({"error": "Этот тип файла не поддерживается медиаплеером"}), 415

# API эндпоинты для аутентификации
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Необходимо указать имя пользователя и пароль'}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    if c.fetchone():
        conn.close()
        return jsonify({'message': 'Пользователь уже существует'}), 409
    
    hashed_password = generate_password_hash(password)
    c.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
             (username, hashed_password))
    conn.commit()
    
    c.execute("SELECT id FROM users WHERE username = ?", (username,))
    user_id = c.fetchone()[0]
    conn.close()
    
    return jsonify({
        'message': 'Пользователь успешно зарегистрирован',
        'user_id': user_id,
        'username': username
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Необходимо указать имя пользователя и пароль'}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[2], password):
        token = create_token(user[0])
        return jsonify({
            'message': 'Авторизация успешна',
            'token': token,
            'user_id': user[0],
            'username': user[1]
        })
    
    return jsonify({'message': 'Неверное имя пользователя или пароль'}), 401

@app.route('/api/users/me', methods=['GET'])
@token_required
def api_get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'username': current_user.username
    })

# API эндпоинты для работы с файлами
@app.route('/api/files', methods=['GET'])
@token_required
def api_list_files(current_user):
    category = request.args.get('category', 'all')
    sort_by = request.args.get('sort', 'date')
    order = request.args.get('order', 'desc')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    query = "SELECT * FROM files WHERE user_id = ?"
    params = [current_user.id]
    
    if category != 'all':
        query += " AND category = ?"
        params.append(category)
    
    # Добавляем сортировку
    if sort_by == 'date':
        query += " ORDER BY upload_date"
    elif sort_by == 'name':
        query += " ORDER BY original_filename"
    elif sort_by == 'size':
        query += " ORDER BY size"
    
    if order == 'desc':
        query += " DESC"
    else:
        query += " ASC"
    
    c.execute(query, params)
    files = c.fetchall()
    conn.close()
    
    file_list = []
    for file in files:
        file_item = {
            'id': file[0],
            'filename': file[1],
            'original_filename': file[2],
            'category': file[3],
            'upload_date': file[4],
            'size': file[5],
            'size_formatted': format_size(file[5]),
            'torrent_category': file[7] if len(file) > 7 and file[7] else None
        }
        file_list.append(file_item)
    
    return jsonify({'files': file_list})

@app.route('/api/files/<int:file_id>', methods=['GET'])
@token_required
def api_get_file(current_user, file_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", (file_id, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'message': 'Файл не найден или у вас нет доступа'}), 404
    
    file_info = {
        'id': file[0],
        'filename': file[1],
        'original_filename': file[2],
        'category': file[3],
        'upload_date': file[4],
        'size': file[5],
        'size_formatted': format_size(file[5]),
        'torrent_category': file[7] if len(file) > 7 and file[7] else None
    }
    
    return jsonify(file_info)

@app.route('/api/files/upload', methods=['POST'])
@token_required
def api_upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'Файл не выбран'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Файл не выбран'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        category = get_category(filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        new_filename = f"{timestamp}_{filename}"
        
        # Проверяем, есть ли путь для сохранения структуры папок
        path = request.form.get('path', '')
        
        # Получаем категорию торрента, если файл является торрентом
        torrent_category = None
        if category == 'torrents':
            torrent_category = request.form.get('torrent_category', 'other')
        
        if path:
            # Создаем подпапку с учетом пути
            folder_path = os.path.join(app.config['UPLOAD_FOLDER'], category, path)
            os.makedirs(folder_path, exist_ok=True)
            file_path = os.path.join(folder_path, new_filename)
        else:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, new_filename)
        
        file.save(file_path)
        
        # Сохраняем информацию о файле в БД
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        if category == 'torrents':
            c.execute("""
            INSERT INTO files (filename, original_filename, category, upload_date, size, user_id, torrent_category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (new_filename if not path else os.path.join(path, new_filename), 
                filename, category, datetime.now().isoformat(), 
                os.path.getsize(file_path), current_user.id, torrent_category))
        else:
            c.execute("""
            INSERT INTO files (filename, original_filename, category, upload_date, size, user_id) 
            VALUES (?, ?, ?, ?, ?, ?)
            """, (new_filename if not path else os.path.join(path, new_filename), 
                filename, category, datetime.now().isoformat(), 
                os.path.getsize(file_path), current_user.id))
        
        file_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Файл успешно загружен',
            'file_id': file_id,
            'filename': new_filename,
            'original_filename': filename,
            'category': category,
            'torrent_category': torrent_category if category == 'torrents' else None,
            'upload_date': datetime.now().isoformat(),
            'size': os.path.getsize(file_path),
            'size_formatted': format_size(os.path.getsize(file_path))
        }), 201
    
    return jsonify({'message': 'Недопустимый формат файла'}), 400

@app.route('/api/files/<int:file_id>/download', methods=['GET'])
@token_required
def api_download_file(current_user, file_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", (file_id, current_user.id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'message': 'Файл не найден или у вас нет доступа'}), 404
    
    filename = file[1]
    category = file[3]
    original_filename = file[2]
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    
    if not os.path.exists(file_path):
        return jsonify({'message': 'Файл не найден на сервере'}), 404
    
    return send_file(file_path, as_attachment=True, download_name=original_filename)

@app.route('/api/files/<int:file_id>', methods=['DELETE'])
@token_required
def api_delete_file(current_user, file_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM files WHERE id = ? AND user_id = ?", (file_id, current_user.id))
    file = c.fetchone()
    
    if not file:
        conn.close()
        return jsonify({'message': 'Файл не найден или у вас нет доступа'}), 404
    
    filename = file[1]
    category = file[3]
    
    # Удаляем файл
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], category, filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        return jsonify({'message': f'Ошибка при удалении файла: {str(e)}'}), 500
    
    # Удаляем запись из БД
    c.execute("DELETE FROM files WHERE id = ?", (file_id,))
    
    # Удаляем связанные ссылки на шаринг
    c.execute("DELETE FROM share_links WHERE file_id = ?", (file_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Файл успешно удален'})

# API эндпоинты для работы с заметками
@app.route('/api/notes', methods=['GET'])
@token_required
def api_get_notes(current_user):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notes WHERE user_id = ? ORDER BY priority DESC, update_date DESC", (current_user.id,))
    notes = c.fetchall()
    conn.close()
    
    notes_list = []
    for note in notes:
        notes_list.append({
            'id': note[0],
            'title': note[1],
            'content': note[2],
            'create_date': note[3],
            'update_date': note[4],
            'priority': note[5]
        })
    
    return jsonify({'notes': notes_list})

@app.route('/api/notes/<int:note_id>', methods=['GET'])
@token_required
def api_get_note(current_user, note_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, current_user.id))
    note = c.fetchone()
    conn.close()
    
    if not note:
        return jsonify({'message': 'Заметка не найдена или у вас нет доступа'}), 404
    
    note_info = {
        'id': note[0],
        'title': note[1],
        'content': note[2],
        'create_date': note[3],
        'update_date': note[4],
        'priority': note[5]
    }
    
    return jsonify(note_info)

@app.route('/api/notes', methods=['POST'])
@token_required
def api_add_note(current_user):
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Необходимо указать заголовок и содержание'}), 400
    
    title = data.get('title')
    content = data.get('content')
    priority = data.get('priority', 0)
    now = datetime.now().isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    INSERT INTO notes (title, content, create_date, update_date, priority, user_id) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, (title, content, now, now, priority, current_user.id))
    
    note_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Заметка успешно создана',
        'note_id': note_id,
        'title': title,
        'content': content,
        'create_date': now,
        'update_date': now,
        'priority': priority
    }), 201

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
@token_required
def api_update_note(current_user, note_id):
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'Данные не предоставлены'}), 400
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, current_user.id))
    note = c.fetchone()
    
    if not note:
        conn.close()
        return jsonify({'message': 'Заметка не найдена или у вас нет доступа'}), 404
    
    title = data.get('title', note[1])
    content = data.get('content', note[2])
    priority = data.get('priority', note[5])
    update_date = datetime.now().isoformat()
    
    c.execute("""
    UPDATE notes SET title = ?, content = ?, update_date = ?, priority = ?
    WHERE id = ?
    """, (title, content, update_date, priority, note_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Заметка успешно обновлена',
        'note_id': note_id,
        'title': title,
        'content': content,
        'update_date': update_date,
        'priority': priority
    })

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@token_required
def api_delete_note(current_user, note_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, current_user.id))
    note = c.fetchone()
    
    if not note:
        conn.close()
        return jsonify({'message': 'Заметка не найдена или у вас нет доступа'}), 404
    
    c.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Заметка успешно удалена'})

# API эндпоинты для работы с ссылками
@app.route('/api/links', methods=['GET'])
@token_required
def api_get_links(current_user):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM links WHERE user_id = ? ORDER BY add_date DESC", (current_user.id,))
    links = c.fetchall()
    conn.close()
    
    links_list = []
    for link in links:
        links_list.append({
            'id': link[0],
            'title': link[1],
            'url': link[2],
            'description': link[3],
            'category': link[4],
            'add_date': link[5]
        })
    
    return jsonify({'links': links_list})

@app.route('/api/links', methods=['POST'])
@token_required
def api_add_link(current_user):
    data = request.get_json()
    
    if not data or not data.get('url') or not data.get('title'):
        return jsonify({'message': 'Необходимо указать URL и название'}), 400
    
    title = data.get('title')
    url = data.get('url')
    description = data.get('description', '')
    category = data.get('category', 'links')
    add_date = datetime.now().isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    INSERT INTO links (title, url, description, category, add_date, user_id) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, (title, url, description, category, add_date, current_user.id))
    
    link_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Ссылка успешно добавлена',
        'link_id': link_id,
        'title': title,
        'url': url,
        'description': description,
        'category': category,
        'add_date': add_date
    }), 201

@app.route('/api/links/<int:link_id>', methods=['DELETE'])
@token_required
def api_delete_link(current_user, link_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM links WHERE id = ? AND user_id = ?", (link_id, current_user.id))
    link = c.fetchone()
    
    if not link:
        conn.close()
        return jsonify({'message': 'Ссылка не найдена или у вас нет доступа'}), 404
    
    c.execute("DELETE FROM links WHERE id = ?", (link_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Ссылка успешно удалена'})

# API для фильмов и статистики
@app.route('/api/movies', methods=['GET'])
@token_required
def api_get_movies(current_user):
    sort_by = request.args.get('sort', 'add_date')
    order = request.args.get('order', 'desc')
    filter_watched = request.args.get('watched')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    query = "SELECT * FROM movies WHERE user_id = ?"
    params = [current_user.id]
    
    if filter_watched is not None:
        query += " AND watched = ?"
        params.append(1 if filter_watched.lower() == 'true' else 0)
    
    if sort_by == 'title':
        query += " ORDER BY title"
    elif sort_by == 'year':
        query += " ORDER BY year"
    elif sort_by == 'rating':
        query += " ORDER BY rating"
    elif sort_by == 'watch_date':
        query += " ORDER BY watch_date"
    else:  # По умолчанию сортируем по дате добавления
        query += " ORDER BY add_date"
    
    if order == 'desc':
        query += " DESC"
    else:
        query += " ASC"
    
    c.execute(query, params)
    movies = c.fetchall()
    conn.close()
    
    movies_list = []
    for movie in movies:
        # Преобразуем жанры из JSON строки в список
        genres = json.loads(movie[7]) if movie[7] else []
        
        movies_list.append({
            'id': movie[0],
            'title': movie[1],
            'original_title': movie[2],
            'kinopoisk_id': movie[3],
            'poster_url': movie[4],
            'year': movie[5],
            'rating': movie[6],
            'genres': genres,
            'description': movie[8],
            'add_date': movie[9],
            'watched': bool(movie[10]),
            'watch_date': movie[11]
        })
    
    return jsonify({'movies': movies_list})

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
@token_required
def api_get_movie(current_user, movie_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM movies WHERE id = ? AND user_id = ?", (movie_id, current_user.id))
    movie = c.fetchone()
    conn.close()
    
    if not movie:
        return jsonify({'message': 'Фильм не найден или у вас нет доступа'}), 404
    
    # Преобразуем жанры из JSON строки в список
    genres = json.loads(movie[7]) if movie[7] else []
    
    movie_info = {
        'id': movie[0],
        'title': movie[1],
        'original_title': movie[2],
        'kinopoisk_id': movie[3],
        'poster_url': movie[4],
        'year': movie[5],
        'rating': movie[6],
        'genres': genres,
        'description': movie[8],
        'add_date': movie[9],
        'watched': bool(movie[10]),
        'watch_date': movie[11]
    }
    
    return jsonify(movie_info)

@app.route('/api/movies', methods=['POST'])
@token_required
def api_add_movie(current_user):
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'message': 'Необходимо указать название фильма'}), 400
    
    title = data.get('title')
    original_title = data.get('original_title', '')
    kinopoisk_id = data.get('kinopoisk_id', '')
    poster_url = data.get('poster_url', '')
    year = data.get('year', 0)
    rating = data.get('rating', 0.0)
    genres = json.dumps(data.get('genres', []))
    description = data.get('description', '')
    add_date = datetime.now().isoformat()
    watched = data.get('watched', False)
    watch_date = data.get('watch_date', None)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем, существует ли фильм с таким kinopoisk_id у пользователя
    if kinopoisk_id:
        c.execute("SELECT id FROM movies WHERE kinopoisk_id = ? AND user_id = ?", 
                 (kinopoisk_id, current_user.id))
        existing_movie = c.fetchone()
        if existing_movie:
            conn.close()
            return jsonify({'message': 'Фильм уже добавлен в вашу коллекцию',
                           'movie_id': existing_movie[0]}), 409
    
    c.execute("""
    INSERT INTO movies (title, original_title, kinopoisk_id, poster_url, year,
                        rating, genres, description, add_date, watched, watch_date, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, original_title, kinopoisk_id, poster_url, year, rating, genres, 
         description, add_date, 1 if watched else 0, watch_date, current_user.id))
    
    movie_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Фильм успешно добавлен',
        'movie_id': movie_id,
        'title': title,
        'add_date': add_date
    }), 201

@app.route('/api/movies/<int:movie_id>/toggle_watched', methods=['POST'])
@token_required
def api_toggle_watched(current_user, movie_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT watched FROM movies WHERE id = ? AND user_id = ?", (movie_id, current_user.id))
    movie = c.fetchone()
    
    if not movie:
        conn.close()
        return jsonify({'message': 'Фильм не найден или у вас нет доступа'}), 404
    
    current_status = bool(movie[0])
    new_status = not current_status
    watch_date = datetime.now().isoformat() if new_status else None
    
    c.execute("""
    UPDATE movies SET watched = ?, watch_date = ?
    WHERE id = ?
    """, (1 if new_status else 0, watch_date, movie_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': f'Статус просмотра изменен на {"просмотрено" if new_status else "не просмотрено"}',
        'movie_id': movie_id,
        'watched': new_status,
        'watch_date': watch_date
    })

@app.route('/api/movies/<int:movie_id>', methods=['DELETE'])
@token_required
def api_delete_movie(current_user, movie_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM movies WHERE id = ? AND user_id = ?", (movie_id, current_user.id))
    movie = c.fetchone()
    
    if not movie:
        conn.close()
        return jsonify({'message': 'Фильм не найден или у вас нет доступа'}), 404
    
    c.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Фильм успешно удален'})

@app.route('/api/stats', methods=['GET'])
@token_required
def api_get_stats(current_user):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Статистика по файлам
    c.execute("SELECT COUNT(*) FROM files WHERE user_id = ?", (current_user.id,))
    total_files = c.fetchone()[0]
    
    c.execute("SELECT SUM(size) FROM files WHERE user_id = ?", (current_user.id,))
    total_size = c.fetchone()[0] or 0
    
    c.execute("SELECT category, COUNT(*) FROM files WHERE user_id = ? GROUP BY category", (current_user.id,))
    files_by_category = c.fetchall()
    
    # Статистика по заметкам
    c.execute("SELECT COUNT(*) FROM notes WHERE user_id = ?", (current_user.id,))
    total_notes = c.fetchone()[0]
    
    # Статистика по ссылкам
    c.execute("SELECT COUNT(*) FROM links WHERE user_id = ?", (current_user.id,))
    total_links = c.fetchone()[0]
    
    # Статистика по фильмам
    c.execute("SELECT COUNT(*) FROM movies WHERE user_id = ?", (current_user.id,))
    total_movies = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM movies WHERE user_id = ? AND watched = 1", (current_user.id,))
    watched_movies = c.fetchone()[0]
    
    conn.close()
    
    # Собираем категории файлов
    categories = {}
    for category, count in files_by_category:
        categories[category] = count
    
    return jsonify({
        'files': {
            'total': total_files,
            'total_size': total_size,
            'total_size_formatted': format_size(total_size),
            'categories': categories
        },
        'notes': {
            'total': total_notes
        },
        'links': {
            'total': total_links
        },
        'movies': {
            'total': total_movies,
            'watched': watched_movies,
            'unwatched': total_movies - watched_movies
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
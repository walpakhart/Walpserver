# WalpServer

Медиа-сервер с веб-интерфейсом для управления файлами, загрузки торрентов и воспроизведения медиа.

## Возможности

- Управление файлами через веб-интерфейс
- Загрузка и управление торрентами
- Воспроизведение медиа-файлов
- Мониторинг системы
- Красивый и удобный интерфейс

## Установка

### Установка из .deb пакета

1. Скачайте последнюю версию .deb пакета
2. Установите пакет:
```bash
sudo dpkg -i walpserver_1.0.0_all.deb
```
3. Если возникнут ошибки зависимостей:
```bash
sudo apt-get install -f
```

### Установка вручную

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/walpserver.git
cd walpserver
```

2. Создайте виртуальное окружение:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Запустите сервер:
```bash
python server_manager.py
```

## Сборка .deb пакета

### Подготовка

1. Установите необходимые инструменты:
```bash
sudo apt-get install debhelper dh-python python3-all python3-setuptools
```

2. Создайте структуру debian/:
```bash
mkdir -p debian/source
```

3. Создайте необходимые файлы:

debian/control:
```
Source: walpserver
Section: web
Priority: optional
Maintainer: Your Name <your.email@example.com>
Build-Depends: debhelper-compat (= 13), python3, python3-setuptools, python3-all, dh-python

Package: walpserver
Architecture: all
Depends: ${python3:Depends}, ${misc:Depends}, python3, python3-venv, python3-pip, libxml2-dev, libxslt-dev, python3-dev
Description: WalpServer - Media Server with Web Interface
 A powerful media server with web interface for managing files,
 torrent downloads, and media playback.
 .
 Features include:
  * File management through web interface
  * Torrent downloads and management
  * Media playback
  * System monitoring
  * Beautiful and user-friendly interface
```

debian/rules:
```makefile
#!/usr/bin/make -f

%:
	dh $@ --with python3

override_dh_auto_install:
	dh_auto_install
	mkdir -p debian/walpserver/usr/share/walpserver
	cp -r *.py requirements.txt static templates debian/walpserver/usr/share/walpserver/

override_dh_installsystemd:
	dh_installsystemd --name=walpserver
```

debian/changelog:
```
walpserver (1.0.0) unstable; urgency=medium

  * Initial release.

 -- Your Name <your.email@example.com>  Wed, 20 Mar 2024 12:00:00 +0000
```

debian/walpserver.service:
```ini
[Unit]
Description=WalpServer Media Server
After=network.target

[Service]
Type=simple
User=walpserver
Group=walpserver
WorkingDirectory=/usr/share/walpserver
ExecStart=/usr/share/walpserver/venv/bin/python server_manager.py
Restart=always

[Install]
WantedBy=multi-user.target
```

debian/postinst:
```bash
#!/bin/sh
set -e

case "$1" in
    configure)
        # Create walpserver user and group if they don't exist
        if ! getent group walpserver >/dev/null; then
            addgroup --system walpserver
        fi
        if ! getent passwd walpserver >/dev/null; then
            adduser --system --ingroup walpserver --home /usr/share/walpserver walpserver
        fi

        # Create virtual environment
        python3 -m venv /usr/share/walpserver/venv

        # Activate virtual environment and install dependencies
        /usr/share/walpserver/venv/bin/pip install -r /usr/share/walpserver/requirements.txt

        # Create necessary directories
        mkdir -p /usr/share/walpserver/static/uploads
        mkdir -p /usr/share/walpserver/static/torrents
        mkdir -p /usr/share/walpserver/static/temp

        # Set permissions
        chown -R walpserver:walpserver /usr/share/walpserver
        chmod -R 755 /usr/share/walpserver

        # Enable and start service
        systemctl daemon-reload
        systemctl enable walpserver
        systemctl start walpserver
    ;;

    abort-upgrade|abort-remove|abort-deconfigure)
    ;;

    *)
        echo "postinst called with unknown argument \`$1'" >&2
        exit 1
    ;;
esac

exit 0
```

debian/prerm:
```bash
#!/bin/sh
set -e

case "$1" in
    remove|upgrade|deconfigure)
        # Stop and disable service
        systemctl stop walpserver || true
        systemctl disable walpserver || true
    ;;

    failed-upgrade)
    ;;

    *)
        echo "prerm called with unknown argument \`$1'" >&2
        exit 1
    ;;
esac

exit 0
```

debian/source/format:
```
3.0 (native)
```

4. Сделайте скрипты исполняемыми:
```bash
chmod +x debian/rules debian/postinst debian/prerm
```

### Сборка

Для сборки пакета выполните:
```bash
dpkg-buildpackage -us -uc
```

После успешной сборки в родительской директории появятся файлы:
- walpserver_1.0.0_all.deb - сам пакет
- walpserver_1.0.0.dsc - описание исходного пакета
- walpserver_1.0.0.tar.xz - архив с исходным кодом
- walpserver_1.0.0_amd64.buildinfo - информация о сборке
- walpserver_1.0.0_amd64.changes - информация об изменениях

## Управление сервисом

После установки .deb пакета сервер запускается как системный сервис:

```bash
# Запуск сервера
sudo systemctl start walpserver

# Остановка сервера
sudo systemctl stop walpserver

# Статус сервера
sudo systemctl status walpserver

# Автозапуск при старте системы
sudo systemctl enable walpserver
```

## Доступ к веб-интерфейсу

После установки веб-интерфейс доступен по адресу:
```
http://localhost:5000
```

## Разработка

### Структура проекта

```
walpserver/
├── server.py          # Основной сервер
├── server_manager.py  # Менеджер сервера с GUI
├── config.py          # Конфигурация
├── requirements.txt   # Зависимости
├── static/           # Статические файлы
└── templates/        # HTML шаблоны
```

### Зависимости

- Flask
- Flask-Login
- Flask-CORS
- Flet
- psutil
- и другие (см. requirements.txt)

## Лицензия

MIT License

import flet as ft
import psutil
import subprocess
import time
import threading
import os
import json
from datetime import datetime
import webbrowser
import sys
import logging
from flet import Colors, Icons

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Вывод в консоль
        logging.FileHandler('server_manager.log')  # Вывод в файл
    ]
)

class ServerManager:
    def __init__(self):
        self.server_process = None
        self.logs = []
        self.is_running = False
        self.log_file = "server.log"
        self.server_dir = "/usr/lib/walpserver"
        
    def start_server(self):
        if not self.is_running:
            try:
                # Убедимся, что сервер запускается в правильной директории
                python_path = "/usr/lib/walpserver/venv/bin/python3"
                server_path = os.path.join(self.server_dir, "server.py")
                
                # Добавляем логирование команды запуска
                start_msg = f"Starting server with Python: {python_path}"
                self.logs.append(start_msg)
                logging.info(start_msg)
                
                dir_msg = f"Current directory: {self.server_dir}"
                self.logs.append(dir_msg)
                logging.info(dir_msg)
                
                self.server_process = subprocess.Popen(
                    [python_path, server_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    universal_newlines=True,
                    cwd=self.server_dir
                )
                
                # Проверяем, запустился ли процесс
                if self.server_process.poll() is None:
                    self.is_running = True
                    success_msg = "Server process started successfully"
                    self.logs.append(success_msg)
                    logging.info(success_msg)
                    threading.Thread(target=self._read_logs, daemon=True).start()
                    return True, "Server started successfully"
                else:
                    error = self.server_process.stdout.read()
                    error_msg = f"Server failed to start: {error}"
                    self.logs.append(error_msg)
                    logging.error(error_msg)
                    return False, error_msg
            except Exception as e:
                error_msg = f"Failed to start server: {str(e)}"
                self.logs.append(error_msg)
                logging.error(error_msg)
                return False, error_msg
        return False, "Server is already running"
            
    def stop_server(self):
        if self.is_running and self.server_process:
            try:
                self.server_process.terminate()
                self.server_process.wait(timeout=5)
                self.is_running = False
                stop_msg = "Server stopped successfully"
                self.logs.append(stop_msg)
                logging.info(stop_msg)
                return True, stop_msg
            except Exception as e:
                error_msg = f"Failed to stop server: {str(e)}"
                self.logs.append(error_msg)
                logging.error(error_msg)
                return False, error_msg
        return False, "Server is not running"
            
    def _read_logs(self):
        while self.is_running:
            try:
                line = self.server_process.stdout.readline()
                if line:
                    line = line.strip()
                    self.logs.append(line)
                    logging.info(f"Server: {line}")
                    if len(self.logs) > 1000:  # Keep last 1000 lines
                        self.logs = self.logs[-1000:]
            except:
                break

def main(page: ft.Page):
    logging.info("Starting Server Manager application")
    page.title = "Server Manager"
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 20
    page.window_width = 1200
    page.window_height = 800
    
    server = ServerManager()
    
    # Status text
    status_text = ft.Text("Server status: Stopped", color=Colors.RED)
    
    # System stats
    def update_system_stats():
        while True:
            try:
                cpu_percent = psutil.cpu_percent()
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                cpu_progress.value = cpu_percent / 100
                memory_progress.value = memory.percent / 100
                disk_progress.value = disk.percent / 100
                
                cpu_text.value = f"CPU: {cpu_percent}%"
                memory_text.value = f"Memory: {memory.percent}% ({memory.used / (1024**3):.1f} GB / {memory.total / (1024**3):.1f} GB)"
                disk_text.value = f"Disk: {disk.percent}% ({disk.used / (1024**3):.1f} GB / {disk.total / (1024**3):.1f} GB)"
                
                page.update()
            except Exception as e:
                logging.error(f"Error updating system stats: {str(e)}")
            time.sleep(1)
    
    # Progress bars
    cpu_progress = ft.ProgressBar(
        value=0,
        width=300,
        color=Colors.BLUE_400,
        bgcolor=Colors.BLUE_100
    )
    
    memory_progress = ft.ProgressBar(
        value=0,
        width=300,
        color=Colors.GREEN_400,
        bgcolor=Colors.GREEN_100
    )
    
    disk_progress = ft.ProgressBar(
        value=0,
        width=300,
        color=Colors.ORANGE_400,
        bgcolor=Colors.ORANGE_100
    )
    
    # Text displays
    cpu_text = ft.Text("CPU: 0%")
    memory_text = ft.Text("Memory: 0%")
    disk_text = ft.Text("Disk: 0%")
    
    def on_start_click(e):
        logging.info("Start button clicked")
        success, message = server.start_server()
        if success:
            status_text.value = "Server status: Running"
            status_text.color = Colors.GREEN
            logging.info("Opening web interface in browser")
            webbrowser.open("http://localhost:5000")
        else:
            status_text.value = f"Server status: {message}"
            status_text.color = Colors.RED
            logging.error(f"Failed to start server: {message}")
        page.update()
    
    def on_stop_click(e):
        logging.info("Stop button clicked")
        success, message = server.stop_server()
        if success:
            status_text.value = "Server status: Stopped"
            status_text.color = Colors.RED
        else:
            status_text.value = f"Server status: {message}"
            status_text.color = Colors.RED
            logging.error(f"Failed to stop server: {message}")
        page.update()
    
    # Control buttons
    start_button = ft.ElevatedButton(
        "Start Server",
        icon=Icons.PLAY_ARROW_ROUNDED,
        on_click=on_start_click
    )
    
    stop_button = ft.ElevatedButton(
        "Stop Server",
        icon=Icons.STOP_ROUNDED,
        on_click=on_stop_click
    )
    
    # Log display
    log_display = ft.ListView(
        expand=1,
        spacing=10,
        padding=20,
        auto_scroll=True
    )
    
    def update_logs():
        while True:
            if server.logs:
                log_display.controls.clear()
                for log in server.logs:
                    log_display.controls.append(
                        ft.Text(log, selectable=True)
                    )
                page.update()
            time.sleep(0.5)
    
    # Web interface button
    web_button = ft.ElevatedButton(
        "Open Web Interface",
        icon=Icons.WEB_ROUNDED,
        on_click=lambda _: webbrowser.open("http://localhost:5000")
    )
    
    # Layout
    stats_column = ft.Column(
        controls=[
            ft.Text("CPU Usage", size=16, weight=ft.FontWeight.BOLD),
            cpu_progress,
            cpu_text,
            ft.Divider(),
            ft.Text("Memory Usage", size=16, weight=ft.FontWeight.BOLD),
            memory_progress,
            memory_text,
            ft.Divider(),
            ft.Text("Disk Usage", size=16, weight=ft.FontWeight.BOLD),
            disk_progress,
            disk_text,
        ],
        spacing=10
    )
    
    controls_row = ft.Row(
        controls=[start_button, stop_button, web_button, status_text],
        alignment=ft.MainAxisAlignment.CENTER,
        spacing=20
    )
    
    # Create tabs
    t = ft.Tabs(
        selected_index=0,
        animation_duration=300,
        tabs=[
            ft.Tab(
                text="Dashboard",
                icon=ft.icons.DASHBOARD_ROUNDED,
                content=ft.Column(
                    controls=[
                        ft.Text("Server Manager", size=30, weight=ft.FontWeight.BOLD),
                        stats_column,
                        controls_row,
                        ft.Divider(),
                        ft.Text("Server Logs", size=20),
                        log_display
                    ],
                    scroll=ft.ScrollMode.AUTO
                )
            ),
            ft.Tab(
                text="Server Info",
                icon=ft.icons.INFO_ROUNDED,
                content=ft.Column(
                    controls=[
                        ft.Text("Server Information", size=20, weight=ft.FontWeight.BOLD),
                        ft.Text(f"Python Version: {sys.version}"),
                        ft.Text(f"Current Directory: {os.getcwd()}"),
                        ft.Text(f"Server Port: 5000"),
                        ft.Text("To access the web interface, click the 'Open Web Interface' button or visit http://localhost:5000 in your browser.")
                    ],
                    scroll=ft.ScrollMode.AUTO
                )
            )
        ],
        expand=1
    )
    
    page.add(t)
    
    # Start monitoring threads
    threading.Thread(target=update_system_stats, daemon=True).start()
    threading.Thread(target=update_logs, daemon=True).start()
    logging.info("Server Manager application started successfully")

if __name__ == "__main__":
    ft.app(target=main) 
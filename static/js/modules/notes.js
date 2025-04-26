/**
 * Модуль "Заметки" для работы с заметками
 */
const NotesModule = {
    // DOM элементы
    elements: {
        notesContainer: null,
        notesList: null,
        addNoteBtn: null,
        noteModal: null,
        noteModalTitle: null,
        noteIdInput: null,
        noteTitleInput: null,
        noteContentInput: null,
        notePrioritySelect: null,
        saveNoteBtn: null,
        closeBtns: null
    },
    
    // Инициализация модуля
    init: function() {
        // Находим DOM элементы
        this.elements.notesContainer = document.querySelector('.notes-container');
        this.elements.notesList = document.querySelector('.notes-list');
        this.elements.addNoteBtn = document.getElementById('add-note-btn');
        this.elements.noteModal = document.getElementById('note-modal');
        this.elements.noteModalTitle = document.getElementById('note-modal-title');
        this.elements.noteIdInput = document.getElementById('note-id');
        this.elements.noteTitleInput = document.getElementById('note-title');
        this.elements.noteContentInput = document.getElementById('note-content');
        this.elements.notePrioritySelect = document.getElementById('note-priority');
        this.elements.saveNoteBtn = document.getElementById('save-note-btn');
        this.elements.closeBtns = document.querySelectorAll('#note-modal .close, #note-modal .close-modal');
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Загружаем заметки
        this.loadNotes();
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Добавление новой заметки
        if (this.elements.addNoteBtn) {
            this.elements.addNoteBtn.addEventListener('click', () => {
                this.openNoteModal();
            });
        }
        
        // Сохранение заметки
        if (this.elements.saveNoteBtn) {
            this.elements.saveNoteBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }
        
        // Закрытие модального окна
        this.elements.closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeNoteModal();
            });
        });
        
        // Отправка формы при нажатии Enter в поле заголовка
        if (this.elements.noteTitleInput) {
            this.elements.noteTitleInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.saveNote();
                }
            });
        }
        
        // Закрытие модального окна при клике вне его содержимого
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.noteModal) {
                this.closeNoteModal();
            }
        });
        
        // Обработчик события изменения языка
        document.addEventListener('languageChanged', () => {
            // Обновляем отображение заметок при смене языка
            this.loadNotes();
        });
    },
    
    // Загрузка списка заметок
    loadNotes: function() {
        fetch('/notes')
            .then(response => response.json())
            .then(notes => {
                this.displayNotes(notes);
            })
            .catch(error => {
                console.error('Ошибка при загрузке заметок:', error);
                Utils.showNotification(t('loading_notes_error'), 'error');
            });
    },
    
    // Отображение заметок
    displayNotes: function(notes) {
        this.elements.notesList.innerHTML = '';
        
        if (notes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes-message';
            emptyMessage.innerHTML = `<i class="fas fa-sticky-note"></i><p>${t('empty_notes_message')}</p>`;
            this.elements.notesList.appendChild(emptyMessage);
            return;
        }
        
        notes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.dataset.id = note.id;
            noteCard.dataset.priority = note.priority;
            
            // Используем локализованный формат даты
            const createDate = new Date(note.create_date);
            const locale = localStorage.getItem('language') === 'en' ? 'en-US' : 'ru-RU';
            const formattedDate = createDate.toLocaleDateString(locale) + ' ' + 
                                createDate.toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'});
            
            noteCard.innerHTML = `
                <h3 class="note-title">${Utils.escapeHtml(note.title)}</h3>
                <div class="note-content">${Utils.escapeHtml(note.content)}</div>
                <div class="note-footer">
                    <span class="note-date">${formattedDate}</span>
                    <div class="note-actions">
                        <button class="note-edit-btn" title="${t('edit')}"><i class="fas fa-edit"></i></button>
                        <button class="note-delete-btn" title="${t('delete')}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            this.elements.notesList.appendChild(noteCard);
            
            // Добавляем обработчики событий
            const editBtn = noteCard.querySelector('.note-edit-btn');
            const deleteBtn = noteCard.querySelector('.note-delete-btn');
            
            editBtn.addEventListener('click', () => this.openNoteModal(note));
            deleteBtn.addEventListener('click', () => this.deleteNote(note.id));
        });
    },
    
    // Открытие модального окна для создания/редактирования заметки
    openNoteModal: function(note = null) {
        // Очищаем форму
        this.resetNoteForm();
        
        if (note) {
            // Редактирование существующей заметки
            this.elements.noteModalTitle.textContent = t('edit_note');
            this.elements.noteIdInput.value = note.id;
            this.elements.noteTitleInput.value = note.title;
            this.elements.noteContentInput.value = note.content;
            this.elements.notePrioritySelect.value = note.priority;
        } else {
            // Создание новой заметки
            this.elements.noteModalTitle.textContent = t('new_note');
        }
        
        // Открываем модальное окно
        this.elements.noteModal.style.display = 'block';
        this.elements.noteTitleInput.focus();
    },
    
    // Сброс формы
    resetNoteForm: function() {
        this.elements.noteIdInput.value = '';
        this.elements.noteTitleInput.value = '';
        this.elements.noteContentInput.value = '';
        this.elements.notePrioritySelect.value = '0';
    },
    
    // Сохранение заметки
    saveNote: function() {
        const title = this.elements.noteTitleInput.value.trim();
        if (!title) {
            Utils.showNotification(t('note_title_required'), 'error');
            return;
        }
        
        const noteData = {
            title: title,
            content: this.elements.noteContentInput.value.trim(),
            priority: parseInt(this.elements.notePrioritySelect.value)
        };
        
        const noteId = this.elements.noteIdInput.value;
        const url = noteId ? `/update_note/${noteId}` : '/add_note';
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.closeNoteModal();
                this.loadNotes();
                Utils.showNotification(noteId ? t('note_updated') : t('note_created'), 'success');
            } else {
                Utils.showNotification(data.error || t('loading_notes_error'), 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при сохранении заметки:', error);
            Utils.showNotification(t('loading_notes_error'), 'error');
        });
    },
    
    // Удаление заметки
    deleteNote: function(noteId) {
        if (confirm(t('delete_note_confirm'))) {
            fetch(`/delete_note/${noteId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.loadNotes();
                        Utils.showNotification(t('note_deleted'), 'success');
                    } else {
                        Utils.showNotification(data.error || t('loading_notes_error'), 'error');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при удалении заметки:', error);
                    Utils.showNotification(t('loading_notes_error'), 'error');
                });
        }
    },
    
    // Закрытие модального окна
    closeNoteModal: function() {
        this.elements.noteModal.style.display = 'none';
    }
}; 
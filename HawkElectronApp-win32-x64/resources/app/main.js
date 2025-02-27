const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

// Путь для сохранения настроек окна
const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');

// Функция для загрузки сохранённых настроек окна
function loadWindowState() {
  try {
    const data = fs.readFileSync(windowStateFile, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    // Если файл не найден или повреждён, возвращаем дефолтные настройки
    return {
      width: 920,
      height: 600,
      x: undefined,
      y: undefined
    };
  }
}

// Функция для сохранения текущих настроек окна
function saveWindowState() {
  if (!win) return;

  const windowBounds = win.getBounds();
  const windowState = {
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y
  };

  fs.writeFileSync(windowStateFile, JSON.stringify(windowState));
}

app.whenReady().then(() => {
  // Загружаем предыдущие настройки окна
  const windowState = loadWindowState();

  win = new BrowserWindow({
    width: windowState.width || 920,
    height: windowState.height || 600,
    x: windowState.x || undefined,
    y: windowState.y || undefined,
    icon: path.join(__dirname, 'icons', 'app-icon.ico'),  // Добавляем иконку
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Убираем стандартное меню
  win.removeMenu();

  // Загружаем ваш сайт
  win.loadURL('https://hawk.live');

  // Скроллирование при первой загрузке страницы
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      if (!sessionStorage.getItem('scrolled')) {
        window.scrollTo(0, 500);  // Скроллим на 500 пикселей
        sessionStorage.setItem('scrolled', 'true');  // Ставим флаг, что скролл был
      }
    `);
  });

  // Включаем DevTools по нажатию F12 и перезагрузку по F5
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    } else if (input.key === 'F5') {
      win.reload();
      event.preventDefault();
    }
  });

  // Слушаем команду на отключение/включение звука
  ipcMain.on('toggle-mute', (event, isMuted) => {
    win.webContents.setAudioMuted(isMuted);
  });

  // Возвращаем текущее состояние звука
  ipcMain.handle('get-audio-muted', () => {
    return win.webContents.isAudioMuted();
  });

  // Добавляем функционал пресетов
  ipcMain.on('set-preset', (event, preset) => {
    if (preset === 'compact') {
      win.setSize(420, 303);  // Компактный HAWK
    } else if (preset === 'long') {
      win.setSize(658, 335);  // Длинный HAWK
    }

    // После смены пресета, отправляем сообщение на фронтенд для скролла
    setTimeout(() => {
      win.webContents.send('perform-scroll'); // Отправляем сообщение на preload.js
    }, 300); // Задержка, чтобы дать окну время поменять размер
  });

  // Сохраняем позицию и размеры окна при закрытии
  win.on('close', () => {
    saveWindowState();
  });

  win.on('closed', () => {
    win = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

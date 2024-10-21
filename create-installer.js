const electronInstaller = require('electron-winstaller');

async function createInstaller() {
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: 'E:\\ProjectJs\\HawkElectron\\hawk-app\\HawkElectronApp-win32-x64', // Путь к упакованной версии приложения
      outputDirectory: 'E:\\ProjectJs\\HawkElectron\\hawk-app\\installer', // Папка для сохранения установщика
      authors: 'Your Name',
      exe: 'HawkElectronApp.exe',
      setupIcon: 'icons/app-icon.ico', // Путь к вашей иконке
      noMsi: true, // Отключаем MSI, создаем только EXE установщик
      description: 'This is the Hawk Electron Application.',
      oneClick: false, // Отключаем установку в один клик
      allowToChangeInstallationDirectory: true // Позволяем пользователю изменять путь установки
    });
    console.log('Установщик успешно создан!');
  } catch (e) {
    console.log(`Ошибка при создании установщика: ${e.message}`);
  }
}

createInstaller();

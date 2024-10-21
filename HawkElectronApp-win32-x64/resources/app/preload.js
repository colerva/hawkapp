const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // Создаем плашку MUTE, если её нет
  const muteIndicator = document.createElement('div');
  muteIndicator.style.position = 'fixed';
  muteIndicator.style.top = '20px';
  muteIndicator.style.right = '20px';
  muteIndicator.style.padding = '15px 20px';
  muteIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  muteIndicator.style.color = 'white';
  muteIndicator.style.borderRadius = '12px';
  muteIndicator.style.fontSize = '14px';
  muteIndicator.style.fontWeight = 'bold';
  muteIndicator.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  muteIndicator.style.transition = 'opacity 0.3s ease';
  muteIndicator.style.opacity = '0';
  muteIndicator.style.zIndex = '9999';
  muteIndicator.innerText = 'MUTED';
  document.body.appendChild(muteIndicator);

  let isMuted = false;

  // Проверка фактического состояния звука при загрузке
  function checkAudioMutedState() {
    ipcRenderer.invoke('get-audio-muted').then((muted) => {
      isMuted = muted;
      muteIndicator.style.opacity = isMuted ? '1' : '0';  // Синхронизируем плашку
    });
  }

  // Отключение звука по нажатию "S" или "Ы"
  document.addEventListener('keydown', (event) => {
    if (event.key === 's' || event.key === 'S' || event.key === 'ы' || event.key === 'Ы') {
      isMuted = !isMuted;
      ipcRenderer.send('toggle-mute', isMuted);  // Отправляем команду в main.js
      muteIndicator.style.opacity = isMuted ? '1' : '0';
    }
  });

  // Удаление кнопки "Сделать ставку" с помощью MutationObserver
  function removeBetButtons() {
    // Удаляем обе версии кнопки с разными классами
    const betButtons = document.querySelectorAll(
      'button.v-btn.v-btn--elevated.v-theme--light.v-btn--density-default.v-btn--size-default.v-btn--variant-elevated.bg-primary.label-primary, ' +
      'button.v-btn.v-btn--elevated.v-theme--light.v-btn--density-default.v-btn--size-small.v-btn--variant-elevated.bg-primary.label-primary'
    );

    betButtons.forEach(button => {
      button.remove();
      console.log('Кнопка "Сделать ставку" удалена.');
    });
  }

  // Используем MutationObserver для отслеживания изменений в DOM и удаления кнопки
  const observer = new MutationObserver(() => {
    removeBetButtons();  // Проверяем и удаляем кнопку при любых изменениях в DOM
  });

  // Начинаем отслеживание изменений в body
  observer.observe(document.body, { childList: true, subtree: true });

  // Ожидание кнопки выбора карты и её нажатие
  function waitForButtonAndClick() {
    let mapButton = document.getElementById('match-view-series-menu');
    if (mapButton) {
      setTimeout(() => {
        mapButton.click();
        console.log("Кнопка 'Select a Map' нажата");
      }, 100);
    } else {
      console.log("Кнопка не найдена, пробуем снова...");
      setTimeout(waitForButtonAndClick, 100);
    }
  }

  // Функция для выбора карты по клавишам 1, 2, 3
  function selectMap(mapIndex) {
    const mapListItems = document.querySelectorAll('.v-list-item-title');
    if (mapListItems && mapListItems[mapIndex]) {
      setTimeout(() => {
        mapListItems[mapIndex].click();
        console.log(`Выбрана карта ${mapIndex + 1}`);
      }, 100);
    } else {
      console.log(`Карта ${mapIndex + 1} не найдена.`);
    }
  }

  // Автоскролл при выборе карты
  function autoScrollAfterMapSelect() {
    const observer = new MutationObserver(() => {
      if (window.location.href.includes("map2")) {
        console.log("Карта 2 выбрана, выполняем автоскролл...");
        window.scrollTo({
          top: 429,
          behavior: 'smooth'
        });
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Обработка клавиш "R", "Q" и выбора карты
  document.addEventListener('keydown', function(event) {
    if (event.key === 'r' || event.key === 'R' || event.key === 'к' || event.key === 'К') {
      performScroll(); // Используем новую функцию performScroll
    }

    if (event.key === 'q' || event.key === 'Q' || event.key === 'й' || event.key === 'Й') {
      sessionStorage.setItem('refreshAndClick', 'true');
      sessionStorage.setItem('scrollPosition', window.scrollY);
      location.reload();
    }

    if (event.key === '1') {
      selectMap(0);
      autoScrollAfterMapSelect();
    } else if (event.key === '2') {
      selectMap(1);
      autoScrollAfterMapSelect();
    } else if (event.key === '3') {
      selectMap(2);
      autoScrollAfterMapSelect();
    }

    // Переключение пресетов на Z (я) и X (ч)
    if (event.key === 'z' || event.key === 'я') {
      ipcRenderer.send('set-preset', 'compact');  // Компактный HAWK
    } else if (event.key === 'x' || event.key === 'ч') {
      ipcRenderer.send('set-preset', 'long');  // Длинный HAWK
    }
  });

  // Функция для автоскролла с учётом ширины окна
  function performScroll() {
    const windowWidth = window.innerWidth;

    // Устанавливаем значения скролла в зависимости от ширины окна
    const scrollValue = windowWidth > 620 ? 338 : 425; // <- Измените здесь значение по вашему желанию

    console.log(`Ширина окна: ${windowWidth}, значение скролла: ${scrollValue}`);

    window.scrollTo({
      top: scrollValue,
      behavior: 'smooth'
    });
  }

  // При первой загрузке выполняем автоскролл
  window.addEventListener('load', function() {
    if (sessionStorage.getItem('refreshAndClick') === 'true') {
      sessionStorage.removeItem('refreshAndClick');
      waitForButtonAndClick();
    }
    checkAudioMutedState();  // Проверяем состояние звука при загрузке страницы
    performScroll();  // Выполняем автоскролл при первой загрузке страницы
  });

  // Слушаем сообщение от main.js для выполнения автоскролла после изменения пресета
  ipcRenderer.on('perform-scroll', () => {
    performScroll();  // Выполняем автоскролл после смены пресета
  });

  let isScrolling;
  window.addEventListener('scroll', function () {
    document.body.classList.add('scroll-active');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(function () {
      document.body.classList.remove('scroll-active');
    }, 1000);
  });

  const style = document.createElement('style');
  style.innerHTML = `
    ::-webkit-scrollbar {
        width: 0;
    }
    body.scroll-active::-webkit-scrollbar {
        width: 8px;
    }
    ::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
});

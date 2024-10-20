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
      window.scrollTo({
        top: 429,
        behavior: 'smooth'
      });
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
  });

  window.addEventListener('load', function() {
    if (sessionStorage.getItem('refreshAndClick') === 'true') {
      sessionStorage.removeItem('refreshAndClick');
      waitForButtonAndClick();
    }
    checkAudioMutedState();  // Проверяем состояние звука при загрузке страницы
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

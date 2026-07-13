const videoContainer = document.querySelector("[data-video-js]");
const videoControls = document.querySelector("[data-controls]");
const video = document.getElementById("video");
const videoProgressBar = document.querySelector("[data-video-progress]");
const videoTimer = document.querySelector("[data-timer]");

const overlayBtn = document.querySelector("[data-overlay-btn]");

const toggleBtn = document.querySelector("[data-toggle-btn]");

const volumeToggleBtn = document.querySelector("[data-volume-btn]");
const volumeRangeBar = document.querySelector("[data-volume-range-bar]");

const speedToggleBtn = document.querySelector("[data-speed-btn]");

const fullscreenBtn = document.querySelector("[data-toggle-screen]");

const state = {
  volumeLvl: null,
  isSeeking: false,
  isInteracting: false,
};

videoContainer.addEventListener("click", toggleVideoStatus);

function toggleVideoStatus({ target }) {
  const overlayBtn = target.closest("[data-overlay-btn]");
  const videoBody = target.closest("[data-clickable-area]");

  if (overlayBtn) {
    const span = target.firstElementChild;

    video.play();
    videoContainer.classList.remove("start");
    span.textContent = "Repeat";
    toggleBtn.firstElementChild.textContent = "Pause";
  } else if (videoBody) {
    playPauseVideo(target);
  }
}

video.addEventListener("ended", endVideo);

function endVideo() {
  videoContainer.classList.add("repeat");

  function repeatVideo() {
    video.currentTime = 0;
    video.volume = 1;

    state.volumeLvl = 0;
    videoContainer.classList.remove("repeat");
    volumeToggleBtn.classList.remove("muted");
  }

  overlayBtn.addEventListener("click", repeatVideo);
}

function playPauseVideo() {
  const span = toggleBtn.firstElementChild;

  if (video.paused) {
    video.play();
    videoContainer.classList.add("hideable");
    span.textContent = "Pause";
  } else {
    video.pause();
    videoContainer.classList.remove("hideable");
    span.textContent = "Play";
  }
}

toggleBtn.addEventListener("click", playPauseVideo);

video.addEventListener("timeupdate", () => {
  if (state.isSeeking) return;

  setVideoTime();
  updateVideoProgress();
});

video.addEventListener("seeked", () => {
  state.isSeeking = false;

  setVideoTime();
  updateVideoProgress();
});

function setVideoTime() {
  const curr = getParamValue("currentTime");
  const dur = getParamValue("duration");

  videoTimer.textContent = `${curr} / ${dur}`;
}

function getParamValue(param) {
  const min = formatTime("minute", param).toString().padStart(2, "0");
  const sec = formatTime("second", param).toString().padStart(2, "0");

  return `${min}:${sec}`;
}

function formatTime(unit, param) {
  let formatted;

  if (unit === "minute") {
    formatted = Math.floor(video[param] / 60);
  } else if (unit === "second") {
    formatted = Math.floor(video[param] % 60);
  }

  return formatted;
}

volumeToggleBtn.addEventListener("click", changeVolume);
volumeRangeBar.addEventListener("input", changeVolume);

function changeVolume(event) {
  const target = event.target;
  const isClick = event.type === "click" ? true : false;

  let videoVolume = video.volume;

  if (isClick) {
    const span = target.firstElementChild;

    const isMuted = target.classList.contains("muted");

    if (isMuted) {
      videoVolume = state.volumeLvl || 1;
      volumeRangeBar.value = videoVolume;

      setProgress("volume", videoVolume, volumeRangeBar);

      target.classList.remove("muted");
      span.textContent = "Off";
    } else {
      videoVolume = 0;
      volumeRangeBar.value = videoVolume;

      setProgress("volume", videoVolume, volumeRangeBar);

      target.classList.add("muted");
      span.textContent = "On";
    }

    video.volume = videoVolume;
  } else {
    const value = Number(target.value);
    state.volumeLvl = value;

    if (value === 0) {
      volumeToggleBtn.classList.add("muted");
    } else {
      volumeToggleBtn.classList.remove("muted");
    }

    videoVolume = value;
    video.volume = videoVolume;

    setProgress("volume", videoVolume, volumeRangeBar);
  }
}

function setProgress(varName, param, rangeBar) {
  const percent = Math.round(param * 100);

  rangeBar.style.setProperty(`--${varName}LevelPercent`, `${percent}%`);
}

videoProgressBar.addEventListener("input", handleVideoProgressInput);

function handleVideoProgressInput(event) {
  if (!video.duration) return;

  state.isSeeking = true;

  const progressPercent = Number(event.target.value);
  const newTime = (progressPercent / 100) * video.duration;

  video.currentTime = newTime;
  updateVideoProgress(progressPercent);
}

function updateVideoProgress(progressPercent = null) {
  if (!video.duration) return;

  const currentProgress =
    progressPercent ?? (video.currentTime / video.duration) * 100;
  const clampedProgress = Math.min(Math.max(currentProgress, 0), 100);

  setProgress("progress", clampedProgress / 100, videoProgressBar);
  videoProgressBar.value = clampedProgress;
}

speedToggleBtn.addEventListener("click", toggleVideoSpeed);

function toggleVideoSpeed() {
  if (video.playbackRate === 1.0) {
    video.playbackRate = 2.0;
    speedToggleBtn.classList.add("sped-up");
  } else {
    video.playbackRate = 1.0;
    speedToggleBtn.classList.remove("sped-up");
  }
}

// МОБИЛЬНОЕ ВЗАИМОДЕЙСТВИЕ С CONTROLS
function isTouchDevice() {
  return "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;
}

if (isTouchDevice()) {
  let hideTimeout = null;

  const updateTimer = () => {
    const isVisible = videoControls.classList.contains("show-controls");
    clearTimeout(hideTimeout);

    if (isVisible && !state.isInteracting) {
      hideTimeout = setTimeout(
        () => videoControls.classList.toggle("show-controls"),
        3000,
      );
    }
  };

  videoContainer.addEventListener("click", (event) => {
    const element = event.target.closest("[data-element]");

    if (element) {
      updateTimer();
      return;
    }

    videoControls.classList.toggle("show-controls");
    updateTimer();
  });

  videoControls.addEventListener(
    "touchstart",
    () => {
      state.isInteracting = true;
      clearTimeout(hideTimeout); // Останавливаем скрытие
    },
    { passive: true },
  );

  // Пользователь отпустил элемент управления
  videoControls.addEventListener(
    "touchend",
    () => {
      state.isInteracting = false;
      updateTimer(); // Запускаем таймер заново после окончания взаимодействия
    },
    { passive: true },
  );

  function handleOrientationChange() {
    // Проверяем, повернут ли экран горизонтально (landscape)
    const isLandscape = screen.orientation.type.startsWith("landscape");

    if (isLandscape) {
      // Разворачиваем видео на весь экран
      if (video.requestFullscreen) {
        video.requestFullscreen().catch((err) => {
          console.log(
            "Блокировка браузера: нужен предварительный клик пользователя на странице.",
            err,
          );
        });
      } else if (video.webkitEnterFullscreen) {
        // Специально для Safari на iPhone
        video.webkitEnterFullscreen();
      }
      videoControls.style.setProperty("--fullScreenVisibility", "block");
    } else {
      // Если вернули в вертикальный режим — выходим из полного экрана
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      } else if (video.webkitExitFullscreen) {
        video.webkitExitFullscreen();
      }
      videoControls.style.setProperty("--fullScreenVisibility", "none");
    }
  }

  // Подключаем слушатель изменений (поддерживает современные браузеры)
  if (screen.orientation) {
    fullscreenBtn.addEventListener("click", handleOrientationChange);
    screen.orientation.addEventListener("change", handleOrientationChange);
  }
}

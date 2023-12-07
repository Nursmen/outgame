const tools = {
  style(node, obj) {
    for (const property in obj) {
      node.style[property] = obj[property];
    }
  },
  random(min, max, int) {
    let result = min + Math.random() * (max + (int ? 1 : 0) - min);
    return int ? parseInt(result) : result;
  },
  yEasing(t, b, c, d, s) {
    return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  },
  xEasing(t, b, c, d, s) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  } };


const config = {
  xVel: 0.05,
  yVel: 0.05,
  score: [50, -250],
  time: 30,
  defaultMode: 'shape',
  bonusRow: 10,
  particles: 20,
  shapeReappearanceChance: 10,
  modeReappearanceChance: 40,
  colorReappearanceChance: 25 };


const icons = ['good', 'bad', 'good2', 'bad2', 'good3', 'bad3'];


const colors = [
{
  name: 'red',
  value: '#eb4c34' },

{
  name: 'purple',
  value: '#d353ff' },

{
  name: 'green',
  value: '#33d767' },

{
  name: 'blue',
  value: '#3ca3e1' },

{
  name: 'yellow',
  value: '#cccd33' }];



const keys = {
  arrowRight: 39,
  arrowLeft: 37 };


const ui = {
  main: 'main',
  separator: '#separator',
  score: '#score',
  gradient: '#gradient',
  fail: '#fail',
  timer: '#timer',
  startButton: '#start-button',
  startTimer: '#start-timer',
  startTimerWrapper: '#start-timer-wrapper',
  menuButton: '#menu-button',
  restartButton: '#restart-button',
  restartButtonInGame: '#restart-button-in-game',
  gameOverScore: '#game-over-score',
  menu: '#menu',
  gameOver: '#game-over',
  slider: '#slider',
  bonus: '#bonus',
  bonusFactor: '#bonus-factor',
  gameScene: '#game-scene',
  correctScale: '#correct-scale',
  correctNumber: '#correct-number',
  incorrectNumber: '#incorrect-number',
  comparingPercent: '#comparing-percent' };


let state = {
  height: 0,
  width: 0,
  mouse: {
    xStart: 0,
    yStart: 0,
    x: 0,
    y: 0 },

  score: 0,
  mouseSwiping: false,
  animating: true,
  closerAnimation: false,
  mode: config.defaultMode,
  time: config.time,
  status: false,
  device: 'pc',
  series: 0,
  bonus: 0,
  started: false,
  correct: 0,
  incorrect: 0 };


const stateCache = { ...state };

class App {
  constructor() {
    this.tickInterval = null;
    this.slides = {
      current: undefined,
      excluded: [],
      prev: undefined };

    this.getDimensions();
    this.bindNodes();
    this.initEvents();
    this.loop();
  }
  gameStart() {
    if (state.started) return;
    this.gameReset();
    state.started = true;
    this.startTimer(() => {
      this.generateSlide();
      this.tick();
      state.status = true;
    });
  }
  gameOver() {
    this.calculateAccuracy();
    this.calculateComparingPercent();
    clearInterval(this.tickInterval);
    state.status = false;
    state.started = false;
    ui.gameScene.classList.remove('active');
    ui.gameOverScore.innerText = state.score;
    ui.gameOver.classList.add('active');
  }
  calculateAccuracy() {
    const sum = state.correct + state.incorrect;
    const width = sum ? state.correct / sum * 100 : 50;
    tools.style(ui.correctScale, {
      width: width + '%' });

    ui.correctNumber.innerText = state.correct;
    ui.incorrectNumber.innerText = state.incorrect;
  }
  calculateComparingPercent() {
    // yes, its fake ;)) By the way pretty realistic calculation)
    const max = 9000;
    const min = -1500;
    let result = (state.score - min) * 100 / (max - min);
    if (result < 0) result = 0;
    if (result > 100) result = 100;
    ui.comparingPercent.innerText = parseInt(result, 10) + '%';
  }
  gameReset() {
    ui.slider.innerHTML = '';
    this.slides = {
      current: undefined,
      excluded: [],
      prev: undefined };

    state = { ...stateCache };
    this.getDimensions();
    this.updateScore(true, 0);
    this.updateTimer(state.time);
    this.changeColorScheme({ name: 'white', value: 'white' });
    this.changeGradient({ name: 'white', value: 'white' });
    ui.separator.classList.remove('to-left', 'to-right');
    ui.menu.classList.add('inactive');
    ui.gameScene.classList.add('active');
    ui.gameOver.classList.remove('active');
  }
  startTimer(fn) {
    let count = 3;
    count++;
    ui.startTimerWrapper.classList.add('active');
    const tick = () => {
      count--;
      ui.startTimer.innerText = count;
      if (count === 0) {
        ui.startTimerWrapper.classList.remove('active');
        fn();
        return;
      }
      setTimeout(tick, 1000);
    };
    tick();
  }
  generateSlide() {
    ui.separator.classList.remove('to-left', 'to-right');
    const prevSlide = this.slides.current;
    const modeReappearance = Math.random() * 100 <= config.modeReappearanceChance;
    const shapeReappearance = Math.random() * 100 <= config.shapeReappearanceChance;
    const colorReappearance = Math.random() * 100 <= config.colorReappearanceChance;
    // const mode = !modeReappearance && !!prevSlide ? ['shape', 'color'][tools.random(0, 1, true)] : state.mode;
    const mode = 'shape';
    const shape = shapeReappearance && !!prevSlide ? prevSlide.shape : icons[tools.random(0, icons.length - 1, true)];
    const color = colorReappearance && !!prevSlide ? prevSlide.color : colors[tools.random(0, colors.length - 1, true)];
    const slide = this.renderSlide({
      color,
      mode,
      icon: shape });

    state.mode = mode;
    this.changeColorScheme(color);
    this.changeGradient(color);
    ui.slider.insertAdjacentHTML('beforeend', slide);
    setTimeout(() => {
      const slide = ui.slider.querySelector('.slide[data-status=active]');
      this.slides.current = new Slide({
        shape,
        color,
        dom: slide });

    }, 25);
  }
  changeColorScheme(color) {
    document.body.dataset.theme = color.name;
    document.body.style.setProperty('--theme-color', color.value);
  }
  changeGradient(color) {
    let oldGrad = ui.gradient.children;
    oldGrad = oldGrad[oldGrad.length - 1];
    oldGrad.classList.remove('active');
    setTimeout(() => {
      ui.gradient.removeChild(oldGrad);
    }, 300);
    const grad = `
        <div 
          class="gradient__item" 
          style="background: radial-gradient(circle, ${color.value}, #373737 90%);">
        </div>
     `;
    ui.gradient.insertAdjacentHTML('beforeend', grad);
    setTimeout(() => {
      const grads = ui.gradient.children;
      grads[grads.length - 1].classList.add('active');
    }, 25);
  }
  bindNodes() {
    for (const selector in ui) {
      ui[selector] = document.querySelectorAll(ui[selector]);
      if (ui[selector].length === 1) ui[selector] = ui[selector][0];
    }
  }
  initEvents() {
    window.addEventListener('resize', e => {
      this.getDimensions();
      this.resizeHandler(e);
    });
    document.addEventListener('mousemove', e => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      this.mouseMoveHandler(e);
    });
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      state.mouse.x = touch.clientX;
      state.mouse.y = touch.clientY;
      this.touchMoveHandler(e);
    });
    document.addEventListener('mousedown', e => {
      state.mouse.xStart = e.clientX;
      state.mouse.yStart = e.clientY;
      this.mouseDownHandler(e);
    });
    document.addEventListener('touchstart', e => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      state.mouse.xStart = touch.clientX;
      state.mouse.yStart = touch.clientY;
      this.touchStartHandler(e);
    });
    document.addEventListener('touchend', e => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      this.touchEndHandler();
    });
    document.addEventListener('mouseup', e => {
      this.mouseUpHandler(e);
    });
    window.addEventListener('keyup', e => {
      this.keyUpHandler(e);
    });
    ui.startButton.onclick = () => {
      this.gameStart();
    };
    ui.menuButton.onclick = () => {
      ui.gameOver.classList.remove('active');
      ui.menu.classList.remove('inactive');
    };
    ui.restartButton.onclick = () => {
      ui.gameOver.classList.remove('active');
      this.gameStart();
    };
    ui.restartButtonInGame.onclick = () => {
      this.gameOver();
      this.gameStart();
    };
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
  }
  keyUpHandler(e) {
    if (!state.status) return;
    const slide = this.slides.current;
    switch (e.keyCode) {
      case keys.arrowLeft:
        if (slide) {
          slide.x = -0.0000001;
          this.closerAction();
        }
        break;
      case keys.arrowRight:
        if (slide) {
          slide.x = 0.0000001;
          this.closerAction();
        }
        break;}

  }
  mouseUpHandler(e) {
    if (!state.status) return;
    switch (e.which) {
      case 1:
        state.mouseSwiping = false;
        this.closerAction();
        break;
      default:break;}

  }
  closerAction() {
    const slide = this.slides.current;
    if (slide.x !== 0) {
      slide.dom.dataset.status = 'excluded';
      this.slides.excluded.unshift(slide);
      this.scoreRegistry();
      state.closerAnimation = true;
      state.animating = true;
    }
  }
  particleAnimation() {
    if (state.device === 'mobile') return;
    const slide = this.slides.current;
    const coords = [state.width / 2, state.height / 2];
    const dir = Math.sign(slide.x);
    const particles = Array(config.particles).fill(0).reduce((acc, el) => {
      const x = tools.random(coords[0] - 200, coords[0] + 200, true);
      const y = tools.random(coords[1] - 200, coords[1] + 200, true);
      const style = [
      `opacity: ${tools.random(0.5, 1, true)}`,
      `left: ${x}px; top: ${y}px`,
      `transition: all ${tools.random(0.35, 1)}s ease`,
      `transform: rotate(0) translate3d(0,0,0) scale(0)`].
      join(';');
      return acc + `<div style="${style}" class="particle"></div>`;
    }, '');
    const particleWrapper = `
      <div class="particles">
        ${particles}
      </div>
    `;
    ui.main.insertAdjacentHTML('beforeend', particleWrapper);
    setTimeout(() => {
      let wrapper = document.querySelectorAll('.particles');
      wrapper = wrapper[wrapper.length - 1];
      const p = [...wrapper.children];
      p.forEach(el => {
        tools.style(el, {
          transform: `
             rotate(${tools.random(-60, 60, true)}deg)
             translate3d(${tools.random(50, state.width / 2, true) * dir}px,0 ,0)
             scale(${tools.random(1, 3.5)})
          `,
          opacity: 0 });

      });
      setTimeout(() => {
        wrapper.parentNode.removeChild(wrapper);
      }, 1000);
    }, 25);
  }
  scoreRegistry() {
    const slide = this.slides.current;
    const prev = this.slides.prev;
    if (prev) {
      const direction = Math.sign(slide.x) === Math.sign(prev.x);
      const shape = slide.shape === prev.shape;
      const color = slide.color.name === prev.color.name;
      let result = null;
      switch (state.mode) {
        case 'shape':
          result = direction && shape || !direction && !shape;
          if (slide.shape[0] == prev.shape[0] ){
            result = true
          }
          break;
        case 'color':
          result = direction && color || !direction && !color;}

      this.updateScore(result);
      this.bonusCalculation(result);
      if (result) {
        state.correct += 1;
      } else {
        state.incorrect += 1;
      }
      if (!result) {
        ui.fail.classList.add('active');
        setTimeout(() => {
          ui.fail.classList.remove('active');
        }, 200);
      } else {
        this.particleAnimation();
      }
    }
  }
  bonusCalculation(action) {
    state.series = action ? state.series + 1 : 0;
    if (state.series && state.series % config.bonusRow === 0) {
      state.bonus = state.series / config.bonusRow;
      ui.bonusFactor.innerText = 'x' + (state.bonus + 1);
      ui.bonus.classList.add('active');
      setTimeout(() => {
        ui.bonus.classList.remove('active');
      }, 300);
    }
  }
  mouseDownHandler(e) {
    if (!state.status) return;
    switch (e.which) {
      case 1:
        state.mouseSwiping = true;
        break;
      default:break;}

  }
  touchStartHandler(e) {
    if (!state.status) return;
    state.mouseSwiping = true;
  }
  touchEndHandler(e) {
    if (!state.status) return;
    state.mouseSwiping = false;
    this.closerAction();
  }
  mouseMoveHandler(e) {
    if (!state.status) return;
    this.mouseSwiper(e);
  }
  touchMoveHandler(e) {
    if (!state.status) return;
    this.mouseSwiper(e);
  }
  resizeHandler(e) {

  }
  mouseSwiper(e) {
    const slide = this.slides.current;
    if (!state.mouseSwiping || state.animating) return;
    slide.x = (state.mouse.x - state.mouse.xStart) / state.width;
    ui.separator.classList[slide.x > 0 ? 'add' : 'remove']('to-right');
    ui.separator.classList[slide.x < 0 ? 'add' : 'remove']('to-left');
  }

  getDimensions() {
    state.height = document.documentElement.clientHeight;
    state.width = document.documentElement.clientWidth;
    if (state.width <= 450) {
      state.device = 'mobile';
    } else {
      state.device = 'pc';
    }
  }
  renderSlide(props) {
    const { icon, color, mode } = props;
    const imageClasses = ['top', 'middle', 'bottom'];
    const dom = document.querySelector(`#${icon}`);
    if (state.device === 'mobile') imageClasses.length = 1;
    const images = imageClasses.reduce((acc, cur) => {

      if (icon === 'good') {
        return acc + `
        <div class="slide__image-wrapper">
         <div class="slide__image slide__image--${cur}">
          <svg fill=${color.value} version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
              width="800px" height="800px" viewBox="0 0 512 512"  xml:space="preserve">
          <g>
            <path class="st0" d="M512,224.438c0-63.766-51.703-115.469-115.484-115.469c-8.781,0-17.328,1-25.531,2.859
              C365.656,52.984,316.219,6.875,256,6.875c-60.234,0-109.672,46.109-114.984,104.953c-8.219-1.859-16.766-2.859-25.531-2.859
              C51.703,108.969,0,160.672,0,224.438c0,47.594,28.797,88.469,69.906,106.141c-10.297,17.281-16.234,37.484-16.234,59.063
              c0,63.766,51.703,115.484,115.484,115.484c34.625,0,65.672-15.266,86.844-39.406c21.156,24.141,52.219,39.406,86.844,39.406
              c63.781,0,115.484-51.719,115.484-115.484c0-21.578-5.938-41.781-16.25-59.063C483.203,312.906,512,272.031,512,224.438z
                M256,372.531c-53.563,0-97-43.406-97-97c0-53.563,43.438-96.984,97-96.984s96.984,43.422,96.984,96.984
              C352.984,329.125,309.563,372.531,256,372.531z"/>
          </g>
          </svg>
        </div>
      </div>
      `;
    }

    if (icon == 'good2') {
      return acc + `
      <div class="slide__image-wrapper">
      <div class="slide__image slide__image--${cur}">
      <svg fill=${color.value} width="800px" height="800px" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7 4.5C7 2.01472 9.01472 0 11.5 0H15V3.5C15 5.98528 12.9853 8 10.5 8H8V15H7V11H4.5C2.01472 11 0 8.98528 0 6.5V3H3.5C4.91363 3 6.17502 3.65183 7 4.67133V4.5ZM8.14648 6.14642L11.1465 3.14642L11.8536 3.85353L8.85359 6.85353L8.14648 6.14642ZM6.14648 9.85353L3.14648 6.85353L3.85359 6.14642L6.85359 9.14642L6.14648 9.85353Z"/>
    </svg>
    </div>
    </div>
      `;
    }

    if (icon == 'good3') {
      return acc + `
      <div class="slide__image-wrapper">
      <div class="slide__image slide__image--${cur}">
      <svg fill=${color.value} width="800px" height="800px" viewBox="0 0 16 16"" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C4 1.79086 5.79086 0 8 0C9.86384 0 11.4299 1.27477 11.874 3H12C14.2091 3 16 4.79086 16 7C16 9.20914 14.2091 11 12 11H9V14H11V16H5V14H7V11H3.5C1.567 11 0 9.433 0 7.5C0 5.567 1.567 4 3.5 4H4Z"/></svg>
    </div>
    </div>
      `;
    }

    if (icon === 'bad') {
      return acc + `
      <div class="slide__image-wrapper">
       <div class="slide__image slide__image--${cur}">
       <svg fill=${color.value} version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
       viewBox="0 0 490 490" style="enable-background:new 0 0 490 490;" xml:space="preserve">
    <g>
      <g>
        <g>
          <rect x="195.3" width="99.1" height="35"/>
          <rect x="213.1" y="54.8" width="63.7" height="25.3"/>
          <path d="M308.7,155.4l-27.2-55.6h-73.1l-27.2,55.6c-12.4,26-19,54-19,82.4v234.7c0,9.7,36.9,17.5,82.8,17.5s82.8-7.8,82.8-17.5
            V237.4C327.8,209.4,321.2,181.1,308.7,155.4z"/>
        </g>
      </g>
    </g>
    </svg>      </div>
    </div>
    `;
    }

    if (icon == 'bad2') {
      return acc + `
      <div class="slide__image-wrapper">
       <div class="slide__image slide__image--${cur}">
       <svg fill=${color.value} width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M20.9348 10.2799C20.7241 10.2516 20.4301 10.25 19.9375 10.25H18.9375V8.75001H19.9375C19.9525 8.75001 19.9674 8.75001 19.9822 8.75C20.4151 8.74995 20.8119 8.74991 21.1347 8.79331C21.4902 8.8411 21.8659 8.95355 22.1749 9.26257L21.6446 9.7929L22.1749 9.26257C22.484 9.57159 22.5964 9.94732 22.6442 10.3028C22.6876 10.6256 22.6876 11.0224 22.6875 11.4553C22.6875 11.4701 22.6875 11.485 22.6875 11.5V12.5C22.6875 12.515 22.6875 12.5299 22.6875 12.5448C22.6876 12.9776 22.6876 13.3744 22.6442 13.6972C22.5964 14.0527 22.484 14.4284 22.1749 14.7374C21.8659 15.0465 21.4902 15.1589 21.1347 15.2067C20.8119 15.2501 20.4151 15.2501 19.9822 15.25C19.9674 15.25 19.9525 15.25 19.9375 15.25H18.9375V13.75H19.9375C20.4301 13.75 20.7241 13.7484 20.9348 13.7201C21.0314 13.7071 21.0798 13.6918 21.1015 13.6828C21.1066 13.6808 21.1099 13.6792 21.1118 13.6781L21.1143 13.6768L21.1156 13.6743C21.1166 13.6724 21.1183 13.6691 21.1203 13.664C21.1293 13.6423 21.1446 13.5939 21.1576 13.4973C21.1859 13.2866 21.1875 12.9926 21.1875 12.5V11.5C21.1875 11.0074 21.1859 10.7134 21.1576 10.5027C21.1446 10.4061 21.1293 10.3578 21.1203 10.336C21.1183 10.3309 21.1166 10.3276 21.1156 10.3257L21.1143 10.3232L21.1118 10.3219C21.1099 10.3209 21.1066 10.3192 21.1015 10.3172C21.0798 10.3082 21.0314 10.2929 20.9348 10.2799Z"fill-rule="evenodd"/><path clip-rule="evenodd" d="M2.67412 6.77772C2 7.78661 2 9.19108 2 12C2 14.8089 2 16.2134 2.67412 17.2223C2.96596 17.659 3.34096 18.034 3.77772 18.3259C4.78661 19 6.19108 19 9 19H13C15.8089 19 17.2134 19 18.2223 18.3259C18.659 18.034 19.034 17.659 19.3259 17.2223C20 16.2134 20 14.8089 20 12C20 9.19108 20 7.78661 19.3259 6.77772C19.034 6.34096 18.659 5.96596 18.2223 5.67412C17.2134 5 15.8089 5 13 5H9C6.19108 5 4.78661 5 3.77772 5.67412C3.34096 5.96596 2.96596 6.34096 2.67412 6.77772ZM12.6825 10.0017C12.9596 9.69385 12.9346 9.21963 12.6267 8.94254C12.3189 8.66544 11.8446 8.6904 11.5675 8.99828L9.31754 11.4983C9.11941 11.7184 9.06939 12.0346 9.18989 12.3051C9.31039 12.5757 9.57883 12.75 9.87501 12.75H10.441L9.31754 13.9983C9.04045 14.3062 9.06541 14.7804 9.37329 15.0575C9.68117 15.3346 10.1554 15.3096 10.4325 15.0017L12.6825 12.5017C12.8806 12.2816 12.9306 11.9654 12.8101 11.6949C12.6896 11.4243 12.4212 11.25 12.125 11.25H11.559L12.6825 10.0017Z"
        fill-rule="evenodd"/></svg>      </div>
    </div>
    </div>
    `;
    }

    if (icon == 'bad3') {
      return acc + `
      <div class="slide__image-wrapper">
       <div class="slide__image slide__image--${cur}">
       <svg fill=${color.value} width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.49,7.52a.19.19,0,0,1,0-.08.17.17,0,0,1,0-.07l0-.09-.06-.15,0,0h0l0,0,0,0a.48.48,0,0,0-.09-.11l-.09-.08h0l-.05,0,0,0L16.26,4.45h0l-3.72-2.3A.85.85,0,0,0,12.25,2h-.08a.82.82,0,0,0-.27,0h-.1a1.13,1.13,0,0,0-.33.13L4,6.78l-.09.07-.09.08L3.72,7l-.05.06,0,0-.06.15,0,.09v.06a.69.69,0,0,0,0,.2v8.73a1,1,0,0,0,.47.85l7.5,4.64h0l0,0,.15.06.08,0a.86.86,0,0,0,.52,0l.08,0,.15-.06,0,0h0L20,17.21a1,1,0,0,0,.47-.85V7.63S20.49,7.56,20.49,7.52ZM12,4.17l1.78,1.1L8.19,8.73,6.4,7.63Zm-1,15L5.5,15.81V9.42l5.5,3.4Zm1-8.11L10.09,9.91l5.59-3.47L17.6,7.63Zm6.5,4.72L13,19.2V12.82l5.5-3.4Z"/></svg>    </div>
    </div>
    `;
    }
    
  }, '');
    //   return acc + `
    //     <div class="slide__image-wrapper">
    //      <div class="slide__image slide__image--${cur}">
    //       <svg fill="${color.value}" viewBox="${dom.getAttribute('viewBox')}">
    //       //   <use xlink:href="#${icon}"></use>
    //       // </svg>
    //       <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
    //           width="800px" height="800px" viewBox="0 0 512 512"  xml:space="preserve">
    //       <style type="text/css">
    //       <![CDATA[
    //         .st0{fill:#000000;}
    //       ]]>
    //       </style>
    //       <g>
    //         <path class="st0" d="M512,224.438c0-63.766-51.703-115.469-115.484-115.469c-8.781,0-17.328,1-25.531,2.859
    //           C365.656,52.984,316.219,6.875,256,6.875c-60.234,0-109.672,46.109-114.984,104.953c-8.219-1.859-16.766-2.859-25.531-2.859
    //           C51.703,108.969,0,160.672,0,224.438c0,47.594,28.797,88.469,69.906,106.141c-10.297,17.281-16.234,37.484-16.234,59.063
    //           c0,63.766,51.703,115.484,115.484,115.484c34.625,0,65.672-15.266,86.844-39.406c21.156,24.141,52.219,39.406,86.844,39.406
    //           c63.781,0,115.484-51.719,115.484-115.484c0-21.578-5.938-41.781-16.25-59.063C483.203,312.906,512,272.031,512,224.438z
    //             M256,372.531c-53.563,0-97-43.406-97-97c0-53.563,43.438-96.984,97-96.984s96.984,43.422,96.984,96.984
    //           C352.984,329.125,309.563,372.531,256,372.531z"/>
    //       </g>
    //       </svg>
    //     </div>
    //   </div>
    //   `;
    // }, '');
    return `
        <div class="slide ${mode === 'color' ? 'color-mode' : ''}" data-status="active">
        <div class="slide__plate">
          <div class="slide__plate-content">
            ${images}
          </div>
        </div>
      </div>
    `.trim();
  }
  slideMove() {
    const slide = this.slides.current;
    if (slide) {
      if (slide.y !== 1) slide.y = slide.y > 1 ? 1 : slide.y + config.yVel;
      if (state.animating && !state.closerAnimation) {
        if (slide.y >= 0.3) state.animating = false;
      }
      this.slideAnimation(slide);
    }
    this.excludedSlidesMotion();
  }
  slideAnimation(slide) {

    const y = tools.yEasing(slide.y, 0, 1, 1);
    const x = tools.xEasing(Math.abs(slide.x), 0, 1, 1);

    const ry = slide.x > 0 ? 120 * slide.x : -120 * slide.x;
    const plate = slide.dom.children[0];

    const topImage = plate.querySelector('.slide__image--top');
    const middleImage = plate.querySelector('.slide__image--middle');

    tools.style(slide.dom, {
      transform: `translate3d(${slide.x * 100}%, ${y * 100}%, 0)` });

    if (state.device !== 'mobile') {
      tools.style(plate, {
        transform: `
        rotate(${25 * slide.x}deg)
        rotateX(${ry}deg)
        rotateY(${25 * slide.x}deg)` });

      if (topImage) {
        tools.style(topImage, {
          transform: `translateZ(${200 * Math.abs(x)}px)` });

      }
      if (middleImage) {
        tools.style(middleImage, {
          transform: `translateZ(${100 * Math.abs(x)}px)` });

      }
    } else {
      tools.style(plate, {
        transform: `
        rotate(${25 * slide.x}deg)
        ` });

    }
  }
  excludedSlidesMotion() {

    const exSlides = this.slides.excluded;
    exSlides.forEach(el => {
      el.x += config.xVel * Math.sign(el.x);
      el.y2 += 0.01;
      const y = tools.yEasing(el.y, 0, 1, 1);
      if (!el.excluded && Math.abs(el.x) >= 0.25) {
        el.excluded = true;
        this.generateSlide();
        state.closerAnimation = false;
      }
      if (Math.abs(el.x) >= 1) {
        el.desctruct();
        el.dom.style.display = 'none';
        this.onSlideRemoval(el);
      }
      tools.style(el.dom, {
        transform: `
          translate3d(${el.x * 100}%, ${y * 100 + el.y2 * 100}%, 0)
         ` });

    });
  }
  updateScore(action, value) {
    state.score += action ? config.score[0] + state.bonus * config.score[0] : config.score[1];
    if (typeof value !== 'undefined') state.score = value;
    let oldScore = ui.score.querySelectorAll('.score__item');
    oldScore = oldScore.length ? oldScore[oldScore.length - 1] : undefined;
    const oldDigits = oldScore ? [...oldScore.children] : 'undefined';

    const stringScore = [...('' + state.score)];
    const digits = stringScore.reduce((acc, value) => {
      return acc + `
          <div class="score__digit">${value}</div>
       `;
    }, '');
    const score = `
        <div class="score__item">
           ${digits}
        </div>
     `;
    ui.score.insertAdjacentHTML('beforeend', score);
    const delay = 50;
    setTimeout(() => {
      const items = ui.score.querySelectorAll('.score__item');
      const newDigits = [...items[items.length - 1].children];
      newDigits.reverse().forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('active');
        }, (i + 1) * delay);
      });
      if (oldDigits) {
        oldDigits.reverse().forEach((el, i) => {
          setTimeout(() => {
            el.classList.add('inactive');
            if (i === oldDigits.length - 1) ui.score.removeChild(oldScore);
          }, (i + 1) *
          delay);
        });
      }
    }, 5);
  }
  onSlideRemoval(slide) {
    this.slides.excluded.pop();
    this.slides.prev = slide;
  }
  tick() {
    const tick = () => {
      this.updateTimer();
    };
    this.tickInterval = setInterval(tick, 1000);
  }
  updateTimer(value) {
    if (typeof value !== 'undefined') {
      ui.timer.innerText = value;
      return;
    }
    state.time--;
    ui.timer.innerText = state.time;
    if (state.time === 0) this.gameOver();
  }
  loop() {
    const loop = () => {
      this.slideMove();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }}


class Slide {
  constructor(props) {
    const { dom, shape, color } = props;
    this.x = 0;
    this.y = 0;
    this.y2 = 0;
    this.excluded = false;
    this.dom = dom;
    this.color = color;
    this.shape = shape;
  }
  desctruct() {
    if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
  }}


window.onload = () => {
  window.game = new App();
};
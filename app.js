'use strict';

class MineSweeper {
  constructor(options) {
    this.el = options.el;
    this.x = options.width;
    this.y = options.height;
    this.mineCount = options.bombsCount;
    this._minePositionsArray = []; // расположение мин
    this._currentNeighborCellsArray = [];
    this._clickCounter = 0; // подсчет количества шагов
    this._emptyCellCounter = this.x * this.y;
    this._timerId = null;


    this.renderField = this.renderField.bind(this);
    this.setMinePositions = this.setMinePositions.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.onFlag = this.onFlag.bind(this);
    this.setInfoCounter = this.setInfoCounter.bind(this);
    this.checkWin = this.checkWin.bind(this);
    this.startNewGame = this.startNewGame.bind(this);


    this.renderField();
    this.setMinePositions();

    this.el.querySelector('.field').addEventListener('click', this.onCellClick);
    this.el.querySelector('.field').addEventListener('contextmenu', this.onFlag);
    this.el.querySelector('.field').addEventListener('click', this.setInfoCounter);
    this.el.querySelector('.field').addEventListener('contextmenu', this.setInfoCounter);
  }

  renderField() {
    this.table = document.createElement('table');
    this.table.classList = 'field';

    for (let i = 0; i < this.y; i++) {
      let tr = document.createElement('tr');

      tr.classList = 'field__list';
      this.table.appendChild(tr);

      for (let i = 0; i < this.x; i++) {
        let td = document.createElement('td');

        td.classList = 'field__cell empty';
        tr.appendChild(td);
      }
    }

    this.el.appendChild(this.table);

  }

  setMinePositions() {
    while(this._minePositionsArray.length < this.mineCount) {
      let checkDuplicate = 0;
      let x = Math.floor(Math.random(this.x) * this.x);
      let y = Math.floor(Math.random(this.y) * this.y);

      this._minePositionsArray.push([x,y]);

      for (let i = 0; i < this._minePositionsArray.length; i++) {

        if ((this._minePositionsArray[i][0] == x) && (this._minePositionsArray[i][1] == y)) {
          checkDuplicate++;
        }
      }

      if (checkDuplicate > 1) {
        this._minePositionsArray.pop();
      }
    }
  }

  checkCurrentCell(a, b) {
    let x = a;
    let y = b;
    let value = 0;

    for(let z = 0; z < this._minePositionsArray.length; z++) {

      if ((this._minePositionsArray[z][0] == x) && (this._minePositionsArray[z][1] == y)) {
        return -1;
      }
    }

    for(let i = -1; i < 2; i++) {
      for(let j = -1; j < 2; j++) {

        for(let z = 0; z < this._minePositionsArray.length; z++) {

          if ((this._minePositionsArray[z][0] == (x + i)) && (this._minePositionsArray[z][1] == (y + j))) {
            value++;
          }
        }
      }
    }

    return value;
  }

  renderNeighboorCells(a, b) {
    this.checkNeighborCells(a, b);

    for (let k = 0; k < this._currentNeighborCellsArray.length; k++) {
      let x = this._currentNeighborCellsArray[k][0];
      let y = this._currentNeighborCellsArray[k][1];

      this.checkNeighborCells(x, y);
    }
  }

  checkNeighborCells(x, y) {
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {

        if ((x + i) >= 0 && (x + i) < this.x) {
          if ((y + j) >= 0 && (y + j) < this.y) {
            let currentCell = this.el.querySelector('.field').rows[y + j].cells[x + i];

            if (currentCell.classList.contains('empty')) {
              let currentValue = this.checkCurrentCell( (x + i), (y + j) );

              if (!currentCell.classList.contains('flag')) {
                if (currentValue != -1) {
                  let currentValueClass = 'field__cell--value' + currentValue;
                  currentCell.classList.remove('field__cell');
                  currentCell.classList.remove('empty');
                  currentCell.classList.add(currentValueClass);

                  this._emptyCellCounter--;

                  if (currentCell.classList.contains('field__cell--value0')) {
                    this._currentNeighborCellsArray.push([x + i, y + j]);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  onCellClick(event) {
    if (this._clickCounter == 0) {
      this.setTimer();
    }

    if (event.target.classList.contains('field__cell')) {
      this._clickCounter++;
    }

    let fieldCellCheck = event.target.classList.contains('field__cell');
    if (event.target.classList.contains('flag')) {
      return;
    }

    event.target.classList.remove('empty');

    if (fieldCellCheck) {
      let x = event.target.cellIndex;
      let y = event.target.parentNode.rowIndex;

      for(let i = 0; i < this._minePositionsArray.length; i++) {
        if ((this._minePositionsArray[i][0] == x) && (this._minePositionsArray[i][1] == y)) {

          clearInterval(this._timerId);

          event.target.classList.remove('field__cell');
          event.target.classList.add('field__cell--value_mine');

          this.el.querySelector('.field').removeEventListener('click', this.onCellClick);
          this.el.querySelector('.field').removeEventListener('contextmenu', this.onFlag);

          this.warning = document.createElement('div');
          this.warning.classList = 'game__inner';
          this.warning.innerHTML = `Вы проиграли!<br/><span style="font-size: 20px;">Хотите сыграть еще раз?</span><br/><span id="yes">ДА</span> / <span id="no">НЕТ</span>`;
          this.el.appendChild(this.warning);
          document.querySelector('.game__inner').addEventListener('click', this.startNewGame);
          return;
        }
      }

      event.target.classList.remove('field__cell');

      let currentValueClass = 'field__cell--value' + this.checkCurrentCell(x, y);
      event.target.classList.add(currentValueClass);

      this._emptyCellCounter--;

      if (this.checkCurrentCell(x, y) == 0) {
        this.renderNeighboorCells(x, y);
      }
    }

    this.checkWin();
  }

  startNewGame(event) {
    if(event.target.id == 'yes') {
      document.querySelector('.game__inner').innerHTML = `
                <table class="starting">
                    <tr>
                        <td>Размер поля по горизонтали: </td>
                        <td><input value="${this.x}" id="new_x"/></td>
                    </tr>
                    <tr>
                        <td>Размер поля по вертикали: </td>
                        <td><input value="${this.y}" id="new_y"/></td>
                    </tr>
                    <tr>
                        <td>Количество мин: </td>
                        <td><input value="${this.mineCount}" id="new_mine"/></td>
                    </tr>
                </table>
                <br/>
                <span id="start">Начать</span>
            `;
      document.querySelector('.game__inner').addEventListener('click', this.startNewGame);
    }

    if(event.target.id == 'no') {
      document.querySelector('.game__inner').innerHTML = `Тогда пока!`;
    }

    if(event.target.id == 'start') {
      let x = document.querySelector('#new_x').value;
      let y = document.querySelector('#new_y').value;
      let mineCount = document.querySelector('#new_mine').value;

      this.el.removeChild(this.table);
      this.el.removeChild(this.el.querySelector('.game__inner'));
      document.querySelector('.game__info--counter').innerHTML = 0;
      document.querySelector('.game__info--timer').innerHTML = 0;

      let field = new MineSweeper({
        el: document.querySelector('#game'),
        width: x,
        height: y,
        bombsCount: mineCount
      });
    }

  }

  onFlag(event) { // TODO: сократить код
    let flagCell = event.target.classList.contains('empty');

    if (flagCell) {
      event.preventDefault();

      if (!event.target.classList.contains('flag')) {

        event.target.classList.remove('field__cell');
        event.target.classList.add('field__cell--value_flag');
        event.target.classList.add('flag');
        this._clickCounter++;
        return;
      }

      if (event.target.classList.contains('flag')) {

        event.target.classList.add('field__cell');
        event.target.classList.remove('field__cell--value_flag');
        event.target.classList.remove('flag');
        this._clickCounter--;
      }
    }
  }

  setInfoCounter() {
    document.querySelector('.game__info--counter').innerHTML = this._clickCounter;
  }

  setTimer() {
    let currentTimerValue = 1;
    this._timerId = setInterval(function () {
      document.querySelector('.game__info--timer').innerHTML = currentTimerValue;
      currentTimerValue++;
    }, 1000);
  }

  checkWin() {
    if (this._emptyCellCounter <=  this.mineCount) {
      this.warning = document.createElement('div');
      this.warning.classList = 'game__inner';
      this.warning.innerHTML = `
                Вы победили!<br/>
                <span style="font-size: 20px;">Хотите сыграть еще раз?</span><br/>
                <span id="yes">ДА</span> / <span id="no">НЕТ</span>
            `;
      this.el.appendChild(this.warning);

      document.querySelector('.game__inner').addEventListener('click', this.startNewGame);

      this.el.querySelector('.field').removeEventListener('click', this.onCellClick);
      this.el.querySelector('.field').removeEventListener('contextmenu', this.onFlag);
      this.el.querySelector('.field').removeEventListener('click', this.setInfoCounter);
      this.el.querySelector('.field').removeEventListener('contextmenu', this.setInfoCounter);
      clearInterval(this._timerId);
    }
  }

}

let field = new MineSweeper({
  el: document.querySelector('#game'),
  width: 20,
  height: 20,
  bombsCount: 15
});
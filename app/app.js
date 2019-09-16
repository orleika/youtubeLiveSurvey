(async (window, document) => {
  const store = {
    url: '',
    _title: {
      value: '',
      change: false
    },
    get title () {
      return this._title;
    },
    set title (v) {
      if (v !== this._title.value) {
        this._title.value = v;
        this._title.change = true;
      } else {
        this._title.change = false;
      }
    },
    _choices: {
      value: [],
      change: false
    },
    get choices () {
      return this._choices;
    },
    set choices (v) {
      let same = false;
      if (v.length === this._choices.value.length) {
        same = this._choices.value.every((e, i) => {
          return e === v[i];
        });
      }
      if (!same) {
        this._choices.value = v;
        this._choices.change = true;
      } else {
        this._choices.change = false;
      }
    },
    _time: {
      value: 0,
      change: false
    },
    get time () {
      return this._time;
    },
    set time (v) {
      if (v !== this._time.value) {
        this._time.value = v;
        this._time.change = true;
      } else {
        this._time.change = false;
      }
    },
    limit: 0,
    done: false,
    votesStart: null,
    ready: false,
    votes: []
  };

  const sum = function (arr) {
    return arr.reduce(function (prev, curr) {
      return prev + curr;
    });
  };

  const view = () => {
    if (store.title.change) {
      store.title = store.title.value;
      document.querySelector('#title').innerText = store.title.value;
    }

    function createChoice (text) {
      if (store.done) {

      } else {
        const choice = document.createElement('li');
        choice.classList.add('border-item');
        choice.style = 'margin-left: 0; margin-right: 0;';
        choice.innerText = text;
        return choice;
      }
    }

    if (store.choices.change) {
      store.choices = store.choices.value;
      document.querySelector('#choices').innerHTML = '';
      store.choices.value.forEach((choice) => {
        if (choice.length) {
          document.querySelector('#choices').appendChild(createChoice(choice));
        }
      });
    }

    function createStatus () {
      const statusText = document.createElement('span');
      if (store.done) {
        statusText.innerHTML = `回答数 <strong style="3rem">${sum(store.votes)}</strong>`;
      } else {
        statusText.innerHTML = `残り時間 <strong style="3rem">${store.time.value}</strong> 秒`;
      }
      return statusText;
    }
    if (store.time.change) {
      store.time = store.time.value;
      document.querySelector('#status').innerHTML = '';
      document.querySelector('#status').appendChild(createStatus());
    }
  };

  document.querySelector('#setButton').addEventListener('click', () => {
    store.url = document.querySelector('#urlField').value;
    store.title = document.querySelector('#titleField').value;
    store.limit = parseInt(document.querySelector('#limitField').value, 10);
    store.choices = [
      document.querySelector('#choiceField_1').value,
      document.querySelector('#choiceField_2').value,
      document.querySelector('#choiceField_3').value
    ];
    store.time = store.limit;
    view();
  });

  document.querySelector('#readyButton').addEventListener('click', () => {
    if (!store.url) {
      return;
    }
    window.ready(store.url);
    store.done = false;
    start();
  });

  document.querySelector('#stopButton').addEventListener('click', () => {
    window.stop();
  });

  const start = () => {
    store.votesStart = null;
    function check () {
      setTimeout(() => {
        const info = window.info();
        if (!store.votesStart && info.counting) {
          store.votesStart = Date.now();
        }
        if (info.counting) {
          const diffTime = Date.now() - store.votesStart;
          store.diff = diffTime;
          store.time = store.limit - store.diff / 1000;
          if (store.time <= 0) {
            store.time = 0;
            window.stop();
          }
        }
        if (!info.done) {
          check();
        } else {
          store.done = true;
        }
        view();
      }, 100);
    }
    check();
  };
})(window, document);

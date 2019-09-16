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
    }, 0);
  };

  const view = () => {
    if (store.title.change) {
      store.title = store.title.value;
      document.querySelector('#title').innerText = store.title.value;
    }

    function createChoice (text, i) {
      const choice = document.createElement('li');
      if (store.done) {
        choice.classList.add('border-item');
        choice.style = 'margin-left: 0; margin-right: 0;';
        const count = document.createElement('div');
        count.style = 'float: right; font-size: 1.8rem; font-weight: 500;';
        count.innerText = store.votes[i];
        choice.innerText = text;
        choice.appendChild(count);
      } else {
        choice.classList.add('border-item');
        choice.style = 'margin-left: 0; margin-right: 0;';
        choice.innerText = text;
      }
      return choice;
    }

    if (store.choices.change || store.done) {
      store.choices = store.choices.value;
      document.querySelector('#choices').innerHTML = '';
      store.choices.value.forEach((choice, index) => {
        if (choice.length) {
          document.querySelector('#choices').appendChild(createChoice(choice, index));
        }
      });
    }

    function createStatus () {
      const statusText = document.createElement('span');
      if (store.done) {
        statusText.innerHTML = `回答数 <strong style="font-size: 3rem;">${sum(store.votes)}</strong>`;
      } else {
        statusText.innerHTML = `残り時間 <strong style="font-size: 3rem;">${store.time.value}</strong> 秒`;
      }
      return statusText;
    }
    if (store.time.change || store.done) {
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
    store.done = false;
    view();
  });

  document.querySelector('#readyButton').addEventListener('click', async () => {
    if (!store.url) {
      return;
    }
    await window.ready({ url: store.url, startTime: Date.now() });
    store.done = false;
    start();
  });

  document.querySelector('#stopButton').addEventListener('click', async () => {
    await window.stop();
  });

  const start = () => {
    store.votesStart = null;
    function check () {
      setTimeout(async () => {
        const info = await window.info();
        if (!store.votesStart && info.counting) {
          store.votesStart = Date.now();
        }
        if (info.counting) {
          const diffTime = Date.now() - store.votesStart;
          store.time = parseInt(store.limit - diffTime / 1000, 10);
          if (store.time.value <= 0) {
            store.time = 0;
            await window.stop();
          }
        }
        if (!info.done) {
          check();
        } else {
          store.done = true;
          store.votes = info.votes;
        }
        view();
      }, 100);
    }
    check();
  };
})(window, document);

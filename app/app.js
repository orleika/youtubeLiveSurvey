(async (window, document) => {
  const votesStart = null;
  const ready = false;
  const store = {
    url: '',
    title: '',
    limit: '',
    choices: [],
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
    document.querySelector('#title').innerText = store.title;

    function createChoice (text, done, votes) {
      const choice = document.createElement('li');
      choice.classList.add('border-item');
      choice.style = 'margin-left: 0; margin-right: 0;';
      choice.innerText = text;
      return choice;
    }
    document.querySelector('#choices').innerHTML = '';
    store.choices.forEach((choice) => {
      if (choice.length) {
        document.querySelector('#choices').appendChild(createChoice(choice));
      }
    });

    function createLimit (limit, done, votes) {
      const limitText = document.createElement('span');
      if (done) {
        limitText.innerHTML = `総回答数 <strong style="3rem">${sum(votes)}</strong>`;
      } else {
        limitText.innerHTML = `残り時間 <strong style="3rem">${limit}</strong> 秒`;
      }
      return limitText;
    }
    document.querySelector('#limit').innerHTML = '';
    document.querySelector('#limit').appendChild(createLimit(store.limit, store.done, store.votes));
  };

  document.querySelector('#setButton').addEventListener('click', () => {
    store.url = document.querySelector('#urlField').value;
    store.title = document.querySelector('#titleField').value;
    store.limit = document.querySelector('#limitField').value;
    store.choices = [
      document.querySelector('#choiceField_1').value,
      document.querySelector('#choiceField_2').value,
      document.querySelector('#choiceField_3').value
    ];
    view();
  });

  document.querySelector('#readyButton').addEventListener('click', () => {
    window.ready(store.url);
    store.ready = true;
    store.done = false;
    start();
  });

  document.querySelector('#stopButton').addEventListener('click', () => {
    window.stop();
    store.ready = false;
  });

  const start = () => {
    store.votesStart = null;
    function check () {
      setTimeout(() => {
        let info = window.info();
        if (!store.votesStart && info.counting) {
          store.votesStart = Date.now();
        }
        const diffTime = Date.now() - votesStart;
        store.diff = diffTime;
        if (diffTime <= store.limit * 1000) {
          window.stop();
          store.ready = false;
          store.done = true;
          info = window.info();
        }
        view();
        if (ready) {
          check();
        }
      }, 100);
    }
    check();
  };
})(window, document);

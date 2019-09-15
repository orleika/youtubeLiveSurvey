const carlo = require('carlo');
const URL = require('url').URL;
const request = require('request');

const key = 'AIzaSyB6Htj_9YiEZg9JNlOzX73Nrs9r-SFoYLQ';

let capturing = false;
let counting = false;
let votes = [0, 0, 0];
let members = [];

const ready = async (url) => {
  capturing = true;
  counting = false;
  votes = [0, 0, 0];
  members = [];

  const a = liveId(url);
  const token = await chatId(a);
  let pageToken = '';
  let ccc = 1;

  function capture (wait) {
    setTimeout(async() => {
      const c = await chat(token, pageToken);
      if (c.pageToken) {
        pageToken = c.pageToken;
      }
      if (counting) {
        count(c.snippets);
      } else {
        start(c.snippets);
      }
      if (capturing) {
        capture(c.pollingIntervalMillis);
      }
    }, wait);
  }
  capture(100);
};

const stop = () => {
  capturing = false;
  counting = false;
};

const info = () => {
  return {
    capturing,
    counting,
    votes
  };
};

const liveId = (url) => {
  try {
    const base = new URL(url);
    return base.searchParams.get('v');
  } catch (err) {
    console.error(err);
  }
};

const chatId = (liveId) => {
  const api = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${liveId}&key=${key}`;
  return new Promise((resolve) => {
    request.get(api, (error, _, body) => {
      if (error) {
        console.error(error);
      } else {
        const b = JSON.parse(body);
        if (b.items && b.items.length) {
          return resolve(b.items[0].liveStreamingDetails.activeLiveChatId);
        }
      }
    });
  });
};

const chat = (chatId, pageToken = '') => {
  function filter (items) {
    return items.map((item) => {
      return {
        message: item.snippet.displayMessage,
        author: item.authorDetails.channelId,
        isChatOwner: item.authorDetails.isChatOwner
      };
    });
  }

  // https://developers.google.com/youtube/v3/live/docs/liveChatMessages
  const api = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chatId}&part=snippet%2CauthorDetails&key=${key}&pageToken=${pageToken}`;
  return new Promise((resolve) => {
    request.get(api, (error, _, body) => {
      if (error) {
        console.error(error);
      } else {
        const b = JSON.parse(body);
        if (b.items) {
          return resolve({
            pageToken: b.nextPageToken,
            pollingIntervalMillis: b.pollingIntervalMillis,
            snippets: filter(b.items)
          });
        }
        return resolve({
          pageToken: b.nextPageToken,
          pollingIntervalMillis: b.pollingIntervalMillis,
          snippets: []
        });
      }
    });
  });
};

const count = (snippets) => {
  snippets.forEach((snippet) => {
    if (!members.includes(snippet.author)) {
      if (snippet.message.trim() === '1' || snippet.message.trim() === '１') {
        votes[0]++;
      } else if (snippet.message.trim() === '2' || snippet.message.trim() === '２') {
        votes[1]++;
      } else if (snippet.message.trim() === '3' || snippet.message.trim() === '３') {
        votes[2]++;
      }
    }
  });
};

const start = (snippets) => {
  if (!snippets) {
    return;
  }
  console.log(snippets);
  for (let i = 0; i < snippets.length; i++) {
    if (snippets[i].isChatOwner) {
      counting = true;
      count(snippets.slice(i++));
      return;
    }
  }
};

(async () => {
  const app = await carlo.launch({
    width: 1280,
    height: 800
  });
  app.on('exit', () => process.exit());
  app.serveFolder(__dirname);

  app.exposeFunction('ready', (args) => {
    try {
      const context = JSON.parse(args);
      ready(context.args[0]);
    } catch (err) {
      console.error(err);
    }
  });

  app.exposeFunction('stop', () => {
    stop();
  });

  app.exposeFunction('info', () => {
    return info();
  });
  await app.load('app/app.html');
})();

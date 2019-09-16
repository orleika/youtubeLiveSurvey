const carlo = require('carlo');
const URL = require('url').URL;
const request = require('request');
require('dotenv').config();

if (!process.env.API_KEY) {
  process.exit(-1);
}
const key = process.env.API_KEY;

let readyStart = null;
let capturing = false;
let counting = false;
let votes = [0, 0, 0];
let members = [];
let done = false;

const ready = async (url, startTime) => {
  readyStart = startTime;
  capturing = true;
  counting = false;
  votes = [0, 0, 0];
  members = [];
  done = false;

  const a = liveId(url);
  const token = await chatId(a);
  let pageToken = '';

  function capture (wait) {
    setTimeout(async () => {
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
      } else {
        done = true;
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
    votes,
    done
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
        isChatOwner: item.authorDetails.isChatOwner,
        publishedAt: new Date(item.snippet.publishedAt).getTime()
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
    if (snippet.publishedAt >= readyStart && !members.includes(snippet.author)) {
      if (snippet.message.trim() === '1' || snippet.message.trim() === '１') {
        members.push(snippet.author);
        votes[0]++;
      } else if (snippet.message.trim() === '2' || snippet.message.trim() === '２') {
        members.push(snippet.author);
        votes[1]++;
      } else if (snippet.message.trim() === '3' || snippet.message.trim() === '３') {
        members.push(snippet.author);
        votes[2]++;
      }
    }
  });
};

const start = (snippets) => {
  if (!snippets) {
    return;
  }
  for (let i = 0; i < snippets.length; i++) {
    if (snippets[i].publishedAt >= readyStart && snippets[i].isChatOwner) {
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

  await app.exposeFunction('ready', (args) => {
    ready(args.url, args.startTime);
  });

  await app.exposeFunction('stop', () => {
    stop();
  });

  await app.exposeFunction('info', () => {
    return info();
  });
  await app.load('app/app.html');
})();

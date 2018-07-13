import consulMod from 'consul';

let watch = async () => Promise.resolve();
let monitor = async () => Promise.resolve(); // eslint-disable-line
const log = (...e) => console.log(e) // eslint-disable-line
let Logger = { error: log, info: log };

const setLogger = (extLogger) => { Logger = extLogger; console.log('updated logger') } // eslint-disable-line

const configInternal = {};
const watchers = [];
const listeners = {};

const listen = (fn) => {
  const id = Math.random();
  listeners[id] = fn;
  return () => delete listeners[id];
};

const updateListeners = () => Object.keys(listeners).forEach(key => listeners[key](configInternal));

if (process.env.CONSUL_HOST !== 'disabled') {
  console.log('consulconsulconsulconsulconsulconsulconsul');
  const consulConfig = {
    host: process.env.CONSUL_HOST || 'consul.sh.mml.cloud',
    port: process.env.CONSUL_PORT || '80',
  };
  const consul = consulMod(consulConfig);

  watch = async (prefix, filter) => new Promise(async (resolve) => {
    const watcher = consul.watch({
      method: consul.kv.get, options: { key: prefix, recurse: true },
    });
    let firstRun = true;
    const setKeys = {};
    watcher.on('change', (values) => {
      if (!values) return;
      const results = values
        .filter(val => !!val.Key.slice(prefix.length).length)
        .filter(filter || (() => true))
        .reduce((p, c) => { p[c.Key.slice(prefix.length)] = c.Value; return p; }, {});
      Object.keys(results).map(key => Logger.info(`got updated value for ${key}`));
      Object.assign(configInternal, results);
      Object.assign(setKeys, results);
      // short circuit so we only resolve once
      if (firstRun) {
        resolve(configInternal);
        firstRun = false;
      } else {
        Object.keys(setKeys)
          .filter(key => typeof results[key] === 'undefined' && typeof setKeys[key] !== 'undefined')
          .forEach((key) => { Logger.info(`removing config key:${key}`); delete configInternal[key]; delete setKeys[key]; });
      }
      updateListeners();
    });
    watcher.on('error', err => Logger.error('consul error', err));
    watchers.push(watcher);
  });

  monitor = async (prefix, filter) => {
    try {
      return watch(prefix, filter);
    } catch (err) {
      Logger.error(`consul error, trying to monitor ${prefix}`, err);
      return Promise.reject(err);
    }
  };
}

const config = () => configInternal;

const context = app => listen((conf) => { app.context.config = conf; });

export {
  config,
  monitor,
  listen,
  setLogger,
  context,
};

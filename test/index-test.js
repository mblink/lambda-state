const utils = require('./setup');
const State = require('../index');
const Console = require('../console');

const logLevels = ['debug', 'info', 'warn', 'error'];
const logFns = { debug: 'trace', info: 'log', warn: 'warn', error: 'error' };

describe('State', () => {
  beforeEach(() => State.init());

  describe('::init', () => {
    it('initializes a state object with an empty trace', () => expect(State.get().state.trace).to.deep.equal([]));

    it('passes options to the internal state', () => {
      State.init({ test: 'test' });
      expect(State.get().options).to.deep.equal({ test: 'test' });
    });
  });

  logLevels.forEach((level) => {
    describe(`::${level}`, () => it(`adds a trace object with level set to ${level}`, () => {
      State[level](`test ${level}`, { [`${level} key`]: `${level} value` })().then(() => {
        const state = State.get().state;
        expect(state.trace[0].level).to.equal(`${level}`);
        expect(state.trace[0].message).to.equal(`test ${level}`);
        expect(state.trace[0].aux).to.deep.equal({ [`${level} key`]: `${level} value` });
      });
    }));
  });

  describe('::finalize', () => {
    describe('logging', () => {
      it('logs with `Console.log` when the trace is empty', () => {
        utils.stub(Console, 'log');
        State.finalize(() => {});
        expect(Console.log).to.have.been.calledOnce();
      });

      logLevels.forEach((level, i) => {
        it(`logs with \`Console.${logFns[level]}\` when the trace only has ${level} statements`, () => {
          utils.stub(Console, logFns[level]);
          return State[level](level, {})().then(() => {
            State.finalize(() => {});
            expect(Console[logFns[level]]).to.have.been.calledOnce();
          });
        });

        it(`logs with \`Console.${logFns[level]}\` when the trace has levels up to ${level}`, () => {
          const levels = logLevels.slice(0, i + 1);
          levels.forEach(l => utils.stub(Console, logFns[l]));
          return Promise.all(levels.map(l => State[l](l, {})())).then(() => {
            State.finalize(() => {});
            levels.slice(0, -1).forEach(l => expect(Console[logFns[l]]).to.not.have.been.called());
            expect(Console[logFns[level]]).to.have.been.calledOnce();
          });
        });
      });

      it('logs compact JSON by default', () => {
        utils.spy(JSON, 'stringify');
        utils.stub(Console, 'log');
        return State.info('info', {})().then(() => {
          State.finalize(() => {});
          expect(JSON.stringify).to.have.been.calledOnce();
          expect(JSON.stringify).to.have.been.calledWithExactly(utils.match.object);
        });
      });

      it('formats JSON with 2 spaces if the `pretty` option is passed', () => {
        State.init({ pretty: true });
        utils.spy(JSON, 'stringify');
        utils.stub(Console, 'log');
        return State.info('info', {})().then(() => {
          State.finalize(() => {});
          expect(JSON.stringify).to.have.been.calledOnce();
          expect(JSON.stringify).to.have.been.calledWithExactly(utils.match.object, null, 2);
        });
      });
    });

    describe('callback', () => {
      logLevels.filter(l => l !== 'error').forEach((level, i) =>
        it(`calls back with success when the level is <= ${level}`, () => {
          const callback = utils.stub();
          const levels = logLevels.slice(0, i + 1);
          levels.forEach(l => utils.stub(Console, logFns[l]));
          return Promise.all(levels.map(l => State[l](l, {})())).then(() => {
            State.finalize(callback);
            expect(callback).to.have.been.calledOnce();
            expect(callback).to.have.been.calledWithExactly(null, utils.match.object);
          });
        }));

      it('calls back with error when the level is error', () => {
        const callback = utils.stub();
        utils.stub(Console, 'error');
        return State.error('error', {})().then(() => {
          State.finalize(callback);
          expect(callback).to.have.been.calledOnce();
          expect(callback).to.have.been.calledWithExactly(utils.match.object);
        });
      });
    });
  });
});

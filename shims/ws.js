const FallbackWebSocket = class {
  constructor(...args) {
    if (typeof globalThis.WebSocket === 'function') {
      return new globalThis.WebSocket(...args);
    }

    throw new Error('WebSocket is not available in this runtime');
  }
};

const WS = typeof globalThis.WebSocket === 'function' ? globalThis.WebSocket : FallbackWebSocket;

module.exports = WS;
module.exports.default = WS;

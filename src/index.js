import React from 'react';
import { render } from 'react-dom';
import { App } from './js/App';
import WebSocket from 'ws';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

class Controller {
  constructor (uuid) {
    this.uuid = uuid;

    this.ws = new WebSocket('ws://localhost:8081');
    this.ws.onmessage = (this.receiveMessage.bind(this));
  }

  receiveMessage (msg) {
    console.log(msg);
    this.receivePaddlePosition(JSON.parse(msg.data));
  }

  receivePaddlePosition (msg) {
    const {uuid, newPos} = msg;
    if(this.uuid !== uuid) {
      cmp.state.paddle1.pos.z = newPos;
    }
  }

  onSendMyPaddlePosition (newPos) {
    let msg = {uuid: this.uuid, newPos};
    this.ws.send(JSON.stringify(msg));
  }
}

let controller = new Controller(guid());
let cmp = render(<App controller={controller} />, document.getElementById('root'));


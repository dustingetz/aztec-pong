import React from 'react';
import { render } from 'react-dom';
import { App } from './js/App';
import WebSocket from 'ws';


class Controller {
  constructor (player) {
    this.player = player;

    this.ws = new WebSocket('ws://localhost:8081');
    this.ws.onmessage = (this.receiveMessage.bind(this));
  }

  receiveMessage (msg) {
    console.log(msg.data, msg);
    this.receivePaddlePosition(JSON.parse(msg.data));
  }

  receivePaddlePosition (msg) {
    const {newPos} = msg;
    cmp.state[`paddle${msg.uuid}`].pos.z = newPos;
  }

  onSendMyPaddlePosition (newPos) {
    let msg = {uuid: this.player, newPos};
    this.ws.send(JSON.stringify(msg));
  }
}

let player = window.location.search.substr(1);

let controller = new Controller(player);
let cmp = render(<App player={player} controller={controller} />, document.getElementById('root'));


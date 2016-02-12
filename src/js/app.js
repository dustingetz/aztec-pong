import 'aframe-core';
import 'babel-polyfill';
import {Animation, Entity, Scene} from 'aframe-react';
import React from 'react';
import ReactDOM from 'react-dom';

import rgbToHex from './util/util.js';
import Camera from './components/Camera';
import Cursor from './components/Cursor';
import Light from './components/Light';
import Sky from './components/Sky';

THREE.Vector3.prototype.toAframeString = function() {return `${this.x} ${this.y} ${this.z}`};
window.V3 = (x, y, z) => new THREE.Vector3(x, y, z);
window.V3toStr = (x, y, z) => V3(x, y, z).toAframeString();

class Paddle extends React.Component {
  render() {
    const {width, height, depth, color} = this.props;
    return (
      <Entity geometry={{primitive: 'box', width, height, depth}}
              material={{color}}
              position={this.props.position}
              rotation="0 90 0">
      </Entity>
    );
  }
}

class Arena extends React.Component {
  render() {
    const {width, height, depth} = this.props;
    return (
      <Entity geometry={{primitive: 'box', width, height, depth}}
            material={{color: '#fff'}}
            position={this.props.position}
            rotation="0 90 0">
      </Entity>
    );
  }
}

class Ball extends React.Component {
  render() {
    return (
      <Entity geometry={{primitive: 'sphere', radius: this.props.radius}}
              material={{color: this.props.color, src: 'url(images/hazard.png)'}}
              position={this.props.position}
              rotation={this.props.rotation}>
      </Entity>
    );
  }
}


export class App extends React.Component {
  constructor(props) {
    super(props);
    let arenaSize = 15;

    this.tick = this.tick.bind(this);

    this.state = {
      arena: {
        width: arenaSize,
        depth: arenaSize
      },
      paddle1: {
        pos: new V3(-arenaSize/2, 0, 0),
        width: 1,
        height: 0.5,
        depth: 0.1
      },
      paddle2: {
        pos: new V3(arenaSize/2, 0, 0),
        width: 1,
        height: 0.5,
        depth: 0.1
      },
      ball: {x: 0, y: 0, z: -5, r: 0.25, rotation: 0},
      velocity: {x: 3, y: 0, z: 3},
      keys: { 38: false, 40: false },
      lightColor: "#0f0"
    }
  }

  componentDidMount() {
    window.app = this;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyDown(e) {
    this.setState({keys: Object.assign({}, this.state.keys, {[e.keyCode]: true})});
  }

  handleKeyUp(e) {
    this.setState({keys: Object.assign({}, this.state.keys, {[e.keyCode]: false})});
  }

  tick() {
    // timing
    const prevMillis = this.millis || Date.now();
    this.millis = Date.now();
    let dt_seconds = (this.millis - prevMillis) / 1000;



    let {velocity, ball, paddle1, paddle2, arena, keys} = this.state;
    let {x, y, z, r, rotation} = ball;




    // ray casting
    let c = ReactDOM.findDOMNode(this.refs.camera);
    const p = c.components.camera.camera.getWorldPosition();
    const d = c.components.camera.camera.getWorldDirection();
    const ray = new THREE.Ray(p, d);
    const plane = new THREE.Plane(new THREE.Vector3(this.props.player === '1' ? 1 : -1, 0, 0), this.state.arena.width / 2);
    const paddleZ = ray.intersectPlane(plane).z;


    let isCollision = paddle => Math.abs(paddle.pos.z - ball.z) < (paddle.width / 2 + ball.r);

    let hitPaddle1 = () => {
      let ballEdge = ball.x - ball.r;
      let strikingSurface = paddle1.pos.x + (paddle1.depth / 2);
      let backSurface = paddle1.pos.x - (paddle1.depth / 2);

      if (ballEdge < strikingSurface && ballEdge > backSurface && isCollision(paddle1)) {
        velocity = Object.assign({}, velocity, {x: Math.abs(velocity.x)});
      }
    };

    let hitPaddle2 = () => {
      let ballEdge = ball.x + ball.r;
      let strikingSurface = paddle2.pos.x - (paddle2.depth / 2);
      let backSurface = paddle2.pos.x + (paddle2.depth / 2);

      if (ballEdge > strikingSurface && ballEdge < backSurface && isCollision(paddle2)) {
        velocity = Object.assign({}, velocity, {x: -1 * Math.abs(velocity.x)});
      }
    };
    hitPaddle1();
    hitPaddle2();

    const mypaddle = this.props.player === '1' ? paddle1 : paddle2;

    // keyboard controls to move paddles
    const dPaddle = 10 * dt_seconds;
    if (keys[38] && mypaddle.pos.z - mypaddle.width/2 >= -arena.width/2) {
      mypaddle.pos.z -= dPaddle;
      //this.state.paddle2.pos.z = paddle2.pos.z + dPaddle;
    }
    if (keys[40] && mypaddle.pos.z + mypaddle.width/2 <= arena.width/2) {
      mypaddle.pos.z += dPaddle;
      //this.state.paddle2.pos.z = paddle2.pos.z - dPaddle;
    }

    const w = this.state.arena.width / 2;
    mypaddle.pos.z = THREE.Math.clamp(paddleZ, -w, w);

    //hit wall
    if (ball.z - ball.r < -arena.width/2) {
      velocity = Object.assign({}, velocity, {z: Math.abs(velocity.z)});
    }
    if (ball.z + ball.r > arena.width/2) {
      velocity = Object.assign({}, velocity, {z: -1 * Math.abs(velocity.z)});
    }

    let out_of_arena = Math.abs(ball.x) > 23/2;
    if (out_of_arena) {
      this.state.lightColor = "#0f0";
      this.state.ball = {x: 0, y, z, r, rotation};
    } else {
      let out_of_bounds = Math.abs(ball.x) > arena.width/2;
      if (out_of_bounds) {
        this.state.lightColor = "#f00";
      }

      this.state.ball.x += dt_seconds * velocity.x;
      this.state.ball.y += dt_seconds * velocity.y;
      this.state.ball.z += dt_seconds * velocity.z;

      this.state.ball.r = r;
      this.state.ball.rotation += 360 * dt_seconds;

      this.state.t += dt_seconds;
      this.state.velocity = velocity;
    }

    this.props.controller.onSendMyPaddlePosition(mypaddle.pos.z);

    this.forceUpdate();
  }

  render() {
    let {x, y, z, r, rotation} = this.state.ball;
    let {paddle1, paddle2} = this.state;

    return (
      <Scene onTick={this.tick}>
        <Entity position={`${this.props.player === '1' ? -11 : 11} 0.5 0`} rotation={`0 ${this.props.player === '1' ? -90 : 90} 0`}>
          <Entity ref="camera" camera wasd-controls look-controls>
            <Cursor />
          </Entity>
        </Entity>

        <Sky/>

        {/*Light doesn't know what to do with the position component for some reason*/}
        <Light type="ambient" color="#666"/>
        <Light type="point" intensity="1" color="#766"/>
        <Light type="point" intensity="2" distance="20" color={this.state.lightColor}/>

        <Arena position={`0 -0.4 0`} width={this.state.arena.width} height={0.1} depth={this.state.arena.depth} />

        <Paddle position={`${paddle1.pos.x} ${paddle1.pos.y} ${paddle1.pos.z}`}
                width={paddle1.width}
                height={paddle1.height}
                depth={paddle1.depth}
                color="#f00"/>
        <Paddle position={`${paddle2.pos.x} ${paddle2.pos.y} ${paddle2.pos.z}`}
                width={paddle2.width}
                height={paddle2.height}
                depth={paddle2.depth}
                color="#00f"/>

        <Ball position={`${x} ${y} ${z}`} rotation={`0 ${rotation} 0`} radius={r}/>
      </Scene>
    );
  }
}

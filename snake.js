SCALE = 20;
WIDTH = 30;
HEIGHT = 30;
SPEED = 400;

/** One-time setup: find HTML canvas element */

const canvas = document.getElementById('board');
canvas.setAttribute('height', HEIGHT * SCALE);
canvas.setAttribute('width', WIDTH * SCALE);
const ctx = canvas.getContext('2d');

/** Point:
 * defines coordinates on gameboard. Could be for either snake or food.
 */

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x * SCALE, this.y * SCALE, SCALE / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    static newRandom() {
        const randRange = (low, hi) => low + Math.floor(Math.random() * (hi - low));
        return new Point(randRange(1, WIDTH), randRange(1, HEIGHT));
    }

    isOutOfBound() {
        return this.x <= 0 || this.x >= WIDTH || this.y <= 0 || this.y >= HEIGHT;
    }
}

/** Food pellet */

class Pellet {
    constructor(x, y) {
        this.pt = new Point(x, y);

    }

    static newRandom() {
        const pt = Point.newRandom();
        return new Pellet(pt.x, pt.y);
    }

    draw() {
        this.pt.draw('green');
    }
}

/** Snake */
class Snake {
    constructor(keymap, start, dir, color = "orange") {
        this.keymap = keymap; // mapping of keys to directions
        this.parts = [start]; // list of x-y coordinates of parts
        this.dir = dir; // dir to move on next move
        this.growBy = 0; // how many to grow by (goes up after eating)
        this.color = color
    }


    draw() {
        for (const p of this.parts) p.draw(this.color);
    }

    contains(pt, arr = this.parts) {
        return arr.some(me => me.x === pt.x && me.y === pt.y);
    }

    crashIntoSelf() {
        const headless = this.parts.slice(1);
        return this.contains(this.head(), headless);
    }

    crashIntoOtherSnake(otherSnake) {
        const head = this.head()
        return otherSnake.parts.some(o => o.x === head.x && o.y === head.y)
    }

    crashIntoWall() {
        return this.head().isOutOfBound();
    }

    head() {
        return this.parts[0];
    }

    //a move adds a new head(first circle) and removes the tail(last circle)
    move() {
        const { x, y } = this.head();
        let pt;

        if (this.dir === 'left') pt = new Point(x - 1, y);
        if (this.dir === 'right') pt = new Point(x + 1, y);
        if (this.dir === 'up') pt = new Point(x, y - 1);
        if (this.dir === 'down') pt = new Point(x, y + 1);
        this.parts.unshift(pt);
    }

    //snake handles its own moving by calling the game's key handler
    handleKey(key) {
        if (this.keymap[key] !== undefined) this.changeDir(this.keymap[key]);
    }

    changeDir(dir) {
        if ((this.dir === "left" || this.dir === "right") && (dir === "left" || dir === "right")) {
            this.dir = this.dir;
        }
        else if ((this.dir === "up" || this.dir === "down") && (dir === "up" || dir === "down")) {
            this.dir = this.dir;
        }
        else {
            this.dir = dir
        }
    }

    grow() {
        this.growBy += 2;
    }

    truncate() {
        if (this.growBy === 0) this.parts.pop();
        else this.growBy--;
    }

    eats(food) {
        const head = this.head();
        return food.find(f => f.pt.x === head.x && f.pt.y === head.y);
    }
}

/** Overall game. */

class Game {
    constructor(snakes) {
        this.snakes = snakes;
        this.food = [];
        this.numFood = 3;

        this.interval = null;
        //binds instance of game to the key listener so that when onkey is called "this" references the instance of game, and not window.
        this.keyListener = this.onkey.bind(this);
    }

    refillFood() {
        while (this.food.length < this.numFood) {
            let newPellet = Pellet.newRandom();
            if (this.snakes.every(s => !s.contains(newPellet))) {
                this.food.push(newPellet);
            }
        }
    }

    play() {
        document.addEventListener('keydown', this.keyListener);
        this.interval = window.setInterval(this.tick.bind(this), SPEED);
    }

    //calls the snake's key handler
    onkey(e) {
        for (let s of this.snakes) {
            s.handleKey(e.key);
        }
    }

    removeFood(pellet) {
        this.food = this.food.filter(
            f => f.pt.x !== pellet.pt.x && f.pt.y !== pellet.pt.y
        );
    }

    tick() {
        console.log('tick');

        const dead = this.snakes.some(s => s.crashIntoSelf() || s.crashIntoWall() || this.snakes.filter(os => os !== s).some(os => s.crashIntoOtherSnake(os)))

        if (!dead) {
            ctx.clearRect(0, 0, SCALE * WIDTH, SCALE * HEIGHT);
            for (const f of this.food) {
                f.draw();
            }
            for (const s of this.snakes) {
                let eaten
                s.move();
                s.truncate();
                s.draw();
                if ((eaten = s.eats(this.food))) {
                    this.removeFood(eaten);
                    s.grow();
                }
            }
            this.refillFood();
        } else {
            alert('GAME OVER')
            window.clearInterval(this.interval);
            window.removeEventListener('keydown', this.keyListener);
        }
    }
}

const snake1 = new Snake(
    { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' },
    new Point(20, 20),
    'right', 'purple'
);

const snake2 = new Snake(
    { a: 'left', d: 'right', w: 'up', s: 'down' },
    new Point(10, 10),
    'right', 'pink'
);

const game = new Game([snake1, snake2]);
game.play();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: 10, y: 10}
];
let enemySnake = [];
let enemyDx = 0;
let enemyDy = 0;
let food = {};
let obstacles = [];
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = true;

function randomTilePosition() {
    return {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

function generateFood() {
    food = randomTilePosition();
    
    while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
           obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y) ||
           enemySnake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = randomTilePosition();
    }
}

function initializeEnemySnake() {
    enemySnake = [];
    let startX = Math.floor(tileCount * 0.75);
    let startY = Math.floor(tileCount * 0.75);
    
    for (let i = 0; i < 7; i++) {
        enemySnake.push({x: startX, y: startY + i});
    }
    
    enemyDx = 0;
    enemyDy = -1;
}

function getDistanceToPlayer(x, y) {
    const playerHead = snake[0];
    return Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
}

function getPossibleMoves(snakeX, snakeY) {
    const moves = [
        {dx: 0, dy: -1, x: snakeX, y: snakeY - 1},
        {dx: 0, dy: 1, x: snakeX, y: snakeY + 1},
        {dx: -1, dy: 0, x: snakeX - 1, y: snakeY},
        {dx: 1, dy: 0, x: snakeX + 1, y: snakeY}
    ];
    
    return moves.filter(move => {
        if (move.x < 0 || move.x >= tileCount || move.y < 0 || move.y >= tileCount) return false;
        if (enemySnake.some(segment => segment.x === move.x && segment.y === move.y)) return false;
        if (obstacles.some(obstacle => obstacle.x === move.x && obstacle.y === move.y)) return false;
        if (enemyDx !== 0 && move.dx === -enemyDx) return false;
        if (enemyDy !== 0 && move.dy === -enemyDy) return false;
        return true;
    });
}

function advanceEnemySnake() {
    const head = enemySnake[0];
    const possibleMoves = getPossibleMoves(head.x, head.y);
    
    if (possibleMoves.length === 0) {
        const backupMoves = [
            {dx: 0, dy: -1, x: head.x, y: head.y - 1},
            {dx: 0, dy: 1, x: head.x, y: head.y + 1},
            {dx: -1, dy: 0, x: head.x - 1, y: head.y},
            {dx: 1, dy: 0, x: head.x + 1, y: head.y}
        ].filter(move => 
            move.x >= 0 && move.x < tileCount && 
            move.y >= 0 && move.y < tileCount &&
            !obstacles.some(obstacle => obstacle.x === move.x && obstacle.y === move.y)
        );
        
        if (backupMoves.length > 0) {
            const randomMove = backupMoves[Math.floor(Math.random() * backupMoves.length)];
            enemyDx = randomMove.dx;
            enemyDy = randomMove.dy;
        }
    } else {
        const movesWithDistance = possibleMoves.map(move => ({
            ...move,
            distance: getDistanceToPlayer(move.x, move.y)
        }));
        
        const farMoves = movesWithDistance.filter(move => move.distance >= 3);
        const safeMoves = farMoves.length > 0 ? farMoves : movesWithDistance.filter(move => move.distance >= 2);
        const finalMoves = safeMoves.length > 0 ? safeMoves : movesWithDistance;
        
        const bestMove = finalMoves.reduce((best, current) => 
            current.distance > best.distance ? current : best
        );
        
        enemyDx = bestMove.dx;
        enemyDy = bestMove.dy;
    }
    
    const newHead = {x: head.x + enemyDx, y: head.y + enemyDy};
    enemySnake.unshift(newHead);
    enemySnake.pop();
}

function generateObstacles() {
    obstacles = [];
    const numObstacles = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numObstacles; i++) {
        let obstacle = randomTilePosition();
        
        while (snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
               obstacles.some(existing => existing.x === obstacle.x && existing.y === obstacle.y) ||
               (obstacle.x === food.x && obstacle.y === food.y)) {
            obstacle = randomTilePosition();
        }
        
        obstacles.push(obstacle);
    }
}

function drawGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
    
    ctx.fillStyle = 'orange';
    enemySnake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
    
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    
    ctx.fillStyle = 'hotpink';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function advanceSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        return true;
    }
    
    if (enemySnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return true;
    }
    
    return false;
}

function gameOver() {
    gameRunning = false;
    gameOverElement.style.display = 'block';
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    gameOverElement.style.display = 'none';
    initializeEnemySnake();
    generateObstacles();
    generateFood();
}

function gameLoop() {
    if (!gameRunning) return;
    
    if (dx !== 0 || dy !== 0) {
        advanceSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
    }
    
    advanceEnemySnake();
    
    drawGame();
}

document.addEventListener('keydown', e => {
    if (!gameRunning) {
        if (e.code === 'Space') {
            resetGame();
        }
        return;
    }
    
    switch(e.code) {
        case 'ArrowUp':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
});

initializeEnemySnake();
generateObstacles();
generateFood();
setInterval(gameLoop, 100);
drawGame();
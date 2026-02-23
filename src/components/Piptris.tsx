import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;

type CellValue = 0 | string;
type CellState = 'clear' | 'merged';
type Cell = [CellValue, CellState];
type Stage = Cell[][];
type TetrominoShape = CellValue[][];

interface TetrominoDef {
    shape: TetrominoShape;
}

const TETROMINOS: Record<string, TetrominoDef> = {
    '0': { shape: [[0]] },
    I: { shape: [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]] },
    J: { shape: [[0, 'J', 0], [0, 'J', 0], ['J', 'J', 0]] },
    L: { shape: [[0, 'L', 0], [0, 'L', 0], [0, 'L', 'L']] },
    O: { shape: [['O', 'O'], ['O', 'O']] },
    S: { shape: [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]] },
    T: { shape: [[0, 0, 0], ['T', 'T', 'T'], [0, 'T', 0]] },
    Z: { shape: [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]] },
};

const TETROMINO_KEYS = 'IJLOSTZ';

const randomTetromino = (): TetrominoDef => {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    return TETROMINOS[key];
};

const createStage = (): Stage =>
    Array.from(Array(ROWS), () => new Array(COLS).fill([0, 'clear']) as Cell[]);

interface Player {
    pos: { x: number; y: number };
    tetromino: TetrominoShape;
    collided: boolean;
}

export function Piptris() {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [stage, setStage] = useState<Stage>(createStage());
    const [player, setPlayer] = useState<Player>({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS['0'].shape,
        collided: false,
    });
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    const playerRef = useRef(player);
    const stageRef = useRef(stage);
    const gameOverRef = useRef(gameOver);

    useEffect(() => {
        playerRef.current = player;
        stageRef.current = stage;
        gameOverRef.current = gameOver;
    }, [player, stage, gameOver]);

    const checkCollision = (p: Player, s: Stage, { x: moveX, y: moveY }: { x: number; y: number }) => {
        for (let y = 0; y < p.tetromino.length; y++) {
            for (let x = 0; x < p.tetromino[y].length; x++) {
                if (p.tetromino[y][x] !== 0) {
                    if (
                        !s[y + p.pos.y + moveY] ||
                        !s[y + p.pos.y + moveY][x + p.pos.x + moveX] ||
                        s[y + p.pos.y + moveY][x + p.pos.x + moveX][1] !== 'clear'
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const movePlayer = (dir: number) => {
        if (!checkCollision(playerRef.current, stageRef.current, { x: dir, y: 0 })) {
            setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
        }
    };

    const startGame = () => {
        setStage(createStage());
        setDropTime(1000);
        setPlayer({
            pos: { x: COLS / 2 - 2, y: 0 },
            tetromino: randomTetromino().shape,
            collided: false,
        });
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);
    };

    const drop = useCallback(() => {
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(playerRef.current, stageRef.current, { x: 0, y: 1 })) {
            setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 }, collided: false }));
        } else {
            if (playerRef.current.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
            }
            setPlayer(prev => ({ ...prev, collided: true }));
        }
    }, [level, rows]);

    const keyUp = useCallback(({ keyCode }: { keyCode: number }) => {
        if (!gameOverRef.current) {
            if (keyCode === 40) {
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    }, [level]);

    const dropPlayer = useCallback(() => {
        setDropTime(null);
        drop();
    }, [drop]);

    const rotate = (matrix: TetrominoShape, dir: number): TetrominoShape => {
        const rotated = matrix.map((_: CellValue[], index: number) => matrix.map((col: CellValue[]) => col[index]));
        if (dir > 0) return rotated.map((row: CellValue[]) => row.reverse());
        return rotated.reverse();
    };

    const playerRotate = (s: Stage, dir: number) => {
        const clonedPlayer: Player = JSON.parse(JSON.stringify(playerRef.current));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, s, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const move = useCallback(({ keyCode }: { keyCode: number }) => {
        if (!gameOverRef.current) {
            if (keyCode === 37) {
                movePlayer(-1);
            } else if (keyCode === 39) {
                movePlayer(1);
            } else if (keyCode === 40) {
                dropPlayer();
            } else if (keyCode === 38) {
                playerRotate(stageRef.current, 1);
            }
        }
    }, [dropPlayer]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => move(e);
        const handleKeyUp = (e: KeyboardEvent) => keyUp(e);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [move, keyUp]);

    useEffect(() => {
        let dropInterval: ReturnType<typeof setInterval>;
        if (dropTime) {
            dropInterval = setInterval(() => {
                drop();
            }, dropTime);
        }
        return () => clearInterval(dropInterval);
    }, [dropTime, drop]);

    useEffect(() => {
        const updateStage = (prevStage: Stage): Stage => {
            const newStage = prevStage.map((row) =>
                row.map((cell) => (cell[1] === 'clear' ? [0, 'clear'] as Cell : cell))
            );

            player.tetromino.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        newStage[y + player.pos.y][x + player.pos.x] = [
                            value,
                            `${player.collided ? 'merged' : 'clear'}` as CellState,
                        ];
                    }
                });
            });

            if (player.collided) {
                setPlayer({
                    pos: { x: COLS / 2 - 2, y: 0 },
                    tetromino: randomTetromino().shape,
                    collided: false,
                });

                let rowsCleared = 0;
                const sweptStage = newStage.reduce((ack: Stage, row) => {
                    if (row.findIndex((cell) => cell[0] === 0) === -1) {
                        rowsCleared += 1;
                        ack.unshift(new Array(newStage[0].length).fill([0, 'clear']) as Cell[]);
                        return ack;
                    }
                    ack.push(row);
                    return ack;
                }, []);

                if (rowsCleared > 0) {
                    setScore(prev => prev + [40, 100, 300, 1200][rowsCleared - 1] * (level + 1));
                    setRows(prev => prev + rowsCleared);
                }
                return sweptStage;
            }

            return newStage;
        };

        setStage(prev => updateStage(prev));
    }, [player, level]);

    return (
        <div className="h-full flex flex-col md:flex-row items-center justify-center gap-8 font-mono outline-none" tabIndex={0} data-testid="piptris-game">
            <div className="border-chunky p-4 bg-black/80 relative">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateRows: `repeat(${ROWS}, 20px)`,
                        gridTemplateColumns: `repeat(${COLS}, 20px)`,
                        gap: '1px',
                        background: 'var(--term-color)',
                        opacity: 0.2
                    }}
                    className="relative"
                    data-testid="piptris-board"
                >
                    {stage.map((row, y) =>
                        row.map((cell, x) => (
                            <div
                                key={`${y}-${x}`}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    background: cell[0] === 0 ? 'var(--term-bg)' : 'var(--term-color)',
                                    border: cell[0] === 0 ? 'none' : '1px solid var(--term-bg)',
                                }}
                            />
                        ))
                    )}
                </div>
                {gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70" data-testid="piptris-gameover">
                        <span className="text-red-500 font-bold text-2xl animate-pulse uppercase tracking-widest">GAME OVER</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 w-48">
                <div className="border-chunky-thin p-4 bg-black/50 text-center">
                    <h3 className="font-bold uppercase tracking-widest mb-2 opacity-80">SCORE</h3>
                    <p className="text-2xl crt-glow" data-testid="piptris-score">{score}</p>
                </div>
                <div className="border-chunky-thin p-4 bg-black/50 text-center">
                    <h3 className="font-bold uppercase tracking-widest mb-2 opacity-80">ROWS</h3>
                    <p className="text-2xl crt-glow" data-testid="piptris-rows">{rows}</p>
                </div>
                <div className="border-chunky-thin p-4 bg-black/50 text-center">
                    <h3 className="font-bold uppercase tracking-widest mb-2 opacity-80">LEVEL</h3>
                    <p className="text-2xl crt-glow" data-testid="piptris-level">{level}</p>
                </div>

                <button
                    onClick={startGame}
                    className="border-chunky-thin p-4 hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] transition-colors font-bold uppercase tracking-widest mt-4"
                    data-testid="piptris-start"
                >
                    {gameOver ? 'RESTART' : 'START'}
                </button>

                <div className="text-xs opacity-50 text-center mt-4">
                    Use Arrow Keys to Move/Rotate
                </div>
            </div>
        </div>
    );
}

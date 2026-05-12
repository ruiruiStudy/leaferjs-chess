import {
    type BoardState,
    type Position,
    type Side,
    PIECE_VALUES,
    getSide,
    cloneBoard,
    makeMove,
    isInCheck,
    isCheckmate,
    getAllValidMoves,
} from './chess-engine'

type Difficulty = 'easy' | 'medium' | 'hard'

const DEPTH_MAP: Record<Difficulty, number> = {
    easy: 2,
    medium: 3,
    hard: 4,
}

const POSITION_SCORES: Record<number, number[][]> = {
    7: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 2, 0, 1, 0, 1],
        [2, 0, 2, 0, 3, 0, 2, 0, 2],
        [2, 3, 2, 3, 4, 3, 2, 3, 2],
        [2, 0, 2, 0, 3, 0, 2, 0, 2],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    [-7]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [2, 0, 2, 0, 3, 0, 2, 0, 2],
        [2, 3, 2, 3, 4, 3, 2, 3, 2],
        [2, 0, 2, 0, 3, 0, 2, 0, 2],
        [1, 0, 1, 0, 2, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    4: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 2, 2, 2, 0, 0, 0],
        [0, 0, 2, 2, 3, 2, 2, 0, 0],
        [0, 2, 2, 3, 4, 3, 2, 2, 0],
        [0, 2, 2, 3, 4, 3, 2, 2, 0],
        [0, 0, 2, 2, 3, 2, 2, 0, 0],
        [0, 0, 0, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    [-4]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 2, 2, 2, 0, 0, 0],
        [0, 0, 2, 2, 3, 2, 2, 0, 0],
        [0, 2, 2, 3, 4, 3, 2, 2, 0],
        [0, 2, 2, 3, 4, 3, 2, 2, 0],
        [0, 0, 2, 2, 3, 2, 2, 0, 0],
        [0, 0, 0, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    5: [
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [1, 2, 2, 3, 4, 3, 2, 2, 1],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
    ],
    [-5]: [
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [2, 2, 2, 3, 4, 3, 2, 2, 2],
        [1, 2, 2, 3, 4, 3, 2, 2, 1],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
        [0, 0, 0, 2, 3, 2, 0, 0, 0],
    ],
    6: [
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
    ],
    [-6]: [
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
        [0, 0, 1, 2, 3, 2, 1, 0, 0],
    ],
}

function evaluateBoard(board: BoardState): number {
    let score = 0
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c]
            if (piece === 0) continue
            const absPiece = Math.abs(piece)
            let value = PIECE_VALUES[piece]
            if (POSITION_SCORES[piece]) {
                value += POSITION_SCORES[piece][r][c] * 10
            }
            if (absPiece === 7) {
                const side = getSide(piece)!
                const crossed = side === 'red' ? r <= 4 : r >= 5
                if (crossed) value += 100
            }
            score += piece > 0 ? value : -value
        }
    }
    return score
}

function sortMoves(board: BoardState, moves: { from: Position; to: Position }[]): { from: Position; to: Position }[] {
    return moves.sort((a, b) => {
        const capturedA = Math.abs(board[a.to.row][a.to.col])
        const capturedB = Math.abs(board[b.to.row][b.to.col])
        return PIECE_VALUES[capturedB] - PIECE_VALUES[capturedA]
    })
}

function minimax(
    board: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    side: Side
): number {
    if (depth === 0) return evaluateBoard(board)

    const currentSide: Side = isMaximizing ? 'red' : 'black'
    if (isCheckmate(board, currentSide)) {
        return isMaximizing ? -99999 + (DEPTH_MAP.hard - depth) : 99999 - (DEPTH_MAP.hard - depth)
    }

    let allMoves = getAllValidMoves(board, currentSide)
    if (allMoves.length === 0) {
        return isMaximizing ? -99999 + (DEPTH_MAP.hard - depth) : 99999 - (DEPTH_MAP.hard - depth)
    }

    allMoves = sortMoves(board, allMoves)

    if (isMaximizing) {
        let maxEval = -Infinity
        for (const move of allMoves) {
            const { newBoard } = makeMove(board, move.from, move.to)
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, side)
            maxEval = Math.max(maxEval, evalScore)
            alpha = Math.max(alpha, evalScore)
            if (beta <= alpha) break
        }
        return maxEval
    } else {
        let minEval = Infinity
        for (const move of allMoves) {
            const { newBoard } = makeMove(board, move.from, move.to)
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, side)
            minEval = Math.min(minEval, evalScore)
            beta = Math.min(beta, evalScore)
            if (beta <= alpha) break
        }
        return minEval
    }
}

export function getAIMove(board: BoardState, difficulty: Difficulty): { from: Position; to: Position } | null {
    const depth = DEPTH_MAP[difficulty]
    const allMoves = getAllValidMoves(board, 'black')
    if (allMoves.length === 0) return null

    if (difficulty === 'easy' && Math.random() < 0.2) {
        const idx = Math.floor(Math.random() * allMoves.length)
        return allMoves[idx]
    }

    let bestMove: { from: Position; to: Position } | null = null
    let bestScore = Infinity

    const sortedMoves = sortMoves(board, allMoves)

    for (const move of sortedMoves) {
        const { newBoard } = makeMove(board, move.from, move.to)
        const score = minimax(newBoard, depth - 1, -Infinity, Infinity, true, 'black')
        if (score < bestScore) {
            bestScore = score
            bestMove = move
        }
    }

    return bestMove
}

export function getHintMove(board: BoardState): { from: Position; to: Position } | null {
    const allMoves = getAllValidMoves(board, 'red')
    if (allMoves.length === 0) return null

    let bestMove: { from: Position; to: Position } | null = null
    let bestScore = -Infinity

    const sortedMoves = sortMoves(board, allMoves)

    for (const move of sortedMoves) {
        const { newBoard } = makeMove(board, move.from, move.to)
        const score = minimax(newBoard, 3, -Infinity, Infinity, false, 'red')
        if (score > bestScore) {
            bestScore = score
            bestMove = move
        }
    }

    return bestMove
}

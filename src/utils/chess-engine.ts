export type Side = 'red' | 'black'

export interface Position {
    row: number
    col: number
}

export type BoardState = number[][]

export interface MoveRecord {
    stepIndex: number
    from: Position
    to: Position
    piece: number
    captured: number
    timestamp: number
}

export interface GameRecord {
    id: string
    date: string
    difficulty: 'easy' | 'medium' | 'hard'
    result: 'red_win' | 'black_win' | 'draw' | 'ongoing'
    moves: MoveRecord[]
    initialBoard: BoardState
}

export const PIECE_NAMES: Record<number, string> = {
    1: '帅', 2: '仕', 3: '相', 4: '马', 5: '车', 6: '炮', 7: '兵',
    [-1]: '将', [-2]: '士', [-3]: '象', [-4]: '马', [-5]: '车', [-6]: '炮', [-7]: '卒',
}

export const PIECE_VALUES: Record<number, number> = {
    1: 10000, 2: 200, 3: 200, 4: 400, 5: 900, 6: 450, 7: 100,
    [-1]: 10000, [-2]: 200, [-3]: 200, [-4]: 400, [-5]: 900, [-6]: 450, [-7]: 100,
}

export function getSide(piece: number): Side | null {
    if (piece > 0) return 'red'
    if (piece < 0) return 'black'
    return null
}

export function createInitialBoard(): BoardState {
    return [
        [-5, -4, -3, -2, -1, -2, -3, -4, -5],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, -6, 0, 0, 0, 0, 0, -6, 0],
        [-7, 0, -7, 0, -7, 0, -7, 0, -7],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [7, 0, 7, 0, 7, 0, 7, 0, 7],
        [0, 6, 0, 0, 0, 0, 0, 6, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [5, 4, 3, 2, 1, 2, 3, 4, 5],
    ]
}

export function cloneBoard(board: BoardState): BoardState {
    return board.map(row => [...row])
}

function isInBoard(row: number, col: number): boolean {
    return row >= 0 && row <= 9 && col >= 0 && col <= 8
}

function isInPalace(row: number, col: number, side: Side): boolean {
    if (col < 3 || col > 5) return false
    if (side === 'red') return row >= 7 && row <= 9
    return row >= 0 && row <= 2
}

function hasCrossedRiver(row: number, side: Side): boolean {
    if (side === 'red') return row <= 4
    return row >= 5
}

function countPiecesBetween(board: BoardState, from: Position, to: Position): number {
    let count = 0
    if (from.row === to.row) {
        const minCol = Math.min(from.col, to.col)
        const maxCol = Math.max(from.col, to.col)
        for (let c = minCol + 1; c < maxCol; c++) {
            if (board[from.row][c] !== 0) count++
        }
    } else if (from.col === to.col) {
        const minRow = Math.min(from.row, to.row)
        const maxRow = Math.max(from.row, to.row)
        for (let r = minRow + 1; r < maxRow; r++) {
            if (board[r][from.col] !== 0) count++
        }
    }
    return count
}

function getRawMoves(board: BoardState, pos: Position): Position[] {
    const piece = board[pos.row][pos.col]
    if (piece === 0) return []

    const side = getSide(piece)!
    const absPiece = Math.abs(piece)
    const moves: Position[] = []

    switch (absPiece) {
        case 1: {
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
            for (const [dr, dc] of dirs) {
                const nr = pos.row + dr
                const nc = pos.col + dc
                if (isInPalace(nr, nc, side)) {
                    const target = board[nr][nc]
                    if (target === 0 || getSide(target) !== side) {
                        moves.push({ row: nr, col: nc })
                    }
                }
            }
            break
        }
        case 2: {
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            for (const [dr, dc] of dirs) {
                const nr = pos.row + dr
                const nc = pos.col + dc
                if (isInPalace(nr, nc, side)) {
                    const target = board[nr][nc]
                    if (target === 0 || getSide(target) !== side) {
                        moves.push({ row: nr, col: nc })
                    }
                }
            }
            break
        }
        case 3: {
            const dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]]
            const blocks = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            for (let i = 0; i < 4; i++) {
                const nr = pos.row + dirs[i][0]
                const nc = pos.col + dirs[i][1]
                const br = pos.row + blocks[i][0]
                const bc = pos.col + blocks[i][1]
                if (!isInBoard(nr, nc)) continue
                if (side === 'red' && nr < 5) continue
                if (side === 'black' && nr > 4) continue
                if (board[br][bc] !== 0) continue
                const target = board[nr][nc]
                if (target === 0 || getSide(target) !== side) {
                    moves.push({ row: nr, col: nc })
                }
            }
            break
        }
        case 4: {
            const jumps = [
                [-2, -1, -1, 0], [-2, 1, -1, 0],
                [2, -1, 1, 0], [2, 1, 1, 0],
                [-1, -2, 0, -1], [-1, 2, 0, 1],
                [1, -2, 0, -1], [1, 2, 0, 1],
            ]
            for (const [dr, dc, br, bc] of jumps) {
                const nr = pos.row + dr
                const nc = pos.col + dc
                const blockR = pos.row + br
                const blockC = pos.col + bc
                if (!isInBoard(nr, nc)) continue
                if (board[blockR][blockC] !== 0) continue
                const target = board[nr][nc]
                if (target === 0 || getSide(target) !== side) {
                    moves.push({ row: nr, col: nc })
                }
            }
            break
        }
        case 5: {
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
            for (const [dr, dc] of dirs) {
                let nr = pos.row + dr
                let nc = pos.col + dc
                while (isInBoard(nr, nc)) {
                    const target = board[nr][nc]
                    if (target === 0) {
                        moves.push({ row: nr, col: nc })
                    } else {
                        if (getSide(target) !== side) {
                            moves.push({ row: nr, col: nc })
                        }
                        break
                    }
                    nr += dr
                    nc += dc
                }
            }
            break
        }
        case 6: {
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
            for (const [dr, dc] of dirs) {
                let nr = pos.row + dr
                let nc = pos.col + dc
                let jumped = false
                while (isInBoard(nr, nc)) {
                    const target = board[nr][nc]
                    if (!jumped) {
                        if (target === 0) {
                            moves.push({ row: nr, col: nc })
                        } else {
                            jumped = true
                        }
                    } else {
                        if (target !== 0) {
                            if (getSide(target) !== side) {
                                moves.push({ row: nr, col: nc })
                            }
                            break
                        }
                    }
                    nr += dr
                    nc += dc
                }
            }
            break
        }
        case 7: {
            const forward = side === 'red' ? -1 : 1
            const fr = pos.row + forward
            if (isInBoard(fr, pos.col)) {
                const target = board[fr][pos.col]
                if (target === 0 || getSide(target) !== side) {
                    moves.push({ row: fr, col: pos.col })
                }
            }
            if (hasCrossedRiver(pos.row, side)) {
                for (const dc of [-1, 1]) {
                    const nc = pos.col + dc
                    if (isInBoard(pos.row, nc)) {
                        const target = board[pos.row][nc]
                        if (target === 0 || getSide(target) !== side) {
                            moves.push({ row: pos.row, col: nc })
                        }
                    }
                }
            }
            break
        }
    }

    return moves
}

function findKing(board: BoardState, side: Side): Position | null {
    const king = side === 'red' ? 1 : -1
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === king) {
                return { row: r, col: c }
            }
        }
    }
    return null
}

export function isKingsFacing(board: BoardState): boolean {
    const redKing = findKing(board, 'red')
    const blackKing = findKing(board, 'black')
    if (!redKing || !blackKing) return false
    if (redKing.col !== blackKing.col) return false
    return countPiecesBetween(board, redKing, blackKing) === 0
}

export function isInCheck(board: BoardState, side: Side): boolean {
    const kingPos = findKing(board, side)
    if (!kingPos) return true

    const enemySide: Side = side === 'red' ? 'black' : 'red'
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c]
            if (piece === 0) continue
            if (getSide(piece) !== enemySide) continue
            const rawMoves = getRawMoves(board, { row: r, col: c })
            if (rawMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                return true
            }
        }
    }
    return false
}

export function getValidMoves(board: BoardState, pos: Position): Position[] {
    const piece = board[pos.row][pos.col]
    if (piece === 0) return []

    const side = getSide(piece)!
    const rawMoves = getRawMoves(board, pos)

    return rawMoves.filter(to => {
        const newBoard = cloneBoard(board)
        newBoard[to.row][to.col] = newBoard[pos.row][pos.col]
        newBoard[pos.row][pos.col] = 0
        if (isInCheck(newBoard, side)) return false
        if (isKingsFacing(newBoard)) return false
        return true
    })
}

export function isValidMove(board: BoardState, from: Position, to: Position): boolean {
    const validMoves = getValidMoves(board, from)
    return validMoves.some(m => m.row === to.row && m.col === to.col)
}

export function makeMove(board: BoardState, from: Position, to: Position): { newBoard: BoardState; captured: number } {
    const newBoard = cloneBoard(board)
    const captured = newBoard[to.row][to.col]
    newBoard[to.row][to.col] = newBoard[from.row][from.col]
    newBoard[from.row][from.col] = 0
    return { newBoard, captured }
}

export function isCheckmate(board: BoardState, side: Side): boolean {
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c]
            if (piece === 0) continue
            if (getSide(piece) !== side) continue
            const moves = getValidMoves(board, { row: r, col: c })
            if (moves.length > 0) return false
        }
    }
    return true
}

export function getAllValidMoves(board: BoardState, side: Side): { from: Position; to: Position }[] {
    const allMoves: { from: Position; to: Position }[] = []
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c]
            if (piece === 0) continue
            if (getSide(piece) !== side) continue
            const from: Position = { row: r, col: c }
            const moves = getValidMoves(board, from)
            for (const to of moves) {
                allMoves.push({ from, to })
            }
        }
    }
    return allMoves
}

export function posEqual(a: Position, b: Position): boolean {
    return a.row === b.row && a.col === b.col
}

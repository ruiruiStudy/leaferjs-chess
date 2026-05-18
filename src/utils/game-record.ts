import type { GameRecord, MoveRecord, BoardState } from './chess-engine'

const STORAGE_KEY = 'chess_game_records'

export function saveGameRecord(record: GameRecord): void {
    const records = loadAllRecords()
    const idx = records.findIndex(r => r.id === record.id)
    if (idx >= 0) {
        records[idx] = record
    } else {
        records.unshift(record)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function loadAllRecords(): GameRecord[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) return []
        return JSON.parse(data) as GameRecord[]
    } catch {
        return []
    }
}

export function loadRecordById(id: string): GameRecord | null {
    const records = loadAllRecords()
    return records.find(r => r.id === id) || null
}

export function deleteRecord(id: string): void {
    const records = loadAllRecords()
    const filtered = records.filter(r => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function createGameRecord(
    difficulty: 'easy' | 'medium' | 'hard',
    initialBoard: BoardState
): GameRecord {
    return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: new Date().toISOString(),
        difficulty,
        result: 'ongoing',
        moves: [],
        initialBoard,
    }
}

export function addMoveToRecord(
    record: GameRecord,
    from: { row: number; col: number },
    to: { row: number; col: number },
    piece: number,
    captured: number
): GameRecord {
    const move: MoveRecord = {
        stepIndex: record.moves.length,
        from,
        to,
        piece,
        captured,
        timestamp: Date.now(),
    }
    return {
        ...record,
        moves: [...record.moves, move],
    }
}

export function replayBoardAtStep(
    initialBoard: BoardState,
    moves: MoveRecord[],
    step: number
): BoardState {
    let board = initialBoard.map(row => [...row])
    for (let i = 0; i < Math.min(step, moves.length); i++) {
        const move = moves[i]
        board[move.to.row][move.to.col] = board[move.from.row][move.from.col]
        board[move.from.row][move.from.col] = 0
    }
    return board
}

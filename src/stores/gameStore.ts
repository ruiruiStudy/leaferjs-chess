import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    type BoardState,
    type Position,
    type Side,
    type GameRecord,
    createInitialBoard,
    cloneBoard,
    getValidMoves,
    makeMove,
    isValidMove,
    isInCheck,
    isCheckmate,
    getSide,
    PIECE_NAMES,
} from '@/utils/chess-engine'
import { getAIMove, getHintMove } from '@/utils/chess-ai'
import {
    createGameRecord,
    addMoveToRecord,
    saveGameRecord,
    loadAllRecords,
    loadRecordById,
    deleteRecord as deleteGameRecord,
    replayBoardAtStep,
} from '@/utils/game-record'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'idle' | 'playing' | 'ended'
export type ReplayMode = 'browse' | 'sandbox'

export const useGameStore = defineStore('game', () => {
    const board = ref<BoardState>(createInitialBoard())
    const currentSide = ref<Side>('red')
    const phase = ref<GamePhase>('idle')
    const difficulty = ref<Difficulty>('medium')
    const selectedPos = ref<Position | null>(null)
    const validMoves = ref<Position[]>([])
    const hintMove = ref<{ from: Position; to: Position } | null>(null)
    const gameRecord = ref<GameRecord | null>(null)
    const capturedRed = ref<number[]>([])
    const capturedBlack = ref<number[]>([])
    const lastMove = ref<{ from: Position; to: Position } | null>(null)
    const isAiThinking = ref(false)
    const gameResult = ref<'red_win' | 'black_win' | 'draw' | null>(null)

    const historyRecords = ref<GameRecord[]>([])

    const replayStep = ref(0)
    const replayBoard = ref<BoardState | null>(null)
    const replayMode = ref<ReplayMode>('browse')
    const sandboxOriginalBoard = ref<BoardState | null>(null)

    const isRedTurn = computed(() => currentSide.value === 'red')
    const isInCheckState = computed(() => isInCheck(board.value, currentSide.value))

    function startGame(diff: Difficulty) {
        difficulty.value = diff
        board.value = createInitialBoard()
        currentSide.value = 'red'
        phase.value = 'playing'
        selectedPos.value = null
        validMoves.value = []
        hintMove.value = null
        capturedRed.value = []
        capturedBlack.value = []
        lastMove.value = null
        isAiThinking.value = false
        gameResult.value = null
        gameRecord.value = createGameRecord(diff, createInitialBoard())
    }

    function selectPiece(pos: Position) {
        if (phase.value !== 'playing') return
        if (currentSide.value !== 'red') return
        if (isAiThinking.value) return

        const piece = board.value[pos.row][pos.col]

        if (selectedPos.value) {
            if (pos.row === selectedPos.value.row && pos.col === selectedPos.value.col) {
                selectedPos.value = null
                validMoves.value = []
                return
            }

            if (piece !== 0 && getSide(piece) === 'red') {
                selectedPos.value = pos
                validMoves.value = getValidMoves(board.value, pos)
                hintMove.value = null
                return
            }

            if (isValidMove(board.value, selectedPos.value, pos)) {
                executeMove(selectedPos.value, pos)
            } else {
                selectedPos.value = null
                validMoves.value = []
            }
        } else {
            if (piece !== 0 && getSide(piece) === 'red') {
                selectedPos.value = pos
                validMoves.value = getValidMoves(board.value, pos)
                hintMove.value = null
            }
        }
    }

    function executeMove(from: Position, to: Position) {
        const piece = board.value[from.row][from.col]
        const { newBoard, captured } = makeMove(board.value, from, to)

        board.value = newBoard
        lastMove.value = { from, to }
        selectedPos.value = null
        validMoves.value = []
        hintMove.value = null

        if (captured !== 0) {
            if (captured > 0) capturedRed.value.push(captured)
            else capturedBlack.value.push(captured)
        }

        if (gameRecord.value) {
            gameRecord.value = addMoveToRecord(gameRecord.value, from, to, piece, captured)
        }

        const nextSide: Side = currentSide.value === 'red' ? 'black' : 'red'
        currentSide.value = nextSide

        if (isCheckmate(newBoard, nextSide)) {
            phase.value = 'ended'
            gameResult.value = nextSide === 'red' ? 'black_win' : 'red_win'
            if (gameRecord.value) {
                gameRecord.value.result = gameResult.value
                saveGameRecord(gameRecord.value)
            }
            return
        }

        if (nextSide === 'black') {
            triggerAI()
        }
    }

    async function triggerAI() {
        isAiThinking.value = true
        await new Promise(resolve => setTimeout(resolve, 100))

        const aiMove = getAIMove(board.value, difficulty.value)
        isAiThinking.value = false

        if (aiMove) {
            executeMove(aiMove.from, aiMove.to)
        }
    }

    function requestHint() {
        if (phase.value !== 'playing' || currentSide.value !== 'red') return
        const hint = getHintMove(board.value)
        hintMove.value = hint
    }

    function restartGame() {
        startGame(difficulty.value)
    }

    function quitGame() {
        if (gameRecord.value && phase.value === 'playing') {
            gameRecord.value.result = 'ongoing'
            saveGameRecord(gameRecord.value)
        }
        phase.value = 'idle'
        board.value = createInitialBoard()
        selectedPos.value = null
        validMoves.value = []
        hintMove.value = null
        lastMove.value = null
        isAiThinking.value = false
        gameResult.value = null
    }

    function loadHistory() {
        historyRecords.value = loadAllRecords()
    }

    function deleteHistoryRecord(id: string) {
        deleteGameRecord(id)
        loadHistory()
    }

    function startReplay(recordId: string) {
        const record = loadRecordById(recordId)
        if (!record) return

        gameRecord.value = record
        replayStep.value = 0
        replayBoard.value = cloneBoard(record.initialBoard)
        replayMode.value = 'browse'
        sandboxOriginalBoard.value = null
    }

    function replayGoToStep(step: number) {
        if (!gameRecord.value) return
        const maxStep = gameRecord.value.moves.length
        replayStep.value = Math.max(0, Math.min(step, maxStep))
        replayBoard.value = replayBoardAtStep(gameRecord.value.initialBoard, gameRecord.value.moves, replayStep.value)
    }

    function replayNext() {
        replayGoToStep(replayStep.value + 1)
    }

    function replayPrev() {
        replayGoToStep(replayStep.value - 1)
    }

    function replayFirst() {
        replayGoToStep(0)
    }

    function replayLast() {
        if (!gameRecord.value) return
        replayGoToStep(gameRecord.value.moves.length)
    }

    function enterSandbox() {
        if (!replayBoard.value) return
        sandboxOriginalBoard.value = cloneBoard(replayBoard.value)
        replayMode.value = 'sandbox'
        selectedPos.value = null
        validMoves.value = []
    }

    function exitSandbox() {
        if (sandboxOriginalBoard.value) {
            replayBoard.value = cloneBoard(sandboxOriginalBoard.value)
        }
        replayMode.value = 'browse'
        sandboxOriginalBoard.value = null
        selectedPos.value = null
        validMoves.value = []
    }

    function sandboxSelectPiece(pos: Position) {
        if (replayMode.value !== 'sandbox' || !replayBoard.value) return

        const piece = replayBoard.value[pos.row][pos.col]

        if (selectedPos.value) {
            if (pos.row === selectedPos.value.row && pos.col === selectedPos.value.col) {
                selectedPos.value = null
                validMoves.value = []
                return
            }

            if (piece !== 0) {
                const side = getSide(piece)!
                const selectedSide = getSide(replayBoard.value[selectedPos.value.row][selectedPos.value.col])!
                if (side === selectedSide) {
                    selectedPos.value = pos
                    validMoves.value = getValidMoves(replayBoard.value, pos)
                    return
                }
            }

            if (isValidMove(replayBoard.value, selectedPos.value, pos)) {
                const { newBoard } = makeMove(replayBoard.value, selectedPos.value, pos)
                replayBoard.value = newBoard
                selectedPos.value = null
                validMoves.value = []
            } else {
                selectedPos.value = null
                validMoves.value = []
            }
        } else {
            if (piece !== 0) {
                selectedPos.value = pos
                validMoves.value = getValidMoves(replayBoard.value, pos)
            }
        }
    }

    return {
        board,
        currentSide,
        phase,
        difficulty,
        selectedPos,
        validMoves,
        hintMove,
        gameRecord,
        capturedRed,
        capturedBlack,
        lastMove,
        isAiThinking,
        gameResult,
        historyRecords,
        replayStep,
        replayBoard,
        replayMode,
        sandboxOriginalBoard,
        isRedTurn,
        isInCheckState,
        startGame,
        selectPiece,
        requestHint,
        restartGame,
        quitGame,
        loadHistory,
        deleteHistoryRecord,
        startReplay,
        replayGoToStep,
        replayNext,
        replayPrev,
        replayFirst,
        replayLast,
        enterSandbox,
        exitSandbox,
        sandboxSelectPiece,
    }
})

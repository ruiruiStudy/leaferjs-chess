import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { Leafer, Rect, Ellipse, Text, Line, Group, Pen } from 'leafer-ui'
import type { BoardState, Position } from '@/utils/chess-engine'
import { PIECE_NAMES, getSide } from '@/utils/chess-engine'

const CELL_SIZE = 60
const BOARD_PADDING = 40
const PIECE_RADIUS = 26
const BOARD_WIDTH = 8 * CELL_SIZE + 2 * BOARD_PADDING
const BOARD_HEIGHT = 9 * CELL_SIZE + 2 * BOARD_PADDING

const BOARD_BG = '#DEB887'
const BOARD_LINE = '#5C3317'
const RED_COLOR = '#C41E3A'
const BLACK_COLOR = '#1A1A2E'
const SELECT_COLOR = '#D4A843'
const HINT_COLOR = 'rgba(212, 168, 67, 0.5)'
const VALID_MOVE_COLOR = 'rgba(76, 175, 80, 0.4)'

interface BoardClickHandler {
    (pos: Position): void
}

export function useChessBoard(
    containerRef: Ref<HTMLElement | null>,
    boardState: Ref<BoardState>,
    selectedPos: Ref<Position | null>,
    validMoves: Ref<Position[]>,
    hintMove: Ref<{ from: Position; to: Position } | null>,
    lastMove: Ref<{ from: Position; to: Position } | null>,
    onClick: BoardClickHandler
) {
    let leafer: Leafer | null = null
    let boardGroup: Group | null = null
    let piecesGroup: Group | null = null
    let overlayGroup: Group | null = null
    let pieceElements: Map<string, Group> = new Map()

    function posToXY(row: number, col: number): { x: number; y: number } {
        return {
            x: BOARD_PADDING + col * CELL_SIZE,
            y: BOARD_PADDING + row * CELL_SIZE,
        }
    }

    function xyToPos(x: number, y: number): Position | null {
        const col = Math.round((x - BOARD_PADDING) / CELL_SIZE)
        const row = Math.round((y - BOARD_PADDING) / CELL_SIZE)
        if (row < 0 || row > 9 || col < 0 || col > 8) return null
        const { x: cx, y: cy } = posToXY(row, col)
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        if (dist > CELL_SIZE * 0.6) return null
        return { row, col }
    }

    function drawBoard() {
        if (!boardGroup) return
        boardGroup.removeAll()

        const bg = new Rect({
            x: 0, y: 0,
            width: BOARD_WIDTH, height: BOARD_HEIGHT,
            fill: BOARD_BG,
            cornerRadius: 8,
        })
        boardGroup.add(bg)

        const borderRect = new Rect({
            x: BOARD_PADDING - 4,
            y: BOARD_PADDING - 4,
            width: 8 * CELL_SIZE + 8,
            height: 9 * CELL_SIZE + 8,
            stroke: BOARD_LINE,
            strokeWidth: 3,
            cornerRadius: 2,
        })
        boardGroup.add(borderRect)

        for (let r = 0; r < 10; r++) {
            const { x: x1, y } = posToXY(r, 0)
            const { x: x2 } = posToXY(r, 8)
            const line = new Line({
                points: [x1, y, x2, y],
                stroke: BOARD_LINE,
                strokeWidth: 1,
            })
            boardGroup.add(line)
        }

        for (let c = 0; c < 9; c++) {
            const { x, y: y1 } = posToXY(0, c)
            const { y: y2 } = posToXY(4, c)
            const line1 = new Line({
                points: [x, y1, x, y2],
                stroke: BOARD_LINE,
                strokeWidth: 1,
            })
            boardGroup.add(line1)

            const { y: y3 } = posToXY(5, c)
            const { y: y4 } = posToXY(9, c)
            const line2 = new Line({
                points: [x, y3, x, y4],
                stroke: BOARD_LINE,
                strokeWidth: 1,
            })
            boardGroup.add(line2)
        }

        const { x: lx1, y: ly1 } = posToXY(0, 3)
        const { x: lx2, y: ly2 } = posToXY(2, 5)
        const diag1 = new Line({
            points: [lx1, ly1, lx2, ly2],
            stroke: BOARD_LINE,
            strokeWidth: 1,
        })
        boardGroup.add(diag1)

        const { x: rx1, y: ry1 } = posToXY(0, 5)
        const { x: rx2, y: ry2 } = posToXY(2, 3)
        const diag2 = new Line({
            points: [rx1, ry1, rx2, ry2],
            stroke: BOARD_LINE,
            strokeWidth: 1,
        })
        boardGroup.add(diag2)

        const { x: blx1, y: bly1 } = posToXY(7, 3)
        const { x: blx2, y: bly2 } = posToXY(9, 5)
        const diag3 = new Line({
            points: [blx1, bly1, blx2, bly2],
            stroke: BOARD_LINE,
            strokeWidth: 1,
        })
        boardGroup.add(diag3)

        const { x: brx1, y: bry1 } = posToXY(7, 5)
        const { x: brx2, y: bry2 } = posToXY(9, 3)
        const diag4 = new Line({
            points: [brx1, bry1, brx2, bry2],
            stroke: BOARD_LINE,
            strokeWidth: 1,
        })
        boardGroup.add(diag4)

        const riverY1 = posToXY(4, 0).y
        const riverY2 = posToXY(5, 0).y
        const riverMidY = (riverY1 + riverY2) / 2
        const riverLeft = posToXY(0, 0).x
        const riverRight = posToXY(0, 8).x

        const riverBg = new Rect({
            x: riverLeft,
            y: riverY1 + 1,
            width: riverRight - riverLeft,
            height: riverY2 - riverY1 - 2,
            fill: '#C8A96E',
        })
        boardGroup.add(riverBg)

        const chuText = new Text({
            x: posToXY(4, 1).x,
            y: riverMidY,
            text: '楚 河',
            fontSize: 28,
            fontFamily: 'KaiTi, STKaiti, serif',
            fill: BOARD_LINE,
            textAlign: 'center',
            verticalAlign: 'middle',
        })
        boardGroup.add(chuText)

        const hanText = new Text({
            x: posToXY(4, 7).x,
            y: riverMidY,
            text: '汉 界',
            fontSize: 28,
            fontFamily: 'KaiTi, STKaiti, serif',
            fill: BOARD_LINE,
            textAlign: 'center',
            verticalAlign: 'middle',
        })
        boardGroup.add(hanText)

        drawStarPoints()
    }

    function drawStarPoints() {
        if (!boardGroup) return
        const starPositions = [
            [2, 1], [2, 7], [7, 1], [7, 7],
            [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
            [6, 0], [6, 2], [6, 4], [6, 6], [6, 8],
        ]
        const len = 8
        const gap = 4

        for (const [r, c] of starPositions) {
            const { x, y } = posToXY(r, c)
            const pen = new Pen()
            pen.stroke = BOARD_LINE
            pen.strokeWidth = 1

            if (c > 0) {
                pen.moveTo(x - gap, y - gap)
                pen.lineTo(x - gap - len, y - gap)
                pen.moveTo(x - gap, y - gap)
                pen.lineTo(x - gap, y - gap - len)
                pen.moveTo(x - gap, y + gap)
                pen.lineTo(x - gap - len, y + gap)
                pen.moveTo(x - gap, y + gap)
                pen.lineTo(x - gap, y + gap + len)
            }
            if (c < 8) {
                pen.moveTo(x + gap, y - gap)
                pen.lineTo(x + gap + len, y - gap)
                pen.moveTo(x + gap, y - gap)
                pen.lineTo(x + gap, y - gap - len)
                pen.moveTo(x + gap, y + gap)
                pen.lineTo(x + gap + len, y + gap)
                pen.moveTo(x + gap, y + gap)
                pen.lineTo(x + gap, y + gap + len)
            }

            boardGroup.add(pen)
        }
    }

    function drawPieces() {
        if (!piecesGroup || !leafer) return
        piecesGroup.removeAll()
        pieceElements.clear()

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = boardState.value[r][c]
                if (piece === 0) continue

                const { x, y } = posToXY(r, c)
                const side = getSide(piece)!
                const name = PIECE_NAMES[piece]
                const isRed = side === 'red'

                const pieceGroup = new Group({ x, y })

                const bg = new Ellipse({
                    width: PIECE_RADIUS * 2,
                    height: PIECE_RADIUS * 2,
                    fill: '#F5E6C8',
                    stroke: isRed ? RED_COLOR : BLACK_COLOR,
                    strokeWidth: 2,
                })
                pieceGroup.add(bg)

                const innerRing = new Ellipse({
                    width: PIECE_RADIUS * 2 - 6,
                    height: PIECE_RADIUS * 2 - 6,
                    fill: 'transparent',
                    stroke: isRed ? RED_COLOR : BLACK_COLOR,
                    strokeWidth: 1,
                })
                pieceGroup.add(innerRing)

                const text = new Text({
                    text: name,
                    fontSize: 24,
                    fontFamily: 'KaiTi, STKaiti, SimSun, serif',
                    fontWeight: 'bold',
                    fill: isRed ? RED_COLOR : BLACK_COLOR,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    x: -PIECE_RADIUS,
                    y: -PIECE_RADIUS,
                    width: PIECE_RADIUS * 2,
                    height: PIECE_RADIUS * 2,
                })
                pieceGroup.add(text)

                pieceGroup.data = { row: r, col: c }
                piecesGroup.add(pieceGroup)
                pieceElements.set(`${r}-${c}`, pieceGroup)
            }
        }
    }

    function drawOverlay() {
        if (!overlayGroup || !leafer) return
        overlayGroup.removeAll()

        if (lastMove.value) {
            const { from, to } = lastMove.value
            for (const pos of [from, to]) {
                const { x, y } = posToXY(pos.row, pos.col)
                const marker = new Rect({
                    x: x - CELL_SIZE / 2,
                    y: y - CELL_SIZE / 2,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    fill: 'rgba(212, 168, 67, 0.2)',
                })
                overlayGroup.add(marker)
            }
        }

        if (selectedPos.value) {
            const { x, y } = posToXY(selectedPos.value.row, selectedPos.value.col)
            const sel = new Ellipse({
                x, y,
                width: PIECE_RADIUS * 2 + 6,
                height: PIECE_RADIUS * 2 + 6,
                fill: 'transparent',
                stroke: SELECT_COLOR,
                strokeWidth: 3,
            })
            overlayGroup.add(sel)
        }

        for (const move of validMoves.value) {
            const { x, y } = posToXY(move.row, move.col)
            const target = boardState.value[move.row][move.col]
            if (target !== 0) {
                const ring = new Ellipse({
                    x, y,
                    width: PIECE_RADIUS * 2 + 6,
                    height: PIECE_RADIUS * 2 + 6,
                    fill: 'transparent',
                    stroke: 'rgba(244, 67, 54, 0.6)',
                    strokeWidth: 3,
                    dashPattern: [4, 4],
                })
                overlayGroup.add(ring)
            } else {
                const dot = new Ellipse({
                    x, y,
                    width: 16,
                    height: 16,
                    fill: VALID_MOVE_COLOR,
                })
                overlayGroup.add(dot)
            }
        }

        if (hintMove.value) {
            const { from, to } = hintMove.value
            for (const pos of [from, to]) {
                const { x, y } = posToXY(pos.row, pos.col)
                const hint = new Ellipse({
                    x, y,
                    width: PIECE_RADIUS * 2 + 10,
                    height: PIECE_RADIUS * 2 + 10,
                    fill: 'transparent',
                    stroke: HINT_COLOR,
                    strokeWidth: 3,
                    dashPattern: [6, 4],
                })
                overlayGroup.add(hint)
            }
        }
    }

    function render() {
        if (!leafer) return
        drawPieces()
        drawOverlay()
    }

    function init() {
        if (!containerRef.value) return
        destroy()

        leafer = new Leafer({
            view: containerRef.value,
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            fill: '#8B7355',
            type: 'design',
        })

        boardGroup = new Group()
        piecesGroup = new Group()
        overlayGroup = new Group()

        leafer.add(boardGroup)
        leafer.add(piecesGroup)
        leafer.add(overlayGroup)

        drawBoard()
        render()

        leafer.on('tap', (e: any) => {
            const pos = xyToPos(e.x, e.y)
            if (pos) onClick(pos)
        })
    }

    function destroy() {
        if (leafer) {
            leafer.destroy()
            leafer = null
        }
        boardGroup = null
        piecesGroup = null
        overlayGroup = null
        pieceElements.clear()
    }

    onMounted(() => {
        init()
    })

    onUnmounted(() => {
        destroy()
    })

    watch([boardState, selectedPos, validMoves, hintMove, lastMove], () => {
        render()
    }, { deep: true })

    return {
        BOARD_WIDTH,
        BOARD_HEIGHT,
        render,
        init,
        destroy,
    }
}

import { CanvasContext, createCanvasContext, createSelectorQuery, getSystemInfoSync } from '@tarojs/taro';
import { PureComponent } from 'react';
import { Canvas } from "@tarojs/components"

interface DoughnutProps {
    value: number[]
    width: number
    height: number
    radius: number
    active: number
    renderText: Function | null
    is2D: Boolean
    border: number
    activeBorder: number
    duration: number
    borderBgColor: string
    borderColors: string[]
    tipsColor: string
    tipsSize: number
    centerText: string
    centerTextSize: number
}

interface CenterPoint {
    x: number
    y: number
}

interface TextPoint {
    x: number
    y: number
    value: number
}
class Doughnut extends PureComponent<DoughnutProps, any> {
    centerPoint: CenterPoint = { x: this.props.width / 2, y: this.props.height / 2 }
    intervel = 16
    ctx: CanvasContext | null = null
    textPoints: TextPoint[] = []
    activeIndex = -1
    angles: number[] = []
    timer: ReturnType<typeof setTimeout> = setTimeout(() => { })
    canvas: any = null

    static defaultProps: DoughnutProps = {
        value: [],
        width: 200,
        height: 200,
        radius: 65,
        active: -1,
        renderText: null,
        is2D: false,
        border: 32,
        activeBorder: 36,
        duration: 600,
        borderBgColor: '#efefef',
        borderColors: ['#6d77e6', '#fe4e75', '#fcd95c', '#3bdeff'],
        tipsColor: '#ffffff',
        tipsSize: 8,
        centerText: '结果统计',
        centerTextSize: 16,
    }

    componentWillUpdate() {
        this.initCanvas()
    }

    componentDidMount() {
        this.initCanvas()
    }

    easeInQuadratic = (currentTime, startValue, changeValue, duration) => {
        currentTime /= duration
        return changeValue * currentTime * currentTime + startValue
    }

    requestAnimationFrame = (callback, lastTime = 0) => {
        const { is2D } = this.props
        const { canvas, intervel } = this
        const start = new Date().getTime()

        if (is2D && canvas && canvas.requestAnimationFrame) {
            this.timer = canvas.requestAnimationFrame(() => {
                const now = new Date().getTime()
                lastTime += now - start
                callback(lastTime)
            })
        } else {
            this.timer = setTimeout(() => {
                const now = new Date().getTime()
                lastTime += now - start
                callback(lastTime)
            }, intervel)
        }
    }

    cancelAnimationFrame() {
        const { is2D } = this.props
        const { canvas, timer } = this
        if (is2D && canvas && canvas.cancelAnimationFrame) {
            canvas.cancelAnimationFrame(timer)
        } else {
            clearTimeout(timer)
        }
    }

    animate() {
        const { border, is2D, value, duration, borderBgColor, width, height, active } = this.props
        const { ctx, timer } = this
        if (ctx) {
            if (timer) this.cancelAnimationFrame()

            const callback = lastTime => {
                ctx.clearRect(0, 0, width, height)

                lastTime = lastTime >= duration ? duration : lastTime

                if (lastTime === duration) {
                    this.cancelAnimationFrame()
                    this.activeIndex = active
                    this.init()
                    return
                }

                const ratios = value.map(i => this.easeInQuadratic(lastTime, 0, i, duration))

                this.drawArc(0, 2 * Math.PI, border, borderBgColor)
                this.drawArcs(ratios)
                this.drawCenter()

                if (!is2D) ctx.draw()

                this.requestAnimationFrame(callback, lastTime)
            }

            this.requestAnimationFrame(callback)
        } else {
            this.initCanvas()
        }
    }

    /**画中心区域 */
    drawCenter = () => {
        const { radius, border } = this.props
        const { centerPoint, ctx } = this
        const { x, y } = centerPoint
        if (ctx) {
            /**画圆遮挡 */
            ctx.beginPath()
            ctx.arc(x, y, radius - border / 2, 0, 2 * Math.PI)
            ctx.fillStyle = '#ffffff'
            ctx.fill()
            ctx.closePath()
        }
    }
    drawCenterText = () => {
        const { is2D, centerText, centerTextSize } = this.props
        const { centerPoint, ctx } = this
        const { x, y } = centerPoint

        if (ctx) {
            if (is2D) {
                ctx.font = centerTextSize.toString()
                ctx.fillStyle = '#203e62'
            } else {
                ctx.setFontSize(centerTextSize)
                ctx.setFillStyle('#203e62')
            }

            /**画圆中心的文字 */
            const { width } = ctx.measureText(centerText)
            ctx.fillText(centerText, x - width / 2, y + centerTextSize / 2)
        }
    }
    /**绘画每段百分比文本 */
    drawText() {
        const { renderText, is2D, tipsColor, tipsSize } = this.props
        const { ctx, textPoints } = this
        if (ctx) {
            if (is2D) {
                ctx.font = tipsSize.toString()
                ctx.fillStyle = tipsColor
            } else {
                ctx.setFontSize(tipsSize)
                ctx.setFillStyle(tipsColor)
            }

            textPoints.forEach((item, index) => {
                if (item.value > 0) {
                    const { width } = ctx.measureText(`${item.value}%`)
                    const x = item.x - width / 2
                    const y = item.y + tipsSize / 2
                    const text = renderText ? renderText(index) : `${item.value}%`

                    ctx.fillText(text, x, y)
                }
            })
        }
    }
    /**
     * 画弧线
     */
    drawArc(sAngle, eAngle, border, color) {
        const { centerPoint, ctx } = this
        const { x, y } = centerPoint

        if (ctx) {
            ctx.beginPath()
            ctx.lineWidth = border
            ctx.strokeStyle = color
            ctx.arc(x, y, this.props.radius, sAngle, eAngle, false)
            ctx.stroke()
            ctx.closePath()
        }
    }
    drawArcs(ratios, actived?: boolean) {
        const { radius, borderColors, border, activeBorder } = this.props
        const { centerPoint, activeIndex } = this
        const { x: _x, y: _y } = centerPoint
        const _angles: number[] = []
        const _textPoints: TextPoint[] = []
        let sAngle = 0

        ratios.forEach((item, index) => {
            const angle = (item * Math.PI) / 50
            const eAngle = sAngle + angle

            const _activeBorder = actived && activeIndex === index && ratios.length > 1 ? (activeBorder - border) * 2 : 0
            const _border = border + _activeBorder
            const _color = borderColors[index]

            this.drawArc(sAngle, eAngle, _border, _color)

            // 要绘制文本所在点的弧度
            const _angle = sAngle + angle / 2

            const x = _x + radius * Math.cos(_angle)
            const y = _y + radius * Math.sin(_angle)

            _textPoints.push({ x, y, value: item })
            _angles.push(eAngle)

            sAngle = eAngle
        })

        this.angles = _angles
        this.textPoints = _textPoints
    }
    initCanvas() {
        if (this.props.is2D) {
            createSelectorQuery()
                .select('#canvas')
                .fields({ node: true, size: true })
                .exec(res => {
                    const _canvas = res[0].node
                    const _ctx = _canvas.getContext('2d')
                    const dpr = getSystemInfoSync().pixelRatio

                    _canvas.width = res[0].width * dpr
                    _canvas.height = res[0].height * dpr

                    _ctx.scale(dpr, dpr)

                    this.canvas = _canvas
                    this.ctx = _ctx
                    if (_ctx) this.animate()
                })
        } else {
            const ctx = createCanvasContext('canvas')
            this.ctx = ctx
            if (ctx) this.animate()
        }
    }
    init() {
        const { border, is2D, value, width, height } = this.props
        const { ctx } = this
        if (ctx) {
            ctx.clearRect(0, 0, width, height)

            /**画环形图的背景 */
            this.drawArc(0, 2 * Math.PI, border, '#efefef')

            this.drawArcs(value, true)

            this.drawText()

            this.drawCenter()

            this.drawCenterText()

            if (!is2D) ctx.draw()
        }
    }
    canvasTouch = (e) => {
        const { radius, border } = this.props
        const { centerPoint, activeIndex, angles } = this
        const { x, y } = e.changedTouches[0]
        const { x: _x, y: _y } = centerPoint
        // 两点距离
        const len = Math.sqrt(Math.pow(_y - y, 2) + Math.pow(_x - x, 2))
        const borderHalf = border / 2
        // 是否在弧线内
        const isInRing = len > radius - borderHalf && len < radius + borderHalf
        let current = activeIndex

        if (isInRing) {
            // 获取圆心角
            let angle = Math.atan2(y - _y, x - _x)
            // 判断弧度是否为负，为负时需要转正
            angle = angle > 0 ? angle : 2 * Math.PI + angle

            angles.some((item, index) => {
                // 是否在弧度内
                if (item > angle) {
                    current = index
                    return true
                }
            })
        } else {
            current = -1
        }

        this.activeIndex = current
        this.init()
    }

    initStyle = () => {
        const { width, height } = this.props
        return { width: `${width}px`, height: `${height}px` }
    }

    render() {
        const { is2D } = this.props
        return (
            <Canvas
                style={this.initStyle()}
                id="canvas"
                canvas-id="canvas"
                type={is2D ? '2d' : ''}
                onTouchStart={this.canvasTouch} />
        )
    }

}

export { Doughnut }
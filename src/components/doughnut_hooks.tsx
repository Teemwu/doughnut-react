import { FC, CanvasContext, createSelectorQuery, getSystemInfoSync, createCanvasContext, nextTick } from '@tarojs/taro'
import { Canvas } from "@tarojs/components"
import { useEffect, useMemo } from 'react'

interface Props {
    value: number[],
    width: number,
    height: number,
    radius: number,
    active: number,
    renderText: Function,
    is2D: Boolean,
    border: number,
    activeBorder: number,
    duration: number,
    borderBgColor: string,
    borderColors: string[],
    tipsColor: string,
    tipsSize: number,
    centerText: string,
    centerTextSize: number
}

type CenterPoint = {
    x: number,
    y: number
}

interface TextPoint {
    x: number,
    y: number,
    value: number
}


export const Doughnut: FC<Props> = (props: Props) => {
    const centerPoint: CenterPoint = { x: props.width / 2, y: props.height / 2 }
    const intervel = 16
    let ctx: CanvasContext
    let textPoints: TextPoint[] = []
    let activeIndex = -1
    let angles: number[] = []
    let timer: ReturnType<typeof setTimeout> = setTimeout(() => { })
    let canvas: any = null

    const initStyle = useMemo(() => { return { width: `${props.width}px`, height: `${props.height}px` } }, [props.width, props.height])

    /**
    * 二次方缓动函数
    * currentTime：当前动画执行的时长
    * startValue：开始值
    * changeValue：变化量，即动画执行到最后的值
    * duration：动画持续执行的时间
    */
    function easeInQuadratic(currentTime, startValue, changeValue, duration) {
        currentTime /= duration
        return changeValue * currentTime * currentTime + startValue
    }

    function requestAnimationFrame(callback, lastTime = 0) {
        const start = new Date().getTime()

        if (props.is2D && canvas && canvas.requestAnimationFrame) {
            timer = canvas.requestAnimationFrame(() => {
                const now = new Date().getTime()
                lastTime += now - start
                callback(lastTime)
            })
        } else {
            timer = setTimeout(() => {
                const now = new Date().getTime()
                lastTime += now - start
                callback(lastTime)
            }, intervel)
        }
    }

    function cancelAnimationFrame() {
        if (props.is2D && canvas && canvas.cancelAnimationFrame) {
            canvas.cancelAnimationFrame(timer)
        } else {
            clearTimeout(timer)
        }
    }

    function animate() {
        const { border, is2D, value, duration, borderBgColor, width, height, active } = props
        if (ctx) {
            if (timer) cancelAnimationFrame()

            const callback = lastTime => {
                ctx.clearRect(0, 0, width, height)

                lastTime = lastTime >= duration ? duration : lastTime

                if (lastTime === duration) {
                    cancelAnimationFrame()
                    activeIndex = active
                    init()
                    return
                }

                const ratios = value.map(i => easeInQuadratic(lastTime, 0, i, duration))

                drawArc(0, 2 * Math.PI, border, borderBgColor)
                drawArcs(ratios)
                drawCenter()

                if (!is2D) ctx.draw()

                requestAnimationFrame(callback, lastTime)
            }

            requestAnimationFrame(callback)
        } else {
            initCanvas()
        }
    }
    /**画中心区域 */
    function drawCenter() {
        const { radius, border } = props
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
    function drawCenterText() {
        const { is2D, centerText, centerTextSize } = props
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
    function drawText() {
        const { renderText, is2D, tipsColor, tipsSize } = props

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
    function drawArc(sAngle, eAngle, border, color) {
        const { x, y } = centerPoint

        if (ctx) {
            ctx.beginPath()
            ctx.lineWidth = border
            ctx.strokeStyle = color
            ctx.arc(x, y, props.radius, sAngle, eAngle, false)
            ctx.stroke()
            ctx.closePath()
        }
    }
    function drawArcs(ratios, actived?: boolean) {
        const { radius, borderColors, border, activeBorder } = props
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

            drawArc(sAngle, eAngle, _border, _color)

            // 要绘制文本所在点的弧度
            const _angle = sAngle + angle / 2

            const x = _x + radius * Math.cos(_angle)
            const y = _y + radius * Math.sin(_angle)

            _textPoints.push({ x, y, value: item })
            _angles.push(eAngle)

            sAngle = eAngle
        })

        angles = _angles
        textPoints = _textPoints
    }
    function initCanvas() {
        nextTick(() => {
            if (props.is2D) {
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

                        canvas = _canvas
                        ctx = _ctx
                        if (ctx) animate()
                    })
            } else {
                ctx = createCanvasContext('canvas')
                if (ctx) animate()

            }
        })
    }
    function init() {
        const { border, is2D, value, width, height } = props
        if (ctx) {
            ctx.clearRect(0, 0, width, height)

            /**画环形图的背景 */
            drawArc(0, 2 * Math.PI, border, '#efefef')

            drawArcs(value, true)

            drawText()

            drawCenter()

            drawCenterText()

            if (!is2D) ctx.draw()
        }
    }
    function canvasTouch(e) {
        const { radius, border } = props
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

        activeIndex = current
        init()
    }

    useEffect(() => initCanvas())

    return (
        <Canvas
            style={initStyle}
            id="canvas"
            canvas-id="canvas"
            type={props.is2D ? '2d' : ''}
            onTouchStart={canvasTouch} />
    )
}

Doughnut.defaultProps = {
    value: [],
    width: 200,
    height: 200,
    radius: 65,
    active: -1,
    renderText: undefined,
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
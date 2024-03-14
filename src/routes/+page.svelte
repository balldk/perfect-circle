<script lang="ts">
	import { Matrix } from 'ml-matrix'
	import { Stage, Shape, Ticker, Container, Text } from '@createjs/easeljs'
	import { onMount } from 'svelte'
	import { approx, easeInOutCubic } from '$lib/helpers'
	import { fade, slide } from 'svelte/transition'

	import Fa from 'svelte-fa'
	import { faGithub, faFacebook } from '@fortawesome/free-brands-svg-icons'

	const primaryColor = '#9A3B3B'

	let isDrawing = false
	let isCircling = false
	let isStart = false

	let canvas: HTMLCanvasElement
	let stage: Stage

	let circle = new Shape()
	let handClock = new Shape()
	let graphicPoints = new Container()
	let percentTxt = new Text('', '0px "Playpen Sans"', 'black')

	let points = new Matrix([])
	let errMsg = ''
	let msg = ''
	let bestScore = 0

	onMount(() => {
		const dpr = 1.4

		// Set the "actual" size of the canvas
		canvas.width = window.innerWidth * dpr
		canvas.height = window.innerHeight * dpr

		// Set the "drawn" size of the canvas
		canvas.style.width = `${window.innerWidth}px`
		canvas.style.height = `${window.innerHeight}px`

		stage = new Stage(canvas)
		stage.scaleX = dpr
		stage.scaleY = dpr
		stage.addChild(circle)
		stage.addChild(handClock)
		stage.addChild(graphicPoints)
		stage.addChild(percentTxt)

		// Ticker.framerate = 60
		Ticker.interval = 5

		bestScore = parseFloat(localStorage.getItem('bestScore') || '0')
		msg =
			bestScore != 0
				? `Personal record: ${(bestScore * 100).toFixed(1)}%`
				: 'Draw any circle on the screen'
	})

	function draw(e: MouseEvent) {
		if (isDrawing && !isCircling) {
			let x = [e.clientX - canvas.offsetLeft, e.clientY]
			const point = new Shape()

			if (points.size === 0) {
				points = new Matrix([[x[0]], [x[1]]])

				point.graphics.beginFill(primaryColor).drawCircle(x[0], x[1], 5)
				graphicPoints.addChild(point)
				stage.update()
			} else {
				const endPoint = points.getColumnVector(points.columns - 1)
				points.addColumn(x)

				point.graphics
					.setStrokeStyle(4, 'round', 'round')
					.beginStroke('black')
					.moveTo(endPoint.get(0, 0), endPoint.get(1, 0))
					.lineTo(x[0], x[1])
					.endStroke()
				graphicPoints.addChild(point)
				stage.update()
			}
		}
	}

	function gradientDescent(): [Matrix, number, number[], number] {
		let normCoef = points.max()
		points.div(normCoef)
		let X = points.subMatrixRow([0])
		let Y = points.subMatrixRow([1])

		let center = Matrix.columnVector([X.sum() / X.size, Y.sum() / Y.size])
		const tx = Matrix.pow(Matrix.subtract(X, center.get(0, 0)), 2)
		const ty = Matrix.pow(Matrix.subtract(Y, center.get(1, 0)), 2)
		let r = Matrix.add(tx, ty).sqrt().mean()

		const nstep = 200
		const errors: number[] = []
		const learningRate = 0.02

		for (let i = 0; i < nstep; i++) {
			const tx = Matrix.subtract(X, center.get(0, 0)).mul(-1)
			const ty = Matrix.subtract(Y, center.get(1, 0)).mul(-1)
			const sqModule = Matrix.add(Matrix.pow(tx, 2), Matrix.pow(ty, 2))
			const t = Matrix.subtract(sqModule, Math.pow(r, 2))

			const Dcx = Matrix.mul(t, tx).sum()
			const Dcy = Matrix.mul(t, ty).sum()
			const Dr = -r * t.sum()

			const Dc = Matrix.columnVector([Dcx, Dcy])

			center.subtract(Matrix.mul(Dc, learningRate))
			r = r - Dr * learningRate

			const err = sqModule.sqrt().subtract(r).abs().mul(normCoef).mean()
			errors.push(err)
		}
		r = r * normCoef
		center.mul(normCoef)

		return [center, r, errors, normCoef]
	}

	function circling(center: Matrix, r: number, perfectRate: number, callback: Function) {
		isCircling = true
		let startAngle = (3 / 2) * Math.PI
		let angle = startAngle
		let t = 0
		let dt = 0.004

		stage.setChildIndex(circle, stage.numChildren - 1)
		stage.setChildIndex(handClock, stage.numChildren - 1)
		stage.setChildIndex(percentTxt, stage.numChildren - 1)
		Ticker.addEventListener('tick', (e) => {
			circle.graphics
				.clear()
				.setStrokeStyle(3, 'round', 'round')
				.beginStroke(primaryColor)
				.arc(center.get(0, 0), center.get(1, 0), r, startAngle, angle, false)

			handClock.graphics
				.clear()
				.setStrokeStyle(3)
				.beginStroke(primaryColor)
				.moveTo(center.get(0, 0), center.get(1, 0))
				.lineTo(
					r * Math.cos(angle) + center.get(0, 0),
					r * Math.sin(angle) + center.get(1, 0)
				)
				.endStroke()

			if (approx(t, 1)) {
				Ticker.removeAllEventListeners()
				isCircling = false
				callback()
			}
			stage.update()
			angle = 2 * Math.PI * easeInOutCubic(t) + startAngle
			t += dt
		})
	}

	function onMouseUp() {
		isDrawing = false
		if (points.size <= 2) {
			return
		}

		const [center, r, errors, normCoef] = gradientDescent()
		const err = errors[errors.length - 1]
		let perfectRate = 1 - (2 * err) / r

		console.clear()
		console.table({
			r: r,
			center: `(${center.get(0, 0)}, ${center.get(1, 0)})`,
			perfect_rate: perfectRate,
			initial_error: errors[0],
			error: err,
		})

		const startPoint = points.getColumnVector(0)
		const endPoint = points.getColumnVector(points.columns - 1)
		const dist = Matrix.subtract(startPoint, endPoint).norm() * normCoef

		if (perfectRate <= 0.65) {
			errMsg = 'Not a circle at all'
		} else if (dist >= 40) {
			errMsg = 'Not a closed loop'
		}

		points = new Matrix([])
		if (errMsg.length != 0) {
			return
		}

		circling(center, r, perfectRate, () => {
			let fontsize = r / 3.5
			let y = center.get(1, 0)
			if (r > 220) {
				fontsize = 45
			}
			if (r < 60) {
				fontsize = 20
				y -= r + 15
			}

			percentTxt = new Text(
				`${(perfectRate * 100).toFixed(1)}%`,
				`${fontsize}px "Playpen Sans"`,
				'black'
			)
			percentTxt.x = center.get(0, 0)
			percentTxt.y = y
			percentTxt.textBaseline = 'alphabetic'
			percentTxt.textAlign = 'center'
			stage.addChild(percentTxt)
			handClock.graphics.clear()

			if (perfectRate > bestScore) {
				bestScore = perfectRate
				localStorage.setItem('bestScore', bestScore.toString())
				msg = `New best score!`
			}
		})
	}
</script>

<svelte:window
	on:mousemove={draw}
	on:mousedown={() => {
		if (isCircling) {
			return
		}
		isStart = true
		isDrawing = true
		graphicPoints.removeAllChildren()
		circle.graphics.clear()
		errMsg = ''
		msg = bestScore != 0 ? `Personal record: ${(bestScore * 100).toFixed(1)}%` : ''
		percentTxt.text = ''
		stage.update()
	}}
	on:mouseup={onMouseUp}
/>

<canvas bind:this={canvas} width="1000" height="1000" />

{#if !isStart}
	<div transition:fade class="header">
		<h1>Can you draw a perfect circle?</h1>
	</div>
{/if}
{#key errMsg + msg}
	<p transition:slide class="msg">{errMsg || msg}</p>
{/key}
<div class="info">
	<a target="_blank" href="https://github.com/balldk/perfect-circle"
		><Fa icon={faGithub} size="2x" scale={0.95} /></a
	>
	<a target="_blank" href="https://www.facebook.com/code.van.code.vo"
		><Fa icon={faFacebook} size="2x" scale={0.95} /></a
	>
</div>

<style lang="scss">
	canvas {
		position: fixed;
		left: 0;
		top: 0;
		background-color: rgb(255, 245, 234);
	}
	.msg {
		font-family: 'Playpen Sans', cursive;
		position: fixed;
		display: block;
		width: 100vw;
		text-align: center;
		bottom: 10px;
		left: 0;
		font-size: 30px;
	}
	.header {
		font-family: 'Honk', system-ui;
		position: fixed;
		width: 100vw;
		height: 100px;
		top: 0;
		left: 0;
		font-size: 45px;
		text-align: center;
		font-variation-settings:
			'MORF' 17,
			'SHLN' 50;
	}
	.info {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 100px;
		height: 50px;

		a {
			color: black;
			margin-left: 5px;
		}
	}
</style>

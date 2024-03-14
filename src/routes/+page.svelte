<script lang="ts">
	import { Matrix } from 'ml-matrix'
	import { Stage, Shape, Ticker, Container, Text } from 'createjs-module'
	import { onMount } from 'svelte'

	let isDrawing = false
	let isCircling = false
	let isStart = false

	let canvas: HTMLCanvasElement
	let stage: Stage

	let circle = new Shape()
	let hand = new Shape()
	let graphicPoints = new Container()
	let txt = new Text()

	let points = new Matrix([[0], [0]])
	let n = 0
	let errMsg = ''

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
		stage.addChild(hand)
		stage.addChild(graphicPoints)
		stage.addChild(txt)

		Ticker.framerate = 20
		Ticker.interval = 1
	})

	function draw(e: MouseEvent) {
		if (isDrawing && !isCircling) {
			let x = [e.clientX - canvas.offsetLeft, e.clientY]
			const point = new Shape()

			if (n == 0) {
				points.setColumn(0, x)

				point.graphics.beginFill('#9A3B3B').drawCircle(x[0], x[1], 5)
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

			n += 1
		}
	}

	function approx(a: number, b: number, eps = 0.00001): boolean {
		return Math.abs(a - b) < eps
	}
	function easeInOutCubic(x: number): number {
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
	}

	function calculateScore() {
		if (points.size <= 2) {
			return
		}

		let normCoef = points.max()
		points.div(normCoef)
		let X = points.subMatrixRow([0])
		let Y = points.subMatrixRow([1])

		let center = Matrix.columnVector([X.sum() / X.size, Y.sum() / Y.size])
		const tx = Matrix.pow(Matrix.subtract(X, center.get(0, 0)), 2)
		const ty = Matrix.pow(Matrix.subtract(Y, center.get(1, 0)), 2)
		let r = Matrix.add(tx, ty).sqrt().mean()

		// gradient descent
		const nstep = 300
		const errors = []
		const learningRate = 0.01

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

			const err = sqModule.sqrt().subtract(r).abs().mean()
			errors.push(err)
		}
		r = r * normCoef
		center.mul(normCoef)

		console.clear()

		const err = errors[errors.length - 1]
		let perfectRate = 1 - (2 * err) / (r / normCoef)

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

		points = new Matrix([[0], [0]])
		n = 0
		if (errMsg.length != 0) {
			return
		}

		isCircling = true
		let startAngle = (3 / 2) * Math.PI
		let angle = startAngle
		let t = 0

		stage.setChildIndex(circle, stage.numChildren - 1)
		stage.setChildIndex(hand, stage.numChildren - 1)
		stage.setChildIndex(txt, stage.numChildren - 1)
		Ticker.on('tick', (e) => {
			circle.graphics
				.clear()
				.setStrokeStyle(3, 'round', 'round')
				.beginStroke('#9A3B3B')
				.arc(center.get(0, 0), center.get(1, 0), r, startAngle, angle, false)

			hand.graphics
				.clear()
				.setStrokeStyle(3)
				.beginStroke('#9A3B3B')
				.moveTo(center.get(0, 0), center.get(1, 0))
				.lineTo(
					r * Math.cos(angle) + center.get(0, 0),
					r * Math.sin(angle) + center.get(1, 0)
				)
				.endStroke()

			if (approx(t, 1)) {
				let fontsize = r / 3.5
				let y = center.get(1, 0)
				if (r > 220) {
					fontsize = 45
				}
				if (r < 60) {
					fontsize = 20
					y -= r + 15
				}

				Ticker.removeAllEventListeners()
				txt = new Text(
					`${(perfectRate * 100).toFixed(2)}%`,
					`${fontsize}px "Playpen Sans"`,
					'black'
				)
				txt.x = center.get(0, 0)
				txt.y = y
				txt.textBaseline = 'alphabetic'
				txt.textAlign = 'center'
				stage.addChild(txt)
				hand.graphics.clear()

				isCircling = false
			}
			stage.update()
			angle = 2 * Math.PI * easeInOutCubic(t) + startAngle
			t += 0.004
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
		txt.text = ''
		stage.update()
	}}
	on:mouseup={() => {
		isDrawing = false
		calculateScore()
	}}
/>

<canvas bind:this={canvas} width="1000" height="1000" />

{#if !isStart}
	<div class="header">
		<h1>Can you draw a perfect circle?</h1>
	</div>
{/if}
{#if errMsg.length > 0}
	<p class="errMsg">{errMsg}</p>
{/if}
<div class="info"></div>

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
		background-color: rgb(255, 245, 234);
	}
	.errMsg {
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
</style>

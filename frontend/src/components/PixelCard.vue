<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  colors: { type: Array, default: () => ['#dbe8e7', '#b9d7d3', '#65aaa4'] },
  glowColor: { type: String, default: '#89bbb7' },
  gap: { type: Number, default: 9 },
  speed: { type: Number, default: 28 },
  pixelSize: { type: Number, default: 2 },
  introDelay: { type: Number, default: 0 },
})
const root = ref(null)
const canvas = ref(null)
let frame = 0
let resizeObserver
let pixels = []
let active = false
let pointer = { x: 0, y: 0 }
let pulse = null
let startedAt = 0
let reducedMotion = false

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((item) => item + item).join('') : value
  return [Number.parseInt(full.slice(0, 2), 16), Number.parseInt(full.slice(2, 4), 16), Number.parseInt(full.slice(4, 6), 16)]
}
function build() {
  if (!root.value || !canvas.value) return
  const rect = root.value.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.value.width = Math.max(1, Math.round(rect.width * ratio))
  canvas.value.height = Math.max(1, Math.round(rect.height * ratio))
  canvas.value.style.width = `${rect.width}px`
  canvas.value.style.height = `${rect.height}px`
  const columns = Math.ceil(rect.width / props.gap)
  const rows = Math.ceil(rect.height / props.gap)
  pixels = Array.from({ length: columns * rows }, (_, index) => ({
    x: (index % columns) * props.gap + props.gap / 2,
    y: Math.floor(index / columns) * props.gap + props.gap / 2,
    phase: Math.random() * Math.PI * 2,
    tone: hexToRgb(props.colors[Math.floor(Math.random() * props.colors.length)]),
  }))
}
function draw(time) {
  const context = canvas.value?.getContext('2d')
  const rect = root.value?.getBoundingClientRect()
  if (!context || !rect) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)
  const intro = Math.min(1, Math.max(0, (time - startedAt - props.introDelay) / 700))
  const strength = active ? 1 : intro * .38
  const glow = hexToRgb(props.glowColor)
  if (strength > .02) {
    const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180)
    gradient.addColorStop(0, `rgba(${glow.join(',')},${.12 * strength})`)
    gradient.addColorStop(1, `rgba(${glow.join(',')},0)`)
    context.fillStyle = gradient
    context.fillRect(0, 0, rect.width, rect.height)
  }
  pixels.forEach((pixel) => {
    const distance = Math.hypot(pixel.x - pointer.x, pixel.y - pointer.y)
    const spotlight = Math.max(0, 1 - distance / 155) * strength
    const ripple = pulse ? Math.max(0, 1 - Math.abs(distance - (time - pulse.time) * .32) / 34) : 0
    const twinkle = (Math.sin(time * (.001 + props.speed * .000012) + pixel.phase) + 1) / 2
    const alpha = (.05 + spotlight * .42 + ripple * .45) * (.65 + twinkle * .35)
    if (alpha < .035) return
    const size = props.pixelSize * (.5 + spotlight * .75 + ripple)
    context.fillStyle = `rgba(${pixel.tone.join(',')},${alpha})`
    context.fillRect(pixel.x - size / 2, pixel.y - size / 2, size, size)
  })
  if (pulse && time - pulse.time > 900) pulse = null
  if (!reducedMotion) frame = requestAnimationFrame(draw)
}
function move(event) {
  const rect = root.value.getBoundingClientRect()
  pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
}
function enter(event) { active = true; move(event) }
function leave() { active = false }
function click(event) { move(event); pulse = { time: performance.now() } }

onMounted(() => {
  const rect = root.value.getBoundingClientRect()
  pointer = { x: rect.width / 2, y: rect.height / 2 }
  startedAt = performance.now()
  reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  build()
  resizeObserver = new ResizeObserver(build)
  resizeObserver.observe(root.value)
  frame = requestAnimationFrame(draw)
})
onBeforeUnmount(() => { cancelAnimationFrame(frame); resizeObserver?.disconnect() })
</script>

<template>
  <article ref="root" class="light-pixel-card" tabindex="0" @pointerenter="enter" @pointermove="move" @pointerleave="leave" @click="click"><canvas ref="canvas"></canvas><div class="light-pixel-content"><slot /></div></article>
</template>

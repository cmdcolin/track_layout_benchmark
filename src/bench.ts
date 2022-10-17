import GranularRectLayout from './GranularRectLayout'

console.time('t1')
const layout = new GranularRectLayout()
for (let i = 0; i < 100000; i++) {
  const x1 = Math.floor(Math.random() * 2000)
  const x2 = x1 + 100
  layout.addRect(`${i}`, x1, x2, 1)
}

console.timeEnd('t1')

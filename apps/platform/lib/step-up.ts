let until = 0
export const isElevated = () => Date.now() < until
export const markElevated = () => {
  until = Date.now() + 5 * 60_000
}
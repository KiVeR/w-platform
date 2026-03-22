export function deptCodeFromPostcode(postcode: string): string {
  if (postcode.startsWith('97') || postcode.startsWith('98')) {
    return postcode.slice(0, 3)
  }
  if (postcode.startsWith('20')) {
    const num = Number(postcode)
    return num < 20200 ? '2A' : '2B'
  }
  return postcode.slice(0, 2)
}

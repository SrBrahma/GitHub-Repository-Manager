export function upperCaseFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function stringInsert(str: string, index: number, value: string) {
  return str.substr(0, index) + value + str.substr(index);
}
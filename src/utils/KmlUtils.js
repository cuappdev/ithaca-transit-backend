
import Location from '../models/Location';
import Stop from '../models/Stop';


const rotatedArray = (arr: Array, count: number): Array => {
  count -= arr.length * Math.floor(count / arr.length)
  arr.push.apply(arr, arr.splice(0, count))
  return arr
}

export default {
  rotatedArray
}
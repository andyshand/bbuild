const permutations = (name: string) => {

  const words = name.split(" ")
  const permutationsArr: string[] = []
  // camel case file name
  permutationsArr.push(words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)).join(""))
  // snake case file name
  permutationsArr.push(words.map(w => w.toLowerCase()).join("_"))
  // kebab case file name
  permutationsArr.push(words.map(w => w.toLowerCase()).join("-"))

  // anything else? maybe just the original name?
  permutationsArr.push(name)

  // name without spaces
  permutationsArr.push(name.replace(/ /g, ""))

  if (words.length > 1) {
    // Try just adding each word alone
    permutationsArr.push(...words.map(w => w.toLowerCase()))
  }

  // If more than 2 words, try permutations of combinations of 2 words
  // e.g. "foo bar baz" => "foo bar", "bar baz"
  if (words.length > 2) {
    for (let i = 0; i < words.length - 1; i++) {
      permutationsArr.push(...permutations(words.slice(i, i + 2).join(" ")))
    }
  }

  // If more than 3 words, try permutations of combinations of 3 words
  // e.g. "foo bar baz" => "foo bar baz", "bar baz", "foo bar"
  if (words.length > 3) {
    for (let i = 0; i < words.length - 2; i++) {
      permutationsArr.push(...permutations(words.slice(i, i + 3).join(" ")))
    }
  }

  if (name.toLowerCase() !== 'index') {
    // special case since lots of "index" files. probably shouldn't let that be a permutation
    return permutationsArr.filter(p => p.toLowerCase() !== 'index')
  }

  return permutationsArr
}

export default permutations
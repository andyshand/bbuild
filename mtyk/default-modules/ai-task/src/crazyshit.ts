import { uniq } from 'remeda'
import { readJSON, writeJSON } from './jsonStore'

interface Memory {
  task: string
  action: string
  confidence: number
  success: boolean
}

function getMemories(): Memory[] {
  return readJSON('memories').memories ?? []
}
function writeMemories(memories: Memory[]) {
  writeJSON('memories', { memories })
}

function addNewMemory(memory: Memory) {
  const curr = getMemories()
  writeMemories([...curr, memory])
}
function updateMemories(memories: Memory[]) {
  const curr = getMemories()
  writeMemories(
    curr.map(m => {
      const newMem = memories.find(n => n.task === m.task)
      if (newMem) {
        return newMem
      } else {
        return m
      }
    })
  )
}

function relatedMemories(task: string) {
  const memories = getMemories()
  const withSimilarity = memories.map(m => ({
    ...m,
    similarity: taskSimilarity(task, m.task),
  }))

  // Sort by similarity, descending
  const sorted = withSimilarity.sort((a, b) => b.similarity - a.similarity)
  return sorted
}

function taskSimilarity(taskA: string, taskB: string) {
  const splitter = (str: string) => str.split(' ')
  const wordsA = splitter(taskA)
  const wordsB = splitter(taskB)
  // const wordsASet = new Set(wordsA)
  const wordsBSet = new Set(wordsB)
  const wordsBoth = wordsA.filter(w => wordsBSet.has(w))
  const totalWords = uniq([...wordsA, ...wordsB])
  return wordsBoth.length / totalWords.length
}

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)

class TaskContext {
  usedMemories: Memory[] = []

  actions: string[]
  constructor(public readonly highLevelGoal: string) {}

  imbueWithContext(task: string) {}

  finish(successful?: boolean) {
    // Create a new memory for this, and update
    // the memories of the used memories
    const mem = this.usedMemories.map(m => ({
      ...m,
      confidence: m.confidence * clamp(successful ? 1.1 : 0.9, 0, 1),
    }))

    updateMemories(mem)
    addNewMemory({
      task: this.highLevelGoal,
      action: this.actions.join(', '),
      confidence: 1,
      success: successful ?? true,
    })
  }
}

async function Task(doX: string, ctx = new TaskContext(doX)) {
  const related = relatedMemories(doX)
  const relatedEnough = related.filter(m => m.similarity > 0.5)

  // const p = `I am a cyborg that can control computers with my mind.

  // My goal is to "Navigate to the project directory: ~/Github/divina"

  // For context, I know that:
  // - The project is located in ~/Github/divina
  // - I have opened the the terminal

  // I can remember completing a few similar tasks in the past:

  // Similar Task 1: "Navigate to project directory ~/Github/relay"
  // Actions taken: `cd ~/Github/relay`

  // I need to split up the steps to complete this goal as low-level and as granular as possible.

  // All steps should be formatted to result in a judgement being made. For example, "run yarn and verify it has ran successfully" or "run 'cat package.json' and check the 'name' field".

  // The steps are as follows:
  // 1.  Check current directory: `pwd`
  // 2.  Change directory to Github: `cd ~/Github`
  // 3.  List directory contents: `ls`
  // 4.  Change directory to divina: `cd divina`
  // 5.  Check current directory: `pwd`
  // 6.  Verify directory is correct: `echo $PWD``
}

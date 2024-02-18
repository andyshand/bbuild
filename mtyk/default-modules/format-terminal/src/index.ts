enum TerminalColor {
  Reset = '\x1b[0m',
  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',
}

export const colorize = {
  red: (text: string) => `${TerminalColor.Red}${text}${TerminalColor.Reset}`,
  green: (text: string) =>
    `${TerminalColor.Green}${text}${TerminalColor.Reset}`,
  yellow: (text: string) =>
    `${TerminalColor.Yellow}${text}${TerminalColor.Reset}`,
  blue: (text: string) => `${TerminalColor.Blue}${text}${TerminalColor.Reset}`,
  magenta: (text: string) =>
    `${TerminalColor.Magenta}${text}${TerminalColor.Reset}`,
  cyan: (text: string) => `${TerminalColor.Cyan}${text}${TerminalColor.Reset}`,
  white: (text: string) =>
    `${TerminalColor.White}${text}${TerminalColor.Reset}`,
}

export const bold = (text: string) => `\x1b[1m${text}${TerminalColor.Reset}`

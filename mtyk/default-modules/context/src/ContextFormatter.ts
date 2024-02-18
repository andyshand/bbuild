import { UniverseContextItem } from './UniverseEntityContextItem'

export abstract class ContextFormatter<
  T extends UniverseContextItem = UniverseContextItem
> {
  matcher: (item: T) => boolean

  abstract formatImpl(item: T): string

  format(item: T): string {
    if (!this.matcher(item)) {
      return ''
    }
    return this.formatImpl(item)
  }

  private static registry: ContextFormatter[] = []

  static addFormatter(formatter: ContextFormatter) {
    this.registry.push(formatter)
  }

  static removeFormatter(formatter: ContextFormatter) {
    const index = this.registry.indexOf(formatter)
    if (index > -1) {
      this.registry.splice(index, 1)
    }
  }

  static getFormatters(): ContextFormatter[] {
    return this.registry
  }

  static format<Z extends UniverseContextItem>(item: Z) {
    const formatters = this.getFormatters().filter((formatter) =>
      formatter.matcher(item)
    )
    // Use first formatter that matches
    if (formatters.length === 0) {
      return JSON.stringify(item, null, 2)
    }

    return formatters[0].format(item)
  }
}

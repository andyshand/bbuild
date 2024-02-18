import { globalDepContext, keyDep } from 'modules/deps'

import * as _assert from 'assert'
// import * as _punycode from "punycode"
import * as _buffer from 'buffer'
import * as _child_process from 'child_process'
import * as _cluster from 'cluster'
import * as _console from 'console'
import * as _constants from 'constants'
import * as _crypto from 'crypto'
import * as _dgram from 'dgram'
import * as _dns from 'dns'
import * as _fs from 'fs'
import * as _http from 'http'
import * as _https from 'https'
import * as _net from 'net'
import * as _os from 'os'
import * as _path from 'path'
// import * as _events from 'events';
import * as _querystring from 'querystring'
// import * as _module from 'module';
import * as _readline from 'readline'
import * as _repl from 'repl'
import * as _string_decoder from 'string_decoder'
import * as _timers from 'timers'
import * as _tls from 'tls'
import * as _tty from 'tty'
import * as _url from 'url'
import * as _util from 'util'
import * as _vm from 'vm'
// import * as _stream from 'stream';
import * as _async_hooks from 'async_hooks'
import * as _diagnostics_channel from 'diagnostics_channel'
import * as _fsPromises from 'fs/promises'
import * as _http2 from 'http2'
import * as _inspector from 'inspector'
import { DepType } from 'modules/deps/TokenDepSpec'
import * as _perf_hooks from 'perf_hooks'
import * as _process from 'process'
import * as _trace_events from 'trace_events'
import * as _v8 from 'v8'
import * as _worker_threads from 'worker_threads'
import * as _zlib from 'zlib'

const realMap = {
  fs: _fs,
  path: _path,
  url: _url,
  http: _http,
  https: _https,
  os: _os,
  assert: _assert,
  util: _util,
  // stream: _stream,
  zlib: _zlib,
  dns: _dns,
  net: _net,
  tls: _tls,
  crypto: _crypto,
  // events: _events,
  querystring: _querystring,
  child_process: _child_process,
  cluster: _cluster,
  // module: _module,
  readline: _readline,
  repl: _repl,
  string_decoder: _string_decoder,
  timers: _timers,
  tty: _tty,
  dgram: _dgram,
  v8: _v8,
  vm: _vm,
  console: _console,
  process: _process,
  // punycode: _punycode,
  buffer: _buffer,
  constants: _constants,
  worker_threads: _worker_threads,
  inspector: _inspector,
  trace_events: _trace_events,
  async_hooks: _async_hooks,
  perf_hooks: _perf_hooks,
  http2: _http2,
  fsPromises: _fsPromises,
  diagnostics_channel: _diagnostics_channel,
}

export type fs = typeof _fs
export type path = typeof _path
export type url = typeof _url
export type http = typeof _http
export type https = typeof _https
export type os = typeof _os
export type assert = typeof _assert
export type util = typeof _util
// export type stream = typeof _stream;
export type zlib = typeof _zlib
export type dns = typeof _dns
export type net = typeof _net
export type tls = typeof _tls
export type crypto = typeof _crypto
// export type events = typeof _events;
export type querystring = typeof _querystring
export type child_process = typeof _child_process
export type cluster = typeof _cluster
// export type module = typeof _module
export type readline = typeof _readline
export type repl = typeof _repl
export type string_decoder = typeof _string_decoder
export type timers = typeof _timers
export type tty = typeof _tty
export type dgram = typeof _dgram
export type v8 = typeof _v8
export type vm = typeof _vm
export type console = typeof _console
export type process = typeof _process
// export type punycode = typeof _punycode
export type buffer = typeof _buffer
export type constants = typeof _constants
export type worker_threads = typeof _worker_threads
export type inspector = typeof _inspector
export type trace_events = typeof _trace_events
export type async_hooks = typeof _async_hooks
export type perf_hooks = typeof _perf_hooks
export type http2 = typeof _http2
export type fsPromises = typeof _fsPromises
export type diagnostics_channel = typeof _diagnostics_channel

const nodeDep = <T>(name: string) => keyDep<T>(`node:${name}`)
export const fs = nodeDep<fs>('fs')
export const path = nodeDep<path>('path')
export const url = nodeDep<url>('url')
export const http = nodeDep<http>('http')
export const https = nodeDep<https>('https')
export const os = nodeDep<os>('os')
export const assert = nodeDep<assert>('assert')
export const util = nodeDep<util>('util')
export const zlib = nodeDep<zlib>('zlib')
export const dns = nodeDep<dns>('dns')
export const net = nodeDep<net>('net')
export const tls = nodeDep<tls>('tls')
export const crypto = nodeDep<crypto>('crypto')
export const querystring = nodeDep<querystring>('querystring')
export const child_process = nodeDep<child_process>('child_process')
export const cluster = nodeDep<cluster>('cluster')
// export const module = nodeDep<module>("module")
export const readline = nodeDep<readline>('readline')
export const repl = nodeDep<repl>('repl')
export const string_decoder = nodeDep<string_decoder>('string_decoder')
export const timers = nodeDep<timers>('timers')
export const tty = nodeDep<tty>('tty')
export const dgram = nodeDep<dgram>('dgram')
export const v8 = nodeDep<v8>('v8')
export const vm = nodeDep<vm>('vm')
export const console = nodeDep<console>('console')
export const process = nodeDep<process>('process')
export const buffer = nodeDep<buffer>('buffer')
export const constants = nodeDep<constants>('constants')
export const worker_threads = nodeDep<worker_threads>('worker_threads')
export const inspector = nodeDep<inspector>('inspector')
export const trace_events = nodeDep<trace_events>('trace_events')
export const async_hooks = nodeDep<async_hooks>('async_hooks')
export const perf_hooks = nodeDep<perf_hooks>('perf_hooks')
export const http2 = nodeDep<http2>('http2')
export const fsPromises = nodeDep<fsPromises>('fsPromises')
export const diagnostics_channel = nodeDep<diagnostics_channel>('diagnostics_channel')

for (const [k, v] of Object.entries({
  fs,
  path,
  url,
  http,
  https,
  os,
  assert,
  util,
  zlib,
  dns,
  net,
  tls,
  crypto,
  querystring,
  child_process,
  cluster,
  readline,
  repl,
  string_decoder,
  timers,
  tty,
  dgram,
  v8,
  vm,
  console,
  process,
  buffer,
  constants,
  worker_threads,
  inspector,
  trace_events,
  async_hooks,
  perf_hooks,
  http2,
  fsPromises,
  diagnostics_channel,
})) {
  const real = realMap[k]
  const v2 = v
  if (!real) {
    throw new Error('Missing real for ' + k)
  } else {
    globalDepContext.add2(v2 as any as DepType, real)
  }
}

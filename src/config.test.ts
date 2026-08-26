import { describe, it, expect } from 'vitest'
import config from '../next.config'

describe('next config', () => {
  it('rewrites the root to the generated brief', async () => {
    const rewrites = await config.rewrites!()
    expect(rewrites).toEqual(
      expect.arrayContaining([
        { source: '/', destination: '/brief.html' },
        { source: '/brief', destination: '/brief.html' },
      ]),
    )
  })

  it('sends a noindex header for every path', async () => {
    const headers = await config.headers!()
    const all = headers.find((h) => h.source === '/:path*')
    expect(all?.headers).toEqual(
      expect.arrayContaining([
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ]),
    )
  })
})

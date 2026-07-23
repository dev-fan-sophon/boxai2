/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { describe, expect, it } from 'vitest'

import { generatedMediaExtension } from './download-generated-media'

describe('generatedMediaExtension', () => {
  it.each([
    ['video/quicktime', 'video', 'mov'],
    ['video/webm', 'video', 'webm'],
    ['audio/webm', 'audio', 'webm'],
    ['audio/mp4', 'audio', 'm4a'],
    ['audio/m4a', 'audio', 'm4a'],
    ['application/octet-stream', 'image', 'png'],
    ['', 'video', 'mp4'],
  ] as const)('maps %s %s to .%s', (mimeType, kind, extension) => {
    expect(generatedMediaExtension(mimeType, kind)).toBe(extension)
  })
})

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { downloadCsv } from '@/utils/exportCsv'

const mockClick = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateObjectURL.mockReturnValue('blob:mock-url')

  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  })

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLElement
    }
    return document.createElement(tag)
  })
})

describe('downloadCsv', () => {
  test('cree un Blob avec BOM UTF-8', () => {
    const BlobSpy = vi.spyOn(globalThis, 'Blob')
    downloadCsv('test.csv', ['Col1', 'Col2'], [['val1', 'val2']])
    expect(BlobSpy).toHaveBeenCalledWith(
      [expect.stringContaining('\uFEFF')],
      { type: 'text/csv;charset=utf-8;' },
    )
  })

  test('utilise le separateur point-virgule', () => {
    const BlobSpy = vi.spyOn(globalThis, 'Blob')
    downloadCsv('test.csv', ['Slug', 'URL'], [['promo', 'https://example.com']])
    const content: string = BlobSpy.mock.calls[0][0][0]
    expect(content).toContain('Slug;URL')
    expect(content).toContain('promo;https://example.com')
  })

  test('cree un lien et declenche le click', () => {
    downloadCsv('export.csv', ['H1'], [['v1']])
    expect(mockCreateObjectURL).toHaveBeenCalledOnce()
    expect(mockClick).toHaveBeenCalledOnce()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  test('utilise le nom de fichier fourni', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    downloadCsv('my-file.csv', ['H1'], [['v1']])
    const link = createElementSpy.mock.results[0].value as { download: string }
    expect(link.download).toBe('my-file.csv')
  })

  test('genere plusieurs lignes pour plusieurs rows', () => {
    const BlobSpy = vi.spyOn(globalThis, 'Blob')
    downloadCsv('test.csv', ['A', 'B'], [['1', '2'], ['3', '4']])
    const content: string = BlobSpy.mock.calls[0][0][0]
    const lines = content.replace('\uFEFF', '').split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('A;B')
    expect(lines[1]).toBe('1;2')
    expect(lines[2]).toBe('3;4')
  })
})

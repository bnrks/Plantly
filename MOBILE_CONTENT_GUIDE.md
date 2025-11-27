# Plantly - Mobil İçerik Render Rehberi

## Firestore Yapısı

Koleksiyon: `modules`

```typescript
interface LearningModule {
  id: string;              // Document ID
  module_name: string;     // Başlık
  content: JSONContent;    // TipTap JSON
  banner_link?: string;    // Banner URL
}
```

## Content JSON Yapısı

TipTap editör çıktısı. Root her zaman `type: "doc"`:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Normal metin" },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "kalın" }
      ]
    }
  ]
}
```

## Node Tipleri

| Type | Attrs | Açıklama |
|------|-------|----------|
| `doc` | - | Root container |
| `paragraph` | - | Paragraf |
| `heading` | `level: 1-6` | Başlık |
| `bulletList` | - | Sırasız liste |
| `orderedList` | - | Sıralı liste |
| `listItem` | - | Liste öğesi (içinde paragraph var) |
| `blockquote` | - | Alıntı (içinde paragraph var) |
| `image` | `src, alt, title` | Resim |
| `hardBreak` | - | Satır sonu |

## Text Marks

Text node'larında `marks` array'i:

| Mark | Attrs | 
|------|-------|
| `bold` | - |
| `italic` | - |
| `link` | `href, target` |

Bir text'te birden fazla mark olabilir.

## Render Mantığı

```
renderNode(node):
  if node.type == "doc" veya liste/blockquote:
    -> children'ları recursive render et
  
  if node.type == "paragraph" veya "heading":
    -> inline content'i (text'leri) render et
  
  if node.type == "text":
    -> marks varsa uygula (bold, italic, link)
    -> text'i döndür
  
  if node.type == "image":
    -> node.attrs.src ile resim göster
```

## Örnek Veri

```json
{
  "id": "abc123",
  "module_name": "Bitki Bakımı",
  "banner_link": "https://firebasestorage.googleapis.com/.../banner.jpg",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Giriş" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Bu bir " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "önemli" },
          { "type": "text", "text": " konudur." }
        ]
      },
      {
        "type": "bulletList",
        "content": [
          {
            "type": "listItem",
            "content": [
              { "type": "paragraph", "content": [{ "type": "text", "text": "Madde 1" }] }
            ]
          }
        ]
      },
      {
        "type": "image",
        "attrs": { "src": "https://..." }
      }
    ]
  }
}
```

## Notlar

- `content` boş olabilir, null check yap
- `listItem` ve `blockquote` içinde `paragraph` var, recursive render gerekli
- Resimler Firebase Storage'dan geliyor, cache'le

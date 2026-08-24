# Question types ↔ web controls

Maps SurveyJS question types to the standard widgets found in web component libraries
(Bootstrap, MUI, Ant Design, shadcn/ui, Kendo, DevExtreme, …). Use this table to:

- translate a brandbook's per-control specs ("inputs", "selects", "sliders") into the
  SurveyJS question types they affect;
- find the styling entry points for a specific widget.

The **Styling reference** column links to per-control files with verified selectors,
`--sjs2-*` token chains, spacings, borders, and focus/hover states. Styles shared by
all question types (title, description, input surface, question spacing, error box,
focus ring) are in [controls/_shared.md](controls/_shared.md) — read it first.

## Text inputs

| Question type | Web-control analog | Styling reference |
| :-- | :-- | :-- |
| `text` | Single-line input. Via `inputType` covers the HTML input family: text, number, email, password, url, tel, date, datetime-local, time, month, week, color, range | [controls/text.md](controls/text.md) |
| `comment` | Multi-line textarea | [controls/comment.md](controls/comment.md) |
| `multipletext` | Group of labeled inputs (form group) | [controls/multipletext.md](controls/multipletext.md) |

## Dropdowns / selects

| Question type | Web-control analog | Styling reference |
| :-- | :-- | :-- |
| `dropdown` | Select / combobox with search & autocomplete | [controls/dropdown.md](controls/dropdown.md) |
| `tagbox` | Multi-select with tags (tag box / chips input) | [controls/tagbox.md](controls/tagbox.md) |

## Choice controls

| Question type | Web-control analog | Styling reference |
| :-- | :-- | :-- |
| `radiogroup` | Radio button group | [controls/radiogroup.md](controls/radiogroup.md) |
| `checkbox` | Checkbox group | [controls/checkbox.md](controls/checkbox.md) |
| `boolean` | Toggle switch / single checkbox (multiple render modes) | [controls/boolean.md](controls/boolean.md) |
| `buttongroup` | Segmented / toggle button group | [controls/buttongroup.md](controls/buttongroup.md) |
| `imagepicker` | Image-based radio/checkbox group (card selection) | [controls/imagepicker.md](controls/imagepicker.md) |

## Ranges & scales

| Question type | Web-control analog | Styling reference |
| :-- | :-- | :-- |
| `slider` | Range slider (single value or range) | [controls/slider.md](controls/slider.md) |
| `rating` | Rating scale / star rating (labels, stars, smileys render modes) | [controls/rating.md](controls/rating.md) |

## Other standard widgets

| Question type | Web-control analog | Styling reference |
| :-- | :-- | :-- |
| `file` | File upload / drop zone | [controls/file.md](controls/file.md) |
| `signaturepad` | Signature / canvas drawing pad | [controls/signaturepad.md](controls/signaturepad.md) |
| `ranking` | Sortable drag-and-drop list | [controls/ranking.md](controls/ranking.md) |

## Composite / SurveyJS-specific (no single-widget analog)

| Question type | Closest concept | Styling reference |
| :-- | :-- | :-- |
| `matrix` | Radio matrix / Likert table | [controls/matrix.md](controls/matrix.md) |
| `matrixdropdown` | Editable grid with fixed rows | [controls/matrixdropdown.md](controls/matrixdropdown.md) |
| `matrixdynamic` | Editable data grid with add/remove rows | [controls/matrixdynamic.md](controls/matrixdynamic.md) |
| `paneldynamic` | Repeating form section | [controls/paneldynamic.md](controls/paneldynamic.md) |
| `html`, `image`, `expression` | Read-only display content | [controls/display-content.md](controls/display-content.md) |
| `imagemap` | Clickable image regions | [controls/display-content.md](controls/display-content.md) |

## Shared surfaces (affect every control)

Question title & description typography, the shared input surface (`.sd-formbox` — note:
there is no `.sd-input` in current markup), question card padding and gaps, error box,
and the a11y focus ring are documented in [controls/_shared.md](controls/_shared.md).

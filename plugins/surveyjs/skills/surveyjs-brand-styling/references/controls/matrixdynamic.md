# `matrixdynamic` — editable grid (add/remove rows)

Web analog: editable data grid with row CRUD.
Table + cell editors: same as [matrixdropdown.md](matrixdropdown.md). Shared surfaces: [_shared.md](_shared.md).

SCSS: `blocks/sd-matrixdynamic.scss` + `blocks/sd-table.scss`. Markup: `survey-react-ui/src/reactquestion_matrixdynamic.tsx`.

## Dynamic-row specific

| Aspect | Selector | Values |
| :-- | :-- | :-- |
| Add-row button | `.sd-matrixdynamic__add-btn` | class `sd-matrixdynamic__btn`; sticky left, z-index 12; visuals inherit shared action styles (`blocks/sd-action.scss`) |
| Remove-row button | `sd-action--negative sd-matrixdynamic__remove-btn` | negative action token family |
| Footer | `.sd-matrixdynamic__footer` | padding-top `--sjs2-spacing-x200`; mobile separator line `--sjs2-color-border-basic-secondary` |
| Drag handle | drag block | padding `--sjs2-spacing-x200`, hover bg `--sjs2-color-bg-basic-primary`; grip bar 1px `--sjs2-color-component-input-default-line`, radius 1.25×base |
| Drag icon | `.sd-drag-element__svg` | size `--sjs2-size-x300`, hidden until `.sd-table__row:hover`; fill `--sjs2-color-component-action-brand-tertiary-default-icon` |
| Drag cell | `.sd-table__cell--drag > div` | bg `--sjs2-color-component-panel-default-bg`, min-height `--sjs2-size-x600` |
| Row animations | legacy vars w/ fallbacks | `--sjs-matrix-row-fade-in-duration` (250ms), `-move-in` (150ms), `-fade-out` (100ms), `-move-out` (250ms), `--sjs-matrix-detail-row-*` |

Row hover only reveals the drag icon — no row background hover.

## Brand override recipe

Add/remove buttons follow the action token families
(`--sjs2-color-component-action-*`); grid text/selection as in [matrix.md](matrix.md).

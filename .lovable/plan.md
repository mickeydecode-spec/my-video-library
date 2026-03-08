

# Remove Layout/View Section from Sidebar

## Change

### `src/components/Sidebar.tsx`
- Remove the "View Mode" section (lines 48-67) containing the Grid/List/Compact toggle buttons
- Remove `layout` and `onLayoutChange` from the props interface
- Remove the `layoutOptions` constant and unused imports (`Grid3X3`, `LayoutList`, `Rows3`, `LayoutMode`)

### `src/pages/Index.tsx`
- Remove `layout={layout}` and `onLayoutChange={setLayout}` props from the `<Sidebar>` component call


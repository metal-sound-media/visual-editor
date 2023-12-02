<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blocks test</title>
  <script type='module' defer>
    import {
      EN,
      VisualEditor,
      registerBlocks,
    } from '/dist/VisualEditor.standalone.js'

    const editor = new VisualEditor({ lang: EN })
    registerBlocks(editor)
    editor.defineElement()
  </script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; font-family: sans-serif; }
  </style>
</head>
<body>
<visual-editor
  name="content"
  preview="http://localhost:8000/server/preview-twig.php"
  iconsUrl="/icons/[name].svg"
  id="editor1"
  value=""
></visual-editor>
</body>
</html>

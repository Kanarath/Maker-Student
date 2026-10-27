# Servidor estático mínimo para probar la app en local (no hace falta Node ni Python).
# Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Root <carpeta> -Port 8123
param([string]$Root = '.', [int]$Port = 8123)
$Root = (Resolve-Path $Root).Path
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Sirviendo $Root en http://localhost:$Port/  (Ctrl+C para parar)"
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.png'='image/png'; '.webp'='image/webp'; '.svg'='image/svg+xml'; '.json'='application/json'; '.webmanifest'='application/manifest+json' }
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.LocalPath).TrimStart('/'); if ($p -eq '') { $p = 'index.html' }
  $f = Join-Path $Root $p
  if ((Test-Path $f -PathType Leaf) -and ((Resolve-Path $f).Path.StartsWith($Root))) {
    $b = [IO.File]::ReadAllBytes($f)
    $ct = $types[[IO.Path]::GetExtension($f)]; if ($ct) { $c.Response.ContentType = $ct }
    $c.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}

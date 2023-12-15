# inicializar

```bash
cd baelys0.1/
node .
```

## crear una sesion

- generar un metodo post a 144.90.81.211:20000/createCarpet

```json
body:
{
    "carpeta":"<nombre de la sesion a crear>"
}
```

## inicializar todas las sesiones

GET 144.90.81.211:20000/run esto pondrá en marcha todas las sesiones.

y devolverá un json con las url,
ejemplo:

```json
{
    "message": "Operación exitosa. El proceso está en ejecución.",
    "servidores": [
        {
            "carpeta": "nombre",
            "url": "http://localhost:30000"
        },
        {
            "carpeta": "nombre",
            "url": "http://localhost:30001"
        }
    ]
}
```

visitas la direccion de cada sesion /get-qr para escanear.

eso inicia una sesion

copias la url para generar una bandeja de entrada en chatwoot.

y a testear
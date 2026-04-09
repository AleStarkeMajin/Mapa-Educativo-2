import { NodeType, NodeStatus } from "./types";
import type { MindMapNode } from "./types";

export const INITIAL_NODES: MindMapNode[] = [
  // ROOT
  {
    id: "python-root",
    parentId: null,
    label: "Programación en Python",
    description:
      "Ruta completa de aprendizaje desde fundamentos hasta ciencia de datos y desarrollo web.",
    type: NodeType.PARENT,
    status: NodeStatus.IN_PROGRESS,
    prerequisites: [],
  },

  // 1. CONCEPTOS BASICOS
  {
    id: "basicos",
    parentId: "python-root",
    label: "Conceptos Básicos",
    description: "Fundamentos de la algoritmia y lógica de programación.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: [],
  },
  {
    id: "basicos-secuencia",
    parentId: "basicos",
    label: "Secuencia",
    description: "Orden de ejecución de las instrucciones.",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    prerequisites: [],
    content: `La secuencia es el pilar fundamental de la programación. Se refiere al orden en que el computador lee y ejecuta las instrucciones: de arriba hacia abajo, una por una.

¿Por qué importa?
Imagina una receta: si primero horneas la masa y luego mezclas los ingredientes, el resultado será un desastre. En código, el orden determina la lógica.

Ejemplo en Python:
paso1 = "Mezclar ingredientes"
paso2 = "Hornear"
print(paso1)
print(paso2)

[RETO] Ejercicio Práctico:
Dadas las siguientes líneas, ¿cuál sería el resultado correcto si queremos imprimir un saludo coherente?
A) print(nombre)
B) nombre = "Pythonista"

[SOLUCION]
La respuesta correcta es B seguido de A.

Explicación Paso a Paso:
1. Primero debemos ASIGNAR el valor a la variable (nombre = "Pythonista"). En este punto, la memoria del computador guarda el nombre.
2. Luego podemos USAR la variable (print(nombre)).
Si lo haces al revés, Python lanzará un NameError porque intentas imprimir algo que el computador aún no conoce.
[/SOLUCION]`,
  },
  {
    id: "basicos-algoritmo",
    parentId: "basicos",
    label: "Algoritmo",
    description: "Definición y pasos lógicos para resolver problemas.",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    prerequisites: ["basicos-secuencia"],
    content: `Un algoritmo es una serie de pasos finitos, precisos y definidos para resolver un problema o realizar una tarea.

Características de un buen algoritmo:
1. Finito: Debe terminar en algún momento.
2. Definido: Si se sigue dos veces con la misma entrada, el resultado debe ser igual.
3. Preciso: Cada paso debe ser claro.

[RETO] Ejercicio Práctico:
Escribe un algoritmo (en lenguaje natural o código) para determinar si un número es mayor que 10.

[SOLUCION]
Algoritmo:
1. Recibir el número (ej: n = 15).
2. Comparar: ¿Es n > 10?
3. Si es verdad, mostrar "Es mayor".
4. Si es falso, mostrar "No es mayor".

En Python:
numero = 15
if numero > 10:
    print("Es mayor")
else:
    print("No es mayor")
[/SOLUCION]`,
  },
  {
    id: "basicos-pseudocodigo",
    parentId: "basicos",
    label: "Pseudocódigo",
    description: "Lenguaje intermedio entre humano y máquina.",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    prerequisites: ["basicos-algoritmo"],
    content: `El pseudocódigo es una forma de escribir algoritmos usando una mezcla de lenguaje natural y convenciones de programación. No tiene reglas sintácticas estrictas, lo que permite enfocarse en la LOGICA antes que en la sintaxis de un lenguaje como Python.

Ejemplo:
Inicio
  Leer edad
  Si edad >= 18 entonces
    Mostrar "Puedes votar"
  Sino
    Mostrar "No puedes votar"
Fin

Buenas Prácticas:
- Usa verbos de acción (Leer, Calcular, Mostrar).
- Indenta (deja espacios) para mostrar qué está dentro de qué.`,
  },

  // 4. VARIABLES
  {
    id: "variables",
    parentId: "python-root",
    label: "Variables",
    description: "Almacenamiento y tipos de datos en memoria.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: ["basicos"],
  },
  {
    id: "variables-def",
    parentId: "variables",
    label: "Definición",
    description: "Qué es una variable y cómo se asigna.",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    prerequisites: [],
    content: `En Python, una variable es como una etiqueta que pegamos a un espacio de la memoria donde guardamos un dato.

Reglas de Oro:
1. El nombre debe empezar con letra o guion bajo (_).
2. No puede empezar con números.
3. Solo contiene caracteres alfanuméricos y guiones bajos.

Código de ejemplo:
# Asignación simple
nombre = "Alice"
edad = 25
es_estudiante = True

# Python permite asignación múltiple
x, y, z = 1, 2, 3

[RETO] Ejercicio:
¿Cuál de estos nombres de variable es INVALIDO en Python?
A) mi_variable
B) 2_valor
C) _secreto
D) nombreCompleto

[SOLUCION]
El nombre B (2_valor) es inválido.

Explicación:
En Python, los nombres de variables NO pueden comenzar con un número. Pueden contener números (como valor_2), pero el primer carácter debe ser una letra o un guion bajo. Esto ayuda al intérprete de Python a diferenciar rápidamente entre números literales y nombres de variables.
[/SOLUCION]`,
  },
  {
    id: "variables-tipos",
    parentId: "variables",
    label: "Tipos de Datos",
    description: "Tipos de datos primitivos y objetos.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: ["variables-def"],
  },
  {
    id: "tipo-numeros",
    parentId: "variables-tipos",
    label: "Números",
    description: "Int, float y números complejos.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: [],
    content: `Python maneja tres tipos principales de números:

1. int: Números enteros (sin decimales). Ej: 10, -5, 0.
2. float: Números reales (con punto decimal). Ej: 3.14, 2.0.
3. complex: Números complejos (con parte imaginaria 'j'). Ej: 2 + 3j.

Operaciones Básicas:
suma = 10 + 5
potencia = 2 ** 3  # Resultado: 8
division_entera = 10 // 3 # Resultado: 3

[RETO] Ejercicio de Lógica:
Calcula el área de un círculo de radio 5. (Fórmula: pi * r^2). Usa pi = 3.1416.

[SOLUCION]
pi = 3.1416
radio = 5
area = pi * (radio ** 2)
print(area)

Explicación:
1. Definimos la constante pi.
2. Definimos el radio.
3. Usamos el operador de potencia ** para elevar el radio al cuadrado.
4. Multiplicamos los resultados. El resultado final será un 'float' (78.54).
[/SOLUCION]`,
  },
  {
    id: "tipo-iterables",
    parentId: "variables-tipos",
    label: "Objetos iterables",
    description: "Listas, tuplas, diccionarios y conjuntos.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: ["tipo-numeros"],
    content: `Los iterables son colecciones de datos que podemos recorrer uno por uno.

1. Listas []: Mutables (se pueden cambiar) y ordenadas.
2. Tuplas (): Inmutables (no cambian) y rápidas.
3. Diccionarios {k:v}: Colecciones de clave-valor.
4. Sets {}: Elementos únicos y sin orden.

Ejemplo de Código:
mi_lista = ["Python", "Java", "C++"]
mi_lista.append("JavaScript")

mi_diccionario = {"nombre": "Nexus", "version": 2.5}

[RETO] Ejercicio:
Crea una lista de 5 frutas y luego reemplaza la segunda fruta por "Mango". Finalmente, añade "Kiwi" al final.

[SOLUCION]
frutas = ["Manzana", "Pera", "Uva", "Sandía", "Melón"]
frutas[1] = "Mango"  # El índice 1 es el segundo elemento
frutas.append("Kiwi")
print(frutas)

Explicación:
- Las listas en Python empiezan en el índice 0. Por eso la "segunda" fruta está en frutas[1].
- El método .append() siempre agrega el elemento al final de la estructura actual.
[/SOLUCION]`,
  },

  // 6. FLUJO DE CODIGO
  {
    id: "flujo-codigo",
    parentId: "python-root",
    label: "Flujo de código",
    description: "Control de ejecución mediante saltos y ciclos.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: ["variables"],
  },
  {
    id: "flujo-condicionales",
    parentId: "flujo-codigo",
    label: "Condicionales",
    description: "Toma de decisiones con IF, ELSE y MATCH.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: [],
    content: `Las condicionales permiten que tu programa tome caminos distintos según los datos.

Estructura IF-ELIF-ELSE:
puntuacion = 85

if puntuacion >= 90:
    print("Excelente")
elif puntuacion >= 70:
    print("Aprobado")
else:
    print("Reprobado")

Nota sobre MATCH (Python 3.10+):
Es similar al 'switch' de otros lenguajes:
status = 404
match status:
    case 200: print("OK")
    case 404: print("Not Found")
    case _: print("Error desconocido")

[RETO] Ejercicio:
Escribe un código que pida un número y diga si es PAR o IMPAR. (Tip: Usa el operador residuo %).

[SOLUCION]
numero = 7 # Puedes usar int(input()) para probar
if numero % 2 == 0:
    print("Es PAR")
else:
    print("Es IMPAR")

Explicación:
El operador módulo (%) devuelve el resto de una división. Si un número dividido por 2 deja un resto de 0, significa que es par. De lo contrario, es impar.
[/SOLUCION]`,
  },

  // 8. FUNCIONES
  {
    id: "funciones",
    parentId: "python-root",
    label: "Funciones",
    description: "Reutilización de código y modularidad.",
    type: NodeType.PARENT,
    status: NodeStatus.TODO,
    prerequisites: ["flujo-codigo"],
  },
  {
    id: "funciones-def",
    parentId: "funciones",
    label: "Definición de Funciones",
    description: "Sintaxis básica de DEF.",
    type: NodeType.CHILD,
    status: NodeStatus.TODO,
    prerequisites: [],
    content: `Una función es un bloque de código que solo se ejecuta cuando es llamado. Puedes pasarle datos (parámetros) y puede devolver datos (return).

Sintaxis:
def mi_funcion(nombre):
    return f"Hola, {nombre}!"

# Llamando a la función
mensaje = mi_funcion("Aprendiz")
print(mensaje)

Buenas Prácticas:
- Cada función debe hacer UNA sola cosa (Principio de Responsabilidad Única).
- Usa nombres descriptivos en minúsculas separados por guiones bajos.

[RETO] Ejercicio:
Crea una función llamada 'calcular_iva' que reciba un precio y devuelva el precio con un 21% de IVA añadido.

[SOLUCION]
def calcular_iva(precio):
    total = precio * 1.21
    return total

# Prueba
print(calcular_iva(100)) # Debería imprimir 121.0

Explicación:
1. Definimos la función con un parámetro 'precio'.
2. Multiplicamos por 1.21 (que equivale a sumar el 21%).
3. Usamos 'return' para que el valor pueda ser usado fuera de la función.
[/SOLUCION]`,
  },
];

export const STATUS_COLORS = {
  [NodeStatus.TODO]: "#94a3b8",
  [NodeStatus.IN_PROGRESS]: "#f59e0b",
  [NodeStatus.COMPLETED]: "#10b981",
};

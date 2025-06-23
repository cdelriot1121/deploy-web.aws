require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

// Puerto en el que se ejecutará el servidor
const port = process.env.PORT || 3000;

// Probar la conexión a la base de datos
pool.connect()
    .then(() => console.log('Conectado a la base de datos PostgreSQL.'))
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err);
        process.exit(1);
    });

// Iniciar la base de datos
async function initDatabase() {
    try {
        // Creación de la tabla "tasks" si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                priority VARCHAR(5) CHECK (priority IN ('baja', 'media', 'alta')) DEFAULT 'media',
                category VARCHAR(100),
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
}

// Inicializar la base de datos al iniciar la aplicación
initDatabase();

// Obtener todas las tareas
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY due_date ASC NULLS LAST, priority DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener tareas:', err);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// Obtener una tarea por ID
app.get('/tasks/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener tarea:', err);
        res.status(500).json({ error: 'Error al obtener tarea' });
    }
});

// Crear una nueva tarea
app.post('/tasks', async (req, res) => {
    const { title, description, due_date, priority, category } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'El título de la tarea es requerido.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, due_date, priority, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description || null, due_date || null, priority || 'media', category || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al agregar tarea:', err);
        res.status(500).json({ error: 'Error al agregar tarea' });
    }
});

// Actualizar una tarea
app.put('/tasks/:id', async (req, res) => {
    const id = req.params.id;
    const { title, description, due_date, priority, category, completed } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'El título de la tarea es requerido.' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE tasks SET title = $1, description = $2, due_date = $3, priority = $4, category = $5, completed = $6 WHERE id = $7 RETURNING *',
            [title, description || null, due_date || null, priority || 'media', category || null, completed || false, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar tarea:', err);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// Cambiar el estado de una tarea
app.patch('/tasks/:id/toggle', async (req, res) => {
    const id = req.params.id;
    
    try {
        const checkResult = await pool.query('SELECT completed FROM tasks WHERE id = $1', [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        const newState = !checkResult.rows[0].completed;
        
        await pool.query('UPDATE tasks SET completed = $1 WHERE id = $2', [newState, id]);
        
        res.json({ id, completed: newState });
    } catch (err) {
        console.error('Error al actualizar estado de tarea:', err);
        res.status(500).json({ error: 'Error al actualizar estado de tarea' });
    }
});

// Eliminar una tarea
app.delete('/tasks/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.status(200).json({ message: 'Tarea eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
